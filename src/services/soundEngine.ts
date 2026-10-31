import { MusicTrack } from '../types/game';

export const DEMO_TRACKS: MusicTrack[] = [
  {
    id: 'cyberpunk-drift',
    title: 'Neon Cyberpunk Drift',
    style: 'Synthwave / Electro',
    bpm: 124,
    description: 'Pumping basslines, 80s arcade arpeggios, and four-on-the-floor energy.',
  },
  {
    id: 'arcade-hyper-pulse',
    title: 'Arcade Hyper Pulse',
    style: 'High-Energy Future Bass',
    bpm: 138,
    description: 'Rapid chiptune hooks, bouncy rhythms, and hyperactive arcade excitement.',
  },
  {
    id: 'midnight-blade',
    title: 'Midnight Blade Samurai',
    style: 'Lo-Fi Neo-Tokyo Beats',
    bpm: 92,
    description: 'Atmospheric midnight groove with deep 808 kicks and pentatonic melodic leads.',
  },
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  private isSfxMuted: boolean = false;
  private isMusicMuted: boolean = false;
  private sfxVolume: number = 0.8;
  private musicVolume: number = 0.6;

  // Music sequencer state
  private isMusicPlaying: boolean = false;
  private currentTrackIndex: number = 0;
  private sequenceTimer: number | null = null;
  private currentStep: number = 0;

  constructor() {
    // AudioContext will be initialized on first user gesture
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.sfxVolume;
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.musicVolume;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.musicGain.connect(this.analyser);
      this.analyser.connect(this.masterGain);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- Sound Effects ---

  public playSlice(speedMultiplier = 1) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    const now = this.ctx.currentTime;

    // Layer 1: Metallic blade swish / cut
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc1.type = 'sawtooth';
    const baseFreq = 800 + Math.min(speedMultiplier * 200, 1000);
    osc1.frequency.setValueAtTime(baseFreq, now);
    osc1.frequency.exponentialRampToValueAtTime(140, now + 0.12);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.Q.setValueAtTime(3, now);

    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc1.connect(filter);
    filter.connect(gain1);
    gain1.connect(this.sfxGain);

    osc1.start(now);
    osc1.stop(now + 0.13);

    // Layer 2: Wet juicy squelch / pop
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(320, now);
    osc2.frequency.exponentialRampToValueAtTime(60, now + 0.08);

    gain2.gain.setValueAtTime(0.5, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc2.connect(gain2);
    gain2.connect(this.sfxGain);

    osc2.start(now);
    osc2.stop(now + 0.1);
  }

  public playSwoosh() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    const now = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.1;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(1800, now + 0.06);
    filter.frequency.exponentialRampToValueAtTime(300, now + 0.1);
    filter.Q.value = 4;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.11);
  }

  public playBombFuse() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.linearRampToValueAtTime(120, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.06);
  }

  public playBombExplosion() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    const now = this.ctx.currentTime;

    // Sub rumble
    const osc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.6);

    subGain.gain.setValueAtTime(0.9, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

    osc.connect(subGain);
    subGain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.75);

    // Noise blast
    const bufferSize = this.ctx.sampleRate * 0.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1200, now);
    lowpass.frequency.exponentialRampToValueAtTime(80, now + 0.5);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    noise.connect(lowpass);
    lowpass.connect(noiseGain);
    noiseGain.connect(this.sfxGain);

    noise.start(now);
    noise.stop(now + 0.65);
  }

  public playCombo(comboCount: number) {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    const now = this.ctx.currentTime;
    const baseFreqs = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98]; // C5, E5, G5, C6, E6, G6
    const pitchOffset = Math.min(comboCount - 2, 4);

    const freqs = [
      baseFreqs[pitchOffset] || 523.25,
      baseFreqs[pitchOffset + 1] || 659.25,
      baseFreqs[pitchOffset + 2] || 783.99,
    ];

    freqs.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.25, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.3);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.35);
    });
  }

  public playHeartLost() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.25);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.26);
  }

  public playGameOver() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    const now = this.ctx.currentTime;
    const notes = [392.0, 349.23, 311.13, 261.63]; // G4, F4, Eb4, C4
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.16);

      gain.gain.setValueAtTime(0.3, now + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.16 + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(now + idx * 0.16);
      osc.stop(now + idx * 0.16 + 0.4);
    });
  }

  public playClick() {
    this.initContext();
    if (!this.ctx || !this.sfxGain || this.isSfxMuted) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.04);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  // --- AI-Style Demo Background Music Engine ---

  public startMusic() {
    this.initContext();
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;
    this.currentStep = 0;
    this.scheduleMusicStep();
  }

  public pauseMusic() {
    this.isMusicPlaying = false;
    if (this.sequenceTimer !== null) {
      window.clearTimeout(this.sequenceTimer);
      this.sequenceTimer = null;
    }
  }

  public resumeMusic() {
    if (!this.isMusicPlaying) {
      this.startMusic();
    }
  }

  public nextTrack(): number {
    this.currentTrackIndex = (this.currentTrackIndex + 1) % DEMO_TRACKS.length;
    this.currentStep = 0;
    return this.currentTrackIndex;
  }

  public prevTrack(): number {
    this.currentTrackIndex = (this.currentTrackIndex - 1 + DEMO_TRACKS.length) % DEMO_TRACKS.length;
    this.currentStep = 0;
    return this.currentTrackIndex;
  }

  public selectTrack(index: number): number {
    if (index >= 0 && index < DEMO_TRACKS.length) {
      this.currentTrackIndex = index;
      this.currentStep = 0;
    }
    return this.currentTrackIndex;
  }

  public getCurrentTrackIndex(): number {
    return this.currentTrackIndex;
  }

  public isPlaying(): boolean {
    return this.isMusicPlaying;
  }

  private scheduleMusicStep() {
    if (!this.isMusicPlaying) return;

    const track = DEMO_TRACKS[this.currentTrackIndex];
    const stepDuration = 60 / track.bpm / 4; // 16th note in seconds

    if (this.ctx && this.musicGain && !this.isMusicMuted) {
      const now = this.ctx.currentTime;
      this.playTrackPattern(this.currentTrackIndex, this.currentStep, now, stepDuration);
    }

    this.currentStep = (this.currentStep + 1) % 64; // 4-bar loop of 16 steps

    this.sequenceTimer = window.setTimeout(() => {
      this.scheduleMusicStep();
    }, stepDuration * 1000);
  }

  private playTrackPattern(trackIdx: number, step: number, now: number, duration: number) {
    if (!this.ctx || !this.musicGain) return;

    const barStep = step % 16;
    const bar = Math.floor(step / 16);

    if (trackIdx === 0) {
      // TRACK 1: Neon Cyberpunk Drift (Synthwave / Electro 124 BPM)
      // Drums: Kick on 0, 4, 8, 12 (4-on-floor); Snare on 4, 12; Hi-hat on 2, 6, 10, 14
      if (barStep % 4 === 0) {
        this.synthKick(now);
      }
      if (barStep === 4 || barStep === 12) {
        this.synthSnare(now);
      }
      if (barStep % 2 === 0) {
        this.synthHiHat(now, barStep % 4 === 2 ? 0.08 : 0.04);
      }

      // Bassline: 16th note rolling synth bass
      // Chords per bar: Am (55Hz), F (43.65Hz), C (65.4Hz), G (49Hz)
      const bassRoots = [110, 87.31, 130.81, 98.0]; // A2, F2, C3, G2
      const root = bassRoots[bar];
      const octaveMod = barStep % 2 === 1 ? 2 : 1;
      this.synthSawBass(now, root * octaveMod, duration * 0.85);

      // Neon Synth Arp:
      const arpNotes = [
        [440, 523.25, 659.25, 880], // Am
        [349.23, 440, 523.25, 698.46], // F
        [523.25, 659.25, 783.99, 1046.5], // C
        [392.0, 493.88, 587.33, 783.99], // G
      ];
      const chordArp = arpNotes[bar];
      const noteToPlay = chordArp[barStep % chordArp.length];
      this.synthArpLead(now, noteToPlay, duration * 0.6);

    } else if (trackIdx === 1) {
      // TRACK 2: Arcade Hyper Pulse (High-Energy Future Bass 138 BPM)
      // Upbeat funky breakbeat rhythm
      if (barStep === 0 || barStep === 6 || barStep === 10) {
        this.synthKick(now);
      }
      if (barStep === 4 || barStep === 12) {
        this.synthSnare(now, 0.2);
      }
      this.synthHiHat(now, 0.03);

      // Bouncy FM Bass
      const futureRoots = [130.81, 146.83, 164.81, 174.61]; // C3, D3, E3, F3
      const root = futureRoots[bar];
      if (barStep % 2 === 0) {
        this.synthBouncyBass(now, root * (barStep === 8 ? 1.5 : 1), duration * 0.9);
      }

      // Chiptune / Arcade Lead hooks
      const arcadeMelody = [
        523.25, 0, 659.25, 783.99, 0, 1046.5, 783.99, 0,
        659.25, 783.99, 1046.5, 0, 1318.51, 1046.5, 783.99, 659.25,
      ];
      const mel = arcadeMelody[barStep];
      if (mel > 0) {
        this.synthSquareLead(now, mel * (bar % 2 === 1 ? 1.12 : 1), duration * 0.7);
      }

    } else {
      // TRACK 3: Midnight Blade Samurai (Lo-Fi Neo-Tokyo Beats 92 BPM)
      // Deep 808 kick on 0, 7; relaxed rim/snap on 4, 12
      if (barStep === 0 || barStep === 7) {
        this.synthSubKick(now);
      }
      if (barStep === 4 || barStep === 12) {
        this.synthRim(now);
      }
      if (barStep % 2 === 0) {
        this.synthHiHat(now, 0.02);
      }

      // Warm Lo-Fi Chords
      if (barStep === 0 || barStep === 8) {
        const loFiPads = [
          [220, 261.63, 329.63, 392], // Am7
          [174.61, 220, 261.63, 329.63], // Fmaj7
          [261.63, 329.63, 392, 493.88], // Cmaj7
          [196, 246.94, 293.66, 349.23], // G7
        ];
        this.synthWarmPad(now, loFiPads[bar], duration * 6);
      }

      // Melodic Japanese Pentatonic Lead (D, F, G, Ab, C)
      const kotoNotes = [587.33, 0, 698.46, 0, 783.99, 830.61, 0, 1046.5, 0, 830.61, 783.99, 0, 698.46, 0, 587.33, 0];
      const kotoNote = kotoNotes[barStep];
      if (kotoNote > 0 && (barStep % 2 === 0 || bar >= 2)) {
        this.synthPluckLead(now, kotoNote, duration * 1.5);
      }
    }
  }

  // --- Drum Synthesizers ---

  private synthKick(now: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.1);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + 0.17);
  }

  private synthSubKick(now: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.28);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  private synthSnare(now: number, vol = 0.18) {
    if (!this.ctx || !this.musicGain) return;

    // Snappy tone
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.08);

    oscGain.gain.setValueAtTime(vol * 0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(oscGain);
    oscGain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + 0.1);

    // Noise snap
    const bufferSize = this.ctx.sampleRate * 0.12;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.03));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(vol, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.musicGain);

    noise.start(now);
    noise.stop(now + 0.13);
  }

  private synthHiHat(now: number, vol = 0.05) {
    if (!this.ctx || !this.musicGain) return;

    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 7500;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(vol, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    noise.start(now);
    noise.stop(now + 0.04);
  }

  private synthRim(now: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(950, now);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  // --- Melodic Synthesizers ---

  private synthSawBass(now: number, freq: number, duration: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + duration);
    filter.Q.value = 2.5;

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private synthBouncyBass(now: number, freq: number, duration: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq * 1.5, now);
    osc.frequency.exponentialRampToValueAtTime(freq, now + 0.05);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private synthArpLead(now: number, freq: number, duration: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, now);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.value = 2;

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private synthSquareLead(now: number, freq: number, duration: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.07, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  private synthWarmPad(now: number, freqs: number[], duration: number) {
    if (!this.ctx || !this.musicGain) return;

    freqs.forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const filter = this.ctx!.createBiquadFilter();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain!);

      osc.start(now);
      osc.stop(now + duration + 0.1);
    });
  }

  private synthPluckLead(now: number, freq: number, duration: number) {
    if (!this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.musicGain);

    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  // --- Volume and Visualizer APIs ---

  public setSfxVolume(vol: number) {
    this.sfxVolume = Math.max(0, Math.min(1, vol));
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.isSfxMuted ? 0 : this.sfxVolume;
    }
  }

  public setMusicVolume(vol: number) {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.musicGain) {
      this.musicGain.gain.value = this.isMusicMuted ? 0 : this.musicVolume;
    }
  }

  public toggleSfxMute(): boolean {
    this.isSfxMuted = !this.isSfxMuted;
    if (this.sfxGain) {
      this.sfxGain.gain.value = this.isSfxMuted ? 0 : this.sfxVolume;
    }
    return this.isSfxMuted;
  }

  public toggleMusicMute(): boolean {
    this.isMusicMuted = !this.isMusicMuted;
    if (this.musicGain) {
      this.musicGain.gain.value = this.isMusicMuted ? 0 : this.musicVolume;
    }
    return this.isMusicMuted;
  }

  public getVisualizerData(): Uint8Array {
    if (!this.analyser) {
      return new Uint8Array(16);
    }
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  public isMuted() {
    return {
      sfx: this.isSfxMuted,
      music: this.isMusicMuted,
    };
  }
}

export const soundEngine = new SoundEngine();
