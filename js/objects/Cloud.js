// Chunky NES-style pixel cloud — stepped edges, flat shaded bottom,
// two size variants. Used as a decoy and as the cover for
// CloudBlueberry hideouts. Drifts slowly so the sky feels alive.
// Eyes are hidden until a hiding enemy is detected by Blubert.
class Cloud {
  static ensureTextures(scene) {
    if (scene.textures.exists("pixel-cloud-1")) return;
    const WHITE = 0xffffff, CREAM = 0xf0e4ec, SHADE = 0xd8c4d4;

    const paint = (key, rects) => {
      const g = scene.make.graphics({ x: 0, y: 0, add: false });
      let maxW = 0, maxH = 0;
      rects.forEach(([x, y, w, h, c]) => {
        g.fillStyle(c, 1);
        g.fillRect(x, y, w, h);
        maxW = Math.max(maxW, x + w);
        maxH = Math.max(maxH, y + h);
      });
      g.generateTexture(key, maxW, maxH);
      g.destroy();
    };

    // Big cloud, 60x26 — three stepped mounds, mauve-shaded underside
    paint("pixel-cloud-1", [
      [24, 0, 12, 2, WHITE],
      [20, 2, 22, 2, WHITE],
      [14, 4, 30, 2, WHITE], [46, 4, 8, 2, WHITE],
      [10, 6, 40, 2, WHITE], [52, 6, 4, 2, WHITE],
      [6, 8, 50, 2, WHITE],
      [2, 10, 56, 2, WHITE],
      [0, 12, 60, 6, WHITE],
      [0, 18, 60, 4, CREAM],
      [2, 22, 56, 2, SHADE],
      [6, 24, 48, 2, SHADE],
      // chunky highlight nicks
      [26, 2, 4, 2, CREAM], [16, 6, 4, 2, CREAM],
    ]);

    // Small cloud, 44x20
    paint("pixel-cloud-2", [
      [16, 0, 10, 2, WHITE],
      [12, 2, 18, 2, WHITE],
      [8, 4, 28, 2, WHITE],
      [4, 6, 36, 2, WHITE],
      [0, 8, 44, 6, WHITE],
      [0, 14, 44, 2, CREAM],
      [2, 16, 40, 2, SHADE],
      [6, 18, 34, 2, SHADE],
      [18, 2, 4, 2, CREAM],
    ]);
  }

  constructor(scene, x, y) {
    Cloud.ensureTextures(scene);
    this.scene = scene;
    this.container = scene.add.container(x, y);
    this.container.setDepth(40);

    // Variant picked deterministically from position so reloads match
    const variant = 1 + (Math.floor(x / 16) % 2);
    this.body = scene.add.image(0, 0, "pixel-cloud-" + variant);
    this.container.add(this.body);

    // Eyes — chunky pixel squares, hidden until detection
    this.leftEye = scene.add.rectangle(-9, -2, 6, 6, 0xffffff);
    this.rightEye = scene.add.rectangle(9, -2, 6, 6, 0xffffff);
    this.leftIris = scene.add.rectangle(-9, -2, 4, 4, 0xffbd33);
    this.rightIris = scene.add.rectangle(9, -2, 4, 4, 0xffbd33);
    this.leftPupil = scene.add.rectangle(-9, -1, 2, 2, 0x000000);
    this.rightPupil = scene.add.rectangle(9, -1, 2, 2, 0x000000);
    this.eyeParts = [
      this.leftEye, this.rightEye,
      this.leftIris, this.rightIris,
      this.leftPupil, this.rightPupil,
    ];
    this.container.add(this.eyeParts);
    this.setEyesVisible(false);

    // Slow drift
    const range = 20 + Math.random() * 10;
    const duration = 4200 + Math.random() * 1800;
    scene.tweens.add({
      targets: this.container,
      x: { from: x - range, to: x + range },
      duration,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  get x() { return this.container ? this.container.x : 0; }
  get y() { return this.container ? this.container.y : 0; }

  setEyesVisible(v) {
    if (!this.eyeParts) return;
    this.eyeParts.forEach(e => e.setVisible(v));
    if (v) {
      this.eyeParts.forEach(e => {
        e.setScale(0.2);
        this.scene.tweens.add({
          targets: e, scaleX: 1, scaleY: 1,
          duration: 180, ease: "Back.easeOut",
        });
      });
    }
  }

  destroy() {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
  }
}
