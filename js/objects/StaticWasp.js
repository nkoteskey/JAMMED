// The Ad-Supported Tier: a wasp made of broadcast static. It deals no
// damage at all — it lands on you and MUTES YOUR GUITAR for a beat,
// then darts away to interrupt you again. One hit kills it, if you
// can land one between ads.
class StaticWasp extends Phaser.Physics.Arcade.Sprite {
  static ensureTextures(scn) {
    if (scn.textures.exists("static-wasp-1")) return;

    const draw = (g, alt) => {
      // Static body — alternating speckle pattern
      g.fillStyle(0x2a2a32, 1);
      g.fillRect(2, 3, 7, 5);
      g.fillStyle(0xd8d8e0, 1);
      const dots = alt ? [[3, 4], [6, 4], [4, 6], [7, 6]] : [[4, 4], [7, 4], [3, 6], [6, 6]];
      dots.forEach(([x, y]) => g.fillRect(x, y, 1, 1));
      // Teal stripe — company colors
      g.fillStyle(0x2ab8b0, 1);
      g.fillRect(5, 3, 1, 5);
      // Wings
      g.fillStyle(0xc8d2da, alt ? 0.9 : 0.4);
      g.fillRect(alt ? 1 : 3, 0, 3, 3);
      g.fillRect(alt ? 7 : 5, 0, 3, 3);
      // Stinger (it's a 3.5mm jack)
      g.fillStyle(0x9aa4ae, 1);
      g.fillRect(9, 5, 2, 1);
    };

    let g = scn.make.graphics({ x: 0, y: 0, add: false });
    draw(g, false);
    g.generateTexture("static-wasp-1", 11, 9);
    g.destroy();
    g = scn.make.graphics({ x: 0, y: 0, add: false });
    draw(g, true);
    g.generateTexture("static-wasp-2", 11, 9);
    g.destroy();
  }

  constructor(scn, x, y) {
    StaticWasp.ensureTextures(scn);
    super(scn, x, y, "static-wasp-1");
    scn.add.existing(this);
    scn.physics.add.existing(this);

    this.score = 200;
    this.hp = 1;
    this.dead = false;
    this.homeX = x;
    this.homeY = y;
    this.aggroRange = 170;
    this._nextJink = 0;
    this._nextFlap = 0;
    this._flap = false;
    this._retreatUntil = 0;

    this.body.setAllowGravity(false);
    this.body.setSize(9, 7);
    this.setDepth(58);

    this.jammyOverlap = scn.physics.add.overlap(this, scn.jammy.sprite, () => {
      if (this.dead || !this.scene.jammy.alive) return;
      const now = this.scene.time.now;
      if (now < this._retreatUntil) return;
      // No damage — pure interruption
      this.scene.jammy.setMuted(2500);
      this._retreatUntil = now + 1700;
      const away = this.x < this.scene.jammy.sprite.x ? -1 : 1;
      this.body.setVelocity(away * 190, -120);
    });

    scn.enemies.add(this);
  }

  update() {
    if (this.dead || !this.body) return;
    const now = this.scene.time.now;

    if (now > this._nextFlap) {
      this._nextFlap = now + 70;
      this._flap = !this._flap;
      this.setTexture(this._flap ? "static-wasp-2" : "static-wasp-1");
    }

    if (now < this._retreatUntil) return; // mid-dart-away

    const j = this.scene.jammy;
    if (now > this._nextJink) {
      this._nextJink = now + 140;
      let tx = this.homeX, ty = this.homeY;
      if (j && j.alive &&
          Phaser.Math.Distance.Between(this.x, this.y, j.sprite.x, j.sprite.y) < this.aggroRange) {
        tx = j.sprite.x;
        ty = j.sprite.y - 6;
      }
      const ang = Math.atan2(ty - this.y, tx - this.x);
      // Erratic static jitter on top of the homing vector
      this.body.setVelocity(
        Math.cos(ang) * 95 + (Math.random() * 120 - 60),
        Math.sin(ang) * 95 + (Math.random() * 120 - 60)
      );
      this.setFlipX(tx < this.x);
    }
  }

  takeDamage(val = 1) {
    if (this.dead) return;
    this.hp -= val;
    if (this.hp <= 0) this.die();
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
