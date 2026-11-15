import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Cpu,
  Navigation,
  Radio,
  Wrench,
} from 'lucide-react';
import { SciFiButton } from '../components/SciFiButton';
import { MarsHazardChoice, MarsHazardSceneSpec } from '../game/level2Data';
import { CadetProfile } from '../game/types';

interface MarsHazardSceneProps {
  scene: MarsHazardSceneSpec;
  profile: CadetProfile;
  phase: 'cruise' | 'encounter' | 'decision' | 'lesson';
  cruiseSecondsLeft?: number;
  isTryingFix?: boolean;
  chosenOutcomeSummary: string;
  onSkipCruise: () => void;
  onTryFixHazard: () => void;
  onSelectChoice: (choice: MarsHazardChoice) => void;
  onNextScene: () => void;
}

export const MarsHazardScene: React.FC<MarsHazardSceneProps> = ({
  scene,
  phase,
  cruiseSecondsLeft = 0,
  isTryingFix = false,
  chosenOutcomeSummary,
  onSkipCruise,
  onTryFixHazard,
  onSelectChoice,
  onNextScene,
}) => {
  // 1. Cruise Phase (5–10s flight between hazards, unobstructed cockpit window)
  if (phase === 'cruise') {
    return (
      <section
        aria-label="Cruising toward Mars"
        className="w-full max-w-xl mt-auto mb-1 rounded-[14px] border border-[#00D4FF]/70 bg-[#081326]/78 px-4 py-3 shadow-xl backdrop-blur-md"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Navigation className="w-4 h-4 text-[#2EE59D] shrink-0" />
            <div className="min-w-0">
              <p className="font-display text-sm font-bold text-white truncate">
                Cruising Toward Mars · Sector {scene.index} of 11
              </p>
              <p className="text-xs text-cyan-200 font-mono-num">
                Next checkpoint in {cruiseSecondsLeft}s
              </p>
            </div>
          </div>

          <SciFiButton
            variant="cyan"
            onClick={onSkipCruise}
            className="min-h-[36px] px-3.5 py-1 text-xs"
          >
            Ahead ▶
          </SciFiButton>
        </div>
      </section>
    );
  }

  // 2. Physical Encounter Phase — waits for the user to inspect & try fixing the hazard!
  if (phase === 'encounter') {
    return (
      <section
        aria-label={`${scene.numberLabel} physical hazard encounter`}
        className="w-full max-w-2xl mt-auto mb-1 rounded-[14px] border-2 border-[#FF4D6D]/85 bg-[#081326]/84 px-4 py-3.5 shadow-2xl backdrop-blur-md"
      >
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="inline-flex items-center gap-1.5 text-[#FF859D] font-display font-bold text-xs uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4" />
            {scene.numberLabel} · {scene.title}
          </span>
          <span className="font-mono-num text-xs text-slate-300">
            {scene.index} / 11
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-100 leading-snug mb-2">
          {scene.narration}
        </p>

        <div className="rounded-lg border border-[#FFB703]/70 bg-[#1B170A]/85 px-3 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2 min-w-0">
            <Wrench className="w-4 h-4 text-[#FFD966] shrink-0 mt-0.5" />
            <p className="text-xs sm:text-sm font-medium text-amber-50 leading-snug">
              {isTryingFix
                ? 'Running action on spacecraft systems...'
                : scene.fixPrompt}
            </p>
          </div>

          <SciFiButton
            variant="gold"
            onClick={onTryFixHazard}
            disabled={isTryingFix}
            className="min-h-[38px] px-4 py-1.5 text-xs shrink-0"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>{isTryingFix ? 'Testing...' : scene.fixButtonLabel}</span>
          </SciFiButton>
        </div>
      </section>
    );
  }

  // 3. Compact Bottom Console for Decisions (A/B/C) & Lesson Card — leaves cockpit window open!
  return (
    <section
      aria-label={`${scene.numberLabel} - ${scene.title}`}
      className="w-full max-w-3xl mt-auto mb-1 rounded-[14px] border-2 border-[#FF8C42]/75 bg-[#091224]/86 p-4 shadow-2xl backdrop-blur-md"
    >
      {/* Compact Header & Narration */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#FFB703]">
            {scene.numberLabel} ({scene.index}/11)
          </span>
          <span className="text-slate-500">·</span>
          <h2 className="font-display text-base sm:text-lg font-extrabold text-white">
            {scene.title}
          </h2>
        </div>
        <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00D4FF] to-[#FF6B35]"
            style={{ width: `${Math.round((scene.index / 11) * 100)}%` }}
          />
        </div>
      </div>

      {phase === 'decision' ? (
        <div className="mb-2.5 rounded-lg border border-emerald-400/50 bg-emerald-950/40 px-3 py-1.5 flex items-center gap-2 text-xs text-emerald-100">
          <CheckCircle2 className="w-4 h-4 text-[#2EE59D] shrink-0" />
          <span>{scene.fixAttemptResult}</span>
        </div>
      ) : (
        <p className="text-xs sm:text-sm text-slate-200 leading-snug mb-2.5">
          {scene.narration}
        </p>
      )}

      {/* Compact ARIA / Delayed MC Telemetry Strip */}
      {scene.ariaReport && (
        <div className="mb-2.5 rounded-lg border border-[#00D4FF]/60 bg-[#0B2240]/85 px-3 py-1.5 flex items-center gap-2 text-xs">
          <Cpu className="w-4 h-4 text-[#5CEEFF] shrink-0" />
          <span className="font-bold text-[#5CEEFF] shrink-0">ARIA:</span>
          <span className="text-slate-100 font-mono-num truncate">
            {scene.ariaReport}
          </span>
        </div>
      )}

      {scene.mcDelayedMessage && (
        <div className="mb-2.5 rounded-lg border border-[#FFB703]/70 bg-[#2A1A08]/85 px-3 py-1.5 flex items-center gap-2 text-xs">
          <Radio className="w-4 h-4 text-[#FFD966] shrink-0" />
          <span className="font-bold text-[#FFD966] shrink-0">
            Delayed ({scene.mcDelayedMessage.delayMinutes}m ago):
          </span>
          <span className="text-amber-50 truncate">
            {scene.mcDelayedMessage.message}
          </span>
        </div>
      )}

      {/* Compact 3-Column Choice Buttons (A, B, C) OR Lesson Card */}
      {phase === 'decision' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {scene.choices.map((choice) => (
            <button
              key={choice.letter}
              type="button"
              onClick={() => onSelectChoice(choice)}
              className="flex flex-col justify-between text-left rounded-[10px] border-2 border-[#00D4FF]/65 bg-[#0D2140]/92 hover:border-[#FFB703] hover:bg-[#14305B] hover:-translate-y-0.5 active:scale-[0.99] transition-all duration-150 p-3 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-6 h-6 rounded-md bg-[#FFB703]/20 border border-[#FFB703] text-[#FFD966] font-display font-bold text-xs flex items-center justify-center shrink-0">
                    {choice.letter}
                  </span>
                  <h3 className="font-display text-sm font-bold text-white leading-tight">
                    {choice.label}
                  </h3>
                </div>
              </div>
              <div className="space-y-0.5 text-[11px] sm:text-xs mt-1.5 pt-1.5 border-t border-slate-700/70">
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
      ) : (
        <div className="rounded-[12px] border-2 border-[#FFB703] bg-[#0D1E3B]/95 p-3.5 shadow-xl">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 font-display text-sm font-bold text-[#FFD966]">
              <BookOpen className="w-4 h-4" />
              Lesson: Mars Science
            </span>
            <span className="font-mono-num text-xs text-cyan-200">
              {chosenOutcomeSummary}
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-100 leading-relaxed mb-3">
            {scene.lesson}
          </p>

          <div className="flex justify-end">
            <SciFiButton
              variant="gold"
              onClick={onNextScene}
              className="min-h-[38px] px-4 py-1.5 text-sm"
            >
              <span>
                {scene.index < 11 ? 'Next Hazard' : 'Finish Mars Transit'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </SciFiButton>
          </div>
        </div>
      )}
    </section>
  );
};
