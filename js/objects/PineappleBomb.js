class Pineapple extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, "pineapple-bomb");
    this.score=500;
    // Add Pineapple to the scene and enable physics
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.alive = true;
    this.dead = false;
    // Basic character properties
    this.hp = 1;
    this.roamSpeed = 40;
    this.facing = -1;
    this.takingDamage = false;
    this.invincible = false;
    this.invincibilityTime = 50;
    this.awareDistance = 400;
    // Lights the fuse once Jammy is this close — far enough that the
    // player sees it start and has a beat to clear out.
    this.fuseRange = 60;
    this.fragmentCount = 5;
    this.fragmentSpeed = 400;
    this.burningDown = false;

    // Physics settings
    this.body.setBounce(0);
    this.body.setAllowGravity(true);

    // Animations
    this.anims.create({
      key: "resting-right",
      frames: this.anims.generateFrameNames("pineapple-bomb", {
        prefix: "resting-right",
        start: 1,
        end: 2,
      }),
      frameRate: 4,
      repeat: -1,
    });
    this.anims.create({
      key: "resting-left",
      frames: this.anims.generateFrameNames("pineapple-bomb", {
        prefix: "resting-left",
        start: 1,
        end: 2,
      }),
      frameRate: 4,
      repeat: -1,
    });
    this.anims.create({
      key: "walking-right",
      frames: this.anims.generateFrameNames("pineapple-bomb", {
        prefix: "walking-right",
        start: 1,
        end: 4,
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "walking-left",
      frames: this.anims.generateFrameNames("pineapple-bomb", {
        prefix: "walking-left",
        start: 1,
        end: 4,
      }),
      frameRate: 10,
      repeat: -1,
    });
    this.anims.create({
      key: "burn-down-left",
      frames: this.anims.generateFrameNames("pineapple-bomb", {
        prefix: "burn-down-left",
        start: 1,
        end: 10,
      }),
      frameRate: 8,
    });
    this.anims.create({
      key: "burn-down-right",
      frames: this.anims.generateFrameNames("pineapple-bomb", {
        prefix: "burn-down-right",
        start: 1,
        end: 10,
      }),
      frameRate: 8,
    });

    this.play("resting-left");

    // Add Pineapple to enemies group
    scene.enemies.add(this);

    this.roamTimer = this.scene.time.addEvent({
      delay: 50,
      callback: function () {
        if (!this.body) return;
        if(this.alive){
        const j = this.scene.jammy;
        if (!j || !j.sprite) return;
        if (
          Phaser.Math.Distance.Between(
            this.x,
            this.y,
            j.sprite.x,
            j.sprite.y
          ) < this.fuseRange
        ) {
          this.burnDown();
        }
        if (this.burningDown) {
          this.alive=false;
          this.body.setVelocityX(0);
          this.play(
            this.facing === 1 ? "burn-down-right" : "burn-down-left",
            true
          ).once("animationcomplete", () => this.die());
        } else if (
          Phaser.Math.Distance.Between(
            this.x,
            this.y,
            this.scene.jammy.sprite.x,
            this.scene.jammy.sprite.y
          ) < this.awareDistance
        ) {
          this.facing = this.x < this.scene.jammy.sprite.x ? 1 : -1;
          this.roam(this.facing);
        } else {
          this.rest();
        }
      }
},
      callbackScope: this,
      repeat: -1,
    });

    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (this.roamTimer) this.roamTimer.remove(false);
    });
  }

  update() {}

  rest() {
    this.body.setVelocityX(0);
    this.play(this.facing === -1 ? "resting-left" : "resting-right", true);
  }

  roam(direction) {
    this.body.setVelocityX(this.roamSpeed * direction);
    this.play(direction === -1 ? "walking-left" : "walking-right", true);
  }

  burnDown() {
    if (this.burningDown) return;
    this.body.setVelocityX(0);
    this.scene.sound.play("pineappleBombFuseSound");
    this.burningDown = true;
  }

  takeDamage() {
    if (!this.invincible) {
      this.invincible = true;
      this.flashOnce();
      this.burnDown();
    }
  }

  flashOnce() {
    this.setTint(0x0000ff);
    this.scene.time.delayedCall(50, () => this.clearTint());
  }

  launchFragments() {
    const velocity = this.fragmentSpeed;
    const verticalOffset = 4;
    let fragments;
    if (this.fragmentCount > 5) {
      // Full ring for the hot variant
      fragments = [];
      for (let i = 0; i < this.fragmentCount; i++) {
        const a = (i / this.fragmentCount) * Math.PI * 2;
        fragments.push({ vx: Math.cos(a) * velocity, vy: Math.sin(a) * velocity });
      }
    } else {
      fragments = [
        { vx: -velocity, vy: 0 },
        { vx: -velocity * 0.75, vy: -velocity * 0.75 },
        { vx: 0, vy: -velocity },
        { vx: velocity, vy: 0 },
        { vx: velocity * 0.75, vy: -velocity * 0.75 },
      ];
    }
    fragments.forEach((f) => {
      new BurningFragment(
        this.scene,
        this.x,
        this.y + verticalOffset,
        f.vx,
        f.vy
      );
    });
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.alive = false;
    this.launchFragments();
    awardScore(this.scene, this.score, this.x, this.y);
    this.scene.sound.stopByKey("pineappleBombFuseSound");
    this.scene.sound.play("shortExplosion", { volume: 0.7 });
    this.scene.cameras.main.shake(100, 0.004);
    this.visible = false;
    this.body.setEnable(false);
    this.destroy();
  }
}

// Hot Pineapple — the Jam Works' canned variety. Shorter fuse, faster
// waddle, and a full ring of eight burning fragments.
class HotPineapple extends Pineapple {
  constructor(scene, x, y) {
    super(scene, x, y);
    this.score = 800;
    this.roamSpeed = 60 * enemySpeedScale();
    this.fuseRange = 70;
    this.fragmentCount = 8;
    this.fragmentSpeed = 340;
    this.setTint(0xff9070);
    ["burn-down-left", "burn-down-right"].forEach((k) => {
      const a = this.anims.get(k);
      if (a) {
        a.frameRate = 14;
        a.msPerFrame = 1000 / 14;
      }
    });
  }

  flashOnce() {
    this.setTint(0xffffff);
    this.scene.time.delayedCall(50, () => {
      if (this.active) this.setTint(0xff9070);
    });
  }
}
