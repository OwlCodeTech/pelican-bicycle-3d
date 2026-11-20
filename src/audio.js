/**
 * Full Procedural Web Audio API Soundscape
 * Zero external audio dependencies: synthesizes ocean surf, wind, metallic brass bicycle bell,
 * cadence freehub clicks, playful pelican squawk, fish splash/gulp, wing whoosh, and a sunlit coastal melody!
 */
export class CoastalAudioEngine {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.enabled = false;
    this.musicEnabled = false;
    this.windGain = null;
    this.windFilter = null;
    this.surfGain = null;
    this.musicTimer = null;
    this.noteIdx = 0;
    this.lastClickPhase = 0;
  }

  init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    this.ctx = new AudioCtx();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.0001;
    this.masterGain.connect(this.ctx.destination);

    // Create shared pink-ish noise buffer (3 seconds)
    const sr = this.ctx.sampleRate;
    const len = sr * 3;
    const noiseBuf = this.ctx.createBuffer(1, len, sr);
    const data = noiseBuf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.950 * b2 + white * 0.048;
      data[i] = (b0 + b1 + b2 + white * 0.04) * 1.4;
    }

    // 1. Ocean surf loop (slow LFO-modulated lowpass noise)
    const surfSrc = this.ctx.createBufferSource();
    surfSrc.buffer = noiseBuf;
    surfSrc.loop = true;

    const surfFilter = this.ctx.createBiquadFilter();
    surfFilter.type = 'lowpass';
    surfFilter.frequency.value = 340;
    surfFilter.Q.value = 0.7;

    this.surfGain = this.ctx.createGain();
    this.surfGain.gain.value = 0.14;

    const surfLfo = this.ctx.createOscillator();
    surfLfo.frequency.value = 0.16;
    const surfLfoGain = this.ctx.createGain();
    surfLfoGain.gain.value = 130;
    surfLfo.connect(surfLfoGain);
    surfLfoGain.connect(surfFilter.frequency);
    surfLfo.start();

    surfSrc.connect(surfFilter);
    surfFilter.connect(this.surfGain);
    this.surfGain.connect(this.masterGain);
    surfSrc.start();

    // 2. Speed-reactive coastal breeze
    const windSrc = this.ctx.createBufferSource();
    windSrc.buffer = noiseBuf;
    windSrc.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.value = 520;
    this.windFilter.Q.value = 1.4;

    this.windGain = this.ctx.createGain();
    this.windGain.gain.value = 0.04;

    windSrc.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.masterGain);
    windSrc.start();
  }

  setEnabled(on) {
    this.enabled = on;
    if (on) {
      this.init();
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    }
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(on ? 0.65 : 0.0001, now, 0.08);
    }
    if (!on) {
      this.stopMusicLoop();
    } else if (this.musicEnabled) {
      this.startMusicLoop();
    }
  }

  setMusicEnabled(on) {
    this.musicEnabled = on;
    if (on && !this.enabled) {
      this.setEnabled(true);
    }
    if (on && this.enabled) {
      this.startMusicLoop();
    } else {
      this.stopMusicLoop();
    }
  }

  updateRide(speedKmh, crankAngle, turbo) {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const normSpeed = Math.min(speedKmh / 40, 1.4);

    // Wind scales dynamically with bike speed & turbo
    const targetFreq = 360 + normSpeed * 820 + (turbo ? 320 : 0);
    const targetVol = 0.02 + normSpeed * 0.09 + (turbo ? 0.06 : 0);
    this.windFilter.frequency.setTargetAtTime(targetFreq, now, 0.12);
    this.windGain.gain.setTargetAtTime(targetVol, now, 0.12);

    // Subtle mechanical bike cadence tick twice per crank revolution
    const phase = Math.floor(crankAngle / (Math.PI * 0.5));
    if (phase !== this.lastClickPhase && speedKmh > 2) {
      this.lastClickPhase = phase;
      this.playSoftTick(speedKmh);
    }
  }

  playSoftTick(speedKmh) {
    if (!this.ctx || !this.enabled) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1600 + Math.random() * 250, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.014);
    const vol = Math.min(0.022, 0.008 + speedKmh * 0.0004);
    g.gain.setValueAtTime(vol, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.02);
  }

  /** Authentic vintage brass bicycle bell "Ring-Ring!" */
  ringBell() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const triggerPing = (delay) => {
      const now = this.ctx.currentTime + delay;
      const partials = [
        { f: 2140, a: 0.24, d: 0.95 },
        { f: 4295, a: 0.14, d: 0.65 },
        { f: 6410, a: 0.07, d: 0.35 }
      ];
      for (const p of partials) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(p.f, now);
        g.gain.setValueAtTime(0.0001, now);
        g.gain.linearRampToValueAtTime(p.a, now + 0.005);
        g.gain.exponentialRampToValueAtTime(0.0001, now + p.d);
        osc.connect(g);
        g.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + p.d + 0.02);
      }
    };
    triggerPing(0);
    triggerPing(0.14);
  }

  /** Playful pelican waterfowl squawk */
  playSquawk() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(360, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(195, now + 0.26);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(780, now);
    filter.frequency.exponentialRampToValueAtTime(1150, now + 0.1);
    filter.Q.value = 3.2;

    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.16, now + 0.025);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

    osc.connect(filter);
    filter.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /** Ocean splash when a fish leaps */
  playSplash() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(920, now + 0.14);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.12, now + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /** Happy gulp + sparkle chime when catching a fish */
  playGulp() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Gulp pop
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.09);
    osc.frequency.exponentialRampToValueAtTime(280, now + 0.16);
    g.gain.setValueAtTime(0.18, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.19);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);

    // Reward chime (C6 -> E6)
    [1046.5, 1318.5].forEach((freq, idx) => {
      const t = now + 0.08 + idx * 0.07;
      const o2 = this.ctx.createOscillator();
      const g2 = this.ctx.createGain();
      o2.type = 'triangle';
      o2.frequency.setValueAtTime(freq, t);
      g2.gain.setValueAtTime(0.001, t);
      g2.gain.linearRampToValueAtTime(0.1, t + 0.01);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      o2.connect(g2);
      g2.connect(this.masterGain);
      o2.start(t);
      o2.stop(t + 0.38);
    });
  }

  /** Wing flap swoosh */
  playWingFlap() {
    if (!this.enabled || !this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(68, now + 0.22);
    g.gain.setValueAtTime(0.001, now);
    g.gain.linearRampToValueAtTime(0.15, now + 0.04);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
    osc.connect(g);
    g.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  /** Gentle sunlit coastal marimba / ukulele chord arpeggio */
  startMusicLoop() {
    if (this.musicTimer) return;
    // Warm Fmaj7 -> G6 -> Em7 -> Am7 pentatonic coastal motif
    const melody = [
      349.23, 440.00, 523.25, 659.25, 587.33, 523.25, 440.00, 523.25,
      392.00, 493.88, 587.33, 659.25, 587.33, 493.88, 392.00, 440.00,
      329.63, 392.00, 493.88, 659.25, 587.33, 493.88, 392.00, 440.00,
      261.63, 329.63, 392.00, 523.25, 659.25, 523.25, 440.00, 392.00
    ];

    const playStep = () => {
      if (!this.enabled || !this.musicEnabled || !this.ctx) return;
      const now = this.ctx.currentTime;
      const freq = melody[this.noteIdx % melody.length];
      this.noteIdx++;

      // Marimba / ukulele warm pluck
      const osc = this.ctx.createOscillator();
      const harmonic = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const gh = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      harmonic.type = 'triangle';
      harmonic.frequency.setValueAtTime(freq * 2, now);

      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.085, now + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

      gh.gain.setValueAtTime(0.0001, now);
      gh.gain.linearRampToValueAtTime(0.022, now + 0.008);
      gh.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);

      osc.connect(g);
      harmonic.connect(gh);
      g.connect(this.masterGain);
      gh.connect(this.masterGain);

      osc.start(now);
      harmonic.start(now);
      osc.stop(now + 0.45);
      harmonic.stop(now + 0.16);
    };

    playStep();
    this.musicTimer = setInterval(playStep, 260);
  }

  stopMusicLoop() {
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }
}
