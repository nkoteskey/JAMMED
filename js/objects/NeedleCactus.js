// Goofy-eyed desert cactus. Harmless-looking — until Jammy loiters in
// its personal space too long, at which point it puffs up and blasts
// needles in every direction. Its googly pupils lazily track Jammy so
// the player can tell it's watching. Killable with any weapon (3 HP);
// touching it hurts too, so hop it with the Rocket Axe or shoot it out.
class NeedleCactus extends Phaser.Physics.Arcade.Sprite {
  static ensureTextures(scn) {
    if (scn.textures.exists("cactus-body1")) return;

    const drawCactus = (g, puffed, armUp) => {
      const W = puffed ? 26 : 22;
      const cx = 13; // texture is 26 wide for all frames so origin stays put
      const DK = 0x2a6e2c, MD = 0x3e9c40, RIB = 0x2f7c31, LT = 0x66bc60;
      const bw = puffed ? 18 : 14; // trunk width
      const bx = cx - bw / 2;
      // trunk
      g.fillStyle(DK, 1);
      g.fillRect(bx - 1, 5, bw + 2, 25);
      g.fillRect(cx - (bw - 4) / 2 - 1, 2, bw - 2, 4);
      g.fillStyle(MD, 1);
      g.fillRect(bx, 6, bw, 24);
      g.fillRect(cx - (bw - 4) / 2, 3, bw - 4, 4);
      // ribs
      g.fillStyle(RIB, 1);
      g.fillRect(cx - 3, 6, 1, 23);
      g.fillRect(cx + 2, 6, 1, 23);
      // sun-side highlight
      g.fillStyle(LT, 1);
      g.fillRect(bx + 1, 6, 2, 22);
      // arms (little curled-up nubs)
      const armY = armUp ? 12 : 14;
      g.fillStyle(DK, 1);
      g.fillRect(bx - 6, armY, 6, 4);
      g.fillRect(bx - 6, armY - 5, 4, 6);
      g.fillRect(bx + bw, armY + 3, 6, 4);
      g.fillRect(bx + bw + 2, armY - 2, 4, 6);
      g.fillStyle(MD, 1);
      g.fillRect(bx - 5, armY + 1, 5, 2);
      g.fillRect(bx - 5, armY - 4, 2, 6);
      g.fillRect(bx + bw, armY + 4, 5, 2);
      g.fillRect(bx + bw + 3, armY - 1, 2, 6);
      // needles — little white ticks; longer + denser when puffed
      g.fillStyle(0xf0f4d8, 1);
      const len = puffed ? 3 : 2;
      for (let yy = 7; yy < 28; yy += 4) {
        g.fillRect(bx - len, yy, len, 1);
        g.fillRect(bx + bw, yy + 2, len, 1);
      }
      for (let xx = bx + 2; xx < bx + bw - 1; xx += 4) {
        g.fillRect(xx, 3 - (puffed ? 2 : 1), 1, puffed ? 2 : 1);
      }
      // goofy flower on top, tilted when puffed
      g.fillStyle(0xf06898, 1);
      g.fillRect(cx + (puffed ? 4 : 2), 0, 5, 3);
      g.fillStyle(0xfff0b0, 1);
      g.fillRect(cx + (puffed ? 6 : 4), 1, 1, 1);
      // big goofy sclera (pupils are live objects that track Jammy)
      g.fillStyle(0xffffff, 1);
      if (puffed) {
        g.fillRect(cx - 7, 9, 7, 8);
        g.fillRect(cx + 1, 8, 7, 9);
        g.fillStyle(0x2a6e2c, 1);
        g.fillRect(cx - 8, 7, 8, 2); // alarmed brows
        g.fillRect(cx + 1, 6, 8, 2);
        // open yelling mouth
        g.fillStyle(0x1a3a1c, 1);
        g.fillRect(cx - 3, 21, 7, 4);
      } else {
        g.fillRect(cx - 6, 10, 6, 7);
        g.fillRect(cx + 1, 9, 6, 8);
        // dopey little smile
        g.fillStyle(0x1a3a1c, 1);
        g.fillRect(cx - 2, 22, 5, 1);
        g.fillRect(cx - 3, 21, 1, 1);
        g.fillRect(cx + 3, 21, 1, 1);
      }
    };

    let g = scn.make.graphics({ x: 0, y: 0, add: false });
    drawCactus(g, false, false);
    g.generateTexture("cactus-body1", 26, 30);
    g.destroy();

    g = scn.make.graphics({ x: 0, y: 0, add: false });
    drawCactus(g, false, true);
    g.generateTexture("cactus-body2", 26, 30);
    g.destroy();

    g = scn.make.graphics({ x: 0, y: 0, add: false });
    drawCactus(g, true, true);
    g.generateTexture("cactus-puff", 26, 30);
    g.destroy();

    // needle projectile
    g = scn.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xf0f4d8, 1);
    g.fillRect(0, 1, 6, 1);
    g.fillRect(1, 0, 4, 3);
    g.fillStyle(0x8c9468, 1);
    g.fillRect(6, 1, 2, 1); // dark tip
    g.generateTexture("cactus-needle", 8, 3);
    g.destroy();
  }

  constructor(scn, x, y) {
    NeedleCactus.ensureTextures(scn);
    super(scn, x, y, "cactus-body1");
    scn.add.existing(this);
    scn.physics.add.existing(this);

    this.score = 650;
    this.targetable = true; // Blubert lock-on
    this.hp = 3;
    this.dead = false;
    this.state = "idle"; // idle -> puff -> cooldown -> idle
    this.proximityRange = 78;
    this.fuseMs = 1100;
    this._closeSince = 0;
    this._nextIdleSwap = 0;
    this._idleFrame = false;

    this.body.setAllowGravity(true);
    this.body.setImmovable(true);
    this.body.setSize(16, 27, 5, 3);
    this.setDepth(56);

    // Live googly pupils that lazily track Jammy
    this.leftPupil = scn.add.rectangle(x - 3, y - 2, 3, 3, 0x101810);
    this.rightPupil = scn.add.rectangle(x + 4, y - 3, 3, 3, 0x101810);
    this.leftPupil.setDepth(57);
    this.rightPupil.setDepth(57);

    // Spiky to the touch
    this.jammyOverlap = scn.physics.add.overlap(this, scn.jammy.sprite, () => {
      if (!this.dead && this.scene.jammy.alive) this.scene.jammy.takeDamage();
    });

    scn.enemies.add(this);
  }

  update() {
    if (this.dead || !this.body) return;
    const now = this.scene.time.now;
    const j = this.scene.jammy;

    // Googly pupil tracking — laggy wobble so it reads goofy, not sharp
    if (j && j.sprite) {
      const dx = Phaser.Math.Clamp((j.sprite.x - this.x) / 40, -1.5, 1.5);
      const dy = Phaser.Math.Clamp((j.sprite.y - this.y) / 60, -1, 1.5);
      const wob = Math.sin(now / 160) * 0.7;
      this.leftPupil.setPosition(this.x - 4 + dx + wob, this.y - 2 + dy);
      this.rightPupil.setPosition(this.x + 4 + dx - wob, this.y - 3 + dy);
    }

    if (this.state === "idle") {
      // Lazy arm wiggle
      if (now > this._nextIdleSwap) {
        this._nextIdleSwap = now + 600;
        this._idleFrame = !this._idleFrame;
        this.setTexture(this._idleFrame ? "cactus-body2" : "cactus-body1");
      }
      // Personal-space fuse: linger too close for too long and it blows
      if (j && j.alive) {
        const d = Phaser.Math.Distance.Between(this.x, this.y, j.sprite.x, j.sprite.y);
        if (d < this.proximityRange) {
          if (!this._closeSince) this._closeSince = now;
          if (now - this._closeSince > this.fuseMs) this._telegraph();
        } else {
          this._closeSince = 0;
        }
      }
    }
  }

  _telegraph() {
    this.state = "puff";
    this.setTexture("cactus-puff");
    this.scene.tweens.add({
      targets: this,
      angle: { from: -3, to: 3 },
      duration: 50,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        this.setAngle(0);
        this._burst();
      },
    });
  }

  _burst() {
    if (this.dead) return;
    // Needles in every direction (skip straight down — it's planted)
    const count = 10;
    for (let i = 0; i < count; i++) {
      const ang = -Math.PI + (i / count) * Math.PI * 2;
      if (Math.abs(ang - Math.PI / 2) < 0.3) continue;
      this._fireNeedle(ang);
    }
    if (this.scene.cache.audio.exists("laserSound")) {
      this.scene.sound.play("laserSound", { volume: 0.35, rate: 2.4 });
    }
    this.setTexture("cactus-body1");
    this.state = "cooldown";
    this.scene.time.delayedCall(1600, () => {
      if (this.dead) return;
      this.state = "idle";
      this._closeSince = 0;
    });
  }

  _fireNeedle(ang) {
    const speed = 170;
    // Needles outlive the cactus — capture the scene so the callbacks
    // never read this.scene off a destroyed sprite.
    const scn = this.scene;
    const n = scn.physics.add.sprite(
      this.x + Math.cos(ang) * 10,
      this.y - 4 + Math.sin(ang) * 10,
      "cactus-needle"
    );
    n.setRotation(ang);
    n.setDepth(58);
    // Group membership FIRST — physics groups stomp velocity/gravity
    // with their defaults when a child is added.
    if (scn.enemyProjectiles) scn.enemyProjectiles.add(n);
    n.body.setAllowGravity(false);
    n.body.setSize(6, 3);
    n.body.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);

    const jOverlap = scn.physics.add.overlap(n, scn.jammy.sprite, () => {
      if (scn.jammy.alive) scn.jammy.takeDamage();
      n.destroy();
    });
    if (scn.groundLayer) {
      scn.physics.add.collider(n, scn.groundLayer, () => n.destroy());
    }
    scn.time.delayedCall(1300, () => {
      if (jOverlap) jOverlap.destroy();
      if (n.active) n.destroy();
    });
  }

  takeDamage(val = 1) {
    if (this.dead) return;
    this.hp -= val;
    this.setTint(0xff6666);
    this.scene.time.delayedCall(60, () => { if (this.active) this.clearTint(); });
    this.scene.sound.play("enemyHitSound");
    if (this.hp <= 0) this.die();
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.scene.scene.get("UIScene").setScore(this.score);
    new EnemyDeath(this.scene, this.x, this.y);
    if (this.leftPupil) this.leftPupil.destroy();
    if (this.rightPupil) this.rightPupil.destroy();
    this.body.setEnable(false);
    this.destroy();
  }
}
