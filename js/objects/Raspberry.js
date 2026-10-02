class Raspberry extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "raspberry");
    this.score = 750;
    // Add Raspberry to the scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Basic character properties
    this.hp = 3;
    this.runningSpeed = 70;
    this.walkSpeed = 30;
    this.roaming = true;
    this.facing = -1;
    this.takingDamage = false;
    this.invincible = false;
    this.invincibilityTime = 50;
    this.inPursuit = false;
    this.chaseDistance = 150;
    this.awareDistance = 200;
    this.attacking = false;
    this.attackDelay = 2000; // 2 seconds
    this.attackDistance = 65;
    this.dead = false;
    this.jammyInRange = false;

    // Physics settings
    this.body.setBounce(0);
    this.body.setAllowGravity(true);
    this.body.setSize(14, 30);

    // Animations (local to this sprite)
    this.anims.create({
      key: "resting-right",
      frames: [{ key: "raspberry", frame: "resting-right1" }],
      frameRate: 4,
      repeat: -1,
    });
    this.anims.create({
      key: "resting-left",
      frames: [{ key: "raspberry", frame: "resting-left1" }],
      frameRate: 4,
      repeat: -1,
    });
    this.anims.create({
      key: "walking-right",
      frames: this.anims.generateFrameNames("raspberry", {
        prefix: "walking-right",
        start: 1,
        end: 4,
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "walking-left",
      frames: this.anims.generateFrameNames("raspberry", {
        prefix: "walking-left",
        start: 1,
        end: 4,
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "running-right",
      frames: this.anims.generateFrameNames("raspberry", {
        prefix: "running-right",
        start: 1,
        end: 2,
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "running-left",
      frames: this.anims.generateFrameNames("raspberry", {
        prefix: "running-left",
        start: 1,
        end: 2,
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "attacking-right",
      frames: this.anims.generateFrameNames("raspberry", {
        prefix: "attacking-right",
        start: 1,
        end: 4,
      }),
      frameRate: 20,
    });
    this.anims.create({
      key: "attacking-left",
      frames: this.anims.generateFrameNames("raspberry", {
        prefix: "attacking-left",
        start: 1,
        end: 4,
      }),
      frameRate: 20,
    });

    this.play("resting-left");

    // Add this enemy to the enemies group
    scene.enemies.add(this);

    this.chaseTimer = scene.time.addEvent({
      delay: 500,
      callbackScope: this,
      repeat: -1,
      callback: function () {
        if (this.dead || !this.body) return;
        if (!this.jammyInRange && !this.attacking) {
          this.rest();
        } else if (!this.attacking) {
          this.roam(this.facing);
        }
      },
    });

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (this.chaseTimer) this.chaseTimer.remove(false);
      if (this.attackOverlap) this.attackOverlap.destroy();
    });
  }

  update() {
    if (this.dead || !this.body) return;
    const jammy = this.scene.jammy;
    if (!jammy || !jammy.sprite) return;

    if (!this.attackOverlap) {
      this.attackOverlap = this.scene.physics.add.overlap(
        this,
        jammy.sprite,
        () => this.attack(),
        () => !this.attacking && !this.dead && jammy.alive,
        this
      );
    }

    this.facing = this.x < jammy.sprite.x ? 1 : -1;

    if (!this.attacking) {
      // Action logic based on distance to Jammy
      const distanceToJammy = Phaser.Math.Distance.Between(
        this.x,
        this.y,
        jammy.sprite.x,
        jammy.sprite.y
      );
      this.jammyInRange = distanceToJammy <= this.awareDistance;
      this.inPursuit =
        distanceToJammy <= this.chaseDistance && Math.abs(this.y - jammy.sprite.y) < 10;
    }
  }

  rest() {
    if (!this.attacking) {
      this.body.setVelocityX(0);
      this.play(this.facing === -1 ? "resting-left" : "resting-right", true);
    }
  }

  walk(direction) {
    this.body.setVelocityX(this.walkSpeed * direction);
    this.play(direction === -1 ? "walking-left" : "walking-right", true);
  }

  run(direction) {
    this.body.setVelocityX(this.runningSpeed * direction);
    this.play(direction === -1 ? "running-left" : "running-right", true);
  }

  roam(direction) {
    if (!this.inPursuit && !this.attacking) {
      this.walk(direction);
    } else {
      this.run(direction);
    }
  }

  attack() {
    if (this.dead || this.attacking) return;
    this.attacking = true;
    this.scene.jammy.takeDamage(this.x);
    this.play(this.facing === 1 ? "attacking-right" : "attacking-left", true);
    // `once` — a listener per attack used to pile up and fire together
    this.once("animationcomplete", () => {
      if (this.dead) return;
      this.roam(this.facing);
      this.scene.time.delayedCall(500, () => {
        this.attacking = false;
      });
    });
  }

  takeDamage(val = 1) {
    if (this.dead) return;
    this.hp -= val;
    this.takingDamage = true;
    this.invincible = true;
    this.flashOnce();
    if (this.hp <= 0) {
      this.die();
    } else {
      this.scene.time.delayedCall(this.invincibilityTime, () => {
        this.invincible = false;
        this.takingDamage = false;
      });
    }
    this.scene.sound.play("enemyHitSound");
  }

  flashOnce() {
    this.setTint(0x0000ff);
    this.scene.time.delayedCall(50, () => {
      if (this.active) this.clearTint();
    });
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.attacking = false;
    this.scene.scene.get("UIScene").setScore(this.score);
    this.body.setAllowGravity(false);
    this.body.setEnable(false);
    this.clearTint();
    this.scene.sound.play("enemyDeathSound");
    this.play("death").once("animationcomplete-death", () => {
      this.destroy();
    });
  }
}
