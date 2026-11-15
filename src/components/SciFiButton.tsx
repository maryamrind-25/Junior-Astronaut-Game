import React, { useState } from 'react';
import { AudioManager } from '../game/audioManager';

export type SciFiButtonVariant = 'cyan' | 'gold' | 'danger' | 'green';

interface SciFiButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: SciFiButtonVariant;
  children: React.ReactNode;
  silent?: boolean;
}

const VARIANT_CLASSES: Record<SciFiButtonVariant, string> = {
  cyan: [
    'bg-[#0D2748] text-white border-[#00D4FF]',
    'hover:bg-[#143B6B] hover:border-[#5CEEFF] hover:shadow-[0_0_18px_rgba(0,212,255,0.55)]',
    'shadow-[0_0_10px_rgba(0,212,255,0.35)]',
  ].join(' '),
  gold: [
    'bg-[#6B4400] text-[#FFFDF0] border-[#FFB703]',
    'hover:bg-[#9A6200] hover:border-[#FFD966] hover:shadow-[0_0_20px_rgba(255,183,3,0.65)]',
    'shadow-[0_0_10px_rgba(255,183,3,0.4)]',
  ].join(' '),
  danger: [
    'bg-[#4A0E1E] text-white border-[#FF4D6D]',
    'hover:bg-[#73162E] hover:border-[#FF859D] hover:shadow-[0_0_18px_rgba(255,77,109,0.55)]',
    'shadow-[0_0_10px_rgba(255,77,109,0.35)]',
  ].join(' '),
  green: [
    'bg-[#0D4735] text-white border-[#2EE59D]',
    'hover:bg-[#156B50] hover:border-[#6EFFC4] hover:shadow-[0_0_18px_rgba(46,229,157,0.55)]',
    'shadow-[0_0_10px_rgba(46,229,157,0.35)]',
  ].join(' '),
};

export const SciFiButton: React.FC<SciFiButtonProps> = ({
  variant = 'cyan',
  children,
  className = '',
  disabled,
  onClick,
  silent = false,
  type = 'button',
  ...rest
}) => {
  const [flash, setFlash] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    AudioManager.stopReyesSpeech();
    if (!silent) {
      AudioManager.playClick();
    }
    setFlash(true);
    window.setTimeout(() => setFlash(false), 220);
    onClick?.(e);
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      className={[
        'relative inline-flex items-center justify-center gap-2',
        'min-h-[44px] px-5 py-2.5 rounded-[10px] border-2',
        'font-display font-bold tracking-wide text-base whitespace-nowrap shrink-0',
        'transition-all duration-150 ease-out cursor-pointer select-none',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#081326]',
        disabled
          ? 'opacity-45 cursor-not-allowed grayscale-[30%] shadow-none'
          : 'hover:scale-[1.04] active:scale-[0.96]',
        flash ? 'brightness-150 ring-2 ring-white/80' : '',
        VARIANT_CLASSES[variant],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
};
