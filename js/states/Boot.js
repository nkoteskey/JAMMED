class Boot extends Phaser.Scene {
  constructor() {
    super("Boot");
  }

  preload() {
    // Load loading bar image
    this.load.image("loadingBar", "assets/img/misc/loadingBar.png");
    this.load.image(
      "jammyLoader",
      "assets/img/sprites/jammy/resting/jammy-still.png"
    );
  }

  create() {
    const centerX = this.cameras.main.centerX;
    const centerY = this.cameras.main.centerY;

    // Add jammy image
    this.jammyImage = this.add.image(centerX, centerY, "jammyLoader");
    this.jammyImage.setOrigin(0.5, 0.5);

    // Browsers only unlock audio after a user gesture, so the game waits
    // for one tap/click here before loading. Tell the player that.
    const touch = isTouchDevice();
    this.prompt = this.add
      .text(centerX, centerY + 64, touch ? "TAP TO BEGIN" : "CLICK OR PRESS ANY KEY TO BEGIN", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.tweens.add({
      targets: this.prompt,
      alpha: 0.2,
      yoyo: true,
      repeat: -1,
      duration: 600,
    });

    const go = () => {
      if (this._started) return;
      this._started = true;
      // Go fullscreen on phones/tablets only — a surprise fullscreen on
      // desktop is more annoying than helpful (the pause menu has a
      // fullscreen toggle for that).
      if (touch && this.scale.fullscreen.available) {
        try {
          this.scale.startFullscreen();
        } catch (e) {
          /* ignore */
        }
      }
      this.scene.start("Preload");
    };

    this.input.once("pointerup", go);
    this.input.keyboard.once("keydown", go);
  }
}
