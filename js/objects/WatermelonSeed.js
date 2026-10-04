class WatermelonSeed extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, velocityX, velocityY) {
    super(scene, x, y, "watermelon-seed");

    // Prevent Jammy from being able to shoot the seed down
    this.invincible = true;
    this.dead = false;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    // Group first — physics groups apply defaults when a body is added
    scene.enemyProjectiles.add(this);

    this.setOrigin(0.5, 0.5);
    this.setDepth(90);
    this.body.setBounce(0);
    this.body.setAllowGravity(false);
    this.body.setVelocity(velocityX, velocityY);
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;
    const cam = this.scene.cameras.main;
    if (
      this.x < cam.scrollX - 32 ||
      this.x > cam.scrollX + cam.width + 32 ||
      this.y < cam.scrollY - 32 ||
      this.y > cam.scrollY + cam.height + 32
    ) {
      this.die();
    }
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.destroy();
  }
}
