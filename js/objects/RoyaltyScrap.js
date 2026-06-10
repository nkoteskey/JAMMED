// A crumpled Concentrate royalty statement. Collecting one shows the
// receipt line — quiet horror via paperwork. Worth a little score;
// worth more as worldbuilding.
class RoyaltyScrap extends Phaser.Physics.Arcade.Sprite {
  static ensureTexture(scn) {
    if (scn.textures.exists("royalty-scrap")) return;
    const g = scn.make.graphics({ x: 0, y: 0, add: false });
    // 12x12 crumpled paper with teal letterhead and print lines
    g.fillStyle(0xe8e4da, 1);
    g.fillRect(1, 0, 10, 12);
    g.fillRect(0, 2, 12, 8);
    g.fillStyle(0x2ab8b0, 1);
    g.fillRect(2, 1, 8, 2); // letterhead band
    g.fillStyle(0x8a857a, 1);
    g.fillRect(2, 5, 8, 1);
    g.fillRect(2, 7, 6, 1);
    g.fillRect(2, 9, 7, 1);
    g.fillStyle(0xc8c4ba, 1);
    g.fillRect(8, 10, 3, 2); // crumple shadow
    g.generateTexture("royalty-scrap", 12, 12);
    g.destroy();
  }

  constructor(scn, x, y, line) {
    RoyaltyScrap.ensureTexture(scn);
    super(scn, x, y, "royalty-scrap");
    this.line = line || "RECEIPT: 1,000,000 SQUEEZES = 3 ANT";
    this.score = 100;

    scn.add.existing(this);
    scn.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.setDepth(55);
    scn.collectibles.add(this);

    // Gentle flutter
    scn.tweens.add({
      targets: this,
      y: y - 4,
      angle: { from: -6, to: 6 },
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  effect() {
    scene.scene.get("UIScene").setScore(this.score);
    if (scene.cache.audio.exists("antTokenCollectSound")) {
      scene.sound.play("antTokenCollectSound", { rate: 0.8, volume: 0.5 });
    }
    const t = scene.add.bitmapText(213, 64, "tempFont", this.line, 8)
      .setOrigin(0.5).setScrollFactor(0).setDepth(400).setTintFill(0xd8d4ca);
    const bg = scene.add.rectangle(213, 64, t.width + 12, 14, 0x14181a, 0.8)
      .setScrollFactor(0).setDepth(399);
    scene.tweens.add({
      targets: [t, bg],
      alpha: 0,
      delay: 2600,
      duration: 500,
      onComplete: () => { t.destroy(); bg.destroy(); },
    });
    this.destroy();
  }
}
