import React from 'react';
import { Sprout } from 'lucide-react';

interface SproutPlantProps {
  food: number;
  sproutHealth: number;
  blooming?: boolean;
  trembling?: boolean;
  variant?: 'floating' | 'embedded';
}

export const SproutPlant: React.FC<SproutPlantProps> = ({
  food,
  sproutHealth,
  blooming = false,
  trembling = false,
  variant = 'floating',
}) => {
  const effectiveHealth = Math.round((food + sproutHealth) / 2);
  const isHealthy = blooming || effectiveHealth >= 70;
  const isDrooping = !blooming && effectiveHealth >= 45 && effectiveHealth < 70;
  const statusLabel = blooming
    ? 'Blooming!'
    : isHealthy
      ? 'Growing Well'
      : isDrooping
        ? 'Drooping'
        : 'Wilting';

  const statusColor = isHealthy
    ? 'text-emerald-300'
    : isDrooping
      ? 'text-amber-300'
      : 'text-rose-400';

  const containerClass =
    variant === 'embedded'
      ? `flex flex-col items-center w-full rounded-[10px] border ${
          blooming
            ? 'border-[#FFB703]/80 bg-[#0A203E]/75'
            : trembling
              ? 'border-[#FF4D6D] animate-shake bg-[#24101A]/75'
              : 'border-[#00D4FF]/45 bg-[#081933]/70'
        } px-2 py-1.5`
      : `fixed bottom-3 right-3 z-30 hidden sm:flex flex-col items-center w-36 lg:w-40 rounded-[12px] border-2 ${
          blooming
            ? 'border-[#FFB703] shadow-[0_0_24px_rgba(46,229,157,0.45)]'
            : trembling
              ? 'border-[#FF4D6D] animate-shake'
              : 'border-[#00D4FF]/80'
        } bg-[#06142C]/88 p-2.5 shadow-xl backdrop-blur-md`;

  return (
    <div
      aria-label={`Sprout Mars lettuce plant: ${effectiveHealth}% ${statusLabel}`}
      className={containerClass}
    >
      <div className="w-full flex items-center justify-between text-[11px] mb-0.5">
        <span className="inline-flex items-center gap-1 font-display font-bold text-[#2EE59D]">
          <Sprout className="w-3 h-3" />
          Sprout
        </span>
        <span className={`font-mono-num font-bold ${statusColor}`}>
          {effectiveHealth}%
        </span>
      </div>

      {/* Reactive Botanical Hydroponics Tray */}
      <svg
        viewBox="0 0 120 92"
        className={variant === 'embedded' ? 'w-20 h-12' : 'w-24 h-16'}
        aria-hidden="true"
      >
        {/* Grow Light Bar */}
        <rect x="20" y="4" width="80" height="5" rx="2.5" fill="#1E3A5F" stroke="#5CEEFF" strokeWidth="1" />
        <polygon
          points="26,9 94,9 104,54 16,54"
          fill={isHealthy ? '#2EE59D' : isDrooping ? '#FFB703' : '#FF4D6D'}
          opacity={trembling ? '0.03' : '0.1'}
        />

        {/* Hydroponics Tray */}
        <path d="M22 60 L98 60 L92 82 L28 82 Z" fill="#1E293B" stroke="#00D4FF" strokeWidth="2" />
        <rect x="28" y="55" width="64" height="7" rx="2" fill="#3B2F2F" />

        {/* Lettuce Leaves: Upright if healthy, drooping/bent if low */}
        {isHealthy ? (
          <g className="transition-transform duration-500">
            <path d="M60 56 Q44 30 34 36 Q42 52 60 56 Z" fill="#2EE59D" stroke="#064E3B" strokeWidth="1.5" />
            <path d="M60 56 Q76 30 86 36 Q78 52 60 56 Z" fill="#2EE59D" stroke="#064E3B" strokeWidth="1.5" />
            <path d="M60 56 Q48 20 55 18 Q62 28 60 56 Z" fill="#6EFFC4" stroke="#064E3B" strokeWidth="1.5" />
            <path d="M60 56 Q72 20 65 18 Q58 28 60 56 Z" fill="#34D399" stroke="#064E3B" strokeWidth="1.5" />
            {blooming && (
              <g>
                <circle cx="60" cy="18" r="5.5" fill="#FFD966" stroke="#FFB703" strokeWidth="1.2" />
                <circle cx="46" cy="28" r="3" fill="#8BE9FD" />
                <circle cx="74" cy="28" r="3" fill="#FFD966" />
              </g>
            )}
          </g>
        ) : isDrooping ? (
          <g className="transition-transform duration-500">
            <path d="M60 56 Q38 42 28 52 Q40 58 60 56 Z" fill="#84CC16" stroke="#365314" strokeWidth="1.5" />
            <path d="M60 56 Q82 42 92 52 Q80 58 60 56 Z" fill="#84CC16" stroke="#365314" strokeWidth="1.5" />
            <path d="M60 56 Q46 34 44 44 Q52 50 60 56 Z" fill="#A3E635" stroke="#365314" strokeWidth="1.5" />
            <path d="M60 56 Q74 34 76 44 Q68 50 60 56 Z" fill="#A3E635" stroke="#365314" strokeWidth="1.5" />
          </g>
        ) : (
          <g className="transition-transform duration-500">
            <path d="M60 56 Q34 52 24 62 Q40 62 60 56 Z" fill="#CA8A04" stroke="#422006" strokeWidth="1.5" />
            <path d="M60 56 Q86 52 96 62 Q80 62 60 56 Z" fill="#CA8A04" stroke="#422006" strokeWidth="1.5" />
            <path d="M60 56 Q50 45 42 56 Q52 56 60 56 Z" fill="#EAB308" stroke="#422006" strokeWidth="1.5" />
          </g>
        )}
      </svg>

      <div className="w-full mt-1">
        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              isHealthy
                ? 'bg-[#2EE59D]'
                : isDrooping
                  ? 'bg-[#FFB703]'
                  : 'bg-[#FF4D6D]'
            }`}
            style={{ width: `${effectiveHealth}%` }}
          />
        </div>
        <p className={`text-[11px] font-semibold text-center mt-1 ${statusColor}`}>
          Mars Lettuce · {statusLabel}
        </p>
      </div>
    </div>
  );
};
