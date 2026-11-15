import React, { useState } from 'react';
import {
  ArrowRight,
  BookmarkCheck,
  CheckCircle2,
  Home,
  Sprout,
  Star,
} from 'lucide-react';
import { SciFiButton } from '../components/SciFiButton';
import { LEVEL3_PARTS } from '../game/level3Data';
import { CadetProfile } from '../game/types';

interface Level3CheckpointScreenProps {
  partJustCompleted: 1 | 2 | 3 | 4;
  partStars: number;
  profile: CadetProfile;
  onContinueNextPart: () => void;
  onSaveAndBreak: () => void;
  onBackToHome: () => void;
}

export const Level3CheckpointScreen: React.FC<Level3CheckpointScreenProps> = ({
  partJustCompleted,
  partStars,
  profile,
  onContinueNextPart,
  onSaveAndBreak,
  onBackToHome,
}) => {
  const [savedNotice, setSavedNotice] = useState(false);
  const partMeta = LEVEL3_PARTS[partJustCompleted];
  const res = profile.resources;
  const sproutEffective = Math.round((res.food + res.sproutHealth) / 2);

  const handleSaveBreak = () => {
    onSaveAndBreak();
    setSavedNotice(true);
  };

  return (
    <section
      aria-label={`Part ${partJustCompleted} Checkpoint`}
      className="w-full max-w-2xl rounded-[16px] border-[3px] border-[#00D4FF] bg-[#081326]/95 p-6 shadow-2xl backdrop-blur-md text-center"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2EE59D] mb-1">
        Checkpoint Reached · {partMeta.title}
      </p>
      <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mb-3">
        Part {partJustCompleted} Complete!
      </h2>

      {/* Stars Earned in This Part */}
      <div
        className="flex items-center justify-center gap-3 mb-4"
        aria-label={`Stars earned in Part ${partJustCompleted}: ${partStars} of 3`}
      >
        {[0, 1, 2].map((i) => {
          const earned = i < partStars;
          return (
            <div
              key={i}
              className={`w-12 h-12 rounded-xl border-2 flex items-center justify-center ${
                earned
                  ? 'border-[#FFB703] bg-[#3B2600]/80 shadow-[0_0_16px_rgba(255,183,3,0.45)]'
                  : 'border-slate-700 bg-slate-900/70 opacity-60'
              }`}
            >
              <Star
                className={`w-6 h-6 ${
                  earned ? 'fill-[#FFB703] text-[#FFD966]' : 'text-slate-600'
                }`}
              />
            </div>
          );
        })}
      </div>

      {partMeta.partLessonSummary && (
        <div className="mb-4 rounded-xl border border-[#FFB703]/70 bg-[#231908]/85 px-4 py-2.5 text-xs sm:text-sm text-amber-100">
          <strong className="text-[#FFD966]">Part {partJustCompleted} Lesson:</strong>{' '}
          {partMeta.partLessonSummary}
        </div>
      )}

      {/* Meters & Sprout Summary */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
        {[
          ['O2', res.oxygen],
          ['Water', res.water],
          ['Food', res.food],
          ['Power', res.power],
          ['Shield', res.shield],
          ['Health', res.health],
        ].map(([label, val]) => (
          <div
            key={String(label)}
            className="rounded-lg border border-slate-700 bg-[#0D2140]/85 px-2 py-2"
          >
            <p className="text-[11px] text-slate-300">{label}</p>
            <p
              className={`font-mono-num text-sm font-bold ${
                Number(val) >= 70
                  ? 'text-[#2EE59D]'
                  : Number(val) >= 45
                    ? 'text-[#FFD966]'
                    : 'text-[#FF4D6D]'
              }`}
            >
              {val}%
            </p>
          </div>
        ))}
      </div>

      <div className="inline-flex items-center gap-2 rounded-lg border border-emerald-500/60 bg-emerald-950/40 px-4 py-1.5 text-xs sm:text-sm text-emerald-200 mb-5">
        <Sprout className="w-4 h-4 text-[#2EE59D]" />
        <span>
          Sprout Health:{' '}
          <strong className="font-mono-num text-white">
            {sproutEffective}%
          </strong>
        </span>
      </div>

      {savedNotice ? (
        <div className="rounded-xl border-2 border-[#2EE59D] bg-[#0B3328]/80 p-4 space-y-3">
          <div className="flex items-center justify-center gap-2 text-[#2EE59D] font-display font-bold text-base">
            <CheckCircle2 className="w-5 h-5" />
            <span>Progress Saved! You can continue later from here.</span>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <SciFiButton variant="cyan" onClick={onBackToHome}>
              <Home className="w-4 h-4" />
              <span>Back to Home</span>
            </SciFiButton>
            <SciFiButton variant="gold" onClick={onContinueNextPart}>
              <span>Resume Next Part</span>
              <ArrowRight className="w-4 h-4" />
            </SciFiButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-center gap-3">
          <SciFiButton variant="cyan" onClick={handleSaveBreak}>
            <BookmarkCheck className="w-4 h-4" />
            <span>Save &amp; Take a Break</span>
          </SciFiButton>
          <SciFiButton variant="gold" onClick={onContinueNextPart}>
            <span>
              {partJustCompleted < 4
                ? `Continue to Part ${partJustCompleted + 1}`
                : 'Continue to Finale'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </SciFiButton>
        </div>
      )}
    </section>
  );
};
