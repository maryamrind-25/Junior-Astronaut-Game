import React, { useCallback, useEffect, useState } from 'react';
import { Compass, ShieldCheck } from 'lucide-react';
import { HUD } from '../components/HUD';
import { SciFiButton } from '../components/SciFiButton';
import { AudioManager } from '../game/audioManager';
import { SUITS } from '../game/gameData';
import { createDefaultProfile, SaveManager } from '../game/saveManager';
import {
  CadetProfile,
  Checkpoint,
  LaunchMethodId,
  ResourceKey,
  ReyesExpression,
  SuitId,
} from '../game/types';
import { LevelComplete } from './LevelComplete';
import { Mission1Suit } from './Mission1Suit';
import { Mission2Backpack } from './Mission2Backpack';
import { Mission3Launch } from './Mission3Launch';

const HANGAR_BG = '/images/hangar_bg.jpg';

interface Level1MainProps {
  initialProfile: CadetProfile;
  onQuitToMenu: () => void;
  onStartLevel2: (updatedProfile: CadetProfile) => void;
}

export const Level1Main: React.FC<Level1MainProps> = ({
  initialProfile,
  onQuitToMenu,
  onStartLevel2,
}) => {
  const [profile, setProfile] = useState<CadetProfile>(initialProfile);
  const [bgErr, setBgErr] = useState(false);

  // Active sub-stage inside Level 1:
  // 'lobby_intro' | 'suit_prompt' | 'mission_1' | 'mission_1_feedback' |
  // 'mission_2' | 'mission_2_feedback' | 'mission_3' | 'mission_3_feedback' |
  // 'level_complete' | 'level_2_preview'
  const [stage, setStage] = useState<string>('lobby_intro');

  // Commander Reyes speech state
  const [dialogueText, setDialogueText] = useState<string>('');
  const [expression, setExpression] = useState<ReyesExpression>('normal');
  const [showNext, setShowNext] = useState<boolean>(false);
  const [showDialogue, setShowDialogue] = useState<boolean>(true);
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
      setShowDialogue(true);
      setNextAction(() => onDone ?? null);
    },
    []
  );

  // Initialize from checkpoint on mount
  const loadFromCheckpoint = useCallback(
    (prof: CadetProfile) => {
      switch (prof.level1Checkpoint) {
        case Checkpoint.LOBBY_INTRO: {
          if (prof.firstTimeLobby) {
            setStage('lobby_intro');
            say(
              'Welcome, [color=#FFD966]little astronaut![/color] Welcome to the game. Here you will learn how a [color=#5CEEFF]junior astronaut[/color] is trained.',
              'happy',
              true,
              () => {
                const updated: CadetProfile = {
                  ...prof,
                  firstTimeLobby: false,
                  level1Checkpoint: Checkpoint.MISSION_SUIT,
                };
                persistProfile(updated);
                setStage('suit_prompt');
                say(
                  'Your first task: [color=#FFD966]Select your suit[/color].',
                  'normal',
                  false
                );
              }
            );
          } else {
            const updated: CadetProfile = {
              ...prof,
              level1Checkpoint: Checkpoint.MISSION_SUIT,
            };
            persistProfile(updated);
            setStage('suit_prompt');
            say(
              'Your first task: [color=#FFD966]Select your suit[/color].',
              'normal',
              false
            );
          }
          break;
        }
        case Checkpoint.MISSION_SUIT: {
          setStage('suit_prompt');
          say(
            'Your first task: [color=#FFD966]Select your suit[/color].',
            'normal',
            false
          );
          break;
        }
        case Checkpoint.MISSION_BACKPACK: {
          setStage('mission_2');
          say(
            'Now pack your [color=#FFD966]backpack[/color]. Check the manual carefully.',
            'normal',
            false
          );
          break;
        }
        case Checkpoint.MISSION_LAUNCH: {
          setStage('mission_3');
          say(
            "Great! Now it's time for your [color=#5CEEFF]flight lesson[/color]. Let's learn how to launch a rocket.",
            'normal',
            false
          );
          break;
        }
        case Checkpoint.LEVEL_COMPLETE: {
          setStage('level_complete');
          say(
            'Excellent! You completed your [color=#2EE59D]first training[/color].',
            'happy',
            false
          );
          break;
        }
      }
    },
    [persistProfile, say]
  );

  useEffect(() => {
    loadFromCheckpoint(initialProfile);
    // Only run on initial mount or explicit profile reset
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRestartLevel = () => {
    const fresh = createDefaultProfile(profile.username, profile.isGuest);
    persistProfile(fresh);
    loadFromCheckpoint(fresh);
  };

  const handleSuitConfirm = (
    suitId: SuitId,
    expr: ReyesExpression,
    feedback: string
  ) => {
    const suitSpec = SUITS[suitId];
    let nextStars = profile.level1Stars;
    let nextOxygen = profile.resources.oxygen;

    if (suitSpec.tier === 'best') {
      AudioManager.playStar();
      nextStars = Math.min(3, nextStars + 1);
    } else if (suitSpec.tier === 'weak') {
      AudioManager.playWarn();
      nextOxygen = Math.max(0, nextOxygen - 20);
    }

    const updated: CadetProfile = {
      ...profile,
      selectedSuit: suitSpec.title,
      suitResult: suitSpec.tier,
      level1Stars: nextStars,
      level1Checkpoint: Checkpoint.MISSION_BACKPACK,
      resources: {
        ...profile.resources,
        oxygen: nextOxygen,
      },
    };
    persistProfile(updated);
    setStage('mission_1_feedback');

    say(feedback, expr, true, () => {
      setStage('mission_2');
      say(
        'Now pack your [color=#FFD966]backpack[/color]. Check the manual carefully.',
        'normal',
        false
      );
    });
  };

  const handleBackpackDone = (
    counts: Record<string, number>,
    expr: ReyesExpression,
    feedback: string,
    bagResult: string,
    penalties: Partial<Record<ResourceKey, number>>,
    earnedStar: boolean
  ) => {
    const updatedResources = { ...profile.resources };
    (Object.keys(penalties) as ResourceKey[]).forEach((key) => {
      const delta = penalties[key] ?? 0;
      updatedResources[key] = Math.max(
        0,
        Math.min(100, updatedResources[key] + delta)
      );
    });

    const updated: CadetProfile = {
      ...profile,
      bagItems: counts,
      bagResult,
      level1Stars: earnedStar
        ? Math.min(3, profile.level1Stars + 1)
        : profile.level1Stars,
      level1Checkpoint: Checkpoint.MISSION_LAUNCH,
      resources: updatedResources,
    };
    persistProfile(updated);
    setStage('mission_2_feedback');

    say(feedback, expr, true, () => {
      setStage('mission_3');
      say(
        "Great! Now it's time for your [color=#5CEEFF]flight lesson[/color]. Let's learn how to launch a rocket.",
        'normal',
        false
      );
    });
  };

  const handleLaunchComplete = (
    _methodId: LaunchMethodId,
    methodTitle: string,
    launchResult: string,
    expr: ReyesExpression,
    feedback: string,
    fuelDelta: number,
    earnedStar: boolean
  ) => {
    const updated: CadetProfile = {
      ...profile,
      launchMethod: methodTitle,
      launchResult,
      level1Completed: true,
      level1Checkpoint: Checkpoint.LEVEL_COMPLETE,
      level1Stars: earnedStar
        ? Math.min(3, profile.level1Stars + 1)
        : profile.level1Stars,
      resources: {
        ...profile.resources,
        fuel: Math.max(0, Math.min(100, profile.resources.fuel + fuelDelta)),
      },
    };
    persistProfile(updated);
    setStage('mission_3_feedback');

    say(feedback, expr, true, () => {
      setStage('level_complete');
      say(
        'Excellent! You completed your [color=#2EE59D]first training[/color].',
        'happy',
        false
      );
    });
  };

  const handleGoToNextLevel = () => {
    const repairCount =
      typeof profile.bagItems?.repair === 'number'
        ? profile.bagItems.repair
        : profile.repairKits ?? 1;
    const updated: CadetProfile = {
      ...profile,
      cadetLevel: Math.max(profile.cadetLevel, 2),
      repairKits: repairCount,
    };
    persistProfile(updated);
    onStartLevel2(updated);
  };

  return (
    <div className="relative h-full w-full overflow-y-auto overflow-x-hidden bg-[#0A172E]">
      {!bgErr ? (
        <img
          src={HANGAR_BG}
          alt="Astronaut training hangar looking out onto golden hour airfield runway"
          onError={() => setBgErr(true)}
          className="pointer-events-none fixed inset-0 w-full h-full max-w-full object-cover opacity-70"
        />
      ) : (
        <div
          className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#0E2448] via-[#1B2F55] to-[#0A172E] flex items-end justify-end p-8 opacity-90"
          aria-hidden="true"
        >
          <span className="text-4xl opacity-35 select-none">🛰️ ✈️</span>
        </div>
      )}
      <div
        className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#060E1D]/74 via-[#060E1D]/45 to-[#060E1D]/84"
        aria-hidden="true"
      />

      {/* Persistent HUD (Cadet Panel, Resources, Settings, Commander Reyes) */}
      <HUD
        username={profile.username}
        cadetLevel={profile.cadetLevel}
        stars={profile.level1Stars}
        resources={profile.resources}
        dialogueText={dialogueText}
        expression={expression}
        showNextButton={showNext}
        showDialogue={showDialogue}
        onDialogueNext={() => nextAction?.()}
        onRestartLevel={handleRestartLevel}
        onQuitToMenu={onQuitToMenu}
      />

      {/* Active Mission Stage — Offset cleanly away from left HUD / Reyes column */}
      <main className="relative z-20 min-h-full flex items-center justify-center px-3 pt-16 sm:pt-14 md:pt-20 pb-4 sm:pb-4 md:pb-8 sm:pl-[240px] md:pl-[285px] lg:pl-[395px] sm:pr-4 md:pr-8">
        {stage === 'lobby_intro' && (
          <div className="max-w-lg rounded-[14px] border-2 border-[#00D4FF]/65 bg-[#081326]/88 p-6 text-center shadow-xl backdrop-blur-md">
            <ShieldCheck className="w-10 h-10 text-[#5CEEFF] mx-auto mb-3" />
            <h1 className="font-display text-2xl font-bold text-white mb-2">
              Training Hangar · Level 1
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Say hello to Commander Reyes below to start your Junior Astronaut
              training.
            </p>
          </div>
        )}

        {stage === 'suit_prompt' && (
          <div className="rounded-[14px] border-2 border-[#00D4FF]/80 bg-[#081326]/90 p-7 text-center shadow-xl backdrop-blur-md">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5CEEFF] mb-2">
              First Mission
            </p>
            <h2 className="font-display text-2xl font-bold text-white mb-5">
              Pick Your Spacesuit
            </h2>
            <SciFiButton
              variant="gold"
              onClick={() => setStage('mission_1')}
              className="px-8 py-3 text-lg"
            >
              Select the Suit
            </SciFiButton>
          </div>
        )}

        {stage === 'mission_1' && (
          <Mission1Suit onConfirm={handleSuitConfirm} />
        )}

        {stage === 'mission_2' && (
          <Mission2Backpack onDone={handleBackpackDone} />
        )}

        {stage === 'mission_3' && (
          <Mission3Launch
            onReyesInterrupt={(text, expr) => say(text, expr, false)}
            onLaunchComplete={handleLaunchComplete}
          />
        )}

        {(stage === 'mission_1_feedback' ||
          stage === 'mission_2_feedback' ||
          stage === 'mission_3_feedback') && (
          <div className="max-w-md rounded-[14px] border-2 border-[#00D4FF]/65 bg-[#081326]/90 p-6 text-center shadow-xl backdrop-blur-md">
            <p className="font-display text-lg font-bold text-[#FFD966] mb-1">
              Progress Saved!
            </p>
            <p className="text-sm text-slate-200">
              See what Commander Reyes says, then press{' '}
              <span className="font-semibold text-[#FFD966]">Next ▶</span> to
              keep going.
            </p>
          </div>
        )}

        {stage === 'level_complete' && (
          <LevelComplete
            profile={profile}
            onGoToNextLevel={handleGoToNextLevel}
            onReplayLevel1={handleRestartLevel}
          />
        )}

        {stage === 'level_2_preview' && (
          <section className="max-w-xl rounded-[16px] border-2 border-[#00D4FF] bg-[#081326]/92 p-7 text-center shadow-2xl backdrop-blur-md">
            <Compass className="w-11 h-11 text-[#FFD966] mx-auto mb-3" />
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5CEEFF] mb-1">
              Promoted to Level 2
            </p>
            <h2 className="font-display text-3xl font-extrabold text-white mb-3">
              Ready for Orbit!
            </h2>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed mb-6">
              You made it to orbit in your{' '}
              <span className="text-[#FFD966] font-semibold">
                {profile.selectedSuit || 'Standard Suit'}
              </span>{' '}
              with{' '}
              <span className="font-mono-num text-[#2EE59D] font-semibold">
                {profile.resources.oxygen}% Oxygen
              </span>{' '}
              and{' '}
              <span className="font-mono-num text-[#FFB703] font-semibold">
                {profile.resources.fuel}% Fuel
              </span>{' '}
              remaining. Your saved gear and stars are ready for Level 2.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <SciFiButton variant="cyan" onClick={handleRestartLevel}>
                Replay Level 1
              </SciFiButton>
              <SciFiButton variant="gold" onClick={onQuitToMenu}>
                Return to Start Menu
              </SciFiButton>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
