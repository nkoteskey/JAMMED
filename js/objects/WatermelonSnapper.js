class WatermelonSnapper extends Phaser.Physics.Arcade.Sprite {
  constructor(scn, x, y) {
    super(scn, x, y, "watermelon-snapper", "closed1");
    scn.add.existing(this);
    scn.physics.add.existing(this);

    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.setSize(10, 18, 7, 3);

    this.score = 500;
    this.hp = 2;
    this.dead = false;
    this.attacking = false;
    this.attackHorizRange = 14;
    this.detectHorizRange = 24;
    this.attackVertRange = 44;

    if (!scn.anims.exists("snapper-closed")) {
      scn.anims.create({
        key: "snapper-closed",
        frames: [
          { key: "watermelon-snapper", frame: "closed1" },
          { key: "watermelon-snapper", frame: "closed2" },
        ],
        frameRate: 2, repeat: -1,
      });
      scn.anims.create({
        key: "snapper-snap",
        frames: [
          { key: "watermelon-snapper", frame: "opening" },
          { key: "watermelon-snapper", frame: "open1" },
          { key: "watermelon-snapper", frame: "open2" },
          { key: "watermelon-snapper", frame: "closing" },
        ],
        frameRate: 14,
      });
    }
    this.play("snapper-closed");
    scn.enemies.add(this);
  }

  update() {
    if (this.dead || this.attacking) return;
    if (!this.scene.jammy || !this.scene.jammy.alive) return;
    const j = this.scene.jammy.sprite;
    const dx = Math.abs(j.x - this.x);
    const dyAbove = this.y - j.y;
    if (dx < this.detectHorizRange && dyAbove > 0 && dyAbove < this.attackVertRange) {
      this.snap();
    }
  }

  snap() {
    this.attacking = true;
    this.play("snapper-snap");
    this.once("animationcomplete-snapper-snap", () => {
      this.play("snapper-closed");
      this.scene.time.delayedCall(600, () => { this.attacking = false; });
    });
    // Damage check mid-snap (when teeth are exposed)
    this.scene.time.delayedCall(160, () => {
      if (this.dead || !this.scene.jammy || !this.scene.jammy.alive) return;
      const j = this.scene.jammy.sprite;
      const dx = Math.abs(j.x - this.x);
      const dyAbove = this.y - j.y;
      if (dx < this.attackHorizRange && dyAbove > 0 && dyAbove < this.attackVertRange) {
        this.scene.jammy.takeDamage(this.x);
      }
    });
  }

  takeDamage(val = 1) {
    if (this.dead) return;
    this.hp -= val;
    this.setTint(0xff6666);
    this.scene.time.delayedCall(60, () => this.clearTint());
    this.scene.sound.play("enemyHitSound");
    if (this.hp <= 0) this.die();
  }

  die() {
    this.dead = true;
    this.scene.sound.play("enemyDeathSound");
    this.scene.scene.get("UIScene").setScore(this.score);
    this.body.setEnable(false);
    this.scene.tweens.add({
      targets: this, alpha: 0, duration: 400,
      onComplete: () => this.destroy(),
    });
  }
}
