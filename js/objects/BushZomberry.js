class BushZomberry extends Raspberry {
  constructor(scn, x, y) {
    super(scn, x, y);

    this.hidden = true;
    this.detected = false;
    // ms between eyes appearing (detect) and the enemy actually popping out.
    // Long enough for the player to read the eyes as a warning and react.
    this.emergeDelayMs = 1700;

    // Zomberries match Jammy's walkSpeed 125 when chasing, so failing
    // to clear a bush before it emerges genuinely threatens him.
    this.walkSpeed = 90 * enemySpeedScale();
    this.runningSpeed = 125 * enemySpeedScale();

    this.setVisible(false);
    this.body.setEnable(false);
    this.body.setAllowGravity(false);

    // Tilemap createFromObjects calls `new BushZomberry(scene)` then
    // .setPosition(x, y), so defer bush visual creation to the position
    // setter — at construction time x/y are undefined.
    if (typeof x === "number" && typeof y === "number") {
      this._createBushVisual(x, y);
    }
  }

  _createBushVisual(x, y) {
    if (this.bush) return;
    this.bush = new Bush(this.scene, x, y);
  }

  setPosition(x, y, z, w) {
    super.setPosition(x, y, z, w);
    // Only move the bush with the zomberry while it's still hidden
    // inside the bush. Once it emerges, the bush is vegetation and
    // the zomberry wanders off — the bush should not follow.
    if (!this.bush && typeof x === "number" && typeof y === "number") {
      this._createBushVisual(x, y);
    } else if (this.bush && this.hidden && typeof x === "number" && typeof y === "number") {
      this.bush.setPosition(x, y);
    }
    return this;
  }

  detect() {
    if (this.detected || !this.hidden || this.dead) return;
    this.detected = true;
    if (this.bush) this.bush.setEyesVisible(true);
    // Short warning window before the zomberry bursts out
    this.scene.time.delayedCall(this.emergeDelayMs, () => this.emerge());
  }

  emerge() {
    if (!this.hidden || this.dead) return;
    this.hidden = false;

    // Kill the inherited 500ms rest/roam timer — our update() drives
    // the chase every frame, and the parent timer was periodically
    // zeroing velocity, making zomberries feel slower than Jammy.
    if (this.chaseTimer) {
      this.chaseTimer.remove(false);
      this.chaseTimer = null;
    }

    // Burst out of the top of the bush: start small at bush center,
    // scale up to full size, and pop upward with a hop.
    const bushCenterY = this.bush ? this.bush.container.y : this.y - 18;
    this.setPosition(this.x, bushCenterY);
    this.setVisible(true);
    this.setScale(0.2);
    this.scene.tweens.add({
      targets: this,
      scaleX: 1, scaleY: 1,
      duration: 180,
      ease: "Back.easeOut",
    });

    // Face Jammy as it emerges so the follow-up attack reads right
    if (this.scene.jammy && this.scene.jammy.sprite) {
      this.facing = this.scene.jammy.sprite.x > this.x ? 1 : -1;
    }

    this.body.setEnable(true);
    this.body.setAllowGravity(true);
    this.body.setVelocityY(-220);

    if (this.bush) {
      this.bush.setEyesVisible(false);
      this.bush.shake(300);
    }
  }

  explodeInBush() {
    if (this.dead) return;
    // Seed blew the bush — kill the zomberry. Leave the bush for ambience.
    this.hidden = false;
    this.setVisible(true);
    this.body.setEnable(true);
    this.body.setAllowGravity(true);
    if (this.bush) this.bush.setEyesVisible(false);
    this.hp = 0;
    this.die();
  }

  update() {
    if (this.hidden) return;
    super.update();
    if (this.dead || this.attacking) return;
    const cam = this.scene.cameras.main;
    if (!cam.worldView.contains(this.x, this.y)) return;
    // Once emerged and in view, a zomberry hunts Jammy continuously
    // rather than relying on the inherited 200/150px awareness rings.
    this.jammyInRange = true;
    this.inPursuit = true;
    this.run(this.facing);
  }

  die() {
    // Leave the bush visible — it's just vegetation now.
    super.die();
  }
}
