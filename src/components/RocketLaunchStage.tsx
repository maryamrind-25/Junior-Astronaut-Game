import React, { useEffect, useRef } from 'react';
import { LaunchMethodId } from '../game/types';

interface RocketLaunchStageProps {
  countdown: number;
  isCountingDown: boolean;
  isLaunching: boolean;
  climbDurationSec: number;
  selectedMethod: LaunchMethodId | '';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  maxLife: number;
  kind: 'fire' | 'smoke';
}

export const RocketLaunchStage: React.FC<RocketLaunchStageProps> = ({
  countdown,
  isCountingDown,
  isLaunching,
  climbDurationSec,
  selectedMethod,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number | null>(null);

  const isRisky = selectedMethod === 'risky';
  const emitting = isCountingDown || isLaunching;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Emit exhaust fire and smoke when active
      if (emitting) {
        const nozzleX = w * 0.5;
        const nozzleY = isLaunching ? h * 0.58 : h * 0.78;
        const fireCount = isRisky ? 6 : 3;
        const smokeCount = isRisky ? 5 : 2;

        for (let i = 0; i < fireCount; i++) {
          particlesRef.current.push({
            x: nozzleX + (Math.random() - 0.5) * (isRisky ? 26 : 16),
            y: nozzleY,
            vx: (Math.random() - 0.5) * (isRisky ? 55 : 28),
            vy: 60 + Math.random() * (isRisky ? 110 : 75),
            radius: 5 + Math.random() * (isRisky ? 9 : 6),
            life: 0,
            maxLife: 0.35 + Math.random() * 0.25,
            kind: 'fire',
          });
        }

        for (let i = 0; i < smokeCount; i++) {
          particlesRef.current.push({
            x: nozzleX + (Math.random() - 0.5) * (isRisky ? 42 : 24),
            y: nozzleY + 10,
            vx: (Math.random() - 0.5) * (isRisky ? 95 : 50),
            vy: 25 + Math.random() * 45,
            radius: 10 + Math.random() * (isRisky ? 16 : 10),
            life: 0,
            maxLife: 0.8 + Math.random() * 0.65,
            kind: 'smoke',
          });
        }
      }

      // Update & draw particles
      const alive: Particle[] = [];
      for (const p of particlesRef.current) {
        p.life += dt;
        if (p.life >= p.maxLife) continue;
        const t = p.life / p.maxLife;
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (p.kind === 'fire') {
          const alpha = 1 - t;
          const r = p.radius * (1 - t * 0.45);
          ctx.beginPath();
          ctx.arc(p.x, p.y, Math.max(1, r), 0, Math.PI * 2);
          ctx.fillStyle =
            t < 0.4
              ? `rgba(255, 228, 120, ${alpha})`
              : `rgba(255, 102, 26, ${alpha * 0.9})`;
          ctx.fill();
        } else {
          const alpha = (1 - t) * (isRisky ? 0.58 : 0.38);
          const r = p.radius * (1 + t * 1.4);
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(203, 213, 225, ${alpha})`;
          ctx.fill();
        }
        alive.push(p);
      }
      particlesRef.current = alive;

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [emitting, isLaunching, isRisky]);

  const shakeIntensity = !isCountingDown
    ? 0
    : (countdown > 5 ? 2 : 5) * (isRisky ? 2.1 : 1);

  return (
    <div className="relative flex flex-col items-center justify-between w-full h-full min-h-[430px] rounded-[14px] border-2 border-[#00D4FF]/80 bg-[#060F20]/90 shadow-[0_0_24px_rgba(0,212,255,0.22)] overflow-hidden p-5">
      {/* Subtle Night Sky Stars */}
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            'radial-gradient(1.5px 1.5px at 20% 20%, #fff, transparent), radial-gradient(1.5px 1.5px at 78% 15%, #5CEEFF, transparent), radial-gradient(1px 1px at 42% 35%, #fff, transparent), radial-gradient(1.5px 1.5px at 85% 48%, #FFD966, transparent), radial-gradient(1px 1px at 14% 58%, #fff, transparent)',
        }}
      />

      {/* Big Countdown Display */}
      <div className="relative z-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300/80">
          {isLaunching
            ? 'Liftoff In Progress'
            : isCountingDown
              ? 'Ignition Countdown'
              : 'Launch Pad Ready'}
        </p>
        <div
          className={`font-mono-num text-6xl sm:text-7xl font-bold leading-none mt-1 transition-colors ${
            isCountingDown && countdown <= 5
              ? 'text-[#FF4D6D] drop-shadow-[0_0_18px_rgba(255,77,109,0.8)]'
              : isLaunching
                ? 'text-[#2EE59D] drop-shadow-[0_0_18px_rgba(46,229,157,0.8)]'
                : 'text-[#FFD966] drop-shadow-[0_0_14px_rgba(255,183,3,0.55)]'
          }`}
        >
          {isLaunching ? 'T-0' : countdown}
        </div>
      </div>

      {/* Exhaust Fire & Smoke Particle Canvas */}
      <canvas
        ref={canvasRef}
        width={340}
        height={380}
        className="pointer-events-none absolute inset-0 w-full h-full z-10"
      />

      {/* Rocket & Launch Pad Stage */}
      <div className="relative z-20 w-full flex-1 flex flex-col items-center justify-end pb-2">
        <div
          className="relative"
          style={{
            transform: isLaunching
              ? 'translateY(-440px)'
              : shakeIntensity > 0
                ? `translate(${((countdown * 7) % 2 === 0 ? 1 : -1) * shakeIntensity}px, ${shakeIntensity * 0.35}px)`
                : 'translateY(0px)',
            transition: isLaunching
              ? `transform ${climbDurationSec}s cubic-bezier(0.55, 0.055, 0.675, 0.19)`
              : 'transform 60ms linear',
          }}
        >
          {/* SVG Rocket */}
          <svg
            viewBox="0 0 120 190"
            className="w-28 h-44 drop-shadow-[0_6px_14px_rgba(0,0,0,0.65)]"
            aria-label="Training orbital rocket"
          >
            {/* Left & Right Boosters */}
            <path d="M22 105 L38 92 L38 152 L18 162 Z" fill="#0284C7" stroke="#0F172A" strokeWidth="2.5" />
            <path d="M98 105 L82 92 L82 152 L102 162 Z" fill="#0284C7" stroke="#0F172A" strokeWidth="2.5" />
            {/* Main Fuselage */}
            <path
              d="M60 12 C76 34 84 68 84 150 L36 150 C36 68 44 34 60 12 Z"
              fill="#F8FAFC"
              stroke="#0F172A"
              strokeWidth="2.5"
            />
            {/* Nose Cone Accent */}
            <path d="M60 12 C69 25 75 40 78 54 L42 54 C45 40 51 25 60 12 Z" fill="#FFB703" stroke="#0F172A" strokeWidth="2" />
            {/* Cockpit Porthole */}
            <circle cx="60" cy="82" r="12" fill="#0B2244" stroke="#00D4FF" strokeWidth="3" />
            <circle cx="56" cy="78" r="3.5" fill="#5CEEFF" opacity="0.85" />
            {/* Center Stabilizer Fin */}
            <path d="M56 118 L64 118 L66 156 L54 156 Z" fill="#1E3A5F" />
            {/* Engine Nozzle */}
            <path d="M44 150 L76 150 L82 166 L38 166 Z" fill="#334155" stroke="#0F172A" strokeWidth="2" />
            {emitting && (
              <ellipse cx="60" cy="170" rx="14" ry="7" fill="#FFD966" />
            )}
          </svg>
        </div>

        {/* Launch Pad Base & Gantry */}
        <div className="w-64 h-4 rounded-t-md bg-slate-700 border-t-2 border-cyan-400/70 shadow-[0_-4px_14px_rgba(0,212,255,0.25)]" />
        <div className="w-72 h-3 rounded-b-md bg-slate-900 border border-slate-700" />
      </div>
    </div>
  );
};
