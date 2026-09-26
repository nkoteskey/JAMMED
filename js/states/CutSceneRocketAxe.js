// "Jammy gets his Rocket Axe" — from the Trello storyboard list.
// Staged with the game's own rocket-axe sprite rather than drawn
// from scratch; the character art is the artist's.
//
// It plays AFTER the Watermelon boss: the band's guitar tech hands the
// rebuilt axe over on Jammy's way out of the city.
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
      "The band's guitar tech catches Jammy on the way out - the old axe, " +
      "back from the shop with a rocket bolted to the tail. Kick off it " +
      "mid-air and the boosters light. No time to ask questions; Jammy " +
      "plugs in and points it at the edge of town.",
      "CutSceneBlubert", 0xffd066, { text: "ROCKET AXE!", x: 316, y: 40 });

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
  }
}
