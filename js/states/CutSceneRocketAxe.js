// "Jammy gets his Rocket Axe" — from the Trello storyboard list.
//
// It belongs AFTER the Watermelon boss: the band's guitar tech comes
// out the stage door with the old axe rebuilt and a booster bolted to
// the tail, and that's what carries Jammy out to the mesa.
//
// Staged with the game's own rocket-axe sprite rather than drawn from
// scratch; the character art is the artist's.
class CutSceneRocketAxe extends Phaser.Scene {
  constructor() { super({ key: "CutSceneRocketAxe" }); }
  init() { scene = this; }
  create() {
    // The Watermelon board's track keeps running straight through here
    // (Chip.play is a no-op when that track is already going).
    this.sound.stopAll();
    if (typeof Chip !== "undefined") Chip.play("mesa");

    buildRocketAxePanel(this);
    runStoryboard(this, "sb-rocketaxe",
      "The band's guitar tech drags the old axe out the stage door - " +
      "rebuilt, with a rocket bolted to the tail. Kick off it mid-air " +
      "and the boosters light. Jammy plugs in and points it at the edge " +
      "of town.",
      "CutSceneBlubert", 0xffd066, { text: "ROCKET AXE!", x: 92, y: 26 });

    // Jammy riding the axe, big, mid-blast
    const j = sbSprite(this, "jammy-rocketaxe", "rocketaxe-right1", 150, 104, 3.2);
    j.setDepth(5);
    if (this.anims.exists("jammy-rocketaxe-right")) {
      const spr = this.add.sprite(150, 104, "jammy-rocketaxe", "rocketaxe-right1")
        .setScale(3.2).setDepth(5);
      spr.play("jammy-rocketaxe-right");
      j.destroy();
      this.tweens.add({ targets: spr, y: 96, duration: 700,
        yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
    // Exhaust smoke puffing behind the boosters
    this.time.addEvent({
      delay: 90, loop: true,
      callback: () => {
        const hot = Math.random() < 0.5;
        const p = this.add.circle(150 + Phaser.Math.Between(-7, 7), 146,
          3 + Math.random() * 4, hot ? 0xffd066 : 0xff7a3c, 0.6).setDepth(4);
        this.tweens.add({ targets: p, y: p.y + 40,
          x: p.x + Phaser.Math.Between(-14, 14),
          alpha: 0, scale: 2.4,
          duration: 560, onComplete: () => p.destroy() });
      },
    });

    // The tech's line, out of the doorway
    const bx = 318, by = 62;
    const bub = this.add.ellipse(bx, by, 170, 44, 0xf6f4ef).setDepth(7);
    bub.setStrokeStyle(3, 0x0a1018);
    this.add.triangle(0, 0, bx + 24, by + 18, bx + 6, by + 19, bx + 30, by + 40,
      0xf6f4ef).setDepth(7);
    this.add.bitmapText(bx, by - 11, "tempFont", "PATCHED HER UP.", 10)
      .setOrigin(0.5).setTintFill(0x14101c).setDepth(8);
    this.add.bitmapText(bx, by + 3, "tempFont", "GO GET 'EM, KID", 10)
      .setOrigin(0.5).setTintFill(0x14101c).setDepth(8);
  }
}
