// On-screen controls for touch devices. Lives in the UI scene (which is
// fixed to the camera and runs for the whole game) and drives whichever
// Jammy is active via its `touch` input flags, so it survives scene
// restarts and never scrolls away with the level.
class VirtualGamepad {
  constructor(uiScene) {
    this.scene = uiScene;
    const plugin = uiScene.plugins.get("rexvirtualjoystickplugin");

    this.joystick = plugin.add(uiScene, {
      x: 58,
      y: 186,
      radius: 36,
      base: uiScene.add.image(0, 0, "gamepad", 2).setAlpha(0.45).setScale(0.65).setDepth(1000),
      thumb: uiScene.add.image(0, 0, "gamepad", 1).setAlpha(0.6).setScale(0.45).setDepth(1001),
      dir: "8dir",
      forceMin: 12,
      enable: true,
    });
    this.cursorKeys = this.joystick.createCursorKeys();

    const mkButton = (x, y, label, color) => {
      const img = uiScene.add
        .image(x, y, "gamepad", 0)
        .setInteractive()
        .setScale(0.5)
        .setAlpha(0.45)
        .setDepth(1000);
      const txt = uiScene.add
        .bitmapText(x, y, "tempFont", label, 10)
        .setOrigin(0.5)
        .setTintFill(color)
        .setDepth(1001)
        .setAlpha(0.9);
      img.on("pointerdown", () => img.setFrame(1).setAlpha(0.7));
      img.on("pointerup", () => img.setFrame(0).setAlpha(0.45));
      img.on("pointerout", () => img.setFrame(0).setAlpha(0.45));
      return { img, txt };
    };

    // Jump (left of the pair) and shoot (right)
    this.jumpButton = mkButton(318, 196, "JUMP", 0x8ce070);
    this.shootButton = mkButton(386, 182, "SHOOT", 0xffee88);

    this.jumpButton.img.on("pointerdown", () => {
      const j = this.scene._activeJammy();
      if (j) j.jump();
    });
    this.shootButton.img.on("pointerdown", () => {
      const j = this.scene._activeJammy();
      if (j) j.shoot();
    });

    // Small pause / weapon-swap targets along the top edge
    this.pauseButton = uiScene.add
      .bitmapText(213, 6, "tempFont", "II", 12)
      .setOrigin(0.5, 0)
      .setTintFill(0xffffff)
      .setAlpha(0.7)
      .setDepth(1000)
      .setInteractive(new Phaser.Geom.Rectangle(-14, -4, 28, 24), Phaser.Geom.Rectangle.Contains);
    this.pauseButton.on("pointerdown", () => this.scene.togglePause());

    this.swapZone = uiScene.add
      .zone(395, 14, 60, 28)
      .setInteractive()
      .setDepth(1000);
    this.swapZone.on("pointerdown", () => this.scene.cycleWeapon());
  }

  // Called from UIScene.update with the active Jammy (or null)
  update(jammy) {
    if (!jammy || !jammy.touch) return;
    const k = this.cursorKeys;
    jammy.touch.left = k.left.isDown;
    jammy.touch.right = k.right.isDown;
    jammy.touch.up = k.up.isDown;
    jammy.touch.down = k.down.isDown;
  }
}
