// A Bread Token: the rare collectible. Three per stage, tucked off the
// main path, tallied on the Stage Clear card and in the run report.
// (Ant Tokens are the common score pickups; this is the shimmering
// loaf from the original sprite sheet.)
class BreadToken extends Phaser.Physics.Arcade.Sprite {
  constructor(scn, x, y) {
    super(scn, x, y, "bread-token", "shimmer1");
    this.score = 2500;
    this.gameName = "BreadToken";

    scn.add.existing(this);
    scn.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.setDepth(60);
    if (scn.anims.exists("bread-token-shimmer")) this.play("bread-token-shimmer");
    scn.collectibles.add(this);

    // A soft bob and a warm halo so it reads as the special one
    this.halo = scn.add.circle(x, y, 11, 0xffd066, 0.18).setDepth(59);
    scn.tweens.add({ targets: this.halo, scale: 1.3, alpha: 0.05, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    scn.tweens.add({ targets: this, y: y - 3, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    if (this.halo) this.halo.setPosition(this.x, this.y);
  }

  effect() {
    awardScore(scene, this.score, this.x, this.y, { combo: false });
    scene.sound.play("antTokenCollectSound", { rate: 0.8, volume: 1 });
    scene.time.delayedCall(90, () => scene.sound.play("antTokenCollectSound", { rate: 1.2, volume: 0.7 }));
    this.body.setEnable(false);
    this.stop();

    const run = getRunState();
    if (run) {
      const key = scene.sys.settings.key;
      run.bread = run.bread || {};
      run.bread[key] = (run.bread[key] || 0) + 1;
    }
    if (typeof scene.tryReviveBlubert === "function") scene.tryReviveBlubert();

    const label = scene.add
      .bitmapText(this.x, this.y - 18, "tempFont", "BREAD!", 8)
      .setOrigin(0.5)
      .setDepth(380)
      .setTintFill(0xffd066);
    scene.tweens.add({ targets: label, y: label.y - 16, alpha: 0, duration: 800, onComplete: () => label.destroy() });
    for (let i = 0; i < 6; i++) {
      const sp = scene.add.rectangle(this.x, this.y, 2, 2, 0xffe080).setDepth(379);
      scene.tweens.add({
        targets: sp,
        x: this.x + Phaser.Math.Between(-18, 18),
        y: this.y + Phaser.Math.Between(-20, 8),
        alpha: 0,
        duration: 420,
        onComplete: () => sp.destroy(),
      });
    }
    if (this.halo) {
      this.halo.destroy();
      this.halo = null;
    }
    scene.tweens.add({
      targets: this,
      displayWidth: 40,
      displayHeight: 40,
      alpha: 0,
      duration: 220,
      onComplete: () => this.destroy(),
    });
  }
}
