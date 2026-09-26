// The duel mechanic, from the Trello "Fresh Ideas" card:
// "circles pressed in certain orders like guitar hero but side
// scrolling".
//
// Four horizontal lanes. Coloured note circles scroll RIGHT TO LEFT
// into a strike bar on the left — the same axis the rest of the game
// scrolls on. Hit them in time and the crowd swells and the boss
// takes the hit; miss and the crowd drains and he takes the round.
//
// Keys A S D F, and four on-screen pads so it plays on a phone.
class RhythmDuel {
  static LANE_COLORS = [0x4ade4a, 0xff4d4d, 0xffd24a, 0x4aa8ff];
  static LANE_KEYS = ["A", "S", "D", "F"];

  constructor(scn, opts = {}) {
    this.scn = scn;
    this.bpm = opts.bpm || 150;
    this.approachMs = opts.approachMs || 1900;   // note travel time
    this.hitX = opts.hitX || 84;
    this.spawnX = opts.spawnX || 452;
    this.laneY = opts.laneY || [126, 152, 178, 204];
    this.onHit = opts.onHit || (() => {});
    this.onMiss = opts.onMiss || (() => {});
    this.onComplete = opts.onComplete || (() => {});
    this.perfectMs = 78;
    this.goodMs = 150;

    this.notes = [];
    this.running = false;
    this.combo = 0;
    this.bestCombo = 0;
    this.hits = 0;
    this.misses = 0;
    this._keyObjs = [];
    this._pads = [];
    this._built = false;
  }

  // chart: [{ beat, lane }] — beat is in quarter notes from the start
  start(chart) {
    if (!this._built) this._buildUI();
    this.chart = chart.slice().sort((a, b) => a.beat - b.beat);
    const spb = 60000 / this.bpm;
    this.t0 = this.scn.time.now + 1500;   // lead-in
    this.notes = this.chart.map((n) => ({
      lane: n.lane,
      tHit: this.t0 + n.beat * spb,
      obj: null,
      judged: false,
    }));
    this.running = true;
    this.finishAt = this.notes[this.notes.length - 1].tHit + 900;
  }

  _buildUI() {
    this._built = true;
    const s = this.scn;
    this.layer = s.add.container(0, 0).setScrollFactor(0).setDepth(320);

    // Lane rails
    this.laneY.forEach((y, i) => {
      const rail = s.add.rectangle(213, y, 426, 20,
        RhythmDuel.LANE_COLORS[i], 0.07).setScrollFactor(0);
      const line = s.add.rectangle(213, y + 11, 426, 1, 0xffffff, 0.10)
        .setScrollFactor(0);
      this.layer.add([rail, line]);
    });

    // Strike bar
    const bar = s.add.rectangle(this.hitX, (this.laneY[0]+this.laneY[3])/2, 5,
      this.laneY[3]-this.laneY[0]+26, 0xffffff, 0.55)
      .setScrollFactor(0);
    this.layer.add(bar);
    this.targets = this.laneY.map((y, i) => {
      const ring = s.add.circle(this.hitX, y, 12, 0x000000, 0.45)
        .setScrollFactor(0);
      ring.setStrokeStyle(2, RhythmDuel.LANE_COLORS[i], 0.9);
      this.layer.add(ring);
      return ring;
    });

    // Touch pads — same colours, bottom of the screen
    if (s.sys.game.device.input.touch) {
      this.laneY.forEach((y, i) => {
        const pad = s.add.circle(26 + i * 34, 230, 14,
          RhythmDuel.LANE_COLORS[i], 0.32).setScrollFactor(0);
        pad.setStrokeStyle(2, RhythmDuel.LANE_COLORS[i], 0.9);
        pad.setInteractive();
        pad.on("pointerdown", () => this._press(i));
        this.layer.add(pad);
        this._pads.push(pad);
      });
    }

    // Keyboard
    RhythmDuel.LANE_KEYS.forEach((k, i) => {
      const key = s.input.keyboard.addKey(k);
      const h = () => this._press(i);
      key.on("down", h);
      this._keyObjs.push({ key, h });
    });

    // Key hint under the strike bar
    this.laneY.forEach((y, i) => {
      const t = s.add.bitmapText(this.hitX, y, "tempFont",
        RhythmDuel.LANE_KEYS[i], 8)
        .setOrigin(0.5).setScrollFactor(0).setTintFill(0xffffff).setAlpha(0.8);
      this.layer.add(t);
    });

    this.comboText = s.add.bitmapText(213, 100, "tempFont", "", 10)
      .setOrigin(0.5).setScrollFactor(0).setDepth(322).setTintFill(0xffd24a);
    this.judgeText = s.add.bitmapText(this.hitX + 52, (this.laneY[0]+this.laneY[3])/2,
      "tempFont", "", 10)
      .setOrigin(0, 0.5).setScrollFactor(0).setDepth(322);
  }

  _press(lane) {
    if (!this.running) return;
    const now = this.scn.time.now;
    // Nearest unjudged note in this lane
    let best = null, bestDt = Infinity;
    for (const n of this.notes) {
      if (n.judged || n.lane !== lane) continue;
      const dt = Math.abs(now - n.tHit);
      if (dt < bestDt) { bestDt = dt; best = n; }
    }
    this._flashTarget(lane);
    if (!best || bestDt > this.goodMs) {
      // Stray press: breaks the combo but costs no health
      this.combo = 0;
      this._judge("...", 0x8a7a92);
      return;
    }
    best.judged = true;
    if (best.obj) {
      const o = best.obj;
      this.scn.tweens.add({
        targets: o, scale: 2.1, alpha: 0, duration: 190,
        onComplete: () => o.destroy(),
      });
      best.obj = null;
    }
    const perfect = bestDt <= this.perfectMs;
    this.hits++;
    this.combo++;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    this._judge(perfect ? "PERFECT" : "GOOD",
      perfect ? 0x4ade4a : 0xffd24a);
    this._spark(lane, perfect);
    this.onHit(perfect, this.combo);
  }

  _flashTarget(lane) {
    const ring = this.targets[lane];
    if (!ring) return;
    ring.setScale(1.35);
    this.scn.tweens.add({ targets: ring, scale: 1, duration: 130 });
  }

  _spark(lane, perfect) {
    const y = this.laneY[lane];
    for (let i = 0; i < (perfect ? 7 : 4); i++) {
      const p = this.scn.add.circle(this.hitX, y, 2,
        RhythmDuel.LANE_COLORS[lane], 0.95).setScrollFactor(0).setDepth(324);
      const a = Math.random() * Math.PI * 2;
      this.scn.tweens.add({
        targets: p,
        x: this.hitX + Math.cos(a) * (14 + Math.random() * 18),
        y: y + Math.sin(a) * (10 + Math.random() * 14),
        alpha: 0, duration: 300, onComplete: () => p.destroy(),
      });
    }
  }

  _judge(text, color) {
    if (!this.judgeText) return;
    this.judgeText.setText(text);
    this.judgeText.setTintFill(color);
    this.judgeText.setAlpha(1);
    this.scn.tweens.add({ targets: this.judgeText, alpha: 0, delay: 260, duration: 240 });
    if (this.comboText) {
      this.comboText.setText(this.combo > 2 ? `${this.combo} IN A ROW` : "");
    }
  }

  update() {
    if (!this.running) return;
    const now = this.scn.time.now;
    const speed = (this.spawnX - this.hitX) / this.approachMs;

    for (const n of this.notes) {
      const dt = n.tHit - now;
      // Spawn once it's within travel range
      if (!n.obj && !n.judged && dt <= this.approachMs && dt > -400) {
        const c = this.scn.add.circle(this.spawnX, this.laneY[n.lane], 10,
          RhythmDuel.LANE_COLORS[n.lane], 1).setScrollFactor(0).setDepth(323);
        c.setStrokeStyle(2, 0xffffff, 0.85);
        n.obj = c;
      }
      if (n.obj) n.obj.x = this.hitX + dt * speed;
      // Past the window without a press
      if (!n.judged && dt < -this.goodMs) {
        n.judged = true;
        this.misses++;
        this.combo = 0;
        this._judge("MISS", 0xff4d4d);
        if (n.obj) {
          const o = n.obj;
          this.scn.tweens.add({
            targets: o, alpha: 0, duration: 200,
            onComplete: () => o.destroy(),
          });
          n.obj = null;
        }
        this.onMiss();
      }
    }

    if (now > this.finishAt) {
      this.running = false;
      this.onComplete({
        hits: this.hits, misses: this.misses,
        bestCombo: this.bestCombo, total: this.notes.length,
      });
    }
  }

  setVisible(v) {
    if (this.layer) this.layer.setVisible(v);
    if (this.comboText) this.comboText.setVisible(v);
    if (this.judgeText) this.judgeText.setVisible(v);
  }

  destroy() {
    this.running = false;
    this.notes.forEach((n) => { if (n.obj) n.obj.destroy(); });
    this.notes = [];
    this._keyObjs.forEach(({ key, h }) => key.off("down", h));
    this._keyObjs = [];
    if (this.layer) this.layer.destroy();
    if (this.comboText) this.comboText.destroy();
    if (this.judgeText) this.judgeText.destroy();
  }

  // --- chart helpers --------------------------------------------------
  // Call-and-response: the Raisin plays a phrase, you play it back.
  static phrase(startBeat, lanes, step = 1) {
    return lanes.map((lane, i) => ({ beat: startBeat + i * step, lane }));
  }
}
