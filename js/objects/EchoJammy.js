// The Lab-Grown Artist Program: Jammy's own sampled riffs,
// reconstituted from concentrate and played back at him. A black
// silhouette of Jammy with broadcast-teal eyes that flickers between
// hover, dash, and dark-wave volleys.
class EchoJammy extends Phaser.Physics.Arcade.Sprite {
  constructor(scn, x, y, arena) {
    super(scn, x, y, "jammy", "resting-right2");
    scn.add.existing(this);
    scn.physics.add.existing(this);

    this.arena = arena; // { left, right, floorY }
    this.score = 5000;
    this.targetable = true; // Blubert lock-on
    this.maxHp = 14;
    this.hp = this.maxHp;
    this.dead = false;
    this.invincible = false;
    this.state = "hover";
    this._stateUntil = scn.time.now + 1400;
    this._dashDir = 1;

    this.setTintFill(0x141a26);
    this.setDepth(95);
    this.body.setAllowGravity(false);
    this.body.setSize(18, 28);

    // Broadcast eyes — live objects over the silhouette
    this.eyeL = scn.add.rectangle(x - 4, y - 8, 3, 3, 0x7fe8e0).setDepth(96);
    this.eyeR = scn.add.rectangle(x + 4, y - 8, 3, 3, 0x7fe8e0).setDepth(96);

    this.jammyOverlap = scn.physics.add.overlap(this, scn.jammy.sprite, () => {
      if (!this.dead && this.scene.jammy.alive && this.state === "dash") {
        this.scene.jammy.takeDamage();
      }
    });

    scn.enemies.add(this);
  }

  update() {
    if (this.dead || !this.body) return;
    const now = this.scene.time.now;
    const j = this.scene.jammy;

    // Eyes ride the silhouette
    const fx = this.flipX ? 4 : -4;
    this.eyeL.setPosition(this.x + fx, this.y - 8);
    this.eyeR.setPosition(this.x + fx + (this.flipX ? -5 : 5), this.y - 8);

    if (!j || !j.alive) {
      this.body.setVelocity(0, 0);
      return;
    }
    this.setFlipX(j.sprite.x < this.x);

    if (now >= this._stateUntil) this._nextState();

    if (this.state === "hover") {
      const tx = j.sprite.x + (j.sprite.x < this.x ? 70 : -70);
      const ty = this.arena.floorY - 70 + Math.sin(now / 300) * 8;
      this.body.setVelocityX(Phaser.Math.Clamp((tx - this.x) * 2, -120, 120));
      this.body.setVelocityY(Phaser.Math.Clamp((ty - this.y) * 2, -90, 90));
    } else if (this.state === "dash") {
      this.body.setVelocityX(this._dashDir * 280);
      this.body.setVelocityY(Phaser.Math.Clamp((j.sprite.y - 6 - this.y) * 3, -120, 120));
      if ((this._dashDir > 0 && this.x > this.arena.right) ||
          (this._dashDir < 0 && this.x < this.arena.left)) {
        this.state = "hover";
        this._stateUntil = now + 1100;
      }
    } else if (this.state === "volley") {
      this.body.setVelocity(0, 0);
    }
  }

  _nextState() {
    const now = this.scene.time.now;
    // Teleport flicker between moves
    this.scene.tweens.add({
      targets: this, alpha: 0.25, duration: 70, yoyo: true, repeat: 2,
    });
    if (this.state !== "dash" && Math.random() < 0.45) {
      this.state = "dash";
      this._dashDir = this.scene.jammy.sprite.x > this.x ? 1 : -1;
      this._stateUntil = now + 2400;
      this.play(this._dashDir > 0 ? "running-right" : "running-left", true);
      this.setTintFill(0x141a26);
    } else if (this.state !== "volley" && Math.random() < 0.5) {
      this.state = "volley";
      this._stateUntil = now + 1100;
      this._fireVolley();
    } else {
      this.state = "hover";
      this._stateUntil = now + 1300;
    }
  }

  _fireVolley() {
    const j = this.scene.jammy;
    if (!j || !j.alive) return;
    const base = Math.atan2(j.sprite.y - this.y, j.sprite.x - this.x);
    [-0.22, 0, 0.22].forEach((off, i) => {
      this.scene.time.delayedCall(i * 110, () => {
        if (this.dead) return;
        const wave = this.scene.physics.add.sprite(this.x, this.y, "audio-wave");
        wave.setTint(0x141a26);
        wave.setDepth(94);
        if (this.scene.enemyProjectiles) this.scene.enemyProjectiles.add(wave);
        wave.body.setAllowGravity(false);
        wave.body.setSize(12, 12);
        const ang = base + off;
        wave.body.setVelocity(Math.cos(ang) * 200, Math.sin(ang) * 200);
        wave.setFlipX(Math.cos(ang) < 0);
        const ov = this.scene.physics.add.overlap(wave, j.sprite, () => {
          if (j.alive) j.takeDamage();
          wave.destroy();
        });
        this.scene.time.delayedCall(2200, () => {
          if (ov) ov.destroy();
          if (wave.active) wave.destroy();
        });
      });
    });
    if (this.scene.cache.audio.exists("laserSound")) {
      this.scene.sound.play("laserSound", { volume: 0.5, rate: 0.7 });
    }
  }

  takeDamage(val = 1) {
    if (this.dead || this.invincible) return;
    this.hp -= val;
    this.setTintFill(0x7fe8e0);
    this.scene.time.delayedCall(60, () => {
      if (this.active) this.setTintFill(0x141a26);
    });
    this.scene.sound.play("enemyHitSound");
    if (this.scene.updateEchoHealthbar) this.scene.updateEchoHealthbar(this.hp, this.maxHp);
    if (this.hp <= 0) this.die();
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.scene.scene.get("UIScene").setScore(this.score);
    this.body.setEnable(false);
    new EnemyDeath(this.scene, this.x - 10, this.y);
    new EnemyDeath(this.scene, this.x + 10, this.y - 8);
    this.scene.time.delayedCall(150, () => new EnemyDeath(this.scene, this.x, this.y + 6));
    if (this.scene.cache.audio.exists("bossDeathSound")) {
      this.scene.sound.play("bossDeathSound", { volume: 0.8 });
    }
    this.eyeL.destroy();
    this.eyeR.destroy();
    const scn = this.scene;
    this.scene.tweens.add({
      targets: this, alpha: 0, duration: 700,
      onComplete: () => {
        this.destroy();
        scn.events.emit("echo-defeated");
      },
    });
  }
}
