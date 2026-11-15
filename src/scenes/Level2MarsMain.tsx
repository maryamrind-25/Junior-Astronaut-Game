import React, { useCallback, useEffect, useState } from 'react';
import { Rocket } from 'lucide-react';
import { HUD } from '../components/HUD';
import { RocketCabinViewport } from '../components/RocketCabinViewport';
import { SciFiButton } from '../components/SciFiButton';
import { SproutPlant } from '../components/SproutPlant';
import { AudioManager } from '../game/audioManager';
import { MARS_TRANSIT_SCENES, MarsHazardChoice } from '../game/level2Data';
import { SaveManager } from '../game/saveManager';
import {
  CadetProfile,
  Level2ChoiceLog,
  ResourceKey,
  ReyesExpression,
} from '../game/types';
import { Level2Complete } from './Level2Complete';
import { MarsHazardScene } from './MarsHazardScene';

interface Level2MarsMainProps {
  initialProfile: CadetProfile;
  onQuitToMenu: () => void;
  onBackToLevel1: () => void;
  onStartLevel3: (updatedProfile: CadetProfile) => void;
}

const DEPARTURE_DURATION_MS = 4500;
const INTRO_COUNTDOWN_SEC = 5; // 5-second delay in current intro scene before 1st problem
const CRUISE_DURATION_SEC = 7; // 5–10 second travel distance between hazards

function clampMeter(v: number): number {
  return Math.max(0, Math.min(100, v));
}

function computeLevel2Stars(profile: CadetProfile): number {
  const r = profile.resources;
  const coreMeters = [
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
  const above70 = coreMeters.filter((v) => v >= 70).length;
  const avg = coreMeters.reduce((a, b) => a + b, 0) / coreMeters.length;
  const sproutEffective = Math.round((r.food + r.sproutHealth) / 2);

  if (above70 >= 6 && avg >= 70 && sproutEffective >= 65) {
    return 3;
  }
  if (r.health > 30 && r.oxygen > 25 && avg >= 48) {
    return 2;
  }
  return 1;
}

export const Level2MarsMain: React.FC<Level2MarsMainProps> = ({
  initialProfile,
  onQuitToMenu,
  onBackToLevel1,
  onStartLevel3,
}) => {
  const [profile, setProfile] = useState<CadetProfile>(initialProfile);

  // 'departure' | 'intro' | 'hazard' | 'complete' | 'level_3_briefing'
  const [stage, setStage] = useState<
    'departure' | 'intro' | 'hazard' | 'complete' | 'level_3_briefing'
  >('departure');
  const [introSecondsLeft, setIntroSecondsLeft] =
    useState<number>(INTRO_COUNTDOWN_SEC);
  const [departureProgress, setDepartureProgress] = useState<number>(0);
  const [scenePhase, setScenePhase] = useState<
    'cruise' | 'encounter' | 'decision' | 'lesson'
  >('cruise');
  const [cruiseSecondsLeft, setCruiseSecondsLeft] =
    useState<number>(CRUISE_DURATION_SEC);
  const [isTryingFix, setIsTryingFix] = useState(false);
  const [chosenSummary, setChosenSummary] = useState('');
  const [actionMotion, setActionMotion] = useState<
    'none' | 'shake' | 'roll' | 'burn'
  >('none');

  // Commander Reyes state
  const [dialogueText, setDialogueText] = useState('');
  const [expression, setExpression] = useState<ReyesExpression>('normal');
  const [showNext, setShowNext] = useState(false);
  const [nextAction, setNextAction] = useState<(() => void) | null>(null);

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

  const triggerEncounterEffects = useCallback((sceneIdx: number) => {
    AudioManager.stopStormAmbience();
    if (sceneIdx === 1) {
      AudioManager.playDustSwirl();
      AudioManager.startStormAmbience();
    } else if (sceneIdx === 2) {
      AudioManager.playStormGust();
      AudioManager.startStormAmbience();
    } else if (sceneIdx === 3 || sceneIdx === 4) {
      AudioManager.playMeteoroid();
      AudioManager.playImpact();
      setActionMotion('shake');
      window.setTimeout(() => setActionMotion('none'), 350);
    } else if (sceneIdx === 6 || sceneIdx === 8) {
      AudioManager.playHiss();
      AudioManager.playRustCreak();
    } else if (sceneIdx === 9 || sceneIdx === 10) {
      AudioManager.playRustCreak();
      AudioManager.playThruster();
    } else {
      AudioManager.playWarn();
    }
  }, []);

  useEffect(() => {
    return () => {
      AudioManager.stopStormAmbience();
    };
  }, []);

  const startEncounterForScene = useCallback(
    (sceneIdx: number) => {
      const scene = MARS_TRANSIT_SCENES[sceneIdx - 1];
      setStage('hazard');
      setScenePhase('encounter');
      setIsTryingFix(false);
      triggerEncounterEffects(sceneIdx);
      say(
        `Watch the window, Cadet — [color=#FF859D]${scene.title}[/color]! Try fixing or stabilizing it first.`,
        'worried',
        false
      );
    },
    [say, triggerEncounterEffects]
  );

  const startCruiseToScene = useCallback(
    (sceneIdx: number) => {
      setStage('hazard');
      setScenePhase('cruise');
      setCruiseSecondsLeft(CRUISE_DURATION_SEC);
      AudioManager.playThruster();
      say(
        `Cruising steady toward [color=#FF8C42]Mars[/color] (Sector ${sceneIdx} of 11). Keep watching the forward viewport.`,
        'normal',
        false
      );
    },
    [say]
  );

  const beginFirstHazard = useCallback(
    (prof: CadetProfile) => {
      const started: CadetProfile = {
        ...prof,
        level2Checkpoint: 1,
      };
      persistProfile(started);
      startEncounterForScene(1);
    },
    [persistProfile, startEncounterForScene]
  );

  const enterIntroScene = useCallback(
    (prof: CadetProfile) => {
      setStage('intro');
      setActionMotion('none');
      setIntroSecondsLeft(INTRO_COUNTDOWN_SEC);
      say(
        'The trip is never empty, Cadet. Space is busy, and it does not care about your schedule. We are going to [color=#FF8C42]Mars[/color].',
        'normal',
        true,
        () => beginFirstHazard(prof)
      );
    },
    [beginFirstHazard, say]
  );

  // Earth Departure animation timer (~4.5s) -> transitions to current intro scene
  useEffect(() => {
    if (stage !== 'departure') return;

    const startTime = performance.now();
    const tick = window.setInterval(() => {
      const pct = Math.min(
        100,
        Math.round(((performance.now() - startTime) / DEPARTURE_DURATION_MS) * 100)
      );
      setDepartureProgress(pct);
    }, 80);

    const finishTimer = window.setTimeout(() => {
      window.clearInterval(tick);
      enterIntroScene(profile);
    }, DEPARTURE_DURATION_MS);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(finishTimer);
    };
  }, [stage, enterIntroScene, profile]);

  // 5-second countdown in current intro scene -> encounters 1st problem
  useEffect(() => {
    if (stage !== 'intro') return;

    const timer = window.setInterval(() => {
      setIntroSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          beginFirstHazard(profile);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [stage, beginFirstHazard, profile]);

  // 7-second travel countdown between hazards
  useEffect(() => {
    if (stage !== 'hazard' || scenePhase !== 'cruise') return;
    const idx = Math.max(1, Math.min(11, profile.level2Checkpoint || 1));

    const timer = window.setInterval(() => {
      setCruiseSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          startEncounterForScene(idx);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [stage, scenePhase, profile.level2Checkpoint, startEncounterForScene]);

  const loadSceneAtCheckpoint = useCallback(
    (prof: CadetProfile) => {
      const cp = prof.level2Checkpoint ?? 0;

      if (cp <= 0) {
        setStage('departure');
        setDepartureProgress(0);
        setActionMotion('burn');
        AudioManager.playThruster();
        say(
          'Main engine burn confirmed! Pulling away from [color=#60A5FA]Earth[/color] toward [color=#FF8C42]Mars[/color]!',
          'happy',
          false
        );
        return;
      }

      if (cp >= 1 && cp <= 11) {
        startEncounterForScene(cp);
        return;
      }

      setStage('complete');
      const stars = prof.level2Stars || computeLevel2Stars(prof);
      if (stars === 3) {
        say(
          '[color=#2EE59D]That is what a commander does.[/color] Ready to land on Mars!',
          'happy',
          false
        );
      } else if (stars === 2) {
        say(
          'You made hard calls. Next time we plan more margin for [color=#FFB703]Mars[/color].',
          'normal',
          false
        );
      } else {
        say(
          'ARIA says: [color=#5CEEFF]Let us review what happened[/color] so our next Mars crew succeeds.',
          'worried',
          false
        );
      }
    },
    [say, startEncounterForScene]
  );

  useEffect(() => {
    loadSceneAtCheckpoint(initialProfile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentSceneIndex = Math.max(
    1,
    Math.min(11, profile.level2Checkpoint || 1)
  );
  const currentScene = MARS_TRANSIT_SCENES[currentSceneIndex - 1];

  const handleSkipCruise = () => {
    startEncounterForScene(currentSceneIndex);
  };

  const handleTryFixHazard = () => {
    if (isTryingFix) return;
    AudioManager.stopReyesSpeech();
    setIsTryingFix(true);
    AudioManager.playMoveWhoosh();

    if (currentSceneIndex === 1 || currentSceneIndex === 2) {
      AudioManager.playDustSwirl();
    } else if (currentSceneIndex === 4) {
      AudioManager.playMeteoroid();
    } else if (currentSceneIndex === 3 || currentSceneIndex === 9 || currentSceneIndex === 10) {
      AudioManager.playThruster();
      AudioManager.playRustCreak();
    } else if (currentSceneIndex === 6 || currentSceneIndex === 8) {
      AudioManager.playHiss();
      AudioManager.playRustCreak();
    } else {
      AudioManager.playClick();
    }

    window.setTimeout(() => {
      setIsTryingFix(false);
      setScenePhase('decision');
      say(
        currentScene.reyesPrompt ??
          `Now choose your command option for [color=#FFD966]${currentScene.title}[/color].`,
        'normal',
        false
      );
    }, 850);
  };

  const handleSelectChoice = (choice: MarsHazardChoice) => {
    AudioManager.stopReyesSpeech();
    AudioManager.stopStormAmbience();
    const outcome = choice.resolve(profile);
    const nextResources = { ...profile.resources };

    (Object.keys(outcome.deltas) as ResourceKey[]).forEach((key) => {
      const delta = outcome.deltas[key] ?? 0;
      nextResources[key] = clampMeter(nextResources[key] + delta);
    });

    if (outcome.deltas.food && !outcome.deltas.sproutHealth) {
      nextResources.sproutHealth = clampMeter(
        nextResources.sproutHealth + Math.round(outcome.deltas.food * 0.7)
      );
    }

    if (outcome.isRisky) {
      AudioManager.playImpact();
      setActionMotion('shake');
      window.setTimeout(() => setActionMotion('none'), 400);
    } else if (
      choice.label.toLowerCase().includes('roll') ||
      choice.label.toLowerCase().includes('rotate') ||
      choice.label.toLowerCase().includes('turn')
    ) {
      AudioManager.playThruster();
      setActionMotion('roll');
      window.setTimeout(() => setActionMotion('none'), 850);
    } else if (
      choice.label.toLowerCase().includes('burn') ||
      choice.label.toLowerCase().includes('approach') ||
      choice.label.toLowerCase().includes('flyby')
    ) {
      AudioManager.playThruster();
      setActionMotion('burn');
      window.setTimeout(() => setActionMotion('none'), 700);
    } else if (outcome.outcomeExpr === 'happy') {
      AudioManager.playStar();
    } else {
      AudioManager.playClick();
    }

    const logEntry: Level2ChoiceLog = {
      sceneId: currentScene.id,
      sceneTitle: currentScene.title,
      choiceLetter: choice.letter,
      choiceLabel: choice.label,
      outcomeSummary: outcome.outcomeSummary,
      wasRisky: outcome.isRisky,
      realMarsTip: choice.realMarsTip,
    };

    const updated: CadetProfile = {
      ...profile,
      repairKits: Math.max(
        0,
        profile.repairKits + (outcome.repairKitDelta ?? 0)
      ),
      resources: nextResources,
      level2History: [...profile.level2History, logEntry],
    };

    persistProfile(updated);
    setChosenSummary(outcome.outcomeSummary);
    setScenePhase('lesson');
    say(outcome.outcomeReyes, outcome.outcomeExpr, false);
  };

  const handleNextScene = () => {
    const nextCp = currentSceneIndex + 1;
    if (nextCp <= 11) {
      const updated: CadetProfile = {
        ...profile,
        level2Checkpoint: nextCp,
      };
      persistProfile(updated);
      startCruiseToScene(nextCp);
      return;
    }

    const stars = computeLevel2Stars(profile);
    if (stars === 3) {
      AudioManager.playStar();
    } else if (stars === 1) {
      AudioManager.playWarn();
    }

    const completed: CadetProfile = {
      ...profile,
      level2Checkpoint: 12,
      level2Completed: true,
      level2Stars: stars,
    };
    persistProfile(completed);
    setStage('complete');

    if (stars === 3) {
      say(
        '[color=#2EE59D]That is what a commander does.[/color] Ready to land on Mars!',
        'happy',
        false
      );
    } else if (stars === 2) {
      say(
        'You made hard calls. Next time we plan more margin for [color=#FFB703]Mars[/color].',
        'normal',
        false
      );
    } else {
      say(
        'ARIA says: [color=#5CEEFF]Let us review what happened[/color] so our next Mars crew succeeds.',
        'worried',
        false
      );
    }
  };

  const handleRestartLevel2 = () => {
    const reset: CadetProfile = {
      ...profile,
      level2Checkpoint: 0,
      level2Completed: false,
      level2Stars: 0,
      level2History: [],
      repairKits:
        typeof profile.bagItems?.repair === 'number'
          ? profile.bagItems.repair
          : 1,
      resources: {
        ...profile.resources,
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
      },
    };
    persistProfile(reset);
    loadSceneAtCheckpoint(reset);
  };

  const handleGoToMarsLanding = () => {
    const updated: CadetProfile = {
      ...profile,
      cadetLevel: Math.max(profile.cadetLevel, 3),
    };
    persistProfile(updated);
    onStartLevel3(updated);
  };

  const activeViewportSceneIdx =
    stage === 'hazard' ? currentSceneIndex : stage === 'intro' || stage === 'departure' ? 0 : 12;

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#040914]">
      {/* Inside-of-Rocket Cockpit Frame + Earth Departure + Continuous Moving Starfield */}
      <RocketCabinViewport
        sceneIndex={activeViewportSceneIdx}
        isDepartingEarth={stage === 'departure'}
        isCruising={
          stage === 'intro' || (stage === 'hazard' && scenePhase === 'cruise')
        }
        encounterActive={stage === 'hazard' && scenePhase === 'encounter'}
        actionMotion={actionMotion}
      />

      {/* Persistent HUD (Level 2 Mars Meters + Reyes) */}
      <HUD
        username={profile.username}
        cadetLevel={profile.cadetLevel}
        stars={profile.level2Stars}
        resources={profile.resources}
        repairKits={profile.repairKits}
        mode="level2"
        dialogueText={dialogueText}
        expression={expression}
        showNextButton={showNext}
        showDialogue={true}
        onDialogueNext={() => nextAction?.()}
        onRestartLevel={handleRestartLevel2}
        onQuitToMenu={onQuitToMenu}
      />

      {/* Sprout the Mars Lettuce Plant Tray */}
      <SproutPlant
        food={profile.resources.food}
        sproutHealth={profile.resources.sproutHealth}
      />

      {/* Main Cockpit Console Stage (docked low so upper cockpit window stays open) */}
      <main className="relative z-20 h-full overflow-y-auto flex flex-col items-center justify-end px-3 pt-16 sm:pt-14 md:pt-16 pb-3 sm:pb-3 md:pb-5 sm:pl-[235px] md:pl-[285px] lg:pl-[385px] sm:pr-4 lg:pr-52">
        {stage === 'departure' && (
          <div className="w-full max-w-lg mt-auto mb-2 rounded-[14px] border-2 border-[#00D4FF]/80 bg-[#081326]/80 px-5 py-4 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#5CEEFF]">
                  Trans-Mars Injection Burn
                </p>
                <h1 className="font-display text-lg sm:text-xl font-extrabold text-white">
                  Leaving Earth Orbit...
                </h1>
              </div>
              <SciFiButton
                variant="cyan"
                onClick={() => enterIntroScene(profile)}
                className="min-h-[34px] px-3 py-1 text-xs"
              >
                Skip ▶
              </SciFiButton>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden border border-slate-700 mb-1.5">
              <div
                className="h-full bg-gradient-to-r from-[#38BDF8] via-[#00D4FF] to-[#FF8C42] transition-all duration-100"
                style={{ width: `${departureProgress}%` }}
              />
            </div>
            <p className="font-mono-num text-xs text-cyan-200 flex justify-between">
              <span>Distance from Earth</span>
              <span>{Math.round(departureProgress * 420).toLocaleString()} km</span>
            </p>
          </div>
        )}

        {stage === 'intro' && (
          <div className="max-w-lg mt-auto mb-2 rounded-[14px] border-2 border-[#FF8C42]/80 bg-[#081326]/82 p-5 text-center shadow-2xl backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#FFB703] mb-1">
              Level 2 · Mars Transit Spacecraft
            </p>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-2">
              The Eleven Hazards
            </h1>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-3">
              Earth is shrinking behind us and Mars lies ahead. Keep watch on the
              forward cockpit window as deep space hazards approach.
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="font-mono-num text-xs font-bold text-[#5CEEFF] bg-[#0B2240]/90 border border-[#00D4FF]/60 rounded-lg px-3 py-1.5">
                First hazard in {introSecondsLeft}s
              </span>
              <SciFiButton
                variant="gold"
                onClick={() => beginFirstHazard(profile)}
                className="min-h-[36px] px-4 py-1 text-xs"
              >
                Start Now ▶
              </SciFiButton>
            </div>
          </div>
        )}

        {stage === 'hazard' && currentScene && (
          <MarsHazardScene
            scene={currentScene}
            profile={profile}
            phase={scenePhase}
            cruiseSecondsLeft={cruiseSecondsLeft}
            isTryingFix={isTryingFix}
            chosenOutcomeSummary={chosenSummary}
            onSkipCruise={handleSkipCruise}
            onTryFixHazard={handleTryFixHazard}
            onSelectChoice={handleSelectChoice}
            onNextScene={handleNextScene}
          />
        )}

        {stage === 'complete' && (
          <div className="my-auto w-full flex justify-center">
            <Level2Complete
              profile={profile}
              starsEarned={profile.level2Stars || computeLevel2Stars(profile)}
              onGoToMarsLanding={handleGoToMarsLanding}
              onReplayLevel2={handleRestartLevel2}
            />
          </div>
        )}

        {stage === 'level_3_briefing' && (
          <section className="max-w-xl my-auto rounded-[16px] border-2 border-[#FF8C42] bg-[#081326]/92 p-7 text-center shadow-2xl backdrop-blur-md">
            <Rocket className="w-11 h-11 text-[#FFB703] mx-auto mb-3" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#FF8C42] mb-1">
              Level 3 · Mars Landing Ready
            </p>
            <h2 className="font-display text-3xl font-extrabold text-white mb-3">
              Mars Orbit Staging
            </h2>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed mb-6">
              Your Level 2 stars ({profile.level2Stars}/3), fuel (
              <span className="font-mono-num text-[#FFB703] font-bold">
                {profile.resources.fuel}%
              </span>
              ), shield (
              <span className="font-mono-num text-[#5CEEFF] font-bold">
                {profile.resources.shield}%
              </span>
              ), and Sprout health have been saved for{' '}
              <strong>Level 3 — Mars Landing</strong>.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <SciFiButton variant="cyan" onClick={onBackToLevel1}>
                Replay Level 1
              </SciFiButton>
              <SciFiButton variant="gold" onClick={handleRestartLevel2}>
                Replay Level 2
              </SciFiButton>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
