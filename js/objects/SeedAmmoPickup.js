// Collectible seed-ammo pickup. Uses the same generated teardrop
// texture as the projectile so the player recognizes it, scaled up
// and pulsing so it reads as a collectible.
class SeedAmmoPickup extends Phaser.Physics.Arcade.Sprite {
  constructor(scn, x, y) {
    if (SeedOfDestruction && SeedOfDestruction.ensureTexture) {
      SeedOfDestruction.ensureTexture(scn);
    }
    super(scn, x, y, "seed-teardrop");
    this.gameName = "SeedAmmo";
    this.amount = 3;

    scn.add.existing(this);
    scn.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.setDepth(58);
    this.setScale(0.9);
    this.setRotation(-0.2);
    this.setTint(0xffd188);

    scn.collectibles.add(this);

    // Small yellow ring around the seed so it reads as a pickup
    // without the teardrop itself being oversized.
    this.glowRing = scn.add.circle(x, y, 10, 0xffd188, 0);
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
