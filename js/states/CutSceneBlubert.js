// "The introduction of Blubert" — panel traced from the artist's own
// drawing on the Trello board (card: The introduction of Blubert,
// IMG_2484.JPG), with the scene's own words from IMG_2483.
class CutSceneBlubert extends Phaser.Scene {
  constructor() { super({ key: "CutSceneBlubert" }); }
  init() { scene = this; }
  create() {
    buildBlubertPanel(this);
    runStoryboard(this, "sb-blubert",
      "A muffled cry from an alley. Under a beat-up box, a blueberry drone " +
      "clinging on, somehow untouched by the virus. His family were " +
      "separated when the wave hit. He wants to help.",
      "Stage1_3", 0x9fd8ff);
    // Balloon line, drawn over the traced panel
    this.add.bitmapText(140, 24, "tempFont", "IT'S OKAY", 10)
      .setOrigin(0.5).setTintFill(0x1a1118).setDepth(6);
    this.add.bitmapText(140, 38, "tempFont", "LITTLE BUDDY", 10)
      .setOrigin(0.5).setTintFill(0x1a1118).setDepth(6);
    this.add.bitmapText(356, 24, "tempFont", "JAM JUNKERS", 8)
      .setOrigin(0.5).setTintFill(0x5a4630).setDepth(6);
  }
}
