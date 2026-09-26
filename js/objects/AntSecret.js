// The ANT token — one hidden per stage, and the game's only true
// secret collectible.
//
// Deliberately kept OUT of the plot. Nobody explains it, no character
// lectures you about it. It's a nod: the ants are a small, older
// presence in the city that leave marks on walls for each other, and
// an x0x tag means one of them stashed something nearby. Word of
// mouth between people who look out for each other — which is the
// only part of that idea worth putting in a punk game about artists.
//
// Find all of them and the beach opens up.
class AntSecret extends Phaser.Physics.Arcade.Sprite {
  constructor(scn, x, y) {
    super(scn, x, y, "ant-token", "spin1");
    this.gameName = "AntSecret";
    this.score = 2500;
    this.stageKey = scn.sys.settings.key;

    scn.add.existing(this);
    scn.physics.add.existing(this);
    scn.collectibles.add(this);        // group first — it resets body defaults
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.setDepth(57);
    this.setDisplaySize(16, 16);
    this.play("ant-token-spin");

    // Already found on a previous run? Leave the spot empty.
    if (AntSecret.found(this.stageKey)) {
      this.destroy();
      return;
    }

    // Barely-there shimmer: visible if you're looking, easy to miss
    this.halo = scn.add.circle(x, y, 11, 0xffd877, 0.12).setDepth(56);
    scn.tweens.add({
      targets: this.halo, scale: 1.5, alpha: 0.03,
      duration: 1100, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });
    scn.tweens.add({
      targets: this, y: y - 4,
      duration: 1300, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });

    scn._antSecret = this;
  }

  static _bank() {
    if (typeof game === "undefined" || !game) return null;
    if (!game.ants) game.ants = { found: {}, count: 0 };
    return game.ants;
  }
  static found(stageKey) {
    const b = AntSecret._bank();
    return !!(b && b.found[stageKey]);
  }
  static count() {
    const b = AntSecret._bank();
    return b ? b.count : 0;
  }
  static TOTAL = 8;
  static allFound() {
    return AntSecret.count() >= AntSecret.TOTAL;
  }

  preUpdate(t, d) {
    super.preUpdate(t, d);
    if (this.halo) this.halo.setPosition(this.x, this.y);
  }

  effect() {
    const scn = this.scene || scene;
    const b = AntSecret._bank();
    if (b && !b.found[this.stageKey]) {
      b.found[this.stageKey] = true;
      b.count += 1;
    }
    scn.scene.get("UIScene").setScore(this.score);
    if (scn.cache.audio.exists("powerUpSound")) {
      scn.sound.play("powerUpSound", { rate: 1.6, volume: 0.8 });
    }
    if (scn.cache.audio.exists("antTokenCollectSound")) {
      scn.time.delayedCall(120, () =>
        scn.sound.play("antTokenCollectSound", { rate: 0.7, volume: 0.7 }));
    }
    scn.cameras.main.flash(180, 255, 216, 119);

    const n = AntSecret.count();
    const t1 = scn.add.bitmapText(213, 72, "tempFont", "ANT TOKEN FOUND", 12)
      .setOrigin(0.5).setScrollFactor(0).setDepth(400).setTintFill(0xffd877);
    const t2 = scn.add.bitmapText(213, 90, "tempFont",
      `${n} / ${AntSecret.TOTAL}` + (AntSecret.allFound() ? "  -  THE BEACH IS OPEN" : ""), 8)
      .setOrigin(0.5).setScrollFactor(0).setDepth(400).setTintFill(0xffffff);
    scn.tweens.add({
      targets: [t1, t2], alpha: 0, delay: 2200, duration: 500,
      onComplete: () => { t1.destroy(); t2.destroy(); },
    });

    const ui = scn.scene.get("UIScene");
    if (ui && ui.setAnts) ui.setAnts(n, AntSecret.TOTAL);

    if (this.halo) { this.halo.destroy(); this.halo = null; }
    scn._antSecret = null;
    this.destroy();
  }
}
