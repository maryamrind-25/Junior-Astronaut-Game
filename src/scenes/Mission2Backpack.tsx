import React, { useState } from 'react';
import { AlertTriangle, BookOpen, Minus, Plus } from 'lucide-react';
import { SciFiButton } from '../components/SciFiButton';
import { AudioManager } from '../game/audioManager';
import { BACKPACK_ITEMS, MAX_BACKPACK_CAPACITY } from '../game/gameData';
import { ResourceKey, ReyesExpression } from '../game/types';

interface Mission2BackpackProps {
  onDone: (
    counts: Record<string, number>,
    expr: ReyesExpression,
    feedback: string,
    bagResult: string,
    resourcePenalties: Partial<Record<ResourceKey, number>>,
    earnedStar: boolean
  ) => void;
}

export const Mission2Backpack: React.FC<Mission2BackpackProps> = ({
  onDone,
}) => {
  const [counts, setCounts] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    BACKPACK_ITEMS.forEach((item) => {
      initial[item.id] = 0;
    });
    return initial;
  });
  const [bagFullWarning, setBagFullWarning] = useState(false);
  const [shakeBar, setShakeBar] = useState(false);

  const totalWeight = BACKPACK_ITEMS.reduce(
    (sum, item) => sum + (counts[item.id] ?? 0) * item.weight,
    0
  );

  const handleChangeItem = (id: string, weight: number, delta: number) => {
    AudioManager.stopReyesSpeech();
    const current = counts[id] ?? 0;
    if (delta < 0) {
      if (current <= 0) return;
      setCounts((prev) => ({ ...prev, [id]: current - 1 }));
      setBagFullWarning(false);
      return;
    }

    if (totalWeight + weight > MAX_BACKPACK_CAPACITY) {
      AudioManager.playWarn();
      setBagFullWarning(true);
      setShakeBar(true);
      window.setTimeout(() => setShakeBar(false), 300);
      return;
    }

    setCounts((prev) => ({ ...prev, [id]: current + 1 }));
    setBagFullWarning(false);
  };

  const handleDone = () => {
    const missingImportant: string[] = [];
    const penalties: Partial<Record<ResourceKey, number>> = {};
    let hasUseless = false;

    for (const item of BACKPACK_ITEMS) {
      const qty = counts[item.id] ?? 0;
      if (item.required && qty === 0) {
        missingImportant.push(item.id);
        if (item.resource) {
          penalties[item.resource] = (penalties[item.resource] ?? 0) - 20;
        }
      } else if (!item.required && qty > 0) {
        hasUseless = true;
      }
    }

    if (missingImportant.length > 0) {
      AudioManager.playWarn();
      onDone(
        counts,
        'worried',
        'Oh no, you forgot something important! [color=#FF4D6D]Your resources will be low.[/color]',
        'Missing Essentials',
        penalties,
        false
      );
    } else if (hasUseless) {
      onDone(
        counts,
        'normal',
        'You packed [color=#FFB703]extra weight[/color]. It will slow you.',
        'Extra Weight',
        {},
        false
      );
    } else {
      AudioManager.playStar();
      onDone(
        counts,
        'happy',
        '[color=#2EE59D]Great packing![/color] (+1 Star)',
        'Perfect Packing',
        {},
        true
      );
    }
  };

  const capacityPercent = Math.min(
    100,
    Math.round((totalWeight / MAX_BACKPACK_CAPACITY) * 100)
  );

  return (
    <section
      aria-label="Mission 2 Pack Backpack"
      className="w-full max-w-5xl rounded-[14px] border-2 border-[#00D4FF]/90 bg-[#081326]/92 p-5 sm:p-6 shadow-[0_0_28px_rgba(0,212,255,0.3)] backdrop-blur-md"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Cadet Field Manual */}
        <aside className="lg:col-span-4 rounded-[12px] border-2 border-[#FFB703]/85 bg-[#0C1C38]/92 p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-5 h-5 text-[#FFD966]" />
            <h3 className="font-display text-lg font-bold text-[#FFD966]">
              Cadet Manual
            </h3>
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Required Survival Gear
          </p>
          <ul className="space-y-1.5 text-sm text-slate-100 mb-4">
            {BACKPACK_ITEMS.filter((i) => i.required).map((item) => {
              const packed = (counts[item.id] ?? 0) > 0;
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span
                    className={
                      packed ? 'text-[#2EE59D] font-semibold' : 'text-[#5CEEFF]'
                    }
                  >
                    {packed ? '✓' : '•'} {item.name}
                  </span>
                  <span className="font-mono-num text-xs text-slate-300">
                    {item.weight} kg
                  </span>
                </li>
              );
            })}
          </ul>
          <p className="text-xs text-amber-200/90 leading-relaxed pt-3 border-t border-slate-700/80">
            <strong className="text-[#FF9E64]">Tip:</strong> Leave useless items
            behind so you do not waste capacity!
          </p>
        </aside>

        {/* Right: Backpack Packer */}
        <div className="lg:col-span-8 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="font-display text-2xl font-bold text-white">
              Pack Your Backpack
            </h2>
            <span className="font-mono-num text-sm font-bold text-[#FFD966]">
              {totalWeight} / {MAX_BACKPACK_CAPACITY} kg
            </span>
          </div>

          {/* Capacity Progress Bar */}
          <div
            className={`h-3.5 w-full rounded-full bg-slate-800 border border-slate-600 overflow-hidden mb-2 ${
              shakeBar ? 'animate-shake' : ''
            }`}
          >
            <div
              className={`h-full transition-all duration-200 ease-out ${
                totalWeight >= MAX_BACKPACK_CAPACITY
                  ? 'bg-[#FFB703]'
                  : 'bg-[#00D4FF]'
              }`}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>

          {bagFullWarning && (
            <div
              role="alert"
              className="flex items-center gap-2 text-sm font-bold text-[#FF4D6D] mb-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Bag is full! Remove an item to free up space.</span>
            </div>
          )}

          {/* Item Rows */}
          <div className="space-y-2 mt-2 mb-5 max-h-[340px] overflow-y-auto pr-1">
            {BACKPACK_ITEMS.map((item) => {
              const qty = counts[item.id] ?? 0;
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-[10px] border border-[#1D4E89] bg-[#0B1A33]/90 px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="font-display font-semibold text-sm sm:text-base text-white">
                      {item.name}{' '}
                      <span className="font-mono-num text-xs text-cyan-300">
                        ({item.weight} kg)
                      </span>
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {item.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <SciFiButton
                      variant="danger"
                      onClick={() =>
                        handleChangeItem(item.id, item.weight, -1)
                      }
                      disabled={qty <= 0}
                      aria-label={`Remove ${item.name}`}
                      className="min-h-[38px] min-w-[40px] px-2.5 py-1"
                    >
                      <Minus className="w-4 h-4" />
                    </SciFiButton>

                    <span className="font-mono-num w-8 text-center text-base font-bold text-white">
                      {qty}
                    </span>

                    <SciFiButton
                      variant="green"
                      onClick={() =>
                        handleChangeItem(item.id, item.weight, 1)
                      }
                      aria-label={`Add ${item.name}`}
                      className="min-h-[38px] min-w-[40px] px-2.5 py-1"
                    >
                      <Plus className="w-4 h-4" />
                    </SciFiButton>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end">
            <SciFiButton variant="gold" onClick={handleDone}>
              Done Packing
            </SciFiButton>
          </div>
        </div>
      </div>
    </section>
  );
};
