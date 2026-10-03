// Glacier Slide projectile — an echo note that ricochets off floors and
// walls up to three times before fading. Built for the uneven, icy
// caves of World 2: fire it down a slope and it finds what's hiding on
// the ledges. Damages each enemy it touches once (2 damage).
class EchoNote extends Phaser.Physics.Arcade.Sprite {
  static ensureTexture(scn) {
    if (scn.textures.exists("echo-note")) return;
    const g = scn.make.graphics({ x: 0, y: 0, add: false });
    // 12x14 icy eighth-note
    g.fillStyle(0x9ad8ff, 1);
    g.fillEllipse(4, 10, 8, 6);
    g.fillRect(7, 1, 2, 10);
    g.fillRect(8, 1, 4, 2);
    g.fillRect(10, 2, 2, 3);
    g.fillStyle(0xffffff, 1);
    g.fillRect(2, 9, 2, 1);
    g.generateTexture("echo-note", 12, 14);
    g.destroy();
  }

  constructor(scn, x, y, direction, aimUp = false) {
    EchoNote.ensureTexture(scn);
    super(scn, x, y, "echo-note");
    scn.add.existing(this);
    scn.physics.add.existing(this);
    scn.bullets.add(this);

    const dir = direction === "left" ? -1 : 1;
    this.damage = 2;
    this.bounces = 0;
    this.maxBounces = 3;
    this._hit = new Set();
    this.dead = false;
    this.setDepth(99);
    this.body.setAllowGravity(true);
    this.body.setSize(10, 10, true);
    this.body.setBounce(1, 0.85);
    // Down-and-forward unless aiming up, in which case up-and-forward
    this.body.setVelocity(dir * 240, aimUp ? -300 : 120);

    const layers = [scn.groundLayer, scn.enemyStopBlocksLayer].filter(Boolean);
    layers.forEach((layer) => {
      scn.physics.add.collider(this, layer, () => this._bounce());
    });
    this._life = scn.time.delayedCall(2600, () => this.fade());
    scn.sound.play("laserSound", { volume: 0.7, rate: 1.35 });
  }

  _bounce() {
    if (this.dead) return;
    this.bounces += 1;
    // Small ring on each ricochet
    const ring = this.scene.add.circle(this.x, this.y, 4, 0x9ad8ff, 0).setStrokeStyle(1, 0xd8f4ff, 0.9).setDepth(98);
    this.scene.tweens.add({ targets: ring, scale: 3, alpha: 0, duration: 220, onComplete: () => ring.destroy() });
    this.scene.sound.play("laserSound", { volume: 0.35, rate: 1.35 + this.bounces * 0.25 });
    if (this.bounces >= this.maxBounces) this.fade();
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (!this.active || this.dead) return;
    this.rotation += 0.15;
    const cam = this.scene.cameras.main;
    if (this.x < cam.scrollX - 48 || this.x > cam.scrollX + cam.width + 48 || this.y > cam.scrollY + cam.height + 80) {
      this.fade();
    }
  }

  // Called by the stage's bullets-vs-enemies overlap. Pierces: each
  // enemy is hit once, the note keeps bouncing.
  hit(enemy) {
    if (this.dead || !enemy || enemy.dead || this._hit.has(enemy)) return;
    this._hit.add(enemy);
    if (!enemy.invincible && typeof enemy.takeDamage === "function") enemy.takeDamage(this.damage);
  }

  fade() {
    if (this.dead) return;
    this.dead = true;
    if (this._life) this._life.remove(false);
    this.body.setEnable(false);
    this.scene.tweens.add({ targets: this, alpha: 0, scale: 1.6, duration: 160, onComplete: () => this.destroy() });
  }
}
