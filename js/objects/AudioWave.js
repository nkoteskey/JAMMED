class AudioWave  {
  constructor(scene, x, y, direction = 1, up=false, bigShot=false, velocity=500) {
    // Determine x spawn based on direction Jammy is facing
    const spawnX = direction === -1 ? x - 16 : x + 16;
    if(bigShot){
      this.damage=3;
    }
    // Call Phaser Sprite constructor
    this.sprite=scene.add.sprite( spawnX, y, "audio-wave");
    this.scene = scene;
    // Add the sprite to the scene and enable physics
    scene.physics.add.existing(this.sprite);
    scene.bullets.add(this.sprite);
    // Set anchor point to the center
    this.sprite.setOrigin(0.5, 0.5);

    // Flip the sprite if Jammy is facing left
    if (direction === 'left') {
      this.sprite.setFlipX(true);
      velocity = -velocity;
      if(up){
        this.sprite.angle = 45;
      }

    }
    else{
      if(up){
        this.sprite.angle = -45;
      }
    }

    // Set physics properties
    this.sprite.body.setBounce(0); // No bounce
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setSize(13, 15, true); // Adjust collision body size

    // Play laser sound
    scene.sound.play("laserSound");

    // Handle out of bounds auto-destroy
    //  this.sprite.body.onWorldBounds = true;
   

    // Set velocity for movement
    this.sprite.body.setVelocityX(velocity);
    if (up) {
        this.sprite.body.setVelocityY(-Math.abs(velocity));
      
    }

    // Check for collisions with enemies
    this.scene.physics.add.overlap(
      this.sprite,
      this.scene.enemies,
      (bullet, enemy) => {
        this.sprite.destroy();
        if (this._steerHandler) {
          this.scene.events.off("update", this._steerHandler);
          this._steerHandler = null;
        }
        if (!enemy.invincible) {
          enemy.takeDamage(this.damage);
        }
      }
    );

    this.destructionCheck = scene.time.addEvent({
      delay: 50,
      callback: function () {
        if (
          this.sprite.x >
            this.scene.cameras.main.scrollX + this.scene.cameras.main.width ||
          this.sprite.x <
            this.scene.cameras.main.scrollX - this.scene.cameras.main.width / 9
        ) {
          this.autoDeath();
        }
      },
      callbackScope: this,
      repeat: -1,
    });

    if(bigShot){
      this.sprite.setScale(1.5);
    }

    // --- Aim assist -------------------------------------------------
    // A flat-flying wave cannot touch something hovering overhead, so
    // the shot LAUNCHES toward Blubert's locked target and then makes
    // small corrections. Launch aiming matters more than homing here:
    // at 500px/s a wave crosses a 40px gap in 80ms, far too fast for
    // any believable turn rate to bend it upward in time.
    {
      const blu = scene.blubert;
      const tgt = blu && blu.trackedEnemy;
      if (tgt && tgt.active && !tgt.dead) {
        const body = this.sprite.body;
        const dx = tgt.x - this.sprite.x, dy = tgt.y - this.sprite.y;
        const dist = Math.hypot(dx, dy);
        const facing = direction === "left" || direction === -1 ? -1 : 1;
        // Only assist forward shots within a sensible range, and cap
        // the deflection so it still reads as "Jammy fired that way".
        // A target sitting almost straight overhead has no meaningful
        // "forward" side, so allow the assist regardless of sign there
        // — otherwise a hovering drone is unhittable by design.
        const forward = Math.sign(dx) === facing || Math.abs(dx) < 14;
        if (dist < 280 && dist > 4 && forward) {
          const speed = Math.hypot(body.velocity.x, body.velocity.y) || Math.abs(velocity);
          let ang = Math.atan2(dy, dx);
          const flat = facing > 0 ? 0 : Math.PI;
          let off = Phaser.Math.Angle.Wrap(ang - flat);
          off = Phaser.Math.Clamp(off, -1.48, 1.48); // ~85 degrees: near-vertical is allowed when locked
          ang = flat + off;
          body.setVelocity(Math.cos(ang) * speed, Math.sin(ang) * speed);
          this.sprite.rotation = off * facing;
          this.sprite.setFlipX(facing < 0);
        }
      }
    }

    this._steer = (delta) => {
      const b = this.scene.blubert;
      const tgt = b && b.trackedEnemy;
      if (!tgt || !tgt.active || tgt.dead || !this.sprite || !this.sprite.body) return;
      const body = this.sprite.body;
      const vx = body.velocity.x, vy = body.velocity.y;
      const speed = Math.hypot(vx, vy);
      if (speed < 1) return;
      const dx = tgt.x - this.sprite.x, dy = tgt.y - this.sprite.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 2 || dist > 320) return;
      // Forward hemisphere only — never let a shot turn back on itself
      if ((dx * vx) < 0) return;
      const cur = Math.atan2(vy, vx);
      let want = Math.atan2(dy, dx);
      let diff = Phaser.Math.Angle.Wrap(want - cur);
      const maxTurn = 6.0 * (delta / 1000); // rad/sec
      diff = Phaser.Math.Clamp(diff, -maxTurn, maxTurn);
      const na = cur + diff;
      body.setVelocity(Math.cos(na) * speed, Math.sin(na) * speed);
      this.sprite.rotation = na + (vx < 0 ? Math.PI : 0);
    };
    this._steerHandler = (t, d) => this._steer(d);
    scene.events.on("update", this._steerHandler);
  }

  autoDeath() {
    this.scene.bullets.remove(this.sprite);
    this.sprite.destroy();
    this.destructionCheck.destroy();
    if (this._steerHandler) {
      this.scene.events.off("update", this._steerHandler);
      this._steerHandler = null;
    }
  }
}
