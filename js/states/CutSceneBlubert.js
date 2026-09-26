// "The introduction of Blubert" — from the Trello storyboard list.
// Staged with the real Blubert and Jammy sprites; Blubert now joins
// after the watermelon fight instead of silently tagging along from
// Level 1, so that stage teaches movement and shooting on its own.
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
      "Stage1_3", 0x9fd8ff, { text: "BLUBERT", x: 292, y: 30, color: 0x9fd8ff });

    // Jammy looking up at it
    sbSprite(this, "jammy", "resting-right2", 116, 120, 3.4).setDepth(5);

    // Blubert, big, hovering and bobbing
    const tex = this.textures.get("blubert");
    if (tex && tex.setFilter) tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    const blu = this.add.sprite(288, 92, "blubert", "idle-left1")
      .setScale(4.2).setDepth(5);
    if (this.anims.exists("blubert-idle-left")) blu.play("blubert-idle-left");
    this.tweens.add({ targets: blu, y: 80, duration: 900,
      yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    // His scan sweeping down toward Jammy
    const beam = this.add.triangle(0, 0, 288, 104, 150, 168, 210, 172,
      0xffd066, 0.22).setDepth(4);
    this.tweens.add({ targets: beam, alpha: 0.06, duration: 700,
      yoyo: true, repeat: -1 });
  }
}
