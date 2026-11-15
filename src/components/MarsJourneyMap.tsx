import React from 'react';
import { Check, Rocket } from 'lucide-react';

interface MarsJourneyMapProps {
  currentPart: 1 | 2 | 3 | 4 | 5; // 1=Landing, 2=First Days, 3=Under Pressure, 4=Crisis, 5=Finale/Done
  stepIndex: number; // 0..18 (1..17 active)
  isComplete?: boolean;
}

const JOURNEY_NODES = [
  { id: 'earth', label: 'Earth', idx: 0 },
  { id: 'transit', label: 'Transit', idx: 1 },
  { id: 'landing', label: 'Landing', idx: 2 },
  { id: 'first_days', label: 'Outpost First Days', idx: 3 },
  { id: 'pressure', label: 'Under Pressure', idx: 4 },
  { id: 'crisis', label: 'Crisis', idx: 5 },
  { id: 'finale', label: 'Finale', idx: 6 },
];

export const MarsJourneyMap: React.FC<MarsJourneyMapProps> = ({
  currentPart,
  stepIndex,
  isComplete = false,
}) => {
  // Earth (0) & Transit (1) completed from Level 1 & Level 2; Landing = 2, First Days = 3, Under Pressure = 4, Crisis = 5, Finale = 6
  const activeNodeIdx = isComplete ? 6 : currentPart + 1;
  const clampedScene = Math.max(1, Math.min(17, stepIndex || 1));
  const progressPct = isComplete ? 100 : Math.round((clampedScene / 17) * 100);
  const rocketTrackPct = Math.round(
    (activeNodeIdx / (JOURNEY_NODES.length - 1)) * 100
  );

  return (
    <div
      aria-label="Mars Journey Map and Progress"
      className="fixed top-[124px] md:top-2.5 left-4 right-4 md:left-[262px] md:right-[142px] z-25 rounded-[10px] border border-[#00D4FF]/65 bg-[#081326]/82 px-3 py-1.5 shadow-lg backdrop-blur-md"
    >
      {/* Top Row: Journey Nodes + Moving Rocket Marker */}
      <div className="relative pt-0.5 pb-1">
        {/* Track Line */}
        <div className="hidden sm:block absolute left-5 right-5 top-[11px] h-0.5 bg-slate-700/80">
          <div
            className="h-full bg-gradient-to-r from-[#2EE59D] via-[#00D4FF] to-[#FF8C42] transition-all duration-500"
            style={{ width: `${rocketTrackPct}%` }}
          />
          {/* Small Moving Rocket Dot */}
          <div
            className="absolute -top-2 -translate-x-1/2 transition-all duration-500 flex items-center justify-center w-5 h-5 rounded-full bg-[#FFB703] text-slate-950 shadow-[0_0_10px_rgba(255,183,3,0.9)]"
            style={{ left: `${rocketTrackPct}%` }}
            title="Current Spacecraft / Outpost Position"
          >
            <Rocket className="w-3 h-3" />
          </div>
        </div>

        <div className="relative z-10 flex items-center justify-between gap-1 overflow-x-auto no-scrollbar">
          {JOURNEY_NODES.map((node) => {
            const done = isComplete
              ? true
              : node.idx < activeNodeIdx;
            const current = !isComplete && node.idx === activeNodeIdx;

            return (
              <div
                key={node.id}
                className="flex flex-col items-center shrink-0 min-w-[44px]"
              >
                <div
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all ${
                    done
                      ? 'bg-[#2EE59D] border-[#2EE59D] text-slate-950'
                      : current
                        ? 'bg-[#FF8C42] border-[#FFD966] text-slate-950 shadow-[0_0_10px_rgba(255,140,66,0.95)] scale-110'
                        : 'bg-[#0E2240] border-slate-600 text-slate-400'
                  }`}
                >
                  {done ? (
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  ) : (
                    <span>{node.idx + 1}</span>
                  )}
                </div>
                <span
                  className={`mt-0.5 text-[9px] whitespace-nowrap font-semibold ${
                    current
                      ? 'text-[#FFD966]'
                      : done
                        ? 'text-emerald-300'
                        : 'text-slate-400'
                  }`}
                >
                  {node.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Row: Scene X of 17 Progress Bar */}
      <div className="flex items-center gap-2.5 pt-1 border-t border-slate-800/80">
        <span className="text-[11px] font-display font-bold text-white whitespace-nowrap">
          Mars Landing to Survival -{' '}
          {isComplete ? 'Complete!' : `Scene ${clampedScene} of 17`}
        </span>
        <div className="flex-1 h-1.5 rounded-full bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00D4FF] via-[#FF8C42] to-[#2EE59D] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="font-mono-num text-[11px] font-bold text-[#5CEEFF]">
          {progressPct}%
        </span>
      </div>
    </div>
  );
};
