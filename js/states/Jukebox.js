// JAMS PLAYER — the sound-test jukebox, unlocked by finding every Lost
// Jam. Spin the record, pick a track, and let the chiptune play.
class Jukebox extends Phaser.Scene {
  constructor() {
    super({ key: "Jukebox" });
  }

  create() {
    this.sound.stopAll();
    this.cameras.main.setBackgroundColor("#120a1c");
    this.cameras.main.fadeIn(400, 0, 0, 0);
    if (typeof LostRecord !== "undefined") LostRecord.ensureTextures(this);

    const cx = this.cameras.main.centerX;

    this.tracks = [
      { key: "Jammed", name: "JAMMED", sub: "TITLE THEME" },
      { key: "Level1MusicLoop", name: "SURF'S UP", sub: "LOS JAMGELES / SUNSET MESA" },
      { key: "BossBattle", name: "BOSS BATTLE", sub: "THE THEATER / THE JAM WORKS" },
      { key: "CloudWaltz", name: "CLOUD WALTZ", sub: "CLOUD NINE" },
      { key: "Frostbite", name: "FROSTBITE", sub: "THE BERRY MOUNTAINS / FROSTBITE FALLS" },
      { key: "DeepPreserve", name: "DEEP PRESERVE", sub: "THE PRESERVE MINES" },
    ];
    this.selected = 0;
    this.current = null;
    // The code-written tracks render in the background at preload. If
    // one isn't in yet, its row says so and fills in when it lands.
    if (typeof CHIPTUNE !== "undefined") CHIPTUNE.install(this).then(() => this._refreshSubs());

    this.add.bitmapText(cx, 16, "tempFont", "JAMS PLAYER", 18).setOrigin(0.5, 0).setTintFill(0xff6a9a);
    this.add
      .bitmapText(cx, 36, "tempFont", "EVERY LOST JAM FOUND - ENJOY THE SET", 8)
      .setOrigin(0.5, 0)
      .setTintFill(0xffd066);

    // Turntable
    this.platter = this.add.circle(96, 130, 46, 0x1a1424).setStrokeStyle(2, 0x3a2848);
    this.record = this.add.image(96, 130, "lost-record").setScale(4.4);
    this.add.circle(96, 130, 4, 0x2e2838);
    this.arm = this.add.rectangle(150, 98, 4, 52, 0xb8c2da).setOrigin(0.5, 0).setAngle(-28);

    // VU bars under the turntable
    this.bars = [];
    for (let i = 0; i < 12; i++) {
      const b = this.add.rectangle(52 + i * 8, 206, 6, 4, 0x8ce070).setOrigin(0.5, 1);
      this.bars.push(b);
    }

    // Track list (five rows fit between the header and the hint)
    this.rows = this.tracks.map((t, i) => {
      const y = 54 + i * 26;
      const name = this.add.bitmapText(196, y, "tempFont", t.name, 12).setTintFill(0xffffff);
      const sub = this.add.bitmapText(196, y + 14, "tempFont", this._subFor(t), 8).setTintFill(0x8a7a92);
      const cursor = this.add.bitmapText(184, y, "tempFont", ">", 12).setTintFill(0xffd066);
      const zone = this.add.zone(300, y + 10, 220, 30).setInteractive({ useHandCursor: true });
      zone.on("pointerdown", () => {
        if (this.selected === i) this.play();
        else {
          this.selected = i;
          this.refresh();
        }
      });
      return { name, sub, cursor };
    });

    this.hint = this.add
      .bitmapText(cx, 226, "tempFont", isTouchDevice() ? "TAP A TRACK TWICE TO PLAY - TAP HERE TO EXIT" : "W/S PICK - SPACE PLAY - E/ESC BACK", 8)
      .setOrigin(0.5)
      .setTintFill(0x8a7a92)
      .setInteractive(new Phaser.Geom.Rectangle(-120, -8, 240, 16), Phaser.Geom.Rectangle.Contains);
    this.hint.on("pointerdown", () => {
      if (isTouchDevice()) this.exit();
    });

    const kb = this.input.keyboard;
    onKeys(addKeys(kb, ["W", "UP"]), "down", () => this.move(-1), this);
    onKeys(addKeys(kb, ["S", "DOWN"]), "down", () => this.move(1), this);
    onKeys(addKeys(kb, ["SPACE", "ENTER"]), "down", () => this.play(), this);
    onKeys(addKeys(kb, controls.pause), "down", () => this.exit(), this);
    onKeys(addKeys(kb, ["G"]), "down", () => this.exit(), this);

    this.refresh();
    this.play();
  }

  _ready(t) {
    return this.cache.audio.exists(t.key);
  }

  _subFor(t) {
    return this._ready(t) ? t.sub : "RENDERING...";
  }

  _refreshSubs() {
    if (!this.rows || !this.sys || !this.sys.isActive()) return;
    this.rows.forEach((r, i) => {
      const txt = this._subFor(this.tracks[i]);
      if (r.sub.text !== txt) r.sub.setText(txt);
    });
  }

  move(d) {
    this.selected = Phaser.Math.Wrap(this.selected + d, 0, this.tracks.length);
    this.refresh();
  }

  refresh() {
    this.rows.forEach((r, i) => {
      const on = i === this.selected;
      r.cursor.setVisible(on);
      r.name.setTintFill(on ? 0xffd066 : 0xffffff);
    });
  }

  play() {
    const t = this.tracks[this.selected];
    if (!this._ready(t)) {
      // Not rendered yet: kick the render and play when it lands
      if (typeof CHIPTUNE !== "undefined" && !this._pending) {
        this._pending = true;
        CHIPTUNE.install(this).then(() => {
          this._pending = false;
          this._refreshSubs();
          if (this.sys && this.sys.isActive() && this.tracks[this.selected] === t && this._ready(t)) this.play();
        });
      }
      return;
    }
    this.sound.stopAll();
    this.current = this.sound.add(t.key, { loop: true, volume: 0.9 });
    this.current.play();
    this.sound.play("antTokenCollectSound", { volume: 0.4, rate: 1.3 });
    this.tweens.add({ targets: this.arm, angle: -12, duration: 300 });
  }

  update(time) {
    this.record.angle += 1.6;
    if (time > (this._nextSubCheck || 0)) {
      this._nextSubCheck = time + 500;
      this._refreshSubs();
    }
    const playing = this.current && this.current.isPlaying;
    this.bars.forEach((b, i) => {
      const h = playing ? 4 + Math.abs(Math.sin(time / 90 + i * 0.7)) * (12 + (i % 3) * 8) : 4;
      b.height = h;
      b.setFillStyle(h > 22 ? 0xff6a9a : h > 12 ? 0xffd066 : 0x8ce070);
    });
  }

  exit() {
    if (this._leaving) return;
    this._leaving = true;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.sound.stopAll();
      this.scene.start("TitleScreen");
    });
  }
}
