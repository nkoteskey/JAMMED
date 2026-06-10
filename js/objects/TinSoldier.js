// Concentrate's signed exclusives: canned fruit in uniform ranks.
// Marches in formation, frontal armor — sonic waves clink off the
// front. Flank it, or pierce the can with a seed blast or bass quake
// (any hit worth 2+ damage ignores the armor).
class TinSoldier extends Phaser.Physics.Arcade.Sprite {
  static ensureTextures(scn) {
    if (scn.textures.exists("tin-soldier-1")) return;

    const draw = (g, step) => {
      // Legs
      g.fillStyle(0x2c3248, 1);
      if (step) {
        g.fillRect(3, 19, 4, 3);
        g.fillRect(10, 18, 4, 4);
      } else {
        g.fillRect(4, 18, 4, 4);
        g.fillRect(9, 19, 4, 3);
      }
      // Can body
      g.fillStyle(0x6a7488, 1);
      g.fillRect(2, 4, 13, 15);
      g.fillStyle(0x9aa4ae, 1);
      g.fillRect(3, 4, 11, 15);
      g.fillStyle(0xc8d2da, 1);
      g.fillRect(4, 4, 2, 15); // sheen
      // Ribbed seams
      g.fillStyle(0x7a8498, 1);
      g.fillRect(3, 7, 11, 1);
      g.fillRect(3, 16, 11, 1);
      // Teal label band with droplet
      g.fillStyle(0x2ab8b0, 1);
      g.fillRect(3, 10, 11, 5);
      g.fillStyle(0xeef8f6, 1);
      g.fillRect(7, 11, 3, 3);
      g.fillStyle(0x14383a, 1);
      g.fillTriangle(8, 11, 7, 13, 10, 13);
      // Helmet brim
      g.fillStyle(0x3a4258, 1);
      g.fillRect(1, 2, 15, 3);
      g.fillRect(3, 0, 11, 3);
      // Eye slit under the brim
      g.fillStyle(0x101820, 1);
      g.fillRect(5, 5, 7, 2);
      g.fillStyle(0xffd9a0, 1);
      g.fillRect(6, 5, 2, 2);
    };

    let g = scn.make.graphics({ x: 0, y: 0, add: false });
    draw(g, false);
    g.generateTexture("tin-soldier-1", 17, 22);
    g.destroy();
    g = scn.make.graphics({ x: 0, y: 0, add: false });
    draw(g, true);
    g.generateTexture("tin-soldier-2", 17, 22);
    g.destroy();
  }

  constructor(scn, x, y) {
    TinSoldier.ensureTextures(scn);
    super(scn, x, y, "tin-soldier-1");
    scn.add.existing(this);
    scn.physics.add.existing(this);

    this.score = 500;
    this.hp = 2;
    this.dead = false;
    this.dir = -1;
    this.patrolSpeed = 22;
    this.marchSpeed = 44;
    this.awareRange = 150;
    this._nextStep = 0;
    this._stepFrame = false;

    this.body.setAllowGravity(true);
    this.body.setSize(13, 19, 2, 3);
    this.setDepth(56);

    this.jammyOverlap = scn.physics.add.overlap(this, scn.jammy.sprite, () => {
      if (!this.dead && this.scene.jammy.alive) this.scene.jammy.takeDamage();
    });

    scn.enemies.add(this);
  }

  update() {
    if (this.dead || !this.body) return;
    const now = this.scene.time.now;
    const j = this.scene.jammy;

    if (this.body.blocked.left) this.dir = 1;
    else if (this.body.blocked.right) this.dir = -1;

    let speed = this.patrolSpeed;
    if (j && j.alive) {
      const dx = j.sprite.x - this.x;
      if (Math.abs(dx) < this.awareRange && Math.abs(j.sprite.y - this.y) < 60) {
        this.dir = dx > 0 ? 1 : -1;
        speed = this.marchSpeed;
      }
    }

    if (this.body.blocked.down) {
      // Don't march off ledges — soldiers hold the line
      const ahead = this.scene.groundLayer.getTileAtWorldXY(
        this.x + this.dir * 10, this.y + this.height / 2 + 6
      );
      if (!ahead) {
        this.dir *= -1;
        speed = this.patrolSpeed;
      }
      this.body.setVelocityX(this.dir * speed);
    }

    this.setFlipX(this.dir > 0);
    if (now > this._nextStep) {
      this._nextStep = now + (speed > this.patrolSpeed ? 160 : 280);
      this._stepFrame = !this._stepFrame;
      this.setTexture(this._stepFrame ? "tin-soldier-2" : "tin-soldier-1");
    }
  }

  takeDamage(val = 1) {
    if (this.dead) return;
    // Frontal armor: light hits (sonic = 1) clink off the face side.
    // Heavy hits (seed blast, bass quake, big shot >= 2) pierce the can.
    const j = this.scene.jammy;
    if (val <= 1 && j && (j.sprite.x - this.x) * this.dir > 0) {
      this.setTintFill(0xffffff);
      this.scene.time.delayedCall(40, () => { if (this.active) this.clearTint(); });
      this.scene.sound.play("enemyHitSound", { rate: 1.9, volume: 0.25 });
      return;
    }
    this.hp -= val;
    this.setTint(0xff6666);
    this.scene.time.delayedCall(60, () => { if (this.active) this.clearTint(); });
    this.scene.sound.play("enemyHitSound");
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
