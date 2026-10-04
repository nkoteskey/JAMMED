// Pause overlay. Keyboard: W/S or arrows to move, SPACE/ENTER to pick,
// E/P/ESC to resume. Everything is also clickable / tappable.
class PauseScene extends Phaser.Scene {
  constructor() {
    super({ key: "PauseScene" });
  }

  init(data) {
    this.gameScene = data.key;
  }

  create() {
    this.scene.bringToTop();
    const w = this.cameras.main.width / 2;
    const h = this.cameras.main.height / 2;

    this.add.rectangle(w, h, 426, 240, 0x000000, 0.35);
    this.add.image(w, h, "pause-menu-bg");

    this.items = [
      { key: "pause-menu-return-button", y: h - 20, action: () => this.resume() },
      {
        key: "pause-menu-full-screen-button",
        y: h + 16,
        action: () => this.toggleFullscreen(),
      },
      { key: "pause-menu-quit-game-button", y: h + 52, action: () => this.quit() },
    ];
    this.items.forEach((it, i) => {
      it.img = this.add.image(w, it.y, it.key).setInteractive({ useHandCursor: true });
      it.img.on("pointerover", () => this._select(i));
      it.img.on("pointerdown", () => {
        this._select(i);
        it.action();
      });
    });
    this.cursor = this.add.image(w, this.items[0].y, "pause-menu-button-outline");
    this.selected = 0;
    this._select(0);

    this.tweens.add({
      targets: this.cursor,
      alpha: 0.4,
      yoyo: true,
      repeat: -1,
      duration: 350,
    });

    const kb = this.input.keyboard;
    onKeys(addKeys(kb, controls.pause), "down", () => this.resume(), this);
    onKeys(addKeys(kb, ["W", "UP"]), "down", () => this._move(-1), this);
    onKeys(addKeys(kb, ["S", "DOWN"]), "down", () => this._move(1), this);
    onKeys(addKeys(kb, ["SPACE", "ENTER"]), "down", () => this.items[this.selected].action(), this);
  }

  _move(d) {
    this._select(Phaser.Math.Wrap(this.selected + d, 0, this.items.length));
  }

  _select(i) {
    this.selected = i;
    this.cursor.y = this.items[i].y;
  }

  resume() {
    if (this._closing) return;
    this._closing = true;
    const level = this.scene.get(this.gameScene);
    if (level) level.cameras.main.setAlpha(1);
    this.scene.resume(this.gameScene);
    this.scene.resume("UIScene");
    this.scene.stop("PauseScene");
  }

  toggleFullscreen() {
    if (!this.scale.fullscreen.available) return;
    try {
      if (this.scale.isFullscreen) this.scale.stopFullscreen();
      else this.scale.startFullscreen();
    } catch (e) {
      /* ignore */
    }
  }

  quit() {
    if (this._closing) return;
    this._closing = true;
    this.sound.stopAll();
    const level = this.scene.get(this.gameScene);
    if (level) level.cameras.main.setAlpha(1);
    this.scene.stop(this.gameScene);
    this.scene.stop("UIScene");
    this.scene.stop("PauseScene");
    this.scene.start("TitleScreen");
  }
}
