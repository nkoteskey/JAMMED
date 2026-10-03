// Blueberry drone that hides inside a cloud in Stage1_3. Emerges when
// Jammy comes underneath, then alternates between dropping seed bombs
// (its normal attack) and committing a dive-bomb at him.
class CloudBlueberry extends Blueberry {
  constructor(scn, x, y) {
    super(scn, x, y);

    this.body.setAllowGravity(false);

    this.hidden = true;
    this.detected = false;
    this.setVisible(false);
    this.body.setEnable(false);

    // Cover cloud
    this.cloud = new Cloud(scn, x, y);

    // Ditch the vanilla "oscillate horizontally + drop bomb" loop —
    // this variant has its own AI below. Parent Blueberry.die() will
    // call .destroy() on these refs, so we leave no-op stubs behind
    // instead of nulling them (otherwise die() throws on the null).
    if (this.roamTimer) this.roamTimer.destroy();
    if (this.bombTimer) this.bombTimer.destroy();
    this.roamTimer = { destroy: () => {} };
    this.bombTimer = { destroy: () => {} };

    this.triggerDistance = 120;   // "almost underneath" trigger
    this.dropCooldownMs = 1400;
    this.diveCooldownMs = 2200;
    this.lastAction = 0;
    // First attack is a dive so the player immediately sees the drone
    // as a kinetic threat; drops come after.
    this.nextAction = "dive";
    this.diving = false;
    this.returning = false;
    this.homeX = x;
    this.homeY = y;
    // Which side the drone windups on for its next dive. Flipped after
    // each dive so attacks come in from alternating directions.
    this.diveSide = Math.random() < 0.5 ? -1 : 1;
  }

  update() {
    if (this.dead) return;
    const j = this.scene.jammy;
    if (!j || !j.alive) {
      // Jammy is dead/gone — halt any active dive and stop motion.
      if (this._diveTween) { this._diveTween.remove(); this._diveTween = null; }
      if (this.body) this.body.setVelocity(0, 0);
      this.diving = false;
      return;
    }

    if (this.hidden) {
      // Emerge once Jammy is close underneath
      const dx = Math.abs(j.sprite.x - this.x);
      const dy = j.sprite.y - this.y;   // positive if Jammy is below
      if (dx < this.triggerDistance && dy > 0 && dy < 180) {
        this.emerge();
      }
      return;
    }

    if (this.diving) return;

    // Tracking target depends on the next attack:
    //   drop -> hover directly above Jammy so the bomb falls on him
    //   dive -> post up ~170px to one side as a windup so the dive
    //           sweeps laterally through him instead of straight down.
    let targetX;
    if (this.nextAction === "drop") {
      targetX = j.sprite.x;
    } else {
      targetX = j.sprite.x + this.diveSide * 170;
    }
    const dx = targetX - this.x;
    const dy = (j.sprite.y - 88) - this.y;
    // Match Jammy's horizontal pace and correct toward the target —
    // lets the drone keep 2s overhead hover locked while Jammy is
    // running rather than lagging 10px/s behind his walkSpeed.
    const jvx = j.sprite.body.velocity.x || 0;
    const maxSpeed = 150;
    const targetVx = Phaser.Math.Clamp(jvx + dx * 3, -maxSpeed, maxSpeed);
    const targetVy = Phaser.Math.Clamp(dy * 2.2, -maxSpeed, maxSpeed);
    this.body.setVelocityX(targetVx);
    this.body.setVelocityY(targetVy);
    this.facing = j.sprite.x < this.x ? -1 : 1;
    this.play(this.facing === 1 ? "oscillating-right" : "oscillating-left", true);

    // Alternate attacks on a simple cooldown. Drop is additionally
    // gated on being (almost) directly above Jammy so the bomb has a
    // real chance of landing — otherwise we just wait for the drone
    // to drift overhead before committing to the drop.
    const now = this.scene.time.now;

    // Track how long the drone has been continuously overhead of Jammy.
    // Drops require a sustained hover so the attack is telegraphed and
    // the drone isn't just trotting along at Jammy's shoulder firing.
    if (Math.abs(this.x - j.sprite.x) <= 24) {
      if (!this._overheadSince) this._overheadSince = now;
    } else {
      this._overheadSince = 0;
    }
    const hoverMs = this._overheadSince ? (now - this._overheadSince) : 0;

    if (now - this.lastAction >= (this.nextAction === "dive" ? this.diveCooldownMs : this.dropCooldownMs)) {
      if (this.nextAction === "dive") {
        // Wait until drone has actually reached the windup side.
        const sideDelta = (this.x - j.sprite.x) * this.diveSide;
        if (sideDelta >= 120) {
          this.diveBomb();
          this.lastAction = now;
          this.nextAction = "drop";
        }
      } else if (hoverMs >= 1000) {
        this.dropBomb();
        this.lastAction = now;
        this.nextAction = "dive";
        this._overheadSince = 0;
      }
    }
  }

  // A seed blast reaches the cloud: the drone is flushed out and killed
  explodeInBush() {
    if (this.dead) return;
    if (this.hidden) this.emerge();
    // Puff of cloud
    for (let i = 0; i < 6; i++) {
      const p = this.scene.add.circle(this.x + Phaser.Math.Between(-12, 12), this.y + Phaser.Math.Between(-8, 8), 3, 0xffffff, 0.9).setDepth(60);
      this.scene.tweens.add({ targets: p, scale: 2, alpha: 0, duration: 320, onComplete: () => p.destroy() });
    }
    this.hp = 0;
    this.die();
  }

  detect() {
    if (this.detected || !this.hidden || this.dead) return;
    this.detected = true;
    if (this.cloud) this.cloud.setEyesVisible(true);
  }

  emerge() {
    this.hidden = false;
    // Once out, it's a live threat: let Blubert lock on so seeds home in
    this.detected = true;
    this.inPursuit = true;
    this.setVisible(true);
    this.body.setEnable(true);
    this.lastAction = this.scene.time.now;
    if (this.cloud) this.cloud.setEyesVisible(false);
    // Pop out of the cloud with a small down-tween for flavor
    this.setScale(0.4);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1, scaleY: 1,
      y: this.homeY + 18,
      duration: 240,
      ease: "Back.easeOut",
    });
  }

  dropBomb() {
    // Drop from the drone's own position. Tracking in update() already
    // leads Jammy so a straight drop lands in the right spot — and the
    // bomb visually trails off the drone instead of materializing mid-air.
    const bomb = new BlueberryBomb(this.scene, this.x, this.y + 8);
    this.scene.enemies.add(bomb);
  }

  diveBomb() {
    this.diving = true;
    this._diveDamaged = false;
    const j = this.scene.jammy;
    const startX = this.x;
    const startY = this.y;

    // Lateral sweep from the windup side through Jammy and a short
    // distance past. Control Y is computed so the curve *actually*
    // passes through Jammy's body at t=0.5 — quadratic Bezier
    // midpoint is (start + 2*ctrl + end)/4, so solve for ctrl.
    let side = this.x < j.sprite.x ? -1 : 1;
    if (Math.abs(this.x - j.sprite.x) < 40) side = Math.random() < 0.5 ? -1 : 1;
    const horizReach = 160; // how far past Jammy the exit lands
    const endX = j.sprite.x - side * horizReach;
    const endY = startY;
    const midX = j.sprite.x;
    // Dip through Jammy's chest/head, not his feet — keeps the low
    // point inside the peak of a seed's arc so shooting the drone
    // mid-dive is actually viable.
    const passThroughY = j.sprite.y - 10;
    const midY = 2 * passThroughY - (startY + endY) / 2;

    this.body.setAllowGravity(false);
    this.facing = endX < this.x ? -1 : 1;
    this.play(this.facing === 1 ? "oscillating-right" : "oscillating-left", true);

    const t = { v: 0 };
    this._diveTween = this.scene.tweens.add({
      targets: t,
      v: 1,
      duration: 620,
      ease: "Sine.easeInOut",
      onUpdate: () => {
        if (!this.active || this.dead) return;
        const u = 1 - t.v;
        this.x = u*u*startX + 2*u*t.v*midX + t.v*t.v*endX;
        this.y = u*u*startY + 2*u*t.v*midY + t.v*t.v*endY;
        // Damage Jammy when the sweep passes close to him, once per dive
        if (!this._diveDamaged && this.scene.jammy && this.scene.jammy.alive) {
          const jm = this.scene.jammy.sprite;
          const d = Phaser.Math.Distance.Between(this.x, this.y, jm.x, jm.y);
          if (d < 20) {
            this._diveDamaged = true;
            this.scene.jammy.takeDamage(this.x);
          }
        }
      },
      onComplete: () => this._diveComplete(),
    });
  }

  _diveComplete() {
    if (this.dead) return;
    this.diving = false;
    this._diveTween = null;
    // Flip windup side for the next dive so attacks alternate sides
    this.diveSide = -this.diveSide;
    // update() resumes tracking Jammy next frame — no return tween
  }

  die() {
    if (this.dead) return;
    // Cancel any in-flight dive so the onUpdate doesn't keep writing
    // to x/y while super.die is playing the death anim.
    if (this._diveTween) { this._diveTween.remove(); this._diveTween = null; }
    this.diving = false;
    if (this.cloud) {
      // Leave the cloud behind — it's just a cloud, harmless.
      this.cloud = null;
    }
    super.die();
  }
}
