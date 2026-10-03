// A Lost Jam — one hidden vinyl record per stage. Finding it is saved
// permanently (not just for this run); find all of them to unlock the
// JAMS PLAYER jukebox on the title screen. Already-found records still
// spawn (as a faint ghost) so completionists can see where they were.
class LostRecord extends Phaser.Physics.Arcade.Sprite {
  static ensureTextures(scn) {
    if (scn.textures.exists("lost-record")) return;
    let g = scn.make.graphics({ x: 0, y: 0, add: false });
    // 18x18 vinyl: black disc, groove rings, gold label, white glint
    g.fillStyle(0x15121c, 1);
    g.fillCircle(9, 9, 9);
    g.lineStyle(1, 0x2e2838, 1);
    g.strokeCircle(9, 9, 7);
    g.strokeCircle(9, 9, 5);
    g.fillStyle(0xffd066, 1);
    g.fillCircle(9, 9, 3.5);
    g.fillStyle(0xe8882a, 1);
    g.fillRect(8, 8, 2, 2);
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(4, 3, 2, 1);
    g.fillRect(3, 4, 1, 2);
    g.generateTexture("lost-record", 18, 18);
    g.destroy();

    // Sleeve shown on the title screen for found records
    g = scn.make.graphics({ x: 0, y: 0, add: false });
    g.fillStyle(0x3a2848, 1);
    g.fillRect(0, 0, 18, 18);
    g.fillStyle(0xff6a9a, 1);
    g.fillRect(2, 2, 14, 14);
    g.fillStyle(0x15121c, 1);
    g.fillCircle(9, 9, 5);
    g.fillStyle(0xffd066, 1);
    g.fillCircle(9, 9, 2);
    g.generateTexture("lost-record-sleeve", 18, 18);
    g.destroy();
  }

  constructor(scn, x, y, jamId) {
    LostRecord.ensureTextures(scn);
    super(scn, x, y, "lost-record");
    this.jamId = jamId;
    this.gameName = "LostRecord";
    this.found = !!loadSave().lostJams[jamId];

    scn.add.existing(this);
    scn.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.setDepth(62);
    scn.collectibles.add(this);
    this.body.setAllowGravity(false);

    if (this.found) {
      // Ghost of a record already in the collection
      this.setAlpha(0.35);
    }

    // Spin: squash the disc horizontally so it reads as a turning record
    scn.tweens.add({
      targets: this,
      scaleX: 0.15,
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    scn.tweens.add({
      targets: this,
      y: y - 4,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // Music notes drifting off it
    this._noteTimer = scn.time.addEvent({
      delay: 700,
      loop: true,
      callback: () => {
        if (!this.active || this.found) return;
        const n = scn.add
          .bitmapText(this.x + Phaser.Math.Between(-8, 8), this.y - 8, "tempFont", "~", 8)
          .setOrigin(0.5)
          .setTintFill(0xffd066)
          .setDepth(63);
        scn.tweens.add({
          targets: n,
          y: n.y - 14,
          alpha: 0,
          duration: 700,
          onComplete: () => n.destroy(),
        });
      },
    });
    this.once(Phaser.GameObjects.Events.DESTROY, () => {
      if (this._noteTimer) this._noteTimer.remove(false);
    });
  }

  effect() {
    const s = scene;
    const isNew = markLostJam(this.jamId);
    awardScore(s, isNew ? 5000 : 500, this.x, this.y, { combo: false });
    s.sound.play("powerUpSound", { volume: 0.9, rate: 0.8 });
    s.time.delayedCall(120, () => s.sound.play("antTokenCollectSound", { rate: 1.2 }));
    s.time.delayedCall(260, () => s.sound.play("antTokenCollectSound", { rate: 1.5 }));

    const found = lostJamsFound();
    const total = LOST_JAM_IDS.length;
    const t1 = s.add
      .bitmapText(213, 70, "tempFont", isNew ? "LOST JAM FOUND!" : "LOST JAM (ALREADY OWNED)", 14)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(400)
      .setTintFill(0xffd066);
    const t2 = s.add
      .bitmapText(213, 90, "tempFont", '"' + (LOST_JAM_NAMES[this.jamId] || "") + '"', 10)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(400)
      .setTintFill(0xff9ad0);
    const t3 = s.add
      .bitmapText(
        213,
        106,
        "tempFont",
        found + " / " + total + (found >= total ? "  -  JAMS PLAYER UNLOCKED!" : "  -  FIND THEM ALL"),
        8
      )
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(400)
      .setTintFill(0xffffff);
    s.tweens.add({
      targets: [t1, t2, t3],
      alpha: 0,
      delay: 2600,
      duration: 500,
      onComplete: () => {
        t1.destroy();
        t2.destroy();
        t3.destroy();
      },
    });

    if (typeof s.tryReviveBlubert === "function") s.tryReviveBlubert();
    this.destroy();
  }
}
