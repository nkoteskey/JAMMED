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
    this.range = 280;
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

  constructor(scn, x, y) {
    Icicle.ensureTexture(scn);
    super(scn, x, y, "icicle");
    scn.add.existing(this);
    scn.physics.add.existing(this);
    this.score = 200;
    this.hp = 1;
    this.dead = false;
    this.dropped = false;
    this.invincible = false;
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
    // Tremble a moment before the drop
    if (dx < 16 && dyBelow > 10 && dyBelow < 170) this.drop();
  }

  drop() {
    if (this.dropped) return;
    this.dropped = true;
    this.scene.tweens.add({
      targets: this,
      x: { from: this.x - 1, to: this.x + 1 },
      duration: 40,
      yoyo: true,
      repeat: 4,
      onComplete: () => {
        if (this.dead || !this.body) return;
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
      },
    });
  }

  shatter() {
    if (this.dead) return;
    this.dead = true;
    const s = this.scene;
    for (let i = 0; i < 5; i++) {
      const c = s.add.rectangle(this.x, this.y + 6, 2, 3, 0xbfe8ff).setDepth(80);
      s.tweens.add({
        targets: c,
        x: this.x + Phaser.Math.Between(-12, 12),
        y: this.y + Phaser.Math.Between(-10, 6),
        alpha: 0,
        duration: 260,
        onComplete: () => c.destroy(),
      });
    }
    s.sound.play("enemyHitSound", { rate: 1.6, volume: 0.5 });
    this.body.setEnable(false);
    this.destroy();
  }

  takeDamage() {
    if (this.dead) return;
    // Shooting it makes it drop early — handy for clearing the path
    awardScore(this.scene, this.score, this.x, this.y);
    this.drop();
  }
}
