// Jammy's basic shot — a sonic wave from the Crimson V. Flies straight
// (or diagonally up when aiming), passes through scenery like sound
// does, and is culled once it leaves the screen. Damage is dealt by the
// level's bullets-vs-enemies overlap (see js/helpers/level.js).
class AudioWave extends Phaser.Physics.Arcade.Sprite {
  constructor(scn, x, y, direction = "right", up = false, bigShot = false, speed = 500) {
    const dir = direction === "left" ? -1 : 1;
    super(scn, x + dir * 14, y, "audio-wave");
    scn.add.existing(this);
    scn.physics.add.existing(this);
    // Group membership first — physics groups apply their defaults to
    // a body when it's added, so configure the body afterwards.
    scn.bullets.add(this);

    this.damage = bigShot ? 3 : 1;
    this.setDepth(99);
    this.setFlipX(dir === -1);
    if (up) this.setAngle(dir === -1 ? 45 : -45);
    if (bigShot) this.setScale(1.5);

    this.body.setAllowGravity(false);
    this.body.setBounce(0);
    this.body.setSize(13, 15, true);
    this.body.setVelocity(dir * speed, up ? -speed : 0);

    scn.sound.play("laserSound", { volume: bigShot ? 1 : 0.8 });
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active) return;
    const cam = this.scene.cameras.main;
    if (
      this.x < cam.scrollX - 48 ||
      this.x > cam.scrollX + cam.width + 48 ||
      this.y < cam.scrollY - 64 ||
      this.y > cam.scrollY + cam.height + 64
    ) {
      this.destroy();
    }
  }

  hit(enemy) {
    if (!this.active) return;
    if (enemy && !enemy.dead && !enemy.invincible && typeof enemy.takeDamage === "function") {
      enemy.takeDamage(this.damage);
    }
    this.destroy();
  }
}
