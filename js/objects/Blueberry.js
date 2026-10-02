// Blueberry drone: hovers in the air, drifts toward Jammy when he's in
// range, and drops seed bombs on him. One hit kills it.
class Blueberry extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "blueberry");
    this.hp = 1;
    this.roamSpeed = 60;
    this.facing = -1;
    this.takingDamage = false;
    this.invincible = false;
    this.invincibilityTime = 50;
    this.awareDistance = 400;
    this.dead = false;
    this.score = 500;
    this.homeY = typeof y === "number" ? y : 0;
    this._bobPhase = Math.random() * Math.PI * 2;

    // Enable physics and body settings
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setBounce(0);
    this.body.setAllowGravity(false);
    this.body.setVelocity(0, 0);
    this.body.setSize(14, 14, true);

    // Add animations (local to this sprite)
    this.anims.create({
      key: "oscillating-right",
      frames: this.anims.generateFrameNames("blueberry", {
        prefix: "oscillating-right",
        start: 1,
        end: 8,
      }),
      frameRate: 8,
      repeat: -1,
    });
    this.anims.create({
      key: "oscillating-left",
      frames: this.anims.generateFrameNames("blueberry", {
        prefix: "oscillating-left",
        start: 1,
        end: 8,
      }),
      frameRate: 8,
      repeat: -1,
    });

    this.play("oscillating-left");

    // Add this enemy to the enemies group
    scene.enemies.add(this);

    // Kept for subclasses that replace the AI (CloudBlueberry)
    this.roamTimer = scene.time.addEvent({ delay: 100000, loop: true, callback: () => {} });

    this.bombTimer = scene.time.addEvent({
      delay: 1500,
      callback: function () {
        if (this.dead || !this.body) return;
        const j = scene.jammy;
        if (!j || !j.alive) return;
        const d = Phaser.Math.Distance.Between(this.x, this.y, j.sprite.x, j.sprite.y);
        // Only bomb when roughly overhead so the drop can actually land
        if (d < this.awareDistance && Math.abs(this.x - j.sprite.x) < 40 && j.sprite.y > this.y) {
          this.dropBomb();
        }
      },
      callbackScope: this,
      repeat: -1,
    });

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (this.roamTimer && this.roamTimer.remove) this.roamTimer.remove(false);
      if (this.bombTimer && this.bombTimer.remove) this.bombTimer.remove(false);
    });
  }

  setPosition(x, y, z, w) {
    super.setPosition(x, y, z, w);
    if (typeof y === "number" && !this.body) this.homeY = y;
    else if (typeof y === "number" && this.body && this.body.velocity.x === 0 && this.body.velocity.y === 0) {
      this.homeY = y;
    }
    return this;
  }

  update() {
    if (this.dead || !this.body) return;
    const j = this.scene.jammy;

    // Hunt: drift toward Jammy's x while he's in range, otherwise hover
    let vx = 0;
    if (j && j.alive) {
      const dx = j.sprite.x - this.x;
      const d = Phaser.Math.Distance.Between(this.x, this.y, j.sprite.x, j.sprite.y);
      if (d < this.awareDistance && Math.abs(dx) > 6) {
        this.facing = dx < 0 ? -1 : 1;
        vx = this.roamSpeed * this.facing;
      }
    }
    // Walls flip it
    if (this.body.blocked.left) {
      this.facing = 1;
      vx = Math.abs(vx);
    } else if (this.body.blocked.right) {
      this.facing = -1;
      vx = -Math.abs(vx);
    }
    this.body.setVelocityX(vx);

    // Gentle hover bob around its spawn height
    const t = this.scene.time.now / 1000;
    const targetY = this.homeY + Math.sin(t * 2.2 + this._bobPhase) * 6;
    this.body.setVelocityY((targetY - this.y) * 4);

    this.play(this.facing === 1 ? "oscillating-right" : "oscillating-left", true);
  }

  rest() {
    this.body.setVelocityX(0);
  }

  roam() {}

  dropBomb() {
    const bomb = new BlueberryBomb(this.scene, this.x, this.y + 8);
    this.scene.enemies.add(bomb);
  }

  takeDamage() {
    if (this.dead) return;
    this.hp--;
    this.takingDamage = true;
    this.flashOnce();
    this.invincible = true;
    this.scene.time.delayedCall(this.invincibilityTime, this.restoreVulnerability, [], this);
    this.scene.sound.play("enemyHitSound");
    if (this.hp <= 0) {
      this.die();
    }
  }

  flashOnce() {
    this.setTint(0x0000ff);
    this.scene.time.delayedCall(50, () => {
      if (this.active) this.clearTint();
    });
  }

  restoreVulnerability() {
    if (!this.active) return;
    this.setAlpha(1);
    this.clearTint();
    this.invincible = false;
    this.takingDamage = false;
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.scene.scene.get("UIScene").setScore(this.score);
    this.body.setEnable(false);
    this.body.setVelocity(0, 0);
    this.roamTimer.destroy();
    this.bombTimer.destroy();
    this.clearTint();
    this.scene.sound.play("enemyDeathSound");
    this.play("death").once("animationcomplete-death", () => {
      this.destroy();
    });
  }
}
