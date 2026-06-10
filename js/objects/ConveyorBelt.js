// Factory conveyor belt — a one-way platform whose surface drags Jammy
// along. Stand still and you drift at the belt's pace; run with it for
// a speed boost, or fight it at a crawl. Visual chevrons scroll via a
// TileSprite so the motion direction is always readable.
class ConveyorBelt {
  static ensureTexture(scn) {
    if (scn.textures.exists("conveyor-tex")) return;
    const g = scn.make.graphics({ x: 0, y: 0, add: false });
    // 16x12 tileable belt segment
    g.fillStyle(0x23273a, 1);
    g.fillRect(0, 0, 16, 12);
    g.fillStyle(0x3a3f52, 1);
    g.fillRect(0, 1, 16, 9);
    g.fillStyle(0x575e78, 1);
    g.fillRect(0, 1, 16, 2); // top tread sheen
    // Chevron arrows
    g.fillStyle(0x9aa3c0, 1);
    g.fillRect(2, 3, 2, 2);
    g.fillRect(4, 5, 2, 2);
    g.fillRect(2, 7, 2, 2);
    g.fillRect(10, 3, 2, 2);
    g.fillRect(12, 5, 2, 2);
    g.fillRect(10, 7, 2, 2);
    // Under-rollers
    g.fillStyle(0x14172a, 1);
    g.fillRect(0, 10, 16, 2);
    g.fillStyle(0x5d6680, 1);
    g.fillRect(3, 10, 2, 2);
    g.fillRect(11, 10, 2, 2);
    g.generateTexture("conveyor-tex", 16, 12);
    g.destroy();
  }

  constructor(scn, xLeft, yTop, width, dir, push = 46) {
    ConveyorBelt.ensureTexture(scn);
    this.scene = scn;
    this.dir = dir;
    this.push = push;

    this.sprite = scn.add.tileSprite(xLeft + width / 2, yTop + 6, width, 12, "conveyor-tex");
    this.sprite.setDepth(55);
    // Chevrons point right in the texture — mirror for leftward belts
    this.sprite.setFlipX(dir < 0);
    scn.physics.add.existing(this.sprite);
    this.sprite.body.setAllowGravity(false);
    this.sprite.body.setImmovable(true);
    // One-way: land on top, pass freely from below/sides
    this.sprite.body.checkCollision.down = false;
    this.sprite.body.checkCollision.left = false;
    this.sprite.body.checkCollision.right = false;

    // End housings so the belt doesn't float visually
    this.caps = [
      scn.add.rectangle(xLeft + 2, yTop + 6, 4, 14, 0x14172a).setDepth(56),
      scn.add.rectangle(xLeft + width - 2, yTop + 6, 4, 14, 0x14172a).setDepth(56),
    ];

    this._jammyOn = false;
    this.collider = scn.physics.add.collider(scn.jammy.sprite, this.sprite, () => {
      if (scn.jammy.sprite.body.touching.down) this._jammyOn = true;
    });
  }

  update() {
    // Scroll the tread in the drag direction (~60px/s at 60fps).
    // Decreasing tilePositionX slides the pattern rightward on screen;
    // the flipX mirror for left belts flips that too, so a constant
    // decrement always reads as "tread moving the way it drags".
    this.sprite.tilePositionX -= 1.0;
    if (this._jammyOn) {
      this._jammyOn = false;
      const j = this.scene.jammy;
      // Jammy's update() re-asserts walk/rest velocity every frame, so
      // a per-frame additive bias composes cleanly: drift when idle,
      // boost with the belt, trudge against it.
      if (j && j.alive && !j.rocketBoostActive) {
        j.sprite.body.velocity.x += this.dir * this.push;
      }
    }
  }
}
