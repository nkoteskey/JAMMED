class TitleScreen extends Phaser.Scene {
  constructor() {
    super({ key: "TitleScreen" });
  }

  init() {
    scene = this;
  }

  create() {
    this._starting = false;

    // A visit to the title screen always means a fresh run
    resetRunState();

    // Make sure nothing from the credits / a quit game keeps playing
    this.sound.stopAll();
    this.titleMusic = this.sound.add("Jammed", { loop: true, volume: 0.9 });
    this.titleMusic.play();

    // Display the background
    const background = this.add.sprite(0, 0, "titleScreenBg");
    background.setOrigin(0, 0);

    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    const touch = isTouchDevice();
    const label = touch ? "TAP TO START" : "PRESS ANY KEY TO START";

    // Create the press start text (with drop shadow)
    this.startTextShadow = this.add
      .bitmapText(centerX + 2, centerY + 2, "8-bit-mono", label, 15)
      .setOrigin(0.5)
      .setTint(0x000000);
    this.startText = this.add
      .bitmapText(centerX, centerY, "8-bit-mono", label, 15)
      .setOrigin(0.5);

    this.tweens.add({
      targets: [this.startText, this.startTextShadow],
      alpha: 0,
      yoyo: true,
      repeat: -1,
      duration: 500,
      ease: "Linear",
    });

    // Controls reminder along the bottom edge
    if (!touch) {
      this.add
        .bitmapText(
          centerX,
          228,
          "tempFont",
          "A/D MOVE   SPACE JUMP   Q SHOOT   W AIM UP   E PAUSE",
          8
        )
        .setOrigin(0.5)
        .setTintFill(0xffffff)
        .setAlpha(0.8);
    }

    this.input.once("pointerdown", () => this.startGame());
    this.input.keyboard.once("keydown", () => this.startGame());
  }

  startGame() {
    if (this._starting) return;
    this._starting = true;

    this.sound.play("startGameSound", { volume: 0.9 });
    this.tweens.killTweensOf([this.startText, this.startTextShadow]);
    this.startText.setAlpha(1);
    this.startTextShadow.setAlpha(1);

    // Quick flash of the start text, then fade the screen to black
    this.tweens.add({
      targets: [this.startText, this.startTextShadow],
      alpha: 0,
      yoyo: true,
      repeat: 4,
      duration: 80,
    });
    this.tweens.add({
      targets: this.titleMusic,
      volume: 0,
      duration: 900,
    });
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
