import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Cpu,
  Radio,
  Sparkles,
  Wrench,
} from 'lucide-react';
import {
  FixLeakMiniGame,
  LeakGameResult,
} from '../components/FixLeakMiniGame';
import { Level3Hud } from '../components/Level3Hud';
import {
  LandingGameResult,
  MarsLandingMiniGame,
} from '../components/MarsLandingMiniGame';
import {
  MarsHotspot,
  MarsSurfaceViewport,
} from '../components/MarsSurfaceViewport';
import { SciFiButton } from '../components/SciFiButton';
import { AudioManager } from '../game/audioManager';
import { BackendClient } from '../game/backendClient';
import {
  FINALE_PRIORITIES,
  LEVEL3_PARTS,
  LEVEL3_STEPS,
  Level3ChoiceSpec,
} from '../game/level3Data';
import { SaveManager } from '../game/saveManager';
import {
  CadetProfile,
  Level2ChoiceLog,
  Level3PriorityId,
  ResourceKey,
  ReyesExpression,
} from '../game/types';
import { Level3CheckpointScreen } from './Level3CheckpointScreen';
import { Level3Complete } from './Level3Complete';
import { MarsFinaleRanking } from './MarsFinaleRanking';

interface Level3MarsMainProps {
  initialProfile: CadetProfile;
  onQuitToMenu: () => void;
}

const HOTSPOTS_BY_STEP: Record<number, MarsHotspot> = {
  1: { x: 37, y: 58, label: 'Landing Beacon' },
  3: { x: 42, y: 61, label: 'Lander Leg Pads' },
  4: { x: 52, y: 60, label: 'O2 Habitat Airlock' },
  5: { x: 70, y: 64, label: 'Greenhouse Dome' },
  6: { x: 45, y: 63, label: 'Dome Foundation' },
  7: { x: 31, y: 58, label: 'Solar Array Bus' },
  8: { x: 56, y: 60, label: 'CO2 Scrubber Vent' },
  9: { x: 71, y: 63, label: 'Hydroponic Bay' },
  11: { x: 64, y: 65, label: 'Habitat Armor Seam' },
  12: { x: 32, y: 59, label: 'Dusty Solar Panels' },
  13: { x: 54, y: 61, label: 'Water & O2 Valve' },
  14: { x: 70, y: 64, label: 'Plant Bay Hatch' },
  15: { x: 39, y: 67, label: 'Mars Rover Site' },
  16: { x: 33, y: 60, label: 'Main Power Grid' },
};

function clampMeter(v: number): number {
  return Math.max(0, Math.min(100, v));
}

function computePartOrFinalStars(profile: CadetProfile): number {
  const r = profile.resources;
  const core = [
    r.oxygen,
    r.water,
    r.food,
    r.power,
    r.fuel,
    r.shield,
    r.suit,
    r.thermal,
    r.health,
  ];
  const above65 = core.filter((v) => v >= 65).length;
  const avg = core.reduce((a, b) => a + b, 0) / core.length;
  const sproutEffective = Math.round((r.food + r.sproutHealth) / 2);

  if (above65 >= 6 && avg >= 68 && sproutEffective >= 60 && r.morale >= 55) {
    return 3;
  }
  if (r.health > 25 && r.oxygen > 25 && avg >= 45) {
    return 2;
  }
  return 1;
}

export const Level3MarsMain: React.FC<Level3MarsMainProps> = ({
  initialProfile,
  onQuitToMenu,
}) => {
  const [profile, setProfile] = useState<CadetProfile>(initialProfile);

  // 'story_start' | 'part_title' | 'step' | 'lesson' | 'checkpoint' | 'complete'
  const [stage, setStage] = useState<
    | 'story_start'
    | 'part_title'
    | 'step'
    | 'lesson'
    | 'checkpoint'
    | 'complete'
  >('story_start');
  // Inside choice steps: 'explore' announces the issue & lets user walk/ask to solve; 'decision' opens compact options
  const [stepPhase, setStepPhase] = useState<'explore' | 'decision'>('explore');

  const [activePart, setActivePart] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [checkpointPart, setCheckpointPart] = useState<1 | 2 | 3 | 4>(1);
  const [lessonText, setLessonText] = useState('');
  const [chosenSummary, setChosenSummary] = useState('');
  const [motionState, setMotionState] = useState<'none' | 'shake'>('none');

  // Track explorer position for hotspot proximity
  const [explorerPos, setExplorerPos] = useState({ x: 45, y: 71 });

  // Live NASA / backend Mars weather telemetry for ARIA status box
  const [backendAriaLine, setBackendAriaLine] = useState<string>('');

  // Commander Reyes HUD state
  const [dialogueText, setDialogueText] = useState('');
  const [expression, setExpression] = useState<ReyesExpression>('normal');
  const [showNext, setShowNext] = useState(false);
  const [nextAction, setNextAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    let active = true;
    void BackendClient.fetchMissionData().then((data) => {
      const m = data?.level3_mars;
      if (!active || !m) return;
      const zone = m.landingZone || 'Jezero Crater';
      const temp = m.surfaceTempCelsius ?? -62;
      const wind = m.windSpeedMs ?? 12.4;
      setBackendAriaLine(
        `ARIA Live (${zone}): ${temp}°C · Wind ${wind} m/s`
      );
    });
    return () => {
      active = false;
    };
  }, []);

  const persistProfile = useCallback((updated: CadetProfile) => {
    setProfile(updated);
    SaveManager.saveUserProgress(updated.username, updated);
  }, []);

  const say = useCallback(
    (
      text: string,
      expr: ReyesExpression,
      withNext: boolean,
      onDone?: () => void
    ) => {
      setDialogueText(text);
      setExpression(expr);
      setShowNext(withNext);
      setNextAction(() => onDone ?? null);
    },
    []
  );

  const enterPartTitle = useCallback(
    (part: 1 | 2 | 3 | 4) => {
      const meta = LEVEL3_PARTS[part];
      setActivePart(part);
      setStage('part_title');
      say(meta.reyesLine, meta.reyesExpr, false);
    },
    [say]
  );

  const enterStep = useCallback(
    (stepIdx: number) => {
      const stepSpec = LEVEL3_STEPS[stepIdx - 1];
      if (!stepSpec) return;

      setActivePart(stepSpec.part);
      setStage('step');
      setStepPhase('explore');

      if (stepSpec.kind === 'choice') {
        if (stepIdx === 12) {
          AudioManager.playStormGust();
          AudioManager.playDustSwirl();
        } else if (stepIdx === 11) {
          AudioManager.playMeteoroid();
        } else if (stepIdx === 1 || stepIdx === 3 || stepIdx === 6) {
          AudioManager.playDustSwirl();
        } else if (
          stepIdx === 4 ||
          stepIdx === 8 ||
          stepIdx === 13 ||
          stepIdx === 15 ||
          stepIdx === 16
        ) {
          AudioManager.playRustCreak();
        } else if (stepSpec.part === 4) {
          AudioManager.playWarn();
        } else {
          AudioManager.playMoveWhoosh();
        }
        say(
          `Alert, Cadet! Issue at [color=#FFD966]${HOTSPOTS_BY_STEP[stepIdx]?.label ?? stepSpec.title}[/color]. Head over to inspect it!`,
          stepSpec.part >= 3 ? 'worried' : 'normal',
          false
        );
      } else if (stepSpec.kind === 'minigame_landing') {
        AudioManager.playThruster();
        say(
          'Take manual control, Cadet! Steer onto the [color=#2EE59D]Green Zone[/color] and hold Thrust to slow down!',
          'normal',
          false
        );
      } else if (stepSpec.kind === 'minigame_leak') {
        AudioManager.playHiss();
        AudioManager.playRustCreak();
        say(
          'Air is escaping fast! Tap all [color=#FF859D]3 leaking holes[/color] before 15 seconds run out!',
          'worried',
          false
        );
      } else if (stepSpec.kind === 'finale_ranking') {
        AudioManager.playStormGust();
        AudioManager.playWarn();
        say(
          'Cadet, you trained for this. [color=#FFD966]What matters most?[/color] Rank our 4 priorities carefully!',
          'worried',
          false
        );
      }
    },
    [say]
  );

  // Resume or start Level 3 from saved checkpoint
  const initFromProfile = useCallback(
    (prof: CadetProfile) => {
      if (prof.level3Completed) {
        const stars = prof.level3Stars || computePartOrFinalStars(prof);
        setActivePart(5);
        setStage('complete');
        say(
          stars === 3
            ? '[color=#2EE59D]That is what a commander does.[/color]'
            : stars === 2
              ? 'You made hard calls. Next time we plan more margin for [color=#FFB703]Mars[/color].'
              : 'ARIA: [color=#5CEEFF]Let us review what happened.[/color]',
          stars === 3 ? 'happy' : stars === 2 ? 'normal' : 'worried',
          false
        );
        return;
      }

      if (prof.level3CheckpointPending >= 1 && prof.level3CheckpointPending <= 4) {
        const cp = prof.level3CheckpointPending as 1 | 2 | 3 | 4;
        setCheckpointPart(cp);
        setActivePart(cp);
        setStage('checkpoint');
        say(
          `Part ${cp} complete, Cadet! Take a breath or continue when ready.`,
          'happy',
          false
        );
        return;
      }

      const step = prof.level3Step ?? 0;
      if (step <= 0) {
        setActivePart(1);
        setStage('story_start');
        say(
          'This is the part they will remember, Cadet. Take a breath. We are landing on [color=#FF8C42]Mars[/color].',
          'normal',
          true,
          () => enterPartTitle(1)
        );
        return;
      }

      const clampedStep = Math.max(1, Math.min(17, step));
      const spec = LEVEL3_STEPS[clampedStep - 1];
      if (
        spec &&
        spec.part <= 4 &&
        clampedStep === LEVEL3_PARTS[spec.part as 1 | 2 | 3 | 4].firstStep
      ) {
        enterPartTitle(spec.part as 1 | 2 | 3 | 4);
      } else {
        enterStep(clampedStep);
      }
    },
    [enterPartTitle, enterStep, say]
  );

  useEffect(() => {
    initFromProfile(initialProfile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStepIdx = Math.max(1, Math.min(17, profile.level3Step || 1));
  const currentStep = LEVEL3_STEPS[currentStepIdx - 1];

  const explorerEnabled =
    (stage === 'part_title' ||
      (stage === 'step' && currentStep.kind === 'choice' && stepPhase === 'explore')) &&
    activePart <= 4;

  const activeHotspot =
    stage === 'step' && currentStep.kind === 'choice' && stepPhase === 'explore'
      ? HOTSPOTS_BY_STEP[currentStep.stepIndex] ?? {
          x: 54,
          y: 62,
          label: currentStep.title,
        }
      : null;

  const nearHotspot = Boolean(
    activeHotspot &&
      Math.hypot(
        explorerPos.x - activeHotspot.x,
        explorerPos.y - activeHotspot.y
      ) <= 10.5
  );

  const handleOpenSolveOptions = useCallback(() => {
    if (currentStep.kind !== 'choice') return;
    AudioManager.stopReyesSpeech();
    if (!nearHotspot) {
      AudioManager.playWarn();
      say(
        `Move over to [color=#FFD966]${activeHotspot?.label ?? 'the issue icon'}[/color] on Mars first so we can inspect the damage.`,
        'normal',
        false
      );
      return;
    }
    AudioManager.playMoveWhoosh();
    AudioManager.playClick();
    setStepPhase('decision');
    say(
      currentStep.reyesPrompt ??
        `Choose your solution for [color=#FFD966]${currentStep.title}[/color].`,
      currentStep.part >= 4 ? 'worried' : 'normal',
      false
    );
  }, [activeHotspot, currentStep, nearHotspot, say]);

  // Press 'E' on keyboard to solve when at the problem icon (or begin part)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() !== 'e') return;
      if (
        stage === 'step' &&
        currentStep.kind === 'choice' &&
        stepPhase === 'explore'
      ) {
        e.preventDefault();
        handleOpenSolveOptions();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [currentStep.kind, handleOpenSolveOptions, stage, stepPhase]);

  const advanceAfterStep = (updatedProf: CadetProfile, completedStepIdx: number) => {
    const endedPart: 1 | 2 | 3 | 4 | null =
      completedStepIdx === 3
        ? 1
        : completedStepIdx === 7
          ? 2
          : completedStepIdx === 12
            ? 3
            : completedStepIdx === 16
              ? 4
              : null;

    if (endedPart) {
      const partStars = computePartOrFinalStars(updatedProf);
      const nextStep = completedStepIdx + 1;
      const saved: CadetProfile = {
        ...updatedProf,
        level3Step: nextStep,
        level3CheckpointPending: endedPart,
        level3PartStars: {
          ...updatedProf.level3PartStars,
          [endedPart]: partStars,
        },
      };
      persistProfile(saved);
      setCheckpointPart(endedPart);
      setStage('checkpoint');
      AudioManager.playStar();
      say(
        `Part ${endedPart} complete! You earned [color=#FFD966]${partStars} star${partStars === 1 ? '' : 's'}[/color] for this phase.`,
        partStars >= 2 ? 'happy' : 'normal',
        false
      );
      return;
    }

    const nextIdx = completedStepIdx + 1;
    const saved: CadetProfile = {
      ...updatedProf,
      level3Step: nextIdx,
      level3CheckpointPending: 0,
    };
    persistProfile(saved);
    enterStep(nextIdx);
  };

  const handleSelectChoice = (choice: Level3ChoiceSpec) => {
    if (currentStep.kind !== 'choice') return;
    AudioManager.stopReyesSpeech();
    const outcome = choice.resolve(profile);
    const nextRes = { ...profile.resources };

    (Object.keys(outcome.deltas) as ResourceKey[]).forEach((key) => {
      const delta = outcome.deltas[key] ?? 0;
      nextRes[key] = clampMeter(nextRes[key] + delta);
    });

    if (outcome.deltas.food && !outcome.deltas.sproutHealth) {
      nextRes.sproutHealth = clampMeter(
        nextRes.sproutHealth + Math.round(outcome.deltas.food * 0.65)
      );
    }

    if (outcome.isRisky) {
      AudioManager.playImpact();
      setMotionState('shake');
      window.setTimeout(() => setMotionState('none'), 350);
    } else if (outcome.outcomeExpr === 'happy') {
      AudioManager.playStar();
    } else {
      AudioManager.playClick();
    }

    const logEntry: Level2ChoiceLog = {
      sceneId: currentStep.id,
      sceneTitle: currentStep.title,
      choiceLetter: choice.letter,
      choiceLabel: choice.label,
      outcomeSummary: outcome.outcomeSummary,
      wasRisky: outcome.isRisky,
      realMarsTip: choice.realMarsTip,
    };

    const updated: CadetProfile = {
      ...profile,
      co2Cartridges: Math.max(
        0,
        profile.co2Cartridges + (outcome.cartridgeDelta ?? 0)
      ),
      repairKits: Math.max(
        0,
        profile.repairKits + (outcome.repairKitDelta ?? 0)
      ),
      resources: nextRes,
      level3History: [...profile.level3History, logEntry],
    };

    persistProfile(updated);
    setChosenSummary(outcome.outcomeSummary);
    setLessonText(currentStep.lesson);
    setStage('lesson');
    say(outcome.outcomeReyes, outcome.outcomeExpr, false);
  };

  const handleLandingMiniGameDone = (res: LandingGameResult) => {
    const nextRes = {
      ...profile.resources,
      fuel: clampMeter(profile.resources.fuel + res.fuelDelta),
      health: clampMeter(profile.resources.health + res.healthDelta),
      shield: clampMeter(profile.resources.shield + res.shieldDelta),
      morale: clampMeter(profile.resources.morale + (res.passed ? 8 : -4)),
    };
    const updated: CadetProfile = {
      ...profile,
      level3LandingPassed: res.passed,
      resources: nextRes,
    };
    say(
      res.passed
        ? '[color=#2EE59D]Perfect landing, Cadet![/color]'
        : 'Hard landing, but we are alive!',
      res.passed ? 'happy' : 'worried',
      false
    );
    advanceAfterStep(updated, 2);
  };

  const handleLeakMiniGameDone = (res: LeakGameResult) => {
    const nextRes = {
      ...profile.resources,
      oxygen: clampMeter(profile.resources.oxygen + res.oxygenDelta),
      morale: clampMeter(profile.resources.morale + (res.passed ? 5 : -5)),
    };
    const updated: CadetProfile = {
      ...profile,
      repairKits: Math.max(0, profile.repairKits + res.repairKitDelta),
      resources: nextRes,
    };
    say(
      res.passed
        ? '[color=#2EE59D]All 3 leaks sealed![/color] Cabin oxygen stabilized.'
        : 'That leak cost us precious [color=#FF4D6D]15% Oxygen[/color]!',
      res.passed ? 'happy' : 'worried',
      false
    );
    advanceAfterStep(updated, 10);
  };

  const handleConfirmFinaleRanking = (order: Level3PriorityId[]) => {
    const nextRes = { ...profile.resources };

    order.forEach((priorityId, rankIdx) => {
      const deltas = FINALE_PRIORITIES[priorityId].deltasByRank[rankIdx];
      (Object.keys(deltas) as ResourceKey[]).forEach((key) => {
        const delta = deltas[key] ?? 0;
        nextRes[key] = clampMeter(nextRes[key] + delta);
      });
    });

    const tempProfile: CadetProfile = {
      ...profile,
      level3FinaleOrder: order,
      resources: nextRes,
    };
    const finalStars = computePartOrFinalStars(tempProfile);

    if (finalStars === 3) {
      AudioManager.playStar();
    } else if (finalStars === 1) {
      AudioManager.playWarn();
    } else {
      AudioManager.playClick();
    }

    const completed: CadetProfile = {
      ...tempProfile,
      level3Step: 18,
      level3CheckpointPending: 0,
      level3Completed: true,
      level3Stars: finalStars,
    };
    persistProfile(completed);
    setActivePart(5);
    setStage('complete');

    if (finalStars === 3) {
      say(
        '[color=#2EE59D]That is what a commander does.[/color] Look — Sprout is blooming!',
        'happy',
        false
      );
    } else if (finalStars === 2) {
      say(
        'You made hard calls. Next time we plan more margin for [color=#FFB703]Mars[/color].',
        'normal',
        false
      );
    } else {
      say(
        'ARIA: [color=#5CEEFF]Let us review what happened[/color] so future Mars crews learn from this.',
        'worried',
        false
      );
    }
  };

  const handleContinueFromCheckpoint = () => {
    const targetStep =
      checkpointPart === 1
        ? 4
        : checkpointPart === 2
          ? 8
          : checkpointPart === 3
            ? 13
            : 17;

    const updated: CadetProfile = {
      ...profile,
      level3Step: targetStep,
      level3CheckpointPending: 0,
    };
    persistProfile(updated);

    if (checkpointPart < 4) {
      enterPartTitle((checkpointPart + 1) as 2 | 3 | 4);
    } else {
      enterStep(17);
    }
  };

  const handleSaveAndBreak = () => {
    const targetStep =
      checkpointPart === 1
        ? 4
        : checkpointPart === 2
          ? 8
          : checkpointPart === 3
            ? 13
            : 17;
    const saved: CadetProfile = {
      ...profile,
      cadetLevel: Math.max(profile.cadetLevel, 3),
      level3Step: targetStep,
      level3CheckpointPending: checkpointPart,
    };
    persistProfile(saved);
  };

  const handleRestartLevel3 = () => {
    const reset: CadetProfile = {
      ...profile,
      level3Step: 0,
      level3CheckpointPending: 0,
      level3PartStars: {},
      level3LandingPassed: false,
      level3Completed: false,
      level3Stars: 0,
      level3FinaleOrder: [],
      level3History: [],
      co2Cartridges: 6,
      repairKits: Math.max(1, profile.repairKits || 1),
      resources: {
        oxygen: 100,
        water: 100,
        food: 100,
        power: 100,
        fuel: 100,
        shield: 100,
        suit: 100,
        thermal: 100,
        mass: 100,
        health: 100,
        sproutHealth: 100,
        morale: 100,
        science: 100,
      },
    };
    persistProfile(reset);
    initFromProfile(reset);
  };

  const partMeta =
    activePart <= 4 ? LEVEL3_PARTS[activePart as 1 | 2 | 3 | 4] : null;
  const isFinaleStep =
    stage === 'step' && currentStep.kind === 'finale_ranking';
  const finalStarsEarned = profile.level3Stars || computePartOrFinalStars(profile);

  const isCenteredModalStage =
    stage === 'checkpoint' ||
    stage === 'complete' ||
    (stage === 'step' &&
      (currentStep.kind === 'minigame_landing' ||
        currentStep.kind === 'minigame_leak' ||
        currentStep.kind === 'finale_ranking'));

  const objectiveText =
    stage === 'story_start'
      ? 'Press Next under Commander Reyes to begin'
      : stage === 'part_title' && partMeta
        ? `${partMeta.title}`
        : stage === 'step' && currentStep.kind === 'choice' && stepPhase === 'explore'
          ? nearHotspot
            ? `At ${activeHotspot?.label ?? 'Site'} — Ready to solve: ${currentStep.title}`
            : `Go to ${activeHotspot?.label ?? currentStep.title}`
          : stage === 'step'
            ? `${currentStep.numberLabel}: ${currentStep.title}`
            : stage === 'lesson'
              ? 'Mars Survival Science Lesson'
              : stage === 'checkpoint'
                ? `Part ${checkpointPart} Complete`
                : 'Mars Mission Complete!';

  const ariaText =
    currentStep.kind === 'choice' && currentStep.ariaReport
      ? currentStep.ariaReport
      : backendAriaLine || undefined;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#160B08]">
      {/* Mars Land Environment + Realistic Movable Cadet Explorer */}
      <MarsSurfaceViewport
        part={activePart}
        stepIndex={currentStepIdx}
        stormActive={currentStepIdx === 12 || isFinaleStep}
        crisisAlert={activePart === 4 || isFinaleStep}
        starEndingGlow={stage === 'complete' && finalStarsEarned === 3}
        motionState={motionState}
        explorerEnabled={explorerEnabled}
        issueHotspot={activeHotspot}
        nearHotspot={nearHotspot}
        onExplorerPosChange={setExplorerPos}
        onInspectHotspot={handleOpenSolveOptions}
      />

      {/* Compact Perimeter-Framed Glowing Sci-Fi Mars HUD */}
      <Level3Hud
        username={profile.username}
        cadetLevel={profile.cadetLevel}
        stars={profile.level3Stars}
        resources={profile.resources}
        repairKits={profile.repairKits}
        co2Cartridges={profile.co2Cartridges}
        currentPart={activePart}
        stepIndex={currentStepIdx}
        isComplete={stage === 'complete'}
        objectiveText={objectiveText}
        ariaStatusText={ariaText}
        dialogueText={dialogueText}
        expression={expression}
        showNextButton={showNext}
        blooming={stage === 'complete' && finalStarsEarned === 3}
        trembling={isFinaleStep}
        onDialogueNext={() => nextAction?.()}
        onRestartLevel={handleRestartLevel3}
        onQuitToMenu={onQuitToMenu}
      />

      {/* Main Stage: Sized cleanly for landscape phone & 1280x720 laptop box */}
      <main
        className={`pointer-events-none relative z-20 h-full overflow-y-auto flex flex-col items-center ${
          isCenteredModalStage
            ? 'justify-center pt-16 pb-6 sm:pl-[220px] sm:pr-[175px] lg:pl-[268px] lg:pr-[200px]'
            : 'justify-end pt-16 pb-2 sm:pl-[220px] sm:pr-[175px] lg:pl-[268px] lg:pr-[200px]'
        } px-2.5`}
      >
        {/* 1. Compact Story Start Strip */}
        {stage === 'story_start' && (
          <section className="pointer-events-auto w-full max-w-md mt-auto rounded-[12px] border border-[#00D4FF]/85 bg-[#06142C]/86 px-4 py-2.5 text-center shadow-[0_0_20px_rgba(0,212,255,0.25)] backdrop-blur-md">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#FFB703] mb-0.5">
              Level 3 · Mars: Landing to Survival
            </p>
            <h1 className="font-display text-base sm:text-lg font-extrabold text-white mb-1">
              Touchdown on the Red Planet
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-200 leading-snug">
              Mars fills the horizon ahead. Press{' '}
              <strong className="text-[#FFD966]">Next ▶</strong> below Commander
              Reyes to begin Part 1.
            </p>
          </section>
        )}

        {/* 2. Compact Part Title Card */}
        {stage === 'part_title' && partMeta && (
          <section className="pointer-events-auto w-full max-w-lg mt-auto rounded-[12px] border border-[#00D4FF]/85 bg-[#06142C]/86 px-4 py-2.5 shadow-[0_0_20px_rgba(0,212,255,0.25)] backdrop-blur-md">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5CEEFF]">
                  {partMeta.subtitle}
                </p>
                <h2 className="font-display text-sm sm:text-base font-extrabold text-white">
                  {partMeta.title}
                </h2>
                <p className="text-[11px] text-slate-200 leading-snug mt-0.5">
                  {partMeta.narration}
                </p>
              </div>
              <SciFiButton
                variant="gold"
                onClick={() => {
                  const updated: CadetProfile = {
                    ...profile,
                    level3Step: partMeta.firstStep,
                    level3CheckpointPending: 0,
                  };
                  persistProfile(updated);
                  enterStep(partMeta.firstStep);
                }}
                className="shrink-0 min-h-[34px] px-3 py-1 text-xs"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Begin Part {partMeta.part}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </SciFiButton>
            </div>
          </section>
        )}

        {/* 3a. Bottom-Center Action Prompt Bar (no control instructions on screen) */}
        {stage === 'step' &&
          currentStep.kind === 'choice' &&
          stepPhase === 'explore' && (
            <section
              aria-label={`${currentStep.numberLabel} action prompt`}
              className="pointer-events-auto mt-auto flex flex-col items-center gap-1.5"
            >
              <div className="rounded-xl border border-[#FF859D]/70 bg-[#06142C]/86 px-3 py-1.5 text-center shadow-lg backdrop-blur-md max-w-sm">
                <p className="inline-flex items-center gap-1 text-[11px] font-display font-bold uppercase tracking-wider text-[#FF859D]">
                  <AlertTriangle className="w-3 h-3" />
                  {currentStep.numberLabel}: {currentStep.title}
                </p>
                <p className="text-[11px] text-slate-200 mt-0.5 leading-snug">
                  {currentStep.narration}
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenSolveOptions}
                className={`inline-flex items-center gap-2 rounded-[10px] border-2 px-4 py-1.5 shadow-[0_0_16px_rgba(0,212,255,0.3)] backdrop-blur-md transition-all cursor-pointer ${
                  nearHotspot
                    ? 'border-[#00D4FF] bg-[#0B2246]/95 hover:bg-[#14376E] text-white scale-105'
                    : 'border-amber-400/70 bg-[#06142C]/86 text-amber-200 hover:border-amber-300'
                }`}
              >
                <span
                  className={`w-6 h-6 rounded border flex items-center justify-center font-display font-extrabold text-xs ${
                    nearHotspot
                      ? 'border-[#00D4FF] bg-[#00D4FF]/20 text-[#5CEEFF]'
                      : 'border-amber-400/60 bg-amber-500/15 text-amber-300'
                  }`}
                >
                  {nearHotspot ? 'E' : <Wrench className="w-3 h-3" />}
                </span>
                <span className="font-display font-extrabold text-[11px] sm:text-xs tracking-wide uppercase">
                  {nearHotspot
                    ? `SOLVE ISSUE · ${activeHotspot?.label ?? currentStep.title}`
                    : `${activeHotspot?.label ?? currentStep.title}`}
                </span>
              </button>
            </section>
          )}

        {/* 3b. Compact Bottom Options Console */}
        {stage === 'step' &&
          currentStep.kind === 'choice' &&
          stepPhase === 'decision' && (
            <section
              aria-label={`${currentStep.numberLabel} - ${currentStep.title} options`}
              className="pointer-events-auto w-full max-w-2xl mt-auto rounded-[12px] border border-[#00D4FF]/85 bg-[#06142C]/90 p-2.5 sm:p-3 shadow-[0_0_22px_rgba(0,212,255,0.28)] backdrop-blur-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#FFB703]">
                    {currentStep.numberLabel} ({currentStep.stepIndex}/17)
                  </span>
                  <span className="text-slate-500">·</span>
                  <h2 className="font-display text-sm sm:text-base font-extrabold text-white">
                    {currentStep.title}
                  </h2>
                </div>
                <span className="text-[11px] font-mono-num text-cyan-200">
                  Part {currentStep.part} of 4
                </span>
              </div>

              {currentStep.ariaReport && (
                <div className="mb-2 rounded-lg border border-[#00D4FF]/60 bg-[#0B2240]/85 px-3 py-1.5 flex items-center gap-2 text-xs">
                  <Cpu className="w-4 h-4 text-[#5CEEFF] shrink-0" />
                  <span className="font-bold text-[#5CEEFF] shrink-0">ARIA:</span>
                  <span className="text-slate-100 font-mono-num truncate">
                    {currentStep.ariaReport}
                  </span>
                </div>
              )}

              {currentStep.mcDelayedMessage && (
                <div className="mb-2 rounded-lg border border-[#FFB703]/70 bg-[#2A1A08]/85 px-3 py-1.5 flex items-center gap-2 text-xs">
                  <Radio className="w-4 h-4 text-[#FFD966] shrink-0" />
                  <span className="font-bold text-[#FFD966] shrink-0">
                    Delayed ({currentStep.mcDelayedMessage.delayMinutes}m ago):
                  </span>
                  <span className="text-amber-50 truncate">
                    {currentStep.mcDelayedMessage.message}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {currentStep.choices.map((choice) => (
                  <button
                    key={choice.letter}
                    type="button"
                    onClick={() => handleSelectChoice(choice)}
                    className="flex flex-col justify-between text-left rounded-[10px] border-2 border-[#00D4FF]/70 bg-[#0D2140]/92 hover:border-[#FFB703] hover:bg-[#14305B] hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-150 p-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="w-6 h-6 rounded-md bg-[#FFB703]/20 border border-[#FFB703] text-[#FFD966] font-display font-bold text-xs flex items-center justify-center shrink-0">
                        {choice.letter}
                      </span>
                      <h3 className="font-display text-sm font-bold text-white leading-tight">
                        {choice.label}
                      </h3>
                    </div>

                    <div className="space-y-0.5 text-[11px] sm:text-xs pt-1.5 border-t border-slate-700/70">
                      <p>
                        <strong className="text-[#2EE59D]">Effect:</strong>{' '}
                        <span className="text-slate-100">{choice.effectText}</span>
                      </p>
                      <p>
                        <strong className="text-[#FF859D]">Side:</strong>{' '}
                        <span className="text-slate-200">
                          {choice.sideEffectText}
                        </span>
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}

        {stage === 'step' && currentStep.kind === 'minigame_landing' && (
          <div className="pointer-events-auto w-full flex justify-center">
            <MarsLandingMiniGame onComplete={handleLandingMiniGameDone} />
          </div>
        )}

        {stage === 'step' && currentStep.kind === 'minigame_leak' && (
          <div className="pointer-events-auto w-full flex justify-center">
            <FixLeakMiniGame
              repairKitsAvailable={profile.repairKits}
              onComplete={handleLeakMiniGameDone}
            />
          </div>
        )}

        {stage === 'step' && currentStep.kind === 'finale_ranking' && (
          <div className="pointer-events-auto w-full flex justify-center">
            <MarsFinaleRanking onConfirmRanking={handleConfirmFinaleRanking} />
          </div>
        )}

        {/* 4. Compact Bottom Lesson Card */}
        {stage === 'lesson' && (
          <section
            aria-label="Mars Science Lesson Card"
            className="pointer-events-auto w-full max-w-lg mt-auto rounded-[12px] border border-[#FFB703] bg-[#06142C]/92 p-3 shadow-[0_0_22px_rgba(255,183,3,0.22)] backdrop-blur-md"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-[#FFD966]">
                <BookOpen className="w-4 h-4" />
                Lesson: Mars Survival Science
              </span>
              <span className="font-mono-num text-xs text-cyan-200">
                {chosenSummary}
              </span>
            </div>

            <p className="text-xs sm:text-sm text-slate-100 leading-relaxed mb-3">
              {lessonText}
            </p>

            <div className="flex justify-end">
              <SciFiButton
                variant="gold"
                onClick={() => advanceAfterStep(profile, currentStepIdx)}
                className="min-h-[38px] px-4 py-1.5 text-sm"
              >
                <span>Next</span>
                <ArrowRight className="w-4 h-4" />
              </SciFiButton>
            </div>
          </section>
        )}

        {stage === 'checkpoint' && (
          <div className="pointer-events-auto w-full flex justify-center">
            <Level3CheckpointScreen
              partJustCompleted={checkpointPart}
              partStars={
                profile.level3PartStars[checkpointPart] ||
                computePartOrFinalStars(profile)
              }
              profile={profile}
              onContinueNextPart={handleContinueFromCheckpoint}
              onSaveAndBreak={handleSaveAndBreak}
              onBackToHome={onQuitToMenu}
            />
          </div>
        )}

        {stage === 'complete' && (
          <div className="pointer-events-auto w-full flex justify-center">
            <Level3Complete
              profile={profile}
              starsEarned={finalStarsEarned}
              onPlayAgain={handleRestartLevel3}
              onBackToHome={onQuitToMenu}
            />
          </div>
        )}
      </main>
    </div>
  );
};
