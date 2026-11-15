import React, { useEffect, useState } from 'react';
import { LogIn, Play, Power, UserCheck, UserPlus, X } from 'lucide-react';
import { SciFiButton } from '../components/SciFiButton';
import { AudioManager } from '../game/audioManager';
import { BackendClient } from '../game/backendClient';
import { SaveManager } from '../game/saveManager';
import { CadetProfile } from '../game/types';

const START_BG = '/images/launchpad_bg.jpg';
const CADET_ART = '/images/cadet_astronaut.png';

interface StartScreenProps {
  onEnterGame: (profile: CadetProfile) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onEnterGame }) => {
  const [authMode, setAuthMode] = useState<'signup' | 'login' | null>(null);
  const [username, setUsername] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [authError, setAuthError] = useState('');
  const [shakeAuth, setShakeAuth] = useState(false);

  const [noticeText, setNoticeText] = useState<string | null>(null);
  const [quitNotice, setQuitNotice] = useState(false);
  const [autoLoginUser, setAutoLoginUser] = useState<string>('');
  const [bgErr, setBgErr] = useState(false);
  const [astronautErr, setAstronautErr] = useState(false);

  useEffect(() => {
    if (SaveManager.hasAutoLogin()) {
      setAutoLoginUser(SaveManager.getAutoLoginUser());
    } else {
      setAutoLoginUser('');
    }
  }, []);

  const handlePlay = () => {
    if (SaveManager.hasAutoLogin()) {
      const savedUser = SaveManager.getAutoLoginUser();
      const profile = SaveManager.getUserProfile(savedUser);
      if (profile) {
        onEnterGame(profile);
        return;
      }
    }
    setNoticeText('Please Sign In or Play as Guest');
  };

  const openAuth = (mode: 'signup' | 'login') => {
    setAuthMode(mode);
    setAuthError('');
    setUsername('');
    setStayLoggedIn(true);
  };

  const handleAuthConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!authMode) return;
    const res =
      authMode === 'signup'
        ? SaveManager.signUp(username, stayLoggedIn)
        : SaveManager.logIn(username, stayLoggedIn);

    if (!res.ok) {
      AudioManager.playWarn();
      setAuthError(res.msg);
      setShakeAuth(true);
      window.setTimeout(() => setShakeAuth(false), 300);
      return;
    }
    void BackendClient.syncAuth(authMode, res.profile.username);
    onEnterGame(res.profile);
  };

  const handleGuest = () => {
    const profile = SaveManager.createOrLoadGuest();
    onEnterGame(profile);
  };

  const handleForgetAutoLogin = () => {
    SaveManager.clearAutoLogin();
    setAutoLoginUser('');
  };

  return (
    <div className="relative h-full w-full overflow-y-auto overflow-x-hidden bg-[#071226] flex flex-col items-center justify-center p-3 sm:p-5 lg:p-6">
      {!bgErr ? (
        <img
          src={START_BG}
          alt="Coastal spaceport rocket launchpad at twilight"
          onError={() => setBgErr(true)}
          className="pointer-events-none absolute inset-0 w-full h-full max-w-full object-cover opacity-75"
        />
      ) : (
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0B1D42] via-[#132952] to-[#071226] flex items-end justify-center pb-8 opacity-90"
          aria-hidden="true"
        >
          <span className="text-4xl sm:text-5xl opacity-35 select-none">
            🚀 🌌
          </span>
        </div>
      )}
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#060E1D]/72 via-[#060E1D]/45 to-[#060E1D]/88"
        aria-hidden="true"
      />

      {/* Main Content Grid (Landscape side-by-side on sm+ phones & laptops) */}
      <main className="relative z-10 w-full max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-12 gap-5 lg:gap-8 items-center">
        {/* Left: Title Banner & Floating Astronaut */}
        <div className="sm:col-span-7 flex flex-col items-center sm:items-start text-center sm:text-left">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.22em] text-[#8BE9FD] mb-1">
            Learn · Explore · Survive
          </p>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.08] text-balance drop-shadow-md">
            Junior Astronaut Mission Trainer
          </h1>
          <p className="mt-2 sm:mt-3 max-w-lg text-xs sm:text-sm lg:text-base text-slate-200 leading-relaxed">
            Join Commander Reyes at Space Academy! Pick the right spacesuit,
            pack your survival gear, and take charge of your rocket mission.
          </p>

          {/* Floating Cadet Astronaut Mascot */}
          <div className="mt-3 sm:mt-4 animate-float-slow">
            <div className="w-28 h-28 sm:w-36 sm:h-36 lg:w-44 lg:h-44 rounded-2xl overflow-hidden border-2 border-[#00D4FF]/85 bg-[#06142C]/65 backdrop-blur-sm p-2 shadow-[0_0_20px_rgba(0,212,255,0.28)] flex items-center justify-center">
              {!astronautErr ? (
                <img
                  src={CADET_ART}
                  alt="Junior Astronaut Cadet"
                  onError={() => setAstronautErr(true)}
                  className="w-full h-full max-w-full object-contain"
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#0F2F5F] to-[#081A38] flex flex-col items-center justify-center gap-1 text-center p-2">
                  <span className="text-3xl sm:text-4xl" role="img" aria-label="Astronaut">
                    👨‍🚀
                  </span>
                  <span className="font-display text-xs sm:text-sm font-bold text-[#8BE9FD]">
                    Cadet Ready
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Compact Interactive Academy Menu */}
        <div className="sm:col-span-5 flex flex-col items-stretch rounded-[14px] border-2 border-[#00D4FF]/85 bg-[#06142C]/90 p-4 sm:p-5 shadow-[0_0_24px_rgba(0,212,255,0.28)] backdrop-blur-md">
          <h2 className="font-display text-base sm:text-lg font-bold text-[#FFD966] mb-0.5">
            Cadet Sign-In
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mb-3">
            {autoLoginUser
              ? `Welcome back, ${autoLoginUser}!`
              : 'Sign in to save your progress, or jump right in as a guest.'}
          </p>

          <div className="flex flex-col gap-2">
            <SciFiButton
              variant="gold"
              onClick={handlePlay}
              className="w-full min-h-[40px] py-1.5 text-sm"
            >
              <Play className="w-4 h-4" />
              <span>Play</span>
            </SciFiButton>

            <SciFiButton
              variant="cyan"
              onClick={() => openAuth('signup')}
              className="w-full min-h-[40px] py-1.5 text-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>Sign Up</span>
            </SciFiButton>

            <SciFiButton
              variant="cyan"
              onClick={() => openAuth('login')}
              className="w-full min-h-[40px] py-1.5 text-sm"
            >
              <LogIn className="w-4 h-4" />
              <span>Log In</span>
            </SciFiButton>

            <SciFiButton
              variant="green"
              onClick={handleGuest}
              className="w-full min-h-[40px] py-1.5 text-sm"
            >
              <UserCheck className="w-4 h-4" />
              <span>Play as Guest</span>
            </SciFiButton>

            <SciFiButton
              variant="danger"
              onClick={() => setQuitNotice(true)}
              className="w-full min-h-[40px] py-1.5 text-sm"
            >
              <Power className="w-4 h-4" />
              <span>Quit</span>
            </SciFiButton>
          </div>

          {autoLoginUser && (
            <button
              type="button"
              onClick={handleForgetAutoLogin}
              className="mt-4 text-xs text-slate-400 hover:text-cyan-300 underline underline-offset-4 self-center cursor-pointer"
            >
              Switch account ({autoLoginUser})
            </button>
          )}
        </div>
      </main>

      {/* Sign Up / Log In Popup */}
      {authMode && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
        >
          <form
            onSubmit={handleAuthConfirm}
            className={`w-full max-w-md rounded-[14px] border-2 border-[#00D4FF] bg-[#081326] p-6 shadow-2xl ${
              shakeAuth ? 'animate-shake' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h2
                id="auth-modal-title"
                className="font-display text-xl font-bold text-[#5CEEFF]"
              >
                {authMode === 'signup'
                  ? 'Create Cadet Account'
                  : 'Cadet Log In'}
              </h2>
              <button
                type="button"
                onClick={() => setAuthMode(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <label
              htmlFor="cadet-username"
              className="block text-sm font-medium text-slate-200 mb-1.5"
            >
              Cadet Username
            </label>
            <input
              id="cadet-username"
              type="text"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. CaptainMaya"
              className="w-full rounded-[10px] border-2 border-slate-600 bg-[#0E2240] px-4 py-2.5 text-white placeholder-slate-400 focus:border-[#00D4FF] focus:outline-none"
            />

            <label className="mt-4 flex items-center gap-2.5 text-sm text-slate-200 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={stayLoggedIn}
                onChange={(e) => setStayLoggedIn(e.target.checked)}
                className="w-4 h-4 accent-[#00D4FF] rounded cursor-pointer"
              />
              <span>Save login info / Stay logged in</span>
            </label>

            {authError && (
              <p
                role="alert"
                className="mt-3 text-sm font-medium text-[#FF4D6D]"
              >
                {authError}
              </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <SciFiButton
                variant="danger"
                onClick={() => setAuthMode(null)}
              >
                Cancel
              </SciFiButton>
              <SciFiButton type="submit" variant="gold">
                {authMode === 'signup' ? 'Sign Up' : 'Log In'}
              </SciFiButton>
            </div>
          </form>
        </div>
      )}

      {/* Notice Popup */}
      {noticeText && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-[14px] border-2 border-[#FFB703] bg-[#081326] p-6 text-center shadow-2xl">
            <h2 className="font-display text-lg font-bold text-[#FFD966] mb-2">
              Before You Launch
            </h2>
            <p className="text-slate-100 mb-6">{noticeText}</p>
            <SciFiButton
              variant="cyan"
              onClick={() => setNoticeText(null)}
              className="w-full"
            >
              OK
            </SciFiButton>
          </div>
        </div>
      )}

      {/* Quit Standby Popup */}
      {quitNotice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-[14px] border-2 border-[#FF4D6D] bg-[#081326] p-6 text-center shadow-2xl">
            <h2 className="font-display text-lg font-bold text-white mb-2">
              See You Next Mission!
            </h2>
            <p className="text-sm text-slate-300 mb-6">
              Your progress is saved safely on this device. You can close this
              tab or jump back in whenever you&apos;re ready.
            </p>
            <SciFiButton
              variant="cyan"
              onClick={() => setQuitNotice(false)}
              className="w-full"
            >
              Back to Menu
            </SciFiButton>
          </div>
        </div>
      )}
    </div>
  );
};
