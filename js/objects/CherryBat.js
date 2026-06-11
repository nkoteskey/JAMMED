// Candied cherry with bat wings. Roosts on the factory ceiling, then
// swoops in a Castlevania arc through Jammy's height and flutters back
// up to a new roost. One hit kills it — the threat is the dive itself.
class CherryBat extends Phaser.Physics.Arcade.Sprite {
  static ensureTextures(scn) {
    if (scn.textures.exists("cherry-bat-fly1")) return;

    const drawBody = (g, cx, cy) => {
      g.fillStyle(0x8c1030, 1);
      g.fillEllipse(cx, cy, 11, 11);
      g.fillStyle(0xd02440, 1);
      g.fillEllipse(cx, cy, 9, 9);
      g.fillStyle(0xff7088, 1);
      g.fillEllipse(cx - 2, cy - 2, 3, 3); // shine
      // Stem
      g.fillStyle(0x4a2a1e, 1);
      g.fillRect(cx - 1, cy - 8, 2, 4);
      // Eyes
      g.fillStyle(0xffffff, 1);
      g.fillRect(cx - 4, cy - 2, 3, 3);
      g.fillRect(cx + 1, cy - 2, 3, 3);
      g.fillStyle(0x1c0810, 1);
      g.fillRect(cx - 3, cy - 1, 2, 2);
      g.fillRect(cx + 2, cy - 1, 2, 2);
      // Fangs
      g.fillStyle(0xffffff, 1);
      g.fillRect(cx - 2, cy + 3, 1, 2);
      g.fillRect(cx + 1, cy + 3, 1, 2);
    };

    // Wings up
    let g = scn.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x3a2848, 1);
    g.fillTriangle(1, 2, 9, 8, 8, 13);
    g.fillTriangle(23, 2, 15, 8, 16, 13);
    drawBody(g, 12, 9);
    g.generateTexture("cherry-bat-fly1", 24, 16);
    g.destroy();

    // Wings down
    g = scn.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x3a2848, 1);
    g.fillTriangle(0, 13, 9, 6, 8, 12);
    g.fillTriangle(24, 13, 15, 6, 16, 12);
    drawBody(g, 12, 8);
    g.generateTexture("cherry-bat-fly2", 24, 16);
    g.destroy();

    // Roosting — wings folded shut around the cherry
    g = scn.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x3a2848, 1);
    g.fillEllipse(7, 9, 12, 14);
    g.fillStyle(0x2a1c36, 1);
    g.fillRect(6, 2, 2, 12); // fold seam
    g.fillStyle(0x4a2a1e, 1);
    g.fillRect(6, 0, 2, 3); // stem hook
    g.fillStyle(0xd02440, 1);
    g.fillEllipse(7, 13, 6, 4); // peek of cherry
    g.generateTexture("cherry-bat-hang", 14, 16);
    g.destroy();
  }

  constructor(scn, x, hangY = 44) {
    CherryBat.ensureTextures(scn);
    super(scn, x, hangY, "cherry-bat-hang");
    scn.add.existing(this);
    scn.physics.add.existing(this);

    this.score = 300;
    this.targetable = true; // Blubert lock-on
    this.hp = 1;
    this.dead = false;
    this.hangY = hangY;
    this.state = "hang";
    this.cooldownUntil = 0;
    this.detectRangeX = 120;
    this._nextFlap = 0;
    this._flapFrame = false;

    this.body.setAllowGravity(false);
    this.body.setSize(12, 12);
    this.setDepth(58);

    this.jammyOverlap = scn.physics.add.overlap(this, scn.jammy.sprite, () => {
      if (this.state === "swoop" && !this.dead && this.scene.jammy.alive) {
        this.scene.jammy.takeDamage();
      }
    });

    scn.enemies.add(this);
  }

  update() {
    if (this.dead) return;
    const now = this.scene.time.now;

    // Wing flap while airborne
    if (this.state !== "hang" && now > this._nextFlap) {
      this._nextFlap = now + 110;
      this._flapFrame = !this._flapFrame;
      this.setTexture(this._flapFrame ? "cherry-bat-fly1" : "cherry-bat-fly2");
    }

    const j = this.scene.jammy;
    if (!j || !j.alive) return;

    if (this.state === "hang" && now > this.cooldownUntil) {
      const dx = Math.abs(j.sprite.x - this.x);
      const dyBelow = j.sprite.y - this.y;
      if (dx < this.detectRangeX && dyBelow > 40) this.swoop();
    }
  }

  swoop() {
    const j = this.scene.jammy;
    this.state = "swoop";

    const startX = this.x;
    const startY = this.y;
    // Sweep down through Jammy and exit on the far side, back up high.
    let side = startX >= j.sprite.x ? 1 : -1;
    const endX = j.sprite.x - side * 150;
    const endY = this.hangY + 16;
    const midX = j.sprite.x;
    const passY = j.sprite.y - 6;
    // Quadratic Bezier control point so the curve passes through Jammy
    // at t=0.5: ctrl = 2*P - (S+E)/2.
    const ctrlY = 2 * passY - (startY + endY) / 2;

    this.setFlipX(endX < startX);

    const t = { v: 0 };
    this._swoopTween = this.scene.tweens.add({
      targets: t,
      v: 1,
      duration: 880,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        if (this.dead || !this.active) return;
        const u = 1 - t.v;
        this.x = u * u * startX + 2 * u * t.v * midX + t.v * t.v * endX;
        this.y = u * u * startY + 2 * u * t.v * ctrlY + t.v * t.v * endY;
      },
      onComplete: () => this._reroost(),
    });
  }

  _reroost() {
    if (this.dead || !this.active) return;
    this.state = "return";
    this._swoopTween = null;
    this.scene.tweens.add({
      targets: this,
      y: this.hangY,
      duration: 420,
      ease: "Sine.easeOut",
      onComplete: () => {
        if (this.dead || !this.active) return;
        this.state = "hang";
        this.setFlipX(false);
        this.setTexture("cherry-bat-hang");
        this.cooldownUntil = this.scene.time.now + 900;
      },
    });
  }

  takeDamage(val = 1) {
    if (this.dead) return;
    this.hp -= val;
    if (this.hp <= 0) this.die();
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    if (this._swoopTween) { this._swoopTween.remove(); this._swoopTween = null; }
    this.scene.scene.get("UIScene").setScore(this.score);
    new EnemyDeath(this.scene, this.x, this.y);
    this.body.setEnable(false);
    this.destroy();
  }
}
