import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { SuitId } from '../game/types';

interface SpaceSuitArtProps {
  suitId: SuitId;
  active?: boolean;
}

const SUIT_IMAGES: Record<SuitId, { src: string; alt: string; emoji: string }> = {
  scout: {
    src: '/images/suit_scout.jpg',
    alt: 'Scout lightweight pressure suit',
    emoji: '👩‍🚀',
  },
  standard: {
    src: '/images/suit_standard.jpg',
    alt: 'Standard EVA astronaut spacesuit',
    emoji: '🧑‍🚀',
  },
  guardian: {
    src: '/images/suit_guardian.jpg',
    alt: 'Guardian heavy-duty armored EVA spacesuit',
    emoji: '🛡️',
  },
};

export const SpaceSuitArt: React.FC<SpaceSuitArtProps> = ({
  suitId,
  active = false,
}) => {
  const [imgErr, setImgErr] = useState(false);
  const meta = SUIT_IMAGES[suitId];

  const glowClass =
    suitId === 'scout'
      ? 'shadow-[0_0_20px_rgba(255,158,100,0.55)] border-[#FF9E64]'
      : suitId === 'standard'
        ? 'shadow-[0_0_22px_rgba(0,212,255,0.6)] border-[#00D4FF]'
        : 'shadow-[0_0_22px_rgba(255,183,3,0.6)] border-[#FFB703]';

  return (
    <div
      className={`relative w-36 h-36 mx-auto rounded-[12px] overflow-hidden border bg-[#060E1D] transition-all duration-200 ${
        active
          ? `scale-105 ${glowClass}`
          : 'border-slate-700/80 shadow-md'
      }`}
    >
      {!imgErr ? (
        <img
          src={meta.src}
          alt={meta.alt}
          onError={() => setImgErr(true)}
          className="w-full h-full max-w-full object-cover object-top"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-gradient-to-b from-[#0E2A52] via-[#0A1C3A] to-[#060E1D] p-3 text-center">
          <span className="text-3xl leading-none" role="img" aria-label={meta.alt}>
            {meta.emoji}
          </span>
          <Shield className="w-5 h-5 text-cyan-300" />
          <span className="font-display text-xs font-bold text-slate-100 uppercase">
            {suitId} Suit
          </span>
        </div>
      )}
    </div>
  );
};
