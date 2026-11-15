import React from 'react';
import { Award, Cpu, RotateCcw, Rocket, Star } from 'lucide-react';
import { SciFiButton } from '../components/SciFiButton';
import { CadetProfile } from '../game/types';

interface Level2CompleteProps {
  profile: CadetProfile;
  starsEarned: number;
  onGoToMarsLanding: () => void;
  onReplayLevel2: () => void;
}

export const Level2Complete: React.FC<Level2CompleteProps> = ({
  profile,
  starsEarned,
  onGoToMarsLanding,
  onReplayLevel2,
}) => {
  const res = profile.resources;
  const sproutEffective = Math.round((res.food + res.sproutHealth) / 2);

  const riskyEvents = profile.level2History.filter((h) => h.wasRisky);

  const lowMeters: { name: string; val: number; advice: string }[] = [];
  if (res.oxygen < 65) {
    lowMeters.push({
      name: 'Oxygen',
      val: res.oxygen,
      advice: 'Patch hull leaks immediately instead of draining reserves.',
    });
  }
  if (res.power < 65) {
    lowMeters.push({
      name: 'Power',
      val: res.power,
      advice: 'Keep solar arrays angled toward the Sun and cut non-essentials in storms.',
    });
  }
  if (res.fuel < 65) {
    lowMeters.push({
      name: 'Fuel',
      val: res.fuel,
      advice: 'Use early gentle orbital maneuvers instead of late high-G braking.',
    });
  }
  if (res.thermal < 65) {
    lowMeters.push({
      name: 'Thermal',
      val: res.thermal,
      advice: 'Use slow barbecue rolls and active cooling before cabin temperatures spike.',
    });
  }
  if (res.health < 65) {
    lowMeters.push({
      name: 'Crew Health',
      val: res.health,
      advice: 'Move into shielded water-walled cores during solar particle events.',
    });
  }

  return (
    <section
      aria-label="Mars Transit Complete"
      className="w-full max-w-3xl rounded-[16px] border-[3px] border-[#FFB703] bg-[#081326]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-md"
    >
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#FF8C42] mb-1">
          Mars Orbit Reached
        </p>
        <h2 className="font-display text-3xl font-extrabold text-white mb-4">
          {starsEarned === 3
            ? 'Ready to Land on Mars!'
            : starsEarned === 2
              ? 'Mars Orbit Achieved'
              : 'Mars Transit Debrief'}
        </h2>

        {/* 3 Animated Stars */}
        <div
          className="flex items-center justify-center gap-4 mb-5"
          aria-label={`Level 2 stars earned: ${starsEarned} out of 3`}
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

      {/* 3 Stars: Junior Astronaut Badge */}
      {starsEarned === 3 && (
        <div className="mb-5 rounded-[12px] border-2 border-[#2EE59D] bg-[#0B3328]/70 p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#FFB703]/20 border-2 border-[#FFB703] flex items-center justify-center shrink-0">
            <Award className="w-8 h-8 text-[#FFD966]" />
          </div>
          <div>
            <p className="font-display text-lg font-bold text-[#2EE59D]">
              Junior Astronaut Badge Earned!
            </p>
            <p className="text-sm text-slate-100">
              All core Mars ship systems and Sprout ({sproutEffective}%) arrived
              strong. Ready to land on Mars!
            </p>
          </div>
        </div>
      )}

      {/* 1 Star / Lesson Ending: ARIA Chain-of-Events Learning Screen */}
      {starsEarned === 1 && (
        <div className="mb-5 rounded-[12px] border border-[#00D4FF]/80 bg-[#0B203D]/90 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Cpu className="w-5 h-5 text-[#5CEEFF]" />
            <h3 className="font-display text-base font-bold text-[#5CEEFF]">
              ARIA · Chain-of-Events Review (No Blame, Only Learning)
            </h3>
          </div>

          {riskyEvents.length > 0 ? (
            <ul className="space-y-2.5 text-sm mb-3">
              {riskyEvents.map((ev, idx) => (
                <li
                  key={idx}
                  className="rounded-lg bg-[#081326]/90 border border-slate-700 p-3"
                >
                  <p className="font-semibold text-[#FFD966]">
                    {ev.sceneId} {ev.sceneTitle}: Chose &ldquo;{ev.choiceLabel}
                    &rdquo; ({ev.outcomeSummary})
                  </p>
                  <p className="text-slate-200 mt-0.5">
                    Real Mars teams: {ev.realMarsTip}
                  </p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-200 mb-3">
              Cumulative resource wear reduced your safety margin on the long
              cruise to Mars.
            </p>
          )}

          {lowMeters.length > 0 && (
            <div className="pt-2 border-t border-slate-700/80 space-y-1 text-xs text-slate-300">
              {lowMeters.map((m) => (
                <p key={m.name}>
                  <strong className="text-rose-300">
                    {m.name} ({m.val}%):
                  </strong>{' '}
                  {m.advice}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Key Mars Arrival Meters Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6 text-center">
        {[
          ['O2', res.oxygen],
          ['Water', res.water],
          ['Food', res.food],
          ['Power', res.power],
          ['Fuel', res.fuel],
          ['Shield', res.shield],
          ['Thermal', res.thermal],
          ['Sprout', sproutEffective],
        ].map(([label, val]) => (
          <div
            key={String(label)}
            className="rounded-[10px] border border-slate-700 bg-[#0D2140]/85 px-3 py-2"
          >
            <p className="text-xs text-slate-300">{label}</p>
            <p
              className={`font-mono-num text-base font-bold ${
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

      {/* Actions */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        <SciFiButton variant="cyan" onClick={onReplayLevel2}>
          <RotateCcw className="w-4 h-4" />
          <span>Replay Level 2</span>
        </SciFiButton>

        <SciFiButton variant="gold" onClick={onGoToMarsLanding}>
          <Rocket className="w-4 h-4" />
          <span>Go to Mars Landing - Level 3</span>
        </SciFiButton>
      </div>
    </section>
  );
};
