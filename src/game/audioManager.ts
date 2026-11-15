class ProceduralAudioManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private activeRocketSource: AudioBufferSourceNode | null = null;
  private activeRocketOsc: OscillatorNode | null = null;
  private activeRocketGain: GainNode | null = null;

  // Background ambient space music state
  private bgMusicActive: boolean = false;
  private bgMusicTimer: number | null = null;
  private bgMusicGain: GainNode | null = null;
  private bgChordIndex: number = 0;

  // Continuous Mars storm wind ambience state
  private stormActive: boolean = false;
  private stormSource: AudioBufferSourceNode | null = null;
  private stormGain: GainNode | null = null;

  // Reyes female voice speech state
  private speechToken: number = 0;
  private cachedFemaleVoice: SpeechSynthesisVoice | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      if ('speechSynthesis' in window) {
        this.refreshFemaleVoice();
        window.speechSynthesis.addEventListener?.('voiceschanged', () => {
          this.refreshFemaleVoice();
        });
      }
      const unlockAudio = () => {
        if (!this.muted) {
          this.ensureContext();
        }
        window.removeEventListener('pointerdown', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
      };
      window.addEventListener('pointerdown', unlockAudio, { once: true });
      window.addEventListener('keydown', unlockAudio, { once: true });
    }
  }

  private refreshFemaleVoice(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return;

    const femaleHints = [
      'aria',
      'jenny',
      'zira',
      'samantha',
      'victoria',
      'karen',
      'tessa',
      'fiona',
      'moira',
      'hazel',
      'susan',
      'serena',
      'kate',
      'ava',
      'allison',
      'veena',
      'google uk english female',
      'google us english',
      'female',
      'woman',
    ];

    const enVoices = voices.filter((v) =>
      v.lang.toLowerCase().startsWith('en')
    );
    const pool = enVoices.length > 0 ? enVoices : voices;

    for (const hint of femaleHints) {
      const match = pool.find((v) => v.name.toLowerCase().includes(hint));
      if (match) {
        this.cachedFemaleVoice = match;
        return;
      }
    }

    this.cachedFemaleVoice = pool[0] ?? null;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.bgMusicActive) {
      this.startBgMusic();
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopRocketSound();
      this.stopStormAmbience();
      this.stopBgMusic();
      this.stopReyesSpeech();
    } else {
      this.ensureContext();
    }
    return this.muted;
  }

  // ---------------- REYES FEMALE VOICE SPEECH ----------------

  public speakReyes(rawText: string): void {
    if (this.muted || typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) return;

    const clean = rawText
      .replace(/\[color=[^\]]+\]/gi, '')
      .replace(/\[\/color\]/gi, '')
      .replace(/\bO2\b/g, 'oxygen')
      .replace(/\bCO2\b/g, 'carbon dioxide')
      .replace(/·/g, ', ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!clean) return;

    this.stopReyesSpeech();
    const token = this.speechToken;

    if (!this.cachedFemaleVoice) {
      this.refreshFemaleVoice();
    }

    try {
      const utterance = new SpeechSynthesisUtterance(clean);
      if (this.cachedFemaleVoice) {
        utterance.voice = this.cachedFemaleVoice;
      }
      utterance.lang = this.cachedFemaleVoice?.lang || 'en-US';
      utterance.pitch = 1.16;
      utterance.rate = 0.98;
      utterance.volume = 0.9;

      // Guard against stale async callbacks after interruption
      utterance.onstart = () => {
        if (this.speechToken !== token || this.muted) {
          window.speechSynthesis.cancel();
        }
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      // SpeechSynthesis unavailable in headless/restricted contexts
    }
  }

  public stopReyesSpeech(): void {
    this.speechToken += 1;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore cancel failures
      }
    }
  }

  // ---------------- SMOOTH AMBIENT BACKGROUND MUSIC ----------------

  public startBgMusic(): void {
    if (this.muted || this.bgMusicActive) return;
    const ctx = this.ctx;
    if (!ctx) return;

    this.bgMusicActive = true;
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, ctx.currentTime);
    masterGain.gain.linearRampToValueAtTime(0.042, ctx.currentTime + 2.0);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(620, ctx.currentTime);

    masterGain.connect(lowpass);
    lowpass.connect(ctx.destination);
    this.bgMusicGain = masterGain;

    // Gentle, calm cosmic ambient chord progression (Cmaj9 -> Am9 -> Fmaj9 -> G6)
    const chords: number[][] = [
      [130.81, 261.63, 329.63, 392.0, 493.88],
      [110.0, 220.0, 261.63, 329.63, 392.0],
      [87.31, 174.61, 261.63, 329.63, 392.0],
      [98.0, 196.0, 246.94, 293.66, 392.0],
    ];

    const playChordPad = () => {
      if (!this.bgMusicActive || !this.ctx || !this.bgMusicGain || this.muted) {
        return;
      }
      const now = this.ctx.currentTime;
      const chord = chords[this.bgChordIndex % chords.length];
      this.bgChordIndex += 1;

      chord.forEach((freq, idx) => {
        if (!this.ctx || !this.bgMusicGain) return;
        const osc = this.ctx.createOscillator();
        const noteGain = this.ctx.createGain();
        osc.type = idx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);
        osc.detune.setValueAtTime((idx % 2 === 0 ? 1 : -1) * 4, now);

        const peak = idx === 0 ? 0.28 : 0.16;
        noteGain.gain.setValueAtTime(0.0001, now);
        noteGain.gain.linearRampToValueAtTime(peak, now + 1.8);
        noteGain.gain.linearRampToValueAtTime(peak * 0.75, now + 4.4);
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + 6.4);

        osc.connect(noteGain);
        noteGain.connect(this.bgMusicGain);
        osc.start(now);
        osc.stop(now + 6.5);
      });
    };

    playChordPad();
    this.bgMusicTimer = window.setInterval(playChordPad, 4800);
  }

  public stopBgMusic(): void {
    this.bgMusicActive = false;
    if (this.bgMusicTimer !== null) {
      window.clearInterval(this.bgMusicTimer);
      this.bgMusicTimer = null;
    }
    try {
      this.bgMusicGain?.disconnect();
    } catch {
      // already disconnected
    }
    this.bgMusicGain = null;
  }

  // ---------------- UI & ACTION SOUNDS ----------------

  public playClick(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(640, now);
    osc.frequency.exponentialRampToValueAtTime(980, now + 0.06);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.085);
  }

  public playMoveWhoosh(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = 0.26;
    const buf = ctx.createBuffer(
      1,
      Math.floor(ctx.sampleRate * dur),
      ctx.sampleRate
    );
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.2, now);
    filter.frequency.setValueAtTime(260, now);
    filter.frequency.exponentialRampToValueAtTime(680, now + 0.12);
    filter.frequency.exponentialRampToValueAtTime(290, now + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.075, now + 0.07);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + dur);
  }

  public playFootstep(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Crunchy Mars regolith gravel grain
    const dur = 0.085;
    const buf = ctx.createBuffer(
      1,
      Math.floor(ctx.sampleRate * dur),
      ctx.sampleRate
    );
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      const env = Math.pow(1 - i / data.length, 1.5);
      data[i] = (Math.random() * 2 - 1) * env;
    }

    const crunch = ctx.createBufferSource();
    crunch.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(780 + Math.random() * 240, now);
    bp.Q.setValueAtTime(1.4, now);

    const crunchGain = ctx.createGain();
    crunchGain.gain.setValueAtTime(0.095, now);
    crunchGain.gain.exponentialRampToValueAtTime(0.002, now + dur);

    crunch.connect(bp);
    bp.connect(crunchGain);
    crunchGain.connect(ctx.destination);
    crunch.start(now);
    crunch.stop(now + dur);

    // Subtle soft boot sole thud
    const osc = ctx.createOscillator();
    const thudGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(92, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.065);
    thudGain.gain.setValueAtTime(0.055, now);
    thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(thudGain);
    thudGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.075);
  }

  // ---------------- MARS ENVIRONMENTAL HAZARD SOUNDS ----------------

  public playDustSwirl(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = 1.35;
    const buf = ctx.createBuffer(
      1,
      Math.floor(ctx.sampleRate * dur),
      ctx.sampleRate
    );
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(2.6, now);
    filter.frequency.setValueAtTime(650, now);
    filter.frequency.linearRampToValueAtTime(1550, now + 0.55);
    filter.frequency.linearRampToValueAtTime(620, now + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.075, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + dur);
  }

  public playStormGust(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = 1.8;
    const buf = ctx.createBuffer(
      1,
      Math.floor(ctx.sampleRate * dur),
      ctx.sampleRate
    );
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.06 * white) / 1.06;
      data[i] = last * 3.0;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const howlFilter = ctx.createBiquadFilter();
    howlFilter.type = 'bandpass';
    howlFilter.Q.setValueAtTime(3.2, now);
    howlFilter.frequency.setValueAtTime(240, now);
    howlFilter.frequency.linearRampToValueAtTime(520, now + 0.7);
    howlFilter.frequency.linearRampToValueAtTime(210, now + dur);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.002, now + dur);

    src.connect(howlFilter);
    howlFilter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + dur);
  }

  public startStormAmbience(): void {
    if (this.muted || this.stormActive) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.stormActive = true;
    const now = ctx.currentTime;
    const dur = 4.0;
    const buf = ctx.createBuffer(
      1,
      Math.floor(ctx.sampleRate * dur),
      ctx.sampleRate
    );
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.05 * white) / 1.05;
      data[i] = last * 2.4;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(340, now);
    filter.Q.setValueAtTime(1.8, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.8);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);

    this.stormSource = src;
    this.stormGain = gain;
  }

  public stopStormAmbience(): void {
    this.stormActive = false;
    try {
      this.stormSource?.stop();
    } catch {
      // already stopped
    }
    try {
      this.stormGain?.disconnect();
    } catch {
      // already disconnected
    }
    this.stormSource = null;
    this.stormGain = null;
  }

  public playMeteoroid(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // Fast Doppler streak whistle
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1450, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.42);

    oscGain.gain.setValueAtTime(0.001, now);
    oscGain.gain.linearRampToValueAtTime(0.09, now + 0.08);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.46);

    // Atmospheric fiery trail whoosh
    const dur = 0.52;
    const buf = ctx.createBuffer(
      1,
      Math.floor(ctx.sampleRate * dur),
      ctx.sampleRate
    );
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.frequency.exponentialRampToValueAtTime(320, now + dur);

    const whooshGain = ctx.createGain();
    whooshGain.gain.setValueAtTime(0.002, now);
    whooshGain.gain.linearRampToValueAtTime(0.11, now + 0.09);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    src.connect(filter);
    filter.connect(whooshGain);
    whooshGain.connect(ctx.destination);
    src.start(now);
    src.stop(now + dur);
  }

  public playRustCreak(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = 0.62;

    // Rusty metallic hinge/seal groan
    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(195, now);
    osc.frequency.linearRampToValueAtTime(142, now + 0.3);
    osc.frequency.linearRampToValueAtTime(215, now + dur);

    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(18, now);
    lfoGain.gain.setValueAtTime(24, now);
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(460, now);
    bp.Q.setValueAtTime(5.5, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.085, now + 0.12);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.4);
    gain.gain.exponentialRampToValueAtTime(0.001, now + dur);

    osc.connect(bp);
    bp.connect(gain);
    gain.connect(ctx.destination);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + dur);
    osc.stop(now + dur);
  }

  public playCountdownBeep(secondsLeft: number): void {
    const ctx = this.ensureContext();
    if (!ctx || secondsLeft <= 0) return;
    const now = ctx.currentTime;
    const isFinalThree = secondsLeft <= 3;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = isFinalThree ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isFinalThree ? 980 : 660, now);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(isFinalThree ? 0.14 : 0.1, now + 0.015);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      now + (isFinalThree ? 0.18 : 0.12)
    );

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + (isFinalThree ? 0.19 : 0.13));
  }

  public playStar(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const now = ctx.currentTime + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    });
  }

  public playWarn(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.22);
    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Starts a continuous low turbine ignition rumble during the countdown.
   */
  public startPreIgnitionRumble(): void {
    this.stopRocketSound();
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 11.0;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.04 * white) / 1.04;
      data[i] = lastOut * 3.2;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(110, now);
    filter.frequency.linearRampToValueAtTime(260, now + 10);

    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(48, now);
    osc.frequency.linearRampToValueAtTime(68, now + 10);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.025, now);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.01, now);
    masterGain.gain.linearRampToValueAtTime(0.14, now + 9.5);

    noise.connect(filter);
    filter.connect(masterGain);
    osc.connect(oscGain);
    oscGain.connect(masterGain);
    masterGain.connect(ctx.destination);

    noise.start(now);
    osc.start(now);
    noise.stop(now + duration);
    osc.stop(now + duration);

    this.activeRocketSource = noise;
    this.activeRocketOsc = osc;
    this.activeRocketGain = masterGain;
  }

  /**
   * Plays full-power rocket liftoff roar with deep bass thrust and exhaust crackle.
   */
  public playLiftoffRoar(durationSec: number = 2.6): void {
    this.stopRocketSound();
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * durationSec);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.08 * white) / 1.08;
      data[i] = lastOut * 3.5 + white * 0.18;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(620, now);
    filter.frequency.exponentialRampToValueAtTime(220, now + durationSec);

    const subOsc = ctx.createOscillator();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(65, now);
    subOsc.frequency.exponentialRampToValueAtTime(42, now + durationSec);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0.12, now);
    subGain.gain.exponentialRampToValueAtTime(0.005, now + durationSec);

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.04, now);
    masterGain.gain.linearRampToValueAtTime(0.26, now + 0.18);
    masterGain.gain.exponentialRampToValueAtTime(0.002, now + durationSec);

    noise.connect(filter);
    filter.connect(masterGain);
    subOsc.connect(subGain);
    subGain.connect(masterGain);
    masterGain.connect(ctx.destination);

    noise.start(now);
    subOsc.start(now);
    noise.stop(now + durationSec);
    subOsc.stop(now + durationSec);

    this.activeRocketSource = noise;
    this.activeRocketOsc = subOsc;
    this.activeRocketGain = masterGain;
  }

  public playImpact(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(38, now + 0.35);
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playHiss(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = 0.9;
    const buf = ctx.createBuffer(
      1,
      Math.floor(ctx.sampleRate * dur),
      ctx.sampleRate
    );
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(2400, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.002, now + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + dur);
  }

  public playThruster(): void {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const dur = 0.55;
    const buf = ctx.createBuffer(
      1,
      Math.floor(ctx.sampleRate * dur),
      ctx.sampleRate
    );
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.002, now + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    src.start(now);
    src.stop(now + dur);
  }

  public stopRocketSound(): void {
    try {
      this.activeRocketSource?.stop();
    } catch {
      // already stopped
    }
    try {
      this.activeRocketOsc?.stop();
    } catch {
      // already stopped
    }
    try {
      this.activeRocketGain?.disconnect();
    } catch {
      // already disconnected
    }
    this.activeRocketSource = null;
    this.activeRocketOsc = null;
    this.activeRocketGain = null;
  }
}

export const AudioManager = new ProceduralAudioManager();
