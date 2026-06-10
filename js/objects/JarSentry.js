// Factory-floor patroller: a preserves jar with stubby boots. Phase 1
// is the jar — two hits crack and shatter the glass. The jam inside
// survives as a blob that hops angrily at Jammy and dies to one hit.
class JarSentry extends Phaser.Physics.Arcade.Sprite {
  static ensureTextures(scn) {
    if (scn.textures.exists("jar-sentry-full")) return;

    const drawJar = (g, cracked) => {
      // Boots
      g.fillStyle(0x2a1c36, 1);
      g.fillRect(2, 18, 5, 2);
      g.fillRect(9, 18, 5, 2);
      // Glass body
      g.fillStyle(0xbfe8f4, 0.45);
      g.fillRect(2, 5, 12, 13);
      // Jam filling the lower 2/3
      g.fillStyle(0xd02a60, 1);
      g.fillRect(3, 9, 10, 8);
      g.fillStyle(0x9c1c48, 1);
      g.fillRect(3, 15, 10, 2);
      // Angry eyes floating in the jam
      g.fillStyle(0xffffff, 1);
      g.fillRect(4, 10, 3, 3);
      g.fillRect(9, 10, 3, 3);
      g.fillStyle(0x40081c, 1);
      g.fillRect(5, 11, 2, 2);
      g.fillRect(10, 11, 2, 2);
      // Glass outline + shine
      g.lineStyle(1, 0x8ec4d8, 0.9);
      g.strokeRect(2, 5, 12, 13);
      g.fillStyle(0xffffff, 0.7);
      g.fillRect(4, 6, 1, 10);
      // Lid
      g.fillStyle(0x8c96b0, 1);
      g.fillRect(1, 2, 14, 4);
      g.fillStyle(0xb8c2da, 1);
      g.fillRect(1, 2, 14, 1);
      g.fillStyle(0x5d6680, 1);
      for (let x = 2; x < 15; x += 3) g.fillRect(x, 4, 1, 2); // lid ridges
      if (cracked) {
        g.lineStyle(1, 0xffffff, 0.95);
        g.beginPath();
        g.moveTo(5, 6); g.lineTo(8, 10); g.lineTo(6, 13); g.lineTo(10, 17);
        g.strokePath();
        g.beginPath();
        g.moveTo(12, 7); g.lineTo(10, 11);
        g.strokePath();
      }
    };

    let g = scn.make.graphics({ x: 0, y: 0, add: false });
    drawJar(g, false);
    g.generateTexture("jar-sentry-full", 16, 20);
    g.destroy();

    g = scn.make.graphics({ x: 0, y: 0, add: false });
    drawJar(g, true);
    g.generateTexture("jar-sentry-cracked", 16, 20);
    g.destroy();

    // Freed jam blob — round and squished hop frames
    g = scn.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x9c1c48, 1);
    g.fillEllipse(7, 6, 13, 11);
    g.fillStyle(0xd02a60, 1);
    g.fillEllipse(7, 6, 11, 9);
    g.fillStyle(0xff7aa2, 1);
    g.fillEllipse(4, 3, 3, 2);
    g.fillStyle(0xffffff, 1);
    g.fillRect(3, 4, 3, 3);
    g.fillRect(8, 4, 3, 3);
    g.fillStyle(0x40081c, 1);
    g.fillRect(4, 5, 2, 2);
    g.fillRect(9, 5, 2, 2);
    g.generateTexture("jam-blob-round", 14, 12);
    g.destroy();

    g = scn.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x9c1c48, 1);
    g.fillEllipse(8, 5, 16, 8);
    g.fillStyle(0xd02a60, 1);
    g.fillEllipse(8, 5, 14, 6);
    g.fillStyle(0xffffff, 1);
    g.fillRect(4, 3, 3, 3);
    g.fillRect(9, 3, 3, 3);
    g.fillStyle(0x40081c, 1);
    g.fillRect(5, 4, 2, 2);
    g.fillRect(10, 4, 2, 2);
    g.generateTexture("jam-blob-squish", 16, 9);
    g.destroy();
  }

  constructor(scn, x, y) {
    JarSentry.ensureTextures(scn);
    super(scn, x, y, "jar-sentry-full");
    scn.add.existing(this);
    scn.physics.add.existing(this);

    this.score = 600;
    this.phase = "jar";
    this.hp = 2;
    this.dead = false;
    this.invincible = false;
    this.dir = -1;
    this.walkSpeed = 26;
    this._nextHop = 0;

    this.body.setAllowGravity(true);
    this.body.setBounce(0);
    this.body.setSize(12, 17, 2, 3);
    this.setDepth(57);

    this.jammyOverlap = scn.physics.add.overlap(this, scn.jammy.sprite, () => {
      if (!this.dead && this.scene.jammy.alive) {
        this.scene.jammy.takeDamage();
      }
    });

    scn.enemies.add(this);
  }

  update() {
    if (this.dead || !this.body) return;

    // Turn at walls
    if (this.body.blocked.left) this.dir = 1;
    else if (this.body.blocked.right) this.dir = -1;

    if (this.body.blocked.down) {
      // Turn at ledges — peek one step ahead for ground
      const ahead = this.scene.groundLayer.getTileAtWorldXY(
        this.x + this.dir * 10,
        this.y + this.height / 2 + 6
      );
      if (!ahead) this.dir *= -1;
    }

    if (this.phase === "jar") {
      if (this.body.blocked.down) this.body.setVelocityX(this.dir * this.walkSpeed);
      // Stubby-boot waddle
      this.setRotation(Math.sin(this.scene.time.now / 90) * 0.06);
    } else {
      // Blob — squash on the ground, round in the air, hop at Jammy
      const grounded = this.body.blocked.down;
      this.setTexture(grounded ? "jam-blob-squish" : "jam-blob-round");
      const j = this.scene.jammy;
      if (grounded) {
        this.body.setVelocityX(0);
        if (j && j.alive && this.scene.time.now > this._nextHop) {
          this._nextHop = this.scene.time.now + 820;
          this.dir = j.sprite.x > this.x ? 1 : -1;
          this.setFlipX(this.dir < 0);
          this.body.setVelocity(this.dir * 85, -260);
        }
      }
    }
  }

  takeDamage(val = 1) {
    if (this.dead || this.invincible) return;
    this.hp -= val;
    this.setTint(0xff6666);
    this.scene.time.delayedCall(60, () => { if (this.active) this.clearTint(); });
    this.scene.sound.play("enemyHitSound");

    if (this.phase === "jar") {
      if (this.hp === 1) {
        this.setTexture("jar-sentry-cracked");
      } else if (this.hp <= 0) {
        // A big enough hit (seed blast) shatters jar AND jam at once
        if (this.hp <= -1) return this.die();
        this.breakJar();
      }
    } else if (this.hp <= 0) {
      this.die();
    }
  }

  breakJar() {
    this.phase = "blob";
    this.hp = 1;
    this.invincible = true; // brief mercy window so one volley ≠ instant kill
    this.scene.time.delayedCall(500, () => { this.invincible = false; });

    // Glass shatter burst
    for (let i = 0; i < 6; i++) {
      const ang = Math.random() * Math.PI * 2;
      const shard = this.scene.add.triangle(
        this.x, this.y - 4, 0, 3, 2, 0, 4, 3, 0xcfeefb, 0.9
      );
      shard.setDepth(80);
      this.scene.tweens.add({
        targets: shard,
        x: this.x + Math.cos(ang) * (14 + Math.random() * 14),
        y: this.y - 4 + Math.sin(ang) * 12 + 10,
        angle: 180 + Math.random() * 180,
        alpha: 0,
        duration: 380,
        ease: "Quad.easeOut",
        onComplete: () => shard.destroy(),
      });
    }
    this.scene.sound.play("enemyHitSound", { rate: 0.6 });

    this.setRotation(0);
    this.setTexture("jam-blob-round");
    this.body.setSize(11, 9, 1, 2);
    // Freed-jam fury hop
    this.body.setVelocityY(-200);
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.scene.scene.get("UIScene").setScore(this.score);
    new EnemyDeath(this.scene, this.x, this.y);
    this.body.setEnable(false);
    this.destroy();
  }
}
