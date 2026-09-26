// "Jammy gets his Rocket Axe" — panel traced from the artist's own
// drawing on the Trello board (card: Rocket Axe, photo.jpg).
class CutSceneRocketAxe extends Phaser.Scene {
  constructor() { super({ key: "CutSceneRocketAxe" }); }
  init() { scene = this; }
  create() {
    buildRocketAxePanel(this);
    runStoryboard(this, "sb-rocketaxe",
      "The band's old axe came back from the shop with a booster bolted " +
      "to the tail. Kick off it mid-air and the thing lights.",
      "Level1", 0xffd066, { text: "ROCKET AXE!", x: 330, y: 30 });
  }
}
