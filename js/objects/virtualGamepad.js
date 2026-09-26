// On-screen controls.
//
// Two things used to make these vanish once a stage started scrolling:
// the joystick's base and thumb were never pinned with
// setScrollFactor(0), so they slid off-screen with the world, and
// nothing had a depth, so any scene that layers its art (foreground
// props, scrims, decor) drew straight over the buttons. Both are
// fixed here rather than in each scene — the controls must be the
// top-most thing on screen, always, in every stage.
const GAMEPAD_DEPTH = 1000;

class VirtualGamepad {
  constructor(scene) {
    this.scene = scene;

    this.base = scene.add.image(50, 215, "gamepad", 2)
      .setAlpha(0.78).setScale(0.68)
      .setScrollFactor(0).setDepth(GAMEPAD_DEPTH);
    this.thumb = scene.add.image(50, 215, "gamepad", 1)
      .setAlpha(0.9).setScale(0.48)
      .setScrollFactor(0).setDepth(GAMEPAD_DEPTH + 1);

    this.gamepad = scene.plugins.get("rexvirtualjoystickplugin").add(scene, {
      x: 50,
      y: 215,
      radius: 50,
      base: this.base,
      thumb: this.thumb,
      dir: "8dir",
      forceMin: 16,
      enable: true,
    });

    this.gamepad.createCursorKeys();

    this.xButton = scene.add
      .image(275, 215, "gamepad", 0)
      .setInteractive()
      .setScale(0.54)
      .setAlpha(0.8)
      .setScrollFactor(0)
      .setDepth(GAMEPAD_DEPTH);
    this.zButton = scene.add
      .image(350, 215, "gamepad", 0)
      .setInteractive()
      .setScale(0.54)
      .setAlpha(0.8)
      .setScrollFactor(0)
      .setDepth(GAMEPAD_DEPTH);

    this.xButton.on(
      "pointerdown",
      function () {
        this.xButton.setFrame(1);
      },
      this
    );

    this.xButton.on(
      "pointerup",
      function () {
        this.xButton.setFrame(0);
      },
      this
    );

    this.zButton.on(
      "pointerdown",
      function () {
        this.zButton.setFrame(1);
      },
      this
    );

    this.zButton.on(
      "pointerup",
      function () {
        this.zButton.setFrame(0);
      },
      this
    );
  }

  // Used by set pieces that take movement away from the player (the
  // Stadium duel), so a dead joystick isn't sitting over the lanes.
  setVisible(v) {
    [this.base, this.thumb, this.xButton, this.zButton].forEach((o) => {
      if (o) o.setVisible(v);
    });
    if (this.gamepad && this.gamepad.setEnable) this.gamepad.setEnable(v);
  }
}
