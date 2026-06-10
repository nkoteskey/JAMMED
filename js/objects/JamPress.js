// Industrial jam press — Stage 1-4's Thwomp. Hangs below the ceiling
// with a jam-stained grimace, slams when Jammy walks underneath, then
// grinds back up. Steel: shots clink off; only avoidable, not killable.
class JamPress extends Phaser.Physics.Arcade.Sprite {
  static ensureTexture(scn) {
    if (scn.textures.exists("jam-press")) return;
    const g = scn.make.graphics({ x: 0, y: 0, add: false });
    // 32x32 riveted steel block with an angry pressed-metal face
    g.fillStyle(0x2c3248, 1);
    g.fillRect(0, 0, 32, 32);
    g.fillStyle(0x8c96b0, 1);
    g.fillRect(2, 2, 28, 28);
    g.fillStyle(0xb8c2da, 1);
    g.fillRect(2, 2, 28, 3); // top sheen
    g.fillStyle(0x5d6680, 1);
    g.fillRect(2, 24, 28, 6); // jaw shadow
    // Corner rivets
    g.fillStyle(0xdde4f0, 1);
    [[4, 4], [26, 4], [4, 26], [26, 26]].forEach(([x, y]) => g.fillRect(x, y, 2, 2));
    // Furious eyes
    g.fillStyle(0xffffff, 1);
    g.fillRect(7, 10, 6, 5);
    g.fillRect(19, 10, 6, 5);
    g.fillStyle(0x1c1428, 1);
    g.fillRect(9, 12, 3, 3);
    g.fillRect(21, 12, 3, 3);
    // Angled brows
    g.fillRect(6, 8, 7, 2);
    g.fillRect(19, 8, 7, 2);
    // Gritted teeth
    g.fillStyle(0x1c1428, 1);
    g.fillRect(8, 19, 16, 4);
    g.fillStyle(0xffffff, 1);
    for (let x = 9; x < 23; x += 4) g.fillRect(x, 20, 2, 2);
    // Jam stains dripping off the crush face
    g.fillStyle(0xc23a66, 1);
    g.fillRect(5, 28, 3, 4);
    g.fillRect(14, 29, 2, 3);
    g.fillRect(23, 28, 3, 4);
    g.generateTexture("jam-press", 32, 32);
    g.destroy();
  }

  constructor(scn, x, topY, slamY) {
    JamPress.ensureTexture(scn);
    super(scn, x, topY, "jam-press");
    scn.add.existing(this);
    scn.physics.add.existing(this);

    this.topY = topY;
    this.slamY = slamY;
    this.state = "idle";
    this.dead = false;
    this.invincible = true; // solid steel
    this.triggerRangeX = 42;
    this.setDepth(60);

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.setSize(30, 30);

    // Solid against Jammy; the touch only hurts while slamming.
    scn.physics.add.collider(scn.jammy.sprite, this, () => {
      if (this.state === "slam" && this.scene.jammy.alive) {
        this.scene.jammy.takeDamage();
      }
    });

    scn.enemies.add(this);
  }

  update() {
    if (!this.body) return;
    const j = this.scene.jammy;

    if (this.state === "idle") {
      // Menacing idle hover
      this.y = this.topY + Math.sin(this.scene.time.now / 280 + this.x) * 1.5;
      if (j && j.alive) {
        const dx = Math.abs(j.sprite.x - this.x);
        if (dx < this.triggerRangeX && j.sprite.y > this.y + 12) {
          this._beginSlam();
        }
      }
    } else if (this.state === "slam") {
      if (this.y >= this.slamY) this._impact();
    } else if (this.state === "rise") {
      if (this.y <= this.topY) {
        this.y = this.topY;
        this.body.setVelocityY(0);
        this.state = "idle";
      }
    }
  }

  _beginSlam() {
    this.state = "warn";
    // Telegraph: a short rattle before dropping
    this.scene.tweens.add({
      targets: this,
      angle: { from: -2, to: 2 },
      duration: 40,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        this.setAngle(0);
        if (this.state !== "warn") return;
        this.state = "slam";
        this.body.setVelocityY(620);
      },
    });
  }

  _impact() {
    this.body.setVelocityY(0);
    this.y = this.slamY;
    this.state = "down";
    this.scene.cameras.main.shake(120, 0.006);
    if (this.scene.cache.audio.exists("watermelonBossLandingSound")) {
      this.scene.sound.play("watermelonBossLandingSound", { volume: 0.5 });
    }
    // Dust kick-out on both sides
    for (let i = 0; i < 4; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const puff = this.scene.add.circle(
        this.x + side * (14 + Math.random() * 6),
        this.y + 12, 3 + Math.random() * 2, 0x9aa3c0, 0.5
      );
      puff.setDepth(59);
      this.scene.tweens.add({
        targets: puff,
        x: puff.x + side * (10 + Math.random() * 10),
        y: puff.y - 4,
        alpha: 0, scale: 1.6,
        duration: 320,
        ease: "Quad.easeOut",
        onComplete: () => puff.destroy(),
      });
    }
    this.scene.time.delayedCall(850, () => {
      if (!this.body) return;
      this.state = "rise";
      this.body.setVelocityY(-65);
    });
  }

  // Shots and seed blasts clink off the steel.
  takeDamage() {
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(40, () => { if (this.active) this.clearTint(); });
  }
}
