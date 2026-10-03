// THE ABOMINABLE BLUEBERRY — mid-boss of the icicle cave in 2-1. A
// shaggy white yeti with a blueberry face who blocks the cave behind an
// ice wall. Three moves on a loop, each telegraphed by a roar pose:
//   CHARGE  — barrels at Jammy across the ice (jump it, or slide under)
//   POUND   — slams the floor: shockwaves both ways, and the ceiling
//             drops fresh icicles over Jammy's head
//   THROW   — lobs two big snowballs
// 14 HP. Every weapon works; the Glacier Slide's power slide and echo
// notes both deal 2. Beating him shatters the ice wall.
class YetiBerry extends Phaser.Physics.Arcade.Sprite {
  static ensureTextures(scn) {
    if (scn.textures.exists("yeti-idle")) return;
    const draw = (key, pose) => {
      const g = scn.make.graphics({ x: 0, y: 0, add: false });
      // 40x44: shaggy white body, blue face, big arms
      const armY = pose === "roar" ? 6 : pose === "pound" ? 30 : 16;
      g.fillStyle(0xe8f4ff, 1);
      g.fillEllipse(20, 26, 30, 34); // body
      g.fillStyle(0xffffff, 1);
      g.fillEllipse(20, 20, 24, 20); // chest fluff
      // arms
      g.fillStyle(0xe8f4ff, 1);
      g.fillRect(0, armY, 10, 16);
      g.fillRect(30, armY, 10, 16);
      g.fillStyle(0x8ec4d8, 1); // claws
      g.fillRect(1, armY + 14, 8, 2);
      g.fillRect(31, armY + 14, 8, 2);
      // feet
      g.fillStyle(0xc8dcf0, 1);
      g.fillRect(6, 40, 11, 4);
      g.fillRect(23, 40, 11, 4);
      // blueberry face
      g.fillStyle(0x3858c8, 1);
      g.fillCircle(20, 14, 9);
      g.fillStyle(0x5a7ae8, 1);
      g.fillCircle(17, 11, 3);
      // eyes
      g.fillStyle(0xffffff, 1);
      g.fillRect(14, pose === "roar" ? 10 : 12, 4, 4);
      g.fillRect(22, pose === "roar" ? 10 : 12, 4, 4);
      g.fillStyle(0x101830, 1);
      g.fillRect(15, pose === "roar" ? 11 : 13, 2, 2);
      g.fillRect(23, pose === "roar" ? 11 : 13, 2, 2);
      // brows + mouth
      g.fillRect(13, 9, 5, 2);
      g.fillRect(22, 9, 5, 2);
      if (pose === "roar") {
        g.fillStyle(0x101830, 1);
        g.fillRect(16, 18, 8, 5);
        g.fillStyle(0xffffff, 1);
        g.fillRect(17, 18, 2, 2);
        g.fillRect(21, 18, 2, 2);
      } else {
        g.fillStyle(0x101830, 1);
        g.fillRect(17, 19, 6, 2);
      }
      // frost on the shoulders
      g.fillStyle(0x9ad8ff, 1);
      g.fillRect(8, 8, 3, 2);
      g.fillRect(29, 8, 3, 2);
      g.generateTexture(key, 40, 44);
      g.destroy();
    };
    draw("yeti-idle", "idle");
    draw("yeti-roar", "roar");
    draw("yeti-pound", "pound");
  }

  constructor(scn, x, y, opts = {}) {
    YetiBerry.ensureTextures(scn);
    super(scn, x, y, "yeti-idle");
    scn.add.existing(this);
    scn.physics.add.existing(this);

    this.score = 4000;
    this.maxHP = 14;
    this.hp = this.maxHP;
    this.dead = false;
    this.alive = true;
    this.invincible = false;
    this.state = "sleep"; // sleep -> idle/attack loop
    this.arenaL = opts.arenaL || 0;
    this.arenaR = opts.arenaR || 10000;
    this.ceilingY = opts.ceilingY || 58;
    this.wakeRange = opts.wakeRange || 230;
    this.nextActionAt = 0;
    this.speedScale = enemySpeedScale();
    this.onDefeated = opts.onDefeated || null;
    this._moveIdx = 0;

    this.setDepth(66);
    this.body.setAllowGravity(true);
    this.body.setSize(30, 40, true);
    this.body.setBounce(0);
    scn.enemies.add(this);

    this.jammyOverlap = scn.physics.add.overlap(this, scn.jammy.sprite, () => {
      if (this.dead || this.state === "sleep" || !this.scene.jammy.alive) return;
      this.scene.jammy.takeDamage(this.x);
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
      // shuffle toward Jammy slowly between moves
      this.body.setVelocityX(Phaser.Math.Clamp(dx, -40, 40) * this.speedScale);
      if (now >= this.nextActionAt) this._nextMove(dx);
    } else if (this.state === "charge") {
      if (this.body.blocked.left || this.body.blocked.right || now >= this._chargeUntil) this._endMove(600);
    }
  }

  _wake() {
    this.state = "wake";
    this.setTexture("yeti-roar");
    this.scene.cameras.main.shake(250, 0.006);
    this.scene.sound.play("watermelonBossLandingSound", { volume: 0.6, rate: 0.8 });
    const t = this.scene.add
      .bitmapText(213, 100, "tempFont", "THE ABOMINABLE BLUEBERRY", 12)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300)
      .setTintFill(0x9ad8ff);
    this.scene.tweens.add({ targets: t, alpha: 0, delay: 1400, duration: 400, onComplete: () => t.destroy() });
    this.scene.time.delayedCall(900, () => {
      if (this.dead) return;
      this.setTexture("yeti-idle");
      this.state = "idle";
      this.nextActionAt = this.scene.time.now + 500;
    });
  }

  _nextMove(dx) {
    // Cycle charge / pound / throw with a little randomness
    const moves = ["charge", "pound", "throw"];
    const pick = Math.random() < 0.3 ? moves[Phaser.Math.Between(0, 2)] : moves[this._moveIdx % 3];
    this._moveIdx += 1;
    this.state = "roar";
    this.body.setVelocityX(0);
    this.setTexture("yeti-roar");
    this.scene.sound.play("enemyHitSound", { rate: 0.4, volume: 0.6 });
    this.scene.time.delayedCall(420, () => {
      if (this.dead) return;
      if (pick === "charge") this._charge();
      else if (pick === "pound") this._pound();
      else this._throw();
    });
  }

  _charge() {
    const j = this.scene.jammy;
    const dir = j.sprite.x < this.x ? -1 : 1;
    this.setFlipX(dir < 0);
    this.setTexture("yeti-idle");
    this.state = "charge";
    this.body.setVelocityX(dir * 190 * this.speedScale);
    this._chargeUntil = this.scene.time.now + 1100;
    // Snow kicked up behind him
    this._chargeDust = this.scene.time.addEvent({
      delay: 60,
      repeat: 16,
      callback: () => {
        if (this.dead || this.state !== "charge") return;
        const d = this.scene.add.circle(this.x - dir * 14, this.y + 18, 2, 0xffffff, 0.8).setDepth(65);
        this.scene.tweens.add({ targets: d, y: d.y - 8, alpha: 0, duration: 260, onComplete: () => d.destroy() });
      },
    });
  }

  _pound() {
    const s = this.scene;
    this.state = "pound";
    this.setTexture("yeti-pound");
    this.body.setVelocityX(0);
    s.time.delayedCall(180, () => {
      if (this.dead) return;
      s.cameras.main.shake(200, 0.008);
      s.sound.play("watermelonBossLandingSound", { volume: 0.7 });
      [-1, 1].forEach((dir) => this._shockwave(dir));
      // Icicles over Jammy's head
      const jx = s.jammy.sprite.x;
      [-20, 12].forEach((off, i) => {
        s.time.delayedCall(150 + i * 120, () => {
          if (this.dead || typeof Icicle === "undefined") return;
          const ic = new Icicle(s, Phaser.Math.Clamp(jx + off, this.arenaL + 8, this.arenaR - 8), this.ceilingY);
          ic.drop();
        });
      });
      this._endMove(900);
    });
  }

  _shockwave(dir) {
    const s = this.scene;
    if (!s.textures.exists("jam-shockwave")) {
      const g = s.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0xd8f4ff, 1);
      g.fillTriangle(0, 12, 8, 0, 16, 12);
      g.fillStyle(0xffffff, 1);
      g.fillTriangle(4, 12, 8, 4, 12, 12);
      g.generateTexture("jam-shockwave", 16, 12);
      g.destroy();
    }
    const w = s.physics.add.sprite(this.x + dir * 22, this.y + 16, "jam-shockwave");
    w.setTint(0xd8f4ff);
    w.setDepth(65);
    s.enemyProjectiles.add(w);
    w.body.setAllowGravity(false);
    w.body.setSize(12, 10);
    w.body.setVelocityX(dir * 160 * this.speedScale);
    w.invincible = true;
    w.die = () => w.destroy();
    s.time.delayedCall(1100, () => {
      if (w.active) w.destroy();
    });
  }

  _throw() {
    const s = this.scene;
    this.state = "throw";
    this.setTexture("yeti-roar");
    if (typeof Snowberry !== "undefined") Snowberry.ensureTextures(s);
    const j = s.jammy;
    [0, 260].forEach((delay, i) => {
      s.time.delayedCall(delay, () => {
        if (this.dead) return;
        const dx = j.sprite.x - this.x;
        const dir = dx < 0 ? -1 : 1;
        const b = s.physics.add.sprite(this.x + dir * 12, this.y - 14, "snowball");
        b.setScale(1.5);
        b.setDepth(65);
        s.enemyProjectiles.add(b);
        b.body.setAllowGravity(true);
        b.body.setSize(8, 8);
        const vy = -300;
        const t = (2 * -vy) / 900;
        b.body.setVelocity((dir * Math.min(Math.abs(dx) + i * 30, 320)) / t, vy);
        b.invincible = true;
        b.die = () => b.destroy();
        if (s.groundLayer) s.physics.add.collider(b, s.groundLayer, () => b.die());
        s.time.delayedCall(3000, () => {
          if (b.active) b.die();
        });
        s.sound.play("blueberryBombDropSound", { volume: 0.5, rate: 0.8 });
      });
    });
    this._endMove(1000);
  }

  _endMove(delayMs) {
    if (this._chargeDust) {
      this._chargeDust.remove(false);
      this._chargeDust = null;
    }
    this.body.setVelocityX(0);
    this.setTexture("yeti-idle");
    this.state = "idle";
    this.nextActionAt = this.scene.time.now + delayMs / this.speedScale;
  }

  takeDamage(val = 1) {
    if (this.dead || this.invincible || this.state === "sleep") return;
    this.hp -= Math.max(1, val || 1);
    this.setTint(0xff6666);
    this.scene.time.delayedCall(60, () => {
      if (this.active) this.clearTint();
    });
    this.scene.sound.play("enemyHitSound");
    this.invincible = true;
    this.scene.time.delayedCall(120, () => {
      this.invincible = false;
    });
    if (this.hp <= 0) this.die();
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.alive = false;
    this.invincible = true;
    const s = this.scene;
    if (this._chargeDust) this._chargeDust.remove(false);
    awardScore(s, this.score, this.x, this.y);
    this.body.setVelocity(0, 0);
    this.body.setEnable(false);
    if (this.jammyOverlap) this.jammyOverlap.destroy();
    [[0, 0], [14, 10], [-14, 10], [0, -16]].forEach(([dx, dy], i) => {
      s.time.delayedCall(i * 120, () => new EnemyDeath(s, this.x + dx, this.y + dy));
    });
    s.sound.play("bossDeathSound", { volume: 0.7, rate: 1.3 });
    s.cameras.main.shake(350, 0.01);
    s.tweens.add({ targets: this, alpha: 0, y: this.y + 10, duration: 700, delay: 200, onComplete: () => this.destroy() });
    if (this.onDefeated) this.onDefeated();
  }
}
