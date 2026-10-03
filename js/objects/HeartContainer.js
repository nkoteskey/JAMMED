// Heart Container: a golden jam jar with a heart on the label. Grabbing
// it raises Jammy's max HP by one for the rest of the run and tops him
// up. There is one in the game, hidden above Cloud Nine's summit.
class HeartContainer extends Phaser.Physics.Arcade.Sprite {
  static ensureTexture(scn) {
    if (scn.textures.exists("heart-container")) return;
    const g = scn.make.graphics({ x: 0, y: 0, add: false });
    // Jar
    g.fillStyle(0xf0c040, 1);
    g.fillRect(3, 6, 14, 14);
    g.fillStyle(0xffe890, 1);
    g.fillRect(4, 7, 3, 11);
    g.fillStyle(0xb88a20, 1);
    g.fillRect(14, 7, 2, 12);
    // Lid
    g.fillStyle(0xd84848, 1);
    g.fillRect(2, 2, 16, 4);
    g.fillStyle(0xff8080, 1);
    g.fillRect(3, 2, 14, 1);
    // Label with heart
    g.fillStyle(0xfff4e0, 1);
    g.fillRect(6, 10, 8, 7);
    g.fillStyle(0xe02848, 1);
    g.fillRect(7, 11, 2, 2);
    g.fillRect(11, 11, 2, 2);
    g.fillRect(7, 13, 6, 1);
    g.fillRect(8, 14, 4, 1);
    g.fillRect(9, 15, 2, 1);
    g.generateTexture("heart-container", 20, 22);
    g.destroy();
  }

  constructor(scn, x, y) {
    HeartContainer.ensureTexture(scn);
    super(scn, x, y, "heart-container");
    this.gameName = "HeartContainer";
    scn.add.existing(this);
    scn.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.setDepth(58);
    scn.collectibles.add(this);
    this.body.setAllowGravity(false);

    // Hover + a slow sparkle so it reads as something special
    this._baseY = y;
    scn.tweens.add({ targets: this, y: y - 4, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.glow = scn.add.circle(x, y, 18, 0xfff0a0, 0.22).setDepth(57);
    scn.tweens.add({ targets: this.glow, scale: 1.4, alpha: 0.05, duration: 800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  effect() {
    const scn = this.scene;
    const j = scn.jammy;
    const run = getRunState();
    if (run) run.maxHpBonus = (run.maxHpBonus || 0) + 1;
    if (j) {
      j.maxHP += 1;
      j.hp = j.maxHP;
    }
    awardScore(scn, 5000, this.x, this.y, { combo: false });
    scn.sound.play("powerUpSound", { rate: 0.8, volume: 1 });
    scn.time.delayedCall(180, () => scn.sound.play("powerUpSound", { rate: 1.2, volume: 0.8 }));

    const t1 = scn.add.bitmapText(213, 150, "tempFont", "HEART CONTAINER!", 16)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xffd066);
    const t2 = scn.add.bitmapText(213, 170, "tempFont", "MAX HP UP FOR THE REST OF THE RUN", 8)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xffffff);
    scn.tweens.add({ targets: [t1, t2], alpha: 0, delay: 2600, duration: 500, onComplete: () => { t1.destroy(); t2.destroy(); } });

    if (this.glow) this.glow.destroy();
    this.body.setEnable(false);
    scn.tweens.add({ targets: this, scale: 2.2, alpha: 0, duration: 320, onComplete: () => this.destroy() });
  }
}
