// COUNT CURRANT — Baron Pectin's foreman and the boss of the Preserve
// Mines (Stage 2-3). A pompous blackcurrant in a mining helmet, monocle
// and mustache, riding a steam drill-cart along the arena floor. Three
// moves on a loop, each telegraphed:
//   CHARGE — revs, then drives the drill at Jammy. The cart is armored
//            while it charges (shots clink off): jump it. It only stops
//            when it hits the arena wall, and then he's DAZED for a
//            moment, which is the window to pile on damage.
//   JARS   — lobs preserve jars that burst into jam droplets on landing.
//   DRILL  — parks mid-arena and drills the ceiling: jam blobs rain
//            down where the warning glows appear.
// 24 HP (30 in hard mode). Berserk at half health: faster charges, three
// jars, more blobs. All guitars work in the mines (the furnaces keep
// them warm).
class CountCurrant extends Phaser.Physics.Arcade.Sprite {
  static ensureTextures(scn) {
    if (scn.textures.exists("count-currant")) return;
    const draw = (key, pose) => {
      const g = scn.make.graphics({ x: 0, y: 0, add: false });
      // 48x40, facing right. Cart along the bottom, the Count on top.
      // Cart body
      g.fillStyle(0x3a3a44, 1);
      g.fillRect(6, 22, 32, 12);
      g.fillStyle(0x5a5a68, 1);
      g.fillRect(8, 24, 28, 3);
      g.fillStyle(0x8c6440, 1);
      g.fillRect(10, 20, 24, 3);
      // Drill cone at the front
      g.fillStyle(0xb8c2da, 1);
      g.fillTriangle(38, 22, 48, 28, 38, 34);
      g.fillStyle(0x7a8498, 1);
      g.fillRect(39, 26, 6, 1);
      g.fillRect(40, 30, 4, 1);
      // Wheels
      g.fillStyle(0x1c1c24, 1);
      g.fillCircle(13, 35, 5);
      g.fillCircle(31, 35, 5);
      g.fillStyle(0x8c96b0, 1);
      g.fillCircle(13, 35, 2);
      g.fillCircle(31, 35, 2);
      // Smokestack
      g.fillStyle(0x2a2a34, 1);
      g.fillRect(8, 12, 5, 10);
      // The Count: round blackcurrant
      const by = pose === "dazed" ? 10 : 8;
      g.fillStyle(0x2a1040, 1);
      g.fillCircle(24, by + 4, 9);
      g.fillStyle(0x4a2070, 1);
      g.fillCircle(21, by + 1, 3);
      // Helmet with headlamp
      g.fillStyle(0xd8b040, 1);
      g.fillRect(15, by - 6, 18, 5);
      g.fillRect(17, by - 8, 14, 3);
      g.fillStyle(0xfff4c0, 1);
      g.fillRect(29, by - 5, 4, 3);
      // Eyes + monocle
      g.fillStyle(0xffffff, 1);
      g.fillRect(21, by + 1, 3, 3);
      g.fillRect(27, by + 1, 3, 3);
      g.fillStyle(0x101830, 1);
      if (pose === "dazed") {
        g.fillRect(21, by + 2, 3, 1);
        g.fillRect(27, by + 2, 3, 1);
      } else {
        g.fillRect(22, by + 2, 2, 2);
        g.fillRect(28, by + 2, 2, 2);
        g.fillRect(20, by - 1, 4, 1);
        g.fillRect(27, by - 1, 4, 1);
      }
      g.lineStyle(1, 0xffd066, 1);
      g.strokeCircle(28, by + 2, 3);
      g.fillStyle(0xffd066, 1);
      g.fillRect(31, by + 3, 1, 4);
      // Mustache
      g.fillStyle(0x101010, 1);
      g.fillRect(19, by + 6, 4, 2);
      g.fillRect(27, by + 6, 4, 2);
      g.fillRect(23, by + 7, 4, 1);
      if (pose === "roar") {
        g.fillStyle(0x3a1030, 1);
        g.fillRect(22, by + 8, 6, 3);
      }
      g.generateTexture(key, 48, 40);
      g.destroy();
    };
    draw("count-currant", "idle");
    draw("count-currant-roar", "roar");
    draw("count-currant-dazed", "dazed");
    // Preserve jar projectile and jam blob
    let g = scn.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xc23a66, 1);
    g.fillRect(1, 3, 8, 9);
    g.fillStyle(0xe85a88, 1);
    g.fillRect(2, 4, 2, 6);
    g.fillStyle(0xd8b040, 1);
    g.fillRect(0, 0, 10, 3);
    g.fillStyle(0xffffff, 0.5);
    g.fillRect(7, 4, 1, 7);
    g.generateTexture("jam-jar", 10, 12);
    g.destroy();
    g = scn.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xc23a66, 1);
    g.fillCircle(6, 6, 6);
    g.fillStyle(0xe85a88, 1);
    g.fillCircle(4, 4, 2);
    g.generateTexture("jam-blob", 12, 12);
    g.destroy();
  }

  constructor(scn, x, y, opts = {}) {
    CountCurrant.ensureTextures(scn);
    super(scn, x, y, "count-currant");
    scn.add.existing(this);
    scn.physics.add.existing(this);

    this.score = 6000;
    const run = typeof getRunState === "function" ? getRunState() : null;
    this.maxHP = run && run.hard ? 30 : 24;
    this.hp = this.maxHP;
    this.enraged = false;
    this.dead = false;
    this.alive = true;
    this.invincible = false;
    this.state = "sleep";
    this.arenaL = opts.arenaL || 0;
    this.arenaR = opts.arenaR || 10000;
    this.ceilingY = opts.ceilingY || 40;
    this.wakeRange = opts.wakeRange || 220;
    this.onDefeated = opts.onDefeated || null;
    this.nextActionAt = 0;
    this.speedScale = enemySpeedScale();
    this._moveIdx = 0;
    this._lastClink = 0;

    this.setDepth(66);
    this.body.setAllowGravity(true);
    this.body.setSize(40, 34);
    this.body.setOffset(4, 6);
    this.body.setBounce(0);
    scn.enemies.add(this);

    this.jammyOverlap = scn.physics.add.overlap(this, scn.jammy.sprite, () => {
      if (this.dead || this.state === "sleep" || !this.scene.jammy.alive) return;
      this.scene.jammy.takeDamage(this.x);
    });

    // Steam from the stack while he's awake
    this._steam = scn.time.addEvent({
      delay: 160,
      loop: true,
      callback: () => {
        if (this.dead || !this.active || this.state === "sleep") return;
        const sx = this.x + (this.flipX ? 14 : -14);
        const p = scn.add.circle(sx, this.y - 10, 2, 0xd8d8e0, 0.6).setDepth(65);
        scn.tweens.add({ targets: p, y: p.y - 16, alpha: 0, scale: 2, duration: 500, onComplete: () => p.destroy() });
      },
    });
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (this._steam) this._steam.remove(false);
    });
  }

  update() {
    if (this.dead || !this.body) return;
    const s = this.scene;
    const j = s.jammy;
    if (!j || !j.alive) {
      this.body.setVelocityX(0);
      return;
    }
    const now = s.time.now;
    const dx = j.sprite.x - this.x;

    if (this.state === "sleep") {
      if (Math.abs(dx) < this.wakeRange) this._wake();
      return;
    }
    if (this.state === "idle") {
      this.setFlipX(dx < 0);
      const v = this.enraged ? 70 : 50;
      this.body.setVelocityX(Phaser.Math.Clamp(dx, -v, v) * this.speedScale);
      if (now >= this.nextActionAt) this._nextMove(dx);
    } else if (this.state === "charge") {
      // Grind sparks under the drill
      if (Math.random() < 0.5) {
        const sp = s.add.rectangle(this.x + (this.flipX ? -22 : 22), this.y + 16, 2, 2, 0xffd066).setDepth(67);
        s.tweens.add({ targets: sp, x: sp.x - (this.flipX ? -1 : 1) * 12, y: sp.y - 8, alpha: 0, duration: 200, onComplete: () => sp.destroy() });
      }
      if (this.body.blocked.left || this.body.blocked.right || now >= this._chargeUntil) this._daze();
    } else if (this.state === "park") {
      const cx = (this.arenaL + this.arenaR) / 2;
      const d = cx - this.x;
      if (Math.abs(d) < 6) {
        this.body.setVelocityX(0);
        this._drill();
      } else {
        this.body.setVelocityX(Math.sign(d) * 180 * this.speedScale);
      }
    }
  }

  _wake() {
    this.state = "wake";
    this.setTexture("count-currant-roar");
    const s = this.scene;
    s.cameras.main.shake(250, 0.006);
    s.sound.play("watermelonBossLandingSound", { volume: 0.6, rate: 0.9 });
    const t1 = s.add.bitmapText(213, 92, "tempFont", "COUNT CURRANT", 14).setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xc8a0ff);
    const t2 = s.add.bitmapText(213, 110, "tempFont", "FOREMAN OF THE PRESERVE MINES", 8).setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xffffff);
    const t3 = s.add.bitmapText(213, 126, "tempFont", '"THE BARON PAYS BY THE JAR, NOT BY THE HOUR!"', 8).setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xffd066);
    s.tweens.add({ targets: [t1, t2, t3], alpha: 0, delay: 2200, duration: 400, onComplete: () => [t1, t2, t3].forEach((t) => t.destroy()) });
    s.time.delayedCall(1100, () => {
      if (this.dead) return;
      this.setTexture("count-currant");
      this.state = "idle";
      this.nextActionAt = s.time.now + 600;
    });
  }

  _nextMove(dx) {
    const moves = ["charge", "jars", "charge", "drill"];
    const pick = Math.random() < 0.25 ? moves[Phaser.Math.Between(0, 3)] : moves[this._moveIdx % 4];
    this._moveIdx += 1;
    this.state = "rev";
    this.body.setVelocityX(0);
    this.setTexture("count-currant-roar");
    this.scene.sound.play("enemyHitSound", { rate: 0.5, volume: 0.6 });
    // Rev shiver
    this.scene.tweens.add({ targets: this, x: { from: this.x - 1, to: this.x + 1 }, duration: 40, yoyo: true, repeat: 5 });
    this.scene.time.delayedCall(this.enraged ? 300 : 460, () => {
      if (this.dead) return;
      if (pick === "charge") this._charge();
      else if (pick === "jars") this._jars();
      else this._park();
    });
  }

  _charge() {
    const j = this.scene.jammy;
    const dir = j.sprite.x < this.x ? -1 : 1;
    this.setFlipX(dir < 0);
    this.setTexture("count-currant");
    this.state = "charge";
    this.invincible = true; // armored: the drill is out front
    this.body.setVelocityX(dir * (this.enraged ? 300 : 240) * this.speedScale);
    this._chargeUntil = this.scene.time.now + 2600;
    this.scene.sound.play("laserSound", { volume: 0.5, rate: 0.35 });
  }

  _daze() {
    const s = this.scene;
    this.state = "dazed";
    this.invincible = false;
    this.body.setVelocityX(0);
    this.setTexture("count-currant-dazed");
    s.cameras.main.shake(220, 0.009);
    s.sound.play("watermelonBossLandingSound", { volume: 0.7, rate: 1.1 });
    // Rock dust off the wall
    for (let i = 0; i < 8; i++) {
      const d = s.add.rectangle(this.x + (this.flipX ? -24 : 24), this.y + Phaser.Math.Between(-14, 14), 2, 2, 0x8a7a92).setDepth(67);
      s.tweens.add({ targets: d, x: d.x - (this.flipX ? -1 : 1) * Phaser.Math.Between(6, 20), y: d.y - Phaser.Math.Between(4, 16), alpha: 0, duration: 360, onComplete: () => d.destroy() });
    }
    const stars = [];
    for (let i = 0; i < 3; i++) {
      const st = s.add.bitmapText(this.x, this.y - 26, "tempFont", "*", 8).setOrigin(0.5).setDepth(300).setTintFill(0xffd066);
      stars.push(st);
    }
    const spin = s.time.addEvent({
      delay: 40,
      loop: true,
      callback: () => {
        const t = s.time.now / 180;
        stars.forEach((st, i) => st.setPosition(this.x + Math.cos(t + (i * Math.PI * 2) / 3) * 14, this.y - 26 + Math.sin(t + (i * Math.PI * 2) / 3) * 4));
      },
    });
    s.time.delayedCall(this.enraged ? 1100 : 1500, () => {
      spin.remove(false);
      stars.forEach((st) => st.destroy());
      if (this.dead) return;
      this._endMove(500);
    });
  }

  _jars() {
    const s = this.scene;
    this.state = "jars";
    this.setTexture("count-currant-roar");
    const j = s.jammy;
    const delays = this.enraged ? [0, 240, 480] : [0, 300];
    delays.forEach((delay, i) => {
      s.time.delayedCall(delay, () => {
        if (this.dead) return;
        const dx = j.sprite.x - this.x;
        const dir = dx < 0 ? -1 : 1;
        this.setFlipX(dir < 0);
        const b = s.physics.add.sprite(this.x, this.y - 18, "jam-jar");
        b.setDepth(65);
        s.enemyProjectiles.add(b);
        b.body.setAllowGravity(true);
        b.body.setSize(8, 10);
        const vy = -320;
        const t = (2 * -vy) / 900;
        b.body.setVelocity((dir * Math.min(Math.abs(dx) + i * 26, 360)) / t, vy);
        b.setAngularVelocity(dir * 300);
        b.invincible = true;
        b.die = () => {
          if (!b.active) return;
          // Burst into droplets
          [[-90, -170], [0, -210], [90, -170]].forEach(([vx, vy2]) => {
            const d = s.physics.add.sprite(b.x, b.y - 4, "jam-blob").setScale(0.6).setDepth(65);
            s.enemyProjectiles.add(d);
            d.body.setAllowGravity(true);
            d.body.setCircle(3);
            d.body.setVelocity(vx, vy2);
            d.invincible = true;
            d.die = () => d.destroy();
            if (s.groundLayer) s.physics.add.collider(d, s.groundLayer, () => d.die());
            s.time.delayedCall(1800, () => { if (d.active) d.die(); });
          });
          s.sound.play("enemyHitSound", { rate: 1.8, volume: 0.5 });
          b.destroy();
        };
        if (s.groundLayer) s.physics.add.collider(b, s.groundLayer, () => b.die());
        s.time.delayedCall(3000, () => { if (b.active) b.die(); });
        s.sound.play("blueberryBombDropSound", { volume: 0.5, rate: 0.7 });
      });
    });
    this._endMove(this.enraged ? 1000 : 1200);
  }

  _park() {
    this.state = "park";
    this.setTexture("count-currant");
  }

  _drill() {
    const s = this.scene;
    this.state = "drill";
    this.setTexture("count-currant-roar");
    s.cameras.main.shake(700, 0.006);
    s.sound.play("laserSound", { volume: 0.5, rate: 0.3 });
    const j = s.jammy;
    const n = this.enraged ? 6 : 4;
    const xs = [];
    for (let i = 0; i < n; i++) {
      const base = i === 0 ? j.sprite.x : Phaser.Math.Between(this.arenaL + 16, this.arenaR - 16);
      xs.push(Phaser.Math.Clamp(base, this.arenaL + 12, this.arenaR - 12));
    }
    xs.forEach((x, i) => {
      s.time.delayedCall(200 + i * 160, () => {
        if (this.dead) return;
        // Warning glow on the ceiling, then the blob
        const warn = s.add.circle(x, this.ceilingY + 4, 5, 0xe85a88, 0.8).setDepth(64);
        s.tweens.add({ targets: warn, scale: 1.8, alpha: 0.2, duration: 160, yoyo: true, repeat: 2, onComplete: () => warn.destroy() });
        s.time.delayedCall(520, () => {
          if (this.dead) return;
          const d = s.physics.add.sprite(x, this.ceilingY + 6, "jam-blob").setDepth(65);
          s.enemyProjectiles.add(d);
          d.body.setAllowGravity(true);
          d.body.setCircle(5);
          d.body.setVelocityY(60);
          d.invincible = true;
          d.die = () => {
            if (!d.active) return;
            for (let k = 0; k < 4; k++) {
              const p = s.add.rectangle(d.x, d.y, 2, 2, 0xe85a88).setDepth(64);
              s.tweens.add({ targets: p, x: d.x + Phaser.Math.Between(-10, 10), y: d.y - Phaser.Math.Between(2, 10), alpha: 0, duration: 240, onComplete: () => p.destroy() });
            }
            d.destroy();
          };
          if (s.groundLayer) s.physics.add.collider(d, s.groundLayer, () => d.die());
          s.time.delayedCall(2500, () => { if (d.active) d.die(); });
        });
      });
    });
    this._endMove(900 + n * 160);
  }

  _endMove(delayMs) {
    this.scene.time.delayedCall(delayMs, () => {
      if (this.dead) return;
      this.invincible = false;
      this.body.setVelocityX(0);
      this.setTexture("count-currant");
      this.state = "idle";
      this.nextActionAt = this.scene.time.now + (this.enraged ? 500 : 800) / this.speedScale;
    });
  }

  _enrage() {
    if (this.enraged || this.dead) return;
    this.enraged = true;
    const s = this.scene;
    s.cameras.main.shake(300, 0.008);
    s.sound.play("watermelonBossLandingSound", { volume: 0.6, rate: 0.6 });
    const t = s.add.bitmapText(this.x, this.y - 34, "tempFont", "OVERTIME!", 8).setOrigin(0.5).setDepth(300).setTintFill(0xc8a0ff);
    s.tweens.add({ targets: t, y: t.y - 18, alpha: 0, duration: 1100, onComplete: () => t.destroy() });
    this.setTint(0xe0c8ff);
  }

  takeDamage(val = 1) {
    if (this.dead || this.state === "sleep" || this.state === "wake") return;
    if (this.invincible) {
      const now = this.scene.time.now;
      if (now - this._lastClink > 120) {
        this._lastClink = now;
        this.scene.sound.play("enemyHitSound", { volume: 0.35, rate: 1.7 });
        const sp = this.scene.add.rectangle(this.x, this.y, 2, 2, 0xffe080).setDepth(67);
        this.scene.tweens.add({ targets: sp, y: sp.y - 12, alpha: 0, duration: 200, onComplete: () => sp.destroy() });
      }
      return;
    }
    this.hp -= Math.max(1, val || 1);
    this.setTint(0xff6666);
    this.scene.time.delayedCall(60, () => {
      if (!this.active) return;
      if (this.enraged) this.setTint(0xe0c8ff);
      else this.clearTint();
    });
    this.scene.sound.play("enemyHitSound");
    this.invincible = true;
    this.scene.time.delayedCall(140, () => {
      if (this.state !== "charge") this.invincible = false;
    });
    if (this.hp > 0 && !this.enraged && this.hp <= Math.ceil(this.maxHP / 2)) this._enrage();
    if (this.hp <= 0) this.die();
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.alive = false;
    this.invincible = true;
    const s = this.scene;
    awardScore(s, this.score, this.x, this.y);
    this.body.setVelocity(0, 0);
    this.body.setEnable(false);
    if (this.jammyOverlap) this.jammyOverlap.destroy();
    if (this._steam) this._steam.remove(false);
    this.setTexture("count-currant-dazed");
    [[0, 0], [16, 8], [-16, 8], [0, -14], [10, -4]].forEach(([dx, dy], i) => {
      s.time.delayedCall(i * 110, () => new EnemyDeath(s, this.x + dx, this.y + dy));
    });
    s.sound.play("bossDeathSound", { volume: 0.7, rate: 1.1 });
    s.cameras.main.shake(400, 0.012);
    const t = s.add
      .bitmapText(213, 100, "tempFont", '"YOU\'LL NEVER CATCH THE BARON IN THE GLASS ORCHARD!"', 8)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300)
      .setTintFill(0xc8a0ff);
    s.tweens.add({ targets: t, alpha: 0, delay: 2400, duration: 400, onComplete: () => t.destroy() });
    // He bails out and the lift hauls him up out of sight
    s.tweens.add({ targets: this, y: this.y - 160, alpha: 0, duration: 1600, delay: 700, ease: "Quad.easeIn", onComplete: () => this.destroy() });
    if (this.onDefeated) this.onDefeated();
  }
}
