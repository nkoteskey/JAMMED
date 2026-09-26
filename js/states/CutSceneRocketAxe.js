// "Jammy gets his Rocket Axe" — from the Trello storyboard list.
// Plays just before Level 1, so the double jump the player is about
// to use has an origin instead of just being a control.
class CutSceneRocketAxe extends Phaser.Scene {
  constructor() { super({ key: "CutSceneRocketAxe" }); }
  init() { scene = this; }
  create() {
    buildRocketAxePanel(this);
    runStoryboard(this, "sb-rocketaxe",
      "A roadie with more solder than sense rewired the band's old axe. " +
      "Kick off it mid-air and the boosters light. Jammy has no idea what " +
      "he is holding. He plugs in anyway.",
      "Level1", 0xffd066, { text: "ROCKET AXE!", x: 322, y: 44 });
  }
}
