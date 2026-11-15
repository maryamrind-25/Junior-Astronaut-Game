import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BatteryCharging,
  Check,
  Cpu,
  Droplets,
  Flame,
  FlaskConical,
  Heart,
  HelpCircle,
  LogOut,
  Rocket,
  RotateCcw,
  Scale,
  Settings,
  Shield,
  Smile,
  Star,
  Thermometer,
  UserCheck,
  Utensils,
  Volume2,
  VolumeX,
  Wind,
  Wrench,
  X,
} from 'lucide-react';
import { AudioManager } from '../game/audioManager';
import { parseDialogueSegments } from '../game/gameData';
import { ResourceKey, Resources, ReyesExpression } from '../game/types';
import { SciFiButton } from './SciFiButton';
import { SproutPlant } from './SproutPlant';

const REYES_PORTRAIT = '/images/reyes.png';
const CADET_AVATAR = '/images/cadet_astronaut.png';

const JOURNEY_NODES = [
  { id: 'earth', label: 'Earth', idx: 0 },
  { id: 'transit', label: 'Transit', idx: 1 },
  { id: 'landing', label: 'Landing', idx: 2 },
  { id: 'first_days', label: 'First Days', idx: 3 },
  { id: 'pressure', label: 'Pressure', idx: 4 },
  { id: 'crisis', label: 'Crisis', idx: 5 },
  { id: 'finale', label: 'Finale', idx: 6 },
];

interface MeterSpec {
  key: ResourceKey;
  label: string;
  icon: React.FC<{ className?: string }>;
  barColor: string;
}

const TOP_RIGHT_METERS: MeterSpec[] = [
  { key: 'oxygen', label: 'O2', icon: Wind, barColor: 'bg-[#00D4FF]' },
  { key: 'water', label: 'WATER', icon: Droplets, barColor: 'bg-[#38BDF8]' },
  { key: 'food', label: 'FOOD', icon: Utensils, barColor: 'bg-[#2EE59D]' },
  { key: 'power', label: 'POWER', icon: BatteryCharging, barColor: 'bg-[#FACC15]' },
  { key: 'shield', label: 'SHIELD', icon: Shield, barColor: 'bg-[#A855F7]' },
  { key: 'fuel', label: 'FUEL', icon: Flame, barColor: 'bg-[#FB923C]' },
];

const LEFT_SYSTEM_METERS: MeterSpec[] = [
  { key: 'suit', label: 'SUIT', icon: UserCheck, barColor: 'bg-[#2EE59D]' },
  { key: 'thermal', label: 'THERMAL', icon: Thermometer, barColor: 'bg-[#FACC15]' },
  { key: 'mass', label: 'MASS', icon: Scale, barColor: 'bg-[#94A3B8]' },
  { key: 'morale', label: 'MORALE', icon: Smile, barColor: 'bg-[#FBBF24]' },
  { key: 'science', label: 'SCIENCE', icon: FlaskConical, barColor: 'bg-[#38BDF8]' },
];

interface Level3HudProps {
  username: string;
  cadetLevel: number;
  stars: number;
  resources: Resources;
  repairKits: number;
  co2Cartridges: number;
  currentPart: 1 | 2 | 3 | 4 | 5;
  stepIndex: number;
  isComplete?: boolean;
  objectiveText: string;
  ariaStatusText?: string;
  dialogueText: string;
  expression: ReyesExpression;
  showNextButton: boolean;
  blooming?: boolean;
  trembling?: boolean;
  onDialogueNext: () => void;
  onRestartLevel: () => void;
  onQuitToMenu: () => void;
}

export const Level3Hud: React.FC<Level3HudProps> = ({
  username,
  cadetLevel,
  stars,
  resources,
  repairKits,
  co2Cartridges,
  currentPart,
  stepIndex,
  isComplete = false,
  objectiveText,
  ariaStatusText,
  dialogueText,
  expression,
  showNextButton,
  blooming = false,
  trembling = false,
  onDialogueNext,
  onRestartLevel,
  onQuitToMenu,
}) => {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [howToOpen, setHowToOpen] = useState(false);
  const [muted, setMuted] = useState(AudioManager.isMuted());

  const [visibleChars, setVisibleChars] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [reyesBounce, setReyesBounce] = useState(false);
  const [cadetImgErr, setCadetImgErr] = useState(false);
  const [reyesImgErr, setReyesImgErr] = useState(false);

  // Track meter changes to flash green on increase / red on decrease
  const prevResourcesRef = useRef<Resources>(resources);
  const [flashes, setFlashes] = useState<
    Partial<Record<ResourceKey, { dir: 'up' | 'down'; delta: number }>>
  >({});

  useEffect(() => {
    const prev = prevResourcesRef.current;
    const nextFlashes: Partial<
      Record<ResourceKey, { dir: 'up' | 'down'; delta: number }>
    > = {};
    (Object.keys(resources) as ResourceKey[]).forEach((k) => {
      const diff = resources[k] - prev[k];
      if (diff > 0) nextFlashes[k] = { dir: 'up', delta: diff };
      else if (diff < 0) nextFlashes[k] = { dir: 'down', delta: diff };
    });
    prevResourcesRef.current = resources;

    if (Object.keys(nextFlashes).length > 0) {
      setFlashes(nextFlashes);
      const t = window.setTimeout(() => setFlashes({}), 1200);
      return () => window.clearTimeout(t);
    }
  }, [resources]);

  // Typing animation + female voice for Commander Reyes
  const segments = parseDialogueSegments(dialogueText);
  const fullPlainText = segments.map((s) => s.text).join('');
  const totalLength = fullPlainText.length;

  useEffect(() => {
    setVisibleChars(0);
    setIsTyping(totalLength > 0);
    setReyesBounce(true);
    if (fullPlainText.trim()) {
      AudioManager.speakReyes(fullPlainText);
    } else {
      AudioManager.stopReyesSpeech();
    }
    const bounceTimer = window.setTimeout(() => setReyesBounce(false), 260);
    return () => window.clearTimeout(bounceTimer);
  }, [dialogueText, fullPlainText, totalLength]);

  useEffect(() => {
    return () => {
      AudioManager.stopReyesSpeech();
    };
  }, []);

  useEffect(() => {
    if (!isTyping) return;
    if (visibleChars >= totalLength) {
      setIsTyping(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setVisibleChars((c) => c + 1);
    }, 18);
    return () => window.clearTimeout(timer);
  }, [isTyping, visibleChars, totalLength]);

  const handleNextClick = () => {
    AudioManager.stopReyesSpeech();
    if (isTyping) {
      setVisibleChars(totalLength);
      setIsTyping(false);
      return;
    }
    onDialogueNext();
  };

  const renderTypedSegments = () => {
    let remaining = visibleChars;
    return segments.map((seg, idx) => {
      if (remaining <= 0) return null;
      const slice = seg.text.slice(0, remaining);
      remaining -= slice.length;
      return (
        <span
          key={idx}
          style={seg.color ? { color: seg.color, fontWeight: 700 } : undefined}
        >
          {slice}
        </span>
      );
    });
  };

  const handleToggleMute = () => {
    const nowMuted = AudioManager.toggleMute();
    setMuted(nowMuted);
  };

  const expressionBorder =
    expression === 'happy'
      ? 'border-[#2EE59D] shadow-[0_0_16px_rgba(46,229,157,0.35)]'
      : expression === 'worried'
        ? 'border-[#FF4D6D] shadow-[0_0_16px_rgba(255,77,109,0.4)]'
        : 'border-[#00D4FF]/90 shadow-[0_0_16px_rgba(0,212,255,0.28)]';

  const expressionLabel =
    expression === 'happy'
      ? 'Happy'
      : expression === 'worried'
        ? 'Serious'
        : 'Guidance';

  const activeNodeIdx = isComplete ? 6 : currentPart + 1;
  const clampedScene = Math.max(1, Math.min(17, stepIndex || 1));
  const rocketTrackPct = Math.round(
    (activeNodeIdx / (JOURNEY_NODES.length - 1)) * 100
  );
  const healthFlash = flashes.health;

  return (
    <>
      {/* TOP-LEFT: Compact Glowing Cadet Card */}
      <div className="fixed top-2 left-2 z-30 flex items-center gap-2 rounded-[12px] border border-[#00D4FF]/90 bg-[#06142C]/86 px-2.5 py-1.5 shadow-[0_0_16px_rgba(0,212,255,0.25)] backdrop-blur-md w-[166px] lg:w-[196px]">
        <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full overflow-hidden border border-[#00D4FF] bg-[#0B2240] shrink-0 flex items-center justify-center shadow-[0_0_8px_rgba(0,212,255,0.35)]">
          {!cadetImgErr ? (
            <img
              src={CADET_AVATAR}
              alt="Cadet avatar"
              onError={() => setCadetImgErr(true)}
              className="w-full h-full max-w-full object-contain p-0.5"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0EA5E9] to-[#1E3A8A] flex items-center justify-center text-sm">
              <span role="img" aria-label="Cadet">
                👨‍🚀
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <p className="font-display font-extrabold text-[11px] text-white truncate uppercase tracking-wide">
              {username}
            </p>
            <div className="flex items-center gap-0.5 shrink-0">
              {[0, 1, 2].map((i) => (
                <Star
                  key={i}
                  className={`w-2.5 h-2.5 ${
                    i < stars
                      ? 'fill-[#FFB703] text-[#FFB703]'
                      : 'text-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>

          <p className="text-[10px] font-bold text-[#FFD966] leading-tight">
            LV {String(Math.max(3, cadetLevel)).padStart(2, '0')} · MARS
          </p>

          <div
            className={`mt-0.5 transition-colors ${
              healthFlash?.dir === 'down'
                ? 'ring-1 ring-rose-400 rounded px-0.5'
                : healthFlash?.dir === 'up'
                  ? 'ring-1 ring-emerald-400 rounded px-0.5'
                  : ''
            }`}
          >
            <div className="flex items-center justify-between text-[9px] font-mono-num">
              <span className="inline-flex items-center gap-0.5 text-rose-300 font-bold">
                <Heart className="w-2.5 h-2.5 fill-rose-500 text-rose-500" />
                HP
              </span>
              <span className="text-white font-bold">{resources.health}%</span>
            </div>
            <div className="h-1 w-full rounded-full bg-slate-800/90 overflow-hidden border border-cyan-500/35">
              <div
                className="h-full bg-gradient-to-r from-[#22C55E] to-[#4ADE80] transition-all duration-300"
                style={{ width: `${resources.health}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* MIDDLE-LEFT: Slim Suit / Thermal / Systems Strip (Scroll-safe on short landscape phones) */}
      <aside
        aria-label="Suit and Outpost Systems"
        className="fixed top-[68px] lg:top-[74px] left-2 z-25 hidden sm:flex flex-col gap-1 rounded-[12px] border border-[#00D4FF]/80 bg-[#06142C]/84 px-2 py-1.5 shadow-[0_0_14px_rgba(0,212,255,0.2)] backdrop-blur-md w-[134px] lg:w-[152px] max-h-[calc(100%-195px)] overflow-y-auto no-scrollbar"
      >
        <div className="flex items-center justify-between text-[9px] font-mono-num text-amber-300 border-b border-cyan-500/25 pb-0.5">
          <span className="inline-flex items-center gap-0.5">
            <Wrench className="w-2.5 h-2.5" />
            Kits:{repairKits}
          </span>
          <span>CO2:{co2Cartridges}</span>
        </div>

        {LEFT_SYSTEM_METERS.map(({ key, label, icon: Icon, barColor }) => {
          const val = resources[key];
          const flash = flashes[key];
          return (
            <div
              key={key}
              className={`space-y-0.5 rounded px-0.5 -mx-0.5 transition-colors ${
                flash?.dir === 'up'
                  ? 'bg-emerald-500/25 ring-1 ring-emerald-400'
                  : flash?.dir === 'down'
                    ? 'bg-rose-500/25 ring-1 ring-rose-400'
                    : ''
              }`}
            >
              <div className="flex items-center justify-between text-[9px] lg:text-[10px]">
                <span className="inline-flex items-center gap-1 font-display font-bold text-slate-100">
                  <Icon className="w-2.5 h-2.5 text-[#5CEEFF]" />
                  {label}
                </span>
                <span className="font-mono-num font-bold text-white">
                  {val}%
                </span>
              </div>
              <div className="h-1 w-full rounded-full bg-slate-800/90 overflow-hidden border border-cyan-500/30">
                <div
                  className={`h-full transition-all duration-300 ${barColor}`}
                  style={{ width: `${val}%` }}
                />
              </div>
            </div>
          );
        })}
      </aside>

      {/* TOP-CENTER: Sleek Compact Mission 03 Header + Journey Strip */}
      <div
        aria-label="Mission Objective and Mars Journey Map"
        className="fixed top-[68px] sm:top-2 left-2 right-2 sm:left-[174px] sm:right-[178px] lg:left-[204px] lg:right-[206px] z-25 flex flex-col items-center pointer-events-none"
      >
        <div className="pointer-events-auto w-full max-w-[440px] rounded-[12px] border border-[#00D4FF]/90 bg-[#06142C]/86 px-2.5 py-1.5 shadow-[0_0_16px_rgba(0,212,255,0.25)] backdrop-blur-md">
          <div className="flex items-center justify-between gap-2">
            <h1 className="font-display text-[11px] lg:text-xs font-extrabold tracking-wider text-white uppercase truncate">
              MISSION 03:{' '}
              <span className="text-[#FFD966]">SURVIVE ON MARS</span>
            </h1>
            <span className="font-mono-num text-[10px] font-bold text-[#5CEEFF] shrink-0">
              {isComplete ? 'Done' : `${clampedScene}/17`}
            </span>
          </div>

          <div className="mt-0.5 flex items-center gap-1 text-[10px] lg:text-[11px] text-slate-100">
            <AlertTriangle className="w-3 h-3 text-[#FFB703] shrink-0" />
            <span className="truncate font-medium">{objectiveText}</span>
          </div>

          {/* Slim Journey Nodes */}
          <div className="relative mt-1 pt-1 border-t border-cyan-500/25">
            <div className="hidden sm:block absolute left-3 right-3 top-[10px] h-0.5 bg-slate-700/80">
              <div
                className="h-full bg-gradient-to-r from-[#2EE59D] via-[#00D4FF] to-[#FF8C42] transition-all duration-500"
                style={{ width: `${rocketTrackPct}%` }}
              />
              <div
                className="absolute -top-1.5 -translate-x-1/2 flex items-center justify-center w-3 h-3 rounded-full bg-[#FFB703] text-slate-950"
                style={{ left: `${rocketTrackPct}%` }}
              >
                <Rocket className="w-2 h-2" />
              </div>
            </div>

            <div className="relative z-10 flex items-center justify-between gap-0.5 overflow-x-auto no-scrollbar">
              {JOURNEY_NODES.map((node) => {
                const done = isComplete ? true : node.idx < activeNodeIdx;
                const current = !isComplete && node.idx === activeNodeIdx;
                return (
                  <div
                    key={node.id}
                    className="flex flex-col items-center shrink-0 min-w-[28px]"
                  >
                    <div
                      className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] font-bold border ${
                        done
                          ? 'bg-[#2EE59D] border-[#2EE59D] text-slate-950'
                          : current
                            ? 'bg-[#FF8C42] border-[#FFD966] text-slate-950 scale-110'
                            : 'bg-[#0E2240] border-slate-600 text-slate-400'
                      }`}
                    >
                      {done ? <Check className="w-2 h-2 stroke-[3]" /> : node.idx + 1}
                    </div>
                    <span
                      className={`hidden md:block text-[8px] font-semibold whitespace-nowrap ${
                        current
                          ? 'text-[#FFD966]'
                          : done
                            ? 'text-emerald-300'
                            : 'text-slate-400'
                      }`}
                    >
                      {node.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* TOP-RIGHT: Compact Outpost Vitals + How To Play (?) + Menu */}
      <aside
        aria-label="Vital Mars Survival Resources"
        className="fixed top-2 right-2 z-30 flex flex-col gap-1 rounded-[12px] border border-[#00D4FF]/90 bg-[#06142C]/86 px-2.5 py-1.5 shadow-[0_0_16px_rgba(0,212,255,0.25)] backdrop-blur-md w-[170px] lg:w-[198px]"
      >
        <div className="flex items-center justify-between gap-1 border-b border-cyan-500/25 pb-1">
          <span className="font-display text-[10px] font-bold uppercase tracking-wider text-[#5CEEFF]">
            Vitals
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setHowToOpen(true)}
              aria-label="How to Play and Controls"
              title="How to Play & Controls"
              className="w-5 h-5 rounded border border-cyan-400/70 bg-[#0D2140] hover:bg-[#163666] text-[#FFD966] flex items-center justify-center cursor-pointer"
            >
              <HelpCircle className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setSettingsOpen(true)}
              aria-label="Open Mission Settings"
              className="inline-flex items-center gap-1 rounded border border-cyan-400/70 bg-[#0D2140] hover:bg-[#163666] px-1.5 py-0.5 text-[9px] font-semibold text-cyan-100 cursor-pointer"
            >
              <Settings className="w-2.5 h-2.5" />
              <span>Menu</span>
            </button>
          </div>
        </div>

        <div className="space-y-0.5">
          {TOP_RIGHT_METERS.map(({ key, label, icon: Icon, barColor }) => {
            const val = resources[key];
            const flash = flashes[key];
            return (
              <div
                key={key}
                className={`flex items-center gap-1.5 rounded px-0.5 -mx-0.5 transition-colors ${
                  flash?.dir === 'up'
                    ? 'bg-emerald-500/25 ring-1 ring-emerald-400'
                    : flash?.dir === 'down'
                      ? 'bg-rose-500/25 ring-1 ring-rose-400'
                      : ''
                }`}
              >
                <span className="inline-flex items-center gap-1 w-[52px] text-[9px] lg:text-[10px] font-display font-bold text-slate-100 shrink-0">
                  <Icon className="w-2.5 h-2.5 text-[#5CEEFF] shrink-0" />
                  {label}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-slate-800/95 overflow-hidden border border-cyan-500/35">
                  <div
                    className={`h-full transition-all duration-300 ${barColor}`}
                    style={{ width: `${val}%` }}
                  />
                </div>
                <span className="w-[28px] text-right font-mono-num text-[9px] lg:text-[10px] font-bold text-white shrink-0">
                  {val}%
                </span>
              </div>
            );
          })}
        </div>
      </aside>

      {/* BOTTOM-RIGHT: Compact ARIA + Sprout Card (Fits cleanly even on 375px landscape phones) */}
      <aside
        aria-label="ARIA Telemetry and Sprout Plant"
        className="fixed bottom-2 right-2 z-25 hidden sm:flex flex-col gap-1.5 rounded-[12px] border border-[#00D4FF]/80 bg-[#06142C]/84 p-2 shadow-[0_0_16px_rgba(0,212,255,0.2)] backdrop-blur-md w-[162px] lg:w-[186px]"
      >
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-1 font-display text-[10px] font-extrabold text-white">
            <Cpu className="w-3 h-3 text-[#5CEEFF]" />
            ARIA
          </span>
          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#2EE59D]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2EE59D] animate-pulse" />
            ONLINE
          </span>
        </div>

        <p className="text-[10px] leading-tight text-cyan-100/95 bg-[#0A1E3D]/70 rounded px-1.5 py-1 border border-cyan-500/30 line-clamp-2">
          {ariaStatusText || 'Keep Oxygen, Power & Sprout above 30%.'}
        </p>

        <SproutPlant
          variant="embedded"
          food={resources.food}
          sproutHealth={resources.sproutHealth}
          blooming={blooming}
          trembling={trembling}
        />
      </aside>

      {/* BOTTOM-LEFT: Compact Commander Reyes + Overhead Speech Bubble */}
      <div className="fixed bottom-2 left-2 z-30 flex flex-col items-start pointer-events-none max-w-[230px] lg:max-w-[260px]">
        <div
          className={`pointer-events-auto relative mb-1.5 w-[205px] sm:w-[220px] lg:w-[250px] rounded-[12px] border bg-[#06142C]/90 px-2.5 py-2 backdrop-blur-md transition-all duration-200 ${expressionBorder}`}
        >
          <div className="flex items-center justify-between text-[10px] mb-0.5">
            <span className="font-display font-bold text-[#FFD966]">
              Commander Reyes
            </span>
            <span className="text-cyan-200/80">{expressionLabel}</span>
          </div>

          <p className="text-[11px] lg:text-xs leading-snug text-slate-100 min-h-[28px]">
            {renderTypedSegments()}
          </p>

          {showNextButton && (
            <div className="mt-1.5 flex justify-end">
              <SciFiButton
                variant="gold"
                onClick={handleNextClick}
                className="min-h-[28px] px-2.5 py-0.5 text-[11px]"
              >
                {isTyping ? 'Skip' : 'Next ▶'}
              </SciFiButton>
            </div>
          )}

          <div
            className="absolute -bottom-1.5 left-6 w-3 h-3 rotate-45 bg-[#06142C] border-r border-b border-inherit"
            aria-hidden="true"
          />
        </div>

        <div
          className={`pointer-events-auto flex items-center gap-2 rounded-[12px] border bg-[#06142C]/90 p-1 pr-2.5 backdrop-blur-md transition-transform duration-200 ${
            reyesBounce ? 'scale-95' : 'scale-100'
          } ${expressionBorder}`}
        >
          <div className="w-9 h-9 lg:w-11 lg:h-11 rounded-[8px] overflow-hidden bg-[#0E2240] shrink-0">
            {!reyesImgErr ? (
              <img
                src={REYES_PORTRAIT}
                alt="Commander Reyes"
                onError={() => setReyesImgErr(true)}
                className="w-full h-full max-w-full object-cover object-top"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1E3A8A] to-[#0F172A] flex flex-col items-center justify-center font-display font-bold text-[#FFD966]">
                <span className="text-base leading-none" role="img" aria-label="Commander Reyes">
                  👩‍✈️
                </span>
                <span className="text-[8px] tracking-wider">CR</span>
              </div>
            )}
          </div>
          <div>
            <p className="font-display font-bold text-[11px] text-white leading-tight">
              Commander Reyes
            </p>
            <p className="text-[9px] text-cyan-300/85">Mars Mission Lead</p>
          </div>
        </div>
      </div>

      {/* Mission Settings Modal */}
      {settingsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          <div className="w-full max-w-sm rounded-[14px] border-2 border-[#00D4FF] bg-[#06142C] p-5 shadow-[0_0_28px_rgba(0,212,255,0.35)]">
            <div className="flex items-center justify-between mb-4">
              <h2
                id="settings-title"
                className="font-display text-lg font-bold text-white"
              >
                Mission Paused
              </h2>
              <button
                type="button"
                onClick={() => setSettingsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Close Settings"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5">
              <SciFiButton
                variant="gold"
                onClick={() => setSettingsOpen(false)}
              >
                <span>Resume Mission</span>
              </SciFiButton>

              <SciFiButton variant="cyan" onClick={handleToggleMute}>
                {muted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
                <span>{muted ? 'Sound: Muted' : 'Sound: On'}</span>
              </SciFiButton>

              <SciFiButton
                variant="cyan"
                onClick={() => {
                  setSettingsOpen(false);
                  setHowToOpen(true);
                }}
              >
                <HelpCircle className="w-4 h-4" />
                <span>How to Play & Controls</span>
              </SciFiButton>

              <SciFiButton
                variant="danger"
                onClick={() => {
                  setSettingsOpen(false);
                  onRestartLevel();
                }}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Restart Level</span>
              </SciFiButton>

              <SciFiButton
                variant="danger"
                onClick={() => {
                  setSettingsOpen(false);
                  onQuitToMenu();
                }}
              >
                <LogOut className="w-4 h-4" />
                <span>Quit to Menu</span>
              </SciFiButton>
            </div>
          </div>
        </div>
      )}

      {/* How To Play & Controls Modal */}
      {howToOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="howto-title"
        >
          <div className="w-full max-w-md rounded-[14px] border-2 border-[#00D4FF] bg-[#06142C] p-5 shadow-[0_0_28px_rgba(0,212,255,0.35)]">
            <div className="flex items-center justify-between mb-3">
              <h2
                id="howto-title"
                className="font-display text-lg font-bold text-[#FFD966]"
              >
                How to Play & Controls
              </h2>
              <button
                type="button"
                onClick={() => setHowToOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Close How to Play"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs sm:text-sm text-slate-200 mb-4">
              <div className="rounded-lg border border-cyan-500/40 bg-[#0B2044]/75 p-2.5">
                <p className="font-display font-bold text-[#5CEEFF] mb-1">
                  Movement on Mars
                </p>
                <p>
                  <strong className="text-white">Laptop / Keyboard:</strong> Use{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-cyan-400/60 text-[11px]">
                    W A S D
                  </kbd>{' '}
                  or{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-cyan-400/60 text-[11px]">
                    Arrow Keys
                  </kbd>{' '}
                  or click anywhere on the Mars ground.
                </p>
                <p className="mt-1">
                  <strong className="text-white">Phone / Touch:</strong> Tap
                  anywhere on the Mars terrain or tap the glowing problem icon to
                  walk there.
                </p>
              </div>

              <div className="rounded-lg border border-cyan-500/40 bg-[#0B2044]/75 p-2.5">
                <p className="font-display font-bold text-[#FFD966] mb-1">
                  Solving Issues
                </p>
                <p>
                  First walk your astronaut right up to the pulsing problem icon
                  on Mars. Once nearby, press{' '}
                  <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-cyan-400/60 text-[11px]">
                    E
                  </kbd>{' '}
                  or tap <strong className="text-[#2EE59D]">Solve Issue</strong>{' '}
                  to inspect options and protect your outpost!
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <SciFiButton variant="cyan" onClick={() => setHowToOpen(false)}>
                Got It
              </SciFiButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
