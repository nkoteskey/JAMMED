class Blubert {
  constructor(scn, jammy) {
    this.scene = scn;
    this.jammy = jammy;

    // Blubert flies ahead-and-above Jammy so his scan reaches hidden
    // enemies before Jammy does, giving time to shoot the bushes out.
    this.offsetX = 140;
    this.offsetY = -44;
    this.followSpeed = 0.045;

    this.scanRange = 320;
    this.scanInterval = 400;

    this.stunned = false;
    this.stunDuration = 3000;
    this.hp = 3;
    this.dead = false;

    this.trackedEnemy = null;

    this.sprite = scn.physics.add.sprite(
      jammy.sprite.x + this.offsetX,
      jammy.sprite.y + this.offsetY,
      "blubert",
      "idle-right1"
    );
    this.sprite.body.setAllowGravity(false);
    this.sprite.setDepth(95);
    this.sprite.parentObject = this;

    if (!scn.anims.exists("blubert-idle-right")) {
      scn.anims.create({
        key: "blubert-idle-right",
        frames: scn.anims.generateFrameNames("blubert", { prefix: "idle-right", start: 1, end: 4 }),
        frameRate: 6, repeat: -1,
      });
      scn.anims.create({
        key: "blubert-idle-left",
        frames: scn.anims.generateFrameNames("blubert", { prefix: "idle-left", start: 1, end: 4 }),
        frameRate: 6, repeat: -1,
      });
      scn.anims.create({
        key: "blubert-tilt-right",
        frames: scn.anims.generateFrameNames("blubert", { prefix: "tilt-right", start: 1, end: 4 }),
        frameRate: 8, repeat: -1,
      });
      scn.anims.create({
        key: "blubert-tilt-left",
        frames: scn.anims.generateFrameNames("blubert", { prefix: "tilt-left", start: 1, end: 4 }),
        frameRate: 8, repeat: -1,
      });
      scn.anims.create({
        key: "blubert-stunned",
        frames: scn.anims.generateFrameNames("blubert", { prefix: "stunned", start: 1, end: 4 }),
        frameRate: 10, repeat: -1,
      });
    }
    this.sprite.play("blubert-idle-right");

    // Aim-assist reticle — subtle crosshair drawn on tracked enemy so
    // Jammy knows exactly what Blubert is locked onto.
    this.reticle = scn.add.graphics();
    this.reticle.setDepth(70);
    this.reticle.setVisible(false);

    this.scanTimer = scn.time.addEvent({
      delay: this.scanInterval,
      callback: () => this.scan(),
      loop: true,
    });

    // Expose for collaborators (SeedOfDestruction stuns, etc.)
    scn.blubert = this;
  }

  update() {
    if (this.dead || !this.sprite) return;
    if (!this.jammy || !this.jammy.alive) return;

    // Drop a tracked enemy that has died, gone inactive, or scrolled
    // off screen. Without this, a fresh seed keeps homing toward the
    // corpse of the last-killed drone until the next scan (750ms),
    // which can miss the next drone that's already in play.
    if (this.trackedEnemy) {
      const e = this.trackedEnemy;
      if (e.dead || !e.active) {
        // Kill confirmed — short re-acquire cooldown so lock-on can't
        // be chained into spam; the player has to fight unassisted
        // for a beat between locks.
        this.trackedEnemy = null;
        this._nextLockTime = this.scene.time.now + 2200;
      } else if (!this.scene.cameras.main.worldView.contains(e.x, e.y)) {
        this.trackedEnemy = null;
      }
    }

    let targetX, targetY, tilting = false;
    let trackingCloseness = 0;
    if (this.trackedEnemy && this.trackedEnemy.active &&
        !this.trackedEnemy.dead && this.trackedEnemy.scene) {
      targetX = this.trackedEnemy.x;
      // Descend only as Jammy closes on the enemy — stays high and
      // clear of the seed blast radius until the hit is imminent.
      const distJE = Phaser.Math.Distance.Between(
        this.jammy.sprite.x, this.jammy.sprite.y,
        this.trackedEnemy.x, this.trackedEnemy.y
      );
      trackingCloseness = Phaser.Math.Clamp(1 - distJE / 220, 0, 1);
      const aboveEnemy = 90 - trackingCloseness * 72;
      targetY = this.trackedEnemy.y - aboveEnemy;
      tilting = true;
    } else {
      this.trackedEnemy = null;
      const dir = this.jammy.facing === "right" ? 1 : -1;
      targetX = this.jammy.sprite.x + this.offsetX * dir;
      targetY = this.jammy.sprite.y + this.offsetY;
    }

    // Track cautiously when far, but commit as the fight closes —
    // 0.02 when far (closeness 0) ramps up to 0.11 at close range,
    // so he stays usefully near the action instead of lagging behind.
    const speed = tilting
      ? 0.02 + trackingCloseness * 0.09
      : this.followSpeed;
    this.sprite.x += (targetX - this.sprite.x) * speed;
    this.sprite.y += (targetY - this.sprite.y) * speed;

    // Reticle — draw on the tracked enemy, clear when idle
    if (this.reticle) {
      this.reticle.clear();
      if (this.trackedEnemy && this.trackedEnemy.active && !this.trackedEnemy.dead) {
        const e = this.trackedEnemy;
        this.reticle.lineStyle(1, 0xff7070, 0.85);
        this.reticle.strokeCircle(e.x, e.y, 10);
        this.reticle.lineBetween(e.x - 14, e.y, e.x - 5, e.y);
        this.reticle.lineBetween(e.x + 5,  e.y, e.x + 14, e.y);
        this.reticle.lineBetween(e.x, e.y - 14, e.x, e.y - 5);
        this.reticle.lineBetween(e.x, e.y + 5,  e.x, e.y + 14);
        this.reticle.setVisible(true);
      } else {
        this.reticle.setVisible(false);
      }
    }

    if (this.stunned) {
      this.sprite.play("blubert-stunned", true);
      return;
    }
    const facingRight = targetX >= this.jammy.sprite.x;
    const anim = tilting
      ? (facingRight ? "blubert-tilt-right" : "blubert-tilt-left")
      : (facingRight ? "blubert-idle-right" : "blubert-idle-left");
    this.sprite.play(anim, true);
  }

  scan() {
    if (this.stunned || !this.jammy || !this.jammy.alive) return;
    if (!this.scene.enemies) return;

    // Audio cue — use existing laser sound as placeholder beep
    if (this.scene.sound.get("laserSound")) {
      this.scene.sound.play("laserSound", { volume: 0.15, rate: 2.5 });
    }

    const enemies = this.scene.enemies.getChildren();
    const cam = this.scene.cameras.main;
    let nearest = null;
    let nearestDist = Infinity;
    for (const e of enemies) {
      if (!e || e.dead) continue;
      // Only care about enemies currently on screen.
      if (!cam.worldView.contains(e.x, e.y)) continue;
      const d = Phaser.Math.Distance.Between(this.sprite.x, this.sprite.y, e.x, e.y);
      if (d > this.scanRange) continue;
      if (e.hidden && typeof e.detect === "function") {
        e.detect();
      }
      // Track the nearest active threat: revealed zomberries, chasers,
      // and anything flagged targetable (drones, wasps, bats, cactuses,
      // soldiers, Echo) — but never armored hazards.
      if (e.detected || e.inPursuit || (e.targetable && !e.invincible)) {
        if (d < nearestDist) {
          nearestDist = d;
          nearest = e;
        }
      }
    }
    // Detection always runs; ACQUIRING a new lock honors the cooldown.
    if (this.scene.time.now >= (this._nextLockTime || 0)) {
      this.trackedEnemy = nearest;
    }
  }

  stun() {
    if (this.stunned) return;
    this.stunned = true;
    this.trackedEnemy = null;
    this.scene.time.delayedCall(this.stunDuration, () => {
      this.stunned = false;
    });
  }

  takeSympathyDamage() {
    if (this.dead || !this.sprite || !this.sprite.active) return;
    // Only share the hit if Blubert was actually close enough to the
    // action to plausibly be harmed — out scouting a bush 300px ahead
    // shouldn't cost him HP for a drone pegging Jammy behind him.
    if (this.jammy && this.jammy.sprite) {
      const d = Phaser.Math.Distance.Between(
        this.sprite.x, this.sprite.y,
        this.jammy.sprite.x, this.jammy.sprite.y
      );
      if (d > 110) return;
    }
    this.hp -= 1;
    // Red flash + small knockback bob
    this.sprite.setTint(0xff5555);
    this.scene.time.delayedCall(180, () => {
      if (this.sprite && this.sprite.active) this.sprite.clearTint();
    });
    const dir = this.jammy && this.jammy.facing === "right" ? -1 : 1;
    this.scene.tweens.add({
      targets: this.sprite,
      x: this.sprite.x + 14 * dir,
      y: this.sprite.y - 6,
      yoyo: true,
      duration: 120,
      ease: "Sine.easeOut",
    });
    if (this.hp <= 0) this.dispose();
  }

  dispose() {
    if (this.dead) return;
    this.dead = true;
    this.trackedEnemy = null;
    if (this.scanTimer) this.scanTimer.destroy();
    if (this.reticle) { this.reticle.destroy(); this.reticle = null; }
    // Clear the scene reference immediately — the fade-out takes
    // 600ms and a pickup grabbed during that window should trigger
    // a revive rather than being blocked by the still-on-screen ghost.
    if (this.scene && this.scene.blubert === this) this.scene.blubert = null;
    if (!this.sprite) return;
    // Tumble-and-fade farewell
    this.scene.tweens.add({
      targets: this.sprite,
      alpha: 0,
      rotation: 2.5,
      y: this.sprite.y + 20,
      duration: 600,
      ease: "Cubic.easeIn",
      onComplete: () => {
        if (this.sprite) this.sprite.destroy();
        this.sprite = null;
      },
    });
  }
}
