import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, ShieldAlert, Timer, Wrench } from 'lucide-react';
import { AudioManager } from '../game/audioManager';
import { SciFiButton } from './SciFiButton';

export interface LeakGameResult {
  passed: boolean;
  oxygenDelta: number;
  repairKitDelta: number;
  summary: string;
}

interface FixLeakMiniGameProps {
  repairKitsAvailable: number;
  onComplete: (result: LeakGameResult) => void;
}

const LEAK_SPOTS = [
  { id: 0, label: 'Upper Seam', left: '20%', top: '30%' },
  { id: 1, label: 'Valve Joint', left: '54%', top: '58%' },
  { id: 2, label: 'Lower Pipe', left: '78%', top: '28%' },
];

export const FixLeakMiniGame: React.FC<FixLeakMiniGameProps> = ({
  repairKitsAvailable,
  onComplete,
}) => {
  const [secondsLeft, setSecondsLeft] = useState(15);
  const [patchedIds, setPatchedIds] = useState<number[]>([]);
  const [doneResult, setDoneResult] = useState<LeakGameResult | null>(null);

  useEffect(() => {
    if (doneResult) return;

    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          AudioManager.playWarn();
          setDoneResult({
            passed: false,
            oxygenDelta: -15,
            repairKitDelta: 0,
            summary: 'Time Expired · O2 -15',
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [doneResult]);

  const handlePatchHole = (id: number) => {
    if (doneResult || patchedIds.includes(id)) return;
    AudioManager.playClick();
    const next = [...patchedIds, id];
    setPatchedIds(next);

    if (next.length >= LEAK_SPOTS.length) {
      AudioManager.playStar();
      const usedKit = repairKitsAvailable > 0 ? -1 : 0;
      const o2Loss = repairKitsAvailable > 0 ? 0 : -4;
      setDoneResult({
        passed: true,
        oxygenDelta: o2Loss,
        repairKitDelta: usedKit,
        summary:
          repairKitsAvailable > 0
            ? 'All 3 Leaks Sealed! · O2 Stable, Repair Kit -1'
            : 'All 3 Leaks Sealed (Improvised) · O2 -4',
      });
    }
  };

  return (
    <section
      aria-label="Mini-Game 2: Fix The Habitat Leak"
      className="w-full max-w-2xl rounded-[14px] border-2 border-[#FF4D6D] bg-[#081326]/92 p-4 shadow-2xl backdrop-blur-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#FF859D]">
            Mini-Game 2 · Emergency Repair
          </p>
          <h2 className="font-display text-lg font-extrabold text-white flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#FFB703]" />
            Patch All 3 Habitat Wall Leaks!
          </h2>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-mono-num">
          <span className="rounded-md bg-[#0E2240] border border-cyan-500/60 px-2.5 py-1 text-cyan-200">
            Patched: {patchedIds.length}/3
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1 font-bold ${
              secondsLeft <= 5
                ? 'bg-rose-950/70 border-rose-400 text-rose-300'
                : 'bg-amber-950/50 border-amber-400 text-amber-200'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            {secondsLeft}s
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-300 mb-3">
        Air is escaping from 3 holes in the Mars outpost wall! Tap each leaking
        spot quickly to seal it before 15 seconds run out.
      </p>

      {/* Outpost Bulkhead Wall Surface */}
      <div className="relative h-60 w-full rounded-xl border-2 border-slate-600 bg-gradient-to-br from-[#1C2A42] via-[#131E33] to-[#0D1524] overflow-hidden shadow-inner">
        {/* Metallic Panel Seams & Rivets */}
        <div className="absolute inset-0 opacity-30 pointer-events-none">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-400" />
          <div className="absolute top-0 bottom-0 left-1/3 w-0.5 bg-slate-400" />
          <div className="absolute top-0 bottom-0 left-2/3 w-0.5 bg-slate-400" />
        </div>

        {/* 3 Clickable Leaking Holes */}
        {LEAK_SPOTS.map((spot) => {
          const isPatched = patchedIds.includes(spot.id);
          return (
            <button
              key={spot.id}
              type="button"
              onClick={() => handlePatchHole(spot.id)}
              disabled={isPatched || Boolean(doneResult)}
              style={{ left: spot.left, top: spot.top }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer transition-transform ${
                isPatched ? 'scale-100 cursor-default' : 'hover:scale-110 active:scale-95'
              }`}
              aria-label={
                isPatched ? `${spot.label} patched` : `Tap to patch ${spot.label}`
              }
            >
              {isPatched ? (
                <div className="w-16 h-14 rounded-lg border-2 border-[#2EE59D] bg-slate-600/95 shadow-[0_0_16px_rgba(46,229,157,0.55)] flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-[#2EE59D]" />
                </div>
              ) : (
                <div className="relative flex items-center justify-center">
                  {/* Air Bubbles Streaming Out */}
                  <span className="absolute -top-6 left-2 w-2.5 h-2.5 rounded-full bg-cyan-200/80 animate-ping" />
                  <span className="absolute -top-9 right-1 w-2 h-2 rounded-full bg-white/75 animate-bounce" />
                  <div className="w-14 h-14 rounded-full bg-black border-[3px] border-[#FF4D6D] shadow-[0_0_20px_rgba(255,77,109,0.75)] flex items-center justify-center animate-pulse">
                    <ShieldAlert className="w-6 h-6 text-[#FF859D]" />
                  </div>
                </div>
              )}
              <span
                className={`mt-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                  isPatched
                    ? 'bg-emerald-950/90 text-emerald-300'
                    : 'bg-rose-950/90 text-rose-200'
                }`}
              >
                {isPatched ? 'Sealed!' : `Tap: ${spot.label}`}
              </span>
            </button>
          );
        })}

        {/* Finish Overlay */}
        {doneResult && (
          <div className="absolute inset-0 bg-[#081326]/86 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
            <p
              className={`font-display text-xl font-extrabold mb-1 ${
                doneResult.passed ? 'text-[#2EE59D]' : 'text-[#FF859D]'
              }`}
            >
              {doneResult.passed
                ? 'All 3 Leaks Patched in Time!'
                : 'Out of Time — Cabin Air Lost!'}
            </p>
            <p className="font-mono-num text-xs sm:text-sm text-cyan-200 mb-4">
              {doneResult.summary}
            </p>
            <SciFiButton
              variant="gold"
              onClick={() => onComplete(doneResult)}
            >
              <span>Continue to Scene 5.3</span>
              <ArrowRight className="w-4 h-4" />
            </SciFiButton>
          </div>
        )}
      </div>
    </section>
  );
};
