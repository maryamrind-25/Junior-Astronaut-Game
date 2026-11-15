import React, { useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { SciFiButton } from '../components/SciFiButton';
import { SpaceSuitArt } from '../components/SpaceSuitArt';
import { AudioManager } from '../game/audioManager';
import { SUITS } from '../game/gameData';
import { ReyesExpression, SuitId } from '../game/types';

interface Mission1SuitProps {
  onConfirm: (suitId: SuitId, expr: ReyesExpression, feedback: string) => void;
}

const SUIT_ORDER: SuitId[] = ['scout', 'standard', 'guardian'];

export const Mission1Suit: React.FC<Mission1SuitProps> = ({ onConfirm }) => {
  const [selectedId, setSelectedId] = useState<SuitId | null>(null);
  const [hoveredId, setHoveredId] = useState<SuitId | null>(null);

  const selectedSpec = selectedId ? SUITS[selectedId] : null;

  const handleSelect = (id: SuitId) => {
    AudioManager.stopReyesSpeech();
    AudioManager.playClick();
    setSelectedId(id);
  };

  const handleConfirm = () => {
    if (!selectedId) return;
    const d = SUITS[selectedId];
    onConfirm(selectedId, d.expr, d.feedback);
  };

  return (
    <section
      aria-label="Level 1 Suit Fitting"
      className="w-full max-w-4xl rounded-[14px] border-2 border-[#00D4FF]/90 bg-[#081326]/92 p-5 sm:p-6 shadow-[0_0_28px_rgba(0,212,255,0.3)] backdrop-blur-md"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5CEEFF]">
            Mission 1 of 3
          </p>
          <h2 className="font-display text-2xl font-bold text-white">
            Pick Your Spacesuit
          </h2>
        </div>
        <span className="text-xs text-slate-300">
          Tap a suit to check how it works in space
        </span>
      </div>

      {/* 3 Suit Cards Side-by-Side */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {SUIT_ORDER.map((id) => {
          const suit = SUITS[id];
          const isSelected = selectedId === id;
          const isHovered = hoveredId === id;

          return (
            <button
              key={id}
              type="button"
              onClick={() => handleSelect(id)}
              onMouseEnter={() => setHoveredId(id)}
              onMouseLeave={() => setHoveredId(null)}
              aria-pressed={isSelected}
              className={[
                'group relative flex flex-col items-center rounded-[12px] p-4 text-center cursor-pointer',
                'transition-all duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300',
                isSelected
                  ? 'border-[3px] border-[#FFB703] bg-[#18325C]/95 scale-[1.03] shadow-[0_0_22px_rgba(255,183,3,0.45)]'
                  : isHovered
                    ? 'border-[2px] border-[#5CEEFF] bg-[#122B4F]/92 scale-[1.03] shadow-[0_0_18px_rgba(92,238,255,0.35)]'
                    : 'border-2 border-[#00D4FF]/65 bg-[#0E2240]/90',
              ].join(' ')}
            >
              <SpaceSuitArt suitId={id} active={isSelected || isHovered} />

              <h3 className="font-display text-lg font-bold text-white mt-3">
                {suit.title}
              </h3>
              <p className="text-xs text-cyan-200/85 mt-0.5">
                O2: {suit.o2Label} · Mobility: {suit.mobilityLabel}
              </p>

              {isSelected && (
                <div className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#FFD966]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Selected</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Suit Info Box */}
      <div className="rounded-[10px] border border-[#00D4FF]/60 bg-[#09162B]/90 p-4 mb-5 min-h-[108px]">
        {selectedSpec ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <h4 className="font-display text-base font-bold text-[#FFD966]">
                {selectedSpec.title}
              </h4>
              <p className="font-mono-num text-xs text-[#5CEEFF]">
                Mass: {selectedSpec.massLabel} | O2: {selectedSpec.o2Label} |
                Mobility: {selectedSpec.mobilityLabel} | Protection:{' '}
                {selectedSpec.protectionLabel}
              </p>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {selectedSpec.special}
            </p>
          </div>
        ) : (
          <p className="text-sm text-[#9BB8D3]">
            Click any suit above to inspect its stats and special features.
          </p>
        )}
      </div>

      {/* Confirm Button */}
      <div className="flex justify-end">
        <SciFiButton
          variant="gold"
          disabled={!selectedId}
          onClick={handleConfirm}
        >
          Confirm Suit
        </SciFiButton>
      </div>
    </section>
  );
};
