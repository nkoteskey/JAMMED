class WatermelonBoss extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "watermelon-boss");
    this.score = 5000;
    // Add to the scene
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.alive = true;
    this.dead = false;
    // Set basic character properties
    this.maxHP = 60;
    this.hp = this.maxHP;
    this.walkSpeed = 15;
    this.isBouncing = false;
    this.bouncingXSpeed = 230;
    this.bounceVelocity = 600;
    this.facing = -1;
    this.takingDamage = false;
    this.invincible = false;
    this.invincibilityTime = 50;
    this.attacking = false;
    this.firingSeeds = false;
    this.nextActionCountdown = 180; // 3-second countdown


    // Physics and body setup
    this.body.setBounce(0);
    this.body.setGravityY(900);
    this.body.setImmovable(true);
    this.body.setSize(49, 110);
    this.setCollideWorldBounds(true);

    // Animations
    this.createAnimations(scene);
    this.play("watermelon-resting-left");

    // Add to enemies group
    scene.enemies.add(this);
    // Short intro before the first attack so the stage card can be read
    this.actionTimer = scene.time.addEvent({
      delay: 500,
      startAt: -1500,
      callback: function () {
        this.faceJammy();
        this.swapAction();
      },
      callbackScope: this,
      repeat: -1,
    });
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (this.actionTimer) this.actionTimer.remove(false);
      if (this.bounceLoop) this.bounceLoop.remove(false);
      if (this.invincibilityLoop) this.invincibilityLoop.remove(false);
    });

    this.on(
      "fire",
      function () {
        if(this.alive){
        const velocity = this.facing === -1 ? -400 : 400;
        const seedYPlacements = [8, 32, 8, 32];
        const seedDelay = 500;

        seedYPlacements.forEach((yOffset, index) => {
          this.scene.time.delayedCall(seedDelay * index, () => {
            new WatermelonSeed(
              this.scene,
              this.x,
              this.y + yOffset,
              velocity,
              0
            );
          });
        });
        this.scene.time.delayedCall(2000, () => {
          if (this.alive) {
            this.attacking = false;
            this.firingSeeds = false;
            this.faceJammy();
            this.rest();
          }
        });
      }},
      this
    );

    this.on("animationcomplete-firing-seeds-left", () => {
      this.emit("fire");
    });
    this.on("animationcomplete-firing-seeds-right", () => {
      this.emit("fire");
    });
  }

  createAnimations(scene) {
    const animConfig = [
      {
        key: "watermelon-resting-left",
        frames: { prefix: "resting-left", start: 1, end: 4 },
        frameRate: 4,
        repeat: -1,
      },
      {
        key: "watermelon-resting-right",
        frames: { prefix: "resting-right", start: 1, end: 4 },
        frameRate: 4,
        repeat: -1,
      },
      {
        key: "walking-left",
        frames: { prefix: "walking-left", start: 1, end: 4 },
        frameRate: 4,
        repeat: -1,
      },
      {
        key: "walking-right",
        frames: { prefix: "walking-right", start: 1, end: 4 },
        frameRate: 4,
        repeat: -1,
      },
      {
        key: "bouncing-left",
        frames: { prefix: "bouncing-left", start: 1, end: 3 },
        frameRate: 4,
        repeat: 0,
      },
      {
        key: "bouncing-right",
        frames: { prefix: "bouncing-right", start: 1, end: 3 },
        frameRate: 4,
        repeat: 0,
      },
      {
        key: "firing-seeds-left",
        frames: { prefix: "firing-seeds-left", start: 1, end: 4 },
        frameRate: 20,
        repeat: 0,
      },
      {
        key: "firing-seeds-right",
        frames: { prefix: "firing-seeds-right", start: 1, end: 4 },
        frameRate: 20,
        repeat: 0,
      },
      {
        key: "dead",
        frames: { prefix: "dead", start: 1, end: 1 },
        frameRate: 1,
        repeat: 0,
      },
    ];

    animConfig.forEach(({ key, frames, frameRate, repeat }) => {
      if (scene.anims.exists(key)) return;
      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNames("watermelon-boss", frames),
        frameRate,
        repeat,
      });
    });
  }

  rest() {
    if(!this.alive) return;
    this.body.setVelocityX(0);
    this.play(
      this.facing === -1
        ? "watermelon-resting-left"
        : "watermelon-resting-right"
    );
    this.body.setSize(49, 110);
  }

  fireSeeds() {
    if (!this.attacking && !this.isBouncing &&this.alive) {
      this.attacking = true;
      this.firingSeeds = true;
      this.play(
        this.facing === -1 ? "firing-seeds-left" : "firing-seeds-right"
      );
      this.body.setSize(49, 110);
    }
  }

  bounceAround() {
    if (!this.isBouncing && this.alive) {
      if (this.bounceLoop) {
        this.bounceLoop.destroy();
      }
      if (!this.firingSeeds) {
        this.isBouncing = true;
        this.play(this.facing === -1 ? "bouncing-left" : "bouncing-right");
        this.body.setCircle(24, 16, 48);

        this.bounceLoop = this.scene.time.addEvent({
          delay: 100,
          callback: () => {
        
            if (this.body.onFloor()){
              this.faceJammy();
              this.play(this.facing === -1 ? "bouncing-left" : "bouncing-right");
              this.body.setVelocityY(-this.bounceVelocity);
            this.body.setVelocityX(this.facing===-1 ? -this.bouncingXSpeed : this.bouncingXSpeed);}
          },
          loop: true,
        });

        this.scene.time.delayedCall(4000, () => {
          this.bounceLoop.destroy();
          this.isBouncing = false;
          this.faceJammy();
          this.rest();
        });
      }
    }
  }

  swapAction() {
if(this.alive){    
    this.faceJammy();
    const selectedAction = Phaser.Math.Between(1, 2);
    if (selectedAction === 1) {
      this.firingSeeds = true;
      this.fireSeeds();
    }
    if (selectedAction === 2) {
      this.bounceAround();
    }}
  }

  faceJammy() {
    if (this.scene.jammy) {
      this.facing = this.x > this.scene.jammy.sprite.x ? -1 : 1;
    }
  }

  takeDamage(val = 1) {
    if (!this.alive || this.invincible) return;
    this.hp -= Math.max(1, val || 1);
    this.takingDamage = true;
    this.flashOnce();
    this.invincible = true;

    this.scene.time.delayedCall(
      this.invincibilityTime,
      this.restoreVulnerability,
      null,
      this
    );
    this.scene.time.delayedCall(
      this.invincibilityTime,
      this.toggleTakingDamage,
      null,
      this
    );

    this.invincibilityLoop = this.scene.time.addEvent({
      delay: 100,
      callback: this.blinkInvincible,
      callbackScope: this,
      loop: true,
    });

    this.scene.sound.play("enemyHitSound");
    if(this.hp<=0){
      this.die();
    }
  }

  flashOnce() {
    this.setTint(0xff0000);
    this.scene.time.delayedCall(50, () => {
      this.clearTint();
    });
  }

  blinkInvincible() {
    this.setAlpha(this.alpha === 1 ? 0 : 1);
  }

  restoreVulnerability() {
    if (this.invincibilityLoop) this.invincibilityLoop.remove();
    this.setAlpha(1);
    this.clearTint();
    this.invincible = false;
    this.takingDamage = false;
  }

  toggleTakingDamage() {
    this.takingDamage = !this.takingDamage;
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.alive = false;
    this.invincible = true;

    scene.scene.get("UIScene").setScore(this.score);

//check for any timers and remove them

    if (this.actionTimer) {
      this.actionTimer.destroy();
    }
    if (this.bounceLoop) {
      this.bounceLoop.destroy();
    }
    if (this.invincibilityLoop) {
      this.invincibilityLoop.destroy();
    }


    const deathAnimationLocations = [
      { x: this.x, y: this.y },
      { x: this.x + 16, y: this.y + 16 },
      { x: this.x + 16, y: this.y - 16 },
      { x: this.x - 16, y: this.y - 16 },
      { x: this.x - 16, y: this.y + 16 },
    ];

    deathAnimationLocations.forEach(({ x, y }) => {
      new EnemyDeath(this.scene, x, y);
    });

    this.body.setVelocity(0);
    this.setAlpha(1);
    this.clearTint();
    this.play("dead");
    this.body.setSize(this.frame.width, this.frame.height);
    this.body.setImmovable(true);

    this.scene.sound.stopByKey("BossBattle");
    this.scene.sound.play("bossDeathSound");
    this.scene.cameras.main.shake(400, 0.01);
    if (this.scene.bossDefeated) this.scene.bossDefeated();
  }
}
