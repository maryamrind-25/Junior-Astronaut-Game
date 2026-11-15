import React, { useEffect, useRef, useState } from 'react';
import { OctagonAlert, Rocket } from 'lucide-react';
import { RocketLaunchStage } from '../components/RocketLaunchStage';
import { SciFiButton } from '../components/SciFiButton';
import { AudioManager } from '../game/audioManager';
import { LAUNCH_METHODS } from '../game/gameData';
import { LaunchMethodId, ReyesExpression } from '../game/types';

interface Mission3LaunchProps {
  onReyesInterrupt: (text: string, expr: ReyesExpression) => void;
  onLaunchComplete: (
    methodId: LaunchMethodId,
    methodTitle: string,
    launchResult: string,
    expr: ReyesExpression,
    feedback: string,
    fuelDelta: number,
    earnedStar: boolean
  ) => void;
}

const METHOD_ORDER: LaunchMethodId[] = ['balanced', 'risky', 'slow'];

const COUNTDOWN_SECONDS = 10;

export const Mission3Launch: React.FC<Mission3LaunchProps> = ({
  onReyesInterrupt,
  onLaunchComplete,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<LaunchMethodId | ''>(
    ''
  );
  const [readyChecked, setReadyChecked] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);

  const timeLeftRef = useRef<number>(COUNTDOWN_SECONDS);
  const lastBeepSecRef = useRef<number>(COUNTDOWN_SECONDS + 1);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number | null>(null);

  const climbDurationSec = selectedMethod === 'slow' ? 3.0 : 1.7;

  useEffect(() => {
    return () => {
      AudioManager.stopRocketSound();
    };
  }, []);

  useEffect(() => {
    if (!isCountingDown) {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      lastFrameRef.current = null;
      return;
    }

    lastFrameRef.current = performance.now();

    const step = (now: number) => {
      const prev = lastFrameRef.current ?? now;
      const dt = Math.min(0.1, (now - prev) / 1000);
      lastFrameRef.current = now;

      timeLeftRef.current = Math.max(0, timeLeftRef.current - dt);
      const displaySec = Math.max(0, Math.ceil(timeLeftRef.current));
      setCountdown(displaySec);

      if (displaySec > 0 && displaySec < lastBeepSecRef.current) {
        lastBeepSecRef.current = displaySec;
        AudioManager.playCountdownBeep(displaySec);
      }

      if (timeLeftRef.current <= 0) {
        setIsCountingDown(false);
        setIsLaunching(true);
        executeLiftoff();
        return;
      }

      rafRef.current = requestAnimationFrame(step);
    };

    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCountingDown]);

  const executeLiftoff = () => {
    if (!selectedMethod) return;
    const data = LAUNCH_METHODS[selectedMethod];

    let fuelDelta = 0;
    let earnedStar = false;
    let launchResult = 'Slow Safe Launch';

    const roarDuration = selectedMethod === 'slow' ? 3.0 : 2.1;
    AudioManager.playLiftoffRoar(roarDuration);

    if (data.tier === 'best') {
      earnedStar = true;
      launchResult = 'Perfect Launch';
    } else if (data.tier === 'risky') {
      fuelDelta = -25;
      launchResult = 'Risky Launch (-Fuel)';
    } else {
      launchResult = 'Slow Safe Launch';
    }

    const waitMs = selectedMethod === 'slow' ? 2800 : 1750;
    window.setTimeout(() => {
      if (data.tier === 'best') {
        AudioManager.playStar();
      } else if (data.tier === 'risky') {
        AudioManager.playWarn();
      }
      onLaunchComplete(
        selectedMethod,
        data.title,
        launchResult,
        data.expr,
        data.feedback,
        fuelDelta,
        earnedStar
      );
    }, waitMs);
  };

  const handleSelectMethod = (id: LaunchMethodId) => {
    if (isCountingDown || isLaunching) return;
    AudioManager.stopReyesSpeech();
    AudioManager.playClick();
    setSelectedMethod(id);
  };

  const handleReadyToggle = (checked: boolean) => {
    if (!selectedMethod || isCountingDown || isLaunching) return;
    AudioManager.stopReyesSpeech();
    setReadyChecked(checked);
    if (checked) {
      timeLeftRef.current = COUNTDOWN_SECONDS;
      lastBeepSecRef.current = COUNTDOWN_SECONDS;
      setCountdown(COUNTDOWN_SECONDS);
      setIsCountingDown(true);
      AudioManager.playCountdownBeep(COUNTDOWN_SECONDS);
      AudioManager.startPreIgnitionRumble();
    }
  };

  const handleAbort = () => {
    if (!isCountingDown) return;
    AudioManager.stopRocketSound();
    AudioManager.playWarn();
    setIsCountingDown(false);
    timeLeftRef.current = COUNTDOWN_SECONDS;
    lastBeepSecRef.current = COUNTDOWN_SECONDS + 1;
    setCountdown(COUNTDOWN_SECONDS);
    setReadyChecked(false);
    onReyesInterrupt(
      "Mission [color=#FF4D6D]aborted[/color]. Let's try again.",
      'worried'
    );
  };

  return (
    <section
      aria-label="Mission 3 Flight Lesson and Rocket Launch"
      className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch"
    >
      {/* Left: 3 Flight Lesson Launch Methods */}
      <div className="lg:col-span-7 rounded-[14px] border-2 border-[#00D4FF]/90 bg-[#081326]/92 p-5 sm:p-6 shadow-[0_0_28px_rgba(0,212,255,0.28)] backdrop-blur-md flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Rocket className="w-5 h-5 text-[#5CEEFF]" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5CEEFF]">
              Mission 3 of 3 · Flight Lesson
            </p>
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-4">
            Choose How to Launch
          </h2>

          <div className="space-y-3">
            {METHOD_ORDER.map((id) => {
              const method = LAUNCH_METHODS[id];
              const isSelected = selectedMethod === id;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={isCountingDown || isLaunching}
                  onClick={() => handleSelectMethod(id)}
                  aria-pressed={isSelected}
                  className={[
                    'w-full text-left rounded-[12px] p-4 transition-all duration-150 cursor-pointer',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300',
                    isCountingDown || isLaunching ? 'opacity-75 cursor-not-allowed' : '',
                    isSelected
                      ? 'border-[3px] border-[#FFB703] bg-[#1A3562]/95 shadow-[0_0_20px_rgba(255,183,3,0.4)]'
                      : 'border border-[#00D4FF]/60 bg-[#0E2240]/90 hover:border-[#5CEEFF] hover:bg-[#132E56]/92',
                  ].join(' ')}
                >
                  <h3 className="font-display text-base font-bold text-[#FFD966] mb-1.5">
                    {method.title}
                  </h3>
                  <p className="text-sm text-slate-100 leading-snug mb-1">
                    <span className="font-bold text-[#2EE59D]">Effect:</span>{' '}
                    {method.effect}
                  </p>
                  <p className="text-sm text-slate-200 leading-snug">
                    <span className="font-bold text-[#FF6B6B]">
                      Side Effect:
                    </span>{' '}
                    {method.sideEffect}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Ready Checkbox & Abort Controls */}
        <div className="mt-5 pt-4 border-t border-slate-700/80 flex flex-wrap items-center justify-between gap-4">
          <label
            className={`inline-flex items-center gap-3 text-base font-semibold select-none ${
              !selectedMethod || isCountingDown || isLaunching
                ? 'text-slate-500 cursor-not-allowed'
                : 'text-white cursor-pointer'
            }`}
          >
            <input
              type="checkbox"
              checked={readyChecked}
              disabled={!selectedMethod || isCountingDown || isLaunching}
              onChange={(e) => handleReadyToggle(e.target.checked)}
              className="w-5 h-5 accent-[#FFB703] rounded cursor-pointer disabled:cursor-not-allowed"
            />
            <span>Ready for Launch</span>
          </label>

          <SciFiButton
            variant="danger"
            disabled={!isCountingDown}
            onClick={handleAbort}
          >
            <OctagonAlert className="w-4 h-4" />
            <span>Abort</span>
          </SciFiButton>
        </div>
      </div>

      {/* Right: Rocket Launch Pad Stage */}
      <div className="lg:col-span-5">
        <RocketLaunchStage
          countdown={countdown}
          isCountingDown={isCountingDown}
          isLaunching={isLaunching}
          climbDurationSec={climbDurationSec}
          selectedMethod={selectedMethod}
        />
      </div>
    </section>
  );
};
