// NES-style chiptune engine — 2 pulse channels, a triangle bass and a
// noise/percussion channel, sequenced with Web Audio lookahead
// scheduling. Every track is written here as step data (no audio
// files), so each stage gets music matching its mood for ~0 bytes.
//
// Notation: each channel is an array of bars; a bar is a space-
// separated string of 16 steps (16th notes).
//    "A4"  start this note      "."  hold previous     "-"  rest
// Drums use tokens: K kick, S snare, H hat, O open hat, - rest.

const CHIP_NOTES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

function chipFreq(name) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) return null;
  let semi = CHIP_NOTES[m[1]] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
  const midi = semi + (parseInt(m[3], 10) + 1) * 12;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

class ChiptunePlayer {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.track = null;
    this.playing = false;
    this.step = 0;
    this.nextTime = 0;
    this.timer = null;
    this.volume = 0.22;
    this._waves = {};
    this._noiseBuf = null;
    this._muted = false;
  }

  _ensure() {
    if (this.ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    this.ctx = new AC();
    this.master = this.ctx.createGain();
    this.master.gain.value = this.volume;
    // Gentle lowpass keeps the square edges from being harsh on phones
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 9000;
    this.master.connect(lp);
    lp.connect(this.ctx.destination);

    // Pulse waves at classic NES duty cycles
    for (const duty of [0.125, 0.25, 0.5]) {
      const n = 24;
      const real = new Float32Array(n);
      const imag = new Float32Array(n);
      for (let i = 1; i < n; i++) {
        real[i] = (2 / (i * Math.PI)) * Math.sin(Math.PI * i * duty);
      }
      this._waves[duty] = this.ctx.createPeriodicWave(real, imag);
    }

    // One second of white noise, reused by every percussion hit
    const len = this.ctx.sampleRate;
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this._noiseBuf = buf;
    return true;
  }

  setMuted(m) {
    this._muted = m;
    if (this.master) this.master.gain.value = m ? 0 : this.volume;
  }

  toggleMute() {
    this.setMuted(!this._muted);
    return this._muted;
  }

  play(name) {
    const t = CHIP_TRACKS[name];
    if (!t) return;
    if (this.playing && this.trackName === name) return;
    this.stop();
    if (!this._ensure()) return;
    if (this.ctx.state === "suspended") this.ctx.resume();
    this.track = t;
    this.trackName = name;
    this.playing = true;
    this.step = 0;
    this.nextTime = this.ctx.currentTime + 0.06;
    this.timer = setInterval(() => this._schedule(), 25);
  }

  stop() {
    this.playing = false;
    this.track = null;
    this.trackName = null;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
  }

  _schedule() {
    if (!this.playing || !this.track) return;
    const spb = 60 / this.track.bpm / 4; // seconds per 16th step
    const horizon = this.ctx.currentTime + 0.12;
    let guard = 0;
    while (this.nextTime < horizon && guard++ < 64) {
      this._playStep(this.step, this.nextTime, spb);
      this.nextTime += spb;
      this.step++;
      const total = this.track.length * 16;
      if (this.step >= total) {
        this.step = this.track.loopFrom !== undefined ? this.track.loopFrom * 16 : 0;
        if (this.track.once) { this.stop(); return; }
      }
    }
  }

  // Look back from `step` to find the note that is sounding, and how
  // many steps it has left — lets a channel hold notes across steps.
  _noteAt(bars, step) {
    const bar = Math.floor(step / 16);
    if (!bars || bar >= bars.length) return null;
    const flat = bars.join(" ").trim().split(/\s+/);
    const tok = flat[step];
    if (!tok || tok === "." || tok === "-") return null;
    let dur = 1;
    for (let i = step + 1; i < flat.length && flat[i] === "."; i++) dur++;
    return { tok, dur };
  }

  _playStep(step, when, spb) {
    const t = this.track;
    if (t.pulse1) this._pulse(t.pulse1, step, when, spb, t.duty1 || 0.5, t.gain1 || 0.16);
    if (t.pulse2) this._pulse(t.pulse2, step, when, spb, t.duty2 || 0.25, t.gain2 || 0.10);
    if (t.tri) this._tri(t.tri, step, when, spb, t.gainT || 0.26);
    if (t.drums) this._drum(t.drums, step, when, t.gainD || 0.5);
  }

  _pulse(bars, step, when, spb, duty, gain) {
    const n = this._noteAt(bars, step);
    if (!n) return;
    const f = chipFreq(n.tok);
    if (!f) return;
    const o = this.ctx.createOscillator();
    o.setPeriodicWave(this._waves[duty] || this._waves[0.5]);
    o.frequency.setValueAtTime(f, when);
    const g = this.ctx.createGain();
    // Snappy NES envelope: instant attack, slight decay, hard cutoff
    const dur = n.dur * spb;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.005);
    g.gain.linearRampToValueAtTime(gain * 0.72, when + Math.min(0.09, dur * 0.5));
    g.gain.setValueAtTime(gain * 0.72, when + dur * 0.92);
    g.gain.linearRampToValueAtTime(0, when + dur * 0.99);
    o.connect(g);
    g.connect(this.master);
    o.start(when);
    o.stop(when + dur);
  }

  _tri(bars, step, when, spb, gain) {
    const n = this._noteAt(bars, step);
    if (!n) return;
    const f = chipFreq(n.tok);
    if (!f) return;
    const o = this.ctx.createOscillator();
    o.type = "triangle";
    o.frequency.setValueAtTime(f, when);
    const g = this.ctx.createGain();
    const dur = n.dur * spb;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.008);
    g.gain.setValueAtTime(gain, when + dur * 0.9);
    g.gain.linearRampToValueAtTime(0, when + dur * 0.98);
    o.connect(g);
    g.connect(this.master);
    o.start(when);
    o.stop(when + dur);
  }

  _drum(bars, step, when, gain) {
    const flat = bars.join(" ").trim().split(/\s+/);
    const tok = flat[step];
    if (!tok || tok === "-" || tok === ".") return;

    if (tok === "K") {
      // Kick: fast pitch drop on a triangle, NES-style
      const o = this.ctx.createOscillator();
      o.type = "triangle";
      o.frequency.setValueAtTime(150, when);
      o.frequency.exponentialRampToValueAtTime(42, when + 0.11);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(gain * 1.1, when);
      g.gain.exponentialRampToValueAtTime(0.001, when + 0.15);
      o.connect(g); g.connect(this.master);
      o.start(when); o.stop(when + 0.16);
      return;
    }

    const src = this.ctx.createBufferSource();
    src.buffer = this._noiseBuf;
    const f = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    let dur;
    if (tok === "S") {
      f.type = "bandpass"; f.frequency.value = 1900; f.Q.value = 0.8;
      dur = 0.13; g.gain.setValueAtTime(gain * 0.75, when);
    } else if (tok === "O") {
      f.type = "highpass"; f.frequency.value = 7000;
      dur = 0.16; g.gain.setValueAtTime(gain * 0.28, when);
    } else { // H
      f.type = "highpass"; f.frequency.value = 8500;
      dur = 0.035; g.gain.setValueAtTime(gain * 0.22, when);
    }
    g.gain.exponentialRampToValueAtTime(0.001, when + dur);
    src.connect(f); f.connect(g); g.connect(this.master);
    src.start(when); src.stop(when + dur + 0.02);
  }
}

// ---------------------------------------------------------------------
// The soundtrack. Each stage gets a theme matched to its environment.
// ---------------------------------------------------------------------
const CHIP_TRACKS = {};

// TITLE — heroic, mid-tempo, the band tuning up
CHIP_TRACKS.title = {
  bpm: 132, length: 4, duty1: 0.5, duty2: 0.25,
  pulse1: [
    "A4 . . . E4 . . . A4 . B4 . C5 . . .",
    "B4 . . . G4 . . . E4 . . . . . . .",
    "F4 . . . C5 . . . B4 . A4 . G4 . . .",
    "A4 . . . . . E5 . A5 . . . . . . .",
  ],
  pulse2: [
    "A3 C4 E4 C4 A3 C4 E4 C4 A3 C4 E4 C4 A3 C4 E4 C4",
    "E3 G3 B3 G3 E3 G3 B3 G3 E3 G3 B3 G3 E3 G3 B3 G3",
    "F3 A3 C4 A3 F3 A3 C4 A3 G3 B3 D4 B3 G3 B3 D4 B3",
    "A3 C4 E4 A4 E4 C4 A3 C4 E4 . . . . . . .",
  ],
  tri: [
    "A2 . . . A2 . . . E2 . . . A2 . . .",
    "E2 . . . E2 . . . B2 . . . E2 . . .",
    "F2 . . . F2 . . . G2 . . . G2 . . .",
    "A2 . . . E2 . . . A2 . . . . . . .",
  ],
  drums: [
    "K - - - S - - - K - K - S - - -",
    "K - - - S - - - K - K - S - H H",
    "K - - - S - - - K - K - S - - -",
    "K - - - S - - - K - S - S S S S",
  ],
};

// CITY (Level 1) — upbeat, driving street-punk in A minor
CHIP_TRACKS.city = {
  bpm: 152, length: 4, duty1: 0.5, duty2: 0.125,
  pulse1: [
    "A4 . . . C5 . B4 . A4 . . . E4 . . .",
    "F4 . . . A4 . G4 . F4 . . . C4 . . .",
    "E4 . G4 . C5 . . . B4 . . . G4 . . .",
    "D5 . . . B4 . G4 . A4 . . . . . . .",
  ],
  pulse2: [
    "A3 C4 E4 C4 A3 C4 E4 C4 A3 C4 E4 C4 A3 C4 E4 C4",
    "F3 A3 C4 A3 F3 A3 C4 A3 F3 A3 C4 A3 F3 A3 C4 A3",
    "C4 E4 G4 E4 C4 E4 G4 E4 C4 E4 G4 E4 C4 E4 G4 E4",
    "G3 B3 D4 B3 G3 B3 D4 B3 G3 B3 D4 B3 G3 B3 D4 B3",
  ],
  tri: [
    "A2 . A2 . A2 . A2 . E3 . E3 . A2 . A2 .",
    "F2 . F2 . F2 . F2 . C3 . C3 . F2 . F2 .",
    "C3 . C3 . C3 . C3 . G2 . G2 . C3 . C3 .",
    "G2 . G2 . G2 . G2 . D3 . D3 . G2 . G2 .",
  ],
  drums: [
    "K - H - S - H - K - H - S - H -",
    "K - H - S - H - K - H - S - H H",
    "K - H - S - H - K - H - S - H -",
    "K - H - S - H - K - H - S - S S",
  ],
};

// SUNSET MESA (1-3) — warm, wide, western; slower with open intervals
CHIP_TRACKS.mesa = {
  bpm: 104, length: 4, duty1: 0.25, duty2: 0.5, gain1: 0.15,
  pulse1: [
    "D4 . . . . . F4 . A4 . . . . . . .",
    "G4 . . . F4 . . . D4 . . . . . . .",
    "A4 . . . . . C5 . D5 . . . . . A4 .",
    "F4 . . . D4 . . . . . . . . . . .",
  ],
  pulse2: [
    "- - - - - - - - D4 . . . A3 . . .",
    "- - - - - - - - Bb3 . . . D4 . . .",
    "- - - - - - - - C4 . . . E4 . . .",
    "- - - - - - - - A3 . . . . . . .",
  ],
  tri: [
    "D2 . . . . . . . A2 . . . . . . .",
    "Bb1 . . . . . . . F2 . . . . . . .",
    "C2 . . . . . . . G2 . . . . . . .",
    "D2 . . . . . . . A2 . . . D2 . . .",
  ],
  drums: [
    "K - - - - - S - - - - - K - - -",
    "K - - - - - S - - - - - - - - -",
    "K - - - - - S - - - - - K - - -",
    "K - - - - - S - - - - - S - S -",
  ],
};

// THE JAM WORKS (1-4) — dark industrial; chromatic descent, pounding
CHIP_TRACKS.works = {
  bpm: 138, length: 4, duty1: 0.125, duty2: 0.125, gain1: 0.15,
  pulse1: [
    "E4 . - . E4 . - . G4 . F#4 . E4 . - .",
    "D4 . - . D4 . - . F4 . E4 . D4 . - .",
    "C4 . - . C4 . - . Eb4 . D4 . C4 . - .",
    "B3 . . . - . - . B4 . A#4 . B4 . - .",
  ],
  pulse2: [
    "E3 . B3 . E3 . B3 . E3 . B3 . E3 . B3 .",
    "D3 . A3 . D3 . A3 . D3 . A3 . D3 . A3 .",
    "C3 . G3 . C3 . G3 . C3 . G3 . C3 . G3 .",
    "B2 . F#3 . B2 . F#3 . B2 . F#3 . B2 . B3 .",
  ],
  tri: [
    "E1 . . . E1 . E1 . E1 . . . E1 . . .",
    "D1 . . . D1 . D1 . D1 . . . D1 . . .",
    "C1 . . . C1 . C1 . C1 . . . C1 . . .",
    "B0 . . . B0 . B0 . B0 . . . B0 . B0 .",
  ],
  drums: [
    "K - - K S - - - K - - K S - - H",
    "K - - K S - - - K - - K S - H H",
    "K - - K S - - - K - - K S - - H",
    "K - - K S - - - K S K S S S S S",
  ],
};

// ORCHARD ROWS (2-1) — mechanical, marching; a 16th ostinato that
// never varies, because nothing on this plantation is allowed to
CHIP_TRACKS.orchard = {
  bpm: 128, length: 4, duty1: 0.25, duty2: 0.125, gain1: 0.14,
  pulse1: [
    "C4 Eb4 G4 Eb4 C4 Eb4 G4 Eb4 C4 Eb4 G4 Eb4 C4 Eb4 G4 Eb4",
    "Bb3 D4 F4 D4 Bb3 D4 F4 D4 Bb3 D4 F4 D4 Bb3 D4 F4 D4",
    "Ab3 C4 Eb4 C4 Ab3 C4 Eb4 C4 Ab3 C4 Eb4 C4 Ab3 C4 Eb4 C4",
    "G3 Bb3 D4 Bb3 G3 Bb3 D4 Bb3 G3 B3 D4 B3 G3 B3 D4 F4",
  ],
  pulse2: [
    "C5 . . . - . . . Eb5 . . . - . . .",
    "D5 . . . - . . . Bb4 . . . - . . .",
    "Eb5 . . . - . . . C5 . . . - . . .",
    "D5 . . . . . . . - . . . - . . .",
  ],
  tri: [
    "C2 . . . C2 . . . C2 . . . C2 . . .",
    "Bb1 . . . Bb1 . . . Bb1 . . . Bb1 . . .",
    "Ab1 . . . Ab1 . . . Ab1 . . . Ab1 . . .",
    "G1 . . . G1 . . . G1 . . . G1 . G1 .",
  ],
  drums: [
    "K - - - S - - - K - - - S - - -",
    "K - - - S - - - K - - - S - - H",
    "K - - - S - - - K - - - S - - -",
    "K - - - S - - - K - - - S S S S",
  ],
};

// THE ARCHIVE (2-2) — sparse, cold, sad. No drums; just a lonely
// melody over held bass, like a room full of people who can't sing.
CHIP_TRACKS.archive = {
  bpm: 72, length: 4, duty1: 0.5, duty2: 0.5, gain1: 0.12, gain2: 0.07, gainT: 0.2,
  pulse1: [
    "A4 . . . . . . . E4 . . . . . . .",
    "F4 . . . . . . . C4 . . . . . . .",
    "D4 . . . . . E4 . F4 . . . . . . .",
    "E4 . . . . . . . . . . . . . . .",
  ],
  pulse2: [
    "- - - - - - - - - - - - A3 . . .",
    "- - - - - - - - - - - - F3 . . .",
    "- - - - - - - - - - - - D3 . . .",
    "- - - - - - - - - - - - E3 . . .",
  ],
  tri: [
    "A1 . . . . . . . . . . . . . . .",
    "F1 . . . . . . . . . . . . . . .",
    "D1 . . . . . . . . . . . . . . .",
    "E1 . . . . . . . . . . . . . . .",
  ],
};

// THE SIGNAL SPIRE (3-1) — urgent ascent, F# minor, climbing arpeggios
CHIP_TRACKS.spire = {
  bpm: 164, length: 4, duty1: 0.25, duty2: 0.125, gain1: 0.15,
  pulse1: [
    "F#4 . A4 . C#5 . F#5 . C#5 . A4 . F#4 . . .",
    "E4 . G#4 . B4 . E5 . B4 . G#4 . E4 . . .",
    "D4 . F#4 . A4 . D5 . A4 . F#4 . D4 . . .",
    "C#4 . E4 . G#4 . C#5 . E5 . G#5 . C#6 . . .",
  ],
  pulse2: [
    "F#3 . . . C#4 . . . F#3 . . . C#4 . . .",
    "E3 . . . B3 . . . E3 . . . B3 . . .",
    "D3 . . . A3 . . . D3 . . . A3 . . .",
    "C#3 . . . G#3 . . . C#3 . . . G#3 . . .",
  ],
  tri: [
    "F#1 . F#1 . F#1 . F#1 . F#1 . F#1 . F#1 . F#1 .",
    "E1 . E1 . E1 . E1 . E1 . E1 . E1 . E1 .",
    "D1 . D1 . D1 . D1 . D1 . D1 . D1 . D1 .",
    "C#1 . C#1 . C#1 . C#1 . C#1 . C#1 . C#1 . C#1 .",
  ],
  drums: [
    "K - H H S - H H K - H H S - H H",
    "K - H H S - H H K - H H S - H H",
    "K - H H S - H H K - H H S - H H",
    "K - H H S - H H K S K S S S S S",
  ],
};

// BOSS — aggressive, chromatic, relentless
CHIP_TRACKS.boss = {
  bpm: 170, length: 4, duty1: 0.125, duty2: 0.25, gain1: 0.16,
  pulse1: [
    "D4 . D4 . Eb4 . D4 . C4 . D4 . - . - .",
    "D4 . D4 . F4 . E4 . D4 . C4 . - . - .",
    "Bb3 . Bb3 . C4 . Bb3 . A3 . Bb3 . - . - .",
    "A3 . C4 . Eb4 . F#4 . A4 . . . . . . .",
  ],
  pulse2: [
    "D3 A3 D4 A3 D3 A3 D4 A3 D3 A3 D4 A3 D3 A3 D4 A3",
    "D3 A3 D4 A3 D3 A3 D4 A3 D3 A3 D4 A3 D3 A3 D4 A3",
    "Bb2 F3 Bb3 F3 Bb2 F3 Bb3 F3 Bb2 F3 Bb3 F3 Bb2 F3 Bb3 F3",
    "A2 E3 A3 E3 A2 E3 A3 E3 A2 E3 A3 E3 A2 E3 A3 E3",
  ],
  tri: [
    "D1 . D1 . D1 . D1 . D1 . D1 . D1 . D1 .",
    "D1 . D1 . D1 . D1 . D1 . D1 . D1 . D1 .",
    "Bb0 . Bb0 . Bb0 . Bb0 . Bb0 . Bb0 . Bb0 . Bb0 .",
    "A0 . A0 . A0 . A0 . A0 . A0 . A0 . A0 .",
  ],
  drums: [
    "K H S H K H S H K H S H K H S H",
    "K H S H K H S H K H S H K H S S",
    "K H S H K H S H K H S H K H S H",
    "K H S H K H S H S S S S S S S S",
  ],
};

// ECHO JAMMY — the city theme played back FROM CONCENTRATE: same
// melody, soured into a minor-chromatic shadow of itself.
CHIP_TRACKS.echo = {
  bpm: 152, length: 4, duty1: 0.125, duty2: 0.125, gain1: 0.16,
  pulse1: [
    "A4 . . . C5 . Bb4 . Ab4 . . . Eb4 . . .",
    "F4 . . . Ab4 . G4 . Fb4 . . . C4 . . .",
    "Eb4 . Gb4 . C5 . . . Bb4 . . . Gb4 . . .",
    "Db5 . . . Bb4 . Gb4 . A4 . . . . . . .",
  ],
  pulse2: [
    "A3 C4 Eb4 C4 A3 C4 Eb4 C4 A3 C4 Eb4 C4 A3 C4 Eb4 C4",
    "F3 Ab3 C4 Ab3 F3 Ab3 C4 Ab3 F3 Ab3 C4 Ab3 F3 Ab3 C4 Ab3",
    "C4 Eb4 Gb4 Eb4 C4 Eb4 Gb4 Eb4 C4 Eb4 Gb4 Eb4 C4 Eb4 Gb4 Eb4",
    "Gb3 Bb3 Db4 Bb3 Gb3 Bb3 Db4 Bb3 Gb3 Bb3 Db4 Bb3 Gb3 Bb3 Db4 Bb3",
  ],
  tri: [
    "A1 . A1 . A1 . A1 . Eb2 . Eb2 . A1 . A1 .",
    "F1 . F1 . F1 . F1 . C2 . C2 . F1 . F1 .",
    "C2 . C2 . C2 . C2 . Gb1 . Gb1 . C2 . C2 .",
    "Gb1 . Gb1 . Gb1 . Gb1 . Db2 . Db2 . Gb1 . Gb1 .",
  ],
  drums: [
    "K - H - S - H - K - H - S - H -",
    "K - H - S - H - K - H - S - H H",
    "K - H - S - H - K - H - S - H -",
    "K K S S K K S S S S S S S S S S",
  ],
};

// HOLD THE FREQUENCY — the finale. Major-key, building, defiant.
CHIP_TRACKS.finale = {
  bpm: 158, length: 4, duty1: 0.5, duty2: 0.25, gain1: 0.17,
  pulse1: [
    "A4 . B4 . C#5 . E5 . A5 . . . E5 . C#5 .",
    "D5 . . . C#5 . B4 . A4 . . . B4 . . .",
    "C#5 . D5 . E5 . A5 . E5 . . . C#5 . . .",
    "B4 . C#5 . D5 . E5 . A5 . . . . . . .",
  ],
  pulse2: [
    "A3 C#4 E4 C#4 A3 C#4 E4 C#4 A3 C#4 E4 C#4 A3 C#4 E4 C#4",
    "D4 F#4 A4 F#4 D4 F#4 A4 F#4 D4 F#4 A4 F#4 D4 F#4 A4 F#4",
    "A3 C#4 E4 C#4 A3 C#4 E4 C#4 A3 C#4 E4 C#4 A3 C#4 E4 C#4",
    "E4 G#4 B4 G#4 E4 G#4 B4 G#4 E4 G#4 B4 E5 B4 G#4 E4 B3",
  ],
  tri: [
    "A1 . A1 . E2 . E2 . A1 . A1 . E2 . E2 .",
    "D2 . D2 . A2 . A2 . D2 . D2 . A2 . A2 .",
    "A1 . A1 . E2 . E2 . A1 . A1 . E2 . E2 .",
    "E1 . E1 . B1 . B1 . E1 . E1 . E2 . E2 .",
  ],
  drums: [
    "K - H H S - H H K - H H S - H H",
    "K - H H S - H H K - H H S - H O",
    "K - H H S - H H K - H H S - H H",
    "K - H H S - H H K S K S S S S O",
  ],
};

// VICTORY — short major fanfare, plays once
CHIP_TRACKS.victory = {
  bpm: 140, length: 2, once: true, duty1: 0.5, duty2: 0.25, gain1: 0.2,
  pulse1: [
    "A4 . C#5 . E5 . A5 . . . . . G#5 . A5 .",
    "E5 . . . A5 . . . . . . . . . . .",
  ],
  pulse2: [
    "A3 . C#4 . E4 . A4 . . . . . E4 . A4 .",
    "C#4 . . . E4 . . . . . . . . . . .",
  ],
  tri: [
    "A1 . . . A1 . . . D2 . . . E2 . . .",
    "A1 . . . A1 . . . . . . . . . . .",
  ],
  drums: [
    "K - S - K - S - K S K S S S S S",
    "K - - - K - - - S S S S S S S S",
  ],
};

const Chip = new ChiptunePlayer();
