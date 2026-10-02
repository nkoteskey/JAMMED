window.addEventListener("DOMContentLoaded", function () {
  // Game configuration
  var config = {
    type: Phaser.AUTO,
    parent: "game",
    width: 426,
    height: 240,
    backgroundColor: "#000000",
    // Nearest-neighbour scaling so the pixel art stays crisp at any
    // window size instead of being smeared by bilinear filtering.
    pixelArt: true,
    scene: [
      Boot,
      Preload,
      TitleScreen,
      PauseScene,
      GuitarRack,
      UIScene,
      CutScene1_1,
      CutScene1_2,
      CutScene1_3,
      Level1,
      Level1BossFight,
      CutSceneWatermelonDefeated,
      Stage1_3,
      Stage1_4,
      EndCredits,
    ],
    physics: {
      default: "arcade",
      arcade: {
        gravity: { y: 900 },
        debug: /[?&]debug/.test(window.location.search),
      },
    },
    input: {
      // Joystick + two buttons + a spare on touch screens
      activePointers: 4,
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };

  // Create the game object and expose it globally — object classes and
  // the run-state helpers in js/helpers/globals.js reference `game`.
  var game = new Phaser.Game(config);
  window.game = game;

  // Dev conveniences: add ?dev to the URL to enable the Level 1 warp
  // portals, ?debug to draw physics bodies.
  game.devMode = /[?&]dev/.test(window.location.search);

  // Per-run progress (HP, ammo, bread tokens...) — see globals.js
  resetRunState();
});
