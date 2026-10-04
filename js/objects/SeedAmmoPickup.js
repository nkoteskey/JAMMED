// Collectible seed-ammo pickup: an upright striped seed (the unlit
// ammo the Seedcaster fires). The HUD weapon slot uses the same
// "seed-kernel" art so the inventory icon matches what you pick up.
class SeedAmmoPickup extends Phaser.Physics.Arcade.Sprite {
  // 12x16 sunflower-style seed: pointed tip up, rounded base, dark
  // husk with three cream stripes converging on the tip.
  static ensureTexture(scene) {
    if (scene.textures.exists("seed-kernel")) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    const rows = [
      [5, 6], [5, 6], [4, 7], [4, 7], [3, 8], [3, 8], [2, 9], [2, 9],
      [2, 9], [1, 10], [1, 10], [1, 10], [2, 9], [2, 9], [3, 8], [4, 7],
    ];
    rows.forEach(([a, b], r) => {
      g.fillStyle(0x100c08, 1);
      g.fillRect(a, r, b - a + 1, 1);
    });
    rows.forEach(([a, b], r) => {
      if (r < 2 || r > 14) return;
      g.fillStyle(0x2c2018, 1);
      g.fillRect(a + 1, r, b - a - 1, 1);
    });
    // Center stripe
    g.fillStyle(0xf2e4c4, 1);
    g.fillRect(5, 2, 2, 12);
    // Side stripes, angled in toward the tip
    g.fillStyle(0xd8c6a0, 1);
    g.fillRect(3, 8, 1, 5);
    g.fillRect(8, 8, 1, 5);
    g.fillRect(4, 5, 1, 3);
    g.fillRect(7, 5, 1, 3);
    // Glossy highlight on the husk
    g.fillStyle(0x6a5a48, 1);
    g.fillRect(2, 9, 1, 2);
    g.generateTexture("seed-kernel", 12, 16);
    g.destroy();
  }

  constructor(scn, x, y) {
    SeedAmmoPickup.ensureTexture(scn);
    super(scn, x, y, "seed-kernel");
    this.gameName = "SeedAmmo";
    this.amount = 3;

    scn.add.existing(this);
    scn.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.setDepth(58);

    scn.collectibles.add(this);

    // Small yellow ring around the seed so it reads as a pickup.
    this.glowRing = scn.add.circle(x, y, 11, 0xffd188, 0);
    this.glowRing.setStrokeStyle(1.5, 0xffde88, 0.85);
    this.glowRing.setDepth(this.depth - 1);
    scn.tweens.add({
      targets: this.glowRing,
      scale: 1.3,
      alpha: 0.2,
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    // Tiny pulse on the seed itself
    scn.tweens.add({
      targets: this,
      scale: 1.05,
      duration: 620,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.glowRing) this.glowRing.setPosition(this.x, this.y);
  }

  effect() {
    if (scene.jammy && typeof scene.jammy.addSeedAmmo === "function") {
      scene.jammy.addSeedAmmo(this.amount);
    }
    if (scene.sound && scene.cache.audio.exists("powerUpSound")) {
      scene.sound.play("powerUpSound", { volume: 0.6, rate: 1.2 });
    }
    if (typeof scene.tryReviveBlubert === "function") scene.tryReviveBlubert();
    if (this.glowRing) { this.glowRing.destroy(); this.glowRing = null; }
    this.destroy();
  }
}
