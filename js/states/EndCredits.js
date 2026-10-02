class EndCredits extends Phaser.Scene {
  constructor() {
    super({ key: "EndCredits" });
  }

  init() {
    scene = this;
  }

  create() {
    this.sceneComplete = false;
    this.fadeTime = 3000;

    // Whatever stage music was playing must not overlap the credits song
    this.sound.stopAll();
    this.bgMusic = this.sound.add("Level1MusicLoop", { loop: true, volume: 0.9 });
    this.bgMusic.play();

    this.cameras.main.setBackgroundColor("#000000");
    this.cameras.main.fadeIn(600, 0, 0, 0);

    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Award statements, ranked by what share of the Bread Tokens the
    // player found across the whole run.
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
    ];

    this.textTopLine = this.add
      .bitmapText(centerX, centerY - 8, "8-bit-mono", "", 12)
      .setOrigin(0.5)
      .setAlpha(0);
    this.textBottomLine = this.add
      .bitmapText(centerX, centerY + 8, "8-bit-mono", "", 12)
      .setOrigin(0.5)
      .setAlpha(0);

    // Skip hint
    this.add
      .bitmapText(this.cameras.main.width - 6, this.cameras.main.height - 4, "tempFont", isTouchDevice() ? "TAP TO SKIP" : "PRESS ANY KEY TO SKIP", 8)
      .setOrigin(1, 1)
      .setTintFill(0xffffff)
      .setAlpha(0.5);

    this.input.once("pointerdown", () => this.restartGame());
    this.input.keyboard.once("keydown", () => this.restartGame());

    // Results card first, then the credit roll
    this.showResults(() => this.rollCredits());
  }

  // "Stage results" style tally of the bread tokens found in the run
  showResults(onDone) {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;
    const tally = getTokenTally();
    const score = (() => {
      const ui = this.scene.get("UIScene");
      return ui && typeof ui.newScore === "number" ? ui.newScore : 0;
    })();

    const items = [];
    items.push(
      this.add
        .bitmapText(centerX, centerY - 56, "8-bit-mono", "THE CITY IS SAVED!", 15)
        .setOrigin(0.5)
        .setTint(0xffd877)
    );
    items.push(
      this.add
        .bitmapText(centerX, centerY - 28, "tempFont", "SCORE  " + score, 12)
        .setOrigin(0.5)
        .setTintFill(0xffffff)
    );

    // Token row: filled icons for found tokens, outlines for missed
    // (collapsed to a counter when there are too many to draw).
    const got = tally.got,
      total = tally.total;
    if (total > 0 && total <= 12) {
      const startX = centerX - ((total - 1) * 18) / 2;
      for (let i = 0; i < total; i++) {
        const key = i < got ? "ant-token-hud" : "ant-token-outline-hud";
        items.push(this.add.image(startX + i * 18, centerY, key));
      }
    } else {
      items.push(this.add.image(centerX - 30, centerY, "ant-token-hud"));
      items.push(
        this.add
          .bitmapText(centerX - 16, centerY, "tempFont", "x " + got + " / " + total, 12)
          .setOrigin(0, 0.5)
          .setTintFill(0xffffff)
      );
    }

    const frac = total > 0 ? got / total : 0;
    let idx = 0;
    if (got === 0) idx = 0;
    else if (frac < 0.35) idx = 1;
    else if (frac < 0.6) idx = 2;
    else if (frac < 0.85) idx = 3;
    else if (frac < 1) idx = 4;
    else idx = 5;
    items.push(
      this.add
        .bitmapText(centerX, centerY + 32, "8-bit-mono", this.awardStatements[idx], 12)
        .setOrigin(0.5)
        .setMaxWidth(360)
        .setTint(0xd8f878)
    );

    items.forEach((it) => it.setAlpha(0));
    this.tweens.add({ targets: items, alpha: 1, duration: 800 });
    this.time.delayedCall(5200, () => {
      this.tweens.add({
        targets: items,
        alpha: 0,
        duration: 800,
        onComplete: () => {
          items.forEach((it) => it.destroy());
          onDone();
        },
      });
    });
  }

  rollCredits() {
    this.textBlockIndex = 0;
    this.textTopLine.setText(this.textBlocks[0].topLine);
    this.textBottomLine.setText(this.textBlocks[0].bottomLine);

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
        this.textTopLine.setText(this.textBlocks[this.textBlockIndex].topLine);
        this.textBottomLine.setText(this.textBlocks[this.textBlockIndex].bottomLine);
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
    this.tweens.add({
      targets: this.bgMusic,
      volume: 0,
      duration: 1000,
      ease: "Cubic",
    });
    this.cameras.main.fadeOut(1000, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.sound.stopAll();
      if (this.scene.isActive("UIScene")) this.scene.stop("UIScene");
      this.scene.start("TitleScreen");
    });
  }
}
