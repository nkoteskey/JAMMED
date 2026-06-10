// Molten jam bubble that leaps out of the factory's boiling vats on a
// loop — Stage 1-4's Podoboo. Invincible to shots (it's liquid); the
// player learns its rhythm and times the crossing instead.
class JamBubble extends Phaser.Physics.Arcade.Sprite {
  static ensureTexture(scn) {
    if (scn.textures.exists("jam-bubble")) return;
    const g = scn.make.graphics({ x: 0, y: 0, add: false });
    // 14x16 angry molten blob — bright core, dark rind, grumpy eyes
    g.fillStyle(0x8c1844, 1);
    g.fillEllipse(7, 9, 13, 13);
    g.fillStyle(0xe0407a, 1);
    g.fillEllipse(7, 9, 11, 11);
    // Flame-ish wisp on top
    g.fillTriangle(7, 0, 4, 6, 10, 6);
    g.fillStyle(0xff9ab8, 1);
    g.fillEllipse(5, 6, 4, 3);
    // Angry eyes
    g.fillStyle(0xffffff, 1);
    g.fillRect(3, 8, 3, 3);
    g.fillRect(8, 8, 3, 3);
    g.fillStyle(0x40081c, 1);
    g.fillRect(4, 9, 2, 2);
    g.fillRect(9, 9, 2, 2);
    g.generateTexture("jam-bubble", 14, 16);
    g.destroy();
  }

  constructor(scn, x, surfaceY, opts = {}) {
    JamBubble.ensureTexture(scn);
    super(scn, x, surfaceY + 20, "jam-bubble");
    scn.add.existing(this);
    scn.physics.add.existing(this);

    this.surfaceY = surfaceY;
    this.leapVelocity = opts.leap || -430;
    this.periodMs = opts.period || 2400;
    this.dead = false;
    this.invincible = true; // liquid jam — sonic waves splash through it
    this.inFlight = false;
    this._lastTrail = 0;

    this.body.setAllowGravity(false);
    this.body.setSize(10, 12, 2, 2);
    this.setVisible(false);
    this.setDepth(60);

    this.jammyOverlap = scn.physics.add.overlap(this, scn.jammy.sprite, () => {
      if (this.inFlight && this.scene.jammy.alive) {
        this.scene.jammy.takeDamage();
      }
    });

    this._timer = scn.time.delayedCall(opts.delay || 600, () => this.leap());
    scn.enemies.add(this);
  }

  leap() {
    if (!this.scene || this.dead) return;
    this.inFlight = true;
    this.setVisible(true);
    this.setFlipY(false);
    this.y = this.surfaceY + 4;
    this.body.setAllowGravity(true);
    this.body.setVelocityY(this.leapVelocity);
    this._splash();
  }

  update() {
    if (!this.inFlight || !this.body) return;
    const vy = this.body.velocity.y;
    this.setFlipY(vy > 60); // nose-dive on the way back down

    // Dripping trail
    if (this.scene.time.now - this._lastTrail > 80) {
      this._lastTrail = this.scene.time.now;
      const drip = this.scene.add.circle(
        this.x + (Math.random() * 6 - 3), this.y + 4,
        1 + Math.random(), 0xe0407a, 0.8
      );
      drip.setDepth(59);
      this.scene.tweens.add({
        targets: drip, alpha: 0, y: drip.y + 8,
        duration: 260, onComplete: () => drip.destroy(),
      });
    }

    // Re-entry — sink back under the surface and schedule the next leap
    if (vy > 0 && this.y > this.surfaceY + 2) {
      this.inFlight = false;
      this._splash();
      this.setVisible(false);
      this.body.setAllowGravity(false);
      this.body.setVelocity(0, 0);
      this.y = this.surfaceY + 20;
      this._timer = this.scene.time.delayedCall(this.periodMs, () => this.leap());
    }
  }

  _splash() {
    for (let i = 0; i < 4; i++) {
      const d = this.scene.add.circle(
        this.x + (Math.random() * 10 - 5), this.surfaceY + 2,
        1 + Math.random() * 1.5, 0xff7aa2, 0.9
      );
      d.setDepth(61);
      this.scene.tweens.add({
        targets: d,
        x: d.x + (Math.random() * 16 - 8),
        y: d.y - (6 + Math.random() * 10),
        alpha: 0,
        duration: 240 + Math.random() * 120,
        ease: "Quad.easeOut",
        onComplete: () => d.destroy(),
      });
    }
  }

  // Armored in the lore sense — shots and seed blasts just splash off.
  takeDamage() {
    this.setTintFill(0xffffff);
    this.scene.time.delayedCall(40, () => { if (this.active) this.clearTint(); });
  }
}
