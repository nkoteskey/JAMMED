// Watermelon Snapper — a carnivorous melon rooted in the pits and on
// the mounds of Sunset Mesa. A big striped head on a stem with two
// leafy vine arms; when Jammy comes near it lunges up and out toward
// him, mouth gaping, and snaps shut. Jump it with room to spare (or
// bait the lunge and go while it retracts). Three hits to the head
// kill it. All drawn at runtime.
class WatermelonSnapper extends Phaser.Physics.Arcade.Sprite {
  static ensureTextures(scn) {
    if (scn.textures.exists("snapper-jaw-bot")) return;
    const g = scn.make.graphics({ x: 0, y: 0, add: false });
    const RIND = 0x2f6a2a, RINDLT = 0x6cc04a, RINDDK = 0x1e4a1c, FLESH = 0xe04060, FLESHDK = 0xb02848,
      SEED = 0x1c1008, TOOTH = 0xfff4e0;
    // Row extents of a rounded 32x14 jaw, from the mouth line (row 0)
    // down to the rounded back (row 13)
    const rows = [[0, 31], [0, 31], [0, 31], [0, 31], [0, 31], [1, 30], [1, 30], [1, 30], [2, 29], [2, 29], [3, 28], [4, 27], [6, 25], [9, 22]];

    // --- Bottom jaw: mouth line at the top ---
    rows.forEach(([a, b], r) => {
      g.fillStyle(RIND, 1);
      g.fillRect(a, r, b - a + 1, 1);
    });
    // Stripes
    g.fillStyle(RINDLT, 1);
    [3, 9, 15, 21, 27].forEach((x) => g.fillRect(x, 3, 2, 9));
    g.fillStyle(RINDDK, 1);
    g.fillRect(6, 13, 20, 1);
    // Flesh along the mouth line with seeds
    g.fillStyle(FLESH, 1);
    g.fillRect(1, 0, 30, 3);
    g.fillStyle(FLESHDK, 1);
    g.fillRect(1, 2, 30, 1);
    g.fillStyle(SEED, 1);
    [5, 12, 19, 26].forEach((x) => g.fillRect(x, 1, 1, 1));
    // Teeth pointing up
    g.fillStyle(TOOTH, 1);
    [2, 8, 14, 20, 26].forEach((x) => {
      g.fillRect(x, 0, 4, 1);
      g.fillRect(x + 1, 1, 2, 1);
    });
    g.generateTexture("snapper-jaw-bot", 32, 14);
    g.clear();

    // --- Top jaw: mouth line at the bottom, eyes on the rind ---
    rows.forEach(([a, b], r) => {
      g.fillStyle(RIND, 1);
      g.fillRect(a, 13 - r, b - a + 1, 1);
    });
    g.fillStyle(RINDLT, 1);
    [3, 9, 15, 21, 27].forEach((x) => g.fillRect(x, 2, 2, 9));
    g.fillStyle(RINDDK, 1);
    g.fillRect(6, 0, 20, 1);
    g.fillStyle(FLESH, 1);
    g.fillRect(1, 11, 30, 3);
    g.fillStyle(FLESHDK, 1);
    g.fillRect(1, 11, 30, 1);
    g.fillStyle(SEED, 1);
    [8, 16, 23].forEach((x) => g.fillRect(x, 12, 1, 1));
    g.fillStyle(TOOTH, 1);
    [5, 11, 17, 23].forEach((x) => {
      g.fillRect(x, 13, 4, 1);
      g.fillRect(x + 1, 12, 2, 1);
    });
    // Eyes
    g.fillStyle(0xffffff, 1);
    g.fillRect(19, 3, 4, 4);
    g.fillRect(25, 3, 4, 4);
    g.fillStyle(0x1c1008, 1);
    g.fillRect(21, 4, 2, 2);
    g.fillRect(27, 4, 2, 2);
    g.generateTexture("snapper-jaw-top", 32, 14);
    g.destroy();
  }

  // x, y: where the stem is rooted (a pit floor or a mound top).
  constructor(scn, x, y) {
    WatermelonSnapper.ensureTextures(scn);
    super(scn, x, y - 28, "snapper-jaw-bot");
    scn.add.existing(this);
    scn.physics.add.existing(this);

    this.rootX = x;
    this.rootY = y;
    this.restHeight = 28;
    this.reachX = 38;
    this.reachY = 26;
    this.detectX = 92;
    this.score = 600;
    this.hp = 3;
    this.dead = false;
    this.state = "idle";
    this.cooldownUntil = 0;
    this.facing = -1;
    this.mouth = 0.15; // jaw angle in radians
    this.headX = x;
    this.headY = y - this.restHeight;
    this.setDepth(57);

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    // Cover both jaws: the sprite is the bottom jaw, the top one hangs
    // above it
    this.body.setSize(28, 24);
    this.body.setOffset(2, -12);

    this.topJaw = scn.add.image(x, y, "snapper-jaw-top").setDepth(58);
    this.vines = scn.add.graphics().setDepth(56);
    this._seed = (x * 7) % 100;

    this.jammyOverlap = scn.physics.add.overlap(this, scn.jammy.sprite, () => {
      if (!this.dead && this.scene.jammy.alive) this.scene.jammy.takeDamage(this.x);
    });

    scn.enemies.add(this);
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (this.topJaw) this.topJaw.destroy();
      if (this.vines) this.vines.destroy();
    });
  }

  update() {
    if (this.dead || !this.scene) return;
    const now = this.scene.time.now;
    const j = this.scene.jammy;
    const jx = j && j.sprite ? j.sprite.x : this.rootX;
    const jy = j && j.sprite ? j.sprite.y : this.rootY;
    if (j && j.alive) this.facing = jx >= this.rootX ? 1 : -1;

    if (this.state === "idle") {
      // Sway on the stem, mouth working slowly
      const t = now / 1000 + this._seed;
      this.headX = this.rootX + Math.sin(t * 1.7) * 4;
      this.headY = this.rootY - this.restHeight + Math.sin(t * 2.3) * 2;
      this.mouth = 0.18 + Math.sin(t * 3.1) * 0.1;
      if (j && j.alive && now >= this.cooldownUntil) {
        const dx = Math.abs(jx - this.rootX);
        const dy = this.rootY - jy; // positive when Jammy is above the root
        if (dx < this.detectX && dy > -40 && dy < 120) this._lunge(jx, jy);
      }
    }

    this._placeHead();
    this._drawVines(jx);
  }

  _lunge(jx, jy) {
    this.state = "lunge";
    this.scene.sound.play("laserSound", { volume: 0.25, rate: 0.5 });
    const tx = this.rootX + Phaser.Math.Clamp(jx - this.rootX, -this.reachX, this.reachX);
    const wantY = Phaser.Math.Clamp(jy, this.rootY - this.restHeight - this.reachY, this.rootY - 10);
    const target = { headX: tx, headY: wantY, mouth: 0.95 };
    this.scene.tweens.add({
      targets: this,
      ...target,
      duration: 170,
      ease: "Quad.easeOut",
      onComplete: () => {
        if (this.dead) return;
        this.state = "snap";
        this.scene.tweens.add({
          targets: this,
          mouth: 0.02,
          duration: 60,
          onComplete: () => {
            if (this.dead) return;
            this._bite();
            this.state = "retract";
            this.scene.tweens.add({
              targets: this,
              headX: this.rootX,
              headY: this.rootY - this.restHeight,
              mouth: 0.15,
              duration: 420,
              ease: "Sine.easeInOut",
              onComplete: () => {
                if (this.dead) return;
                this.state = "idle";
                this.cooldownUntil = this.scene.time.now + 650;
              },
            });
          },
        });
      },
    });
  }

  _bite() {
    this.scene.sound.play("enemyHitSound", { volume: 0.5, rate: 0.7 });
    const j = this.scene.jammy;
    if (!j || !j.alive) return;
    const d = Phaser.Math.Distance.Between(this.headX, this.headY - 6, j.sprite.x, j.sprite.y);
    if (d < 22) j.takeDamage(this.x);
    // Spit of juice
    for (let i = 0; i < 3; i++) {
      const p = this.scene.add.circle(this.headX + this.facing * 12, this.headY - 4, 1.5, 0xe04060, 0.9).setDepth(59);
      this.scene.tweens.add({
        targets: p,
        x: p.x + this.facing * Phaser.Math.Between(6, 18),
        y: p.y + Phaser.Math.Between(-10, 6),
        alpha: 0,
        duration: 260,
        onComplete: () => p.destroy(),
      });
    }
  }

  // Put the bottom jaw (this sprite) and the top jaw on the hinge at
  // the back of the mouth, opened by this.mouth radians toward Jammy.
  _placeHead() {
    this.setPosition(this.headX, this.headY);
    this.setFlipX(this.facing === -1);
    const hingeX = this.headX - this.facing * 16;
    const hingeY = this.headY - 7;
    this.topJaw.setFlipX(this.facing === -1);
    this.topJaw.setOrigin(this.facing === 1 ? 0 : 1, 1);
    this.topJaw.setPosition(hingeX, hingeY);
    this.topJaw.setRotation(-this.mouth * this.facing);
    this.topJaw.setAlpha(this.alpha);
    this.topJaw.setTint(this.tintTopLeft);
    if (!this.isTinted) this.topJaw.clearTint();
  }

  // Stem from the root to the head, plus two leafy vine arms that curl
  // toward Jammy when he is close.
  _drawVines(jx) {
    const g = this.vines;
    g.clear();
    g.setAlpha(this.alpha);
    const t = this.scene.time.now / 1000 + this._seed;
    const rx = this.rootX, ry = this.rootY;
    // Stem: a quadratic curve bowing away from the lean
    const cx = rx + (this.headX - rx) * 0.3 - (this.headX - rx) * 0.4;
    const cy = ry - (ry - this.headY) * 0.5;
    g.lineStyle(4, 0x2f6a2a, 1);
    g.beginPath();
    g.moveTo(rx, ry);
    for (let s = 0.1; s <= 1.001; s += 0.1) {
      const u = 1 - s;
      g.lineTo(u * u * rx + 2 * u * s * cx + s * s * this.headX, u * u * ry + 2 * u * s * cy + s * s * (this.headY + 6));
    }
    g.strokePath();
    g.lineStyle(2, 0x6cc04a, 1);
    g.lineBetween(rx, ry, rx + (this.headX - rx) * 0.2, ry - (ry - this.headY) * 0.25);
    // Root leaves
    g.fillStyle(0x2f6a2a, 1);
    g.fillTriangle(rx - 2, ry, rx - 14, ry - 5, rx - 6, ry - 8);
    g.fillTriangle(rx + 2, ry, rx + 14, ry - 5, rx + 6, ry - 8);
    // Vine arms
    const near = Phaser.Math.Clamp(1 - Math.abs(jx - rx) / 160, 0, 1);
    const lean = Math.sign(jx - rx) * near;
    [-1, 1].forEach((side) => {
      const sway = Math.sin(t * 2.2 + side) * 4;
      const bend = side === Math.sign(lean) || lean === 0 ? 1 + near * 0.8 : 1 - near * 0.5;
      const ax = rx + side * (26 * bend) + sway;
      const ay = ry - 26 - near * 14 + Math.cos(t * 1.9 + side) * 3;
      const mx = rx + side * 10, my = ry - 18;
      g.lineStyle(2, 0x3a8a34, 1);
      g.beginPath();
      g.moveTo(rx + side * 3, ry - 2);
      for (let s = 0.2; s <= 1.001; s += 0.2) {
        const u = 1 - s;
        g.lineTo(u * u * (rx + side * 3) + 2 * u * s * mx + s * s * ax, u * u * (ry - 2) + 2 * u * s * my + s * s * ay);
      }
      g.strokePath();
      // Leaves along the arm and a curl at the tip
      g.fillStyle(0x4aa040, 1);
      g.fillTriangle(mx, my, mx + side * 7, my - 6, mx + side * 1, my - 8);
      g.fillTriangle(ax, ay, ax + side * 8, ay - 3, ax + side * 3, ay - 9);
      g.fillStyle(0x6cc04a, 1);
      g.fillTriangle(ax, ay, ax - side * 6, ay - 5, ax - side * 1, ay - 8);
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
    this.scene.sound.play("enemyDeathSound");
    awardScore(this.scene, this.score, this.x, this.y);
    this.body.setEnable(false);
    this.scene.tweens.killTweensOf(this);
    // Burst of rind and flesh, then the stem wilts away
    for (let i = 0; i < 6; i++) {
      const c = this.scene.add.rectangle(this.x, this.y, 3, 3, i % 2 ? 0xe04060 : 0x2f6a2a).setDepth(59);
      this.scene.tweens.add({
        targets: c,
        x: this.x + Phaser.Math.Between(-24, 24),
        y: this.y + Phaser.Math.Between(-26, 10),
        alpha: 0,
        duration: 380,
        onComplete: () => c.destroy(),
      });
    }
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      headY: this.rootY - 6,
      duration: 450,
      onUpdate: () => { this._placeHead(); if (this.vines) { this.vines.setAlpha(this.alpha); } },
      onComplete: () => this.destroy(),
    });
  }
}
