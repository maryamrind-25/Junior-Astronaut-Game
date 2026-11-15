import React, { useEffect, useState } from 'react';
import { RotateCw, Smartphone } from 'lucide-react';

interface ViewportShellProps {
  children: React.ReactNode;
}

const STAGE_WIDTH = 1280;
const STAGE_HEIGHT = 720;

export const ViewportShell: React.FC<ViewportShellProps> = ({ children }) => {
  const [stageScale, setStageScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      // Never stretch larger than 1280x720 on big monitors; scale down smoothly if a desktop window is narrower than 1280x720
      const fitScale = Math.min(1, vw / STAGE_WIDTH, vh / STAGE_HEIGHT);
      setStageScale(Number(fitScale.toFixed(4)));
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    window.addEventListener('orientationchange', updateScale);
    return () => {
      window.removeEventListener('resize', updateScale);
      window.removeEventListener('orientationchange', updateScale);
    };
  }, []);

  return (
    <>
      {/* Phone Portrait Lock Screen (Shown only when phone is held vertically) */}
      <div
        className="rotate-phone-screen"
        role="alert"
        aria-live="assertive"
      >
        <div className="relative mb-6 flex items-center justify-center">
          <div className="w-24 h-24 rounded-full border-2 border-[#00D4FF]/60 bg-[#06142C]/90 flex items-center justify-center shadow-[0_0_28px_rgba(0,212,255,0.35)]">
            <Smartphone className="w-12 h-12 text-[#5CEEFF] animate-rotate-phone" />
          </div>
          <RotateCw className="w-6 h-6 text-[#FFD966] absolute -top-1 -right-1 animate-spin" style={{ animationDuration: '4s' }} />
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#5CEEFF] mb-2">
          Landscape Mode Required
        </p>
        <h1 className="font-display text-2xl font-extrabold text-white max-w-xs leading-snug">
          Please rotate your phone to Landscape to play
        </h1>
        <p className="mt-3 text-sm text-slate-300 max-w-xs leading-relaxed">
          Turn your device sideways so the mission controls, Mars terrain, and Commander Reyes fit your screen.
        </p>
      </div>

      {/* Main Game Viewport Wrapper: Black Surround on PC / Full Screen on Landscape Phone */}
      <div className="game-wrapper">
        <div
          className="game-stage"
          style={{ '--stage-scale': stageScale } as React.CSSProperties}
        >
          {children}
        </div>
      </div>
    </>
  );
};
