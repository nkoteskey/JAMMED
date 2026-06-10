// A collectible guitar on a display stand of light. Touching it adds
// the model to Jammy's collection and equips it on the spot, with a
// banner explaining the swap keys. Already-owned guitars don't respawn.
class GuitarPickup extends Phaser.Physics.Arcade.Sprite {
  constructor(scn, x, y, guitarId) {
    ensureGuitarTextures(scn);
    super(scn, x, y, "guitar-" + guitarId);
    this.guitarId = guitarId;

    // Replays/restarts: if it's already in the collection, skip spawn
    if (getGuitarCollection().owned.includes(guitarId)) {
      this.destroy();
      return;
    }

    scn.add.existing(this);
    scn.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.setDepth(60);
    scn.collectibles.add(this);

    // Golden display glow
    this.glowRing = scn.add.circle(x, y + 2, 18, 0xffd877, 0);
    this.glowRing.setStrokeStyle(2, 0xffd877, 0.8);
    this.glowRing.setDepth(59);
    scn.tweens.add({
      targets: this.glowRing,
      scale: 1.25, alpha: 0.3,
      duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });
    // Hover bob
    scn.tweens.add({
      targets: this,
      y: y - 5,
      duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });
    // Twinkles
    this._sparkleTimer = scn.time.addEvent({
      delay: 420,
      loop: true,
      callback: () => {
        const s = scn.add.circle(
          x + Phaser.Math.Between(-14, 14),
          this.y + Phaser.Math.Between(-18, 14),
          1.5, 0xfff0b0, 1
        );
        s.setDepth(61);
        scn.tweens.add({
          targets: s, alpha: 0, scale: 0.2, y: s.y - 6,
          duration: 380, onComplete: () => s.destroy(),
        });
      },
    });
  }

  effect() {
    const coll = getGuitarCollection();
    const cat = GUITAR_CATALOG[this.guitarId];
    if (!coll.owned.includes(this.guitarId)) coll.owned.push(this.guitarId);
    coll.equipped = this.guitarId;

    // Re-arm Jammy with the new model immediately
    if (scene.jammy) {
      scene.jammy.availableWeapons = coll.owned.map((id) => GUITAR_CATALOG[id].weapon);
      scene.jammy.currentWeapon = cat.weapon;
    }
    const ui = scene.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(cat.weapon);

    // Fanfare
    if (scene.cache.audio.exists("powerUpSound")) {
      scene.sound.play("powerUpSound", { volume: 0.9 });
    }
    if (scene.cache.audio.exists("antTokenCollectSound")) {
      scene.time.delayedCall(140, () => scene.sound.play("antTokenCollectSound", { rate: 1.4 }));
    }

    // Banner
    const t1 = scene.add.bitmapText(213, 78, "tempFont", "NEW GUITAR!", 14)
      .setOrigin(0.5).setScrollFactor(0).setDepth(400).setTintFill(0xffd877);
    const t2 = scene.add.bitmapText(213, 98, "tempFont", cat.name, 12)
      .setOrigin(0.5).setScrollFactor(0).setDepth(400).setTintFill(cat.labelColor);
    const t3 = scene.add.bitmapText(213, 116, "tempFont", "C TO SWAP - G FOR RACK", 8)
      .setOrigin(0.5).setScrollFactor(0).setDepth(400).setTintFill(0xffffff);
    scene.tweens.add({
      targets: [t1, t2, t3],
      alpha: 0,
      delay: 2400,
      duration: 500,
      onComplete: () => { t1.destroy(); t2.destroy(); t3.destroy(); },
    });

    if (this._sparkleTimer) this._sparkleTimer.destroy();
    if (this.glowRing) this.glowRing.destroy();
    this.destroy();
  }
}
