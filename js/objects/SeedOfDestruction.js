class SeedOfDestruction extends Phaser.Physics.Arcade.Sprite {
  constructor(scn, x, y, direction, aimUp = false) {
    SeedOfDestruction.ensureTexture(scn);
    super(scn, x, y, "seed-teardrop");
    scn.add.existing(this);
    scn.physics.add.existing(this);

    this.body.setAllowGravity(true);
    this.body.setSize(8, 6, 2, 1);
    this.body.setBounce(0.2);

    this.damage = 3;
    this.blastRadius = 52;
    // Jammy and Blubert are caught by most of the blast: lobbing a seed
    // at something standing next to you costs a heart and knocks
    // Blubert's lock-on out for a few seconds.
    this.selfDamageRadius = 44;
    this.stunRadius = 52;
    // Lock-on: Blubert's tracked target first, otherwise the nearest
    // visible enemy near Jammy. The seed curves toward it in flight.
    this.lockRange = 150;
    this.target = this._pickTarget(x, y);
    this.fuseMs = 1800;
    this.exploded = false;

    this.setOrigin(0.5, 0.5);

    this.fuseTimer = scn.time.delayedCall(this.fuseMs, () => this.explode());
    // Explode on any solid tilemap contact — ground, walls, death blocks, etc.
    const blockingLayers = [
      scn.groundLayer,
      scn.enemyStopBlocksLayer,
      scn.deathBlocksLayer,
      scn.sceneChangeLayer,
    ].filter(Boolean);
    for (const layer of blockingLayers) {
      scn.physics.add.collider(this, layer, () => this.explode());
    }
    // Detonate on enemy contact too
    if (scn.enemies) {
      this.enemyOverlap = scn.physics.add.overlap(this, scn.enemies, () => this.explode());
    }

    // Point-blank detonation — if spawned on top of an enemy, next-tick boom.
    if (scn.enemies) {
      const pbEnemy = scn.enemies.getChildren().find(e =>
        e && !e.dead &&
        Phaser.Math.Distance.Between(x, y, e.x, e.y) <= 18
      );
      if (pbEnemy) {
        scn.time.delayedCall(0, () => this.explode());
      }
    }

    // Arc launch — LAST so nothing else clobbers the velocity.
    // Shorter range: ~260-300px to ground so a player who stopped
    // after seeing eyes appear can still clear the bush ahead.
    const dir = direction === "left" ? -1 : 1;
    // Aim-up lob climbs ~150px: enough to reach drones hiding in clouds
    const speedX = (aimUp ? 150 : 300) * dir;
    const speedY = aimUp ? -520 : -340;
    this.body.setVelocityX(speedX);
    this.body.setVelocityY(speedY);
  }

  // Whistle-plunge fire sfx from already-loaded samples — works even
  // when Phaser's WebAudio context is suspended (samples route
  // through the sound manager, which queues until first user gesture).
  static playFireSound(scene) {
    const snd = scene.sound;
    if (!snd || !scene.cache || !scene.cache.audio) return;
    if (scene.cache.audio.exists("laserSound")) {
      snd.play("laserSound", { volume: 1.0, rate: 1.7 });
    }
    if (scene.cache.audio.exists("shortExplosion")) {
      scene.time.delayedCall(150, () => {
        if (scene.cache && scene.cache.audio.exists("shortExplosion")) {
          snd.play("shortExplosion", { volume: 0.9, rate: 0.7 });
        }
      });
    }
  }

  static ensureTexture(scene) {
    if (scene.textures.exists("seed-teardrop")) return;
    // 14x8 tan tear-drop — compact, fat end on the right.
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0xd4a676, 1);
    g.fillEllipse(10, 4, 8, 7);
    g.fillTriangle(10, 1, 10, 7, 0, 4);
    g.lineStyle(1, 0x7e5a34, 1);
    g.strokeEllipse(10, 4, 8, 7);
    g.beginPath();
    g.moveTo(10, 1);
    g.lineTo(0, 4);
    g.lineTo(10, 7);
    g.closePath();
    g.strokePath();
    g.fillStyle(0xf0c899, 1);
    g.fillEllipse(11, 3, 3, 1.5);
    g.generateTexture("seed-teardrop", 14, 8);
    g.destroy();
  }

  _pickTarget(x, y) {
    const scn = this.scene;
    const blu = scn.blubert;
    if (blu && !blu.stunned && blu.trackedEnemy && blu.trackedEnemy.active && !blu.trackedEnemy.dead) {
      return blu.trackedEnemy;
    }
    if (!scn.enemies) return null;
    let best = null, bestD = this.lockRange;
    for (const e of scn.enemies.getChildren()) {
      if (!e || !e.body || !Blubert.canLock(e)) continue;
      const d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
      if (d < bestD) { bestD = d; best = e; }
    }
    if (best) this._flashLock(best);
    return best;
  }

  // Quick yellow bracket on the enemy the seed locked onto
  _flashLock(e) {
    const g = this.scene.add.graphics().setDepth(71);
    g.lineStyle(1, 0xffe066, 1);
    g.strokeRect(-11, -11, 22, 22);
    g.setPosition(e.x, e.y);
    this.scene.tweens.add({
      targets: g, scaleX: 0.6, scaleY: 0.6, alpha: 0, duration: 320,
      onUpdate: () => { if (e.active) g.setPosition(e.x, e.y); },
      onComplete: () => g.destroy(),
    });
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.exploded || !this.body) return;
    // Hidden enemies have no physics body, so check them by distance:
    // a seed passing a bush or a cloud with something inside goes off.
    if (this.scene.enemies) {
      for (const e of this.scene.enemies.getChildren()) {
        if (!e || e.dead || !e.hidden || !e.active) continue;
        if (Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y) < 26) {
          this.explode();
          return;
        }
      }
    }
    const vx = this.body.velocity.x;
    const vy = this.body.velocity.y;
    if (vx !== 0 || vy !== 0) {
      this.rotation = Math.atan2(vy, vx);
    }
    // Soft homing toward the locked target (Blubert's mark, or the
    // nearest enemy that was close to Jammy when the seed was fired).
    // Aims at a small lead-ahead of the target's velocity so moving
    // drones don't slip past the seed, and adds extra upward thrust
    // when the target is above the seed to counteract gravity (900
    // downward) — otherwise seeds tend to fall under drones they're
    // supposedly homing onto.
    const e = this.target;
    if (e && e.active && !e.dead && e.scene) {
      const tvx = (e.body && e.body.velocity && e.body.velocity.x) || 0;
      const tvy = (e.body && e.body.velocity && e.body.velocity.y) || 0;
      const tx = e.x + tvx * 0.15;
      const ty = e.y + tvy * 0.15;
      const dx = tx - this.x;
      const dy = ty - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 4 && dist < 420) {
        const pull = Phaser.Math.Clamp(640 - dist, 260, 560);
        let ay = (dy / dist) * pull;
        if (dy < -20) ay -= 360; // counter-gravity boost toward elevated targets
        this.body.setAccelerationX((dx / dist) * pull);
        this.body.setAccelerationY(ay);
        return;
      }
    }
    this.body.setAcceleration(0, 0);
  }

  explode() {
    if (this.exploded) return;
    this.exploded = true;
    if (this.fuseTimer) this.fuseTimer.remove(false);

    // Damage all enemies in blast radius
    if (this.scene.enemies) {
      for (const e of this.scene.enemies.getChildren()) {
        if (!e || e.dead) continue;
        const d = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
        if (d > this.blastRadius) continue;
        if (e.hidden && typeof e.explodeInBush === "function") {
          e.explodeInBush();
        } else if (typeof e.takeDamage === "function") {
          e.takeDamage(this.damage);
        }
      }
    }

    // Jammy self-damage if too close
    const jammy = this.scene.jammy;
    if (jammy && jammy.alive) {
      const dj = Phaser.Math.Distance.Between(this.x, this.y, jammy.sprite.x, jammy.sprite.y);
      if (dj <= this.selfDamageRadius) jammy.takeDamage();
    }

    // Blubert caught in the blast loses his lock-on for a few seconds
    const blu = this.scene.blubert;
    if (blu && blu.sprite && !blu.stunned) {
      const db = Phaser.Math.Distance.Between(this.x, this.y, blu.sprite.x, blu.sprite.y);
      if (db <= this.stunRadius) blu.stun();
    }

    this._spawnFieryBlast(this.x, this.y);
    this.scene.cameras.main.shake(130, 0.005);
    this.scene.sound.play("enemyDeathSound");
    this.destroy();
  }

  _spawnFieryBlast(x, y) {
    const scn = this.scene;
    // Orange expanding shockwave ring
    const ring = scn.add.circle(x, y, this.blastRadius, 0xff7a22, 0.45);
    ring.setStrokeStyle(3, 0xffd066, 1);
    ring.setScale(0.15);
    ring.setDepth(90);
    scn.tweens.add({
      targets: ring, scale: 1.1, alpha: 0,
      duration: 340, ease: "Cubic.easeOut",
      onComplete: () => ring.destroy(),
    });
    // Bright red-orange core flash
    const core = scn.add.circle(x, y, 14, 0xffcc44, 0.9);
    core.setDepth(92);
    scn.tweens.add({
      targets: core, scale: 2.6, alpha: 0,
      duration: 220, ease: "Quad.easeOut",
      onComplete: () => core.destroy(),
    });
    // A few fire sparks flying outward
    const sparkColors = [0xff3322, 0xff6611, 0xffaa33, 0xffee66];
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.3;
      const dist = 20 + Math.random() * this.blastRadius * 0.7;
      const spark = scn.add.circle(x, y, 2 + Math.random() * 2,
        sparkColors[i % sparkColors.length], 1);
      spark.setDepth(93);
      scn.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * dist,
        y: y + Math.sin(angle) * dist - 6,
        alpha: 0, scale: 0.3,
        duration: 280 + Math.random() * 140,
        ease: "Cubic.easeOut",
        onComplete: () => spark.destroy(),
      });
    }
    // Dark smoke puff lingering
    const smoke = scn.add.circle(x, y - 4, 10, 0x222222, 0.55);
    smoke.setDepth(91);
    scn.tweens.add({
      targets: smoke, y: y - 22, scale: 2.2, alpha: 0,
      duration: 520, ease: "Sine.easeOut",
      onComplete: () => smoke.destroy(),
    });
  }
}
