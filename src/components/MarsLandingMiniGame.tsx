import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Flame,
  RotateCcw,
  Rocket,
} from 'lucide-react';
import { AudioManager } from '../game/audioManager';
import { SciFiButton } from './SciFiButton';

export interface LandingGameResult {
  passed: boolean;
  fuelDelta: number;
  healthDelta: number;
  shieldDelta: number;
  summary: string;
}

interface MarsLandingMiniGameProps {
  onComplete: (result: LandingGameResult) => void;
}

const CANVAS_W = 540;
const CANVAS_H = 300;
const PAD_X = 210;
const PAD_W = 120;
const PAD_Y = 266;
const SAFE_LANDING_SPEED = 88; // px/s

export const MarsLandingMiniGame: React.FC<MarsLandingMiniGameProps> = ({
  onComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const keysRef = useRef({ left: false, right: false, thrust: false });
  const pointerDraggingRef = useRef(false);

  const [attempt, setAttempt] = useState(1);
  const [phase, setPhase] = useState<'playing' | 'attempt_failed' | 'finished'>(
    'playing'
  );
  const [speedReadout, setSpeedReadout] = useState(0);
  const [finalResult, setFinalResult] = useState<LandingGameResult | null>(null);

  const shipRef = useRef({ x: 110, y: 38, vx: 14, vy: 22 });

  const resetShipForAttempt = useCallback(() => {
    const startOffset = attempt === 1 ? 110 : attempt === 2 ? 410 : 140;
    shipRef.current = { x: startOffset, y: 38, vx: 0, vy: 18 };
    keysRef.current = { left: false, right: false, thrust: false };
    setPhase('playing');
  }, [attempt]);

  // Keyboard controls (ArrowLeft / ArrowRight / ArrowDown / Space)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      }
      if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === ' ' ||
        e.key === 'w' ||
        e.key === 'W'
      ) {
        if (e.key === ' ') e.preventDefault();
        keysRef.current.thrust = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
      }
      if (
        e.key === 'ArrowDown' ||
        e.key === 'ArrowUp' ||
        e.key === ' ' ||
        e.key === 'w' ||
        e.key === 'W'
      ) {
        keysRef.current.thrust = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  // Main physics + canvas loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let last = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.04, (now - last) / 1000);
      last = now;

      const s = shipRef.current;

      if (phase === 'playing') {
        const marsGravity = 92; // px/s^2
        const thrustDecel = keysRef.current.thrust ? 195 : 0;

        if (keysRef.current.left) s.vx -= 210 * dt;
        if (keysRef.current.right) s.vx += 210 * dt;
        s.vx *= 0.96;

        s.vy += (marsGravity - thrustDecel) * dt;
        s.vy = Math.max(-55, Math.min(240, s.vy));

        s.x += s.vx * dt;
        s.y += s.vy * dt;

        s.x = Math.max(28, Math.min(CANVAS_W - 28, s.x));
        if (s.y < 24) {
          s.y = 24;
          s.vy = Math.max(0, s.vy);
        }

        setSpeedReadout(Math.round(Math.abs(s.vy)));

        // Check ground contact
        if (s.y + 18 >= PAD_Y) {
          s.y = PAD_Y - 18;
          const insidePad = s.x >= PAD_X + 12 && s.x <= PAD_X + PAD_W - 12;
          const softTouch = s.vy <= SAFE_LANDING_SPEED;

          if (insidePad && softTouch) {
            AudioManager.playStar();
            const res: LandingGameResult = {
              passed: true,
              fuelDelta: -5,
              healthDelta: 0,
              shieldDelta: 0,
              summary: 'Perfect Green-Zone Landing · Fuel -5, Health 0',
            };
            setFinalResult(res);
            setPhase('finished');
          } else {
            AudioManager.playImpact();
            if (attempt < 3) {
              setPhase('attempt_failed');
            } else {
              const res: LandingGameResult = {
                passed: false,
                fuelDelta: -20,
                healthDelta: -10,
                shieldDelta: -10,
                summary: 'Hard Landing · Fuel -20, Health -10, Shield -10',
              };
              setFinalResult(res);
              setPhase('finished');
            }
          }
        }
      }

      // Draw Mars Descent Backdrop
      const sky = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
      sky.addColorStop(0, '#1B0C08');
      sky.addColorStop(0.6, '#5B2212');
      sky.addColorStop(1, '#9A3D22');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Rocky Mars ground
      ctx.fillStyle = '#6E2A16';
      ctx.beginPath();
      ctx.moveTo(0, PAD_Y + 6);
      ctx.lineTo(140, PAD_Y - 10);
      ctx.lineTo(PAD_X - 10, PAD_Y + 2);
      ctx.lineTo(PAD_X + PAD_W + 10, PAD_Y + 2);
      ctx.lineTo(430, PAD_Y - 14);
      ctx.lineTo(CANVAS_W, PAD_Y + 4);
      ctx.lineTo(CANVAS_W, CANVAS_H);
      ctx.lineTo(0, CANVAS_H);
      ctx.closePath();
      ctx.fill();

      // Green Landing Zone Pad
      ctx.fillStyle = '#064E3B';
      ctx.fillRect(PAD_X, PAD_Y, PAD_W, 12);
      ctx.strokeStyle = '#2EE59D';
      ctx.lineWidth = 3;
      ctx.strokeRect(PAD_X, PAD_Y, PAD_W, 12);
      ctx.fillStyle = '#2EE59D';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('GREEN ZONE', PAD_X + PAD_W / 2, PAD_Y + 25);

      // Thruster Flame
      if (keysRef.current.thrust && phase === 'playing') {
        ctx.fillStyle = '#FFB703';
        ctx.beginPath();
        ctx.moveTo(s.x - 8, s.y + 14);
        ctx.lineTo(s.x, s.y + 34 + Math.random() * 8);
        ctx.lineTo(s.x + 8, s.y + 14);
        ctx.closePath();
        ctx.fill();
      }

      // Lander Rocket Body
      ctx.save();
      ctx.translate(s.x, s.y);
      ctx.fillStyle = '#E2E8F0';
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -18);
      ctx.lineTo(12, 8);
      ctx.lineTo(-12, 8);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Landing Legs
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-10, 8);
      ctx.lineTo(-16, 17);
      ctx.moveTo(10, 8);
      ctx.lineTo(16, 17);
      ctx.stroke();

      // Viewport dot
      ctx.fillStyle = '#00D4FF';
      ctx.beginPath();
      ctx.arc(0, -4, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [phase, attempt]);

  const handleCanvasPointer = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas || phase !== 'playing') return;
    const rect = canvas.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * CANVAS_W;
    shipRef.current.x = Math.max(28, Math.min(CANVAS_W - 28, relX));
  };

  return (
    <section
      aria-label="Mini-Game 1: Mars Landing Descent"
      className="w-full max-w-2xl rounded-[14px] border-2 border-[#00D4FF] bg-[#081326]/92 p-4 shadow-2xl backdrop-blur-md"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#5CEEFF]">
            Mini-Game 1 · Interactive Descent
          </p>
          <h2 className="font-display text-lg font-extrabold text-white flex items-center gap-2">
            <Rocket className="w-4 h-4 text-[#FFB703]" />
            Land Gently in the Green Zone
          </h2>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono-num">
          <span className="rounded-md bg-[#0E2240] border border-cyan-500/50 px-2.5 py-1 text-cyan-200">
            Attempt {attempt}/3
          </span>
          <span
            className={`rounded-md border px-2.5 py-1 font-bold ${
              speedReadout <= SAFE_LANDING_SPEED
                ? 'bg-emerald-950/60 border-emerald-400 text-emerald-300'
                : 'bg-rose-950/60 border-rose-400 text-rose-300'
            }`}
          >
            Speed: {speedReadout} (Safe ≤ {SAFE_LANDING_SPEED})
          </span>
        </div>
      </div>

      <p className="text-xs text-slate-300 mb-2">
        Use <strong>Left / Right</strong> arrows (or drag rocket) to steer, and hold{' '}
        <strong>Down / Thrust</strong> to slow down before touching the green pad.
      </p>

      <div className="relative rounded-xl overflow-hidden border-2 border-slate-700 bg-black">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onPointerDown={(e) => {
            pointerDraggingRef.current = true;
            handleCanvasPointer(e.clientX);
          }}
          onPointerMove={(e) => {
            if (pointerDraggingRef.current) {
              handleCanvasPointer(e.clientX);
            }
          }}
          onPointerUp={() => {
            pointerDraggingRef.current = false;
          }}
          onPointerLeave={() => {
            pointerDraggingRef.current = false;
          }}
          className="w-full h-auto block touch-none cursor-ew-resize"
        />

        {phase === 'attempt_failed' && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
            <p className="font-display text-xl font-bold text-[#FF859D] mb-1">
              Too Fast or Off Pad!
            </p>
            <p className="text-xs sm:text-sm text-slate-200 mb-4">
              Keep descent speed ≤ {SAFE_LANDING_SPEED} inside the green zone.
            </p>
            <SciFiButton
              variant="gold"
              onClick={() => {
                setAttempt((a) => a + 1);
                shipRef.current = { x: attempt === 1 ? 410 : 140, y: 38, vx: 0, vy: 18 };
                keysRef.current = { left: false, right: false, thrust: false };
                setPhase('playing');
              }}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retry Landing (Attempt {attempt + 1}/3)</span>
            </SciFiButton>
          </div>
        )}

        {phase === 'finished' && finalResult && (
          <div className="absolute inset-0 bg-[#081326]/86 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center">
            <p
              className={`font-display text-xl font-extrabold mb-1 ${
                finalResult.passed ? 'text-[#2EE59D]' : 'text-[#FFB703]'
              }`}
            >
              {finalResult.passed
                ? 'Perfect Landing, Cadet!'
                : 'Hard Landing — Crew Alive!'}
            </p>
            <p className="font-mono-num text-xs sm:text-sm text-cyan-200 mb-4">
              {finalResult.summary}
            </p>
            <SciFiButton
              variant="gold"
              onClick={() => onComplete(finalResult)}
            >
              <span>Continue to Scene 3.2</span>
              <ArrowRight className="w-4 h-4" />
            </SciFiButton>
          </div>
        )}
      </div>

      {/* Touch / Pointer Controls Bar */}
      {phase === 'playing' && (
        <div className="mt-2.5 flex items-center justify-center gap-3">
          <button
            type="button"
            onPointerDown={() => {
              keysRef.current.left = true;
            }}
            onPointerUp={() => {
              keysRef.current.left = false;
            }}
            onPointerLeave={() => {
              keysRef.current.left = false;
            }}
            className="px-4 py-2 rounded-lg border-2 border-[#00D4FF] bg-[#0D2140] text-white font-display font-bold text-xs flex items-center gap-1 select-none active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Left
          </button>

          <button
            type="button"
            onPointerDown={() => {
              keysRef.current.thrust = true;
            }}
            onPointerUp={() => {
              keysRef.current.thrust = false;
            }}
            onPointerLeave={() => {
              keysRef.current.thrust = false;
            }}
            className="px-5 py-2 rounded-lg border-2 border-[#FFB703] bg-[#3B2600] text-[#FFD966] font-display font-bold text-xs flex items-center gap-1.5 select-none active:scale-95 cursor-pointer shadow-[0_0_12px_rgba(255,183,3,0.35)]"
          >
            <Flame className="w-4 h-4" />
            <ArrowDown className="w-3.5 h-3.5" />
            Hold Thrust
          </button>

          <button
            type="button"
            onPointerDown={() => {
              keysRef.current.right = true;
            }}
            onPointerUp={() => {
              keysRef.current.right = false;
            }}
            onPointerLeave={() => {
              keysRef.current.right = false;
            }}
            className="px-4 py-2 rounded-lg border-2 border-[#00D4FF] bg-[#0D2140] text-white font-display font-bold text-xs flex items-center gap-1 select-none active:scale-95 cursor-pointer"
          >
            Right
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
};
