class Jammy {
  constructor(x, y, hp, facing = "right") {
    const run = getRunState();

    this.bulletLimit = 3;
    // Hard mode: three hearts instead of five
    this.maxHP = run && run.hard ? 3 : 5;
    this.hp = Phaser.Math.Clamp(hp || (run ? run.hp : this.maxHP) || this.maxHP, 1, this.maxHP);
    this.walkSpeed = 125;
    this.invincible = false;
    this.invincibilityTime = 1000;
    this.stunTime = 400;
    this.takingDamage = false;
    this.hitDirection = 1;
    this.falling = false;
    this.jumping = false;
    this.canDoubleJump = false;
    this.jumpVelocity = -300;
    this.doubleJumpVelocity = -270;
    // Rocket Axe double-jump is unlocked from Stage 1-3; before that the
    // second jump is a plain mid-air hop.
    this.rocketAxe = !!(run && run.rocketAxe);
    // A short grace window after walking off a ledge where a jump still
    // counts, and a short buffer so a jump pressed just before landing
    // fires on touchdown — both make the controls feel far less "sticky".
    this.coyoteMs = 90;
    this.jumpBufferMs = 120;
    this.coyoteUntil = 0;
    this.jumpBufferedUntil = 0;
    this.facing = facing === "left" ? "left" : "right";
    this.antTokens = 0;

    // Weapons come from the guitar collection — each owned guitar model
    // is a weapon. The equipped guitar decides the current weapon.
    const guitarColl = getGuitarCollection();
    this.availableWeapons = guitarColl.owned.map((id) => GUITAR_CATALOG[id].weapon);
    this.currentWeapon = GUITAR_CATALOG[guitarColl.equipped].weapon;

    this.seedCooldownMs = 320;
    this.bassCooldownMs = 900;
    this.lastBassTime = 0;
    this.lastSeedTime = 0;
    this.seedAmmo = run ? Math.max(1, run.seedAmmo || 1) : 1;
    this.seedAmmoMax = 12;
    this.lastDryClickTime = 0;
    this.controlsEnabled = true;
    this.alive = true;
    this.walkingLeft = false;
    this.walkingRight = false;
    this.up = false;
    this.rocketBoostActive = false;
    this.shootingPoseActive = false;

    // Touch-screen input, written by the HUD's virtual gamepad
    this.touch = { left: false, right: false, up: false };

    this.jumpSound = scene.sound.add("jumpSound");

    this.sprite = scene.physics.add.sprite(x, y, "jammy", "resting-right2");
    this.sprite.play("resting-right");
    this.sprite.parentObject = this;
    this.sprite.body.setSize(18, 28, true);

    // --- Keyboard ---
    const kb = scene.input.keyboard;
    this.leftKeys = addKeys(kb, controls.left);
    this.rightKeys = addKeys(kb, controls.right);
    this.aimKeys = addKeys(kb, controls.aim);
    this.jumpKeys = addKeys(kb, controls.jump);
    this.shootKeys = addKeys(kb, controls.shoot);
    this.cycleKeys = addKeys(kb, controls.cycleWeapon);
    // Keep SPACE / arrows from scrolling the page
    kb.addCapture([
      Phaser.Input.Keyboard.KeyCodes.SPACE,
      Phaser.Input.Keyboard.KeyCodes.UP,
      Phaser.Input.Keyboard.KeyCodes.DOWN,
      Phaser.Input.Keyboard.KeyCodes.LEFT,
      Phaser.Input.Keyboard.KeyCodes.RIGHT,
    ]);

    onKeys(this.jumpKeys, "down", () => this.jump(), this);
    onKeys(this.shootKeys, "down", () => this.shoot(), this);
    onKeys(this.cycleKeys, "down", () => this.cycleWeapon(), this);
  }

  get x() {
    return this.sprite.x;
  }
  get y() {
    return this.sprite.y;
  }

  isGrounded() {
    const b = this.sprite.body;
    return b.blocked.down || b.touching.down;
  }

  update() {
    const body = this.sprite.body;
    if (!this.alive) {
      body.setVelocityX(0);
      return;
    }
    const now = scene.time.now;
    const grounded = this.isGrounded();

    // Fell out of the world (below the map) — count it as a pit death
    if (scene.map && this.sprite.y > scene.map.heightInPixels + 48) {
      this.instantDeath();
      return;
    }

    if (grounded) {
      this.coyoteUntil = now + this.coyoteMs;
      if (body.velocity.y >= 0) {
        this.jumping = false;
        this.falling = false;
        this.canDoubleJump = false;
      }
    } else {
      if (body.velocity.y > 0) this.falling = true;
      // Walked off a ledge: once the coyote window is gone the Rocket
      // Axe is still available, exactly as it would be after a jump.
      if (!this.jumping && now >= this.coyoteUntil && !this.rocketBoostActive) {
        this.canDoubleJump = true;
      }
    }

    // Jump pressed a hair before landing
    if (this.jumpBufferedUntil > now && grounded && this.controlsEnabled && !this.takingDamage) {
      this.jumpBufferedUntil = 0;
      this._groundJump();
    }

    // Stunned: drift away from whatever hit us and show the hurt frame
    if (this.takingDamage) {
      body.setVelocityX(this.hitDirection * 30);
      this.sprite.play(this.facing === "right" ? "taking-damage-right" : "taking-damage-left", true);
      return;
    }

    const input = this.controlsEnabled;
    const left = input && (anyKeyDown(this.leftKeys) || this.touch.left);
    const right = input && (anyKeyDown(this.rightKeys) || this.touch.right);
    this.up = input && (anyKeyDown(this.aimKeys) || this.touch.up);

    this.walkingLeft = left && !right;
    this.walkingRight = right && !left;

    // Ice: the stage says whether the tile under Jammy's feet is
    // slippery. On ice he accelerates and skids instead of stopping dead.
    const onIce =
      grounded && typeof scene.isIceAt === "function" && scene.isIceAt(this.sprite.x, body.bottom + 2);
    this.onIce = onIce;

    // Skip the walk override while the Rocket Axe is firing so the
    // boost's horizontal impulse isn't clamped back down to walkSpeed.
    if (!this.rocketBoostActive) {
      if (this.walkingLeft) this.facing = "left";
      else if (this.walkingRight) this.facing = "right";
      const target = this.walkingLeft ? -this.walkSpeed : this.walkingRight ? this.walkSpeed : 0;
      if (onIce) {
        const accel = target === 0 ? 0.03 : 0.07;
        body.setVelocityX(body.velocity.x + (target - body.velocity.x) * accel);
        if (Math.abs(body.velocity.x) < 2 && target === 0) body.setVelocityX(0);
      } else {
        body.setVelocityX(target);
      }
    }

    if (this.rocketBoostActive) return; // boost owns the sprite

    const dir = this.facing;
    if (!grounded) {
      this.sprite.play("jumping-" + dir, true);
    } else if (this.walkingLeft || this.walkingRight) {
      this.sprite.play("running-" + dir, true);
    } else if (!this.shootingPoseActive) {
      // Skidding on ice keeps the run frame until he actually stops
      if (onIce && Math.abs(body.velocity.x) > 20) this.sprite.play("running-" + dir, true);
      else this.sprite.play("resting-" + dir, true);
    }
  }

  // ---------------------------------------------------------------
  // Weapons
  // ---------------------------------------------------------------
  cycleWeapon() {
    if (!this.alive || !this.controlsEnabled) return;
    const coll = getGuitarCollection();
    if (coll.owned.length <= 1) return;
    const i = coll.owned.indexOf(coll.equipped);
    coll.equipped = coll.owned[(i + 1) % coll.owned.length];
    this.currentWeapon = GUITAR_CATALOG[coll.equipped].weapon;
    const ui = scene.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(this.currentWeapon);
    scene.sound.play("antTokenCollectSound", { volume: 0.35, rate: 1.6 });
  }

  shoot() {
    if (!this.alive || !this.controlsEnabled) return;
    if (this.currentWeapon === "seed") {
      this.fireSeed();
    } else if (this.currentWeapon === "bass") {
      this.fireBass();
    } else {
      this.fireSonic();
    }
    this.playShootingPose();
  }

  fireBass() {
    const now = scene.time.now;
    if (now - this.lastBassTime < this.bassCooldownMs) return;
    this.lastBassTime = now;
    new BassWave(scene, this.sprite.x, this.sprite.y + 8, this.facing);
    // Low rumble: pitched-down laser + a soft thump
    scene.sound.play("laserSound", { volume: 0.9, rate: 0.45 });
    scene.time.delayedCall(60, () => scene.sound.play("shortWave", { rate: 0.5, volume: 0.6 }));
    scene.cameras.main.shake(90, 0.0028);
  }

  playShootingPose() {
    // Angry standing-still-firing sprite — only while stationary
    const stationary = !this.walkingLeft && !this.walkingRight && this.isGrounded();
    if (!stationary) return;
    this.shootingPoseActive = true;
    this.sprite.play(this.facing === "right" ? "shooting-right" : "shooting-left", true);
    if (this._shootPoseTimer) this._shootPoseTimer.remove(false);
    this._shootPoseTimer = scene.time.delayedCall(320, () => {
      this.shootingPoseActive = false;
    });
  }

  fireSonic() {
    if (scene.bullets.countActive(true) >= this.bulletLimit) return;
    new AudioWave(scene, this.sprite.x, this.sprite.y + 5, this.facing, this.up, this.bigShot);
    if (this.bigShot) {
      this.bigShot = false;
      this.sprite.clearTint();
      this.sprite.setPipeline("Electric");
      scene.time.delayedCall(500, () => {
        if (this.sprite && this.sprite.active) this.sprite.resetPipeline();
      });
    }
  }

  fireSeed() {
    const now = scene.time.now;
    if (now - this.lastSeedTime < this.seedCooldownMs) return;
    if (this.seedAmmo <= 0) {
      // Dry-fire click — throttled so it doesn't machine-gun
      if (now - this.lastDryClickTime > 180) {
        this.lastDryClickTime = now;
        scene.sound.play("enemyHitSound", { volume: 0.1, rate: 0.35 });
      }
      return;
    }
    this.lastSeedTime = now;
    this.seedAmmo -= 1;
    const spawnX = this.facing === "right" ? this.sprite.x + 8 : this.sprite.x - 8;
    new SeedOfDestruction(scene, spawnX, this.sprite.y, this.facing, this.up);
    if (SeedOfDestruction.playFireSound) SeedOfDestruction.playFireSound(scene);
    const ui = scene.scene.get("UIScene");
    if (ui && ui.setSeedAmmo) ui.setSeedAmmo(this.seedAmmo);
  }

  addSeedAmmo(n) {
    this.seedAmmo = Math.min(this.seedAmmoMax, this.seedAmmo + n);
    const ui = scene.scene.get("UIScene");
    if (ui && ui.setSeedAmmo) ui.setSeedAmmo(this.seedAmmo);
  }

  // ---------------------------------------------------------------
  // Movement
  // ---------------------------------------------------------------
  jump() {
    if (!this.alive || !this.controlsEnabled || this.takingDamage) return;
    const now = scene.time.now;
    const grounded = this.isGrounded();
    if ((grounded || now < this.coyoteUntil) && !this.jumping) {
      this._groundJump();
    } else if (this.canDoubleJump && !this.rocketBoostActive) {
      this.canDoubleJump = false;
      if (this.rocketAxe) {
        // Rocket Axe — Jammy kicks off his guitar and the boosters fire,
        // propelling him up and forward in a long arc.
        this._rocketAxeBoost();
      } else {
        this._doubleJump();
      }
    } else if (!grounded) {
      this.jumpBufferedUntil = now + this.jumpBufferMs;
    }
  }

  _groundJump() {
    this.sprite.body.setVelocityY(this.jumpVelocity);
    this.jumping = true;
    this.falling = false;
    this.coyoteUntil = 0;
    this.canDoubleJump = true;
    if (!this.jumpSound.isPlaying) this.jumpSound.play();
    this.sprite.play(this.facing === "right" ? "jumping-right" : "jumping-left", true);
  }

  _doubleJump() {
    this.sprite.body.setVelocityY(this.doubleJumpVelocity);
    this.jumping = true;
    this.falling = false;
    this.sprite.play(this.facing === "right" ? "jumping-right" : "jumping-left", true);
    scene.sound.play("jumpSound", { rate: 1.25, volume: 0.9 });
    // Little dust ring under his feet so the second jump reads
    const ring = scene.add.circle(this.sprite.x, this.sprite.y + 12, 6, 0xffffff, 0.6);
    ring.setDepth(99);
    scene.tweens.add({
      targets: ring,
      scaleX: 2.2,
      scaleY: 0.6,
      alpha: 0,
      duration: 220,
      onComplete: () => ring.destroy(),
    });
  }

  _rocketAxeBoost() {
    const dirX = this.facing === "right" ? 1 : -1;
    this.sprite.body.setVelocity(dirX * 300, -560);
    this.jumping = true;
    this.falling = false;
    this.rocketBoostActive = true;

    const s = scene;
    const boostMs = 520;

    // Swap Jammy's sprite to the hand-composited rocket-axe atlas
    // (body + guitar-under-feet + flame).
    this.sprite.setTexture("jammy-rocketaxe", "rocketaxe-right1");
    this.sprite.setFlipX(dirX === -1);
    this.sprite.play("jammy-rocketaxe-right", true);

    // Launch sfx
    s.sound.play("laserSound", { volume: 1.0, rate: 0.55 });
    s.time.delayedCall(70, () => s.sound.play("shortExplosion", { volume: 0.55, rate: 0.9 }));

    // Exhaust puffs trailing behind the guitar
    this._rocketPuffTimer = s.time.addEvent({
      delay: 45,
      repeat: Math.floor(boostMs / 45),
      callback: () => {
        if (!this.sprite || !this.sprite.active) return;
        const puff = s.add.circle(
          this.sprite.x - dirX * 10 + Phaser.Math.Between(-3, 3),
          this.sprite.y + 16,
          2 + Math.random() * 2,
          Math.random() < 0.5 ? 0xffb347 : 0xff6a3d,
          0.9
        );
        puff.setDepth(99);
        s.tweens.add({
          targets: puff,
          y: puff.y + 10,
          alpha: 0,
          scale: 1.8,
          duration: 260,
          onComplete: () => puff.destroy(),
        });
      },
    });

    // Revert sprite at boost end
    if (this._rocketEndTimer) this._rocketEndTimer.remove(false);
    this._rocketEndTimer = s.time.delayedCall(boostMs, () => this._endRocketBoost());
  }

  _endRocketBoost() {
    if (!this.rocketBoostActive) return;
    this.rocketBoostActive = false;
    if (this._rocketPuffTimer) this._rocketPuffTimer.remove(false);
    if (!this.sprite || !this.sprite.active || !this.alive) return;
    this.sprite.setFlipX(false);
    this.sprite.play(this.isGrounded() ? "resting-" + this.facing : "jumping-" + this.facing, true);
  }

  // ---------------------------------------------------------------
  // Health
  // ---------------------------------------------------------------
  powerUp(type, val = 0) {
    switch (type) {
      case "heal":
        this.hp = Math.min(this.maxHP, this.hp + val);
        break;
      case "bigShot":
        this.bigShot = true;
        this.sprite.setTint(0x0000f5);
        this.sprite.setPipeline("Electric2");
        break;
    }
    scene.sound.play("powerUpSound");
  }

  // sourceX (optional): world x of whatever hurt Jammy, so the knockback
  // pushes him away from it.
  takeDamage(sourceX) {
    if (!this.alive || this.invincible) return;
    this.hp--;
    if (typeof sourceX === "number") {
      this.hitDirection = sourceX > this.sprite.x ? -1 : 1;
    } else {
      this.hitDirection = this.facing === "right" ? -1 : 1;
    }

    // Blubert feels it too — companion flashes/recoils in sympathy
    if (scene.blubert && scene.blubert.takeSympathyDamage) {
      scene.blubert.takeSympathyDamage();
    }

    this._endRocketBoost();
    const uiHit = scene.scene.get("UIScene");
    if (uiHit && uiHit.resetCombo) uiHit.resetCombo(true);
    this.takingDamage = true;
    this.controlsEnabled = false;
    this.invincible = true;
    this.shootingPoseActive = false;
    if (this.isGrounded()) this.sprite.body.setVelocityY(-90);
    this.flashOnce();

    const t = scene.time;
    if (this._stunTimer) this._stunTimer.remove(false);
    this._stunTimer = t.delayedCall(this.stunTime, () => {
      this.takingDamage = false;
      if (this.hp <= 0) {
        this.die();
      } else if (this.alive) {
        this.controlsEnabled = true;
      }
    });
    if (this._invTimer) this._invTimer.remove(false);
    this._invTimer = t.delayedCall(this.invincibilityTime, () => this.restoreVulnerability());
    if (this.invincibilityLoop) this.invincibilityLoop.remove(false);
    this.invincibilityLoop = t.addEvent({
      delay: 80,
      loop: true,
      callback: () => {
        if (this.sprite && this.sprite.active) this.sprite.alpha = this.sprite.alpha < 1 ? 1 : 0.35;
      },
    });
    scene.sound.play("jammyTakeDamageSound");
    scene.cameras.main.shake(80, 0.004);
  }

  // Flash red when taking damage
  flashOnce(tint) {
    this.sprite.setTint(tint ? tint : 0xff0000);
    scene.time.delayedCall(60, () => this.removeTint());
  }

  restoreAlpha() {
    if (this.sprite) this.sprite.alpha = 1;
  }

  removeTint() {
    if (!this.sprite || !this.sprite.active) return;
    // Keep the bigShot charge colour if it's still armed
    if (this.bigShot) this.sprite.setTint(0x0000f5);
    else this.sprite.clearTint();
  }

  restoreVulnerability() {
    if (this.invincibilityLoop) {
      this.invincibilityLoop.remove(false);
      this.invincibilityLoop = null;
    }
    this.restoreAlpha();
    this.removeTint();
    this.invincible = false;
  }

  die() {
    if (!this.alive) return;
    this.alive = false;
    this.controlsEnabled = false;
    this.takingDamage = false;
    this._endRocketBoost();
    if (this.invincibilityLoop) this.invincibilityLoop.remove(false);
    this.restoreAlpha();
    this.sprite.clearTint();
    this.sprite.resetPipeline();

    const s = scene;
    s.sound.stopAll();
    s.sound.play("jammyDeathSound");

    // Dying means a fresh start for the stage: full health
    const run = getRunState();
    if (run) {
      run.hp = this.maxHP;
      run.deaths = (run.deaths || 0) + 1;
    }

    // Lie down and stop interacting with things
    this.sprite.body.setVelocity(0, 0);
    this.sprite.body.setSize(16, 12, true);
    this.sprite.body.checkCollision.none = false;
    this.sprite.play(this.facing === "right" ? "dead-right" : "dead-left");

    // Fade and restart the stage after a short pause
    // A stage that is already ending (e.g. the boss fell to Jammy's
    // last shot as he went down) wins over the restart.
    s.time.delayedCall(900, () => {
      if (!s._changing) s.cameras.main.fadeOut(500, 0, 0, 0);
    });
    s.time.delayedCall(1400, () => {
      if (!s._changing) s.scene.restart();
    });
  }

  instantDeath() {
    if (!this.alive) return;
    this.hp = 0;
    this.die();
  }
}
