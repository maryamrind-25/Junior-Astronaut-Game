import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { AudioManager } from '../game/audioManager';

const MARS_LANDING_PLAIN_BG = '/images/mars_landing_plain.jpg';
const MARS_OUTPOST_BG = '/images/mars_outpost_bg.jpg';
const CADET_SPRITE = '/images/cadet_astronaut.png';

// Walkable Martian ground bounds framed cleanly inside compact landscape HUD
const MIN_X = 22;
const MAX_X = 78;
const MIN_Y = 53;
const MAX_Y = 80;

export interface MarsHotspot {
  x: number;
  y: number;
  label: string;
}

interface Footprint {
  id: number;
  x: number;
  y: number;
  createdAt: number;
}

interface MarsSurfaceViewportProps {
  part: 1 | 2 | 3 | 4 | 5;
  stepIndex: number;
  stormActive?: boolean;
  crisisAlert?: boolean;
  starEndingGlow?: boolean;
  motionState?: 'none' | 'shake';
  explorerEnabled?: boolean;
  issueHotspot?: MarsHotspot | null;
  nearHotspot?: boolean;
  onExplorerPosChange?: (pos: { x: number; y: number }) => void;
  onInspectHotspot?: () => void;
}

interface MarsParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  kind: 'dust' | 'meteor';
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export const MarsSurfaceViewport: React.FC<MarsSurfaceViewportProps> = ({
  part,
  stepIndex,
  stormActive = false,
  crisisAlert = false,
  starEndingGlow = false,
  motionState = 'none',
  explorerEnabled = false,
  issueHotspot = null,
  nearHotspot = false,
  onExplorerPosChange,
  onInspectHotspot,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [bgErr, setBgErr] = useState(false);
  const [cadetErr, setCadetErr] = useState(false);

  // Smooth continuous walking physics state
  const [explorerView, setExplorerView] = useState<{
    x: number;
    y: number;
    facing: 'left' | 'right';
    isWalking: boolean;
    walkPhase: number;
  }>({
    x: 45,
    y: 71,
    facing: 'right',
    isWalking: false,
    walkPhase: 0,
  });
  const [footprints, setFootprints] = useState<Footprint[]>([]);

  const posRef = useRef({ x: 45, y: 71 });
  const velRef = useRef({ vx: 0, vy: 0 });
  const facingRef = useRef<'left' | 'right'>('right');
  const walkPhaseRef = useRef(0);
  const lastPrintPosRef = useRef({ x: 45, y: 71 });
  const stepSideRef = useRef(1);
  const clickTargetRef = useRef<{ x: number; y: number } | null>(null);
  const heldKeysRef = useRef<Set<string>>(new Set());
  const onPosChangeRef = useRef(onExplorerPosChange);
  onPosChangeRef.current = onExplorerPosChange;

  const isLandingPlain = part === 1;
  const bgImage = isLandingPlain ? MARS_LANDING_PLAIN_BG : MARS_OUTPOST_BG;
  const isStormScene = stormActive || stepIndex === 12 || stepIndex === 17;
  const isMeteorScene = stepIndex === 11;

  useEffect(() => {
    setBgErr(false);
  }, [isLandingPlain]);

  // Clear click target / held keys when exploration pauses
  useEffect(() => {
    if (!explorerEnabled) {
      heldKeysRef.current.clear();
      clickTargetRef.current = null;
      velRef.current = { vx: 0, vy: 0 };
      setExplorerView((prev) =>
        prev.isWalking ? { ...prev, isWalking: false } : prev
      );
    }
  }, [explorerEnabled]);

  const lastStepIndexRef = useRef(0);

  // Storm wind ambience & meteoroid audio cues
  useEffect(() => {
    if (isStormScene) {
      AudioManager.startStormAmbience();
      AudioManager.playDustSwirl();
    } else {
      AudioManager.stopStormAmbience();
    }
    return () => {
      AudioManager.stopStormAmbience();
    };
  }, [isStormScene]);

  useEffect(() => {
    if (!isMeteorScene) return;
    AudioManager.playMeteoroid();
    const t = window.setInterval(() => {
      AudioManager.playMeteoroid();
    }, 4500);
    return () => window.clearInterval(t);
  }, [isMeteorScene]);

  // Keyboard tracking (WASD + Arrow keys)
  useEffect(() => {
    if (!explorerEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (
        k === 'w' ||
        k === 'a' ||
        k === 's' ||
        k === 'd' ||
        k === 'arrowup' ||
        k === 'arrowdown' ||
        k === 'arrowleft' ||
        k === 'arrowright'
      ) {
        e.preventDefault();
        if (!heldKeysRef.current.has(k)) {
          AudioManager.stopReyesSpeech();
        }
        heldKeysRef.current.add(k);
        clickTargetRef.current = null;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      heldKeysRef.current.delete(e.key.toLowerCase());
    };

    const handleBlur = () => {
      heldKeysRef.current.clear();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, [explorerEnabled]);

  // Smooth 60fps continuous ground walking loop
  useEffect(() => {
    if (!explorerEnabled) return;

    let rafId: number;
    let lastTime = performance.now();

    const stepPhysics = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;

      let ix = 0;
      let iy = 0;

      const keys = heldKeysRef.current;
      if (keys.has('a') || keys.has('arrowleft')) ix -= 1;
      if (keys.has('d') || keys.has('arrowright')) ix += 1;
      if (keys.has('w') || keys.has('arrowup')) iy -= 1;
      if (keys.has('s') || keys.has('arrowdown')) iy += 1;

      if (ix === 0 && iy === 0 && clickTargetRef.current) {
        const dx = clickTargetRef.current.x - posRef.current.x;
        const dy = clickTargetRef.current.y - posRef.current.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 0.8) {
          clickTargetRef.current = null;
        } else {
          ix = dx / dist;
          iy = dy / dist;
        }
      }

      // Normalize diagonal movement so diagonal speed isn't faster
      const mag = Math.hypot(ix, iy);
      if (mag > 1) {
        ix /= mag;
        iy /= mag;
      }

      // Depth factor: walking farther back feels realistically slower in perspective
      const depthNorm = (posRef.current.y - MIN_Y) / (MAX_Y - MIN_Y);
      const perspectiveSpeed = 0.78 + depthNorm * 0.34;
      const targetVx = ix * 14.5 * perspectiveSpeed;
      const targetVy = iy * 9.5 * perspectiveSpeed;

      const accel = mag > 0.05 ? 11 : 14;
      const blend = Math.min(1, dt * accel);
      velRef.current.vx += (targetVx - velRef.current.vx) * blend;
      velRef.current.vy += (targetVy - velRef.current.vy) * blend;

      const speed = Math.hypot(velRef.current.vx, velRef.current.vy);
      const isMoving = speed > 0.45;

      if (isMoving) {
        const nx = clamp(
          posRef.current.x + velRef.current.vx * dt,
          MIN_X,
          MAX_X
        );
        const ny = clamp(
          posRef.current.y + velRef.current.vy * dt,
          MIN_Y,
          MAX_Y
        );

        if (velRef.current.vx < -0.5) facingRef.current = 'left';
        else if (velRef.current.vx > 0.5) facingRef.current = 'right';

        posRef.current = { x: nx, y: ny };
        walkPhaseRef.current += dt * (6.2 + speed * 0.22);

        const stepIdx = Math.floor(walkPhaseRef.current / Math.PI);
        if (stepIdx !== lastStepIndexRef.current) {
          lastStepIndexRef.current = stepIdx;
          AudioManager.playFootstep();
        }

        // Leave faint Martian bootprints cleanly behind the boots
        const printDist = Math.hypot(
          nx - lastPrintPosRef.current.x,
          ny - lastPrintPosRef.current.y
        );
        if (printDist >= 2.2) {
          stepSideRef.current *= -1;
          lastPrintPosRef.current = { x: nx, y: ny };
          const footOffsetX = stepSideRef.current * 0.45;
          setFootprints((prev) =>
            prev
              .filter((fp) => now - fp.createdAt < 4200)
              .slice(-14)
              .concat({
                id: now + Math.random(),
                x: nx + footOffsetX,
                y: ny,
                createdAt: now,
              })
          );
        }

        onPosChangeRef.current?.({ x: nx, y: ny });
        setExplorerView({
          x: nx,
          y: ny,
          facing: facingRef.current,
          isWalking: true,
          walkPhase: walkPhaseRef.current,
        });
      } else if (
        Math.abs(velRef.current.vx) > 0.01 ||
        Math.abs(velRef.current.vy) > 0.01
      ) {
        velRef.current = { vx: 0, vy: 0 };
        setExplorerView((prev) =>
          prev.isWalking ? { ...prev, isWalking: false } : prev
        );
      }

      rafId = requestAnimationFrame(stepPhysics);
    };

    rafId = requestAnimationFrame(stepPhysics);
    return () => cancelAnimationFrame(rafId);
  }, [explorerEnabled]);

  // Ambient Martian dust & meteor shower particle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    const particles: MarsParticle[] = [];

    const dustCount = isStormScene ? 56 : isLandingPlain ? 20 : 26;
    for (let i = 0; i < dustCount; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: isStormScene ? -220 - Math.random() * 240 : -55 - Math.random() * 85,
        vy: (Math.random() - 0.3) * 28,
        size: isStormScene ? 12 + Math.random() * 34 : 2 + Math.random() * 4,
        alpha: isStormScene ? 0.14 + Math.random() * 0.2 : 0.24 + Math.random() * 0.22,
        kind: 'dust',
      });
    }

    if (isMeteorScene) {
      for (let i = 0; i < 12; i++) {
        particles.push({
          x: Math.random() * w,
          y: -Math.random() * h,
          vx: -320 - Math.random() * 220,
          vy: 300 + Math.random() * 190,
          size: 4 + Math.random() * 4,
          alpha: 0.9,
          kind: 'meteor',
        });
      }
    }

    let rafId: number;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;

        if (p.kind === 'dust') {
          if (p.x < -60) p.x = w + 60;
          if (p.y > h + 40) p.y = -30;
          if (p.y < -40) p.y = h + 30;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(224, 118, 68, ${p.alpha})`;
          ctx.fill();
        } else {
          if (p.x < -50 || p.y > h + 50) {
            p.x = w * (0.25 + Math.random() * 0.85);
            p.y = -20;
          }
          const grad = ctx.createLinearGradient(p.x, p.y, p.x + 48, p.y - 42);
          grad.addColorStop(0, 'rgba(255, 245, 205, 1)');
          grad.addColorStop(0.45, 'rgba(255, 130, 50, 0.85)');
          grad.addColorStop(1, 'rgba(255, 80, 20, 0)');
          ctx.strokeStyle = grad;
          ctx.lineWidth = p.size;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + 48, p.y - 42);
          ctx.stroke();
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isStormScene, isLandingPlain, isMeteorScene]);

  const handleGroundClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!explorerEnabled) return;
      AudioManager.stopReyesSpeech();
      AudioManager.playMoveWhoosh();
      const rect = e.currentTarget.getBoundingClientRect();
      const pctX = ((e.clientX - rect.left) / rect.width) * 100;
      const pctY = ((e.clientY - rect.top) / rect.height) * 100;
      clickTargetRef.current = {
        x: clamp(pctX, MIN_X, MAX_X),
        y: clamp(pctY, MIN_Y, MAX_Y),
      };
    },
    [explorerEnabled]
  );

  const handleHotspotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    AudioManager.stopReyesSpeech();
    if (!issueHotspot) return;
    if (nearHotspot) {
      onInspectHotspot?.();
    } else {
      // First walk the astronaut directly to the problem location
      AudioManager.playMoveWhoosh();
      clickTargetRef.current = {
        x: clamp(issueHotspot.x, MIN_X, MAX_X),
        y: clamp(issueHotspot.y, MIN_Y, MAX_Y),
      };
    }
  };

  // Realistic depth scale from horizon midground (0.72x) to foreground (1.14x)
  const depthNorm = (explorerView.y - MIN_Y) / (MAX_Y - MIN_Y);
  const depthScale = 0.72 + depthNorm * 0.42;

  // Natural low-gravity walking stride (gentle bounce & subtle tilt only while walking)
  const stepLiftPx = explorerView.isWalking
    ? Math.abs(Math.sin(explorerView.walkPhase)) * 4
    : 0;
  const strideTiltDeg = explorerView.isWalking
    ? Math.sin(explorerView.walkPhase) * 2.5
    : 0;
  const flipX = explorerView.facing === 'left' ? -1 : 1;

  return (
    <div
      className={`fixed inset-0 overflow-hidden bg-[#160B08] ${
        motionState === 'shake' ? 'animate-shake' : ''
      }`}
    >
      {!bgErr ? (
        <img
          src={bgImage}
          alt={
            isLandingPlain
              ? 'Mars landing site plain with surface scanner beacon'
              : 'Mars Outpost research habitat on red regolith plains'
          }
          onError={() => setBgErr(true)}
          className="pointer-events-none absolute inset-0 w-full h-full max-w-full object-cover transition-all duration-700"
          style={{
            filter: isStormScene
              ? 'brightness(0.6) saturate(1.15)'
              : starEndingGlow
                ? 'brightness(1.06) saturate(1.12)'
                : 'brightness(0.9)',
          }}
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#1A0D0A] via-[#5C2414] to-[#9E3B1E] flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-1 opacity-40 select-none">
            <span className="text-5xl">🏜️</span>
            <span className="font-display text-xs uppercase tracking-widest text-amber-200">
              Mars Surface
            </span>
          </div>
        </div>
      )}

      {/* Subtle atmospheric edge scrim for HUD readability while keeping Mars terrain vivid */}
      <div
        className={`pointer-events-none absolute inset-0 transition-colors duration-700 ${
          isStormScene
            ? 'bg-gradient-to-b from-[#2B1008]/60 via-[#1C0A06]/25 to-[#060E1D]/80'
            : starEndingGlow
              ? 'bg-gradient-to-b from-[#060E1D]/30 via-transparent to-[#060E1D]/68'
              : 'bg-gradient-to-b from-[#060E1D]/40 via-transparent to-[#060E1D]/74'
        }`}
        aria-hidden="true"
      />

      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="pointer-events-none absolute inset-0 w-full h-full"
      />

      {/* Interactive Mars Surface Walk Layer */}
      {explorerEnabled && (
        <div
          onClick={handleGroundClick}
          className="absolute inset-0 z-15 cursor-crosshair"
        >
          {/* Faint Martian Bootprints Left Behind the Boots */}
          {footprints.map((fp) => (
            <div
              key={fp.id}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 w-2 h-1 rounded-full bg-[#3E170A]/65"
              style={{ left: `${fp.x}%`, top: `${fp.y}%` }}
              aria-hidden="true"
            />
          ))}

          {/* Active Issue Beacon / Hotspot Anchored on Mars Land */}
          {issueHotspot && (
            <button
              type="button"
              onClick={handleHotspotClick}
              style={{ left: `${issueHotspot.x}%`, top: `${issueHotspot.y}%` }}
              className="pointer-events-auto absolute -translate-x-1/2 -translate-y-full flex flex-col items-center group cursor-pointer"
              aria-label={
                nearHotspot
                  ? `Solve ${issueHotspot.label}`
                  : `Walk to ${issueHotspot.label}`
              }
            >
              <span
                className={`mb-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shadow border ${
                  nearHotspot
                    ? 'bg-[#FFB703] border-white text-slate-950 animate-bounce'
                    : 'bg-[#06142C]/90 border-[#FF859D]/80 text-[#FF9FB3]'
                }`}
              >
                {nearHotspot ? 'Solve Issue!' : 'Issue Here'}
              </span>
              <span className="relative flex items-center justify-center">
                <span
                  className={`absolute w-12 h-12 rounded-full animate-ping ${
                    nearHotspot ? 'bg-[#FFB703]/45' : 'bg-[#FF4D6D]/35'
                  }`}
                />
                <span
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 ${
                    nearHotspot
                      ? 'bg-[#2EE59D] border-white text-slate-950 scale-110'
                      : 'bg-[#991B1B]/95 border-[#FF859D] text-white'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </span>
              </span>
              <span className="mt-1 px-2 py-0.5 rounded bg-[#06142C]/92 border border-[#00D4FF]/70 text-[11px] font-bold text-[#FFD966] whitespace-nowrap shadow">
                {issueHotspot.label}
              </span>
              <span className="mt-0.5 w-3.5 h-1 rounded-full bg-black/50 blur-[1px]" />
            </button>
          )}

          {/* Grounded Cadet Astronaut Sprite (Boots Anchored to Mars Soil) */}
          <div
            className="pointer-events-none absolute will-change-transform"
            style={{
              left: `${explorerView.x}%`,
              top: `${explorerView.y}%`,
              transform: `translate(-50%, -100%) scale(${depthScale})`,
            }}
          >
            {/* Contact Shadow Directly Beneath Boots */}
            <div
              className="absolute left-1/2 bottom-0 -translate-x-1/2 translate-y-1 w-11 h-2.5 rounded-full bg-black/55 blur-[2px] transition-transform"
              style={{
                transform: `translate(-50%, 35%) scale(${
                  1 - stepLiftPx * 0.04
                })`,
              }}
              aria-hidden="true"
            />

            {!cadetErr ? (
              <img
                src={CADET_SPRITE}
                alt="Cadet astronaut walking on Mars"
                onError={() => setCadetErr(true)}
                className="w-16 h-24 max-w-full object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.6)]"
                style={{
                  transform: `translateY(${-stepLiftPx}px) scaleX(${flipX}) rotate(${strideTiltDeg}deg)`,
                  transformOrigin: '50% 90%',
                }}
              />
            ) : (
              <div
                className="w-14 h-20 rounded-xl bg-gradient-to-b from-[#0E7490] to-[#1E3A8A] border-2 border-[#5CEEFF] flex flex-col items-center justify-center shadow-lg"
                style={{
                  transform: `translateY(${-stepLiftPx}px) scaleX(${flipX}) rotate(${strideTiltDeg}deg)`,
                  transformOrigin: '50% 90%',
                }}
              >
                <span className="text-2xl leading-none" role="img" aria-label="Cadet">
                  👨‍🚀
                </span>
                <span className="mt-0.5 text-[9px] font-bold text-white uppercase">
                  Cadet
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {crisisAlert && (
        <div
          className="pointer-events-none absolute inset-0 ring-inset ring-[10px] ring-rose-500/25 animate-pulse"
          aria-hidden="true"
        />
      )}
    </div>
  );
};
