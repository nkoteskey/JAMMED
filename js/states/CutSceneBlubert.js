// "The introduction of Blubert" — from the Trello storyboard list.
// Blubert now joins AFTER the watermelon fight instead of silently
// tagging along from level one, so Level 1 teaches movement and
// shooting on its own and the companion arrives as a beat.
class CutSceneBlubert extends Phaser.Scene {
  constructor() { super({ key: "CutSceneBlubert" }); }
  init() { scene = this; }
  create() {
    buildBlubertPanel(this);
    runStoryboard(this, "sb-blubert",
      "Something small and blue has been following him since the theater. " +
      "It hums, it scans, it will not leave. Jammy calls it Blubert. It sees " +
      "what is hiding in the bushes - so the road out of town just got " +
      "survivable.",
      "Stage1_3", 0x9fd8ff, { text: "BLUBERT", x: 300, y: 36, color: 0x9fd8ff });
  }
}
