class HornedFruit extends Phaser.Physics.Arcade.Sprite {
  constructor(scn, x, y) {
    super(scn, x, y, "horned-fruit", "idle1");
    scn.add.existing(this);
    scn.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.body.setSize(10, 10, 3, 3);

    this.score = 400;
    this.hp = 2;
    this.dead = false;
    this.dropped = false;
    this.baseY = typeof y === "number" ? y : 0;
    this.detectHorizRange = 14;
    this.detectVertRange = 140;

    if (!scn.anims.exists("hornedfruit-idle")) {
      scn.anims.create({
        key: "hornedfruit-idle",
        frames: scn.anims.generateFrameNames("horned-fruit", { prefix: "idle", start: 1, end: 4 }),
        frameRate: 4, repeat: -1,
      });
    }
    this.play("hornedfruit-idle");
    scn.enemies.add(this);
  }

  setPosition(x, y, z, w) {
    super.setPosition(x, y, z, w);
    if (typeof y === "number" && !this.dropped) this.baseY = y;
    return this;
  }

  update() {
    if (this.dead) return;
    if (!this.scene.jammy || !this.scene.jammy.alive) return;

    if (!this.dropped) {
      // Hang and bob
      this.y = this.baseY + Math.sin(this.scene.time.now / 380) * 1.5;
      const j = this.scene.jammy.sprite;
      const dx = Math.abs(j.x - this.x);
      const dyBelow = j.y - this.y;
      if (dx < this.detectHorizRange && dyBelow > 8 && dyBelow < this.detectVertRange) {
        this.drop();
      }
    }
  }

  drop() {
    if (this.dropped) return;
    this.dropped = true;
    this.body.setAllowGravity(true);
    this.body.setVelocityY(260);

    // Damage Jammy on contact
    this.jammyOverlap = this.scene.physics.add.overlap(this, this.scene.jammy.sprite, () => {
      if (!this.dead && this.scene.jammy.alive) {
        this.scene.jammy.takeDamage(this.x);
        this.die();
      }
    });

    // Explode/die on ground impact
    if (this.scene.groundLayer) {
      this.scene.physics.add.collider(this, this.scene.groundLayer, () => {
        this.scene.time.delayedCall(150, () => this.die());
      });
    }
  }

  takeDamage(val = 1) {
    if (this.dead) return;
    this.hp -= val;
    this.setTint(0xff6666);
    this.scene.time.delayedCall(60, () => this.clearTint());
    this.scene.sound.play("enemyHitSound");
    if (this.hp <= 0) this.die();
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.scene.sound.play("enemyDeathSound");
    this.scene.scene.get("UIScene").setScore(this.score);
    this.body.setEnable(false);
    this.scene.tweens.add({
      targets: this, alpha: 0, duration: 250,
      onComplete: () => this.destroy(),
    });
  }
}
