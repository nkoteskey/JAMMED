// THE CANNING COLOSSUS — boss of The Jam Works. A towering preserves
// jar on a ceiling rail, piloted by the angry jam inside. All runtime
// pixel art, like the rest of the factory.
//
// Phase 1 (glass): slides along the rail over Jammy, then either
//   - SLAM: telegraphs with a rattle and drops like a Jam Press; the
//     impact sends two ground shockwaves outward (jump them), or
//   - POUR: tips and pours a spread of jam globs that rain down.
//   The glass takes hits from any weapon (Bass does double).
// Phase 2 (freed jam): the glass shatters, the lid flies off, and the
//   giant blob inside hops around the floor charging at Jammy and
//   spitting smaller globs. Faster, but every hit counts.
class CanningColossus extends Phaser.Physics.Arcade.Sprite {
  static ensureTextures(scn) {
    if (scn.textures.exists("colossus-jar")) return;

    const drawJar = (g, cracked, shattered) => {
      // 56x72. Boots at the bottom, glass body, jam inside, lid on top
      // boots
      g.fillStyle(0x2a1c36, 1);
      g.fillRect(8, 66, 14, 6);
      g.fillRect(34, 66, 14, 6);
      if (!shattered) {
        // glass body
        g.fillStyle(0xbfe8f4, 0.45);
        g.fillRect(4, 14, 48, 52);
        g.lineStyle(2, 0x8ec4d8, 0.95);
        g.strokeRect(4, 14, 48, 52);
      }
      // jam filling
      g.fillStyle(0xd02a60, 1);
      g.fillRect(7, shattered ? 30 : 26, 42, 36);
      g.fillStyle(0x9c1c48, 1);
      g.fillRect(7, 58, 42, 8);
      g.fillStyle(0xe8638c, 1);
      g.fillRect(10, 28, 36, 4);
      // furious eyes in the jam
      g.fillStyle(0xffffff, 1);
      g.fillRect(13, 36, 11, 9);
      g.fillRect(32, 36, 11, 9);
      g.fillStyle(0x40081c, 1);
      g.fillRect(17, 39, 5, 5);
      g.fillRect(35, 39, 5, 5);
      // brows
      g.fillRect(12, 32, 12, 3);
      g.fillRect(32, 32, 12, 3);
      // gritted mouth
      g.fillRect(18, 50, 20, 5);
      g.fillStyle(0xffffff, 1);
      for (let x = 20; x < 37; x += 4) g.fillRect(x, 51, 2, 3);
      if (!shattered) {
        // shine
        g.fillStyle(0xffffff, 0.6);
        g.fillRect(8, 18, 3, 40);
        // lid
        g.fillStyle(0x8c96b0, 1);
        g.fillRect(0, 4, 56, 12);
        g.fillStyle(0xb8c2da, 1);
        g.fillRect(0, 4, 56, 3);
        g.fillStyle(0x5d6680, 1);
        for (let x = 3; x < 56; x += 6) g.fillRect(x, 9, 2, 6);
        // crown badge on the lid — Baron Pectin's seal
        g.fillStyle(0xffd066, 1);
        g.fillRect(22, 0, 12, 5);
        g.fillRect(22, -0, 2, 2);
        g.fillRect(27, 0, 2, 2);
        g.fillRect(32, 0, 2, 2);
      }
      if (cracked && !shattered) {
        g.lineStyle(1, 0xffffff, 0.95);
        g.beginPath();
        g.moveTo(14, 18);
        g.lineTo(22, 30);
        g.lineTo(16, 42);
        g.lineTo(26, 58);
        g.strokePath();
        g.beginPath();
        g.moveTo(44, 20);
        g.lineTo(38, 34);
        g.lineTo(46, 48);
        g.strokePath();
      }
    };

    let g = scn.make.graphics({ x: 0, y: 0, add: false });
    drawJar(g, false, false);
    g.generateTexture("colossus-jar", 56, 72);
    g.destroy();
    g = scn.make.graphics({ x: 0, y: 0, add: false });
    drawJar(g, true, false);
    g.generateTexture("colossus-jar-cracked", 56, 72);
    g.destroy();

    // Freed blob: 48x40 round and squished
    const drawBlob = (key, w, h) => {
      const gg = scn.make.graphics({ x: 0, y: 0, add: false });
      gg.fillStyle(0x9c1c48, 1);
      gg.fillEllipse(w / 2, h / 2, w, h);
      gg.fillStyle(0xd02a60, 1);
      gg.fillEllipse(w / 2, h / 2, w - 6, h - 6);
      gg.fillStyle(0xff7aa2, 1);
      gg.fillEllipse(w * 0.3, h * 0.28, 8, 5);
      gg.fillStyle(0xffffff, 1);
      gg.fillRect(w * 0.28, h * 0.38, 9, 8);
      gg.fillRect(w * 0.58, h * 0.38, 9, 8);
      gg.fillStyle(0x40081c, 1);
      gg.fillRect(w * 0.28 + 3, h * 0.38 + 3, 4, 4);
      gg.fillRect(w * 0.58 + 3, h * 0.38 + 3, 4, 4);
      gg.fillRect(w * 0.36, h * 0.66, w * 0.3, 4);
      gg.generateTexture(key, w, h);
      gg.destroy();
    };
    drawBlob("colossus-blob", 48, 40);
    drawBlob("colossus-blob-squish", 56, 30);

    // Small glob projectile 10x10
    g = scn.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x9c1c48, 1);
    g.fillCircle(5, 5, 5);
    g.fillStyle(0xe0407a, 1);
    g.fillCircle(5, 5, 3.5);
    g.fillStyle(0xff9ab8, 1);
    g.fillRect(3, 2, 2, 2);
    g.generateTexture("jam-glob", 10, 10);
    g.destroy();

    // Ground shockwave 16x12
    g = scn.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xe8638c, 1);
    g.fillTriangle(0, 12, 8, 0, 16, 12);
    g.fillStyle(0xff9ab8, 1);
    g.fillTriangle(4, 12, 8, 4, 12, 12);
    g.generateTexture("jam-shockwave", 16, 12);
    g.destroy();
  }

  constructor(scn, x, railY, floorY) {
    CanningColossus.ensureTextures(scn);
    super(scn, x, railY, "colossus-jar");
    scn.add.existing(this);
    scn.physics.add.existing(this);

    this.score = 10000;
    this.maxHP = 40;
    this.hp = this.maxHP;
    this.phase = 1;
    this.railY = railY;
    this.floorY = floorY; // y where the jar's feet rest when slammed
    this.alive = true;
    this.dead = false;
    this.invincible = false;
    this.state = "intro";
    this.nextActionAt = scn.time.now + 2200;
    this.speedScale = getRunState() && getRunState().hard ? 1.25 : 1;
    this._hopAt = 0;
    this._spitAt = 0;

    this.setDepth(70);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.setSize(46, 60, true);

    scn.enemies.add(this);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);

    // Contact hurts
    this.jammyOverlap = scn.physics.add.overlap(this, scn.jammy.sprite, () => {
      if (this.dead || !this.scene.jammy.alive) return;
      if (this.state === "intro") return;
      this.scene.jammy.takeDamage(this.x);
    });
  }

  update() {
    if (this.dead || !this.body) return;
    const s = this.scene;
    const j = s.jammy;
    if (!j || !j.alive) {
      this.body.setVelocity(0, 0);
      return;
    }
    const now = s.time.now;

    if (this.phase === 1) this._updateJar(now, j);
    else this._updateBlob(now, j);
  }

  // ---------------- Phase 1: the jar on the rail ----------------
  _updateJar(now, j) {
    const s = this.scene;
    if (this.state === "intro") {
      if (now >= this.nextActionAt) this.state = "track";
      return;
    }
    if (this.state === "track") {
      // Slide along the rail toward Jammy. The rail stops short of the
      // side steps, so those are safe from slams (but not from pours).
      const minX = 112, maxX = s.map.widthInPixels - 112;
      const targetX = Phaser.Math.Clamp(j.sprite.x, minX, maxX);
      const dx = targetX - this.x;
      const vx = Phaser.Math.Clamp(dx * 3, -110 * this.speedScale, 110 * this.speedScale);
      this.body.setVelocityX(vx);
      this.y = this.railY + Math.sin(now / 200) * 2;
      if (now >= this.nextActionAt && Math.abs(dx) < 60) {
        this.body.setVelocityX(0);
        if (Math.random() < 0.55) this._beginSlam();
        else this._beginPour();
      }
    } else if (this.state === "slam") {
      // Land on the floor — or on anything else in the way
      if (this.y >= this.floorY || this.body.blocked.down) this._impact();
    } else if (this.state === "rise") {
      if (this.y <= this.railY) {
        this.y = this.railY;
        this.body.setVelocityY(0);
        this.state = "track";
        this.nextActionAt = now + 900 / this.speedScale;
      }
    }
  }

  _beginSlam() {
    this.state = "warn";
    this.scene.tweens.add({
      targets: this,
      angle: { from: -3, to: 3 },
      duration: 45,
      yoyo: true,
      repeat: 5,
      onComplete: () => {
        this.setAngle(0);
        if (this.dead || this.phase !== 1) return;
        this.state = "slam";
        this.body.setVelocityY(560 * this.speedScale);
      },
    });
  }

  _impact() {
    const s = this.scene;
    this.body.setVelocityY(0);
    this.y = Math.min(this.y, this.floorY);
    this.state = "down";
    s.cameras.main.shake(180, 0.008);
    s.sound.play("watermelonBossLandingSound", { volume: 0.7 });
    // Shockwaves outward along the floor
    [-1, 1].forEach((dir) => this._shockwave(dir));
    s.time.delayedCall(900 / this.speedScale, () => {
      if (this.dead || this.phase !== 1) return;
      this.state = "rise";
      this.body.setVelocityY(-80);
    });
  }

  _shockwave(dir) {
    const s = this.scene;
    const w = s.physics.add.sprite(this.x + dir * 30, this.floorY + 30, "jam-shockwave");
    w.setDepth(69);
    s.enemyProjectiles.add(w);
    w.body.setAllowGravity(false);
    w.body.setSize(12, 10);
    w.body.setVelocityX(dir * 170 * this.speedScale);
    w.invincible = true;
    w.die = () => w.destroy();
    s.time.delayedCall(1600, () => {
      if (w.active) w.destroy();
    });
  }

  _beginPour() {
    const s = this.scene;
    this.state = "pour";
    const dir = this.scene.jammy.sprite.x < this.x ? -1 : 1;
    s.tweens.add({
      targets: this,
      angle: dir * 28,
      duration: 260,
      ease: "Sine.easeOut",
      onComplete: () => {
        if (this.dead || this.phase !== 1) return;
        // Spread of globs
        for (let i = 0; i < 5; i++) {
          s.time.delayedCall(i * 110, () => {
            if (this.dead || this.phase !== 1) return;
            this._glob(this.x + dir * 20, this.y + 10, dir * (40 + i * 35), -60 + i * 10);
          });
        }
        s.sound.play("blueberryBombDropSound", { volume: 0.6, rate: 0.7 });
        s.time.delayedCall(800, () => {
          if (this.dead) return;
          s.tweens.add({
            targets: this,
            angle: 0,
            duration: 220,
            onComplete: () => {
              if (this.dead || this.phase !== 1) return;
              this.state = "track";
              this.nextActionAt = s.time.now + 700 / this.speedScale;
            },
          });
        });
      },
    });
  }

  _glob(x, y, vx, vy) {
    const s = this.scene;
    const g = s.physics.add.sprite(x, y, "jam-glob");
    g.setDepth(69);
    s.enemyProjectiles.add(g);
    g.body.setAllowGravity(true);
    g.body.setSize(8, 8);
    g.body.setVelocity(vx * this.speedScale, vy);
    g.invincible = true;
    g.die = () => {
      if (!g.active) return;
      for (let i = 0; i < 3; i++) {
        const d = s.add.circle(g.x, g.y, 1.5, 0xe0407a, 0.9).setDepth(68);
        s.tweens.add({
          targets: d,
          x: g.x + Phaser.Math.Between(-8, 8),
          y: g.y - Phaser.Math.Between(2, 10),
          alpha: 0,
          duration: 220,
          onComplete: () => d.destroy(),
        });
      }
      g.destroy();
    };
    if (s.groundLayer) s.physics.add.collider(g, s.groundLayer, () => g.die());
    s.time.delayedCall(3000, () => {
      if (g.active) g.die();
    });
  }

  // ---------------- Phase 2: the freed jam ----------------
  _updateBlob(now, j) {
    const s = this.scene;
    const grounded = this.body.blocked.down;
    this.setTexture(grounded ? "colossus-blob-squish" : "colossus-blob");
    if (grounded) {
      this.body.setVelocityX(0);
      if (now >= this._hopAt) {
        const dir = j.sprite.x > this.x ? 1 : -1;
        this.setFlipX(dir < 0);
        const big = Math.random() < 0.35;
        this.body.setVelocity(dir * (big ? 160 : 110) * this.speedScale, big ? -380 : -260);
        this._hopAt = now + (big ? 1100 : 700) / this.speedScale;
        s.sound.play("jumpSound", { rate: 0.5, volume: 0.5 });
        if (now >= this._spitAt) {
          this._spitAt = now + 2600 / this.speedScale;
          for (let i = -1; i <= 1; i++) this._glob(this.x, this.y - 10, i * 90 + dir * 40, -220);
        }
      }
    }
  }

  _shatter() {
    const s = this.scene;
    this.phase = 2;
    this.state = "blob";
    this.invincible = true;
    s.time.delayedCall(900, () => {
      this.invincible = false;
    });
    s.cameras.main.shake(300, 0.01);
    s.sound.play("enemyHitSound", { rate: 0.5, volume: 1 });
    s.sound.play("shortExplosion", { volume: 0.8 });

    // Glass shards everywhere, lid flies off
    for (let i = 0; i < 16; i++) {
      const ang = Math.random() * Math.PI * 2;
      const shard = s.add
        .triangle(this.x, this.y, 0, 4, 3, 0, 6, 4, 0xcfeefb, 0.95)
        .setDepth(80);
      s.tweens.add({
        targets: shard,
        x: this.x + Math.cos(ang) * (30 + Math.random() * 50),
        y: this.y + Math.sin(ang) * 30 + 40,
        angle: 180 + Math.random() * 360,
        alpha: 0,
        duration: 600,
        ease: "Quad.easeOut",
        onComplete: () => shard.destroy(),
      });
    }
    const lid = s.add.rectangle(this.x, this.y - 30, 56, 12, 0x8c96b0).setDepth(81);
    s.tweens.add({
      targets: lid,
      y: this.y - 160,
      x: this.x + 60,
      angle: 540,
      alpha: 0,
      duration: 900,
      ease: "Quad.easeOut",
      onComplete: () => lid.destroy(),
    });

    this.setAngle(0);
    this.setTexture("colossus-blob");
    this.body.setSize(40, 34, true);
    this.body.setAllowGravity(true);
    this.body.setImmovable(false);
    this.body.setVelocity(0, -200);
    this._hopAt = s.time.now + 1000;
    this._spitAt = s.time.now + 1500;
    if (s.onBossPhase) s.onBossPhase(2);
  }

  takeDamage(val = 1) {
    if (this.dead || this.invincible || this.state === "intro") return;
    // Bass wave rattles glass hardest
    let dmg = Math.max(1, val || 1);
    this.hp -= dmg;
    this.setTint(0xff6666);
    this.scene.time.delayedCall(60, () => {
      if (this.active) this.clearTint();
    });
    this.scene.sound.play("enemyHitSound");
    this.invincible = true;
    this.scene.time.delayedCall(90, () => {
      this.invincible = false;
    });
    if (this.phase === 1) {
      if (this.hp <= this.maxHP / 2) this._shatter();
      else if (this.hp <= this.maxHP * 0.75) this.setTexture("colossus-jar-cracked");
    } else if (this.hp <= 0) {
      this.die();
    }
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.alive = false;
    this.invincible = true;
    const s = this.scene;
    awardScore(s, this.score, this.x, this.y);
    this.body.setVelocity(0, 0);
    this.body.setAllowGravity(false);
    this.body.setEnable(false);
    if (this.jammyOverlap) this.jammyOverlap.destroy();
    [
      [0, 0],
      [18, 12],
      [-18, 12],
      [14, -14],
      [-14, -14],
      [0, 20],
    ].forEach(([dx, dy], i) => {
      s.time.delayedCall(i * 140, () => new EnemyDeath(s, this.x + dx, this.y + dy));
    });
    s.sound.stopByKey("BossBattle");
    s.sound.play("bossDeathSound");
    s.cameras.main.shake(500, 0.012);
    s.tweens.add({
      targets: this,
      alpha: 0,
      scaleX: 1.3,
      scaleY: 0.4,
      duration: 900,
      delay: 300,
    });
    if (s.bossDefeated) s.bossDefeated();
  }
}
