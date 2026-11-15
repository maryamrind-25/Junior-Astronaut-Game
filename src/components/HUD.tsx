import React, { useEffect, useRef, useState } from 'react';
import {
  BatteryCharging,
  Droplets,
  Flame,
  FlaskConical,
  HeartPulse,
  HelpCircle,
  LogOut,
  RotateCcw,
  Scale,
  Settings,
  Shield,
  Smile,
  Sprout,
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

const REYES_PORTRAIT = '/images/reyes.png';
const CADET_AVATAR = '/images/cadet_astronaut.png';

interface HUDProps {
  username: string;
  cadetLevel: number;
  stars: number;
  resources: Resources;
  repairKits?: number;
  co2Cartridges?: number;
  mode?: 'level1' | 'level2' | 'level3';
  dialogueText: string;
  expression: ReyesExpression;
  showNextButton: boolean;
  showDialogue: boolean;
  onDialogueNext: () => void;
  onRestartLevel: () => void;
  onQuitToMenu: () => void;
}

interface ResourceMetaItem {
  key: ResourceKey;
  label: string;
  shortLabel: string;
  icon: React.FC<{ className?: string }>;
  barColor: string;
}

const LEVEL1_RESOURCE_META: ResourceMetaItem[] = [
  { key: 'oxygen', label: 'Oxygen', shortLabel: 'O2', icon: Wind, barColor: 'bg-[#00D4FF]' },
  { key: 'food', label: 'Food', shortLabel: 'Fd', icon: Utensils, barColor: 'bg-[#2EE59D]' },
  { key: 'water', label: 'Water', shortLabel: 'Wt', icon: Droplets, barColor: 'bg-[#38BDF8]' },
  { key: 'fuel', label: 'Fuel', shortLabel: 'Fl', icon: Flame, barColor: 'bg-[#FFB703]' },
];

const LEVEL2_RESOURCE_META: ResourceMetaItem[] = [
  { key: 'oxygen', label: 'O2', shortLabel: 'O2', icon: Wind, barColor: 'bg-[#00D4FF]' },
  { key: 'water', label: 'Water', shortLabel: 'Wt', icon: Droplets, barColor: 'bg-[#38BDF8]' },
  { key: 'food', label: 'Food', shortLabel: 'Fd', icon: Utensils, barColor: 'bg-[#2EE59D]' },
  { key: 'power', label: 'Power', shortLabel: 'Pw', icon: BatteryCharging, barColor: 'bg-[#FACC15]' },
  { key: 'fuel', label: 'Fuel', shortLabel: 'Fl', icon: Flame, barColor: 'bg-[#FFB703]' },
  { key: 'shield', label: 'Shield', shortLabel: 'Sh', icon: Shield, barColor: 'bg-[#60A5FA]' },
  { key: 'suit', label: 'Suit', shortLabel: 'Su', icon: UserCheck, barColor: 'bg-[#A78BFA]' },
  { key: 'thermal', label: 'Thermal', shortLabel: 'Th', icon: Thermometer, barColor: 'bg-[#FB923C]' },
  { key: 'mass', label: 'Mass', shortLabel: 'Ms', icon: Scale, barColor: 'bg-[#94A3B8]' },
  { key: 'health', label: 'Health', shortLabel: 'Hp', icon: HeartPulse, barColor: 'bg-[#F472B6]' },
  { key: 'sproutHealth', label: 'Sprout', shortLabel: 'Sp', icon: Sprout, barColor: 'bg-[#34D399]' },
];

const LEVEL3_RESOURCE_META: ResourceMetaItem[] = [
  ...LEVEL2_RESOURCE_META,
  { key: 'morale', label: 'Morale', shortLabel: 'Mr', icon: Smile, barColor: 'bg-[#FBBF24]' },
  { key: 'science', label: 'Science', shortLabel: 'Sc', icon: FlaskConical, barColor: 'bg-[#38BDF8]' },
];

export const HUD: React.FC<HUDProps> = ({
  username,
  cadetLevel,
  stars,
  resources,
  repairKits = 0,
  co2Cartridges = 6,
  mode = 'level1',
  dialogueText,
  expression,
  showNextButton,
  showDialogue,
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
    let hasChange = false;

    (Object.keys(resources) as ResourceKey[]).forEach((key) => {
      const diff = resources[key] - prev[key];
      if (diff !== 0) {
        nextFlashes[key] = { dir: diff > 0 ? 'up' : 'down', delta: diff };
        hasChange = true;
      }
    });

    prevResourcesRef.current = resources;

    if (hasChange) {
      setFlashes(nextFlashes);
      const timer = window.setTimeout(() => setFlashes({}), 1500);
      return () => window.clearTimeout(timer);
    }
  }, [resources]);

  const segments = parseDialogueSegments(dialogueText);
  const fullPlainText = segments.map((s) => s.text).join('');

  useEffect(() => {
    if (!showDialogue || !fullPlainText) {
      setVisibleChars(0);
      setIsTyping(false);
      AudioManager.stopReyesSpeech();
      return;
    }

    setVisibleChars(0);
    setIsTyping(true);
    AudioManager.speakReyes(fullPlainText);

    const interval = window.setInterval(() => {
      setVisibleChars((prev) => {
        if (prev + 1 >= fullPlainText.length) {
          window.clearInterval(interval);
          setIsTyping(false);
          return fullPlainText.length;
        }
        return prev + 1;
      });
    }, 20);

    return () => {
      window.clearInterval(interval);
    };
  }, [dialogueText, showDialogue, fullPlainText]);

  useEffect(() => {
    return () => {
      AudioManager.stopReyesSpeech();
    };
  }, []);

  useEffect(() => {
    if (!showDialogue) return;
    setReyesBounce(true);
    const t = window.setTimeout(() => setReyesBounce(false), 260);
    return () => window.clearTimeout(t);
  }, [expression, dialogueText, showDialogue]);

  const handleNextClick = () => {
    AudioManager.stopReyesSpeech();
    if (isTyping) {
      setVisibleChars(fullPlainText.length);
      setIsTyping(false);
      return;
    }
    onDialogueNext();
  };

  const handleToggleMute = () => {
    const nextMuted = AudioManager.toggleMute();
    setMuted(nextMuted);
  };

  const renderTypedSegments = () => {
    let remaining = visibleChars;
    return segments.map((seg, idx) => {
      if (remaining <= 0) return null;
      const slice = seg.text.slice(0, remaining);
      remaining -= slice.length;
      if (seg.color) {
        return (
          <span key={idx} style={{ color: seg.color }} className="font-bold">
            {slice}
          </span>
        );
      }
      return <span key={idx}>{slice}</span>;
    });
  };

  const expressionBorder =
    expression === 'happy'
      ? 'border-[#2EE59D] shadow-[0_0_22px_rgba(46,229,157,0.38)]'
      : expression === 'worried'
        ? 'border-[#FF4D6D] shadow-[0_0_22px_rgba(255,77,109,0.42)]'
        : 'border-[#00D4FF] shadow-[0_0_22px_rgba(0,212,255,0.35)]';

  const expressionLabel =
    expression === 'happy'
      ? 'Happy'
      : expression === 'worried'
        ? 'Worried'
        : 'Guidance';

  const resourceList =
    mode === 'level3'
      ? LEVEL3_RESOURCE_META
      : mode === 'level2'
        ? LEVEL2_RESOURCE_META
        : LEVEL1_RESOURCE_META;

  return (
    <>
      {/* Top-Left Cadet Panel */}
      <div className="fixed top-2.5 left-2.5 z-30 flex items-center gap-2.5 rounded-[12px] border border-[#00D4FF]/85 bg-[#06142C]/88 px-2.5 py-1.5 shadow-[0_0_16px_rgba(0,212,255,0.22)] backdrop-blur-md">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-[#FFB703] bg-[#0B2240] shrink-0 flex items-center justify-center">
          {!cadetImgErr ? (
            <img
              src={CADET_AVATAR}
              alt="Cadet avatar"
              onError={() => setCadetImgErr(true)}
              className="w-full h-full max-w-full object-contain p-1"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#0EA5E9] to-[#1E3A8A] flex items-center justify-center text-base">
              <span role="img" aria-label="Cadet">
                👨‍🚀
              </span>
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="font-display font-bold text-sm text-white truncate max-w-[160px]">
            {username}
          </p>
          <p className="text-xs text-cyan-200/85">
            Level {cadetLevel} Cadet
            {mode === 'level2'
              ? ' · Mars'
              : mode === 'level3'
                ? ' · Mars Outpost'
                : ''}
          </p>
          <div
            className="flex items-center gap-1 mt-0.5"
            aria-label={`${stars} out of 3 stars`}
          >
            {[0, 1, 2].map((i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < stars
                    ? 'fill-[#FFB703] text-[#FFB703]'
                    : 'text-slate-600'
                }`}
              />
            ))}
            <span className="font-mono-num text-xs text-[#FFD966] ml-1">
              {stars}/3
            </span>
          </div>
        </div>
      </div>

      {/* Left-Middle Resources / Meters Panel */}
      <aside
        aria-label={
          mode === 'level3'
            ? 'Mars Outpost Meters'
            : mode === 'level2'
              ? 'Mars Transit Meters'
              : 'My Supplies'
        }
        className={`fixed top-[74px] left-2.5 z-30 hidden sm:flex flex-col rounded-[12px] border border-[#00D4FF]/80 bg-[#06142C]/86 shadow-[0_0_16px_rgba(0,212,255,0.2)] backdrop-blur-md ${
          mode === 'level2' || mode === 'level3'
            ? 'w-48 lg:w-56 gap-1 px-2.5 py-2 max-h-[calc(100%-215px)] overflow-y-auto no-scrollbar'
            : 'w-48 gap-2 px-3 py-2.5'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-xs font-bold uppercase tracking-widest text-cyan-300">
            {mode === 'level3'
              ? 'Outpost Meters'
              : mode === 'level2'
                ? 'Ship Meters'
                : 'My Supplies'}
          </h2>
          {(mode === 'level2' || mode === 'level3') && (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono-num text-amber-300">
              <Wrench className="w-3 h-3" />
              Kits: {repairKits}
              {mode === 'level3' ? ` · CO2: ${co2Cartridges}` : ''}
            </span>
          )}
        </div>

        {resourceList.map(({ key, label, icon: Icon, barColor }) => {
          const val = resources[key];
          const flash = flashes[key];
          const status = val <= 45 ? 'Low' : val <= 70 ? 'Watch' : 'OK';
          const flashBox =
            flash?.dir === 'up'
              ? 'bg-emerald-500/25 ring-1 ring-emerald-400 rounded-md px-1.5 -mx-1.5'
              : flash?.dir === 'down'
                ? 'bg-rose-500/25 ring-1 ring-rose-400 rounded-md px-1.5 -mx-1.5'
                : '';

          return (
            <div
              key={key}
              className={`space-y-0.5 transition-colors duration-300 ${flashBox}`}
            >
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1.5 text-slate-200 font-medium">
                  <Icon className="w-3.5 h-3.5 text-cyan-300 shrink-0" />
                  {label}
                </span>
                <span className="font-mono-num text-slate-100">
                  {flash && (
                    <span
                      className={`mr-1.5 font-bold ${
                        flash.dir === 'up'
                          ? 'text-emerald-300'
                          : 'text-rose-400'
                      }`}
                    >
                      {flash.delta > 0 ? `+${flash.delta}` : flash.delta}
                    </span>
                  )}
                  {val}% ·{' '}
                  <span
                    className={
                      status === 'OK'
                        ? 'text-emerald-300'
                        : status === 'Watch'
                          ? 'text-amber-300'
                          : 'text-rose-400'
                    }
                  >
                    {status}
                  </span>
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-slate-800/90 overflow-hidden border border-slate-700">
                <div
                  className={`h-full transition-all duration-300 ease-out ${barColor}`}
                  style={{ width: `${val}%` }}
                />
              </div>
            </div>
          );
        })}
      </aside>

      {/* Compact Mobile Resource Strip */}
      <div
        aria-label="Ship Resources Mobile"
        className="fixed top-20 left-4 right-4 z-25 flex sm:hidden items-center justify-between gap-2 rounded-[10px] border border-[#00D4FF]/65 bg-[#081326]/90 px-3 py-1.5 text-xs backdrop-blur-md overflow-x-auto"
      >
        {(mode === 'level2' || mode === 'level3'
          ? resourceList.slice(0, 6)
          : LEVEL1_RESOURCE_META
        ).map(({ key, shortLabel, icon: Icon }) => (
          <div
            key={key}
            className="flex items-center gap-1 font-mono-num shrink-0"
          >
            <Icon className="w-3.5 h-3.5 text-cyan-300" />
            <span className="text-slate-300">{shortLabel}:</span>
            <span className="font-bold text-white">{resources[key]}%</span>
          </div>
        ))}
      </div>

      {/* Top-Right Settings Button */}
      <div className="fixed top-4 right-4 z-30 flex items-center gap-2">
        <SciFiButton
          variant="cyan"
          onClick={() => setSettingsOpen(true)}
          aria-label="Open Mission Settings"
        >
          <Settings className="w-4 h-4" />
          <span>Settings</span>
        </SciFiButton>
      </div>

      {/* Bottom-Left Commander Reyes & Overhead Speech Bubble */}
      <div className="fixed bottom-2.5 left-2.5 z-30 flex flex-col items-start pointer-events-none max-w-[270px] lg:max-w-[320px]">
        {showDialogue && (
          <div
            className={`pointer-events-auto relative mb-2 w-[235px] sm:w-[265px] lg:w-[300px] rounded-[12px] border-2 bg-[#06142C]/92 p-2.5 sm:p-3 backdrop-blur-md transition-all duration-200 ${expressionBorder}`}
          >
            <div className="flex items-center justify-between text-[11px] mb-0.5">
              <span className="font-display font-bold tracking-wide text-[#FFD966]">
                Commander Reyes
              </span>
              <span className="text-slate-300">{expressionLabel}</span>
            </div>

            <p className="text-xs sm:text-[13px] leading-snug text-slate-100 min-h-[32px]">
              {renderTypedSegments()}
            </p>

            {showNextButton && (
              <div className="mt-2 flex justify-end">
                <SciFiButton
                  variant="gold"
                  onClick={handleNextClick}
                  className="min-h-[30px] px-3 py-0.5 text-xs"
                >
                  {isTyping ? 'Skip' : 'Next ▶'}
                </SciFiButton>
              </div>
            )}

            <div
              className="absolute -bottom-2 left-7 w-3.5 h-3.5 rotate-45 bg-[#06142C] border-r-2 border-b-2 border-inherit"
              aria-hidden="true"
            />
          </div>
        )}

        {/* Commander Reyes Avatar */}
        <div
          className={`pointer-events-auto flex items-center gap-2 rounded-[12px] border-2 bg-[#06142C]/90 p-1.5 pr-3 backdrop-blur-md transition-transform duration-200 ${
            reyesBounce ? 'scale-95' : 'scale-100'
          } ${expressionBorder}`}
        >
          <div className="w-11 h-11 lg:w-12 lg:h-12 rounded-[8px] overflow-hidden bg-[#0E2240] shrink-0">
            {!reyesImgErr ? (
              <img
                src={REYES_PORTRAIT}
                alt="Commander Reyes"
                onError={() => setReyesImgErr(true)}
                className="w-full h-full max-w-full object-cover object-top"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#1E3A8A] to-[#0F172A] flex flex-col items-center justify-center font-display font-bold text-[#FFD966]">
                <span className="text-lg leading-none" role="img" aria-label="Commander Reyes">
                  👩‍✈️
                </span>
                <span className="text-[8px] tracking-wider">CR</span>
              </div>
            )}
          </div>
          <div>
            <p className="font-display font-bold text-xs text-white">
              Commander Reyes
            </p>
            <p className="text-[10px] text-cyan-300/85">Flight Instructor</p>
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
          <div className="w-full max-w-sm rounded-[14px] border-2 border-[#00D4FF] bg-[#081326] p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2
                id="settings-title"
                className="font-display text-xl font-bold text-white"
              >
                Mission Settings
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

            <div className="flex flex-col gap-3">
              <SciFiButton variant="cyan" onClick={handleToggleMute}>
                {muted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
                <span>{muted ? 'Sound: Muted' : 'Sound: On'}</span>
              </SciFiButton>

              <SciFiButton
                variant="gold"
                onClick={() => {
                  setSettingsOpen(false);
                  setHowToOpen(true);
                }}
              >
                <HelpCircle className="w-4 h-4" />
                <span>How to Play</span>
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

              <SciFiButton
                variant="green"
                onClick={() => setSettingsOpen(false)}
              >
                <span>Resume</span>
              </SciFiButton>
            </div>
          </div>
        </div>
      )}

      {/* How To Play Modal */}
      {howToOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="howto-title"
        >
          <div className="w-full max-w-md rounded-[14px] border-2 border-[#00D4FF] bg-[#06142C] p-5 shadow-2xl">
            <h2
              id="howto-title"
              className="font-display text-lg font-bold text-[#FFD966] mb-3"
            >
              How to Play & Controls
            </h2>
            <p className="text-slate-100 text-sm leading-relaxed mb-2">
              <span className="text-[#5CEEFF] font-semibold">
                This is a decision-making astronaut mission.
              </span>
            </p>
            <p className="text-slate-300 leading-relaxed text-xs sm:text-sm mb-3">
              Watch your vital resources, read ARIA&apos;s telemetry and delayed
              Mission Control updates, and protect Sprout all the way to Mars!
            </p>
            <div className="rounded-lg border border-cyan-500/40 bg-[#0B2044]/75 p-2.5 text-xs text-slate-200 space-y-1 mb-4">
              <p>
                <strong className="text-[#5CEEFF]">Mars Exploration:</strong>{' '}
                Walk with <strong>WASD / Arrow keys</strong> or{' '}
                <strong>Click / Tap</strong> anywhere on the Mars ground.
              </p>
              <p>
                <strong className="text-[#FFD966]">Solve Issues:</strong>{' '}
                Walk up to each glowing alert icon on Mars, then press{' '}
                <strong>E</strong> or tap <strong>Solve Issue</strong>.
              </p>
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
