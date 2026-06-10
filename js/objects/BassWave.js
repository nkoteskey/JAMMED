// Royal Bass projectile — a low rumbling quake wave that rolls along
// the ground, piercing through every enemy it touches. Slower and on a
// longer cooldown than sonic, but it hits a whole row of foes and even
// rattles zomberries out of their bushes.
class BassWave extends Phaser.Physics.Arcade.Sprite {
  static ensureTexture(scn) {
    if (scn.textures.exists("bass-wave")) return;
    const g = scn.make.graphics({ x: 0, y: 0, add: false });
    // 14x24 double crescent, opening in the travel direction (right)
    g.lineStyle(3, 0x8a5cf0, 1);
    g.beginPath();
    g.arc(2, 12, 10, -Math.PI / 2.6, Math.PI / 2.6);
    g.strokePath();
    g.lineStyle(2, 0xc0a0ff, 1);
    g.beginPath();
    g.arc(2, 12, 6, -Math.PI / 2.8, Math.PI / 2.8);
    g.strokePath();
    g.fillStyle(0xe8dcff, 1);
    g.fillRect(1, 11, 3, 3);
    g.generateTexture("bass-wave", 14, 24);
    g.destroy();
  }

  constructor(scn, x, y, direction) {
    BassWave.ensureTexture(scn);
    super(scn, x, y, "bass-wave");
    scn.add.existing(this);
    scn.physics.add.existing(this);

    this.dir = direction === "left" ? -1 : 1;
    this.damage = 2;
    this.rangePx = 420;
    this.startX = x;
    this.dead = false;
    this._hit = new Set();
    this._lastDust = 0;

    this.setFlipX(this.dir === -1);
    this.setDepth(90);
    this.body.setAllowGravity(false);
    this.body.setSize(12, 22);
    this.body.setVelocityX(this.dir * 180);

    // Pierce: track every enemy it passes through, damage each once
    this.enemyOverlap = scn.physics.add.overlap(this, scn.enemies, (wave, enemy) => {
      if (this.dead || !enemy || enemy.dead || this._hit.has(enemy)) return;
      this._hit.add(enemy);
      if (enemy.hidden && typeof enemy.explodeInBush === "function") {
        enemy.explodeInBush();
      } else if (typeof enemy.takeDamage === "function" && !enemy.invincible) {
        enemy.takeDamage(this.damage);
      }
    });
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.dead || !this.body) return;

    // Rumble bob + dust kicked up along the ground
    this.y += Math.sin(time / 30) * 0.5;
    if (time - this._lastDust > 70) {
      this._lastDust = time;
      const dust = this.scene.add.circle(
        this.x - this.dir * 6, this.y + 10,
        1 + Math.random() * 2, 0x8a5cf0, 0.6
      );
      dust.setDepth(89);
      this.scene.tweens.add({
        targets: dust, y: dust.y - 6, alpha: 0, scale: 1.6,
        duration: 240, onComplete: () => dust.destroy(),
      });
    }

    // Dissipate at max range or on hitting a wall
    const wall = this.scene.groundLayer &&
      this.scene.groundLayer.getTileAtWorldXY(this.x + this.dir * 8, this.y - 4);
    if (Math.abs(this.x - this.startX) > this.rangePx || wall) {
      this.dissipate();
    }
  }

  dissipate() {
    if (this.dead) return;
    this.dead = true;
    this.body.setVelocity(0, 0);
    if (this.enemyOverlap) this.enemyOverlap.destroy();
    this.scene.tweens.add({
      targets: this, alpha: 0, scaleX: 1.6, scaleY: 1.6,
      duration: 160, onComplete: () => this.destroy(),
    });
  }
}
