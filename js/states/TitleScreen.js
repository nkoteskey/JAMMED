class TitleScreen extends Phaser.Scene {
  constructor() {
    super({ key: "TitleScreen" });
  }

  init() {
    scene = this;
  }

  create() {
    this._starting = false;
    this.menuOpen = false;
    this.scoresOpen = false;

    // A visit to the title screen always means a fresh run
    resetRunState();
    const save = loadSave();

    // Make sure nothing from the credits / a quit game keeps playing
    this.sound.stopAll();
    this.titleMusic = this.sound.add("Jammed", { loop: true, volume: 0.9 });
    this.titleMusic.play();

    const background = this.add.sprite(0, 0, "titleScreenBg");
    background.setOrigin(0, 0);

    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    const touch = isTouchDevice();
    const label = touch ? "TAP TO START" : "PRESS ANY KEY TO START";

    this.startTextShadow = this.add
      .bitmapText(centerX + 2, centerY + 2, "8-bit-mono", label, 15)
      .setOrigin(0.5)
      .setTint(0x000000);
    this.startText = this.add.bitmapText(centerX, centerY, "8-bit-mono", label, 15).setOrigin(0.5);
    this.blinkTween = this.tweens.add({
      targets: [this.startText, this.startTextShadow],
      alpha: 0,
      yoyo: true,
      repeat: -1,
      duration: 500,
      ease: "Linear",
    });

    // Bottom strip: Lost Jam collection + version
    if (typeof LostRecord !== "undefined") LostRecord.ensureTextures(this);
    this.add.bitmapText(8, 228, "tempFont", "LOST JAMS", 8).setTintFill(0xffd066).setAlpha(0.9);
    LOST_JAM_IDS.forEach((id, i) => {
      const found = !!save.lostJams[id];
      this.add
        .image(70 + i * 20, 232, found ? "lost-record-sleeve" : "lost-record")
        .setScale(0.8)
        .setAlpha(found ? 1 : 0.3);
    });
    this.add.bitmapText(418, 228, "tempFont", "V1.2", 8).setOrigin(1, 0).setTintFill(0xffffff).setAlpha(0.5);
    if (!touch) {
      this.add
        .bitmapText(centerX, 214, "tempFont", "A/D MOVE   SPACE JUMP   Q SHOOT   W AIM UP   E PAUSE", 8)
        .setOrigin(0.5)
        .setTintFill(0xffffff)
        .setAlpha(0.7);
    }

    // Overlays (built hidden)
    this._buildMenu(save);
    this._buildScores(save);

    // Attract mode: idle on the title and the high-score table rolls in
    this.attractTimer = this.time.addEvent({
      delay: 7000,
      loop: true,
      callback: () => {
        if (this.menuOpen || this._starting) return;
        this._setScores(!this.scoresOpen);
      },
    });

    this.input.on("pointerdown", (p) => this._anyInput(p));
    this.input.keyboard.on("keydown", (e) => this._anyInput(null, e));

    const kb = this.input.keyboard;
    onKeys(addKeys(kb, ["W", "UP"]), "down", () => this._move(-1), this);
    onKeys(addKeys(kb, ["S", "DOWN"]), "down", () => this._move(1), this);
    onKeys(addKeys(kb, ["SPACE", "ENTER", "Z", "K", "Q"]), "down", () => this._select(), this);
    onKeys(addKeys(kb, ["ESC"]), "down", () => this._back(), this);
  }

  // ------------------------------------------------------------------
  _anyInput(pointer, event) {
    if (this._starting) return;
    if (this.scoresOpen) {
      this._setScores(false);
      this.attractTimer.reset({ delay: 7000, loop: true, callback: this.attractTimer.callback });
      if (pointer) return;
    }
    if (!this.menuOpen) {
      this._openMenu();
      return;
    }
    // Menu open: pointer taps are handled by the item zones
  }

  _buildMenu(save) {
    const cx = this.cameras.main.centerX;
    this.menuItems = [{ label: "START GAME", action: () => this.startGame(false) }];
    if (save.hardUnlocked) this.menuItems.push({ label: "HARD MODE", action: () => this.startGame(true) });
    if (allLostJamsFound()) this.menuItems.push({ label: "JAMS PLAYER", action: () => this._openJukebox() });
    this.menuItems.push({ label: "HIGH SCORES", action: () => this._setScores(true) });
    if (typeof STAGE_SELECT_ENABLED !== "undefined" && STAGE_SELECT_ENABLED) {
      this.menuItems.push({ label: "STAGE SELECT", action: () => this._openStageSelect() });
    }

    this.menuGroup = this.add.container(0, 0).setVisible(false).setDepth(10);
    const h = this.menuItems.length * 18 + 20;
    const panel = this.add.rectangle(cx, 150, 170, h, 0x000000, 0.75).setStrokeStyle(2, 0xffd877);
    this.menuGroup.add(panel);
    this.menuTexts = this.menuItems.map((it, i) => {
      const y = 150 - h / 2 + 16 + i * 18;
      const t = this.add.bitmapText(cx, y, "tempFont", it.label, 10).setOrigin(0.5).setTintFill(0xffffff);
      const zone = this.add.zone(cx, y, 160, 16).setInteractive({ useHandCursor: true });
      zone.on("pointerdown", () => {
        if (!this.menuOpen) return;
        this.selected = i;
        this._refreshMenu();
        this._select();
      });
      this.menuGroup.add(t);
      this.menuGroup.add(zone);
      return t;
    });
    this.cursor = this.add.bitmapText(cx - 70, 0, "tempFont", ">", 10).setOrigin(0.5).setTintFill(0xffd066);
    this.menuGroup.add(this.cursor);
    this.selected = 0;
  }

  _openMenu() {
    this.menuOpen = true;
    this.blinkTween.pause();
    this.startText.setAlpha(0);
    this.startTextShadow.setAlpha(0);
    this.menuGroup.setVisible(true);
    this._refreshMenu();
    this.sound.play("antTokenCollectSound", { volume: 0.4, rate: 1.4 });
  }

  _refreshMenu() {
    this.menuTexts.forEach((t, i) => {
      const on = i === this.selected;
      t.setTintFill(on ? 0xffd066 : 0xffffff);
      if (on) this.cursor.y = t.y;
    });
  }

  _move(d) {
    if (!this.menuOpen || this.scoresOpen) return;
    this.selected = Phaser.Math.Wrap(this.selected + d, 0, this.menuItems.length);
    this._refreshMenu();
    this.sound.play("antTokenCollectSound", { volume: 0.25, rate: 1.8 });
  }

  _select() {
    if (!this.menuOpen || this._starting) return;
    if (this.scoresOpen) {
      this._setScores(false);
      return;
    }
    this.menuItems[this.selected].action();
  }

  _back() {
    if (this.scoresOpen) this._setScores(false);
  }

  // ------------------------------------------------------------------
  _buildScores(save) {
    const cx = this.cameras.main.centerX;
    this.scoresGroup = this.add.container(0, 0).setVisible(false).setDepth(20);
    const panel = this.add.rectangle(cx, 120, 300, 200, 0x000000, 0.82).setStrokeStyle(2, 0xff6a9a);
    this.scoresGroup.add(panel);
    this.scoresGroup.add(
      this.add.bitmapText(cx, 30, "tempFont", "TOP JAMMERS", 14).setOrigin(0.5).setTintFill(0xff6a9a)
    );
    const rows = save.highScores.slice(0, 10);
    rows.forEach((r, i) => {
      const y = 50 + i * 15;
      const col = i === 0 ? 0xffd066 : 0xffffff;
      this.scoresGroup.add(
        this.add.bitmapText(cx - 130, y, "tempFont", (i + 1 < 10 ? " " : "") + (i + 1) + ".", 9).setTintFill(col)
      );
      this.scoresGroup.add(this.add.bitmapText(cx - 96, y, "tempFont", r.name, 9).setTintFill(col));
      this.scoresGroup.add(
        this.add.bitmapText(cx + 40, y, "tempFont", String(r.score), 9).setOrigin(1, 0).setTintFill(col)
      );
      this.scoresGroup.add(
        this.add.bitmapText(cx + 60, y, "tempFont", r.stage || "", 9).setTintFill(0x8a7a92)
      );
    });
    const best = save.bestTimes;
    const bestKeys = Object.keys(best);
    if (bestKeys.length) {
      const parts = bestKeys
        .filter((k) => STAGE_LABELS[k])
        .map((k) => STAGE_LABELS[k] + " " + formatTime(best[k]));
      this.scoresGroup.add(
        this.add
          .bitmapText(cx, 204, "tempFont", "BEST TIMES  " + parts.join("   "), 7)
          .setOrigin(0.5)
          .setTintFill(0x8ce070)
      );
    }
    const closeZone = this.add.zone(cx, 120, 300, 200).setInteractive();
    closeZone.on("pointerdown", () => this._setScores(false));
    this.scoresGroup.add(closeZone);

    // World board (online), filled in asynchronously when configured
    this.worldGroup = this.add.container(0, 0).setVisible(false).setDepth(20);
    if (typeof leaderboardEnabled === "function" && leaderboardEnabled()) {
      const wp = this.add.rectangle(cx, 120, 300, 200, 0x000000, 0.82).setStrokeStyle(2, 0x8ce070);
      this.worldGroup.add(wp);
      this.worldGroup.add(
        this.add.bitmapText(cx, 30, "tempFont", "WORLD TOP JAMMERS", 14).setOrigin(0.5).setTintFill(0x8ce070)
      );
      const loading = this.add.bitmapText(cx, 120, "tempFont", "LOADING...", 9).setOrigin(0.5).setTintFill(0x8a7a92);
      this.worldGroup.add(loading);
      fetchWorldScores(10).then((rows) => {
        if (!this.scene || !this.scene.isActive()) return;
        loading.setText(rows.length ? "" : "NO SCORES YET - BE THE FIRST");
        rows.forEach((r, i) => {
          const y = 50 + i * 15;
          const col = i === 0 ? 0xffd066 : 0xffffff;
          this.worldGroup.add(
            this.add.bitmapText(cx - 130, y, "tempFont", (i + 1 < 10 ? " " : "") + (i + 1) + ".", 9).setTintFill(col)
          );
          this.worldGroup.add(this.add.bitmapText(cx - 96, y, "tempFont", r.name, 9).setTintFill(col));
          this.worldGroup.add(
            this.add.bitmapText(cx + 40, y, "tempFont", String(r.score), 9).setOrigin(1, 0).setTintFill(col)
          );
          this.worldGroup.add(
            this.add.bitmapText(cx + 60, y, "tempFont", (r.hard ? "HARD" : r.stage) || "", 9).setTintFill(0x8a7a92)
          );
        });
      });
      const wz = this.add.zone(cx, 120, 300, 200).setInteractive();
      wz.on("pointerdown", () => this._setScores(false));
      this.worldGroup.add(wz);
    }
    this.scoresPage = 0;
  }

  _setScores(open) {
    this.scoresOpen = open;
    const hasWorld = this.worldGroup && this.worldGroup.length > 0;
    if (open && hasWorld) {
      // Alternate local / world each time the board opens
      this.scoresPage = (this.scoresPage + 1) % 2;
    }
    const showWorld = open && hasWorld && this.scoresPage === 1;
    this.scoresGroup.setVisible(open && !showWorld);
    if (this.worldGroup) this.worldGroup.setVisible(showWorld);
  }

  _openStageSelect() {
    if (this._starting) return;
    this._starting = true;
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.sound.stopAll();
      this.scene.start("StageSelect");
    });
  }

  _openJukebox() {
    if (this._starting) return;
    this._starting = true;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.sound.stopAll();
      this.scene.start("Jukebox");
    });
  }

  // ------------------------------------------------------------------
  startGame(hard) {
    if (this._starting) return;
    this._starting = true;
    const run = getRunState();
    if (run) {
      run.hard = !!hard;
      run.hp = hard ? 3 : 5;
      run.startTime = Date.now();
    }

    this.sound.play("startGameSound", { volume: 0.9 });
    this.menuGroup.setVisible(false);
    this.startText.setText(hard ? "HARD MODE" : "LET'S JAM!");
    this.startTextShadow.setText(hard ? "HARD MODE" : "LET'S JAM!");
    this.startText.setAlpha(1);
    this.startTextShadow.setAlpha(1);
    this.tweens.add({
      targets: [this.startText, this.startTextShadow],
      alpha: 0,
      yoyo: true,
      repeat: 4,
      duration: 80,
    });
    this.tweens.add({ targets: this.titleMusic, volume: 0, duration: 900 });
    this.cameras.main.fadeOut(900, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.sound.stopAll();
      // The HUD scene runs for the whole game; it hides itself over
      // cutscenes and shows itself over gameplay.
      if (this.scene.isActive("UIScene")) this.scene.stop("UIScene");
      this.scene.launch("UIScene", { score: 0, key: "Level1" });
      this.scene.bringToTop("UIScene");
      this.scene.start("CutScene1_1");
    });
  }
}
