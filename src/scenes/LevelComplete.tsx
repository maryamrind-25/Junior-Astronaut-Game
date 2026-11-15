import React from 'react';
import { ArrowRight, RotateCcw, Star } from 'lucide-react';
import { SciFiButton } from '../components/SciFiButton';
import { CadetProfile } from '../game/types';

interface LevelCompleteProps {
  profile: CadetProfile;
  onGoToNextLevel: () => void;
  onReplayLevel1: () => void;
}

export const LevelComplete: React.FC<LevelCompleteProps> = ({
  profile,
  onGoToNextLevel,
  onReplayLevel1,
}) => {
  const stars = profile.level1Stars;

  return (
    <section
      aria-label="Level 1 Training Complete"
      className="w-full max-w-2xl rounded-[16px] border-[3px] border-[#FFB703] bg-[#081326]/95 p-6 sm:p-8 text-center shadow-[0_0_36px_rgba(255,183,3,0.38)] backdrop-blur-md"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5CEEFF] mb-1">
        Training Complete
      </p>
      <h2 className="font-display text-3xl font-extrabold text-white mb-6">
        Great Job, Astronaut!
      </h2>

      {/* 3 Animated Stars */}
      <div
        className="flex items-center justify-center gap-4 mb-6"
        aria-label={`Total stars earned: ${stars} out of 3`}
      >
        {[0, 1, 2].map((i) => {
          const earned = i < stars;
          return (
            <div
              key={i}
              className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-transform duration-500 ${
                earned
                  ? 'border-[#FFB703] bg-[#3B2600]/80 scale-105 shadow-[0_0_24px_rgba(255,183,3,0.6)]'
                  : 'border-slate-700 bg-slate-900/80 opacity-60'
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <Star
                className={`w-9 h-9 ${
                  earned
                    ? 'fill-[#FFB703] text-[#FFD966]'
                    : 'text-slate-600'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Mission Summary */}
      <div className="rounded-[12px] border border-[#00D4FF]/50 bg-[#0E2240]/85 p-5 text-left space-y-2.5 mb-7">
        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-[#5CEEFF] font-semibold">Suit Choice</span>
          <span className="text-[#FFD966] font-semibold text-right">
            {profile.selectedSuit || 'Standard Suit'} —{' '}
            <span className="capitalize">
              {profile.suitResult || 'Evaluated'}
            </span>
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-[#5CEEFF] font-semibold">Backpack</span>
          <span className="text-[#FFD966] font-semibold text-right">
            {profile.bagResult || 'Packed'}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="text-[#5CEEFF] font-semibold">Launch Method</span>
          <span className="text-[#FFD966] font-semibold text-right">
            {profile.launchMethod || 'Balanced'} —{' '}
            <span>{profile.launchResult || 'Completed'}</span>
          </span>
        </div>

        <div className="pt-2.5 border-t border-slate-700/80 flex items-center justify-between text-base font-bold">
          <span className="text-[#2EE59D]">Total Stars Earned</span>
          <span className="font-mono-num text-[#2EE59D]">{stars} / 3</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <SciFiButton variant="cyan" onClick={onReplayLevel1}>
          <RotateCcw className="w-4 h-4" />
          <span>Replay Level 1</span>
        </SciFiButton>

        <SciFiButton variant="gold" onClick={onGoToNextLevel}>
          <span>Go to Next Level</span>
          <ArrowRight className="w-4 h-4" />
        </SciFiButton>
      </div>
    </section>
  );
};
