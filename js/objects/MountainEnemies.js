// Enemies of the Berry Mountains (World 2). All runtime pixel art.
//
//   Frostberry  — a frostbitten Zomberry: a Raspberry with ice in its
//                 veins. Tougher, and it slides when it turns.
//   Snowberry   — a blueberry buried in a snow cap, lobbing snowballs
//                 in an arc whenever Jammy is in range. Static.
//   Icicle      — hangs from the cave ceiling and drops when Jammy
//                 walks underneath. Shatters on the floor.

class Frostberry extends Raspberry {
  constructor(scn, x, y) {
    super(scn, x, y);
    this.hp = 4;
    this.score = 900;
    this.walkSpeed = 40 * enemySpeedScale();
    this.runningSpeed = 95 * enemySpeedScale();
    this.frost = true;
    // Tints multiply, so a red berry can only go cold-purple — the
    // frost sparkle and ice chips sell the rest.
    this.frostTint = 0x7a8cff;
    this.setTint(this.frostTint);
    this._sparkle = scn.time.addEvent({
      delay: 380,
      loop: true,
      callback: () => {
        if (this.dead || !this.active) return;
        const c = scn.add
          .rectangle(this.x + Phaser.Math.Between(-8, 8), this.y + Phaser.Math.Between(-14, 10), 2, 2, 0xe8f8ff)
          .setDepth(81);
        scn.tweens.add({ targets: c, y: c.y - 8, alpha: 0, duration: 400, onComplete: () => c.destroy() });
      },
    });
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (this._sparkle) this._sparkle.remove(false);
    });
  }

  flashOnce() {
    this.setTint(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.active && !this.dead) this.setTint(this.frostTint);
    });
  }

  takeDamage(val = 1) {
    if (this.dead) return;
    super.takeDamage(val);
    // Ice chips fly off
    for (let i = 0; i < 3; i++) {
      const c = this.scene.add.rectangle(this.x, this.y - 6, 2, 2, 0xd8f4ff).setDepth(80);
      this.scene.tweens.add({
        targets: c,
        x: this.x + Phaser.Math.Between(-14, 14),
        y: this.y + Phaser.Math.Between(-16, 4),
        alpha: 0,
        duration: 300,
        onComplete: () => c.destroy(),
      });
    }
  }

  die() {
    if (this.dead) return;
    this.clearTint();
    super.die();
  }
}

class Snowberry extends Phaser.Physics.Arcade.Sprite {
  static ensureTextures(scn) {
    if (scn.textures.exists("snowberry")) return;
    const draw = (key, windup) => {
      const g = scn.make.graphics({ x: 0, y: 0, add: false });
      // 22x20: snow mound with a blueberry face peeking out
      g.fillStyle(0xf4fbff, 1);
      g.fillEllipse(11, 14, 22, 12);
      g.fillStyle(0xd8eefc, 1);
      g.fillEllipse(11, 17, 20, 6);
      g.fillStyle(0x3858c8, 1);
      g.fillCircle(11, windup ? 7 : 9, 7);
      g.fillStyle(0x5a7ae8, 1);
      g.fillCircle(9, windup ? 5 : 7, 2);
      g.fillStyle(0xffffff, 1);
      g.fillRect(7, windup ? 6 : 8, 3, 3);
      g.fillRect(12, windup ? 6 : 8, 3, 3);
      g.fillStyle(0x101830, 1);
      g.fillRect(8, windup ? 7 : 9, 2, 2);
      g.fillRect(13, windup ? 7 : 9, 2, 2);
      // snow cap
      g.fillStyle(0xffffff, 1);
      g.fillRect(5, windup ? 1 : 3, 12, 3);
      g.fillRect(7, windup ? 0 : 2, 8, 2);
      g.generateTexture(key, 22, 20);
      g.destroy();
    };
    draw("snowberry", false);
    draw("snowberry-windup", true);
    const g = scn.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xffffff, 1);
    g.fillCircle(5, 5, 5);
    g.fillStyle(0xd8eefc, 1);
    g.fillCircle(6, 6, 3);
    g.generateTexture("snowball", 10, 10);
    g.destroy();
  }

  constructor(scn, x, y) {
    Snowberry.ensureTextures(scn);
    super(scn, x, y, "snowberry");
    scn.add.existing(this);
    scn.physics.add.existing(this);
    this.score = 550;
    this.hp = 2;
    this.dead = false;
    this.range = 220;
    this.nextThrow = 0;
    this.body.setAllowGravity(true);
    this.body.setImmovable(true);
    this.body.setSize(18, 16, true);
    this.setDepth(56);
    scn.enemies.add(this);
    this.jammyOverlap = scn.physics.add.overlap(this, scn.jammy.sprite, () => {
      if (!this.dead && this.scene.jammy.alive) this.scene.jammy.takeDamage(this.x);
    });
  }

  update() {
    if (this.dead || !this.body) return;
    const j = this.scene.jammy;
    if (!j || !j.alive) return;
    const now = this.scene.time.now;
    const dx = j.sprite.x - this.x;
    if (Math.abs(dx) < this.range && now >= this.nextThrow) {
      this.nextThrow = now + 2300 / enemySpeedScale();
      this.setTexture("snowberry-windup");
      this.scene.time.delayedCall(260, () => {
        if (this.dead || !this.active) return;
        this.setTexture("snowberry");
        this._throw(dx);
      });
    }
  }

  _throw(dx) {
    const s = this.scene;
    const dir = dx < 0 ? -1 : 1;
    const dist = Math.min(Math.abs(dx), this.range);
    const b = s.physics.add.sprite(this.x, this.y - 10, "snowball");
    b.setDepth(69);
    s.enemyProjectiles.add(b);
    b.body.setAllowGravity(true);
    b.body.setSize(8, 8);
    // Lob: pick a launch so it lands roughly on Jammy
    const vy = -260;
    const t = (2 * -vy) / 900;
    b.body.setVelocity((dir * dist) / t, vy);
    b.invincible = true;
    b.die = () => {
      if (!b.active) return;
      for (let i = 0; i < 4; i++) {
        const d = s.add.rectangle(b.x, b.y, 2, 2, 0xffffff).setDepth(68);
        s.tweens.add({
          targets: d,
          x: b.x + Phaser.Math.Between(-8, 8),
          y: b.y - Phaser.Math.Between(2, 8),
          alpha: 0,
          duration: 220,
          onComplete: () => d.destroy(),
        });
      }
      b.destroy();
    };
    if (s.groundLayer) s.physics.add.collider(b, s.groundLayer, () => b.die());
    s.time.delayedCall(3000, () => {
      if (b.active) b.die();
    });
    s.sound.play("blueberryBombDropSound", { volume: 0.5, rate: 1.3 });
  }

  takeDamage(val = 1) {
    if (this.dead) return;
    this.hp -= val;
    this.setTint(0xff6666);
    this.scene.time.delayedCall(60, () => {
      if (this.active) this.clearTint();
    });
    this.scene.sound.play("enemyHitSound");
    if (this.hp <= 0) this.die();
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    awardScore(this.scene, this.score, this.x, this.y);
    new EnemyDeath(this.scene, this.x, this.y);
    this.body.setEnable(false);
    this.destroy();
  }
}

class Icicle extends Phaser.Physics.Arcade.Sprite {
  static ensureTexture(scn) {
    if (scn.textures.exists("icicle")) return;
    const g = scn.make.graphics({ x: 0, y: 0, add: false });
    // 10x22 icicle hanging point-down
    g.fillStyle(0xbfe8ff, 1);
    g.fillTriangle(0, 0, 10, 0, 5, 22);
    g.fillStyle(0xffffff, 0.9);
    g.fillTriangle(2, 0, 5, 0, 4, 12);
    g.fillStyle(0x7ab8e8, 1);
    g.fillTriangle(7, 0, 10, 0, 6, 14);
    g.generateTexture("icicle", 10, 22);
    g.destroy();
  }

  // Hangs until Jammy walks under it, then shivers and drops. Any shot
  // shatters it (hanging or falling) for a small score, once. It is
  // scenery rather than prey: Blubert and the Seedcaster never lock on.
  constructor(scn, x, y) {
    Icicle.ensureTexture(scn);
    super(scn, x, y, "icicle");
    scn.add.existing(this);
    scn.physics.add.existing(this);
    this.score = 100;
    this.hp = 1;
    this.dead = false;
    this.dropped = false;
    this.falling = false;
    this.invincible = false;
    this.targetable = false;
    this.body.setAllowGravity(false);
    this.body.setSize(8, 20, true);
    this.setDepth(57);
    scn.enemies.add(this);
    this.body.setAllowGravity(false);
  }

  update() {
    if (this.dead || this.dropped || !this.body) return;
    const j = this.scene.jammy;
    if (!j || !j.alive) return;
    const dx = Math.abs(j.sprite.x - this.x);
    const dyBelow = j.sprite.y - this.y;
    if (dx < 16 && dyBelow > 10 && dyBelow < 170) this.drop();
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    // Whatever it lands on (floor, ledge, a floe), it breaks.
    if (this.falling && !this.dead && this.body && this.body.blocked.down) this.shatter();
  }

  drop() {
    if (this.dropped || this.dead) return;
    this.dropped = true;
    this.scene.tweens.add({
      targets: this,
      x: { from: this.x - 1, to: this.x + 1 },
      duration: 40,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        if (this.dead || !this.body) return;
        this.falling = true;
        this.body.setAllowGravity(true);
        this.body.setVelocityY(120);
        this.jammyOverlap = this.scene.physics.add.overlap(this, this.scene.jammy.sprite, () => {
          if (!this.dead && this.scene.jammy.alive) {
            this.scene.jammy.takeDamage(this.x);
            this.shatter();
          }
        });
        if (this.scene.groundLayer) {
          this.scene.physics.add.collider(this, this.scene.groundLayer, () => this.shatter());
        }
        // Safety net: nothing stays stuck in the floor
        this._fallTimer = this.scene.time.delayedCall(2600, () => this.shatter());
      },
    });
  }

  shatter(shot = false) {
    if (this.dead) return;
    this.dead = true;
    const s = this.scene;
    if (this._fallTimer) this._fallTimer.remove(false);
    const n = shot ? 7 : 5;
    for (let i = 0; i < n; i++) {
      const c = s.add.rectangle(this.x, this.y + (shot ? 0 : 6), 2, 3, i % 3 === 0 ? 0xffffff : 0xbfe8ff).setDepth(80);
      s.tweens.add({
        targets: c,
        x: this.x + Phaser.Math.Between(-12, 12),
        // Shot shards tumble down; a landing just sprays sideways
        y: this.y + (shot ? Phaser.Math.Between(14, 34) : Phaser.Math.Between(-10, 6)),
        angle: Phaser.Math.Between(-90, 90),
        alpha: 0,
        duration: shot ? 380 : 260,
        ease: shot ? "Quad.easeIn" : "Linear",
        onComplete: () => c.destroy(),
      });
    }
    s.sound.play("enemyHitSound", { rate: shot ? 1.9 : 1.6, volume: 0.5 });
    if (this.jammyOverlap) this.jammyOverlap.destroy();
    this.body.setEnable(false);
    this.destroy();
  }

  takeDamage() {
    if (this.dead) return;
    awardScore(this.scene, this.score, this.x, this.y);
    this.shatter(true);
  }
}

// ---------------------------------------------------------------------
// Deeper in the mountains (Stages 2-2 and 2-3)
//
//   Hailberry    — a blueberry riding a storm cloud, drifting along a
//                  patrol line and dumping a fan of hail when Jammy is
//                  beneath it. Shoot it or stay out from under.
//   Grapeshot    — a grape cluster that rolls at Jammy. Pop it and it
//                  bursts into three bouncing grapes that each need a
//                  shot of their own (or a wide berth).
//   Marmalurker  — a blob of hot marmalade lurking in a jam pool; leaps
//                  straight up when Jammy comes near. Shootable in the
//                  air, never in the pool.
// ---------------------------------------------------------------------

class Hailberry extends Phaser.Physics.Arcade.Sprite {
  static ensureTextures(scn) {
    if (scn.textures.exists("hailberry")) return;
    const g = scn.make.graphics({ x: 0, y: 0, add: false });
    // 26x20: dark storm cloud, blueberry peeking out the top
    g.fillStyle(0x3858c8, 1);
    g.fillCircle(13, 7, 6);
    g.fillStyle(0x5a7ae8, 1);
    g.fillCircle(11, 5, 2);
    g.fillStyle(0xffffff, 1);
    g.fillRect(10, 5, 2, 2);
    g.fillRect(14, 5, 2, 2);
    g.fillStyle(0x101830, 1);
    g.fillRect(11, 6, 1, 1);
    g.fillRect(15, 6, 1, 1);
    g.fillRect(10, 3, 3, 1);
    g.fillRect(14, 3, 3, 1);
    g.fillStyle(0x5a6c96, 1);
    g.fillEllipse(13, 14, 26, 11);
    g.fillCircle(6, 12, 5);
    g.fillCircle(19, 11, 6);
    g.fillStyle(0x7a8cb6, 1);
    g.fillEllipse(12, 12, 14, 5);
    g.fillStyle(0xd8f4ff, 1);
    g.fillRect(8, 18, 2, 2);
    g.fillRect(16, 18, 2, 2);
    g.generateTexture("hailberry", 26, 20);
    g.destroy();
    const h = scn.make.graphics({ x: 0, y: 0, add: false });
    h.fillStyle(0xffffff, 1);
    h.fillCircle(3, 3, 3);
    h.fillStyle(0xd8f4ff, 1);
    h.fillRect(3, 3, 2, 2);
    h.generateTexture("hailstone", 6, 6);
    h.destroy();
  }

  constructor(scn, x, y, x0, x1) {
    Hailberry.ensureTextures(scn);
    super(scn, x, y, "hailberry");
    scn.add.existing(this);
    scn.physics.add.existing(this);
    this.score = 650;
    this.hp = 2;
    this.dead = false;
    this.x0 = Math.min(x0, x1);
    this.x1 = Math.max(x0, x1);
    this.dir = 1;
    this.speed = 42 * enemySpeedScale();
    this.nextDump = 0;
    this.baseY = y;
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.setSize(22, 16, true);
    this.setDepth(56);
    scn.enemies.add(this);
    this.jammyOverlap = scn.physics.add.overlap(this, scn.jammy.sprite, () => {
      if (!this.dead && this.scene.jammy.alive) this.scene.jammy.takeDamage(this.x);
    });
  }

  update() {
    if (this.dead || !this.body) return;
    const s = this.scene;
    const now = s.time.now;
    if (this.x >= this.x1) this.dir = -1;
    else if (this.x <= this.x0) this.dir = 1;
    this.body.setVelocityX(this.dir * this.speed);
    this.y = this.baseY + Math.sin(now / 420) * 3;
    const j = s.jammy;
    if (!j || !j.alive) return;
    const dx = j.sprite.x - this.x;
    const dy = j.sprite.y - this.y;
    if (Math.abs(dx) < 54 && dy > 10 && dy < 200 && now >= this.nextDump) {
      this.nextDump = now + 1900 / enemySpeedScale();
      this._dump();
    }
  }

  _dump() {
    const s = this.scene;
    this.setTint(0xd8f4ff);
    s.time.delayedCall(220, () => {
      if (!this.active || this.dead) return;
      this.clearTint();
      [[-70, 110], [0, 140], [70, 110]].forEach(([vx, vy]) => {
        const h = s.physics.add.sprite(this.x, this.y + 10, "hailstone");
        h.setDepth(69);
        s.enemyProjectiles.add(h);
        h.body.setAllowGravity(true);
        h.body.setSize(5, 5);
        h.body.setVelocity(vx, vy);
        h.invincible = true;
        h.die = () => {
          if (!h.active) return;
          for (let i = 0; i < 3; i++) {
            const d = s.add.rectangle(h.x, h.y, 2, 2, 0xffffff).setDepth(68);
            s.tweens.add({ targets: d, x: h.x + Phaser.Math.Between(-6, 6), y: h.y - Phaser.Math.Between(2, 8), alpha: 0, duration: 200, onComplete: () => d.destroy() });
          }
          h.destroy();
        };
        if (s.groundLayer) s.physics.add.collider(h, s.groundLayer, () => h.die());
        s.time.delayedCall(2600, () => { if (h.active) h.die(); });
      });
      s.sound.play("blueberryBombDropSound", { volume: 0.4, rate: 1.6 });
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
    awardScore(this.scene, this.score, this.x, this.y);
    new EnemyDeath(this.scene, this.x, this.y);
    // The cloud rains out
    for (let i = 0; i < 6; i++) {
      const d = this.scene.add.rectangle(this.x + Phaser.Math.Between(-12, 12), this.y + 6, 1, 4, 0x9ad8ff).setDepth(68);
      this.scene.tweens.add({ targets: d, y: d.y + 40, alpha: 0, duration: 420, onComplete: () => d.destroy() });
    }
    this.body.setEnable(false);
    this.destroy();
  }
}

class Grapeshot extends Phaser.Physics.Arcade.Sprite {
  static ensureTextures(scn) {
    if (scn.textures.exists("grapeshot")) return;
    const g = scn.make.graphics({ x: 0, y: 0, add: false });
    // 18x18 cluster of purple grapes with a leaf
    const grapes = [[9, 4], [5, 7], [13, 7], [9, 9], [6, 12], [12, 12], [9, 15]];
    grapes.forEach(([x, y]) => {
      g.fillStyle(0x6a2c9a, 1);
      g.fillCircle(x, y, 3.2);
    });
    grapes.forEach(([x, y]) => {
      g.fillStyle(0x9a58d8, 1);
      g.fillCircle(x - 1, y - 1, 1.2);
    });
    g.fillStyle(0xffffff, 1);
    g.fillRect(7, 8, 2, 2);
    g.fillRect(11, 8, 2, 2);
    g.fillStyle(0x101830, 1);
    g.fillRect(8, 9, 1, 1);
    g.fillRect(12, 9, 1, 1);
    g.fillStyle(0x4aa040, 1);
    g.fillTriangle(9, 1, 14, 0, 12, 4);
    g.generateTexture("grapeshot", 18, 18);
    g.destroy();
    const m = scn.make.graphics({ x: 0, y: 0, add: false });
    m.fillStyle(0x6a2c9a, 1);
    m.fillCircle(4, 4, 4);
    m.fillStyle(0x9a58d8, 1);
    m.fillCircle(3, 3, 1.5);
    m.fillStyle(0xffffff, 1);
    m.fillRect(2, 4, 1, 1);
    m.fillRect(5, 4, 1, 1);
    m.generateTexture("grape-mini", 8, 8);
    m.destroy();
  }

  constructor(scn, x, y) {
    Grapeshot.ensureTextures(scn);
    super(scn, x, y, "grapeshot");
    scn.add.existing(this);
    scn.physics.add.existing(this);
    this.score = 400;
    this.hp = 1;
    this.dead = false;
    this.awake = false;
    this.speed = 58 * enemySpeedScale();
    this.body.setAllowGravity(true);
    this.body.setBounce(0.1);
    this.body.setSize(14, 14, true);
    this.setDepth(56);
    scn.enemies.add(this);
    this.jammyOverlap = scn.physics.add.overlap(this, scn.jammy.sprite, () => {
      if (!this.dead && this.scene.jammy.alive) this.scene.jammy.takeDamage(this.x);
    });
  }

  update() {
    if (this.dead || !this.body) return;
    const j = this.scene.jammy;
    if (!j || !j.alive) return;
    const dx = j.sprite.x - this.x;
    if (this.y > this.scene.map.heightInPixels + 40) return this.destroy(); // rolled into a pit
    if (!this.awake && Math.abs(dx) < 190 && Math.abs(j.sprite.y - this.y) < 80) this.awake = true;
    if (!this.awake) return;
    const dir = dx < 0 ? -1 : 1;
    // Rolls, and hops a little when it bumps into something
    this.body.setVelocityX(dir * this.speed);
    if ((this.body.blocked.left || this.body.blocked.right) && this.body.blocked.down) this.body.setVelocityY(-180);
    this.rotation += (dir * this.speed * this.scene.game.loop.delta) / 1000 / 8;
  }

  takeDamage() {
    if (this.dead) return;
    this.dead = true;
    const s = this.scene;
    awardScore(s, this.score, this.x, this.y);
    s.sound.play("enemyHitSound", { rate: 1.3 });
    // Burst into three bouncing grapes
    [[-110, -230], [0, -280], [110, -230]].forEach(([vx, vy]) => new GrapeMini(s, this.x, this.y - 4, vx, vy));
    for (let i = 0; i < 5; i++) {
      const d = s.add.rectangle(this.x, this.y, 2, 2, 0x9a58d8).setDepth(68);
      s.tweens.add({ targets: d, x: this.x + Phaser.Math.Between(-14, 14), y: this.y + Phaser.Math.Between(-16, 6), alpha: 0, duration: 260, onComplete: () => d.destroy() });
    }
    this.body.setEnable(false);
    this.destroy();
  }

  die() {
    this.takeDamage();
  }
}

class GrapeMini extends Phaser.Physics.Arcade.Sprite {
  constructor(scn, x, y, vx, vy) {
    Grapeshot.ensureTextures(scn);
    super(scn, x, y, "grape-mini");
    scn.add.existing(this);
    scn.physics.add.existing(this);
    this.score = 100;
    this.hp = 1;
    this.dead = false;
    this.body.setAllowGravity(true);
    this.body.setBounce(0.65, 0.65);
    this.body.setCircle(4);
    this.body.setVelocity(vx * enemySpeedScale(), vy);
    this.setDepth(57);
    scn.enemies.add(this);
    this.jammyOverlap = scn.physics.add.overlap(this, scn.jammy.sprite, () => {
      if (!this.dead && this.scene.jammy.alive) this.scene.jammy.takeDamage(this.x);
    });
    this._life = scn.time.delayedCall(3200, () => this.die(true));
  }

  update() {
    if (this.dead || !this.body) return;
    if (this.y > this.scene.map.heightInPixels + 40) return this.die(true);
    this.rotation += 0.15;
    // Keep bouncing toward Jammy a little
    const j = this.scene.jammy;
    if (j && j.alive && this.body.blocked.down) {
      const dir = j.sprite.x < this.x ? -1 : 1;
      this.body.setVelocity(dir * 80 * enemySpeedScale(), -200);
    }
  }

  takeDamage() {
    this.die(false);
  }

  die(quiet = false) {
    if (this.dead || !this.scene || !this.active) return;
    this.dead = true;
    if (this._life) this._life.remove(false);
    if (!quiet) {
      awardScore(this.scene, this.score, this.x, this.y);
      this.scene.sound.play("enemyHitSound", { rate: 1.6, volume: 0.6 });
    }
    for (let i = 0; i < 3; i++) {
      const d = this.scene.add.rectangle(this.x, this.y, 2, 2, 0x9a58d8).setDepth(68);
      this.scene.tweens.add({ targets: d, x: this.x + Phaser.Math.Between(-8, 8), y: this.y + Phaser.Math.Between(-8, 4), alpha: 0, duration: 220, onComplete: () => d.destroy() });
    }
    this.body.setEnable(false);
    this.destroy();
  }
}

class Marmalurker extends Phaser.Physics.Arcade.Sprite {
  static ensureTextures(scn) {
    if (scn.textures.exists("marmalurker")) return;
    const g = scn.make.graphics({ x: 0, y: 0, add: false });
    // 20x18 marmalade blob with a grin and an orange-peel curl
    g.fillStyle(0xe87a2a, 1);
    g.fillEllipse(10, 10, 20, 16);
    g.fillStyle(0xffb050, 1);
    g.fillEllipse(8, 7, 10, 6);
    g.fillStyle(0xffffff, 1);
    g.fillRect(5, 7, 3, 3);
    g.fillRect(12, 7, 3, 3);
    g.fillStyle(0x3a1408, 1);
    g.fillRect(6, 8, 2, 2);
    g.fillRect(13, 8, 2, 2);
    g.fillRect(5, 12, 10, 2);
    g.fillStyle(0xffffff, 1);
    g.fillRect(6, 12, 2, 1);
    g.fillRect(10, 12, 2, 1);
    g.fillStyle(0xc85a1a, 1);
    g.fillRect(15, 2, 3, 2);
    g.fillRect(17, 0, 2, 3);
    g.generateTexture("marmalurker", 20, 18);
    g.destroy();
  }

  constructor(scn, x, surfaceY) {
    Marmalurker.ensureTextures(scn);
    super(scn, x, surfaceY + 6, "marmalurker");
    scn.add.existing(this);
    scn.physics.add.existing(this);
    this.score = 500;
    this.hp = 2;
    this.dead = false;
    this.homeX = x;
    this.surfaceY = surfaceY;
    this.state = "lurk";
    this.nextLeap = 0;
    this.body.setAllowGravity(false);
    this.body.setSize(16, 14, true);
    this.body.setEnable(false);
    this.setDepth(2); // under the pool surface while lurking
    this.setAlpha(0.6);
    scn.enemies.add(this);
    this.jammyOverlap = scn.physics.add.overlap(this, scn.jammy.sprite, () => {
      if (!this.dead && this.state === "leap" && this.scene.jammy.alive) this.scene.jammy.takeDamage(this.x);
    });
  }

  update() {
    if (this.dead || !this.body) return;
    const s = this.scene;
    const now = s.time.now;
    const j = s.jammy;
    if (this.state === "lurk") {
      this.y = this.surfaceY + 6 + Math.sin(now / 300) * 1.5;
      if (j && j.alive && now >= this.nextLeap && Math.abs(j.sprite.x - this.homeX) < 64 && j.sprite.y < this.surfaceY + 20) {
        this._leap();
      }
    } else if (this.state === "leap") {
      if (this.body.velocity.y > 0 && this.y >= this.surfaceY + 2) this._splash();
    }
  }

  _leap() {
    const s = this.scene;
    this.state = "leap";
    this.setDepth(58);
    this.setAlpha(1);
    this.body.setEnable(true);
    this.body.setAllowGravity(true);
    this.body.setVelocity(0, -340);
    for (let i = 0; i < 4; i++) {
      const d = s.add.circle(this.homeX + Phaser.Math.Between(-8, 8), this.surfaceY, 2, 0xe85a88, 0.9).setDepth(57);
      s.tweens.add({ targets: d, y: d.y - 14, alpha: 0, duration: 300, onComplete: () => d.destroy() });
    }
    s.sound.play("blueberryBombDropSound", { volume: 0.4, rate: 0.9 });
  }

  _splash() {
    const s = this.scene;
    this.state = "lurk";
    this.nextLeap = s.time.now + 1500 / enemySpeedScale();
    this.body.setAllowGravity(false);
    this.body.setVelocity(0, 0);
    this.body.setEnable(false);
    this.setPosition(this.homeX, this.surfaceY + 6);
    this.setDepth(2);
    this.setAlpha(0.6);
  }

  // Only in the air; in the pool it's just more jam
  takeDamage(val = 1) {
    if (this.dead || this.state !== "leap") return;
    this.hp -= val;
    this.setTint(0xff6666);
    this.scene.time.delayedCall(60, () => { if (this.active) this.clearTint(); });
    this.scene.sound.play("enemyHitSound");
    if (this.hp <= 0) this.die();
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    awardScore(this.scene, this.score, this.x, this.y);
    new EnemyDeath(this.scene, this.x, this.y);
    this.body.setEnable(false);
    this.destroy();
  }
}
