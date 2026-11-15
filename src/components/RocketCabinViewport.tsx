import React, { useEffect, useRef, useState } from 'react';

const MARS_TRANSIT_BG = '/images/mars_transit_bg.jpg';
const EARTH_GLOBE_IMG = '/images/earth_globe.jpg';
const DEBRIS_STAGE_IMG = '/images/debris_stage.jpg';
const DEBRIS_SHARDS_IMG = '/images/debris_shards.jpg';

interface RocketCabinViewportProps {
  sceneIndex: number; // 0 = intro, 1..11 = hazards, 12 = complete
  isDepartingEarth?: boolean;
  isCruising?: boolean;
  encounterActive: boolean;
  actionMotion: 'none' | 'shake' | 'roll' | 'burn';
}

interface CanvasSprite {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vrot: number;
  alpha: number;
  kind: 'dust' | 'solar' | 'junk' | 'meteor' | 'ice';
}

interface DriftStar {
  angle: number;
  dist: number;
  speed: number;
  size: number;
  tint: string;
}

export const RocketCabinViewport: React.FC<RocketCabinViewportProps> = ({
  sceneIndex,
  isDepartingEarth = false,
  isCruising = false,
  encounterActive,
  actionMotion,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const earthImgRef = useRef<HTMLImageElement | null>(null);
  const debrisImgsRef = useRef<HTMLImageElement[]>([]);
  const [bgErr, setBgErr] = useState(false);
  const [earthBadgeErr, setEarthBadgeErr] = useState(false);

  const progressRatio = Math.max(0, Math.min(1, (sceneIndex - 1) / 10));
  const marsScale = isDepartingEarth ? 0.94 : 1 + progressRatio * 0.24;
  const earthSizePx = Math.round(38 - progressRatio * 20);

  // Preload Earth and Space Debris sprites once
  useEffect(() => {
    const earth = new Image();
    earth.src = EARTH_GLOBE_IMG;
    earthImgRef.current = earth;

    const stage = new Image();
    stage.src = DEBRIS_STAGE_IMG;
    const shards = new Image();
    shards.src = DEBRIS_SHARDS_IMG;
    debrisImgsRef.current = [stage, shards];
  }, []);

  // Continuous spacecraft motion starfield + Earth departure + live physical hazards
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    let lastTime = performance.now();
    let elapsed = 0;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w * 0.56;
    const cy = h * 0.42;

    // Continuous 3D radial moving starfield so the spacecraft always feels in flight
    const stars: DriftStar[] = Array.from({ length: 110 }, () => ({
      angle: Math.random() * Math.PI * 2,
      dist: 30 + Math.random() * (w * 0.65),
      speed: 24 + Math.random() * 65,
      size: 1 + Math.random() * 1.8,
      tint:
        Math.random() > 0.85
          ? '#FFD966'
          : Math.random() > 0.7
            ? '#8BE9FD'
            : '#FFFFFF',
    }));

    const sprites: CanvasSprite[] = [];

    if (!isCruising && !isDepartingEarth) {
      if (sceneIndex === 1) {
        for (let i = 0; i < 46; i++) {
          sprites.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: -140 - Math.random() * 180,
            vy: 15 + Math.random() * 35,
            size: 16 + Math.random() * 42,
            rot: 0,
            vrot: 0,
            alpha: 0.14 + Math.random() * 0.2,
            kind: 'dust',
          });
        }
      } else if (sceneIndex === 2) {
        for (let i = 0; i < 52; i++) {
          sprites.push({
            x: Math.random() * w,
            y: Math.random() * h,
            vx: -420 - Math.random() * 260,
            vy: 90 + Math.random() * 90,
            size: 2 + Math.random() * 2.5,
            rot: 0,
            vrot: 0,
            alpha: 0.55 + Math.random() * 0.45,
            kind: 'solar',
          });
        }
      } else if (sceneIndex === 3) {
        for (let i = 0; i < 6; i++) {
          sprites.push({
            x: w + i * 160 + Math.random() * 120,
            y: h * (0.14 + Math.random() * 0.45),
            vx: -230 - Math.random() * 140,
            vy: (Math.random() - 0.5) * 40,
            size: 18 + Math.random() * 20,
            rot: Math.random() * Math.PI,
            vrot: (Math.random() - 0.5) * 4,
            alpha: 1,
            kind: 'junk',
          });
        }
      } else if (sceneIndex === 4) {
        for (let i = 0; i < 10; i++) {
          sprites.push({
            x: Math.random() * w,
            y: -Math.random() * h,
            vx: -360 - Math.random() * 220,
            vy: 280 + Math.random() * 180,
            size: 5 + Math.random() * 6,
            rot: 0,
            vrot: 0,
            alpha: 1,
            kind: 'meteor',
          });
        }
      } else if (sceneIndex === 8) {
        for (let i = 0; i < 34; i++) {
          sprites.push({
            x: w * 0.72,
            y: h * 0.42,
            vx: -80 - Math.random() * 140,
            vy: (Math.random() - 0.5) * 110,
            size: 2 + Math.random() * 3.5,
            rot: 0,
            vrot: 0,
            alpha: 0.9,
            kind: 'ice',
          });
        }
      }
    }

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      elapsed += dt;

      ctx.clearRect(0, 0, w, h);

      // 1. Continuous moving spacecraft starfield (faster when departing Earth, cruising, or in gravity pull)
      const speedMult = isDepartingEarth
        ? 2.85
        : !isCruising && sceneIndex === 10
          ? 3.2
          : isCruising
            ? 1.85
            : 1.0;

      for (const st of stars) {
        st.dist += st.speed * speedMult * dt;
        if (st.dist > w * 0.75) {
          st.dist = 18 + Math.random() * 30;
          st.angle = Math.random() * Math.PI * 2;
        }
        const x = cx + Math.cos(st.angle) * st.dist;
        const y = cy + Math.sin(st.angle) * st.dist * 0.72;
        const trailLen = Math.min(18, (st.dist / (w * 0.65)) * 10 * speedMult);
        const px = x - Math.cos(st.angle) * trailLen;
        const py = y - Math.sin(st.angle) * trailLen * 0.72;

        ctx.strokeStyle = st.tint;
        ctx.globalAlpha = Math.min(0.95, 0.25 + st.dist / (w * 0.55));
        ctx.lineWidth = st.size;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // 1b. Departing Earth Animation (Earth starts large in cockpit window and shrinks smoothly into deep space)
      if (isDepartingEarth) {
        const p = Math.min(1, elapsed / 4.4);
        const eased = 1 - Math.pow(1 - p, 2.3); // fast initial pull-away, smooth settle
        const ex = w * (0.58 - eased * 0.29);
        const ey = h * (0.44 - eased * 0.24);
        const er = Math.max(18, 225 * (1 - eased) + 18 * eased);

        // Soft blue atmospheric halo
        const halo = ctx.createRadialGradient(ex, ey, er * 0.85, ex, ey, er * 1.45);
        halo.addColorStop(0, 'rgba(56, 189, 248, 0.55)');
        halo.addColorStop(0.55, 'rgba(37, 99, 235, 0.2)');
        halo.addColorStop(1, 'rgba(15, 23, 42, 0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(ex, ey, er * 1.45, 0, Math.PI * 2);
        ctx.fill();

        // Earth Globe Sphere (photorealistic globe image cropped cleanly)
        ctx.save();
        ctx.beginPath();
        ctx.arc(ex, ey, er, 0, Math.PI * 2);
        ctx.clip();

        const earthSprite = earthImgRef.current;
        if (earthSprite && earthSprite.complete && earthSprite.naturalWidth > 0) {
          // Slight scale factor (2.34x) so Earth limb fills the circular clip edge-to-edge without black ring
          ctx.drawImage(
            earthSprite,
            ex - er * 1.17,
            ey - er * 1.17,
            er * 2.34,
            er * 2.34
          );
        } else {
          const oceanGrad = ctx.createRadialGradient(
            ex - er * 0.35,
            ey - er * 0.35,
            er * 0.1,
            ex,
            ey,
            er
          );
          oceanGrad.addColorStop(0, '#60A5FA');
          oceanGrad.addColorStop(0.55, '#1D4ED8');
          oceanGrad.addColorStop(1, '#091534');
          ctx.fillStyle = oceanGrad;
          ctx.fillRect(ex - er, ey - er, er * 2, er * 2);
        }
        ctx.restore();

        // Thruster plasma edge shimmer along bottom of cockpit window during burn
        const burnGlow = ctx.createLinearGradient(0, h * 0.72, 0, h);
        burnGlow.addColorStop(0, 'rgba(255, 140, 66, 0)');
        burnGlow.addColorStop(1, `rgba(255, 140, 66, ${0.16 + 0.08 * Math.sin(elapsed * 18)})`);
        ctx.fillStyle = burnGlow;
        ctx.fillRect(0, h * 0.72, w, h * 0.28);
      }

      if (!isCruising) {
        // Scene 2.5 Extreme Heat
        if (sceneIndex === 5) {
          const sunGrad = ctx.createRadialGradient(
            w * 0.85,
            h * 0.16,
            12,
            w * 0.85,
            h * 0.16,
            w * 0.52
          );
          sunGrad.addColorStop(0, 'rgba(255, 240, 175, 0.72)');
          sunGrad.addColorStop(0.28, 'rgba(255, 145, 45, 0.32)');
          sunGrad.addColorStop(1, 'rgba(255, 90, 20, 0)');
          ctx.fillStyle = sunGrad;
          ctx.fillRect(0, 0, w, h);
        }

        // Scene 2.9 Thermal Balance
        if (sceneIndex === 9) {
          const hotGrad = ctx.createLinearGradient(0, 0, w * 0.5, 0);
          hotGrad.addColorStop(0, 'rgba(255, 110, 30, 0.34)');
          hotGrad.addColorStop(1, 'rgba(255, 110, 30, 0)');
          ctx.fillStyle = hotGrad;
          ctx.fillRect(0, 0, w * 0.5, h);

          const coldGrad = ctx.createLinearGradient(w * 0.5, 0, w, 0);
          coldGrad.addColorStop(0, 'rgba(147, 225, 255, 0)');
          coldGrad.addColorStop(1, 'rgba(147, 225, 255, 0.36)');
          ctx.fillStyle = coldGrad;
          ctx.fillRect(w * 0.5, 0, w * 0.5, h);
        }

        // Scene 2.11 Mars Shadow
        if (sceneIndex === 11) {
          const sweep = 0.56 + 0.12 * Math.sin(elapsed * 1.4);
          ctx.fillStyle = `rgba(2, 6, 18, ${sweep})`;
          ctx.fillRect(0, 0, w, h);
        }

        // Render active physical hazard sprites
        for (const s of sprites) {
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          s.rot += s.vrot * dt;

          if (s.kind === 'dust') {
            if (s.x < -80) s.x = w + 80;
            if (s.y > h + 60) s.y = -40;
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(217, 108, 62, ${s.alpha})`;
            ctx.fill();
          } else if (s.kind === 'solar') {
            if (s.x < -40 || s.y > h + 40) {
              s.x = Math.random() * w + w * 0.25;
              s.y = -20;
            }
            ctx.strokeStyle = `rgba(255, 215, 90, ${s.alpha})`;
            ctx.lineWidth = s.size;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x + 38, s.y - 11);
            ctx.stroke();
          } else if (s.kind === 'junk') {
            if (s.x < -120) {
              s.x = w + 120;
              s.y = h * (0.14 + Math.random() * 0.46);
            }
            ctx.save();
            ctx.translate(s.x, s.y);
            ctx.rotate(s.rot);
            const debrisList = debrisImgsRef.current;
            const spriteIdx = Math.round(s.size) % 2;
            const sprite = debrisList[spriteIdx];
            if (sprite && sprite.complete && sprite.naturalWidth > 0) {
              ctx.globalCompositeOperation = 'screen';
              const drawDim = s.size * 3.4;
              ctx.drawImage(sprite, -drawDim / 2, -drawDim / 2, drawDim, drawDim);
              ctx.globalCompositeOperation = 'source-over';
            } else {
              ctx.fillStyle = '#94A3B8';
              ctx.fillRect(-s.size, -s.size * 0.35, s.size * 2, s.size * 0.7);
            }
            ctx.strokeStyle = 'rgba(255, 77, 109, 0.78)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.arc(0, 0, s.size * 1.65, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
          } else if (s.kind === 'meteor') {
            if (s.x < -60 || s.y > h + 60) {
              s.x = w * (0.3 + Math.random() * 0.9);
              s.y = -30;
            }
            const grad = ctx.createLinearGradient(
              s.x,
              s.y,
              s.x + 65,
              s.y - 50
            );
            grad.addColorStop(0, 'rgba(255, 248, 210, 1)');
            grad.addColorStop(0.35, 'rgba(255, 130, 40, 0.9)');
            grad.addColorStop(1, 'rgba(255, 80, 20, 0)');
            ctx.strokeStyle = grad;
            ctx.lineWidth = s.size;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x + 65, s.y - 50);
            ctx.stroke();
          } else if (s.kind === 'ice') {
            if (s.x < w * 0.15 || s.y < 0 || s.y > h) {
              s.x = w * 0.72;
              s.y = h * 0.42;
            }
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(186, 230, 253, ${s.alpha})`;
            ctx.fill();
          }
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [sceneIndex, isCruising, isDepartingEarth]);

  const cabinTransformClass =
    actionMotion === 'shake'
      ? 'animate-shake'
      : actionMotion === 'roll'
        ? 'rotate-[1.6deg] scale-[1.02]'
        : actionMotion === 'burn'
          ? '-translate-y-1 scale-[1.025]'
          : '';

  const isCabinDimmed =
    !isCruising && !isDepartingEarth && (sceneIndex === 7 || sceneIndex === 11);
  const isAlertRed =
    !isCruising &&
    !isDepartingEarth &&
    encounterActive &&
    (sceneIndex === 2 || sceneIndex === 3 || sceneIndex === 4 || sceneIndex === 6);

  return (
    <div
      className={`fixed inset-0 overflow-hidden bg-[#040914] transition-transform duration-500 ease-out ${cabinTransformClass}`}
    >
      {/* 1. Deep Space Viewport Backdrop (Mars Growing Ahead) */}
      {!bgErr ? (
        <img
          src={MARS_TRANSIT_BG}
          alt="View from inside rocket cockpit toward Mars"
          onError={() => setBgErr(true)}
          className="pointer-events-none absolute inset-0 w-full h-full max-w-full object-cover transition-all duration-1000 ease-out"
          style={{
            transform: `scale(${marsScale})`,
            opacity: isDepartingEarth ? 0.35 : 1,
            filter: isCabinDimmed
              ? 'brightness(0.65)'
              : !isCruising && !isDepartingEarth && sceneIndex === 5
                ? 'brightness(1.22) saturate(1.15)'
                : 'brightness(0.96)',
          }}
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#030712] via-[#0B162C] to-[#1D0F0C] flex items-center justify-center"
          aria-hidden="true"
        >
          <div className="flex flex-col items-center gap-1 opacity-70">
            <span className="text-6xl">🔴</span>
            <span className="font-display text-xs uppercase tracking-widest text-amber-300">
              Mars Ahead
            </span>
          </div>
        </div>
      )}

      {/* 2. Tiny Pale-Blue Earth Shrinking in Far Left Distance (after departure) */}
      {!isDepartingEarth && (
        <div
          className="pointer-events-none absolute top-20 left-[310px] z-10 hidden lg:flex flex-col items-center opacity-90 transition-all duration-700"
          aria-hidden="true"
        >
          <div
            className="rounded-full overflow-hidden shadow-[0_0_14px_rgba(96,165,250,0.7)] transition-all duration-700 bg-[#081326]"
            style={{ width: `${earthSizePx}px`, height: `${earthSizePx}px` }}
          >
            {!earthBadgeErr ? (
              <img
                src={EARTH_GLOBE_IMG}
                alt="Earth shrinking behind spacecraft"
                onError={() => setEarthBadgeErr(true)}
                className="w-full h-full max-w-full object-cover scale-[1.18]"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#60A5FA] via-[#2563EB] to-[#0F172A] flex items-center justify-center text-sm">
                🌍
              </div>
            )}
          </div>
          <span className="mt-1 text-[10px] tracking-wider uppercase text-blue-200/80">
            Earth behind
          </span>
        </div>
      )}

      {/* 3. Visible Spacecraft Solar Wing Outside Right Window */}
      {(isDepartingEarth ||
        isCruising ||
        sceneIndex === 1 ||
        sceneIndex === 7 ||
        sceneIndex === 8) && (
        <div
          className="pointer-events-none absolute right-0 top-24 z-10 hidden md:block transition-transform duration-700 animate-float-slow"
          style={{
            transform:
              !isCruising && !isDepartingEarth && sceneIndex === 7
                ? 'rotate(-16deg)'
                : 'rotate(-4deg)',
          }}
          aria-hidden="true"
        >
          <svg width="240" height="110" viewBox="0 0 260 120">
            <rect x="40" y="32" width="220" height="56" rx="4" fill="#172554" stroke="#64748B" strokeWidth="3" />
            <line x1="95" y1="32" x2="95" y2="88" stroke="#38BDF8" strokeWidth="1.5" opacity="0.7" />
            <line x1="150" y1="32" x2="150" y2="88" stroke="#38BDF8" strokeWidth="1.5" opacity="0.7" />
            <line x1="205" y1="32" x2="205" y2="88" stroke="#38BDF8" strokeWidth="1.5" opacity="0.7" />
            <line x1="40" y1="60" x2="260" y2="60" stroke="#94A3B8" strokeWidth="2" />
            {!isCruising && !isDepartingEarth && sceneIndex === 1 && (
              <rect x="40" y="32" width="220" height="56" rx="4" fill="#C2410C" opacity="0.48" />
            )}
            {!isCruising && !isDepartingEarth && sceneIndex === 8 && (
              <g transform="translate(65, 45)">
                <circle cx="18" cy="18" r="14" fill="#E2E8F0" stroke="#0F172A" strokeWidth="2" />
                <circle cx="18" cy="18" r="7" fill="#FACC15" opacity="0.85" />
              </g>
            )}
          </svg>
        </div>
      )}

      {/* 4. Continuous Moving Starfield + Earth Departure + Physical Hazard Canvas */}
      <canvas
        ref={canvasRef}
        width={1280}
        height={720}
        className="pointer-events-none absolute inset-0 w-full h-full z-10"
      />

      {/* 5. Physical Oxygen Leak Mist Jet on Inside Cabin Bulkhead (Scene 2.6) */}
      {!isCruising && !isDepartingEarth && sceneIndex === 6 && (
        <div
          className="pointer-events-none absolute right-8 top-1/3 z-15 flex items-center"
          aria-hidden="true"
        >
          <div className="w-40 h-16 bg-gradient-to-l from-cyan-100/75 via-cyan-200/35 to-transparent blur-sm rounded-full animate-pulse" />
          <div className="w-3 h-10 rounded-full bg-slate-600 border border-rose-400" />
        </div>
      )}

      {/* 6. Inside-of-Rocket Structural Cockpit Frame & Window Struts */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 w-full h-full z-15"
        aria-hidden="true"
      >
        <path
          d="M0 0 L1440 0 L1440 115 L1220 72 L220 72 L0 115 Z"
          fill="#0B1322"
          stroke="#253652"
          strokeWidth="4"
        />
        <polygon points="0,0 70,0 135,900 0,900" fill="#0D1628" stroke="#253652" strokeWidth="3" />
        <polygon points="1440,0 1370,0 1305,900 1440,900" fill="#0D1628" stroke="#253652" strokeWidth="3" />

        <line x1="220" y1="72" x2="115" y2="830" stroke="#1E2D45" strokeWidth="14" />
        <line x1="220" y1="72" x2="115" y2="830" stroke="#334A6E" strokeWidth="3" />
        <line x1="1220" y1="72" x2="1325" y2="830" stroke="#1E2D45" strokeWidth="14" />
        <line x1="1220" y1="72" x2="1325" y2="830" stroke="#334A6E" strokeWidth="3" />

        <path
          d="M0 825 L240 795 L1200 795 L1440 825 L1440 900 L0 900 Z"
          fill="#0A1220"
          stroke="#283C5C"
          strokeWidth="4"
        />
        <rect
          x="640"
          y="24"
          width="160"
          height="10"
          rx="5"
          fill={
            isAlertRed
              ? '#FF4D6D'
              : isDepartingEarth
                ? '#FF8C42'
                : isCruising
                  ? '#2EE59D'
                  : isCabinDimmed
                    ? '#334155'
                    : '#38BDF8'
          }
          opacity="0.8"
        />
        <rect x="480" y="28" width="90" height="6" rx="3" fill={isCabinDimmed ? '#1E293B' : '#FFB703'} opacity="0.7" />
        <rect x="870" y="28" width="90" height="6" rx="3" fill={isCabinDimmed ? '#1E293B' : '#FFB703'} opacity="0.7" />
      </svg>

      {/* Subtle Red Cabin Warning Vignette During Active Alerts */}
      {isAlertRed && (
        <div
          className="pointer-events-none absolute inset-0 z-15 ring-inset ring-[12px] ring-rose-500/20"
          aria-hidden="true"
        />
      )}
    </div>
  );
};
