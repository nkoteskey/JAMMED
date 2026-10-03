class EndCredits extends Phaser.Scene {
  constructor() {
    super({ key: "EndCredits" });
  }

  init() {
    scene = this;
  }

  create() {
    this.fadeTime = 3000;
    this._restarting = false;

    // Whatever stage music was playing must not overlap the credits song
    this.sound.stopAll();
    this.bgMusic = this.sound.add("Level1MusicLoop", { loop: true, volume: 0.9 });
    this.bgMusic.play();

    this.cameras.main.setBackgroundColor("#000000");
    this.cameras.main.fadeIn(600, 0, 0, 0);

    this.awardStatements = [
      "Good try! Next time, try collecting the Bread Tokens.",
      "Good try! Next time, try collecting more Bread Tokens.",
      "Not bad! Next time, try collecting all the Bread Tokens.",
      "Pretty Good! Next time, try collecting all the Bread Tokens.",
      "Excellent! You were just a few Bread Tokens shy of perfection.",
      "Superb! You are a Jammed Master!",
    ];

    this.textBlocks = [
      { topLine: "Executive Producer", bottomLine: "Nicholas Koteskey" },
      { topLine: "Producer", bottomLine: "Jim Kulakowski" },
      { topLine: "Programmers\n", bottomLine: " Dustin McMurry \n Jim Kulakowski" },
      {
        topLine: "Level Design\n\n",
        bottomLine: "\nNicholas Koteskey \n  Jim Kulakowski \n  Dustin McMurry",
      },
      { topLine: "Music Composer / Sound Engineer", bottomLine: "Jim Kulakowski" },
      { topLine: "Artist", bottomLine: "Jim Kulakowski" },
      { topLine: "Storyboard Art", bottomLine: "Nicholas Koteskey" },
      { topLine: "Baron Pectin will return in", bottomLine: "WORLD 2: THE BERRY MOUNTAINS" },
      { topLine: "Coming soon from the JAMS crew", bottomLine: "SUPER JAMMED - A 16-BIT SEQUEL" },
    ];

    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    this.textTopLine = this.add.bitmapText(centerX, centerY - 8, "8-bit-mono", "", 12).setOrigin(0.5).setAlpha(0);
    this.textBottomLine = this.add.bitmapText(centerX, centerY + 8, "8-bit-mono", "", 12).setOrigin(0.5).setAlpha(0);

    this.skipHint = this.add
      .bitmapText(
        this.cameras.main.width - 6,
        this.cameras.main.height - 4,
        "tempFont",
        isTouchDevice() ? "TAP TO SKIP" : "PRESS ANY KEY TO SKIP",
        8
      )
      .setOrigin(1, 1)
      .setTintFill(0xffffff)
      .setAlpha(0);

    // Save: the game has been cleared (unlocks hard mode)
    const run = getRunState();
    const save = loadSave();
    save.cleared = true;
    save.hardUnlocked = true;
    if (run && run.hard) save.hardCleared = true;
    commitSave();

    this.showResults(() => this.nameEntry(() => this.rollCredits()));
  }

  _score() {
    const ui = this.scene.get("UIScene");
    return ui && typeof ui.newScore === "number" ? Math.round(ui.newScore) : 0;
  }

  // Run report card: score, tokens, deaths, time, rank
  showResults(onDone) {
    const cx = this.cameras.main.centerX;
    const run = getRunState() || {};
    const tally = getTokenTally();
    const score = this._score();
    const deaths = run.deaths || 0;
    const totalMs = run.startTime ? Date.now() - run.startTime : 0;
    const jamsThisRun = LOST_JAM_IDS.filter((id) => loadSave().lostJams[id]).length;

    const items = [];
    const line = (y, text, size, color, origin = 0.5) =>
      items.push(this.add.bitmapText(cx, y, "tempFont", text, size).setOrigin(origin, 0.5).setTintFill(color));

    line(28, run.hard ? "HARD MODE CLEARED!" : "THE CITY IS SAVED!", 16, 0xffd877);
    line(50, "SCORE  " + score, 12, 0xffffff);

    const frac = tally.total > 0 ? tally.got / tally.total : 0;
    const rows = [
      ["BREAD TOKENS", tally.got + " / " + tally.total, frac >= 1 ? 0x8ce070 : 0xffffff],
      ["LOST JAMS", jamsThisRun + " / " + LOST_JAM_IDS.length, jamsThisRun >= LOST_JAM_IDS.length ? 0x8ce070 : 0xffffff],
      ["DEATHS", String(deaths), deaths === 0 ? 0x8ce070 : 0xffffff],
      ["TIME", formatTime(totalMs), 0xffffff],
      ["SECRET EXIT", run.secretExits ? "FOUND" : "MISSED", run.secretExits ? 0x8ce070 : 0x8a7a92],
    ];
    rows.forEach(([k, v, c], i) => {
      const y = 74 + i * 14;
      items.push(this.add.bitmapText(cx - 90, y, "tempFont", k, 9).setOrigin(0, 0.5).setTintFill(0xc0b0c8));
      items.push(this.add.bitmapText(cx + 90, y, "tempFont", v, 9).setOrigin(1, 0.5).setTintFill(c));
    });

    // Rank
    let pts = frac * 50;
    pts += deaths === 0 ? 30 : Math.max(0, 30 - deaths * 6);
    pts += run.secretExits ? 10 : 0;
    pts += jamsThisRun >= LOST_JAM_IDS.length ? 10 : (jamsThisRun / LOST_JAM_IDS.length) * 6;
    if (run.hard) pts += 8;
    const rank = pts >= 92 ? "S" : pts >= 76 ? "A" : pts >= 58 ? "B" : pts >= 38 ? "C" : "D";
    const rankColor = { S: 0xffd066, A: 0x8ce070, B: 0x8ec4d8, C: 0xffffff, D: 0x8a7a92 }[rank];
    items.push(this.add.bitmapText(cx + 150, 110, "tempFont", "RANK", 9).setOrigin(0.5).setTintFill(0xc0b0c8));
    const rankText = this.add.bitmapText(cx + 150, 136, "tempFont", rank, 36).setOrigin(0.5).setTintFill(rankColor);
    items.push(rankText);

    let idx = 0;
    if (tally.got === 0) idx = 0;
    else if (frac < 0.35) idx = 1;
    else if (frac < 0.6) idx = 2;
    else if (frac < 0.85) idx = 3;
    else if (frac < 1) idx = 4;
    else idx = 5;
    items.push(
      this.add
        .bitmapText(cx, 170, "8-bit-mono", this.awardStatements[idx], 12)
        .setOrigin(0.5)
        .setMaxWidth(360)
        .setTint(0xd8f878)
    );
    if (!run.hard) {
      line(206, "HARD MODE UNLOCKED ON THE TITLE SCREEN", 8, 0xff6a9a);
    }

    items.forEach((it) => it.setAlpha(0));
    this.tweens.add({ targets: items, alpha: 1, duration: 800 });
    this.tweens.add({ targets: rankText, scaleX: { from: 3, to: 1 }, scaleY: { from: 3, to: 1 }, delay: 800, duration: 350, ease: "Back.easeOut" });
    this.time.delayedCall(1200, () => this.sound.play("powerUpSound", { volume: 0.7 }));

    const proceed = () => {
      if (this._resultsDone) return;
      this._resultsDone = true;
      this.tweens.add({
        targets: items,
        alpha: 0,
        duration: 600,
        onComplete: () => {
          items.forEach((it) => it.destroy());
          onDone();
        },
      });
    };
    this.time.delayedCall(7000, proceed);
    this.time.delayedCall(1500, () => {
      this.input.once("pointerdown", proceed);
      this.input.keyboard.once("keydown", proceed);
    });
  }

  // Arcade initials entry for a top-10 score
  nameEntry(onDone) {
    const score = this._score();
    if (!qualifiesForHighScore(score)) {
      onDone();
      return;
    }
    const cx = this.cameras.main.centerX;
    const run = getRunState() || {};
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789";
    const slots = [0, 0, 0];
    let cur = 0;
    const items = [];
    items.push(this.add.bitmapText(cx, 60, "tempFont", "NEW HIGH SCORE!", 16).setOrigin(0.5).setTintFill(0xffd066));
    items.push(this.add.bitmapText(cx, 84, "tempFont", String(score), 12).setOrigin(0.5).setTintFill(0xffffff));
    items.push(this.add.bitmapText(cx, 104, "tempFont", "ENTER YOUR INITIALS", 8).setOrigin(0.5).setTintFill(0xc0b0c8));
    const slotTexts = slots.map((_, i) =>
      this.add.bitmapText(cx - 30 + i * 30, 136, "tempFont", "A", 24).setOrigin(0.5).setTintFill(0xffffff)
    );
    items.push(...slotTexts);
    const upArrows = slots.map((_, i) =>
      this.add.bitmapText(cx - 30 + i * 30, 112, "tempFont", "^", 10).setOrigin(0.5).setTintFill(0xffd066)
    );
    const downArrows = slots.map((_, i) =>
      this.add.bitmapText(cx - 30 + i * 30, 162, "tempFont", "v", 10).setOrigin(0.5).setTintFill(0xffd066)
    );
    items.push(...upArrows, ...downArrows);
    const okText = this.add.bitmapText(cx, 190, "tempFont", "[ OK ]", 12).setOrigin(0.5).setTintFill(0x8ce070);
    items.push(okText);
    items.push(
      this.add
        .bitmapText(cx, 212, "tempFont", isTouchDevice() ? "TAP ARROWS - TAP OK TO CONFIRM" : "W/S LETTER - A/D SLOT - SPACE CONFIRM", 8)
        .setOrigin(0.5)
        .setTintFill(0x8a7a92)
    );

    const refresh = () => {
      slotTexts.forEach((t, i) => {
        t.setText(letters[slots[i]]);
        t.setTintFill(i === cur ? 0xffd066 : 0xffffff);
      });
      upArrows.forEach((a, i) => a.setVisible(i === cur));
      downArrows.forEach((a, i) => a.setVisible(i === cur));
    };
    const change = (d) => {
      slots[cur] = Phaser.Math.Wrap(slots[cur] + d, 0, letters.length);
      this.sound.play("antTokenCollectSound", { volume: 0.25, rate: 1.8 });
      refresh();
    };
    const moveSlot = (d) => {
      cur = Phaser.Math.Clamp(cur + d, 0, 2);
      refresh();
    };
    let done = false;
    const confirm = () => {
      if (done) return;
      done = true;
      const name = slots.map((s) => letters[s]).join("");
      const rank = recordHighScore(name, score, run.hard ? "HARD" : "CLEAR");
      this.sound.play("powerUpSound", { volume: 0.8, rate: 1.2 });
      items.push(
        this.add
          .bitmapText(cx, 236, "tempFont", "RANK #" + (rank + 1) + " ON THE BOARD", 8)
          .setOrigin(0.5, 1)
          .setTintFill(0xffd066)
      );
      keys.forEach((k) => k.destroy());
      this.time.delayedCall(1400, () => {
        this.tweens.add({
          targets: items,
          alpha: 0,
          duration: 500,
          onComplete: () => {
            items.forEach((it) => it.destroy());
            onDone();
          },
        });
      });
    };

    const kb = this.input.keyboard;
    const keys = [];
    const bind = (names, fn) => {
      const ks = addKeys(kb, names);
      ks.forEach((k) => k.on("down", fn));
      keys.push(...ks);
    };
    bind(["W", "UP"], () => change(1));
    bind(["S", "DOWN"], () => change(-1));
    bind(["A", "LEFT"], () => moveSlot(-1));
    bind(["D", "RIGHT"], () => moveSlot(1));
    bind(["SPACE", "ENTER"], () => (cur < 2 ? moveSlot(1) : confirm()));

    // Touch: tap arrows / letters / OK
    slotTexts.forEach((t, i) => {
      t.setInteractive(new Phaser.Geom.Rectangle(-12, -14, 24, 28), Phaser.Geom.Rectangle.Contains);
      t.on("pointerdown", () => {
        cur = i;
        refresh();
      });
    });
    upArrows.forEach((a, i) => {
      a.setInteractive(new Phaser.Geom.Rectangle(-12, -10, 24, 20), Phaser.Geom.Rectangle.Contains);
      a.on("pointerdown", () => {
        cur = i;
        change(1);
      });
    });
    downArrows.forEach((a, i) => {
      a.setInteractive(new Phaser.Geom.Rectangle(-12, -10, 24, 20), Phaser.Geom.Rectangle.Contains);
      a.on("pointerdown", () => {
        cur = i;
        change(-1);
      });
    });
    okText.setInteractive(new Phaser.Geom.Rectangle(-30, -10, 60, 20), Phaser.Geom.Rectangle.Contains);
    okText.on("pointerdown", confirm);
    refresh();
  }

  rollCredits() {
    this.skipHint.setAlpha(0.5);
    this.textBlockIndex = 0;
    this.textTopLine.setText(this.textBlocks[0].topLine);
    this.textBottomLine.setText(this.textBlocks[0].bottomLine);

    this.input.once("pointerdown", () => this.restartGame());
    this.input.keyboard.once("keydown", () => this.restartGame());

    this.textTween = this.tweens.add({
      targets: this.textTopLine,
      alpha: 1,
      duration: this.fadeTime,
      yoyo: true,
      repeat: -1,
      ease: "Cubic",
      callbackScope: this,
      onRepeat: function () {
        this.textBlockIndex++;
        if (this.textBlockIndex > this.textBlocks.length - 1) {
          this.textBlockIndex = 0;
          this.restartGame();
          return;
        }
        const block = this.textBlocks[this.textBlockIndex];
        this.textTopLine.setText(block.topLine);
        this.textBottomLine.setText(block.bottomLine);
        // The sequel tease gets its own colour
        const tease = this.textBlockIndex >= this.textBlocks.length - 2;
        this.textTopLine.setTint(tease ? 0xff6a9a : 0xffffff);
        this.textBottomLine.setTint(tease ? 0xffd066 : 0xffffff);
      },
    });
    this.bottomTextTween = this.tweens.add({
      targets: [this.textBottomLine],
      alpha: 1,
      duration: this.fadeTime,
      ease: "Cubic",
      yoyo: true,
      repeat: -1,
    });
  }

  restartGame() {
    if (this._restarting) return;
    this._restarting = true;
    if (this.bottomTextTween) this.bottomTextTween.stop();
    if (this.textTween) this.textTween.stop();
    this.tweens.add({ targets: this.bgMusic, volume: 0, duration: 1000, ease: "Cubic" });
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.sound.stopAll();
      if (this.scene.isActive("UIScene")) this.scene.stop("UIScene");
      this.scene.start("TitleScreen");
    });
  }
}
