class Jammy {
  constructor(x, y, hp = 5, facing = "right") {
    this.bulletLimit = 3;
    this.maxHP = 5;
    this.hp = hp ? hp : this.maxHP;
    this.walkSpeed = 125;
    this.invincible = false;
    this.invincibiltyTime = 500;
    this.takingDamage = false;
    this.hitDirection;
    this.hitHisHead = false;
    this.canAttack = true;
    this.falling = false;
    this.jumping = false;
    this.canDoubleJump = false;
    this.canJump = false;
    this.jumpTimer = 0;
    this.jumpHoldTime = 160;
    this.jumpVelocity = -300;
    this.facing = facing ? facing : "right";
    this.antTokens = 0;
    // Weapons come from the guitar collection — each owned guitar
    // model is a weapon. Equipped guitar decides the current weapon.
    const guitarColl =
      typeof getGuitarCollection === "function" ? getGuitarCollection() : null;
    if (guitarColl && typeof GUITAR_CATALOG !== "undefined") {
      this.availableWeapons = guitarColl.owned.map(
        (id) => GUITAR_CATALOG[id].weapon
      );
      this.currentWeapon = GUITAR_CATALOG[guitarColl.equipped].weapon;
    } else {
      this.currentWeapon = "sonic";
      this.availableWeapons = ["sonic"];
    }
    this.seedCooldownMs = 320;
    this.bassCooldownMs = 900;
    this.lastBassTime = 0;
    this.lastSeedTime = 0;
    this.seedAmmo = 1;
    this.seedAmmoMax = 12;
    this.lastDryClickTime = 0;
    this.controlsEnabled = true;
    this.alive = true;
    this.walkingLeft = false;
    this.walkingRight = false;
    this.wasWalking = false;
    this.jumpSound = scene.sound.add("jumpSound");
    this.leftIsDown = false;
    this.rightIsDown = false;
    this.up = false;

    this.gamepad = new VirtualGamepad(scene);

    this.sprite = scene.physics.add.sprite(x, y, "jammy", "resting-right2");

    this.sprite.play("resting-right");
    this.sprite.parentObject = this;

    // Set some physics for Jammy

    //this.sprite.body.collideWorldBounds = true;

    // Set collision body size
    this.sprite.body.setSize(18, 28);

    // Add attack button
    this.attackButton = scene.input.keyboard.addKey(controls.shoot);
    //this.attackButton.onDown.add(this.fireAudioWave, this);

    // Add jump button

    this.leftButton = scene.input.keyboard.addKey(controls.left);
    this.rightButton = scene.input.keyboard.addKey(controls.right);
    this.jumpButton = scene.input.keyboard.addKey(controls.jump);
    this.aimButton = scene.input.keyboard.addKey(controls.aim);
    this.secondaryAimButton = scene.input.keyboard.addKey(
      controls.secondaryAim
    );
this.secondaryShootButton = scene.input.keyboard.addKey(controls.secondaryShoot);
    scene.input.keyboard.addCapture(controls.cycleWeapon);
    this.cycleWeaponButton = scene.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes[controls.cycleWeapon] || controls.cycleWeapon
    );
    this.cycleWeaponButton.on(
      "down",
      function () {
        if (!this.alive || !this.controlsEnabled) return;
        // Cycle through the owned guitars in the collection
        if (typeof getGuitarCollection === "function" && typeof GUITAR_CATALOG !== "undefined") {
          const coll = getGuitarCollection();
          if (coll.owned.length <= 1) return;
          const i = coll.owned.indexOf(coll.equipped);
          coll.equipped = coll.owned[(i + 1) % coll.owned.length];
          this.currentWeapon = GUITAR_CATALOG[coll.equipped].weapon;
        } else {
          if (this.availableWeapons.length <= 1) return;
          const i = this.availableWeapons.indexOf(this.currentWeapon);
          this.currentWeapon = this.availableWeapons[(i + 1) % this.availableWeapons.length];
        }
        const ui = scene.scene.get("UIScene");
        if (ui && ui.setWeapon) ui.setWeapon(this.currentWeapon);
      },
      this
    );
    this.aimButton.on(
      "down",
      function () {
        this.up = true;
      },
      this
    );

    this.aimButton.on(
      "up",
      function () {
        this.up = false;
      },
      this
    );

    this.secondaryAimButton.on(
      "down",
      function () {
        this.up = true;
      },
      this
    );

    this.secondaryAimButton.on(
      "up",

      function () {
        this.up = false;
      },
      this
    );

    this.leftButton.on(
      "down",
      function (event) {
        if (this.alive) {
          this.leftIsDown = true;
          this.walkingLeft = true;

          this.facing = "left";

          this.move(this.facing);
        }
      },
      this
    );

    this.rightButton.on(
      "down",
      function (event) {
        if (this.alive) {
          this.rightIsDown = true;
          this.walkingRight = true;
          this.facing = "right";
          this.move(this.facing);
        }
      },
      this
    );

    this.leftButton.on(
      "up",
      function (event) {
        this.leftIsDown = false;
        this.walkingLeft = false;
        this.wasWalking = false;
        if (!this.jumping && !this.falling) {
          this.rest();
        }
      },
      this
    );

    this.rightButton.on(
      "up",
      function (event) {
        this.rightIsDown = false;
        this.walkingRight = false;
        this.wasWalking = false;
        if (!this.jumping && !this.falling) {
          this.rest();
        }
      },
      this
    );

    this.jumpButton.on(
      "down",
      function (event) {
        if (this.alive) {
          this.jump();
        }
      },
      this
    );

    this.attackButton.on(
      "down",
      function () {
        if (this.alive) {
          this.shoot();
        }
      },
      this
    );

  

    this.attackButton.on("up", function () {}, this);

    this.secondaryShootButton.on(
      "down",
      function () {
        if (this.alive) {
          this.shoot();
        }
      },
      this
    );

    this.secondaryShootButton.on("up", function () { }, this);
    


    this.gamepad.gamepad.touchCursor.cursorKeys.up.on(
      "down",
      function (event) {
        this.aimButton.emit("down");
      },
      this
    );

    this.gamepad.gamepad.touchCursor.cursorKeys.up.on(
      "up",
      function (event) {
        this.aimButton.emit("up");
      },
      this
    );

    this.gamepad.gamepad.touchCursor.cursorKeys.left.on(
      "down",
      function (event) {
        this.leftButton.emit("down");
      },
      this
    );

    this.gamepad.gamepad.touchCursor.cursorKeys.right.on(
      "down",
      function (event) {
        this.rightButton.emit("down");
      },
      this
    );

    this.gamepad.gamepad.touchCursor.cursorKeys.left.on(
      "up",
      function (event) {
        this.leftButton.emit("up");
      },
      this
    );

    this.gamepad.gamepad.touchCursor.cursorKeys.right.on(
      "up",
      function (event) {
        this.rightButton.emit("up");
      },
      this
    );

    this.gamepad.gamepad.touchCursor.cursorKeys.up.on(
      "up",
      function (event) {
        this.up = false;
      },
      this
    );
    this.gamepad.xButton.on(
      "pointerdown",
      function () {
        this.jumpButton.emit("down");
      },
      this
    );

    this.gamepad.xButton.on(
      "pointerup",
      function () {
        this.jumpButton.emit("up");
      },
      this
    );

    this.gamepad.zButton.on(
      "pointerdown",
      function () {
        this.attackButton.emit("down");
      },
      this
    );

    this.gamepad.zButton.on(
      "pointerup",
      function () {
        this.attackButton.emit("up");
      },
      this
    );
    scene.input.addPointer(3);
  }

  update() {
    if (this.alive) {
      // Skip left/right walk override while the Rocket Axe is firing so
      // the boost's 300px/s horizontal impulse isn't clamped back down
      // to walkSpeed on the very next frame when Jammy is running.
      if (!this.rocketBoostActive) {
        if(this.leftIsDown){this.sprite.body.setVelocityX(-this.walkSpeed);}
        if(this.rightIsDown){this.sprite.body.setVelocityX(this.walkSpeed);}
      }
      if (
        !this.falling &&
        !this.jumping &&
        !this.walkingLeft &&
        !this.walkingRight &&
        !this.wasWalking &&
        !this.shootingPoseActive &&
        (this.sprite.body.touching.down || this.sprite.body.blocked.down)
      ) {
        this.rest();
      } else {
        if (
          (this.sprite.body.touching.down || this.sprite.body.blocked.down) &&
          (this.leftIsDown || this.rightIsDown)
        ) {
          this.move(this.facing);
        }
      }

      if (
        (this.sprite.body.touching.down || this.sprite.body.blocked.down) &&
        this.sprite.body.velocity.y >= 0
      ) {
        this.canDoubleJump = false;
        this.jumping = false;
        this.falling = false;
      }

      // Disable controls when taking damage and move Jammy slowly in
      // direction of damage taken
      if (this.takingDamage) {
        this.controlsEnabled = false;

        // Move Jammy slowly
        var movement = this.hitDirection == 1 ? -10 : 10;
        this.sprite.body.velocity.x = movement;

        // Play damage animation
        if (this.facing == "right") {
          this.sprite.play("taking-damage-right");
        } else {
          this.sprite.play("taking-damage-left");
        }
      }

      // Controls
    }
    else {
      this.sprite.body.setVelocityX(0);
    }

  }
  shoot() {
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
    if (scene.cache.audio.exists("laserSound")) {
      scene.sound.play("laserSound", { volume: 0.9, rate: 0.45 });
    }
    if (scene.cache.audio.exists("shortWave")) {
      scene.time.delayedCall(60, () => scene.sound.play("shortWave", { rate: 0.5, volume: 0.6 }));
    }
    scene.cameras.main.shake(90, 0.0028);
  }

  playShootingPose() {
    // Angry standing-still-firing sprite — only while stationary
    const stationary =
      !this.walkingLeft &&
      !this.walkingRight &&
      !this.jumping &&
      !this.falling &&
      (this.sprite.body.touching.down || this.sprite.body.blocked.down);
    if (!stationary) return;
    const anim = this.facing === "right" ? "shooting-right" : "shooting-left";
    this.shootingPoseActive = true;
    this.sprite.play(anim, true);
    // Up-aim needs its own sprite frame to look right — the atlas
    // doesn't have one yet, so no tilt. Left as-is until we have
    // shooting-up-right/left frames in jammy.json.
    if (this._shootPoseTimer) this._shootPoseTimer.remove(false);
    this._shootPoseTimer = scene.time.delayedCall(320, () => {
      this.shootingPoseActive = false;
      if (!this.alive) return;
      if (
        !this.walkingLeft &&
        !this.walkingRight &&
        !this.jumping &&
        !this.falling
      ) {
        this.rest();
      }
    });
  }

  fireSonic() {
    if (scene.bullets.getChildren().length < this.bulletLimit) {
      if (this.facing == "right") {
        let audiowave = new AudioWave(
          scene,
          this.sprite.x,
          this.sprite.y + 5,
          this.facing,
          this.up,
          this.bigShot
        );
      } else {
        let audiowave = new AudioWave(
          scene,
          this.sprite.x - this.sprite.width,
          this.sprite.y + 5,
          this.facing,
          this.up,
          this.bigShot
        );
      }
    }
    if (this.bigShot) {
      this.bigShot = false;
      this.sprite.setTint(0xffffff);
      this.sprite.setPipeline("Electric");
      scene.time.delayedCall(
        500,
        function () {
          this.sprite.resetPipeline();
        },
        [],
        this
      );
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

  move(direction) {
    if (this.alive) {
      if (direction == "right") {
        this.walkingRight = true;
      } else {
        this.walkingLeft = true;
      }
      this.wasWalking = true;
      if (direction == "right") {
        this.sprite.body.velocity.x = this.walkSpeed;
        this.sprite.body.setSize(18, 28, 8, 4);

        this.sprite.play("running-right", true);
      } else if (direction == "left") {
        this.sprite.body.velocity.x = -this.walkSpeed;
        this.sprite.body.setSize(18, 28, 8, 4);

        this.sprite.play("running-left", true);
      }
    }
  }

  rest() {
    if (this.alive) {
      if (!this.leftIsDown && !this.rightIsDown) {
        this.sprite.body.velocity.x = 0;
      }
      if (this.facing == "right") {
        this.sprite.play("resting-right", true);
        this.sprite.body.setSize(18, 28, 8, 4);
      } else {
        this.sprite.play("resting-left", true);
        this.sprite.body.setSize(18, 28, 8, 4);
      }
    }
  }

  jump() {
    if (
      (this.sprite.body.touching.down || this.sprite.body.blocked.down) &&
      !this.canDoubleJump
    ) {
      this.sprite.body.velocity.y = this.jumpVelocity;
      this.jumping = true;
      this.falling = false;
      this.walkingLeft = false;
      this.walkingRight = false;
      if (!this.jumpSound.isPlaying) {
        // Prevent rapid jump sounds
        this.jumpSound.play();
      }

      this.canDoubleJump = true;
    } else if (this.canDoubleJump) {
      // Rocket Axe — Jammy kicks off his guitar and the boosters
      // fire, propelling him up and forward in a long arc.
      this._rocketAxeBoost();
      this.canDoubleJump = false;
      return; // _rocketAxeBoost owns the texture + animation during the boost
    }
    if (this.facing == "right") {
      this.sprite.play("jumping-right", true);
    } else {
      this.sprite.play("jumping-left", true);
    }
  }

  _rocketAxeBoost() {
    const dirX = this.facing === "right" ? 1 : -1;
    this.sprite.body.velocity.y = -560;
    this.sprite.body.velocity.x = dirX * 300;
    this.jumping = true;
    this.falling = false;
    this.rocketBoostActive = true;

    const s = scene;
    const boostMs = 520;

    // Swap Jammy's sprite to the hand-composited rocket-axe atlas
    // (body + guitar-under-feet + flame). Original frames are 32x32,
    // this one is 40x50, so we remember the original body size and
    // restore it on boost end.
    if (!this._rocketOrigBody) {
      this._rocketOrigBody = {
        w: this.sprite.body.width,
        h: this.sprite.body.height,
        ox: this.sprite.body.offset.x,
        oy: this.sprite.body.offset.y,
      };
    }
    this.sprite.setTexture("jammy-rocketaxe", "rocketaxe-right1");
    this.sprite.setFlipX(dirX === -1);
    this.sprite.play("jammy-rocketaxe-right", true);

    // Launch sfx
    if (s.cache.audio.exists("laserSound")) {
      s.sound.play("laserSound", { volume: 1.0, rate: 0.55 });
    }
    if (s.cache.audio.exists("shortExplosion")) {
      s.time.delayedCall(70, () => {
        if (s.cache && s.cache.audio.exists("shortExplosion")) {
          s.sound.play("shortExplosion", { volume: 0.55, rate: 0.9 });
        }
      });
    }

    // Revert sprite at boost end
    if (this._rocketEndTimer) this._rocketEndTimer.remove(false);
    this._rocketEndTimer = s.time.delayedCall(boostMs, () => {
      this.rocketBoostActive = false;
      if (!this.sprite || !this.sprite.active) return;
      this.sprite.setFlipX(false);
      if (this.facing === "right") this.sprite.play("resting-right", true);
      else this.sprite.play("resting-left", true);
    });
  }

  powerUp(type, val = 0) {
    switch (type) {
      case "heal":
        this.hp += val;
        if (this.hp > this.maxHP) {
          this.hp = this.maxHP;
        }
        break;
      case "bigShot":
        this.bigShot = true;
        this.sprite.setTint(0x0000f5);
        this.sprite.setPipeline("Electric2");
        break;
    }
    // Play power up sound
    scene.sound.play("powerUpSound");
  }

  takeDamage() {
    if (this.alive && !this.invincible) {
      this.controlsEnabled = false;
      this.hp--;

      // Blubert feels it too — companion flashes/recoils in sympathy
      if (scene.blubert && scene.blubert.takeSympathyDamage) {
        scene.blubert.takeSympathyDamage();
      }

      this.takingDamage = true;
      this.flashOnce();
      this.invincible = true;
      this.sprite.scene.time.addEvent({
        delay: this.invincibiltyTime,
        callback: this.restoreVulnerability,
        callbackScope: this,
      }); // Invicibility delay
      this.sprite.scene.time.addEvent({
        delay: 500,
        callback: function () {
          this.takingDamage = false;
          this.controlsEnabled = true;
          if (this.hp <= 0) {
            this.die();
          }
        },
        callbackScope: this,
      });
      this.invincibilityLoop = this.sprite.scene.time.addEvent({
        delay: 100,
        callback: this.blinkInvincible,
        callbackScope: this,
      });
      this.sprite.scene.sound.play("jammyTakeDamageSound");
    }
  }

  // Flash Red when taking damage
  flashOnce(tint) {
    this.sprite.tint = tint ? tint : 0xff0000;
    this.sprite.scene.time.addEvent({
      delay: 50,
      callback: function () {
        this.restoreAlpha();
        this.removeTint();
      },
      callbackScope: this,
    });
  }

  // Blink to show invincibility
  blinkInvincible() {
    this.sprite.alpha = 0;
    this.sprite.scene.time.addEvent({
      delay: 25,
      callback: this.restoreAlpha,
      callbackScope: this,
    });
  }

  restoreAlpha() {
    this.sprite.alpha = 1;
  }

  removeTint() {
    this.sprite.tint = 0xffffff;
  }

  restoreVulnerability() {
    this.restoreAlpha();
    this.removeTint();
    this.invincible = false;
    this.takingDamage = false;
  }

  die = function () {
    // Make sure user cannot move
    this.controlsEnabled = false;

    // Stop the music

    this.sprite.scene.sound.stopAll();

    // Clear persisting Jammy Data
    this.sprite.scene.jammyData = null;

    // Kill Jammy and show death animation
    this.alive = false;

    // Play death sound
    this.sprite.scene.sound.play("jammyDeathSound");
    this.sprite.body.setSize(this.sprite.width / 6, this.sprite.width / 6);
    if (this.facing == "right") {
      this.sprite.play("dead-right");
    } else {
      this.sprite.play("dead-left");
    }
    // Reset scene after short delay
    this.sprite.scene.time.addEvent({
      delay: 1000,
      callback: function () {
        //this.destroy();
        this.sprite.scene.scene.restart();
      },
      callbackScope: this,
    });
  };

  instantDeath() {
    this.hp = 0;
    this.die();
  }
}
