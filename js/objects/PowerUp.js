class PowerUp extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, texture = "power-up", type = "", val = 1) {
    super(scene, x, y, texture, "still1");
    scene.add.existing(this);
    scene.physics.add.existing(this);
    scene.collectibles.add(this);
    this.body.setAllowGravity(true); // power-ups drop to the ground
    this.val = val;
    scene.physics.add.collider(this, scene.groundLayer);
    scene.physics.add.collider(this, scene.deathBlocksLayer, () =>
      this.destroy()
    );
    scene.physics.add.collider(this, scene.sceneChangeLayer, () =>
      this.destroy()
    );
    scene.physics.add.collider(this, scene.enemyStopBlocksLayer, () =>
      this.destroy()
    );
    // Tiled properties are applied right after construction, so pick
    // the frame on the next tick. Heart = heal, bolt = big shot.
    scene.time.addEvent({
      delay: 10,
      callback: () => {
        if (!this.active) return;
        this.setFrame(this.getPowerUpType() === "heal" ? "still1" : "still2");
      },
    });

  }

  update() {}

  getPowerUpType() {
    return (this.data && this.data.values && this.data.values.powerUpType) || "heal";
  }

  effect() {
    scene.jammy.powerUp(this.getPowerUpType(), this.val);
    this.destroy();
  }
}
