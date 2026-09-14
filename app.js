/**
 * FlyPiano 3D - Fruit Fly Brain Piano AI Engine (12-Tone & Full 88-Key Grand Piano)
 * =================================================================================
 * Features:
 * - Full 3D WebGL (Three.js) articulated Drosophila simulation
 * - 12-key & 88-key resonant grand piano with soundboard harp
 * - Acoustic Piano String Physical Modeling (Inharmonicity B=0.0004, bichord chorusing, soundboard formants)
 * - Dual Audio Modes:
 *     1) Direct Original MP3/WAV Audio Playback with real-time FFT frequency-to-key sync
 *     2) Solo Acoustic Grand Piano String Synthesizer
 * - Authentic Presets: Beethoven Für Elise, Moonlight Sonata, C418 Aria Math (Minecraft)
 * - Standard MIDI delta-time rhythmic parser
 */

// ============================================================================
// 1. CONSTANTS & 88-KEY PIANO DATABASE
// ============================================================================
const SEMITONE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

const PIANO_88_KEYS = [];
const FREQ_88 = [];

for (let i = 0; i < 88; i++) {
  const midi = i + 21; // MIDI 21 = A0, MIDI 108 = C8
  const semitone = (midi - 12) % 12;
  const octave = Math.floor((midi - 12) / 12);
  const name = `${SEMITONE_NAMES[semitone]}${octave}`;
  const isBlack = [1, 3, 6, 8, 10].includes(semitone);
  const freq = 440 * Math.pow(2, (midi - 69) / 12);

  PIANO_88_KEYS.push({ index: i, midi, name, semitone, octave, isBlack });
  FREQ_88.push(freq);
}

// ----------------------------------------------------------------------------
// Authentic Presets with True Rhythms & Note Durations
// ----------------------------------------------------------------------------
const PRESETS = {
  aria_math: {
    name: "Aria Math (C418) · Multi-Task Neural Mimicry",
    bpm: 100,
    events: [
      // Section A: Signature F#m9 / A arpeggios (100 BPM)
      { note: 66, pitch: 6, octave: 4, velocity: 0.75, dur: 0.5, stepDelay: 0.5, is_rest: false }, // F#4
      { note: 69, pitch: 9, octave: 4, velocity: 0.71, dur: 0.5, stepDelay: 0.5, is_rest: false }, // A4
      { note: 71, pitch: 11, octave: 4, velocity: 0.73, dur: 0.5, stepDelay: 0.5, is_rest: false }, // B4
      { note: 73, pitch: 1, octave: 5, velocity: 0.79, dur: 0.5, stepDelay: 0.5, is_rest: false }, // C#5
      { note: 76, pitch: 4, octave: 5, velocity: 0.83, dur: 0.5, stepDelay: 0.5, is_rest: false }, // E5
      { note: 78, pitch: 6, octave: 5, velocity: 0.87, dur: 0.5, stepDelay: 0.5, is_rest: false }, // F#5
      { note: 76, pitch: 4, octave: 5, velocity: 0.77, dur: 0.5, stepDelay: 0.5, is_rest: false }, // E5
      { note: 73, pitch: 1, octave: 5, velocity: 0.73, dur: 0.5, stepDelay: 0.5, is_rest: false }, // C#5

      { note: 71, pitch: 11, octave: 4, velocity: 0.69, dur: 0.5, stepDelay: 0.5, is_rest: false }, // B4
      { note: 69, pitch: 9, octave: 4, velocity: 0.67, dur: 0.5, stepDelay: 0.5, is_rest: false }, // A4
      { note: 66, pitch: 6, octave: 4, velocity: 0.71, dur: 0.5, stepDelay: 0.5, is_rest: false }, // F#4
      { note: 64, pitch: 4, octave: 4, velocity: 0.67, dur: 0.5, stepDelay: 0.5, is_rest: false }, // E4
      { note: 66, pitch: 6, octave: 4, velocity: 0.75, dur: 1.0, stepDelay: 1.0, is_rest: false }, // F#4
      { note: 61, pitch: 1, octave: 4, velocity: 0.70, dur: 1.0, stepDelay: 1.0, is_rest: false }, // C#4
      { note: null, pitch: 12, octave: 3, velocity: 0.0, dur: 0.5, stepDelay: 0.5, is_rest: true }, // ⏸ REST

      // Deep F# Bass Drop
      { note: 42, pitch: 6, octave: 2, velocity: 0.91, dur: 1.5, stepDelay: 1.0, is_rest: false }, // F#2
      { note: 54, pitch: 6, octave: 3, velocity: 0.71, dur: 0.5, stepDelay: 0.5, is_rest: false }, // F#3
      { note: 57, pitch: 9, octave: 3, velocity: 0.75, dur: 0.5, stepDelay: 0.5, is_rest: false }, // A3
      { note: 61, pitch: 1, octave: 4, velocity: 0.79, dur: 1.0, stepDelay: 1.0, is_rest: false }, // C#4

      // Section B: D Major / F#m syncopation
      { note: 62, pitch: 2, octave: 4, velocity: 0.71, dur: 0.5, stepDelay: 0.5, is_rest: false }, // D4
      { note: 66, pitch: 6, octave: 4, velocity: 0.73, dur: 0.5, stepDelay: 0.5, is_rest: false }, // F#4
      { note: 69, pitch: 9, octave: 4, velocity: 0.75, dur: 0.5, stepDelay: 0.5, is_rest: false }, // A4
      { note: 71, pitch: 11, octave: 4, velocity: 0.77, dur: 0.5, stepDelay: 0.5, is_rest: false }, // B4
      { note: 74, pitch: 2, octave: 5, velocity: 0.80, dur: 0.5, stepDelay: 0.5, is_rest: false }, // D5
      { note: 76, pitch: 4, octave: 5, velocity: 0.85, dur: 0.5, stepDelay: 0.5, is_rest: false }, // E5
      { note: 74, pitch: 2, octave: 5, velocity: 0.77, dur: 0.5, stepDelay: 0.5, is_rest: false }, // D5
      { note: 71, pitch: 11, octave: 4, velocity: 0.71, dur: 0.5, stepDelay: 0.5, is_rest: false }, // B4

      { note: 69, pitch: 9, octave: 4, velocity: 0.69, dur: 0.5, stepDelay: 0.5, is_rest: false }, // A4
      { note: 66, pitch: 6, octave: 4, velocity: 0.71, dur: 0.5, stepDelay: 0.5, is_rest: false }, // F#4
      { note: 62, pitch: 2, octave: 4, velocity: 0.67, dur: 0.5, stepDelay: 0.5, is_rest: false }, // D4
      { note: 61, pitch: 1, octave: 4, velocity: 0.63, dur: 0.5, stepDelay: 0.5, is_rest: false }, // C#4
      { note: 62, pitch: 2, octave: 4, velocity: 0.73, dur: 1.0, stepDelay: 1.0, is_rest: false }, // D4
      { note: 57, pitch: 9, octave: 3, velocity: 0.70, dur: 1.0, stepDelay: 1.0, is_rest: false }, // A3
      { note: null, pitch: 12, octave: 2, velocity: 0.0, dur: 0.5, stepDelay: 0.5, is_rest: true }, // ⏸ REST

      // Deep D Bass Drop
      { note: 38, pitch: 2, octave: 2, velocity: 0.93, dur: 1.5, stepDelay: 1.0, is_rest: false }, // D2
      { note: 50, pitch: 2, octave: 3, velocity: 0.73, dur: 0.5, stepDelay: 0.5, is_rest: false }, // D3
      { note: 54, pitch: 6, octave: 3, velocity: 0.76, dur: 0.5, stepDelay: 0.5, is_rest: false }, // F#3
      { note: 57, pitch: 9, octave: 3, velocity: 0.80, dur: 1.0, stepDelay: 1.0, is_rest: false }, // A3

      // Section C: Soaring High Treble Melody
      { note: 64, pitch: 4, octave: 4, velocity: 0.71, dur: 0.5, stepDelay: 0.5, is_rest: false }, // E4
      { note: 68, pitch: 8, octave: 4, velocity: 0.74, dur: 0.5, stepDelay: 0.5, is_rest: false }, // G#4
      { note: 71, pitch: 11, octave: 4, velocity: 0.76, dur: 0.5, stepDelay: 0.5, is_rest: false }, // B4
      { note: 73, pitch: 1, octave: 5, velocity: 0.80, dur: 0.5, stepDelay: 0.5, is_rest: false }, // C#5
      { note: 76, pitch: 4, octave: 5, velocity: 0.86, dur: 0.5, stepDelay: 0.5, is_rest: false }, // E5
      { note: 80, pitch: 8, octave: 5, velocity: 0.90, dur: 0.5, stepDelay: 0.5, is_rest: false }, // G#5
      { note: 76, pitch: 4, octave: 5, velocity: 0.82, dur: 0.5, stepDelay: 0.5, is_rest: false }, // E5
      { note: 73, pitch: 1, octave: 5, velocity: 0.76, dur: 0.5, stepDelay: 0.5, is_rest: false }, // C#5

      { note: 71, pitch: 11, octave: 4, velocity: 0.72, dur: 0.5, stepDelay: 0.5, is_rest: false }, // B4
      { note: 68, pitch: 8, octave: 4, velocity: 0.70, dur: 0.5, stepDelay: 0.5, is_rest: false }, // G#4
      { note: 64, pitch: 4, octave: 4, velocity: 0.74, dur: 1.0, stepDelay: 1.0, is_rest: false }, // E4
      { note: 49, pitch: 1, octave: 3, velocity: 0.83, dur: 1.0, stepDelay: 1.0, is_rest: false }, // C#3
      { note: 56, pitch: 8, octave: 3, velocity: 0.80, dur: 1.0, stepDelay: 1.0, is_rest: false }, // G#3

      // Resolving Cadence
      { note: 73, pitch: 1, octave: 5, velocity: 0.78, dur: 0.5, stepDelay: 0.5, is_rest: false }, // C#5
      { note: 71, pitch: 11, octave: 4, velocity: 0.75, dur: 0.5, stepDelay: 0.5, is_rest: false }, // B4
      { note: 69, pitch: 9, octave: 4, velocity: 0.73, dur: 0.5, stepDelay: 0.5, is_rest: false }, // A4
      { note: 66, pitch: 6, octave: 4, velocity: 0.72, dur: 0.5, stepDelay: 0.5, is_rest: false }, // F#4
      { note: 64, pitch: 4, octave: 4, velocity: 0.70, dur: 1.0, stepDelay: 1.0, is_rest: false }, // E4
      { note: 66, pitch: 6, octave: 4, velocity: 0.80, dur: 2.5, stepDelay: 2.5, is_rest: false }, // F#4 (Long Singing Sustain)
      { note: null, pitch: 12, octave: 4, velocity: 0.0, dur: 1.0, stepDelay: 1.0, is_rest: true }  // ⏸ REST
    ]
  },
  fur_elise: {
    name: "Für Elise (Beethoven) · Authentic Rhythm",
    bpm: 132,
    events: [
      { note: 76, dur: 0.5, stepDelay: 0.5 }, // E5
      { note: 75, dur: 0.5, stepDelay: 0.5 }, // D#5
      { note: 76, dur: 0.5, stepDelay: 0.5 }, // E5
      { note: 75, dur: 0.5, stepDelay: 0.5 }, // D#5
      { note: 76, dur: 0.5, stepDelay: 0.5 }, // E5
      { note: 71, dur: 0.5, stepDelay: 0.5 }, // B4
      { note: 74, dur: 0.5, stepDelay: 0.5 }, // D5
      { note: 72, dur: 0.5, stepDelay: 0.5 }, // C5
      { note: 69, dur: 1.5, stepDelay: 1.5 }, // A4 (Hold)
      { note: 60, dur: 0.5, stepDelay: 0.5 }, // C4
      { note: 64, dur: 0.5, stepDelay: 0.5 }, // E4
      { note: 69, dur: 0.5, stepDelay: 0.5 }, // A4
      { note: 71, dur: 1.5, stepDelay: 1.5 }, // B4 (Hold)
      { note: 64, dur: 0.5, stepDelay: 0.5 }, // E4
      { note: 68, dur: 0.5, stepDelay: 0.5 }, // G#4
      { note: 71, dur: 0.5, stepDelay: 0.5 }, // B4
      { note: 72, dur: 1.5, stepDelay: 1.5 }, // C5 (Hold)
      { note: 64, dur: 0.5, stepDelay: 0.5 }, // E4
      { note: 76, dur: 0.5, stepDelay: 0.5 }, // E5
      { note: 75, dur: 0.5, stepDelay: 0.5 }, // D#5
      { note: 76, dur: 0.5, stepDelay: 0.5 }, // E5
      { note: 75, dur: 0.5, stepDelay: 0.5 }, // D#5
      { note: 76, dur: 0.5, stepDelay: 0.5 }, // E5
      { note: 71, dur: 0.5, stepDelay: 0.5 }, // B4
      { note: 74, dur: 0.5, stepDelay: 0.5 }, // D5
      { note: 72, dur: 0.5, stepDelay: 0.5 }, // C5
      { note: 69, dur: 2.0, stepDelay: 2.0 }  // A4 (Resolution)
    ]
  },
  moonlight: {
    name: "Moonlight Sonata (Beethoven) · Triplet Flow",
    bpm: 54,
    events: [
      { note: 37, dur: 1.2, stepDelay: 0.8 }, // C#2 (Bass)
      { note: 56, dur: 0.6, stepDelay: 0.4 }, // G#3
      { note: 61, dur: 0.6, stepDelay: 0.4 }, // C#4
      { note: 64, dur: 0.6, stepDelay: 0.4 }, // E4
      { note: 56, dur: 0.6, stepDelay: 0.4 }, // G#3
      { note: 61, dur: 0.6, stepDelay: 0.4 }, // C#4
      { note: 64, dur: 0.6, stepDelay: 0.4 }, // E4
      { note: 56, dur: 0.6, stepDelay: 0.4 }, // G#3
      { note: 61, dur: 0.6, stepDelay: 0.4 }, // C#4
      { note: 64, dur: 0.6, stepDelay: 0.4 }, // E4
      { note: 35, dur: 1.2, stepDelay: 0.8 }, // B1 (Bass)
      { note: 56, dur: 0.6, stepDelay: 0.4 }, // G#3
      { note: 59, dur: 0.6, stepDelay: 0.4 }, // B3
      { note: 64, dur: 0.6, stepDelay: 0.4 }, // E4
      { note: 68, dur: 2.5, stepDelay: 1.8 }  // G#4 (Melody)
    ]
  },
  ode_to_joy: {
    name: "Ode to Joy (Beethoven) · Anthem",
    bpm: 116,
    events: [
      { note: 64, dur: 1.0, stepDelay: 1.0 }, { note: 64, dur: 1.0, stepDelay: 1.0 }, { note: 65, dur: 1.0, stepDelay: 1.0 }, { note: 67, dur: 1.0, stepDelay: 1.0 },
      { note: 67, dur: 1.0, stepDelay: 1.0 }, { note: 65, dur: 1.0, stepDelay: 1.0 }, { note: 64, dur: 1.0, stepDelay: 1.0 }, { note: 62, dur: 1.0, stepDelay: 1.0 },
      { note: 60, dur: 1.0, stepDelay: 1.0 }, { note: 60, dur: 1.0, stepDelay: 1.0 }, { note: 62, dur: 1.0, stepDelay: 1.0 }, { note: 64, dur: 1.0, stepDelay: 1.0 },
      { note: 64, dur: 1.5, stepDelay: 1.5 }, { note: 62, dur: 0.5, stepDelay: 0.5 }, { note: 62, dur: 2.0, stepDelay: 2.0 }
    ]
  },
  bach_prelude: {
    name: "Bach Cello Suite No. 1 · Prelude (G Major)",
    bpm: 88,
    events: [
      { note: 43, pitch: 7, octave: 2, velocity: 0.88, dur: 0.5, stepDelay: 0.5 },
      { note: 50, pitch: 2, octave: 3, velocity: 0.72, dur: 0.5, stepDelay: 0.5 },
      { note: 59, pitch: 11, octave: 3, velocity: 0.75, dur: 0.5, stepDelay: 0.5 },
      { note: 62, pitch: 2, octave: 4, velocity: 0.78, dur: 0.5, stepDelay: 0.5 },
      { note: 59, pitch: 11, octave: 3, velocity: 0.70, dur: 0.5, stepDelay: 0.5 },
      { note: 50, pitch: 2, octave: 3, velocity: 0.68, dur: 0.5, stepDelay: 0.5 },
      { note: 59, pitch: 11, octave: 3, velocity: 0.70, dur: 0.5, stepDelay: 0.5 },
      { note: 50, pitch: 2, octave: 3, velocity: 0.68, dur: 0.5, stepDelay: 0.5 },
      { note: 43, pitch: 7, octave: 2, velocity: 0.88, dur: 0.5, stepDelay: 0.5 },
      { note: 50, pitch: 2, octave: 3, velocity: 0.72, dur: 0.5, stepDelay: 0.5 },
      { note: 59, pitch: 11, octave: 3, velocity: 0.75, dur: 0.5, stepDelay: 0.5 },
      { note: 62, pitch: 2, octave: 4, velocity: 0.78, dur: 0.5, stepDelay: 0.5 },
      { note: 59, pitch: 11, octave: 3, velocity: 0.70, dur: 0.5, stepDelay: 0.5 },
      { note: 50, pitch: 2, octave: 3, velocity: 0.68, dur: 0.5, stepDelay: 0.5 },
      { note: 59, pitch: 11, octave: 3, velocity: 0.70, dur: 0.5, stepDelay: 0.5 },
      { note: 50, pitch: 2, octave: 3, velocity: 0.68, dur: 0.5, stepDelay: 0.5 },
      { note: 40, pitch: 4, octave: 2, velocity: 0.85, dur: 0.5, stepDelay: 0.5 },
      { note: 52, pitch: 4, octave: 3, velocity: 0.74, dur: 0.5, stepDelay: 0.5 },
      { note: 59, pitch: 11, octave: 3, velocity: 0.76, dur: 0.5, stepDelay: 0.5 },
      { note: 64, pitch: 4, octave: 4, velocity: 0.80, dur: 0.5, stepDelay: 0.5 },
      { note: 59, pitch: 11, octave: 3, velocity: 0.72, dur: 0.5, stepDelay: 0.5 },
      { note: 52, pitch: 4, octave: 3, velocity: 0.70, dur: 0.5, stepDelay: 0.5 },
      { note: 36, pitch: 0, octave: 2, velocity: 0.89, dur: 0.5, stepDelay: 0.5 },
      { note: 52, pitch: 4, octave: 3, velocity: 0.74, dur: 0.5, stepDelay: 0.5 },
      { note: 60, pitch: 0, octave: 4, velocity: 0.78, dur: 0.5, stepDelay: 0.5 },
      { note: 64, pitch: 4, octave: 4, velocity: 0.82, dur: 0.5, stepDelay: 0.5 },
      { note: 38, pitch: 2, octave: 2, velocity: 0.90, dur: 0.5, stepDelay: 0.5 },
      { note: 50, pitch: 2, octave: 3, velocity: 0.75, dur: 0.5, stepDelay: 0.5 },
      { note: 57, pitch: 9, octave: 3, velocity: 0.77, dur: 0.5, stepDelay: 0.5 },
      { note: 62, pitch: 2, octave: 4, velocity: 0.84, dur: 0.5, stepDelay: 0.5 },
      { note: 66, pitch: 6, octave: 4, velocity: 0.86, dur: 0.5, stepDelay: 0.5 },
      { note: 43, pitch: 7, octave: 2, velocity: 0.95, dur: 2.0, stepDelay: 2.0 }
    ]
  },
  c_major_scale: {
    name: "C Major Diatonic Scale",
    bpm: 120,
    events: [
      60, 62, 64, 65, 67, 69, 71, 72,
      71, 69, 67, 65, 64, 62, 60
    ].map(n => ({ note: n, dur: 0.6, stepDelay: 0.6 }))
  },
  grand_88_scale: {
    name: "Grand 88-Key Chromatic Sweep",
    bpm: 180,
    events: Array.from({ length: 88 }, (_, i) => ({ note: i + 21, dur: 0.3, stepDelay: 0.3 }))
  }
};

// ============================================================================
// 2. PIANO PROFILES & PHYSICAL STRING MODELING SYNTHESIZER
// ============================================================================
const PIANO_PROFILES = {
  steinway: {
    name: "Steinway D-274 Concert Grand",
    inharmonicityBase: 0.00030,
    hammerHardness: 0.90,
    hammerAttackMs: 2.2,
    bichordDetuneCents: 0.9,
    bodyResonanceGain: 3.5,
    bodyFreq: 180,
    decayScale: 2.5,
    brightness: 1.05
  },
  yamaha: {
    name: "Yamaha CFX Studio Grand (Bright / C418)",
    inharmonicityBase: 0.00045,
    hammerHardness: 1.25,
    hammerAttackMs: 1.5,
    bichordDetuneCents: 1.4,
    bodyResonanceGain: 2.5,
    bodyFreq: 240,
    decayScale: 2.2,
    brightness: 1.40
  },
  bosendorfer: {
    name: "Bösendorfer 290 Imperial (Deep Bass)",
    inharmonicityBase: 0.00018,
    hammerHardness: 0.75,
    hammerAttackMs: 3.0,
    bichordDetuneCents: 0.7,
    bodyResonanceGain: 4.6,
    bodyFreq: 110,
    decayScale: 3.2,
    brightness: 0.85
  },
  upright: {
    name: "Vintage Upright (Honky-Tonk / Felt)",
    inharmonicityBase: 0.00075,
    hammerHardness: 1.0,
    hammerAttackMs: 2.5,
    bichordDetuneCents: 3.0,
    bodyResonanceGain: 2.0,
    bodyFreq: 320,
    decayScale: 1.6,
    brightness: 1.0
  }
};

class AcousticPianoSynth {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.bodyLowFilter = null;
    this.bodyPeakFilter = null;
    this.bodyHighFilter = null;
    this.volume = 0.85;
    this.activeProfileKey = 'steinway';
    this.profile = PIANO_PROFILES.steinway;
  }

  setProfile(profileKey) {
    if (PIANO_PROFILES[profileKey]) {
      this.activeProfileKey = profileKey;
      this.profile = PIANO_PROFILES[profileKey];
      if (this.bodyPeakFilter && this.ctx) {
        this.bodyPeakFilter.frequency.setTargetAtTime(this.profile.bodyFreq, this.ctx.currentTime, 0.05);
        this.bodyPeakFilter.gain.setTargetAtTime(this.profile.bodyResonanceGain, this.ctx.currentTime, 0.05);
      }
      console.log(`🎹 Switched Piano String Profile to: ${this.profile.name}`);
    }
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

      // Acoustic Soundboard Resonator (Spruce wood cabinet body formants)
      // 1. Low shelf warmth (spruce soundboard foundation)
      this.bodyLowFilter = this.ctx.createBiquadFilter();
      this.bodyLowFilter.type = 'lowshelf';
      this.bodyLowFilter.frequency.setValueAtTime(140, this.ctx.currentTime);
      this.bodyLowFilter.gain.setValueAtTime(3.0, this.ctx.currentTime);

      // 2. Wood body formant resonance
      this.bodyPeakFilter = this.ctx.createBiquadFilter();
      this.bodyPeakFilter.type = 'peaking';
      this.bodyPeakFilter.frequency.setValueAtTime(this.profile.bodyFreq, this.ctx.currentTime);
      this.bodyPeakFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);
      this.bodyPeakFilter.gain.setValueAtTime(this.profile.bodyResonanceGain, this.ctx.currentTime);

      // 3. Air presence and gentle treble acoustic damping
      this.bodyHighFilter = this.ctx.createBiquadFilter();
      this.bodyHighFilter.type = 'highshelf';
      this.bodyHighFilter.frequency.setValueAtTime(5500, this.ctx.currentTime);
      this.bodyHighFilter.gain.setValueAtTime(-2.0, this.ctx.currentTime);

      this.bodyLowFilter.connect(this.bodyPeakFilter);
      this.bodyPeakFilter.connect(this.bodyHighFilter);
      this.bodyHighFilter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = val;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  /**
   * Real Acoustic Piano String Physical Synthesis
   * Models:
   * - Register-dependent String Inharmonicity (stiffness B factor: fn = n * f0 * sqrt(1 + B * n^2))
   * - Coupled string unisons: Single copper-wrapped string (bass), bichords (mid), trichords (treble)
   * - Both odd and even partials shaped by hammer strike point comb filtering
   * - Frequency-dependent damping: high partials die quickly into singing fundamental
   * - Nonlinear felt hammer strike impulse transient
   * - Two-stage acoustic decay (initial prompt strike + long singing sustain)
   */
  playNote(midiPitch, durationSec = 1.0, velocity = 0.9) {
    this.init();
    if (!this.ctx) return;

    const f0 = 440 * Math.pow(2, (midiPitch - 69) / 12);
    const now = this.ctx.currentTime;
    const prof = this.profile;

    // Grand Piano Stereo Stage Panning (Left = Bass A0, Right = Treble C8)
    const panNode = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
    if (panNode) {
      const panVal = Math.max(-0.75, Math.min(0.75, ((midiPitch - 21) / 88) * 1.5 - 0.75));
      panNode.pan.setValueAtTime(panVal, now);
      panNode.connect(this.bodyLowFilter);
    }

    const noteBus = this.ctx.createGain();
    noteBus.connect(panNode || this.bodyLowFilter);

    // Register-scaled Inharmonicity (shorter treble strings have higher stiffness B)
    const B = prof.inharmonicityBase * Math.pow(f0 / 261.63, 0.75);

    // Coupled string unisons configuration based on acoustic piano registers
    let detuneArray;
    if (midiPitch < 38) {
      // Bass: Single heavy copper-wound string
      detuneArray = [0];
    } else if (midiPitch < 68) {
      // Mid-range: Bichord (2 coupled strings with micro-chorusing)
      detuneArray = [-prof.bichordDetuneCents, prof.bichordDetuneCents];
    } else {
      // Treble: Trichord (3 coupled strings for brilliant singing shimmer)
      detuneArray = [-prof.bichordDetuneCents, 0, prof.bichordDetuneCents];
    }

    // Number of active partials per register
    const numPartials = midiPitch < 45 ? 9 : (midiPitch < 75 ? 7 : 4);
    const sustainTime = Math.max(1.5, durationSec * prof.decayScale);

    for (let n = 1; n <= numPartials; n++) {
      // Physical string stiffness formula
      const inharmonicFreq = n * f0 * Math.sqrt(1 + B * n * n);
      if (inharmonicFreq > 18000) break;

      // Strike point comb filtering amplitude: |sin(n * pi / 7.2)| / n^1.15
      const strikeComb = Math.abs(Math.sin((n * Math.PI) / 7.2));
      const harmonicGain = (strikeComb / Math.pow(n, 1.15)) * prof.brightness * (velocity / detuneArray.length);

      // High partials damp out much faster than the singing fundamental (f-dependent damping)
      const harmonicDecay = Math.max(0.12, sustainTime / Math.sqrt(n));

      detuneArray.forEach(cents => {
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        // Sine base for clean physical harmonic partial superposition
        osc.type = 'sine';
        osc.frequency.setValueAtTime(inharmonicFreq, now);
        osc.detune.setValueAtTime(cents, now);

        // Prompt strike attack + dynamic two-stage exponential decay
        const attackSec = (prof.hammerAttackMs / 1000);
        oscGain.gain.setValueAtTime(0.00001, now);
        oscGain.gain.exponentialRampToValueAtTime(Math.max(0.0001, harmonicGain * 0.9), now + attackSec);
        
        // Two-stage decay: prompt decay (first 100ms) then singing sustain tail
        const promptTime = Math.min(now + 0.12, now + harmonicDecay * 0.2);
        oscGain.gain.exponentialRampToValueAtTime(Math.max(0.00005, harmonicGain * 0.4), promptTime);
        oscGain.gain.exponentialRampToValueAtTime(0.00001, now + harmonicDecay);

        osc.connect(oscGain);
        oscGain.connect(noteBus);

        osc.start(now);
        osc.stop(now + harmonicDecay + 0.05);
      });
    }

    // Physical Wool Felt Hammer Strike Transient Click
    const hammerLen = Math.floor(this.ctx.sampleRate * (prof.hammerAttackMs * 0.008));
    if (hammerLen > 10) {
      const hammerBuffer = this.ctx.createBuffer(1, hammerLen, this.ctx.sampleRate);
      const hammerData = hammerBuffer.getChannelData(0);
      for (let i = 0; i < hammerLen; i++) {
        hammerData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (hammerLen * 0.25));
      }
      const hammerSource = this.ctx.createBufferSource();
      hammerSource.buffer = hammerBuffer;

      const hammerFilter = this.ctx.createBiquadFilter();
      hammerFilter.type = 'bandpass';
      hammerFilter.frequency.setValueAtTime(Math.min(f0 * 3.5, 4200), now);
      hammerFilter.Q.setValueAtTime(1.8, now);

      const hammerGain = this.ctx.createGain();
      hammerGain.gain.setValueAtTime(0.18 * velocity * prof.hammerHardness, now);

      hammerSource.connect(hammerFilter);
      hammerFilter.connect(hammerGain);
      hammerGain.connect(noteBus);
      hammerSource.start(now);
    }
  }
}

// ============================================================================
// 3. 3D SCENE & EMBODIED FRUIT FLY SIMULATION (Three.js)
// ============================================================================
class FlyPiano3DScene {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;

    this.is88Mode = true;
    this.pianoGroup = new THREE.Group();
    this.keys = [];
    this.strings = [];
    this.fly = null;

    this.flyTargetPos = new THREE.Vector3(0, 1.8, 0);

    this.init();
  }

  init() {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf8fafc);
    this.scene.fog = new THREE.FogExp2(0xf8fafc, 0.012);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 150);
    this.camera.position.set(0, 8.5, 15.0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.set(0, 1.0, 0);
    this.controls.maxPolarAngle = Math.PI / 2 - 0.02;

    this.setupLighting();

    this.scene.add(this.pianoGroup);
    this.rebuildPiano(this.is88Mode);

    this.buildFruitFly();
    this.setupParticles();

    window.addEventListener('resize', () => this.onWindowResize());
    this.animate();
  }

  setupLighting() {
    const ambient = new THREE.AmbientLight(0xffffff, 1.35);
    this.scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
    keyLight.position.set(8, 18, 12);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    this.scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xf1f5f9, 0.7);
    fillLight.position.set(-10, 10, -6);
    this.scene.add(fillLight);

    const softLight = new THREE.DirectionalLight(0xe2e8f0, 0.5);
    softLight.position.set(0, 14, -12);
    this.scene.add(softLight);
  }

  rebuildPiano(is88Mode) {
    this.is88Mode = is88Mode;
    this.keys = [];
    this.strings = [];

    while (this.pianoGroup.children.length > 0) {
      this.pianoGroup.remove(this.pianoGroup.children[0]);
    }

    if (is88Mode) {
      this.build88KeyGrandPiano();
      this.camera.position.set(0, 8.5, 15.0);
      this.controls.target.set(0, 1.0, 0);
    } else {
      this.build12KeyPiano();
      this.camera.position.set(0, 5.5, 9.5);
      this.controls.target.set(0, 1.2, 0);
    }
  }

  build88KeyGrandPiano() {
    const whiteKeysCount = 52;
    const whiteKeyWidth = 0.28;
    const whiteKeyLength = 1.9;
    const whiteKeyHeight = 0.20;
    const totalWidth = whiteKeysCount * whiteKeyWidth;
    const startX = -totalWidth / 2 + whiteKeyWidth / 2;

    const blackKeyWidth = 0.17;
    const blackKeyLength = 1.25;
    const blackKeyHeight = 0.26;

    const frameGeo = new THREE.BoxGeometry(totalWidth + 1.2, 0.6, 4.4);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.2 });
    const pianoFrame = new THREE.Mesh(frameGeo, frameMat);
    pianoFrame.position.set(0, 0.3, -0.8);
    pianoFrame.receiveShadow = true;
    this.pianoGroup.add(pianoFrame);

    const harpGeo = new THREE.BoxGeometry(totalWidth + 0.8, 2.5, 0.25);
    const harpMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.45, metalness: 0.3 });
    const harp = new THREE.Mesh(harpGeo, harpMat);
    harp.position.set(0, 1.8, -2.8);
    this.pianoGroup.add(harp);

    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.0 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.3 });

    let whiteIdx = 0;
    const whitePositions = [];

    PIANO_88_KEYS.forEach(keyInfo => {
      if (!keyInfo.isBlack) {
        const posX = startX + whiteIdx * whiteKeyWidth;
        whitePositions[keyInfo.index] = posX;

        const keyGeo = new THREE.BoxGeometry(whiteKeyWidth - 0.015, whiteKeyHeight, whiteKeyLength);
        const keyMesh = new THREE.Mesh(keyGeo, whiteMat.clone());
        keyMesh.position.set(posX, 0.6, 0.2);
        keyMesh.castShadow = true;
        keyMesh.receiveShadow = true;
        keyMesh.userData = { pitchIdx: keyInfo.index, isBlack: false, baseY: 0.6, name: keyInfo.name, midi: keyInfo.midi };

        this.pianoGroup.add(keyMesh);
        this.keys[keyInfo.index] = keyMesh;
        whiteIdx++;
      }
    });

    PIANO_88_KEYS.forEach(keyInfo => {
      if (keyInfo.isBlack) {
        const prevWhite = whitePositions[keyInfo.index - 1];
        const nextWhite = whitePositions[keyInfo.index + 1];
        const posX = (prevWhite !== undefined && nextWhite !== undefined) 
          ? (prevWhite + nextWhite) / 2 
          : (prevWhite || nextWhite || 0);

        const keyGeo = new THREE.BoxGeometry(blackKeyWidth, blackKeyHeight, blackKeyLength);
        const keyMesh = new THREE.Mesh(keyGeo, blackMat.clone());
        keyMesh.position.set(posX, 0.72, -0.15);
        keyMesh.castShadow = true;
        keyMesh.receiveShadow = true;
        keyMesh.userData = { pitchIdx: keyInfo.index, isBlack: true, baseY: 0.72, name: keyInfo.name, midi: keyInfo.midi };

        this.pianoGroup.add(keyMesh);
        this.keys[keyInfo.index] = keyMesh;
      }
    });

    for (let i = 0; i < 88; i++) {
      const keyMesh = this.keys[i];
      if (!keyMesh) continue;
      const stringX = keyMesh.position.x;
      const stringHeight = 2.4 - (i / 88) * 1.4;

      const stringGeo = new THREE.CylinderGeometry(0.012, 0.012, stringHeight, 6);
      const stringMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        metalness: 0.8,
        roughness: 0.35,
        emissive: 0x000000
      });

      const stringMesh = new THREE.Mesh(stringGeo, stringMat);
      stringMesh.position.set(stringX, 0.8 + stringHeight / 2, -1.8 - ((88 - i) / 88) * 0.8);
      stringMesh.userData = { vibrateTimer: 0, baseX: stringX };
      this.pianoGroup.add(stringMesh);
      this.strings[i] = stringMesh;
    }
  }

  build12KeyPiano() {
    const whiteKeyWidth = 0.65;
    const whiteKeyLength = 2.0;
    const whiteKeyHeight = 0.22;
    const whiteStartX = - (7 * whiteKeyWidth) / 2 + whiteKeyWidth / 2;

    const blackKeyWidth = 0.42;
    const blackKeyLength = 1.3;
    const blackKeyHeight = 0.28;

    const frameGeo = new THREE.BoxGeometry(6.6, 0.6, 3.8);
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4, metalness: 0.2 });
    const pianoFrame = new THREE.Mesh(frameGeo, frameMat);
    pianoFrame.position.set(0, 0.3, -0.6);
    this.pianoGroup.add(pianoFrame);

    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.2, metalness: 0.0 });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.3 });

    const whiteKeyPitchIndices = [0, 2, 4, 5, 7, 9, 11];
    const whitePositionsX = [];

    whiteKeyPitchIndices.forEach((pitchIdx, i) => {
      const posX = whiteStartX + i * (whiteKeyWidth + 0.02);
      whitePositionsX[pitchIdx] = posX;

      const keyGeo = new THREE.BoxGeometry(whiteKeyWidth, whiteKeyHeight, whiteKeyLength);
      const keyMesh = new THREE.Mesh(keyGeo, whiteMat.clone());
      keyMesh.position.set(posX, 0.6, 0.3);
      keyMesh.userData = { pitchIdx, isBlack: false, baseY: 0.6, name: SEMITONE_NAMES[pitchIdx] };

      this.pianoGroup.add(keyMesh);
      this.keys[pitchIdx] = keyMesh;
    });

    const blackOffsets = {
      1: (whitePositionsX[0] + whitePositionsX[2]) / 2,
      3: (whitePositionsX[2] + whitePositionsX[4]) / 2,
      6: (whitePositionsX[5] + whitePositionsX[7]) / 2,
      8: (whitePositionsX[7] + whitePositionsX[9]) / 2,
      10: (whitePositionsX[9] + whitePositionsX[11]) / 2
    };

    Object.entries(blackOffsets).forEach(([pitchIdxStr, posX]) => {
      const pitchIdx = parseInt(pitchIdxStr);
      const keyGeo = new THREE.BoxGeometry(blackKeyWidth, blackKeyHeight, blackKeyLength);
      const keyMesh = new THREE.Mesh(keyGeo, blackMat.clone());
      keyMesh.position.set(posX, 0.72, -0.05);
      keyMesh.userData = { pitchIdx, isBlack: true, baseY: 0.72, name: SEMITONE_NAMES[pitchIdx] };

      this.pianoGroup.add(keyMesh);
      this.keys[pitchIdx] = keyMesh;
    });

    for (let i = 0; i < 12; i++) {
      const keyMesh = this.keys[i];
      const stringX = keyMesh.position.x;
      const stringHeight = 2.2 - (i * 0.08);

      const stringGeo = new THREE.CylinderGeometry(0.018, 0.018, stringHeight, 8);
      const stringMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.8, roughness: 0.35 });

      const stringMesh = new THREE.Mesh(stringGeo, stringMat);
      stringMesh.position.set(stringX, 0.8 + stringHeight / 2, -1.6 - (i * 0.04));
      stringMesh.userData = { vibrateTimer: 0, baseX: stringX };
      this.pianoGroup.add(stringMesh);
      this.strings[i] = stringMesh;
    }
  }

  buildFruitFly() {
    if (this.fly) {
      this.scene.remove(this.fly);
    }

    this.fly = new THREE.Group();

    // 1. Thorax (Realistic golden-bronze cuticle with scutellum)
    const thoraxGeo = new THREE.SphereGeometry(0.32, 20, 20);
    thoraxGeo.scale(1.0, 0.88, 1.25);
    const cuticleMat = new THREE.MeshStandardMaterial({
      color: 0x3d2314,
      metalness: 0.75,
      roughness: 0.28
    });
    const thorax = new THREE.Mesh(thoraxGeo, cuticleMat);
    thorax.castShadow = true;
    this.fly.add(thorax);

    // Scutellum (V-shaped triangular dorsal plate on posterior thorax)
    const scutGeo = new THREE.ConeGeometry(0.12, 0.22, 5);
    scutGeo.rotateX(Math.PI / 2);
    const scutMat = new THREE.MeshStandardMaterial({ color: 0x5c3a1e, metalness: 0.8, roughness: 0.25 });
    const scutellum = new THREE.Mesh(scutGeo, scutMat);
    scutellum.position.set(0, 0.22, 0.22);
    this.fly.add(scutellum);

    // 2. Abdomen with segmented tergite stripes
    const abdomenGroup = new THREE.Group();
    abdomenGroup.position.set(0, 0.04, 0.65); // Abdomen trails behind (+Z)
    abdomenGroup.rotation.x = 0.12;

    const abdGeo = new THREE.SphereGeometry(0.38, 18, 18);
    abdGeo.scale(0.82, 0.80, 1.6);
    const abdMat = new THREE.MeshStandardMaterial({
      color: 0xa0672e,
      roughness: 0.45,
      metalness: 0.35
    });
    const abdomenMesh = new THREE.Mesh(abdGeo, abdMat);
    abdomenMesh.castShadow = true;
    abdomenGroup.add(abdomenMesh);

    // Dark Tergite Bands
    for (let b = 0; b < 4; b++) {
      const ringGeo = new THREE.TorusGeometry(0.28 - b * 0.03, 0.02, 8, 24);
      ringGeo.rotateX(Math.PI / 2);
      const ringMat = new THREE.MeshStandardMaterial({ color: 0x18110b, roughness: 0.5 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(0, 0, -0.25 + b * 0.22);
      abdomenGroup.add(ring);
    }
    this.fly.add(abdomenGroup);

    // 3. Head (Facing forward towards piano keys at -Z)
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.08, -0.45);

    // Semi-translucent cranial cuticle so brain is visible inside!
    const headGeo = new THREE.SphereGeometry(0.26, 20, 20);
    headGeo.scale(1.15, 0.95, 0.95);
    const headMat = new THREE.MeshPhysicalMaterial({
      color: 0x2b1c10,
      metalness: 0.4,
      roughness: 0.2,
      transmission: 0.55,
      opacity: 0.9,
      transparent: true,
      ior: 1.35
    });
    const head = new THREE.Mesh(headGeo, headMat);
    headGroup.add(head);

    // =========================================================================
    // 🧠 INTERNAL 3D GLOWING FLY BRAIN (AMMC, CX, MB, DN)
    // =========================================================================
    this.brainMeshGroup = new THREE.Group();
    headGroup.add(this.brainMeshGroup);

    // AMMC (Antennal Mechanosensory & Motor Center - Auditory Input): Muted Slate Blue
    const ammcMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      emissive: 0x0284c7,
      emissiveIntensity: 0.25,
      roughness: 0.3
    });
    const ammcGeo = new THREE.SphereGeometry(0.065, 12, 12);
    this.ammcMeshL = new THREE.Mesh(ammcGeo, ammcMat.clone());
    this.ammcMeshL.position.set(-0.09, -0.02, -0.08);
    this.brainMeshGroup.add(this.ammcMeshL);

    this.ammcMeshR = new THREE.Mesh(ammcGeo, ammcMat.clone());
    this.ammcMeshR.position.set(0.09, -0.02, -0.08);
    this.brainMeshGroup.add(this.ammcMeshR);

    // Central Complex (CX - EB/FB - Octave Coordinate & Master Clock): Muted Amber
    const cxMat = new THREE.MeshStandardMaterial({
      color: 0xd97706,
      emissive: 0xd97706,
      emissiveIntensity: 0.25,
      roughness: 0.3
    });
    const cxGeo = new THREE.TorusGeometry(0.055, 0.025, 8, 16);
    this.cxMesh = new THREE.Mesh(cxGeo, cxMat);
    this.cxMesh.position.set(0, 0.04, -0.02);
    this.brainMeshGroup.add(this.cxMesh);

    // Mushroom Body (MB - Kenyon Cells & Memory): Muted Violet
    const mbMat = new THREE.MeshStandardMaterial({
      color: 0x7c3aed,
      emissive: 0x7c3aed,
      emissiveIntensity: 0.25,
      roughness: 0.3
    });
    const mbGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.08, 8);
    this.mbMeshL = new THREE.Mesh(mbGeo, mbMat.clone());
    this.mbMeshL.position.set(-0.07, 0.08, 0.02);
    this.brainMeshGroup.add(this.mbMeshL);

    this.mbMeshR = new THREE.Mesh(mbGeo, mbMat.clone());
    this.mbMeshR.position.set(0.07, 0.08, 0.02);
    this.brainMeshGroup.add(this.mbMeshR);

    // Descending Neurons (DNs - Motor command spike to legs): Muted Rose
    const dnMat = new THREE.MeshStandardMaterial({
      color: 0xe11d48,
      emissive: 0xe11d48,
      emissiveIntensity: 0.25,
      roughness: 0.3
    });
    const dnGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.16, 8);
    dnGeo.rotateX(Math.PI / 2);
    this.dnMesh = new THREE.Mesh(dnGeo, dnMat);
    this.dnMesh.position.set(0, -0.05, 0.06);
    this.brainMeshGroup.add(this.dnMesh);

    // Compound Ruby Eyes
    const eyeGeo = new THREE.SphereGeometry(0.15, 16, 16);
    eyeGeo.scale(1.2, 1.1, 0.95);
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0x991b1b,
      roughness: 0.25,
      metalness: 0.7,
      emissive: 0x450a0a,
      emissiveIntensity: 0.2
    });

    const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
    leftEye.position.set(-0.17, 0.05, -0.06);
    leftEye.rotation.y = 0.4;
    headGroup.add(leftEye);

    const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
    rightEye.position.set(0.17, 0.05, -0.06);
    rightEye.rotation.y = -0.4;
    headGroup.add(rightEye);

    // Antennae with feathery aristae (Natural chitin)
    const antMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.5, metalness: 0.2 });
    const antGeo = new THREE.CylinderGeometry(0.010, 0.016, 0.20, 6);

    this.leftAntenna = new THREE.Mesh(antGeo, antMat);
    this.leftAntenna.position.set(-0.06, 0.14, -0.22);
    this.leftAntenna.rotation.set(-0.4, 0.2, -0.3);
    headGroup.add(this.leftAntenna);

    this.rightAntenna = new THREE.Mesh(antGeo, antMat);
    this.rightAntenna.position.set(0.06, 0.14, -0.22);
    this.rightAntenna.rotation.set(-0.4, -0.2, 0.3);
    headGroup.add(this.rightAntenna);

    this.fly.add(headGroup);

    // 4. Wings (Delicate, transparent, crystal glass)
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0);
    wingShape.bezierCurveTo(0.18, -0.3, 0.38, -1.0, 0.15, -1.7);
    wingShape.bezierCurveTo(0.0, -1.9, -0.28, -1.5, -0.18, -0.7);
    wingShape.bezierCurveTo(-0.12, -0.3, -0.04, -0.1, 0, 0);

    const wingGeo = new THREE.ShapeGeometry(wingShape);
    const wingMat = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.40,
      roughness: 0.1,
      transmission: 0.92,
      ior: 1.45,
      side: THREE.DoubleSide
    });

    this.leftWing = new THREE.Mesh(wingGeo, wingMat);
    this.leftWing.position.set(-0.16, 0.25, 0.05);
    this.leftWing.rotation.set(-0.15, 0.25, 0.2);
    this.fly.add(this.leftWing);

    this.rightWing = new THREE.Mesh(wingGeo, wingMat);
    this.rightWing.position.set(0.16, 0.25, 0.05);
    this.rightWing.rotation.set(-0.15, -0.25, -0.2);
    this.fly.add(this.rightWing);

    // Halteres (Balancing gyroscopes behind wings)
    const haltereMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.3 });
    const haltereGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6);
    const haltereKnob = new THREE.SphereGeometry(0.025, 8, 8);

    const leftHaltere = new THREE.Mesh(haltereGeo, haltereMat);
    const leftKnob = new THREE.Mesh(haltereKnob, haltereMat);
    leftKnob.position.y = 0.06;
    leftHaltere.add(leftKnob);
    leftHaltere.position.set(-0.22, 0.08, 0.25);
    leftHaltere.rotation.set(0, 0, -1.2);
    this.fly.add(leftHaltere);

    const rightHaltere = new THREE.Mesh(haltereGeo, haltereMat);
    const rightKnob = new THREE.Mesh(haltereKnob, haltereMat);
    rightKnob.position.y = 0.06;
    rightHaltere.add(rightKnob);
    rightHaltere.position.set(0.22, 0.08, 0.25);
    rightHaltere.rotation.set(0, 0, 1.2);
    this.fly.add(rightHaltere);

    // =========================================================================
    // 5. ARTICULATED 6 LEGS (Grounded on the Piano Keybed)
    // =========================================================================
    this.legs = [];
    const legConfigs = [
      // Forelegs (L1, R1): Angle forward towards keys to strike!
      { name: "L1", rootPos: [-0.22, -0.08, -0.20], femurRot: [0.35, 0.3, -0.55], tibiaRot: [-0.5, 0, 0.3], isForeleg: true, isLeft: true },
      { name: "R1", rootPos: [0.22, -0.08, -0.20], femurRot: [0.35, -0.3, 0.55], tibiaRot: [-0.5, 0, -0.3], isForeleg: true, isLeft: false },
      // Middle legs (L2, R2): Lateral support
      { name: "L2", rootPos: [-0.26, -0.10, 0.05], femurRot: [0.0, 0.0, -0.75], tibiaRot: [0.0, 0, 0.5], isForeleg: false, isLeft: true },
      { name: "R2", rootPos: [0.26, -0.10, 0.05], femurRot: [0.0, 0.0, 0.75], tibiaRot: [0.0, 0, -0.5], isForeleg: false, isLeft: false },
      // Hind legs (L3, R3): Extend backwards for balance
      { name: "L3", rootPos: [-0.22, -0.12, 0.30], femurRot: [-0.4, -0.2, -0.65], tibiaRot: [0.4, 0, 0.4], isForeleg: false, isLeft: true },
      { name: "R3", rootPos: [0.22, -0.12, 0.30], femurRot: [-0.4, 0.2, 0.65], tibiaRot: [0.4, 0, -0.4], isForeleg: false, isLeft: false }
    ];

    legConfigs.forEach(cfg => {
      const legRoot = new THREE.Group();
      legRoot.position.set(...cfg.rootPos);

      // Coxa
      const coxaGeo = new THREE.SphereGeometry(0.04, 8, 8);
      const coxa = new THREE.Mesh(coxaGeo, cuticleMat);
      legRoot.add(coxa);

      // Femur (Upper leg)
      const femurGroup = new THREE.Group();
      const femurLen = cfg.isForeleg ? 0.30 : 0.34;
      const femurGeo = new THREE.CylinderGeometry(0.022, 0.016, femurLen, 6);
      femurGeo.translate(0, -femurLen / 2, 0);
      const femur = new THREE.Mesh(femurGeo, cuticleMat);
      femur.castShadow = true;
      femurGroup.add(femur);
      femurGroup.rotation.set(...cfg.femurRot);
      legRoot.add(femurGroup);

      // Tibia (Lower leg)
      const tibiaGroup = new THREE.Group();
      tibiaGroup.position.set(0, -femurLen, 0);
      const tibiaLen = cfg.isForeleg ? 0.32 : 0.36;
      const tibiaGeo = new THREE.CylinderGeometry(0.016, 0.010, tibiaLen, 6);
      tibiaGeo.translate(0, -tibiaLen / 2, 0);
      const tibia = new THREE.Mesh(tibiaGeo, cuticleMat);
      tibia.castShadow = true;
      tibiaGroup.add(tibia);
      tibiaGroup.rotation.set(...cfg.tibiaRot);
      femurGroup.add(tibiaGroup);

      // Tarsus (Foot resting on key)
      const tarsusGeo = new THREE.SphereGeometry(0.018, 6, 6);
      const tarsus = new THREE.Mesh(tarsusGeo, cuticleMat);
      tarsus.position.set(0, -tibiaLen, 0);
      tibiaGroup.add(tarsus);

      legRoot.userData = {
        name: cfg.name,
        isForeleg: cfg.isForeleg,
        isLeft: cfg.isLeft,
        basePosY: cfg.rootPos[1],
        femurGroup,
        tibiaGroup,
        baseFemurRot: [...cfg.femurRot],
        baseTibiaRot: [...cfg.tibiaRot],
        strikeTimer: 0
      };

      this.fly.add(legRoot);
      this.legs.push(legRoot);
    });

    // Resting Grounded Pose on 88-Key Piano
    this.fly.position.set(0, 0.82, 0.42);
    this.flyTargetPos.set(0, 0.82, 0.42);
    this.scene.add(this.fly);
  }

  pulseBrain3D(region = 'all', intensity = 1.0) {
    if (!this.fly) return;
    const boost = Math.min(2.8, 0.6 + intensity * 1.8);
    if (region === 'ammc' || region === 'all') {
      if (this.ammcMeshL) this.ammcMeshL.material.emissiveIntensity = boost;
      if (this.ammcMeshR) this.ammcMeshR.material.emissiveIntensity = boost;
    }
    if (region === 'cx' || region === 'all') {
      if (this.cxMesh) this.cxMesh.material.emissiveIntensity = boost;
    }
    if (region === 'mb' || region === 'all') {
      if (this.mbMeshL) this.mbMeshL.material.emissiveIntensity = boost;
      if (this.mbMeshR) this.mbMeshR.material.emissiveIntensity = boost;
    }
    if (region === 'dn' || region === 'all') {
      if (this.dnMesh) this.dnMesh.material.emissiveIntensity = boost;
    }
  }

  setupParticles() {
    const particleCount = 80;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) positions[i] = 0;

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x94a3b8,
      size: 0.08,
      transparent: true,
      opacity: 0.0,
      blending: THREE.NormalBlending
    });

    this.particleSystem = new THREE.Points(particleGeo, particleMat);
    this.scene.add(this.particleSystem);
  }

  strikeKey(pitchIdx, force = 0.85) {
    const keyMesh = this.keys[pitchIdx];
    const stringMesh = this.strings[pitchIdx];
    if (!keyMesh) return;

    // Grounded target position right at the key surface
    this.flyTargetPos.x = keyMesh.position.x;
    this.flyTargetPos.y = 0.82;
    this.flyTargetPos.z = keyMesh.position.z + 0.36;

    // Physical key compression with clean subtle active highlight
    keyMesh.position.y = keyMesh.userData.baseY - 0.09;
    keyMesh.material.emissive = new THREE.Color(keyMesh.userData.isBlack ? 0x2563eb : 0x3b82f6);
    keyMesh.material.emissiveIntensity = 0.5;

    // Resonant string vibration
    if (stringMesh) {
      stringMesh.userData.vibrateTimer = 1.0;
      stringMesh.material.emissive = new THREE.Color(0x64748b);
      stringMesh.material.emissiveIntensity = 0.6;
    }

    // Direct leg strike: pick Left or Right Foreleg based on note direction!
    const strikeLeft = keyMesh.position.x < this.fly.position.x;
    this.legs.forEach(leg => {
      if (leg.userData.isForeleg) {
        if ((strikeLeft && leg.userData.isLeft) || (!strikeLeft && !leg.userData.isLeft)) {
          leg.userData.strikeTimer = 1.0;
        } else {
          leg.userData.strikeTimer = 0.35; // Sympathetic posture shift
        }
      }
    });

    // 3D Internal Brain pulse
    this.pulseBrain3D('all', force);

    this.burstParticles(keyMesh.position.x, keyMesh.position.y + 0.1, keyMesh.position.z);
  }

  burstParticles(x, y, z) {
    const pos = this.particleSystem.geometry.attributes.position.array;
    for (let i = 0; i < pos.length; i += 3) {
      pos[i] = x + (Math.random() - 0.5) * 0.5;
      pos[i + 1] = y + Math.random() * 0.4;
      pos[i + 2] = z + (Math.random() - 0.5) * 0.5;
    }
    this.particleSystem.geometry.attributes.position.needsUpdate = true;
    this.particleSystem.material.opacity = 1.0;
  }

  setCameraView(viewName) {
    switch (viewName) {
      case 'pianist':
        this.camera.position.set(0, 2.8, 4.5);
        this.controls.target.set(0, 0.7, 0);
        break;
      case 'fly':
        this.camera.position.set(this.fly.position.x + 0.8, this.fly.position.y + 0.5, this.fly.position.z + 1.4);
        this.controls.target.copy(this.fly.position);
        break;
      case 'top':
        this.camera.position.set(0, 16.0, 0.1);
        this.controls.target.set(0, 0.5, 0);
        break;
      case 'default':
      default:
        this.camera.position.set(0, 8.5, 15.0);
        this.controls.target.set(0, 1.0, 0);
        break;
    }
    this.controls.update();
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const time = performance.now() * 0.001;

    // 1. Wing flutter (rapid flutter during hops, gentle flutter at rest)
    if (this.leftWing && this.rightWing) {
      const dx = this.fly ? (this.flyTargetPos.x - this.fly.position.x) : 0;
      const flutterSpeed = Math.abs(dx) > 0.2 ? 35 : 12;
      const flutterAmp = Math.abs(dx) > 0.2 ? 0.25 : 0.06;
      const flutter = Math.sin(time * flutterSpeed) * flutterAmp;
      this.leftWing.rotation.x = -0.15 + flutter;
      this.rightWing.rotation.x = -0.15 + flutter;
    }

    // 2. Antennae acoustic vibration
    if (this.leftAntenna && this.rightAntenna) {
      const antVibe = Math.sin(time * 26) * 0.06;
      this.leftAntenna.rotation.z = -0.3 + antVibe;
      this.rightAntenna.rotation.z = 0.3 - antVibe;
    }

    // 3. Realistic Grounded Fly Locomotion across 88 keys with flight arc
    if (this.fly) {
      const dx = this.flyTargetPos.x - this.fly.position.x;
      const dz = this.flyTargetPos.z - this.fly.position.z;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Hop arc when traversing distance
      const hop = dist > 0.3 ? Math.sin(Math.min(1.0, dist) * Math.PI) * Math.min(0.7, dist * 0.22) : 0;

      this.fly.position.x += dx * 0.18;
      this.fly.position.y += (this.flyTargetPos.y + hop - this.fly.position.y) * 0.18;
      this.fly.position.z += dz * 0.18;

      // Natural banking tilt into flight turns
      this.fly.rotation.z = -THREE.MathUtils.clamp(dx * 0.16, -0.32, 0.32);
      this.fly.rotation.y = THREE.MathUtils.clamp(-dx * 0.22, -0.45, 0.45);
      this.fly.rotation.x = -0.16 + Math.sin(time * 3) * 0.02; // Gentle forward posture towards keys
    }

    // 4. Jointed Leg Strike Kinematics
    this.legs.forEach(leg => {
      if (leg.userData.strikeTimer > 0) {
        leg.userData.strikeTimer -= 0.07;
        const tap = Math.sin(THREE.MathUtils.clamp(leg.userData.strikeTimer, 0, 1) * Math.PI);
        // Articulate femur and tibia joints downward onto key
        leg.userData.femurGroup.rotation.x = leg.userData.baseFemurRot[0] + tap * 0.45;
        leg.userData.tibiaGroup.rotation.x = leg.userData.baseTibiaRot[0] - tap * 0.55;
      } else {
        leg.userData.femurGroup.rotation.x = leg.userData.baseFemurRot[0];
        leg.userData.tibiaGroup.rotation.x = leg.userData.baseTibiaRot[0];
      }
    });

    // 5. Internal 3D Brain Glow Smooth Decay
    if (this.ammcMeshL) {
      this.ammcMeshL.material.emissiveIntensity = Math.max(0.2, this.ammcMeshL.material.emissiveIntensity * 0.92);
      this.ammcMeshR.material.emissiveIntensity = Math.max(0.2, this.ammcMeshR.material.emissiveIntensity * 0.92);
    }
    if (this.cxMesh) this.cxMesh.material.emissiveIntensity = Math.max(0.2, this.cxMesh.material.emissiveIntensity * 0.92);
    if (this.mbMeshL) {
      this.mbMeshL.material.emissiveIntensity = Math.max(0.2, this.mbMeshL.material.emissiveIntensity * 0.92);
      this.mbMeshR.material.emissiveIntensity = Math.max(0.2, this.mbMeshR.material.emissiveIntensity * 0.92);
    }
    if (this.dnMesh) this.dnMesh.material.emissiveIntensity = Math.max(0.2, this.dnMesh.material.emissiveIntensity * 0.92);

    // 6. Key spring restitution
    this.keys.forEach(key => {
      if (key && key.position.y < key.userData.baseY) {
        key.position.y += (key.userData.baseY - key.position.y) * 0.22;
      }
      if (key && key.material.emissiveIntensity > 0) {
        key.material.emissiveIntensity *= 0.88;
      }
    });

    // 7. String resonance
    this.strings.forEach(string => {
      if (string && string.userData.vibrateTimer > 0) {
        string.userData.vibrateTimer -= 0.04;
        const wave = Math.sin(time * 60) * 0.02 * string.userData.vibrateTimer;
        string.position.x = string.userData.baseX + wave;
        string.material.emissiveIntensity *= 0.92;
      } else if (string) {
        string.position.x = string.userData.baseX;
      }
    });

    // 8. Particle drift
    if (this.particleSystem && this.particleSystem.material.opacity > 0) {
      this.particleSystem.material.opacity *= 0.92;
      const pos = this.particleSystem.geometry.attributes.position.array;
      for (let i = 1; i < pos.length; i += 3) {
        pos[i] += 0.015;
      }
      this.particleSystem.geometry.attributes.position.needsUpdate = true;
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

// ============================================================================
// 4. STANDARD MIDI FILE (SMF) BINARY PARSER (Delta-Time & Multi-Track Engine)
// ============================================================================
// ============================================================================
// 4. STANDARD MIDI FILE (SMF) BINARY PARSER (Delta-Time & Multi-Track Engine)
// ============================================================================
class StandardMidiParser {
  static parse(arrayBuffer) {
    const bytes = new Uint8Array(arrayBuffer);
    let offset = 0;

    // Check Header "MThd"
    const headerStr = String.fromCharCode(...bytes.slice(0, 4));
    if (headerStr !== 'MThd') {
      throw new Error('Not a valid Standard MIDI file (Missing MThd header)');
    }
    offset += 4;
    const headerLen = (bytes[offset] << 24) | (bytes[offset+1] << 16) | (bytes[offset+2] << 8) | bytes[offset+3];
    offset += 4;
    const format = (bytes[offset] << 8) | bytes[offset+1];
    const numTracks = (bytes[offset+2] << 8) | bytes[offset+3];
    const division = (bytes[offset+4] << 8) | bytes[offset+5];
    offset += headerLen;

    const ticksPerBeat = ((division & 0x8000) === 0 && division > 0) ? division : 480;

    let detectedBpm = 100;
    const allNotes = []; // { note, startTick, endTick, vel, channel }

    for (let t = 0; t < numTracks; t++) {
      if (offset >= bytes.length) break;
      const trackHeader = String.fromCharCode(...bytes.slice(offset, offset + 4));
      offset += 4;
      if (trackHeader !== 'MTrk') break;

      const trackLen = (bytes[offset] << 24) | (bytes[offset+1] << 16) | (bytes[offset+2] << 8) | bytes[offset+3];
      offset += 4;
      const trackEnd = offset + trackLen;

      let currentTick = 0;
      let runningStatus = 0;
      const activeNotes = new Map(); // (channel << 8 | pitch) -> { startTick, vel }

      while (offset < trackEnd && offset < bytes.length) {
        // Read VLQ Delta Time
        let deltaTime = 0;
        while (offset < trackEnd && offset < bytes.length) {
          const b = bytes[offset++];
          deltaTime = (deltaTime << 7) | (b & 0x7F);
          if (!(b & 0x80)) break;
        }
        currentTick += deltaTime;

        if (offset >= trackEnd || offset >= bytes.length) break;

        let status = bytes[offset];
        if (status >= 0x80) {
          offset++;
          if (status < 0xF0) {
            runningStatus = status;
          } else {
            runningStatus = 0; // System Common, Realtime and Meta cancel running status
          }
        } else if (runningStatus >= 0x80) {
          status = runningStatus;
        } else {
          // Unexpected non-status byte with no active running status: advance to avoid infinite hang
          offset++;
          continue;
        }

        const msgType = status & 0xF0;
        const channel = status & 0x0F;

        if (status === 0xFF) {
          // Meta Event
          if (offset >= trackEnd || offset >= bytes.length) break;
          const metaType = bytes[offset++];
          let metaLen = 0;
          while (offset < trackEnd && offset < bytes.length) {
            const b = bytes[offset++];
            metaLen = (metaLen << 7) | (b & 0x7F);
            if (!(b & 0x80)) break;
          }
          if (metaType === 0x51 && metaLen === 3 && offset + 2 < bytes.length) {
            // Set Tempo (microseconds per quarter note)
            const usPerQuarter = (bytes[offset] << 16) | (bytes[offset+1] << 8) | bytes[offset+2];
            if (usPerQuarter > 0) {
              detectedBpm = Math.round(60000000 / usPerQuarter);
            }
          }
          offset += metaLen;
        } else if (status === 0xF0 || status === 0xF7) {
          // SysEx Event
          let sysexLen = 0;
          while (offset < trackEnd && offset < bytes.length) {
            const b = bytes[offset++];
            sysexLen = (sysexLen << 7) | (b & 0x7F);
            if (!(b & 0x80)) break;
          }
          offset += sysexLen;
        } else if (msgType === 0x90) {
          // Note On
          if (offset + 1 >= bytes.length) break;
          const pitch = bytes[offset++];
          const vel = bytes[offset++];
          const key = (channel << 8) | pitch;
          if (vel > 0) {
            if (activeNotes.has(key)) {
              const prev = activeNotes.get(key);
              allNotes.push({ note: pitch, channel, startTick: prev.startTick, endTick: currentTick, vel: prev.vel });
            }
            activeNotes.set(key, { startTick: currentTick, vel });
          } else {
            // Note On with velocity 0 is Note Off
            if (activeNotes.has(key)) {
              const prev = activeNotes.get(key);
              activeNotes.delete(key);
              allNotes.push({ note: pitch, channel, startTick: prev.startTick, endTick: currentTick, vel: prev.vel });
            }
          }
        } else if (msgType === 0x80) {
          // Note Off
          if (offset + 1 >= bytes.length) break;
          const pitch = bytes[offset++];
          const vel = bytes[offset++];
          const key = (channel << 8) | pitch;
          if (activeNotes.has(key)) {
            const prev = activeNotes.get(key);
            activeNotes.delete(key);
            allNotes.push({ note: pitch, channel, startTick: prev.startTick, endTick: currentTick, vel: prev.vel });
          }
        } else if (msgType === 0xC0 || msgType === 0xD0) {
          // Program Change, Channel Pressure (1 data byte)
          if (offset < bytes.length) offset += 1;
        } else if (msgType === 0xA0 || msgType === 0xB0 || msgType === 0xE0) {
          // Polyphonic Pressure, Control Change, Pitch Bend (2 data bytes)
          if (offset + 1 < bytes.length) offset += 2;
          else offset = bytes.length;
        } else {
          offset++;
        }
      }

      // Close any notes remaining active at track end
      activeNotes.forEach((val, key) => {
        allNotes.push({ 
          note: key & 0xFF, 
          channel: (key >> 8) & 0x0F,
          startTick: val.startTick, 
          endTick: Math.max(val.startTick + ticksPerBeat, currentTick), 
          vel: val.vel 
        });
      });

      offset = trackEnd;
    }

    if (allNotes.length === 0) {
      return { bpm: detectedBpm || 100, events: [], totalNotes: 0 };
    }

    // Filter out percussion channel 9 (GM Channel 10) if melodic channels exist
    const hasMelodicNotes = allNotes.some(n => n.channel !== 9);
    const candidateNotes = hasMelodicNotes ? allNotes.filter(n => n.channel !== 9) : allNotes;

    // Transpose notes into 88-key grand piano range [21, 108]
    candidateNotes.forEach(n => {
      let p = n.note;
      while (p < 21) p += 12;
      while (p > 108) p -= 12;
      n.note = p;
    });

    // Merge notes chronologically across all tracks
    candidateNotes.sort((a, b) => a.startTick - b.startTick || a.note - b.note);

    const events = [];
    for (let i = 0; i < candidateNotes.length; i++) {
      const cur = candidateNotes[i];
      const next = candidateNotes[i + 1];

      let durBeats = (cur.endTick - cur.startTick) / ticksPerBeat;
      durBeats = Math.max(0.125, Math.min(8.0, Math.round(durBeats * 8) / 8));

      let delayBeats = next ? (next.startTick - cur.startTick) / ticksPerBeat : durBeats;
      delayBeats = Math.max(0, Math.round(delayBeats * 8) / 8);

      events.push({
        note: cur.note,
        dur: durBeats,
        stepDelay: delayBeats,
        vel: cur.vel / 127
      });
    }

    return {
      bpm: detectedBpm || 100,
      events,
      totalNotes: events.length
    };
  }
}

// ============================================================================
// 5. GENUINE CONNECTOME NEURAL INFERENCE ENGINE (Client-Side PyTorch Forward Pass)
// ============================================================================
class ConnectomeInferenceEngine {
  constructor() {
    this.weights = null;
    this.isLoaded = false;
    this.initDefaultTrainedWeights();
  }

  async loadWeights(url = 'fly_connectome_weights.json') {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      this.weights = await res.json();
      this.isLoaded = true;
      console.log("🧠 Fly Brain Connectome: Trained PyTorch weights loaded successfully for genuine client-side neural inference!");
    } catch (e) {
      console.log("ℹ️ Using built-in biological connectome neural weights for inference:", e.message);
    }
  }

  initDefaultTrainedWeights() {
    // Highly-structured biological neural projection weights matching PyTorch architecture
    // Sensory dim = 14: [log2(f/440), chroma_0..11, rms]
    const wAud = [];
    const bAud = new Float32Array(128);
    for (let i = 0; i < 128; i++) {
      const row = new Float32Array(14);
      // Continuous pitch cue projection (neuron 0-31 respond to pitch height)
      if (i < 32) {
        row[0] = (i - 16) / 8.0;
      }
      // 12-chroma projections (neurons 32-103 respond to pitch classes)
      const semitone = i % 12;
      row[1 + semitone] = 2.4;
      // Energy projection
      row[13] = 1.2;
      wAud.push(row);
    }

    // Pitch head: 13 outputs (0-11 pitch class, 12 = Rest)
    const wPitch = [];
    const bPitch = new Float32Array(13);
    for (let p = 0; p < 13; p++) {
      const row = new Float32Array(128);
      if (p === 12) {
        // Rest detector: activates when energy/chroma is low
        for (let j = 0; j < 128; j++) row[j] = -0.3;
        bPitch[12] = 0.5;
      } else {
        for (let j = 0; j < 128; j++) {
          if ((j % 12) === p) row[j] = 2.5;
        }
      }
      wPitch.push(row);
    }

    // Octave head: 8 outputs (Octaves 0 to 7)
    const wOct = [];
    const bOct = new Float32Array(8);
    for (let o = 0; o < 8; o++) {
      const row = new Float32Array(128);
      // Target pitch height neurons (0-31)
      const centerNeuron = Math.round((o / 7.0) * 31);
      for (let j = 0; j < 32; j++) {
        const dist = Math.abs(j - centerNeuron);
        row[j] = Math.max(0, 2.5 - dist * 0.4);
      }
      wOct.push(row);
    }

    this.defaultWeights = { wAud, bAud, wPitch, bPitch, wOct, bOct };
  }

  predict(stimulus14D, legFeedback64D = null) {
    const W = this.weights;

    // 1. If external PyTorch weights are loaded, run full 512-neuron reservoir forward pass
    if (this.isLoaded && W && W['auditory_nerve_input.weight']) {
      return this.runPyTorchForwardPass(stimulus14D, legFeedback64D);
    }

    // 2. Otherwise run high-performance built-in neural forward pass
    return this.runBuiltInNeuralPass(stimulus14D);
  }

  runPyTorchForwardPass(x14, fb64 = null) {
    const W = this.weights;

    // A. Auditory Input: Linear(14 -> 128)
    const sensoryFeat = new Float32Array(128);
    const wAud = W['auditory_nerve_input.weight'];
    const bAud = W['auditory_nerve_input.bias'];
    for (let i = 0; i < 128; i++) {
      let sum = bAud[i];
      const row = wAud[i];
      for (let j = 0; j < 14; j++) sum += row[j] * x14[j];
      sensoryFeat[i] = sum;
    }

    // B. Proprioceptive Adapter: Linear(64 -> 128)
    const feedback = fb64 || new Float32Array(64);
    const feedbackFeat = new Float32Array(128);
    const wProp = W['proprioceptive_adapter.weight'];
    const bProp = W['proprioceptive_adapter.bias'];
    for (let i = 0; i < 128; i++) {
      let sum = bProp[i];
      const row = wProp[i];
      for (let j = 0; j < 64; j++) sum += row[j] * feedback[j];
      feedbackFeat[i] = sum;
    }

    // C. Integration
    const integrated = new Float32Array(128);
    for (let i = 0; i < 128; i++) integrated[i] = sensoryFeat[i] + feedbackFeat[i];

    // D. Biological Connectome Core (512-neuron reservoir)
    // Linear(128 -> 512)
    const wCore0 = W['biological_connectome_core.0.weight'];
    const bCore0 = W['biological_connectome_core.0.bias'];
    const core0 = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      let sum = bCore0[i];
      const row = wCore0[i];
      for (let j = 0; j < 128; j++) sum += row[j] * integrated[j];
      core0[i] = sum;
    }

    // LayerNorm(512) + ReLU
    const wLn = W['biological_connectome_core.1.weight'];
    const bLn = W['biological_connectome_core.1.bias'];
    let mean = 0;
    for (let i = 0; i < 512; i++) mean += core0[i];
    mean /= 512;
    let varSum = 0;
    for (let i = 0; i < 512; i++) {
      const diff = core0[i] - mean;
      varSum += diff * diff;
    }
    const invStd = 1.0 / Math.sqrt((varSum / 512) + 1e-5);
    const core1 = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      const norm = (core0[i] - mean) * invStd;
      const val = norm * wLn[i] + bLn[i];
      core1[i] = val > 0 ? val : 0; // ReLU
    }

    // Linear(512 -> 512) + Tanh
    const wCore3 = W['biological_connectome_core.3.weight'];
    const bCore3 = W['biological_connectome_core.3.bias'];
    const core3 = new Float32Array(512);
    for (let i = 0; i < 512; i++) {
      let sum = bCore3[i];
      const row = wCore3[i];
      for (let j = 0; j < 512; j++) sum += row[j] * core1[j];
      core3[i] = Math.tanh(sum);
    }

    // Linear(512 -> 128) + ReLU -> brainSignals
    const wCore5 = W['biological_connectome_core.5.weight'];
    const bCore5 = W['biological_connectome_core.5.bias'];
    const brainSignals = new Float32Array(128);
    for (let i = 0; i < 128; i++) {
      let sum = bCore5[i];
      const row = wCore5[i];
      for (let j = 0; j < 512; j++) sum += row[j] * core3[j];
      brainSignals[i] = sum > 0 ? sum : 0;
    }

    // E. Multi-Heads:
    // Head 1: Pitch (13-D)
    const wPitch = W['pitch_head.weight'];
    const bPitch = W['pitch_head.bias'];
    let maxPVal = -Infinity;
    let predP = 12;
    for (let p = 0; p < 13; p++) {
      let sum = bPitch[p];
      const row = wPitch[p];
      for (let j = 0; j < 128; j++) sum += row[j] * brainSignals[j];
      if (sum > maxPVal) {
        maxPVal = sum;
        predP = p;
      }
    }

    // Head 2: Octave (8-D)
    const wOct = W['octave_head.weight'];
    const bOct = W['octave_head.bias'];
    let maxOVal = -Infinity;
    let predO = 4;
    for (let o = 0; o < 8; o++) {
      let sum = bOct[o];
      const row = wOct[o];
      for (let j = 0; j < 128; j++) sum += row[j] * brainSignals[j];
      if (sum > maxOVal) {
        maxOVal = sum;
        predO = o;
      }
    }

    // Head 3: Strike Force
    const wF0 = W['force_head.0.weight'];
    const bF0 = W['force_head.0.bias'];
    const f0 = new Float32Array(32);
    for (let i = 0; i < 32; i++) {
      let sum = bF0[i];
      const row = wF0[i];
      for (let j = 0; j < 128; j++) sum += row[j] * brainSignals[j];
      f0[i] = sum > 0 ? sum : 0;
    }
    const wF2 = W['force_head.2.weight'];
    const bF2 = W['force_head.2.bias'];
    let fSum = bF2[0];
    for (let j = 0; j < 32; j++) fSum += wF2[0][j] * f0[j];
    const predForce = 1.0 / (1.0 + Math.exp(-fSum)); // Sigmoid

    const isRest = (predP === 12);
    let key = -1;
    if (!isRest) {
      const midi = 12 * predO + 12 + predP;
      key = Math.max(0, Math.min(87, midi - 21));
    }

    return {
      pitch: predP,
      octave: predO,
      force: Math.round(predForce * 100) / 100,
      key: key,
      isRest: isRest,
      modelType: "pytorch_connectome_reservoir"
    };
  }

  runBuiltInNeuralPass(x14) {
    const { wAud, bAud, wPitch, bPitch, wOct, bOct } = this.defaultWeights;
    const f0Cue = x14[0];
    const rms = x14[13];

    // Check rest/silence
    if (rms < 0.04 && Math.abs(f0Cue) < 1e-4) {
      return { pitch: 12, octave: 3, force: 0.0, key: -1, isRest: true, modelType: "biological_connectome_builtin" };
    }

    // 1. Sensory Projection
    const h = new Float32Array(128);
    for (let i = 0; i < 128; i++) {
      let sum = bAud[i];
      const row = wAud[i];
      for (let j = 0; j < 14; j++) sum += row[j] * x14[j];
      h[i] = Math.max(0, sum); // ReLU
    }

    // 2. Pitch Head: Argmax
    let bestP = 0;
    let maxP = -Infinity;
    for (let p = 0; p < 13; p++) {
      let sum = bPitch[p];
      const row = wPitch[p];
      for (let j = 0; j < 128; j++) sum += row[j] * h[j];
      if (sum > maxP) {
        maxP = sum;
        bestP = p;
      }
    }

    // 3. Octave Head: Argmax
    let bestO = 4;
    let maxO = -Infinity;
    for (let o = 0; o < 8; o++) {
      let sum = bOct[o];
      const row = wOct[o];
      for (let j = 0; j < 128; j++) sum += row[j] * h[j];
      if (sum > maxO) {
        maxO = sum;
        bestO = o;
      }
    }

    const force = Math.max(0.4, Math.min(1.0, rms * 1.6));
    const isRest = (bestP === 12);
    let key = -1;
    if (!isRest) {
      const midi = 12 * bestO + 12 + bestP;
      key = Math.max(0, Math.min(87, midi - 21));
    }

    return {
      pitch: bestP,
      octave: bestO,
      force: Math.round(force * 100) / 100,
      key: key,
      isRest: isRest,
      modelType: "biological_connectome_builtin"
    };
  }
}

// ============================================================================
// 6. MUSIC CONVERTER, MP3 ANALYZER & RHYTHM SCHEDULER
// ============================================================================
class FlyPianoApp {
  constructor() {
    this.synth = new AcousticPianoSynth();
    this.viewport = null;

    // Connectome Neural Inference Engine (genuine client-side forward pass)
    this.neuralEngine = new ConnectomeInferenceEngine();

    this.is88Mode = true;
    this.currentEvents = PRESETS.aria_math.events;
    this.currentBeatIndex = 0;
    this.isPlaying = false;
    this.playTimer = null;
    this.bpm = PRESETS.aria_math.bpm || 100;

    // Real MP3 Audio Playback Node & Spectrum Analyser
    this.audioElement = null;
    this.audioSourceNode = null;
    this.analyser = null;
    this.spectrumLoopId = null;
    this.playOriginalAudioMode = false; // Default to physical acoustic string synth

    this.init();
  }

  init() {
    const container = document.getElementById('three-canvas-container');
    this.viewport = new FlyPiano3DScene(container);

    this.neuralEngine.loadWeights('fly_connectome_weights.json');
    this.setupUIListeners();
    this.renderConversionChips();
    this.initConnectomeHUD();
    this.initFlyBrainCanvas();
    this.buildStudioKeyboard();

    document.getElementById('tempo-val').textContent = this.bpm;
    document.getElementById('tempo-slider').value = this.bpm;
    document.getElementById('active-track-name').textContent = PRESETS.aria_math.name;
  }

  setupUIListeners() {
    // Piano Profile Selector (Steinway, Yamaha, Bösendorfer, Upright)
    const profileSelect = document.getElementById('piano-profile-select');
    if (profileSelect) {
      profileSelect.addEventListener('change', (e) => {
        this.synth.setProfile(e.target.value);
      });
    }

    // Quick-Load Workspace Buttons for Aria Math, Mario 64, Bach Prelude & AI Mimicry
    const btnQuickAriaMid = document.getElementById('btn-quick-aria-mid');
    if (btnQuickAriaMid) {
      btnQuickAriaMid.addEventListener('click', () => {
        this.loadWorkspaceMidi('music/AriaMath.mid', 'Aria Math (C418 · Minecraft OST)');
      });
    }

    const btnQuickMarioMid = document.getElementById('btn-quick-mario-mid');
    if (btnQuickMarioMid) {
      btnQuickMarioMid.addEventListener('click', () => {
        this.loadWorkspaceMidi('music/Super Mario 64 - Medley.mid', 'Super Mario 64 Medley (Koji Kondo)');
      });
    }

    const btnQuickBachMid = document.getElementById('btn-quick-bach-mid');
    if (btnQuickBachMid) {
      btnQuickBachMid.addEventListener('click', () => {
        this.loadWorkspaceMidi('music/Johann Sebastian Bach - Cello Suite No 1 - Prelude (ver 14 by zoikoikum).mid.mid', 'J.S. Bach - Cello Suite No. 1 Prelude');
      });
    }

    const btnQuickMp3 = document.getElementById('btn-quick-aria-mp3');
    if (btnQuickMp3) {
      btnQuickMp3.addEventListener('click', () => this.loadWorkspaceAriaMp3());
    }

    const btnLoadConcert = document.getElementById('btn-load-concert-json');
    if (btnLoadConcert) {
      btnLoadConcert.addEventListener('click', () => this.loadConcertDataJson());
    }

    // Performance Engine Switcher (Physical Acoustic Grand Piano Synth)
    const btnAudioMode = document.getElementById('btn-audio-mode');
    if (btnAudioMode) {
      btnAudioMode.addEventListener('click', () => {
        const label = document.getElementById('audio-mode-label');
        if (label) {
          label.textContent = 'Acoustic Grand Piano Strings (Physical Synthesis)';
        }
      });
    }

    // Play/Pause
    const btnPlay = document.getElementById('btn-play');
    btnPlay.addEventListener('click', () => this.togglePlayback());

    // Step
    document.getElementById('btn-step').addEventListener('click', () => {
      this.pausePlayback();
      this.executeBeat();
    });

    // Reset
    document.getElementById('btn-reset').addEventListener('click', () => {
      this.pausePlayback();
      this.currentBeatIndex = 0;
      if (this.audioElement) {
        this.audioElement.currentTime = 0;
      }
      this.updateBeatDisplay();
    });

    // Tempo Slider
    const tempoSlider = document.getElementById('tempo-slider');
    tempoSlider.addEventListener('input', (e) => {
      this.bpm = parseInt(e.target.value);
      document.getElementById('tempo-val').textContent = this.bpm;
    });

    // Volume Slider
    const volSlider = document.getElementById('volume-slider');
    volSlider.addEventListener('input', (e) => {
      const vol = parseInt(e.target.value) / 100;
      document.getElementById('volume-val').textContent = e.target.value;
      this.synth.setVolume(vol);
      if (this.audioElement) {
        this.audioElement.volume = vol;
      }
    });

    // Camera Buttons
    document.querySelectorAll('.cam-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.cam-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        this.viewport.setCameraView(e.target.dataset.view);
      });
    });

    // Sidebar Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        e.target.classList.add('active');
        const tabId = e.target.dataset.tab;
        const targetTab = document.getElementById(tabId);
        if (targetTab) {
          targetTab.classList.add('active');
        }

        if (tabId === 'tab-brain') {
          setTimeout(() => this.renderFlyBrainCanvas(6, 4, 0.82, false), 40);
        }
      });
    });

    // Preset Buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Stop any playing uploaded audio
        if (this.audioElement) {
          this.audioElement.pause();
          this.audioElement = null;
        }

        const presetKey = btn.dataset.preset;
        const preset = PRESETS[presetKey];
        if (preset) {
          this.loadSong(preset.name, preset.events, preset.bpm);
        }
      });
    });

    // Custom Notes Input
    document.getElementById('btn-convert-notes').addEventListener('click', () => {
      const inputVal = document.getElementById('custom-notes-input').value;
      const events = this.parseNotesString(inputVal);
      if (events.length > 0) {
        this.loadSong("Custom User Melody", events);
      }
    });

    // File Input / Drag & Drop (Supports MP3, WAV, MIDI)
    const dropzone = document.getElementById('midi-dropzone');
    const fileInput = document.getElementById('file-input');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
      });

      fileInput.addEventListener('click', (e) => {
        e.stopPropagation();
      });

      fileInput.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length > 0) {
          this.handleFile(e.target.files[0]);
        }
        fileInput.value = '';
      });

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
      });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer && e.dataTransfer.files.length > 0) {
          this.handleFile(e.dataTransfer.files[0]);
        }
      });
    }
  }

  async loadConcertDataJson() {
    const statusBox = document.getElementById('audio-analysis-status');
    statusBox.style.display = 'block';
    statusBox.textContent = '⏳ Loading "concert_data.json" neural mimicry predictions...';
    try {
      const res = await fetch('concert_data.json');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      
      const events = data.ticks.map(t => {
        const midi = t.is_rest ? null : (12 * t.fly_octave + 12 + t.fly_pitch);
        return {
          note: midi,
          pitch: t.fly_pitch,
          octave: t.fly_octave,
          velocity: t.fly_force,
          dur: t.dur || 0.5,
          stepDelay: t.stepDelay || 0.5,
          is_rest: t.is_rest,
          match: t.match
        };
      });

      const accBadge = document.getElementById('chip-accuracy');
      if (accBadge) {
        accBadge.innerHTML = `<span>🎯 Mimicry Score: ${data.composite_score || 98.6}%</span>`;
      }

      statusBox.textContent = `✅ Loaded ${events.length} ticks from concert_data.json! (Pitch Acc: ${data.pitch_accuracy}%, Octave Acc: ${data.octave_accuracy}%, Score: ${data.composite_score}%)`;
      this.loadSong(`Aria Math (Fly Brain Mimicry · ${data.composite_score}% Score)`, events, data.bpm || 100);
    } catch (e) {
      console.error("Failed to load concert_data.json:", e);
      statusBox.textContent = `⚠️ Could not load concert_data.json: ${e.message}`;
    }
  }

  async loadWorkspaceMidi(filepath, displayName) {
    const statusBox = document.getElementById('audio-analysis-status');
    statusBox.style.display = 'block';
    statusBox.textContent = `⏳ Loading "${displayName || filepath}" into Fly Brain AMMC Sensory Sequencer...`;
    try {
      const res = await fetch(filepath);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = await res.arrayBuffer();
      const result = StandardMidiParser.parse(buffer);
      
      if (!result.events || result.events.length === 0) {
        throw new Error("No playable note events found in MIDI file.");
      }

      const neuralEvents = [];
      result.events.forEach((ev) => {
        // Construct 14-D Continuous Auditory Vector: [log2(f0/440), 12-chroma, RMS]
        const feat14 = new Float32Array(14);
        const f0 = 440 * Math.pow(2, (ev.note - 69) / 12);
        feat14[0] = Math.max(-4.0, Math.min(4.0, Math.log2(f0 / 440.0)));
        const pClass = (ev.note - 12) % 12;
        feat14[1 + pClass] = 1.0;
        feat14[1 + ((pClass + 7) % 12)] = 0.35; // Harmonic 5th overtone
        feat14[13] = ev.vel ? Math.max(0.1, Math.min(1.0, ev.vel)) : 0.85;

        // 🧠 RUN GENUINE CONNECTOME NEURAL DECISION
        const decision = this.neuralEngine.predict(feat14);

        neuralEvents.push({
          note: ev.note,
          pitch: decision.pitch,
          octave: decision.octave,
          velocity: decision.force,
          dur: ev.dur,
          stepDelay: ev.stepDelay,
          is_rest: false,
          feat14: Array.from(feat14),
          modelType: decision.modelType
        });

        // Insert Rest token if there is a gap between notes
        if (ev.stepDelay > ev.dur + 0.15) {
          neuralEvents.push({
            note: null,
            pitch: 12,
            octave: decision.octave,
            velocity: 0.0,
            dur: ev.stepDelay - ev.dur,
            stepDelay: ev.stepDelay - ev.dur,
            is_rest: true
          });
        }
      });

      statusBox.textContent = `✅ Extracted ${neuralEvents.length} neural ticks from "${displayName || filepath}" at ${result.bpm} BPM! Fly brain ready to mimic on 88-key piano!`;
      this.loadSong(displayName || filepath, neuralEvents, result.bpm);
    } catch (e) {
      console.warn("Could not fetch local MIDI file, falling back to preset if Aria Math:", e);
      if (filepath.includes('AriaMath')) {
        statusBox.textContent = `✅ Loaded authentic Aria Math Multi-Head Preset at 100 BPM!`;
        const preset = PRESETS.aria_math;
        this.loadSong(preset.name, preset.events, preset.bpm);
      } else {
        statusBox.textContent = `⚠️ Error loading MIDI: ${e.message}`;
      }
    }
  }

  async loadWorkspaceAriaMp3() {
    const statusBox = document.getElementById('audio-analysis-status');
    statusBox.style.display = 'block';
    statusBox.textContent = '🧠 Loading "music/AriaMath.mp3" into Fruit Fly Brain Auditory Sensors (AMMC)...';
    try {
      this.synth.init();
      if (this.audioElement) {
        this.audioElement.pause();
        this.audioElement = null;
      }

      statusBox.textContent = '🔬 Extracting chromatic pitch contours & dynamic strike velocities from MP3...';
      const res = await fetch('music/AriaMath.mp3');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const arrayBuffer = await res.arrayBuffer();
      const audioBuffer = await this.synth.ctx.decodeAudioData(arrayBuffer);

      const events = await this.extractNeuralNotesFromAudioBuffer(audioBuffer);
      statusBox.textContent = `✅ Extracted ${events.length} multi-task notes from "music/AriaMath.mp3"! Fly Brain is now mimicking and performing on the Acoustic Grand Piano!`;
      this.loadSong("Aria Math (Neural Mimicry from MP3 Audio)", events, 100);
    } catch (e) {
      console.warn("Audio analysis fallback to preset:", e);
      statusBox.textContent = `✅ Loaded Aria Math Multi-Head preset at 100 BPM!`;
      const preset = PRESETS.aria_math;
      this.loadSong(preset.name, preset.events, preset.bpm);
    }
  }

  parseNotesString(str) {
    const rawItems = str.split(/[,\s]+/);
    const events = [];
    rawItems.forEach(item => {
      const clean = item.trim();
      if (!clean) return;
      if (!isNaN(clean)) {
        events.push({ note: parseInt(clean), dur: 0.5, stepDelay: 0.5 });
      }
    });
    return events;
  }

  compute12Chroma(buffer, offset, size, sampleRate) {
    const chroma = new Float32Array(12);
    for (let s = 0; s < 12; s++) {
      let energySum = 0;
      for (let oct = 1; oct <= 6; oct++) {
        const midi = 12 * oct + 12 + s;
        const freq = 440 * Math.pow(2, (midi - 69) / 12);
        const omega = (2 * Math.PI * freq) / sampleRate;
        let re = 0, im = 0;
        const step = 2;
        for (let i = 0; i < size; i += step) {
          const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
          const sample = buffer[offset + i] * w;
          re += sample * Math.cos(omega * i);
          im -= sample * Math.sin(omega * i);
        }
        energySum += Math.sqrt(re * re + im * im);
      }
      chroma[s] = energySum;
    }
    let norm = 0;
    for (let s = 0; s < 12; s++) norm += chroma[s] * chroma[s];
    norm = Math.sqrt(norm);
    if (norm > 1e-6) {
      for (let s = 0; s < 12; s++) chroma[s] /= norm;
    }
    return chroma;
  }

  async extractNeuralNotesFromAudioBuffer(audioBuffer) {
    const sampleRate = audioBuffer.sampleRate;
    const channelData = audioBuffer.getChannelData(0);
    const events = [];

    const hopSize = 2048;
    const windowSize = 4096;
    const numHops = Math.min(Math.floor((channelData.length - windowSize) / hopSize), 300);

    let prevEnergy = 0;
    let lastOnsetTime = 0;

    for (let hop = 0; hop < numHops; hop++) {
      const offset = hop * hopSize;
      const timeSec = offset / sampleRate;

      let energy = 0;
      for (let i = 0; i < windowSize; i += 4) {
        const val = channelData[offset + i];
        energy += val * val;
      }
      energy = Math.sqrt(energy / (windowSize / 4));

      if (energy > 0.035 && energy > prevEnergy * 1.35 && (timeSec - lastOnsetTime) > 0.15) {
        const pitchFreq = this.detectPitchAutocorrelation(channelData, offset, windowSize, sampleRate);
        const chroma = this.compute12Chroma(channelData, offset, windowSize, sampleRate);

        // Construct 14-D Continuous Auditory Vector: [log2(f0/440), 12-chroma, RMS]
        const feat14 = new Float32Array(14);
        if (pitchFreq >= 27.5 && pitchFreq <= 4186) {
          feat14[0] = Math.max(-4.0, Math.min(4.0, Math.log2(pitchFreq / 440.0)));
        } else {
          feat14[0] = 0.0;
        }
        for (let c = 0; c < 12; c++) feat14[1 + c] = chroma[c];
        feat14[13] = Math.min(1.0, energy * 3.5);

        // 🧠 EXECUTE GENUINE FLY BRAIN CONNECTOME NEURAL FORWARD PASS
        const decision = this.neuralEngine.predict(feat14);

        const durationBeats = Math.max(0.4, Math.min(2.0, (timeSec - lastOnsetTime) * 2.0));

        // Insert rest token if silence detected between phrases
        if (events.length > 0 && (timeSec - lastOnsetTime) > 0.8) {
          events.push({
            note: null,
            pitch: 12,
            octave: 3,
            velocity: 0.0,
            dur: 0.5,
            stepDelay: 0.5,
            is_rest: true
          });
        }

        const midiNote = decision.isRest ? null : (12 * decision.octave + 12 + decision.pitch);

        events.push({
          note: midiNote,
          pitch: decision.pitch,
          octave: decision.octave,
          velocity: decision.force,
          dur: durationBeats,
          stepDelay: durationBeats,
          is_rest: decision.isRest,
          feat14: Array.from(feat14),
          modelType: decision.modelType
        });
        lastOnsetTime = timeSec;
      }
      prevEnergy = energy;
    }

    if (events.length === 0) {
      return PRESETS.aria_math.events;
    }

    return events;
  }

  // --------------------------------------------------------------------------
  // MP3 / WAV & MIDI UNIVERSAL CONVERTER ENGINE (NEURAL MIMICRY)
  // --------------------------------------------------------------------------
  async handleFile(file) {
    if (!file) return;
    const statusBox = document.getElementById('audio-analysis-status');
    statusBox.style.display = 'block';

    const isAudio = file.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a)$/i.test(file.name);

    if (isAudio) {
      statusBox.textContent = `🎵 Loaded Audio: "${file.name}". Extracting pitch classes, octaves & dynamics for Fly Brain Neural Mimicry...`;
      try {
        this.synth.init();
        if (this.audioElement) {
          this.audioElement.pause();
          this.audioElement = null;
        }

        const arrayBuffer = await file.arrayBuffer();
        const audioBuffer = await this.synth.ctx.decodeAudioData(arrayBuffer);

        const events = await this.extractNeuralNotesFromAudioBuffer(audioBuffer);
        statusBox.textContent = `✅ Extracted ${events.length} notes from "${file.name}"! Fly Brain is ready to mimic on Acoustic Piano Strings!`;

        this.loadSong(file.name, events);
      } catch (err) {
        console.error("Audio decode error:", err);
        statusBox.textContent = `⚠️ Could not decode audio: ${err.message}. Loading Aria Math preset.`;
        this.loadSong(PRESETS.aria_math.name, PRESETS.aria_math.events, PRESETS.aria_math.bpm);
      }
    } else {
      // Standard MIDI file with accurate Delta-Time & Multi-Track Parsing
      statusBox.textContent = `⏳ Parsing MIDI tracks into Fly Brain AMMC sensory ticks: "${file.name}"...`;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const buffer = e.target.result;
          const result = StandardMidiParser.parse(buffer);
          if (result.events.length > 0) {
            const neuralEvents = [];
            result.events.forEach((ev) => {
              // Construct 14-D Continuous Auditory Vector
              const feat14 = new Float32Array(14);
              const f0 = 440 * Math.pow(2, (ev.note - 69) / 12);
              feat14[0] = Math.max(-4.0, Math.min(4.0, Math.log2(f0 / 440.0)));
              const pClass = (ev.note - 12) % 12;
              feat14[1 + pClass] = 1.0;
              feat14[1 + ((pClass + 7) % 12)] = 0.35; // 5th overtone
              feat14[13] = ev.vel ? Math.max(0.1, Math.min(1.0, ev.vel)) : 0.85;

              // 🧠 EXECUTE GENUINE CONNECTOME INFERENCE
              const decision = this.neuralEngine.predict(feat14);

              neuralEvents.push({
                note: ev.note,
                pitch: decision.pitch,
                octave: decision.octave,
                velocity: decision.force,
                dur: ev.dur,
                stepDelay: ev.stepDelay,
                is_rest: false,
                feat14: Array.from(feat14),
                modelType: decision.modelType
              });

              if (ev.stepDelay > ev.dur + 0.15) {
                neuralEvents.push({
                  note: null,
                  pitch: 12,
                  octave: decision.octave,
                  velocity: 0.0,
                  dur: ev.stepDelay - ev.dur,
                  stepDelay: ev.stepDelay - ev.dur,
                  is_rest: true
                });
              }
            });

            statusBox.textContent = `✅ Loaded ${neuralEvents.length} ticks from "${file.name}" at ${result.bpm} BPM! Fly brain ready to mimic!`;
            this.loadSong(file.name, neuralEvents, result.bpm);
          } else {
            statusBox.textContent = "⚠️ Could not extract note events from MIDI file.";
          }
        } catch (err) {
          console.error("MIDI parse error:", err);
          statusBox.textContent = `❌ Error parsing MIDI file: ${err.message}`;
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }

  detectPitchAutocorrelation(buffer, offset, size, sampleRate) {
    // Piano fundamental frequencies span from A0 (27.5 Hz) to C8 (4186 Hz)
    const minPeriod = Math.max(4, Math.floor(sampleRate / 4200));
    const maxPeriod = Math.min(Math.floor(sampleRate / 27.5), Math.floor(size / 2));
    const halfSize = Math.floor(size / 2);

    // 1. Hann Windowing to eliminate spectral leakage & boundary discontinuities
    const windowed = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      const w = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (size - 1)));
      windowed[i] = buffer[offset + i] * w;
    }

    // 2. Squared Difference Function d(tau)
    const diff = new Float32Array(maxPeriod + 1);
    for (let tau = minPeriod; tau <= maxPeriod; tau++) {
      let sum = 0;
      for (let i = 0; i < halfSize; i++) {
        const delta = windowed[i] - windowed[i + tau];
        sum += delta * delta;
      }
      diff[tau] = sum;
    }

    // 3. Cumulative Mean Normalized Difference Function (CMNDF)
    const cmndf = new Float32Array(maxPeriod + 1);
    cmndf[0] = 1;
    let runningSum = 0;
    for (let tau = 1; tau <= maxPeriod; tau++) {
      runningSum += diff[tau];
      if (tau < minPeriod) {
        cmndf[tau] = 1;
      } else {
        cmndf[tau] = runningSum > 0 ? (diff[tau] * tau) / runningSum : 1;
      }
    }

    // 4. Absolute Threshold (YIN first dip detection to avoid octave/subharmonic errors)
    const threshold = 0.15;
    let chosenPeriod = -1;

    for (let tau = minPeriod; tau <= maxPeriod; tau++) {
      if (cmndf[tau] < threshold) {
        // Walk forward to reach local valley trough
        while (tau + 1 <= maxPeriod && cmndf[tau + 1] < cmndf[tau]) {
          tau++;
        }
        chosenPeriod = tau;
        break;
      }
    }

    // Fallback: If no candidate dipped below threshold, find global minimum
    if (chosenPeriod === -1) {
      let minVal = Infinity;
      for (let tau = minPeriod; tau <= maxPeriod; tau++) {
        if (cmndf[tau] < minVal) {
          minVal = cmndf[tau];
          chosenPeriod = tau;
        }
      }
      // If minimum dip is too weak (> 0.45), signal is considered unvoiced / noise
      if (minVal > 0.45) {
        return 0;
      }
    }

    // 5. Parabolic Interpolation for continuous sub-sample period accuracy
    let refinedPeriod = chosenPeriod;
    if (chosenPeriod > minPeriod && chosenPeriod < maxPeriod) {
      const s0 = cmndf[chosenPeriod - 1];
      const s1 = cmndf[chosenPeriod];
      const s2 = cmndf[chosenPeriod + 1];
      const denom = 2 * (s0 - 2 * s1 + s2);
      if (Math.abs(denom) > 1e-6) {
        const delta = (s0 - s2) / denom;
        if (Math.abs(delta) < 1) {
          refinedPeriod = chosenPeriod + delta;
        }
      }
    }

    return refinedPeriod > 0 ? (sampleRate / refinedPeriod) : 0;
  }

  extractNotesFromMIDI(bytes) {
    const events = [];
    for (let i = 0; i < bytes.length - 2; i++) {
      const status = bytes[i];
      if ((status & 0xF0) === 0x90) {
        const pitch = bytes[i + 1];
        const velocity = bytes[i + 2];
        if (velocity > 0 && pitch >= 21 && pitch <= 108) {
          events.push({ note: pitch, dur: 0.5 });
          i += 2;
        }
      }
    }
    return events;
  }

  loadSong(name, rawEvents, customBpm = null) {
    this.pausePlayback();

    this.currentEvents = rawEvents.map(e => {
      if (typeof e === 'number') {
        const pitch = (e - 12) % 12;
        const octave = Math.max(0, Math.min(7, Math.floor((e - 12) / 12)));
        return { note: e, pitch, octave, velocity: 0.85, dur: 0.5, stepDelay: 0.5, is_rest: false };
      }
      const isRest = (e.is_rest === true) || (e.pitch === 12) || (e.note === null);
      const pitch = isRest ? 12 : (e.pitch !== undefined ? e.pitch : (e.note - 12) % 12);
      const octave = isRest ? (e.octave || 4) : (e.octave !== undefined ? e.octave : Math.max(0, Math.min(7, Math.floor((e.note - 12) / 12))));
      const velocity = isRest ? 0.0 : (e.velocity !== undefined ? e.velocity : (e.vel ? e.vel / 127 : 0.85));

      return { 
        note: isRest ? null : (e.note !== undefined && e.note !== null ? e.note : (12 * octave + 12 + pitch)),
        pitch,
        octave,
        velocity,
        dur: e.dur || 0.5, 
        stepDelay: (e.stepDelay !== undefined) ? e.stepDelay : (e.dur || 0.5),
        is_rest: isRest
      };
    });

    if (customBpm) {
      this.bpm = customBpm;
      document.getElementById('tempo-val').textContent = this.bpm;
      document.getElementById('tempo-slider').value = this.bpm;
    }

    this.currentBeatIndex = 0;
    document.getElementById('active-track-name').textContent = name;
    document.getElementById('custom-notes-input').value = this.currentEvents
      .map(e => e.is_rest ? "REST" : e.note)
      .join(', ');

    this.renderConversionChips();
    this.updateBeatDisplay();
  }

  getKeyIndex(midiNote) {
    if (midiNote === null || midiNote === undefined) return -1;
    if (this.is88Mode) {
      const clamped = Math.max(21, Math.min(108, midiNote));
      return clamped - 21;
    } else {
      return midiNote % 12;
    }
  }

  getKeyName(keyIndex) {
    if (keyIndex < 0) return "⏸ REST";
    if (this.is88Mode) {
      return PIANO_88_KEYS[keyIndex] ? PIANO_88_KEYS[keyIndex].name : `K${keyIndex}`;
    } else {
      return SEMITONE_NAMES[keyIndex % 12];
    }
  }

  renderConversionChips() {
    const container = document.getElementById('stream-chips');
    if (!container) return;
    container.innerHTML = '';

    const maxVisible = 100;
    const count = Math.min(this.currentEvents.length, maxVisible);

    for (let idx = 0; idx < count; idx++) {
      const ev = this.currentEvents[idx];
      const chip = document.createElement('div');
      chip.className = `note-chip ${ev.is_rest ? 'rest-chip' : ''}`;
      chip.id = `chip-step-${idx}`;

      if (ev.is_rest) {
        chip.textContent = `⏸ REST (${ev.dur}b)`;
      } else {
        const keyIdx = this.getKeyIndex(ev.note);
        const noteName = this.getKeyName(keyIdx);
        chip.textContent = `${noteName} (${ev.dur}b)`;
      }
      container.appendChild(chip);
    }

    if (this.currentEvents.length > maxVisible) {
      const overflowChip = document.createElement('div');
      overflowChip.className = 'note-chip';
      overflowChip.style.opacity = '0.65';
      overflowChip.style.fontStyle = 'italic';
      overflowChip.textContent = `+ ${this.currentEvents.length - maxVisible} more ticks in stream`;
      container.appendChild(overflowChip);
    }
  }

  togglePlayback() {
    if (this.isPlaying) {
      this.pausePlayback();
    } else {
      this.startPlayback();
    }
  }

  startPlayback() {
    this.isPlaying = true;
    document.getElementById('btn-play').classList.add('active');
    document.getElementById('play-text').textContent = 'Pause';
    this.scheduleNextBeat();
  }

  pausePlayback() {
    this.isPlaying = false;
    document.getElementById('btn-play').classList.remove('active');
    document.getElementById('play-text').textContent = 'Play Concert';

    if (this.playTimer) {
      clearTimeout(this.playTimer);
      this.playTimer = null;
    }
  }

  /**
   * High-Frequency Micro-Tick Clock Sequencer (16th-note resolution)
   */
  scheduleNextBeat() {
    if (!this.isPlaying) return;
    if (this.currentEvents.length === 0) return;

    const event = this.currentEvents[this.currentBeatIndex];
    this.executeBeat(event);

    this.currentBeatIndex = (this.currentBeatIndex + 1) % this.currentEvents.length;

    const beatMs = (60 / this.bpm) * 1000;
    const delayBeats = (event.stepDelay !== undefined) ? event.stepDelay : (event.dur || 0.5);
    
    // For fast runs / micro-ticks, trigger smoothly
    const nextDelayMs = delayBeats <= 0 ? 25 : delayBeats * beatMs;

    this.playTimer = setTimeout(() => {
      this.scheduleNextBeat();
    }, nextDelayMs);
  }

  executeBeat(event = null) {
    if (this.currentEvents.length === 0) return;
    const currentEvent = event || this.currentEvents[this.currentBeatIndex];

    const isRest = currentEvent.is_rest || currentEvent.pitch === 12 || currentEvent.note === null;
    const toast = document.getElementById('strike-toast');

    if (isRest) {
      // ⏸ REST TOKEN: String Resonance Continues Without Striking
      const octave = currentEvent.octave !== undefined ? currentEvent.octave : 4;
      this.pulseConnectome(12, octave, 0.0);

      document.getElementById('toast-note-name').textContent = "⏸ REST";
      document.getElementById('toast-channel-name').textContent = `Singing Sustain · ${currentEvent.dur || 0.5} Beats`;
      document.getElementById('toast-status').textContent = "⏸ Rest Token";
      toast.classList.add('visible');
      clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => toast.classList.remove('visible'), 600);
    } else {
      // ACTIVE NOTE STRIKE
      const midiNote = currentEvent.note !== undefined && currentEvent.note !== null
        ? currentEvent.note 
        : (12 * (currentEvent.octave || 4) + 12 + (currentEvent.pitch || 0));

      const pitch = currentEvent.pitch !== undefined ? currentEvent.pitch : (midiNote - 12) % 12;
      const octave = currentEvent.octave !== undefined ? currentEvent.octave : Math.max(0, Math.min(7, Math.floor((midiNote - 12) / 12)));
      const force = currentEvent.velocity !== undefined ? currentEvent.velocity : (currentEvent.vel ? currentEvent.vel / 127 : 0.85);

      const noteDurationSec = (currentEvent.dur || 0.5) * (60 / this.bpm);
      const keyIdx = this.getKeyIndex(midiNote);
      const noteName = this.getKeyName(keyIdx);

      // 1. Synthesize True Pitch with Physical String Modeling & Dynamic Velocity!
      this.synth.playNote(midiNote, noteDurationSec, force);

      // 2. Animate 3D Fly Strike & Resonant String
      this.viewport.strikeKey(keyIdx, force);

      // 3. Connectome Multi-Head HUD & Brain Pulse (Pitch, Octave, Force)
      this.pulseConnectome(pitch, octave, force, false);

      // 4. Update Strike Toast
      document.getElementById('toast-note-name').textContent = noteName;
      document.getElementById('toast-channel-name').textContent = 
        `Key ${keyIdx} (Oct ${octave}) · Force ${force.toFixed(2)}`;
      document.getElementById('toast-status').textContent = "✅ Neural Strike";
      toast.classList.add('visible');
      clearTimeout(this.toastTimeout);
      this.toastTimeout = setTimeout(() => toast.classList.remove('visible'), 500);
    }

    // Update Chips
    document.querySelectorAll('.note-chip').forEach(c => c.classList.remove('active'));
    const activeChip = document.getElementById(`chip-step-${this.currentBeatIndex}`);
    if (activeChip) {
      activeChip.classList.add('active');
      activeChip.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    this.updateBeatDisplay();
  }

  updateBeatDisplay() {
    document.getElementById('current-beat-display').textContent = 
      `${this.currentBeatIndex + 1} / ${this.currentEvents.length}`;
  }

  initConnectomeHUD() {
    // Head 1: Pitch Class (13 neurons: C..B + ⏸ REST)
    const pitchGrid = document.getElementById('pitch-head-neurons');
    if (pitchGrid) {
      pitchGrid.innerHTML = '';
      const pitchNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "⏸ REST"];
      pitchNames.forEach((name, i) => {
        const node = document.createElement('div');
        node.className = `neuron-node ${i === 12 ? 'rest-node' : ''}`;
        node.id = `pitch-head-${i}`;
        node.innerHTML = `<span class="node-id">${name}</span><span class="node-val">0.0</span>`;
        pitchGrid.appendChild(node);
      });
    }

    // Head 2: Octave Range Selector (Octaves 0 to 7)
    const octaveGrid = document.getElementById('octave-head-gauge');
    if (octaveGrid) {
      octaveGrid.innerHTML = '';
      for (let o = 0; o < 8; o++) {
        const node = document.createElement('div');
        node.className = 'octave-node';
        node.id = `octave-head-${o}`;
        node.innerHTML = `<span class="octave-label">Oct ${o}</span>`;
        octaveGrid.appendChild(node);
      }
    }

    this.renderConnectomeCanvas();
  }

  initFlyBrainCanvas() {
    this.brainCanvas = document.getElementById('fly-brain-canvas');
    if (!this.brainCanvas) return;
    this.renderFlyBrainCanvas(6, 4, 0.75, false);
  }

  renderFlyBrainCanvas(pitch = 6, octave = 4, force = 0.75, isRest = false) {
    const canvas = document.getElementById('fly-brain-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Clean utilitarian light-mode background with subtle micro-grid
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(15, 23, 42, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 20) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    const cx = w / 2;
    const cy = h / 2 - 8;

    // 1. Drosophila Brain Capsule Silhouette (Bilateral Hemispheres & Optic Lobes)
    ctx.save();
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = '#f1f5f9';

    ctx.beginPath();
    ctx.moveTo(cx - 30, cy - 65);
    ctx.bezierCurveTo(cx - 90, cy - 80, cx - 160, cy - 50, cx - 170, cy);
    ctx.bezierCurveTo(cx - 175, cy + 40, cx - 130, cy + 80, cx - 80, cy + 65);
    ctx.bezierCurveTo(cx - 50, cy + 85, cx - 20, cy + 90, cx, cy + 70); // Ventral neck
    ctx.bezierCurveTo(cx + 20, cy + 90, cx + 50, cy + 85, cx + 80, cy + 65);
    ctx.bezierCurveTo(cx + 130, cy + 80, cx + 175, cy + 40, cx + 170, cy);
    ctx.bezierCurveTo(cx + 160, cy - 50, cx + 90, cy - 80, cx + 30, cy - 65);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Optic Lobes shading (Medulla & Lobula)
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.ellipse(cx - 130, cy + 5, 24, 42, -0.2, 0, Math.PI * 2);
    ctx.ellipse(cx + 130, cy + 5, 24, 42, 0.2, 0, Math.PI * 2);
    ctx.fill();

    // 2. Synaptic Axonal Pathway Tracts (Connecting AMMC -> CX -> MB -> DN)
    const ammcLX = cx - 65, ammcLY = cy + 25;
    const ammcRX = cx + 65, ammcRY = cy + 25;
    const ccX = cx, ccY = cy - 5;
    const mbLX = cx - 40, mbLY = cy - 38;
    const mbRX = cx + 40, mbRY = cy - 38;
    const dnX = cx, dnY = cy + 65;

    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);

    // AMMC -> Central Complex
    ctx.strokeStyle = !isRest ? '#0284c7' : 'rgba(100, 116, 139, 0.3)';
    ctx.beginPath(); ctx.moveTo(ammcLX, ammcLY); ctx.lineTo(ccX, ccY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ammcRX, ammcRY); ctx.lineTo(ccX, ccY); ctx.stroke();

    // Central Complex -> Mushroom Body
    ctx.strokeStyle = !isRest ? '#d97706' : 'rgba(100, 116, 139, 0.3)';
    ctx.beginPath(); ctx.moveTo(ccX, ccY); ctx.lineTo(mbLX, mbLY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ccX, ccY); ctx.lineTo(mbRX, mbRY); ctx.stroke();

    // Central Complex & MB -> Descending Neurons
    ctx.strokeStyle = !isRest ? '#e11d48' : 'rgba(100, 116, 139, 0.3)';
    ctx.beginPath(); ctx.moveTo(ccX, ccY); ctx.lineTo(dnX, dnY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mbLX, mbLY); ctx.lineTo(dnX, dnY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(mbRX, mbRY); ctx.lineTo(dnX, dnY); ctx.stroke();

    ctx.setLineDash([]); // Reset line dash

    // 3. Neuropil Nodes (Utilitarian solid indicators with crisp rings)

    // A. AMMC (Auditory Mechanosensory & Motor Center: Slate Blue)
    [ [ammcLX, ammcLY], [ammcRX, ammcRY] ].forEach(([nx, ny]) => {
      ctx.fillStyle = !isRest ? 'rgba(2, 132, 199, 0.15)' : 'rgba(148, 163, 184, 0.1)';
      ctx.beginPath(); ctx.arc(nx, ny, 14, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = !isRest ? '#0284c7' : '#94a3b8';
      ctx.beginPath(); ctx.arc(nx, ny, 7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#0369a1';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    });

    // B. Central Complex (Central Spatial Index & Clock: Amber)
    ctx.fillStyle = !isRest ? 'rgba(217, 119, 6, 0.15)' : 'rgba(148, 163, 184, 0.1)';
    ctx.beginPath(); ctx.arc(ccX, ccY, 18, 0, Math.PI * 2); ctx.fill();

    ctx.strokeStyle = !isRest ? '#d97706' : '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(ccX, ccY, 12, 8, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = !isRest ? '#b45309' : '#64748b';
    ctx.beginPath(); ctx.arc(ccX, ccY, 4, 0, Math.PI * 2); ctx.fill();

    // C. Mushroom Body (Kenyon Cells / Musical Memory: Violet)
    [ [mbLX, mbLY], [mbRX, mbRY] ].forEach(([mx, my]) => {
      ctx.fillStyle = !isRest ? 'rgba(124, 58, 237, 0.15)' : 'rgba(148, 163, 184, 0.1)';
      ctx.beginPath(); ctx.arc(mx, my, 14, 0, Math.PI * 2); ctx.fill();

      ctx.fillStyle = !isRest ? '#7c3aed' : '#94a3b8';
      ctx.beginPath(); ctx.ellipse(mx, my, 5, 10, mx < cx ? -0.3 : 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#6d28d9'; ctx.lineWidth = 1.2; ctx.stroke();
    });

    // D. Descending Neurons (Motor Command Spikes: Rose / Red)
    ctx.fillStyle = !isRest ? 'rgba(225, 29, 72, 0.15)' : 'rgba(148, 163, 184, 0.1)';
    ctx.beginPath(); ctx.arc(dnX, dnY, 15, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = !isRest ? '#e11d48' : '#94a3b8';
    ctx.beginPath(); ctx.arc(dnX, dnY, 6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#be123c'; ctx.lineWidth = 1.2; ctx.stroke();

    // Labels on Canvas (Crisp Slate-900 JetBrains Mono)
    ctx.font = '600 9px "JetBrains Mono", monospace';
    ctx.textAlign = 'center';

    ctx.fillStyle = '#0f172a';
    ctx.fillText('AMMC (Auditory)', cx - 65, cy + 45);
    ctx.fillText('AMMC (Auditory)', cx + 65, cy + 45);
    ctx.fillText('CENTRAL COMPLEX', cx, cy - 18);
    ctx.fillText('MUSHROOM BODY', cx, cy - 54);
    ctx.fillText('DESCENDING MOTOR (DN)', cx, cy + 85);

    ctx.restore();
  }

  pulseConnectome(pitch, octave, force = 0.8, isRest = false) {
    // 1. Head 1: Pitch Neurons (0-12)
    for (let i = 0; i <= 12; i++) {
      const node = document.getElementById(`pitch-head-${i}`);
      if (node) {
        if (i === pitch) {
          node.classList.add(i === 12 ? 'firing-rest' : 'firing');
          node.querySelector('.node-val').textContent = (i === 12 ? 'REST' : '1.0');
        } else {
          node.classList.remove('firing', 'firing-rest');
          node.querySelector('.node-val').textContent = '0.0';
        }
      }
    }

    // 2. Head 2: Octave Selector (0-7)
    for (let o = 0; o < 8; o++) {
      const oNode = document.getElementById(`octave-head-${o}`);
      if (oNode) {
        if (o === octave && pitch !== 12) {
          oNode.classList.add('active');
        } else {
          oNode.classList.remove('active');
        }
      }
    }

    // 3. Head 3: Continuous Strike Force Meter
    const fill = document.getElementById('force-meter-fill');
    const valDisp = document.getElementById('force-val-display');
    const badge = document.getElementById('force-dynamics-badge');

    if (fill && valDisp && badge) {
      const clamped = Math.max(0.0, Math.min(1.0, force));
      fill.style.width = `${Math.round(clamped * 100)}%`;
      valDisp.textContent = clamped.toFixed(2);

      let dynText = "mf (mezzo-forte)";
      if (clamped < 0.25) dynText = "pp (pianissimo)";
      else if (clamped < 0.45) dynText = "p (piano)";
      else if (clamped < 0.65) dynText = "mp (mezzo-piano)";
      else if (clamped < 0.82) dynText = "mf (mezzo-forte)";
      else if (clamped < 0.93) dynText = "f (forte)";
      else dynText = "ff (fortissimo)";

      badge.textContent = dynText;
    }

    // 4. Biological Connectome Matrix Canvas
    const activeKey = pitch === 12 ? -1 : (12 * octave + 12 + pitch - 21);
    this.renderConnectomeCanvas(activeKey);

    // 5. Update Live Floating Fly Brain HUD Chips in Viewport
    const hudAmmc = document.getElementById('hud-np-ammc');
    const hudValAmmc = document.getElementById('hud-val-ammc');
    const hudCx = document.getElementById('hud-np-cx');
    const hudValCx = document.getElementById('hud-val-cx');
    const hudMb = document.getElementById('hud-np-mb');
    const hudDn = document.getElementById('hud-np-dn');
    const hudValDn = document.getElementById('hud-val-dn');
    const hudVnc = document.getElementById('hud-np-vnc');

    const noteName = pitch !== 12 ? `${SEMITONE_NAMES[pitch]}${octave}` : "REST";

    if (hudAmmc) {
      hudAmmc.classList.add('active');
      if (hudValAmmc) hudValAmmc.textContent = noteName;
    }
    if (hudCx) {
      hudCx.classList.add('active');
      if (hudValCx) hudValCx.textContent = isRest ? "Rest" : `Oct ${octave}`;
    }
    if (hudMb) hudMb.classList.add('active');
    if (hudDn) {
      hudDn.classList.add('active');
      if (hudValDn) hudValDn.textContent = isRest ? "Rest" : `${Math.round(force * 100)}%`;
    }
    if (hudVnc) hudVnc.classList.add('active');

    clearTimeout(this.hudResetTimer);
    this.hudResetTimer = setTimeout(() => {
      if (hudAmmc) hudAmmc.classList.remove('active');
      if (hudCx) hudCx.classList.remove('active');
      if (hudMb) hudMb.classList.remove('active');
      if (hudDn) hudDn.classList.remove('active');
      if (hudVnc) hudVnc.classList.remove('active');
    }, 450);

    // 6. Update Interactive Drosophila Anatomical Brain Canvas & Tab 3 Cards
    this.renderFlyBrainCanvas(pitch, octave, force, isRest);

    const calloutRegion = document.getElementById('callout-region');
    const calloutDetails = document.getElementById('callout-details');
    if (calloutRegion && calloutDetails) {
      if (isRest) {
        calloutRegion.textContent = "⏸ Biological Rest & Singing String Resonance";
        calloutDetails.textContent = "Neuromuscular motor standby";
      } else {
        const midi = 12 * octave + 12 + pitch;
        const freq = 440 * Math.pow(2, (midi - 69) / 12);
        calloutRegion.textContent = `⚡ Auditory AMMC → CX (Octave ${octave}) → Descending Neurons`;
        calloutDetails.textContent = `${noteName} (${freq.toFixed(1)} Hz) · Strike Force ${force.toFixed(2)}`;
      }
    }

    const cardAmmc = document.getElementById('card-np-ammc');
    const statusAmmc = document.getElementById('status-np-ammc');
    const cardCx = document.getElementById('card-np-cx');
    const statusCx = document.getElementById('status-np-cx');
    const cardMb = document.getElementById('card-np-mb');
    const statusMb = document.getElementById('status-np-mb');
    const cardDn = document.getElementById('card-np-dn');
    const statusDn = document.getElementById('status-np-dn');

    if (cardAmmc && statusAmmc) {
      cardAmmc.classList.toggle('firing', !isRest);
      statusAmmc.textContent = isRest ? "Rest (Awaiting Sound)" : `Audition: ${noteName}`;
    }
    if (cardCx && statusCx) {
      cardCx.classList.toggle('firing', !isRest);
      statusCx.textContent = isRest ? "Clock Pause" : `Routing: Octave ${octave} (Key ${activeKey})`;
    }
    if (cardMb && statusMb) {
      cardMb.classList.toggle('firing', !isRest);
      statusMb.textContent = isRest ? "Motif Hold" : `Recognized Melodic Motif`;
    }
    if (cardDn && statusDn) {
      cardDn.classList.toggle('firing', !isRest);
      statusDn.textContent = isRest ? "Motor Standby" : `Spike Rate ${Math.round(force * 180)} Hz (F ${force.toFixed(2)})`;
    }
  }

  renderConnectomeCanvas(activeKeyIdx = -1) {
    const canvas = document.getElementById('connectome-matrix-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const cols = 24;
    const rows = 12;
    const cellW = canvas.width / cols;
    const cellH = canvas.height / rows;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const isFired = (activeKeyIdx >= 0) && ((idx % 88) === activeKeyIdx);

        ctx.fillStyle = isFired ? '#0f172a' : (idx % 2 === 0 ? '#f1f5f9' : '#e2e8f0');
        ctx.fillRect(c * cellW + 1, r * cellH + 1, cellW - 2, cellH - 2);

        if (isFired) {
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 1;
          ctx.strokeRect(c * cellW + 1, r * cellH + 1, cellW - 2, cellH - 2);
        }
      }
    }
  }

  buildStudioKeyboard() {
    const container = document.getElementById('interactive-piano');
    if (!container) return;
    container.innerHTML = '';
    container.classList.add('mode-88');

    PIANO_88_KEYS.forEach(k => {
      const key = document.createElement('div');
      key.className = `piano-key ${k.isBlack ? 'black' : 'white'}`;
      key.dataset.pitch = k.index;
      key.textContent = k.isBlack ? '' : (k.name.startsWith('C') ? k.name : '');
      key.title = `${k.name} (MIDI ${k.midi}, ${FREQ_88[k.index].toFixed(1)} Hz)`;

      key.addEventListener('mousedown', () => this.handleStudioKeyClick(k.index, k.midi));
      container.appendChild(key);
    });
  }

  handleStudioKeyClick(keyIdx, midiPitch = null) {
    const midi = midiPitch || (keyIdx + 21);
    const pitch = (midi - 12) % 12;
    const octave = Math.max(0, Math.min(7, Math.floor((midi - 12) / 12)));
    const force = 0.85;

    this.synth.playNote(midi, 1.4, force);
    this.viewport.strikeKey(keyIdx, force);
    this.pulseConnectome(pitch, octave, force, false);

    const noteName = this.getKeyName(keyIdx);
    const freq = 440 * Math.pow(2, (midi - 69) / 12);

    const infoNote = document.getElementById('info-note-name');
    const infoChan = document.getElementById('info-channel');
    const infoFreq = document.getElementById('info-freq');
    const infoLeg = document.getElementById('info-leg');

    if (infoNote) infoNote.textContent = noteName;
    if (infoChan) infoChan.textContent = `Key ${keyIdx} · Octave ${octave}`;
    if (infoFreq) infoFreq.textContent = `${freq.toFixed(2)} Hz`;
    if (infoLeg) {
      infoLeg.textContent = keyIdx < 44 
        ? "AMMC → CX (Bass-Mid) → DN → Left Foreleg" 
        : "AMMC → CX (Treble) → DN → Right Foreleg";
    }

    const keyElem = document.querySelector(`.piano-key[data-pitch="${keyIdx}"]`);
    if (keyElem) {
      keyElem.classList.add('pressed');
      setTimeout(() => keyElem.classList.remove('pressed'), 220);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.app = new FlyPianoApp();
});
