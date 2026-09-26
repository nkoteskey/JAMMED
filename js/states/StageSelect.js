// Stage select — replaces the row of debug portals that used to
// clutter Level 1's opening screen. Keyboard (A/D/arrows + SPACE) and
// touch both work; every stage is listed with its act and subtitle.
class StageSelect extends Phaser.Scene {
  constructor() {
    super({ key: "StageSelect" });
  }

  create() {
    if (typeof Chip !== "undefined") Chip.play("title");

    const cx = this.cameras.main.centerX;

    this.add.rectangle(213, 120, 426, 240, 0x0d0a16);
    // Faint scanline wash so the menu sits in the same world as the game
    for (let y = 0; y < 240; y += 4) {
      this.add.rectangle(213, y, 426, 1, 0x1a1030, 0.5);
    }

    this.add.bitmapText(cx, 16, "tempFont", "STAGE SELECT", 16)
      .setOrigin(0.5).setTintFill(0xffd877);

    this.stages = [
      { key: "Level1",         act: "1-1", name: "CITY RUNAMUCK",   tint: 0xff77cc },
      { key: "Level1BossFight",act: "1-2", name: "WATERMELON BOSS", tint: 0xff6666 },
      { key: "Stage1_3",       act: "1-3", name: "SUNSET MESA",     tint: 0xffb86b },
      { key: "Stage1_4",       act: "1-4", name: "THE JAM WORKS",   tint: 0xff8fb3 },
      { key: "Stage2_1",       act: "2-1", name: "ORCHARD ROWS",    tint: 0x7fe8e0 },
      { key: "Stage2_2",       act: "2-2", name: "THE ARCHIVE",     tint: 0x9fd8e0 },
      { key: "Stage2_3",       act: "2-3", name: "COLD STORAGE",    tint: 0xa8e8ff },
      { key: "Stage3_1",       act: "3-1", name: "THE SILENT MOUND",tint: 0xffd877 },
      { key: "Stage3_2",       act: "3-2", name: "THE SIGNAL SPIRE",tint: 0xff9a9a },
      { key: "Stage4_1",       act: "4-1", name: "STADIUM OF LOVE",  tint: 0xff9ac0 },
      { key: "StageBeach",     act: "??",  name: "IS ANYBODY OUT THERE", tint: 0xfff0b0,
        locked: () => typeof AntSecret === "undefined" || !AntSecret.allFound(),
        lockedName: "??????????" },
      
    ];

    this.cursor = 0;
    this.rows = this.stages.map((s, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = 30 + col * 196;
      const y = 38 + row * 27;
      const box = this.add.rectangle(x + 90, y + 9, 184, 24, 0x1c1430);
      box.setStrokeStyle(1, 0x3a2a52);
      const isLocked = typeof s.locked === "function" && s.locked();
      const act = this.add.bitmapText(x + 6, y + 3, "tempFont", s.act, 12)
        .setTintFill(0x8a7a92);
      const nm = this.add.bitmapText(x + 44, y + 5, "tempFont",
        isLocked ? (s.lockedName || "???") : s.name, 8)
        .setTintFill(isLocked ? 0x5a4a62 : s.tint);
      box.setInteractive();
      box.on("pointerdown", () => {
        if (this.cursor === i) this._launch();
        else { this.cursor = i; this._refresh(); }
      });
      return { box, act, nm, s };
    });

    this.add.bitmapText(cx, 214, "tempFont", "A/D/W/S MOVE   SPACE START", 8)
      .setOrigin(0.5).setTintFill(0x8a7a92);
    const back = this.add.bitmapText(cx, 228, "tempFont", "ESC - BACK TO TITLE", 8)
      .setOrigin(0.5).setTintFill(0x6a5a72);
    back.setInteractive();
    back.on("pointerdown", () => this._back());

    this._refresh();

    const move = (d) => { this.cursor = Phaser.Math.Wrap(this.cursor + d, 0, this.stages.length); this._refresh(); };
    this.input.keyboard.on("keydown-A", () => move(-1));
    this.input.keyboard.on("keydown-LEFT", () => move(-1));
    this.input.keyboard.on("keydown-D", () => move(1));
    this.input.keyboard.on("keydown-RIGHT", () => move(1));
    this.input.keyboard.on("keydown-W", () => move(-2));
    this.input.keyboard.on("keydown-UP", () => move(-2));
    this.input.keyboard.on("keydown-S", () => move(2));
    this.input.keyboard.on("keydown-DOWN", () => move(2));
    this.input.keyboard.on("keydown-SPACE", () => this._launch());
    this.input.keyboard.on("keydown-ENTER", () => this._launch());
    this.input.keyboard.on("keydown-ESC", () => this._back());
  }

  _refresh() {
    this.rows.forEach((r, i) => {
      const on = i === this.cursor;
      r.box.setStrokeStyle(on ? 2 : 1, on ? 0xffd877 : 0x3a2a52);
      r.box.setFillStyle(on ? 0x2a1c44 : 0x1c1430);
      r.act.setTintFill(on ? 0xffffff : 0x8a7a92);
    });
  }

  _launch() {
    const s = this.stages[this.cursor];
    if (typeof s.locked === "function" && s.locked()) {
      this.sound.play("enemyHitSound", { volume: 0.15, rate: 0.4 });
      if (this._lockMsg) this._lockMsg.destroy();
      this._lockMsg = this.add.bitmapText(213, 200, "tempFont",
        `FIND ALL ${AntSecret.TOTAL} ANT TOKENS TO OPEN THIS`, 8)
        .setOrigin(0.5).setTintFill(0xbfa8ff);
      this.tweens.add({ targets: this._lockMsg, alpha: 0, delay: 1800,
        duration: 400, onComplete: () => { if (this._lockMsg) this._lockMsg.destroy(); this._lockMsg = null; } });
      return;
    }
    // Stage select is a playground: hand over the full guitar rack so
    // late stages are actually playable out of context.
    if (typeof getGuitarCollection === "function") {
      const coll = getGuitarCollection();
      Object.keys(GUITAR_CATALOG).forEach((id) => {
        if (!coll.owned.includes(id)) coll.owned.push(id);
      });
    }
    if (typeof game !== "undefined" && game) game.dukeFreed = true;
    this.scene.start(s.key);
    if (!this.scene.isActive("UIScene")) {
      this.scene.launch("UIScene", { score: 0, key: s.key });
    }
    this.scene.bringToTop("UIScene");
  }

  _back() {
    this.scene.start("TitleScreen");
  }
}
