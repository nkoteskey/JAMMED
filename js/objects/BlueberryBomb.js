class BlueberryBomb extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "blueberry-bomb");

    // Add bomb to the scene
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Properties — shots can't pop it, it just falls
    this.invincible = true;
    this.dead = false;

    // Physics properties
    this.body.setBounce(0);
    this.body.setGravityY(600); // Extra gravity on top of the world's
    this.body.setVelocityX(0);
    this.body.setSize(6, 6); // Adjust collision size

    // Play sound
    scene.sound.play("blueberryBombDropSound");

    // Check for overlap with Jammy
    this.jammyOverlap = this.scene.physics.add.overlap(this, this.scene.jammy.sprite, (bomb, jammy) => {
      if (!bomb.active || !jammy.parentObject.alive) return;
      jammy.parentObject.takeDamage(bomb.x);
      bomb.die();
    });

    // Safety net: never outlive the stage
    this._life = scene.time.delayedCall(6000, () => {
      if (this.active) this.die();
    });
  }

  update() {
    if (!this.body) return;
    // Burst on the floor
    if (this.body.onFloor()) {
      this.die();
    }
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    if (this.jammyOverlap) this.jammyOverlap.destroy();
    if (this._life) this._life.remove(false);
    // Little splat so it doesn't just vanish
    const s = this.scene;
    for (let i = 0; i < 3; i++) {
      const d = s.add.circle(this.x, this.y, 1.5, 0x4060e0, 0.9);
      d.setDepth(60);
      s.tweens.add({
        targets: d,
        x: this.x + Phaser.Math.Between(-8, 8),
        y: this.y - Phaser.Math.Between(2, 10),
        alpha: 0,
        duration: 220,
        onComplete: () => d.destroy(),
      });
    }
    this.destroy();
  }
}
