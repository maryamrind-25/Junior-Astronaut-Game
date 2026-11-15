import React, { useState } from 'react';
import {
  AlertOctagon,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  GripVertical,
  ShieldAlert,
} from 'lucide-react';
import { SciFiButton } from '../components/SciFiButton';
import { AudioManager } from '../game/audioManager';
import { FINALE_PRIORITIES } from '../game/level3Data';
import { Level3PriorityId } from '../game/types';

interface MarsFinaleRankingProps {
  onConfirmRanking: (order: Level3PriorityId[]) => void;
}

const DEFAULT_ORDER: Level3PriorityId[] = ['food', 'shield', 'power', 'air'];

function formatRankDeltaPreview(id: Level3PriorityId, rankIdx: number): string {
  const spec = FINALE_PRIORITIES[id];
  if (rankIdx === 0) return `Rank 1: ${spec.rank1Summary}`;
  if (rankIdx === 3) return `Rank 4: ${spec.rank4Summary}`;
  if (rankIdx === 1) return `Rank 2: Mild boost (+8%)`;
  return `Rank 3: Minor strain (-8%)`;
}

export const MarsFinaleRanking: React.FC<MarsFinaleRankingProps> = ({
  onConfirmRanking,
}) => {
  const [order, setOrder] = useState<Level3PriorityId[]>(DEFAULT_ORDER);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [animStep, setAnimStep] = useState<number>(-1); // -1 = editing, 0..4 = animating green/red systems

  const moveItem = (fromIdx: number, toIdx: number) => {
    if (animStep >= 0) return;
    if (toIdx < 0 || toIdx >= order.length || fromIdx === toIdx) return;
    AudioManager.playClick();
    const copy = [...order];
    const [removed] = copy.splice(fromIdx, 1);
    copy.splice(toIdx, 0, removed);
    setOrder(copy);
  };

  const handleConfirm = () => {
    if (animStep >= 0) return;
    AudioManager.playThruster();
    setAnimStep(0);

    [0, 1, 2, 3].forEach((step) => {
      window.setTimeout(() => {
        setAnimStep(step + 1);
        if (step <= 1) {
          AudioManager.playStar();
        } else {
          AudioManager.playWarn();
        }
      }, (step + 1) * 520);
    });

    window.setTimeout(() => {
      onConfirmRanking(order);
    }, 2600);
  };

  return (
    <section
      aria-label="Finale: The Storm of Everything"
      className="w-full max-w-2xl rounded-[16px] border-2 border-[#FF4D6D] bg-[#081326]/92 p-5 shadow-2xl backdrop-blur-md"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="inline-flex items-center gap-1.5 text-[#FF859D] font-display font-bold text-xs uppercase tracking-wider">
          <AlertOctagon className="w-4 h-4 animate-pulse" />
          Finale · The Storm of Everything
        </span>
        <span className="font-mono-num text-xs text-rose-200">Scene 17 / 17</span>
      </div>

      <p className="text-xs sm:text-sm text-slate-200 leading-snug mb-3">
        Alarms overlap across every dome while Sprout trembles in the dark.
        Drag or use arrows to rank our 4 outpost priorities from{' '}
        <strong className="text-[#2EE59D]">1 (Highest)</strong> to{' '}
        <strong className="text-[#FF859D]">4 (Lowest)</strong>.
      </p>

      <div className="space-y-2 mb-4">
        {order.map((id, idx) => {
          const spec = FINALE_PRIORITIES[id];
          const isAnimating = animStep >= 0;
          const revealed = animStep > idx;
          const isProtected = idx <= 1;

          const cardStyle = revealed
            ? isProtected
              ? 'border-[#2EE59D] bg-emerald-950/65 shadow-[0_0_16px_rgba(46,229,157,0.45)]'
              : 'border-[#FF4D6D] bg-rose-950/65 shadow-[0_0_16px_rgba(255,77,109,0.45)]'
            : idx === 0
              ? 'border-[#2EE59D]/80 bg-[#0B262B]/90'
              : idx === 3
                ? 'border-[#FF4D6D]/80 bg-[#2B101B]/90'
                : 'border-[#00D4FF]/60 bg-[#0D2140]/90';

          return (
            <div
              key={id}
              draggable={!isAnimating}
              onDragStart={() => setDragIndex(idx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (dragIndex !== null) {
                  moveItem(dragIndex, idx);
                  setDragIndex(null);
                }
              }}
              className={`flex items-center justify-between gap-3 rounded-[10px] border-2 px-3 py-2.5 transition-all duration-300 ${cardStyle} ${
                !isAnimating ? 'cursor-grab active:cursor-grabbing' : ''
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
                <span
                  className={`w-7 h-7 rounded-lg font-display font-extrabold text-sm flex items-center justify-center shrink-0 ${
                    idx === 0
                      ? 'bg-[#2EE59D] text-slate-950'
                      : idx === 3
                        ? 'bg-[#FF4D6D] text-white'
                        : 'bg-[#0E2240] border border-cyan-400/60 text-cyan-200'
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="min-w-0">
                  <p className="font-display font-bold text-sm text-white truncate">
                    {spec.label}
                  </p>
                  <p
                    className={`text-xs font-mono-num ${
                      idx === 0
                        ? 'text-emerald-300'
                        : idx === 3
                          ? 'text-rose-300'
                          : 'text-slate-300'
                    }`}
                  >
                    {formatRankDeltaPreview(id, idx)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {revealed ? (
                  isProtected ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#2EE59D]">
                      <CheckCircle2 className="w-4 h-4" />
                      Saved
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-[#FF859D]">
                      <ShieldAlert className="w-4 h-4" />
                      Strained
                    </span>
                  )
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => moveItem(idx, idx - 1)}
                      disabled={idx === 0 || isAnimating}
                      aria-label={`Move ${spec.label} up`}
                      className="p-1.5 rounded-md border border-slate-600 bg-[#081326] text-slate-200 hover:border-cyan-400 disabled:opacity-35 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveItem(idx, idx + 1)}
                      disabled={idx === 3 || isAnimating}
                      aria-label={`Move ${spec.label} down`}
                      className="p-1.5 rounded-md border border-slate-600 bg-[#081326] text-slate-200 hover:border-cyan-400 disabled:opacity-35 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Clear Rules Legend before Confirm */}
      <div className="rounded-lg border border-slate-700 bg-[#060E1D]/80 px-3 py-2 text-[11px] text-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-1 mb-4">
        <span>• Air #1: O2 +20 · Air #4: O2 -30</span>
        <span>• Power #1: Power +20 · Power #4: Power -30</span>
        <span>• Food #1: Food +20 · Food #4: Food -25</span>
        <span>• Shield #1: Shield +20 · Shield #4: Shield -25</span>
      </div>

      <div className="flex justify-end">
        <SciFiButton
          variant="gold"
          onClick={handleConfirm}
          disabled={animStep >= 0}
        >
          <span>
            {animStep >= 0 ? 'Routing Outpost Power...' : 'Confirm Survival Ranking'}
          </span>
        </SciFiButton>
      </div>
    </section>
  );
};
