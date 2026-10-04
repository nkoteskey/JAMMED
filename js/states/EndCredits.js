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
      { topLine: "Programmers", bottomLine: "Dustin McMurry\nJim Kulakowski" },
      { topLine: "Level Design", bottomLine: "Nicholas Koteskey\nJim Kulakowski\nDustin McMurry" },
      { topLine: "Music Composer / Sound Engineer", bottomLine: "Jim Kulakowski" },
      { topLine: "Artist", bottomLine: "Jim Kulakowski" },
      { topLine: "Storyboard Art", bottomLine: "Nicholas Koteskey" },
      { topLine: "Starring", bottomLine: "Jammy, Blubert, the Watermelon,\nthe Canning Colossus, the Abominable Blueberry,\nCount Currant and Baron Pectin" },
      { topLine: "Baron Pectin will return in", bottomLine: "WORLD 3: THE GLASS ORCHARD" },
      { topLine: "Coming soon from the JAMS crew", bottomLine: "SUPER JAMMED - A 16-BIT SEQUEL" },
    ];

    // Credit blocks sit in the upper half: the title hangs above the
    // names line, and names with several lines grow downward from it,
    // so nothing overlaps. The Encore Jam plays out below.
    const centerX = this.cameras.main.centerX;
    this.textTopLine = this.add.bitmapText(centerX, 66, "8-bit-mono", "", 12).setOrigin(0.5, 1).setCenterAlign().setAlpha(0);
    this.textBottomLine = this.add.bitmapText(centerX, 76, "8-bit-mono", "", 12).setOrigin(0.5, 0).setCenterAlign().setAlpha(0);

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
    const ants = typeof getAntTally === "function" ? getAntTally() : { got: 0, total: 0 };
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
      ["ANT TOKENS", ants.got + " / " + ants.total, ants.total > 0 && ants.got >= ants.total ? 0x8ce070 : 0xffffff],
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
        .bitmapText(cx, 172, "8-bit-mono", this.awardStatements[idx], 10)
        .setOrigin(0.5)
        .setMaxWidth(400)
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
      const rankText = this.add
        .bitmapText(cx, 236, "tempFont", "RANK #" + (rank + 1) + " ON THE BOARD", 8)
        .setOrigin(0.5, 1)
        .setTintFill(0xffd066);
      items.push(rankText);
      if (typeof leaderboardEnabled === "function" && leaderboardEnabled()) {
        submitWorldScore({ name, score, stage: run.hard ? "HARD" : "CLEAR", hard: !!run.hard }).then((res) => {
          if (!rankText.active) return;
          if (res && res.rank) rankText.setText("WORLD RANK #" + res.rank + "  -  LOCAL #" + (rank + 1));
          invalidateWorldScores();
        });
      }
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
    this.textBlockIndex = 0;
    this.textTopLine.setText(this.textBlocks[0].topLine);
    this.textBottomLine.setText(this.textBlocks[0].bottomLine);

    // Skipping is deliberate now (the play keys drive the Encore Jam)
    const touch = isTouchDevice();
    this.skipHint.setText(touch ? "TAP HERE TO SKIP" : "ESC / ENTER TO SKIP").setAlpha(0.6);
    this.skipHint.setInteractive(new Phaser.Geom.Rectangle(-150, -16, 160, 20), Phaser.Geom.Rectangle.Contains);
    this.skipHint.on("pointerdown", () => this.restartGame());
    addKeys(this.input.keyboard, ["ESC", "ENTER", "P"]).forEach((k) => k.once("down", () => this.restartGame()));
    if (!touch) this._startEncoreJam();

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

  // ---------------------------------------------------------------
  // Encore Jam: a little playable bow while the credits roll. Jammy on
  // a stage at the bottom of the screen, berries drifting over; run,
  // jump and shoot them for an encore tally. Nothing is at stake.
  // ---------------------------------------------------------------
  _startEncoreJam() {
    const W = this.cameras.main.width;
    const FLOOR = 214;
    this.add.rectangle(W / 2, FLOOR + 13, W, 26, 0x2a1838).setDepth(5);
    this.add.rectangle(W / 2, FLOOR, W, 2, 0x5a3a5e).setDepth(5);
    for (let x = 12; x < W; x += 48) this.add.rectangle(x, FLOOR + 6, 2, 2, 0xffd9a0, 0.8).setDepth(5);
    const floor = this.add.rectangle(W / 2, FLOOR + 13, W, 26, 0x000000, 0);
    this.physics.add.existing(floor, true);
    this.physics.world.setBounds(0, -40, W, FLOOR + 40);

    const j = this.physics.add.sprite(70, FLOOR - 15, "jammy", "resting-right2").setDepth(10);
    j.body.setSize(18, 28, true);
    j.setCollideWorldBounds(true);
    this.physics.add.collider(j, floor);
    this.jam = { j, facing: 1, kills: 0, nextShot: 0 };

    const kb = this.input.keyboard;
    this.jamKeys = {
      left: addKeys(kb, controls.left),
      right: addKeys(kb, controls.right),
      jump: addKeys(kb, controls.jump),
      shoot: addKeys(kb, controls.shoot),
    };
    this.jamKeys.jump.forEach((k) =>
      k.on("down", () => {
        if (!this.jam || !(j.body.blocked.down || j.body.touching.down)) return;
        j.setVelocityY(-300);
        this.sound.play("jumpSound", { volume: 0.6 });
      })
    );
    this.jamKeys.shoot.forEach((k) => k.on("down", () => this._jamShoot()));

    this.jamBullets = this.physics.add.group({ allowGravity: false });
    this.jamBerries = this.physics.add.group({ allowGravity: false });
    this.physics.add.overlap(this.jamBullets, this.jamBerries, (a, b) => {
      const bullet = this.jamBullets.contains(a) ? a : b;
      const berry = bullet === a ? b : a;
      this._jamHit(bullet, berry);
    });
    if (!this.anims.exists("credits-berry")) {
      this.anims.create({
        key: "credits-berry",
        frames: this.anims.generateFrameNames("blueberry", { prefix: "oscillating-left", start: 1, end: 8 }),
        frameRate: 8,
        repeat: -1,
      });
    }
    this.add.bitmapText(8, FLOOR + 10, "tempFont", "ENCORE JAM   A/D MOVE   SPACE JUMP   Q SHOOT", 8)
      .setTintFill(0x9a8aa8).setDepth(6);
    this.jamScore = this.add.bitmapText(8, 6, "tempFont", "ENCORE x0", 8).setTintFill(0xffee88).setDepth(6);
    this.jamSpawner = this.time.addEvent({ delay: 1400, loop: true, callback: () => this._jamSpawn() });
  }

  _jamShoot() {
    if (!this.jam) return;
    const now = this.time.now;
    if (now < this.jam.nextShot) return;
    this.jam.nextShot = now + 220;
    const { j, facing } = this.jam;
    const b = this.jamBullets.create(j.x + facing * 14, j.y, "audio-wave");
    b.setDepth(9).setFlipX(facing === -1);
    b.body.setVelocityX(facing * 480);
    this.sound.play("laserSound", { volume: 0.5 });
  }

  _jamSpawn() {
    if (!this.jam || this.jamBerries.countActive(true) >= 5) return;
    const W = this.cameras.main.width;
    const fromRight = Math.random() < 0.7;
    const y = 96 + Math.random() * 90;
    const e = this.jamBerries.create(fromRight ? W + 16 : -16, y, "blueberry", "oscillating-left1");
    e.setDepth(8).setFlipX(!fromRight).play("credits-berry");
    e.body.setVelocityX((fromRight ? -1 : 1) * (45 + Math.random() * 40));
    this.tweens.add({ targets: e, y: y + 14, duration: 700 + Math.random() * 500, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  _jamHit(bullet, berry) {
    if (!bullet.active || !berry.active) return;
    bullet.destroy();
    this.jam.kills += 1;
    this.jamScore.setText("ENCORE x" + this.jam.kills);
    this.sound.play("enemyDeathSound", { volume: 0.5 });
    this.tweens.killTweensOf(berry);
    berry.body.setEnable(false);
    const pop = this.add.bitmapText(berry.x, berry.y - 10, "tempFont", "+100", 8).setOrigin(0.5).setTintFill(0xffee88).setDepth(9);
    this.tweens.add({ targets: pop, y: pop.y - 20, alpha: 0, duration: 600, onComplete: () => pop.destroy() });
    this.tweens.add({ targets: berry, scaleX: 1.8, scaleY: 1.8, alpha: 0, duration: 200, onComplete: () => berry.destroy() });
  }

  update() {
    if (!this.jam || this._restarting) return;
    const { j } = this.jam;
    if (!j.active) return;
    const left = anyKeyDown(this.jamKeys.left);
    const right = anyKeyDown(this.jamKeys.right);
    const grounded = j.body.blocked.down || j.body.touching.down;
    j.setVelocityX(left ? -125 : right ? 125 : 0);
    if (left) this.jam.facing = -1;
    else if (right) this.jam.facing = 1;
    const dir = this.jam.facing === 1 ? "right" : "left";
    if (!grounded) j.play("jumping-" + dir, true);
    else if (left || right) j.play("running-" + dir, true);
    else j.play("resting-" + dir, true);
    const W = this.cameras.main.width;
    this.jamBerries.getChildren().forEach((e) => { if (e.x < -40 || e.x > W + 40) e.destroy(); });
    this.jamBullets.getChildren().forEach((b) => { if (b.x < -40 || b.x > W + 40) b.destroy(); });
  }

  restartGame() {
    if (this._restarting) return;
    this._restarting = true;
    if (this.jamSpawner) this.jamSpawner.remove(false);
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
