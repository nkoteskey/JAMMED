// "The introduction of Blubert" — from the Trello storyboard list,
// following the artist's written scene (IMG_2483 / IMG_2484).
//
// He is FOUND HURT, so nothing here hovers or smiles: Blubert lies on
// the alley floor beside the beat-up box in his stunned frames, rotor
// stopped, tilted over. Jammy is crouched down next to him.
class CutSceneBlubert extends Phaser.Scene {
  constructor() { super({ key: "CutSceneBlubert" }); }
  init() { scene = this; }

  create() {
    buildBlubertPanel(this);
    runStoryboard(this, "sb-blubert",
      "A muffled cry from an alley. Under a beat-up box, a blueberry drone " +
      "somehow untouched by the virus - his family lost when the wave hit. " +
      "Jammy shares his nutrients. Blubert vows to help: he scouts ahead, " +
      "flags what is hiding, and rigs the seeds.",
      "Stage1_3", 0x9fd8ff);

    const GROUND = 150;
    const tex = this.textures.get("blubert");
    if (tex && tex.setFilter) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);

    // Blubert: down on the floor by the box mouth, stunned, listing to
    // one side. The stunned frames are the beaten-up face.
    const blu = this.add.sprite(214, GROUND - 22, "blubert", "stunned1")
      .setScale(2.9).setDepth(6);
    blu.setAngle(-22);
    if (this.anims.exists("blubert-stunned")) {
      blu.play("blubert-stunned");
    } else {
      this.anims.create({
        key: "sb-blubert-hurt",
        frames: this.anims.generateFrameNames("blubert",
          { prefix: "stunned", start: 1, end: 4 }),
        frameRate: 5, repeat: -1,
      });
      blu.play("sb-blubert-hurt");
    }
    // A weak shudder, not a hover
    this.tweens.add({
      targets: blu, angle: -17,
      duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });
    // Contact shadow so he reads as lying on the ground
    this.add.ellipse(216, GROUND - 2, 58, 11, 0x000000, 0.45).setDepth(5);

    // Jammy crouched beside him, reaching in
    const j = this.add.image(128, GROUND - 24, "jammy", "resting-right2")
      .setScale(2.9).setDepth(6);
    j.setAngle(10);   // leaning down over him, not standing by
    this.add.ellipse(130, GROUND - 2, 46, 10, 0x000000, 0.4).setDepth(5);
    this.tweens.add({
      targets: j, angle: 13,
      duration: 1700, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });

    // "It's okay little buddy" — the line from the drawing
    const bx = 150, by = 42;
    const bub = this.add.ellipse(bx, by, 156, 44, 0xf6f4ef).setDepth(7);
    bub.setStrokeStyle(3, 0x0a1018);
    this.add.triangle(0, 0, bx - 22, by + 19, bx - 4, by + 18, bx - 16, by + 40,
      0xf6f4ef).setDepth(7);
    this.add.bitmapText(bx, by - 11, "tempFont", "IT'S OKAY", 10)
      .setOrigin(0.5).setTintFill(0x14101c).setDepth(8);
    this.add.bitmapText(bx, by + 3, "tempFont", "LITTLE BUDDY", 10)
      .setOrigin(0.5).setTintFill(0x14101c).setDepth(8);
  }
}
