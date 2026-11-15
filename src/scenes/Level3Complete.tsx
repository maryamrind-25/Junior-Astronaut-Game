import React, { useState } from 'react';
import {
  Award,
  CheckCircle2,
  Cpu,
  Map,
  RotateCcw,
  Star,
  X,
} from 'lucide-react';
import { SciFiButton } from '../components/SciFiButton';
import { CadetProfile } from '../game/types';

interface Level3CompleteProps {
  profile: CadetProfile;
  starsEarned: number;
  onPlayAgain: () => void;
  onBackToHome: () => void;
}

export const Level3Complete: React.FC<Level3CompleteProps> = ({
  profile,
  starsEarned,
  onPlayAgain,
  onBackToHome,
}) => {
  const [journeyOpen, setJourneyOpen] = useState(false);

  const res = profile.resources;
  const sproutEffective = Math.round((res.food + res.sproutHealth) / 2);
  const riskyEvents = profile.level3History.filter((h) => h.wasRisky);

  const totalStars =
    (profile.level1Stars || 0) + (profile.level2Stars || 0) + starsEarned;

  return (
    <>
      <section
        aria-label="Level 3 Mars Survival Ending"
        className="w-full max-w-3xl rounded-[16px] border-[3px] border-[#FFB703] bg-[#081326]/95 p-6 shadow-2xl backdrop-blur-md"
      >
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#FF8C42] mb-1">
            {starsEarned === 3
              ? 'Star Ending · Mars Outpost Thriving'
              : starsEarned === 2
                ? 'Survivor Ending · Crew Alive on Mars'
                : 'Lesson Ending · Outpost Review'}
          </p>
          <h2 className="font-display text-3xl font-extrabold text-white mb-4">
            {starsEarned === 3
              ? 'Junior Astronaut — Mars Commander!'
              : starsEarned === 2
                ? 'Mars Outpost Survived'
                : 'Mission Learning Debrief'}
          </h2>

          {/* Stars Display */}
          <div
            className="flex items-center justify-center gap-4 mb-5"
            aria-label={`Level 3 stars earned: ${starsEarned} out of 3`}
          >
            {[0, 1, 2].map((i) => {
              const earned = i < starsEarned;
              return (
                <div
                  key={i}
                  className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center ${
                    earned
                      ? 'border-[#FFB703] bg-[#3B2600]/80 shadow-[0_0_20px_rgba(255,183,3,0.55)]'
                      : 'border-slate-700 bg-slate-900/80 opacity-60'
                  }`}
                >
                  <Star
                    className={`w-8 h-8 ${
                      earned
                        ? 'fill-[#FFB703] text-[#FFD966]'
                        : 'text-slate-600'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {starsEarned === 3 && (
          <div className="mb-5 rounded-[12px] border-2 border-[#2EE59D] bg-[#0B3328]/75 p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-[#FFB703]/20 border-2 border-[#FFB703] flex items-center justify-center shrink-0">
              <Award className="w-8 h-8 text-[#FFD966]" />
            </div>
            <div>
              <p className="font-display text-lg font-bold text-[#2EE59D]">
                Badge Earned: Junior Astronaut — Mars Commander!
              </p>
              <p className="text-sm text-slate-100">
                Sprout is blooming inside the glowing Martian outpost. Life support,
                shielding, and crew morale held strong through every crisis!
              </p>
            </div>
          </div>
        )}

        {starsEarned === 2 && (
          <div className="mb-5 rounded-[12px] border border-[#FFB703]/80 bg-[#261B07]/75 p-4 text-sm text-amber-100 text-center">
            The crew made it through the storm alive, though supplies are tired and low.
            Planning wider margins next mission will keep Sprout and your reserves stronger.
          </div>
        )}

        {starsEarned === 1 && (
          <div className="mb-5 rounded-[12px] border border-[#00D4FF]/80 bg-[#0B203D]/90 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Cpu className="w-5 h-5 text-[#5CEEFF]" />
              <h3 className="font-display text-base font-bold text-[#5CEEFF]">
                ARIA · Chain-of-Events Learning Screen (No Blame, Only Learning)
              </h3>
            </div>

            {riskyEvents.length > 0 ? (
              <ul className="space-y-2 text-xs sm:text-sm max-h-44 overflow-y-auto pr-1">
                {riskyEvents.map((ev, idx) => (
                  <li
                    key={idx}
                    className="rounded-lg bg-[#081326]/90 border border-slate-700 p-2.5"
                  >
                    <p className="font-semibold text-[#FFD966]">
                      {ev.sceneId} {ev.sceneTitle}: &ldquo;{ev.choiceLabel}&rdquo; (
                      {ev.outcomeSummary})
                    </p>
                    <p className="text-slate-200 mt-0.5">
                      Real Mars teams: {ev.realMarsTip}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-200">
                Multiple combined crises drained key margins. Prioritizing Air, Power,
                and Thermal protection early helps Mars crews stay ahead.
              </p>
            )}
          </div>
        )}

        {/* Final Meters Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-6 text-center">
          {[
            ['O2', res.oxygen],
            ['Power', res.power],
            ['Food', res.food],
            ['Shield', res.shield],
            ['Sprout', sproutEffective],
            ['Water', res.water],
            ['Health', res.health],
            ['Thermal', res.thermal],
            ['Morale', res.morale],
            ['Science', res.science],
          ].map(([label, val]) => (
            <div
              key={String(label)}
              className="rounded-lg border border-slate-700 bg-[#0D2140]/85 px-2.5 py-2"
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

        <div className="flex flex-wrap items-center justify-center gap-3">
          <SciFiButton variant="cyan" onClick={onPlayAgain}>
            <RotateCcw className="w-4 h-4" />
            <span>Play Again</span>
          </SciFiButton>
          <SciFiButton variant="gold" onClick={() => setJourneyOpen(true)}>
            <Map className="w-4 h-4" />
            <span>Finish Game - See My Mars Journey</span>
          </SciFiButton>
        </div>
      </section>

      {/* Complete Mars Journey Summary Modal */}
      {journeyOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="journey-title"
        >
          <div className="w-full max-w-2xl rounded-[16px] border-2 border-[#FFB703] bg-[#081326] p-6 shadow-2xl max-h-[88vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-[#FF8C42] font-semibold">
                  Cadet Mission Log
                </p>
                <h3
                  id="journey-title"
                  className="font-display text-2xl font-extrabold text-white"
                >
                  {profile.username}&apos;s Mars Journey
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setJourneyOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Close Mars Journey"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm mb-6">
              <div className="rounded-xl border border-cyan-500/50 bg-[#0D2140]/80 p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-[#5CEEFF]">
                    Level 1 · Space Academy Prep
                  </p>
                  <p className="text-xs text-slate-300">
                    Suit: {profile.selectedSuit || 'Standard'} · Launch:{' '}
                    {profile.launchMethod || 'Balanced'}
                  </p>
                </div>
                <span className="font-mono-num font-bold text-[#FFD966]">
                  {profile.level1Stars || 0}/3 ★
                </span>
              </div>

              <div className="rounded-xl border border-amber-500/50 bg-[#0D2140]/80 p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-[#FFD966]">
                    Level 2 · Mars Transit (11 Hazards)
                  </p>
                  <p className="text-xs text-slate-300">
                    Decisions logged: {profile.level2History.length || 0}
                  </p>
                </div>
                <span className="font-mono-num font-bold text-[#FFD966]">
                  {profile.level2Stars || 0}/3 ★
                </span>
              </div>

              <div className="rounded-xl border border-[#2EE59D]/60 bg-[#0D2140]/80 p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-display font-bold text-[#2EE59D]">
                    Level 3 · Mars Landing to Survival (4 Parts + Finale)
                  </p>
                  <p className="text-xs text-slate-300">
                    Finale Priority #1:{' '}
                    {profile.level3FinaleOrder[0]?.toUpperCase() || 'AIR'} ·
                    Sprout Health: {sproutEffective}%
                  </p>
                </div>
                <span className="font-mono-num font-bold text-[#FFD966]">
                  {starsEarned}/3 ★
                </span>
              </div>

              <div className="rounded-xl border border-[#FFB703] bg-[#261B07]/70 p-3.5 flex items-center justify-between">
                <span className="inline-flex items-center gap-2 font-display font-bold text-white">
                  <CheckCircle2 className="w-5 h-5 text-[#2EE59D]" />
                  Total Career Stars Earned
                </span>
                <span className="font-mono-num text-xl font-extrabold text-[#FFD966]">
                  {totalStars} / 9 ★
                </span>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3">
              <SciFiButton variant="cyan" onClick={onPlayAgain}>
                Play Level 3 Again
              </SciFiButton>
              <SciFiButton variant="gold" onClick={onBackToHome}>
                Return to Start Menu
              </SciFiButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
