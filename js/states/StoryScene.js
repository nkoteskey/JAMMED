// Shared base for the storyboard cutscenes. Each cutscene supplies a
// storyboard image, the caption text and where to go next; this class
// handles the fade-in, the "any key / tap to continue" skip, and a
// guarded fade-out so a mashed key can't start the next scene twice.
class StoryScene extends Phaser.Scene {
  constructor(key, cfg) {
    super({ key });
    this.cfg = cfg;
  }

  init() {
    scene = this;
    this.storyComplete = false;
    this._leaving = false;
  }

  create() {
    const fadeTime = 500;
    const cfg = this.cfg;

    if (cfg.music) {
      this.sound.stopAll();
      this.sound.play(cfg.music, { loop: true, volume: cfg.musicVolume || 1 });
    }

    this.background = this.add
      .sprite(0, 0, cfg.storyboard)
      .setAlpha(0)
      .setOrigin(0);

    this.textContentShadow = this.add
      .bitmapText(this.cameras.main.centerX + 1, 181, "8-bit-mono", cfg.text, 12)
      .setOrigin(0.5)
      .setMaxWidth(330)
      .setTint(0x000000)
      .setAlpha(0);

    this.textContent = this.add
      .bitmapText(this.cameras.main.centerX, 180, "8-bit-mono", cfg.text, 12)
      .setOrigin(0.5)
      .setMaxWidth(330)
      .setTint(0xd8f878)
      .setAlpha(0);

    // Little "continue" hint that appears once the text is readable
    this.hint = this.add
      .bitmapText(
        this.cameras.main.width - 6,
        this.cameras.main.height - 4,
        "tempFont",
        isTouchDevice() ? "TAP" : "PRESS ANY KEY",
        8
      )
      .setOrigin(1, 1)
      .setTintFill(0xffffff)
      .setAlpha(0);

    // Fade in background, then shadow + text together
    this.tweens.add({
      targets: this.background,
      alpha: 1,
      duration: fadeTime,
      onComplete: () => {
        this.tweens.add({
          targets: [this.textContentShadow, this.textContent],
          alpha: 1,
          duration: fadeTime,
          onComplete: () => {
            this.storyComplete = true;
            this.tweens.add({
              targets: this.hint,
              alpha: 0.9,
              yoyo: true,
              repeat: -1,
              duration: 500,
            });
          },
        });
      },
    });

    this.input.on("pointerdown", () => this.transitionToNextScene());
    this.input.keyboard.on("keydown", () => this.transitionToNextScene());
  }

  transitionToNextScene() {
    if (!this.storyComplete || this._leaving) return;
    this._leaving = true;
    const fadeTime = 500;

    this.tweens.add({
      targets: [this.background, this.textContent, this.textContentShadow, this.hint],
      alpha: 0,
      duration: fadeTime,
      onComplete: () => {
        if (this.cfg.stopMusicOnExit) this.sound.stopAll();
        this.scene.start(this.cfg.next);
      },
    });
  }
}
