// Tiny chiptune renderer. Songs are written as note data here, rendered
// once with an OfflineAudioContext (square lead, triangle bass, pulse
// "pah-pah" chords, a noise hat) and dropped into Phaser's audio cache
// as ordinary sounds, so they loop, stop and pause like the mp3s.

const CHIPTUNE_SONGS = {
  // "Cloud Waltz": an uplifting 3/4 lilt for Cloud Nine. Thirty-two
  // bars: a tuneful A section, then a skipping B section with
  // eighth-note runs and a bright arpeggio underneath.
  CloudWaltz: {
    bpm: 150,
    beatsPerBar: 3,
    sampleRate: 22050,
    // One chord per bar: [root note, quality]
    chords: [
      ["C3", "maj"], ["C3", "maj"], ["G2", "maj"], ["G2", "maj"],
      ["A2", "min"], ["A2", "min"], ["F2", "maj"], ["F2", "maj"],
      ["C3", "maj"], ["C3", "maj"], ["G2", "maj"], ["G2", "maj"],
      ["F2", "maj"], ["G2", "maj"], ["C3", "maj"], ["C3", "maj"],
      ["F2", "maj"], ["F2", "maj"], ["C3", "maj"], ["C3", "maj"],
      ["G2", "maj"], ["G2", "maj"], ["A2", "min"], ["A2", "min"],
      ["F2", "maj"], ["F2", "maj"], ["C3", "maj"], ["E2", "maj"],
      ["A2", "min"], ["F2", "maj"], ["G2", "maj"], ["G2", "maj"],
    ],
    // Lead: "note:beats" tokens, bars split by "|", "r" is a rest.
    melody:
      "E4:1 G4:1 C5:1 | B4:2 A4:1 | G4:1 B4:1 D5:1 | D5:3 |" +
      "E5:1 C5:1 A4:1 | B4:2 C5:1 | A4:1 C5:1 F5:1 | E5:2 D5:1 |" +
      "C5:1 E5:1 G5:1 | G5:2 E5:1 | F5:1 D5:1 B4:1 | D5:2 B4:1 |" +
      "A4:1 C5:1 F5:1 | G5:1 F5:1 D5:1 | E5:3 | C5:2 r:1 |" +
      "F5:.5 E5:.5 F5:.5 G5:.5 A5:1 | A5:2 G5:1 | E5:.5 D5:.5 E5:.5 F5:.5 G5:1 | G5:2 E5:1 |" +
      "D5:.5 C5:.5 D5:.5 E5:.5 F5:1 | F5:2 D5:1 | E5:1 C5:1 A4:1 | B4:2 C5:1 |" +
      "A5:1 F5:1 C5:1 | D5:2 E5:1 | G5:1 E5:1 C5:1 | G#4:2 B4:1 |" +
      "A4:1 C5:1 E5:1 | F5:1 A5:1 C6:1 | B5:2 A5:1 | G5:3 |",
    // Bars (1-based, inclusive ranges) that get the eighth-note arpeggio
    arpeggioBars: [[17, 32]],
    gain: 1,
  },

  // "Frostbite": the Berry Mountains theme. A brisk 4/4 in A minor with
  // a walking triangle bass and off-beat stabs, cold and determined.
  // The B section runs in eighths over a glittering arpeggio.
  Frostbite: {
    bpm: 138,
    beatsPerBar: 4,
    sampleRate: 22050,
    drive: true,
    gain: 1,
    chords: [
      ["A2", "min"], ["A2", "min"], ["F2", "maj"], ["F2", "maj"],
      ["C3", "maj"], ["C3", "maj"], ["G2", "maj"], ["G2", "maj"],
      ["A2", "min"], ["A2", "min"], ["F2", "maj"], ["F2", "maj"],
      ["E2", "maj"], ["E2", "maj"], ["A2", "min"], ["A2", "min"],
      ["D2", "min"], ["D2", "min"], ["A2", "min"], ["A2", "min"],
      ["F2", "maj"], ["F2", "maj"], ["E2", "maj"], ["E2", "maj"],
      ["D2", "min"], ["D2", "min"], ["F2", "maj"], ["F2", "maj"],
      ["G2", "maj"], ["G2", "maj"], ["E2", "maj"], ["E2", "maj"],
    ],
    melody:
      "A4:1 C5:1 E5:1 D5:1 | C5:2 A4:2 | F4:1 A4:1 C5:1 D5:1 | C5:3 r:1 |" +
      "E5:1 G5:1 E5:1 C5:1 | D5:2 B4:2 | G4:1 B4:1 D5:1 E5:1 | D5:4 |" +
      "A4:1 C5:1 E5:1 A5:1 | G5:2 E5:2 | F5:1 E5:1 D5:1 C5:1 | D5:3 r:1 |" +
      "E5:1 D5:1 C5:1 B4:1 | G#4:2 B4:2 | C5:1 B4:1 A4:1 G#4:1 | A4:4 |" +
      "D5:.5 E5:.5 F5:.5 E5:.5 D5:1 A4:1 | F5:2 E5:2 | C5:.5 D5:.5 E5:.5 D5:.5 C5:1 A4:1 | E5:3 r:1 |" +
      "A5:.5 G5:.5 F5:.5 E5:.5 F5:1 D5:1 | F5:2 A5:2 | G#5:.5 F5:.5 E5:.5 D5:.5 E5:1 B4:1 | E5:4 |" +
      "D5:1 F5:1 A5:1 F5:1 | E5:2 C5:2 | F5:1 A5:1 C6:1 A5:1 | G5:3 r:1 |" +
      "B4:1 D5:1 G5:1 B5:1 | A5:2 G5:2 | E5:.5 F5:.5 G#5:.5 B5:.5 E6:1 B5:1 | G#5:1 B5:1 E5:2 |",
    arpeggioBars: [[17, 32]],
  },
};

const CHIPTUNE = {
  noteToMidi(name) {
    const m = /^([A-G])(#?)(-?\d)$/.exec(name);
    if (!m) return null;
    const base = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }[m[1]];
    return 12 * (parseInt(m[3], 10) + 1) + base + (m[2] ? 1 : 0);
  },
  midiToHz(n) {
    return 440 * Math.pow(2, (n - 69) / 12);
  },
  chordTones(root, quality) {
    const r = CHIPTUNE.noteToMidi(root);
    return quality === "min" ? [r, r + 3, r + 7] : [r, r + 4, r + 7];
  },

  parseMelody(str) {
    const events = [];
    let beat = 0;
    str.split("|").forEach((bar) => {
      bar.trim().split(/\s+/).filter(Boolean).forEach((tok) => {
        const [note, len] = tok.split(":");
        const beats = parseFloat(len);
        if (note !== "r") events.push({ midi: CHIPTUNE.noteToMidi(note), beat, beats });
        beat += beats;
      });
    });
    return events;
  },

  // Returns a Promise<AudioBuffer>
  render(song) {
    const sr = song.sampleRate || 22050;
    const beatSec = 60 / song.bpm;
    const bars = song.chords.length;
    const total = bars * song.beatsPerBar * beatSec;
    const ctx = new OfflineAudioContext(1, Math.ceil(total * sr), sr);
    const master = ctx.createGain();
    master.gain.value = song.gain || 0.8;
    master.connect(ctx.destination);

    const tone = (type, midi, t0, dur, vol, opts = {}) => {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = CHIPTUNE.midiToHz(midi);
      const g = ctx.createGain();
      const a = opts.attack || 0.004;
      const rel = opts.release || 0.03;
      const sus = opts.sustain === undefined ? 0.75 : opts.sustain;
      g.gain.setValueAtTime(0, t0);
      g.gain.linearRampToValueAtTime(vol, t0 + a);
      g.gain.linearRampToValueAtTime(vol * sus, t0 + Math.min(dur * 0.5, 0.08));
      g.gain.setValueAtTime(vol * sus, Math.max(t0 + a, t0 + dur - rel));
      g.gain.linearRampToValueAtTime(0, t0 + dur);
      if (opts.vibrato) {
        const lfo = ctx.createOscillator();
        lfo.frequency.value = 5.6;
        const depth = ctx.createGain();
        depth.gain.value = opts.vibrato; // cents
        lfo.connect(depth);
        depth.connect(osc.detune);
        lfo.start(t0);
        lfo.stop(t0 + dur);
      }
      osc.connect(g);
      g.connect(master);
      osc.start(t0);
      osc.stop(t0 + dur + 0.01);
    };

    // Noise buffer for the hat
    const noiseLen = Math.floor(sr * 0.05);
    const noise = ctx.createBuffer(1, noiseLen, sr);
    const nd = noise.getChannelData(0);
    for (let i = 0; i < noiseLen; i++) nd[i] = Math.random() * 2 - 1;
    const hat = (t0, vol) => {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 6000;
      const g = ctx.createGain();
      g.gain.setValueAtTime(vol, t0);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.04);
      src.connect(hp);
      hp.connect(g);
      g.connect(master);
      src.start(t0);
      src.stop(t0 + 0.05);
    };

    const inArp = (bar) => (song.arpeggioBars || []).some(([a, b]) => bar >= a && bar <= b);

    // Accompaniment. "drive" songs get a walking bass on every beat,
    // stabs on the off-beats and a hat on every eighth; the default is
    // the waltz oom-pah-pah.
    song.chords.forEach(([root, quality], i) => {
      const tones = CHIPTUNE.chordTones(root, quality);
      const barT = i * song.beatsPerBar * beatSec;
      if (song.drive) {
        const walk = [tones[0] - 12, tones[0], tones[2] - 12, tones[0]];
        for (let b = 0; b < song.beatsPerBar; b++) {
          const t0 = barT + b * beatSec;
          tone("triangle", walk[b % walk.length], t0, beatSec * 0.9, b % 2 === 0 ? 0.42 : 0.3, { sustain: 0.8, release: 0.05 });
          if (b % 2 === 1) tones.forEach((m) => tone("square", m + 12, t0, beatSec * 0.4, 0.055, { sustain: 0.6 }));
          hat(t0, 0.1);
          hat(t0 + beatSec * 0.5, 0.05);
        }
        if (inArp(i + 1)) {
          const pattern = [0, 1, 2, 1, 0, 1, 2, 1];
          pattern.forEach((p, k) => {
            const t0 = barT + k * beatSec * 0.5;
            tone("square", tones[p] + 24, t0, beatSec * 0.26, 0.035, { sustain: 0.5 });
          });
        }
        return;
      }
      // Beat 1: deep triangle root, plus a soft octave thump
      tone("triangle", tones[0] - 12, barT, beatSec * 0.95, 0.42, { sustain: 0.8, release: 0.05 });
      tone("triangle", tones[0], barT, beatSec * 0.3, 0.18);
      // Beats 2 and 3: staccato chord stabs an octave up, with a hat tick
      for (let b = 1; b < song.beatsPerBar; b++) {
        const t0 = barT + b * beatSec;
        tones.forEach((m) => tone("square", m + 12, t0, beatSec * 0.42, 0.055, { sustain: 0.6 }));
        hat(t0, 0.09);
      }
      // B section lift: skipping eighth-note arpeggio
      if (inArp(i + 1)) {
        const pattern = [0, 1, 2, 1, 2, 0];
        pattern.forEach((p, k) => {
          const t0 = barT + k * beatSec * 0.5;
          tone("square", tones[p] + 24, t0, beatSec * 0.28, 0.035, { sustain: 0.5 });
        });
      }
    });

    // Lead
    CHIPTUNE.parseMelody(song.melody).forEach((ev) => {
      const t0 = ev.beat * beatSec;
      const dur = ev.beats * beatSec * 0.92;
      tone("square", ev.midi, t0, dur, 0.17, { vibrato: ev.beats >= 2 ? 9 : 4, sustain: 0.7 });
      // Faint echo an octave down for body
      tone("triangle", ev.midi - 12, t0, dur, 0.09, { sustain: 0.7 });
    });

    return ctx.startRendering();
  },

  // Render every song and register it with Phaser's audio cache.
  // Resolves when all are in (callers should still check cache.exists).
  install(scene) {
    const sm = scene.sound;
    if (!sm || !sm.context || typeof OfflineAudioContext === "undefined") return Promise.resolve();
    const jobs = Object.keys(CHIPTUNE_SONGS).map((key) => {
      if (scene.cache.audio.exists(key)) return Promise.resolve();
      return CHIPTUNE.render(CHIPTUNE_SONGS[key])
        .then((buffer) => {
          if (!scene.cache.audio.exists(key)) scene.cache.audio.add(key, buffer);
        })
        .catch((err) => console.warn("chiptune render failed", key, err));
    });
    return Promise.all(jobs);
  },
};
