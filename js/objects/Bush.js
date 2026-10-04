// Shared desert-scrub visual used by BushZomberry and decoys — a
// scraggly, sun-dried pixel bush with jagged stepped clumps, dry twigs
// and bleached tips. Eyes are hidden until Blubert's scan reveals
// them, then pop in with a scale-up tween.
class Bush {
  static ensureTexture(scene) {
    if (scene.textures.exists("scrub-bush")) return;
    const g = scene.make.graphics({ x: 0, y: 0, add: false });
    const DK = 0x4f6e26, MD = 0x6a8c30, LT = 0x96ac4c,
          TWIG = 0x8c6434, BLEACH = 0xc8c08a, SHADOW = 0x3a5220;
    const rects = [
      // dry twigs poking out (drawn first, behind the clumps)
      [0, 16, 6, 2, TWIG], [48, 18, 6, 2, TWIG],
      [26, 0, 2, 8, TWIG], [25, 2, 4, 2, TWIG],
      [8, 8, 2, 6, TWIG], [44, 6, 2, 8, TWIG],
      // dark base mass
      [6, 18, 42, 10, DK],
      [2, 20, 6, 6, DK], [46, 20, 6, 6, DK],
      [14, 8, 8, 6, DK], [30, 10, 12, 6, DK],
      // mid clumps
      [10, 12, 34, 8, MD],
      [4, 16, 10, 6, MD], [40, 16, 10, 6, MD],
      [22, 6, 10, 6, MD],
      // sun-bleached tips
      [16, 6, 6, 4, LT], [24, 4, 8, 4, LT], [36, 8, 6, 4, LT],
      [8, 14, 4, 4, LT], [44, 14, 4, 4, LT], [30, 14, 4, 2, LT],
      // bleached + dark grit
      [18, 12, 2, 2, BLEACH], [34, 6, 2, 2, BLEACH],
      [42, 18, 2, 2, BLEACH], [12, 20, 2, 2, BLEACH],
      [20, 20, 4, 2, SHADOW], [32, 16, 4, 2, SHADOW], [26, 24, 6, 2, SHADOW],
      // grounded shadow
      [8, 28, 38, 3, SHADOW],
    ];
    rects.forEach(([x, y, w, h, c]) => {
      g.fillStyle(c, 1);
      g.fillRect(x, y, w, h);
    });
    g.generateTexture("scrub-bush", 54, 32);
    g.destroy();
  }

  constructor(scene, x, y) {
    Bush.ensureTexture(scene);
    this.scene = scene;
    // Container centers at (x, y - 12) so the cluster hangs above ground
    this.container = scene.add.container(x, y - 12);
    this.container.setDepth(50);

    this.body = scene.add.image(0, 2, "scrub-bush");
    this.container.add(this.body);

    // Eye group — bigger and more obviously faceful when revealed.
    // Chunky pixel squares: sclera → glowing iris → pupil, angry brows.
    this.leftEye = scene.add.rectangle(-9, -2, 8, 8, 0xffffff);
    this.rightEye = scene.add.rectangle(9, -2, 8, 8, 0xffffff);
    this.leftIris = scene.add.rectangle(-9, -2, 6, 6, 0xffdd44);
    this.rightIris = scene.add.rectangle(9, -2, 6, 6, 0xffdd44);
    this.leftPupil = scene.add.rectangle(-9, -1, 3, 3, 0x000000);
    this.rightPupil = scene.add.rectangle(9, -1, 3, 3, 0x000000);
    this.leftBrow = scene.add.rectangle(-9, -8, 10, 2, 0x1a1a1a);
    this.rightBrow = scene.add.rectangle(9, -8, 10, 2, 0x1a1a1a);
    this.leftBrow.setRotation(0.25);
    this.rightBrow.setRotation(-0.25);

    this.eyeParts = [
      this.leftEye, this.rightEye,
      this.leftIris, this.rightIris,
      this.leftPupil, this.rightPupil,
      this.leftBrow, this.rightBrow,
    ];
    this.container.add(this.eyeParts);
    this.setEyesVisible(false);
  }

  setEyesVisible(v) {
    this.eyeParts.forEach(e => e.setVisible(v));
    if (v) {
      // Pop-in: scale from 0 with a bit of overshoot so it reads as "eyes open"
      this.eyeParts.forEach(e => {
        e.setScale(0.2);
        this.scene.tweens.add({
          targets: e,
          scaleX: 1, scaleY: 1,
          duration: 180,
          ease: "Back.easeOut",
        });
      });
    }
  }

  // Shake the whole bush briefly — used when the zomberry bursts out
  shake(ms = 260) {
    const baseX = this.container.x;
    this.scene.tweens.add({
      targets: this.container,
      x: { from: baseX - 3, to: baseX + 3 },
      duration: 40,
      yoyo: true,
      repeat: Math.max(1, Math.floor(ms / 80)),
      onComplete: () => { this.container.x = baseX; },
    });
  }

  setPosition(x, y) {
    this.container.setPosition(x, y - 12);
  }

  destroy() {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }
}
