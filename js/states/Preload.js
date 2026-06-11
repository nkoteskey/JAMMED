class Preload extends Phaser.Scene {
  constructor() {
    super("Preload");
    scene = this;
  }

  preload() {
    let centerX = this.cameras.main.centerX;
    let centerY = this.cameras.main.centerY;
    var jammyImage = this.add.sprite(centerX, centerY, "jammyLoader");
    jammyImage.setOrigin(0.5, 0.5);
    var loadingBar = this.add.sprite(centerX, centerY + 80, "loadingBar");
    loadingBar.setOrigin(0.5, 0.5);
    this.load.on("progress", function (value) {
      loadingBar.setCrop(0, 0, value * loadingBar.width, loadingBar.height);
    });

    // Load fonts. "tempFont" is NOT loaded here anymore — Boot
    // registers a crisp runtime-generated retro font under that key
    // (see js/helpers/retrofont.js); loading the old 72px bitmap
    // font would overwrite it with the blurry downscaled version.
    this.load.bitmapFont(
      "8-bit-mono",
      "assets/fonts/8-bit-mono.png",
      "assets/fonts/8-bit-mono.fnt"
    );

    // Backgrounds and storyboards
    this.load.image(
      "titleScreenBg",
      "assets/img/backgrounds/jammed-title-screen.png"
    );
    this.load.image(
      "storyboard-try-out",
      "assets/img/storyboards/jammy-try-out.png"
    );
    this.load.image(
      "storyboard-city-runamuck",
      "assets/img/storyboards/city-runamuck.png"
    );
    this.load.image(
      "storyboard-jammy-get-to-business",
      "assets/img/storyboards/jammy-get-to-business.png"
    );
    this.load.image(
      "storyboard-watermelon-defeated",
      "assets/img/storyboards/watermelon-defeated.png"
    );

    // Tilemaps and tilesets
    this.load.image(
      "custom-city-tiles",
      "assets/img/tilesets/customCityTilesEXT.png"
    );
    this.load.image("theater-tiles", "assets/img/tilesets/theater-tiles.png");
    this.load.tilemapTiledJSON("level1", "assets/img/tilemaps/Level1.json");
    this.load.tilemapTiledJSON(
      "level1Alt",
      "assets/img/tilemaps/Level1Alt.json"
    );
    this.load.tilemapTiledJSON(
      "level1BossFight",
      "assets/img/tilemaps/Level1BossFight.json"
    );
    this.load.tilemapTiledJSON(
      "stage1_3",
      "assets/img/tilemaps/Stage1_3.json"
    );

    // Load game objects and sprite atlases
    this.load.atlas(
      "jammy",
      "assets/img/sprites/jammy/jammy.png",
      "assets/img/sprites/jammy/jammy.json"
    );
    this.load.atlas(
      "jammy-rocketaxe",
      "assets/img/sprites/jammy-rocketaxe/jammy-rocketaxe.png",
      "assets/img/sprites/jammy-rocketaxe/jammy-rocketaxe.json"
    );
    this.load.image(
      "audio-wave",
      "assets/img/sprites/audio-wave/audio-wave.png"
    );
    this.load.atlas(
      "power-up",
      "assets/img/sprites/power-up/power-up.png",
      "assets/img/sprites/power-up/power-up.json"
    );
    this.load.atlas(
      "ant-token",
      "assets/img/sprites/ant-token/ant-token.png",
      "assets/img/sprites/ant-token/ant-token.json"
    );
    this.load.atlas(
      "raspberry",
      "assets/img/sprites/raspberry/raspberry.png",
      "assets/img/sprites/raspberry/raspberry.json"
    );
    this.load.atlas(
      "blueberry",
      "assets/img/sprites/blueberry/blueberry.png",
      "assets/img/sprites/blueberry/blueberry.json"
    );
    this.load.atlas(
      "blubert",
      "assets/img/sprites/blubert/blubert.png",
      "assets/img/sprites/blubert/blubert.json"
    );
    this.load.atlas(
      "horned-fruit",
      "assets/img/sprites/horned-fruit/horned-fruit.png",
      "assets/img/sprites/horned-fruit/horned-fruit.json"
    );
    this.load.atlas(
      "watermelon-snapper",
      "assets/img/sprites/watermelon-snapper/watermelon-snapper.png",
      "assets/img/sprites/watermelon-snapper/watermelon-snapper.json"
    );
    this.load.atlas(
      "seed-of-destruction",
      "assets/img/sprites/seed-of-destruction/seed-of-destruction.png",
      "assets/img/sprites/seed-of-destruction/seed-of-destruction.json"
    );
    this.load.atlas(
      "bush",
      "assets/img/sprites/bush/bush.png",
      "assets/img/sprites/bush/bush.json"
    );
    this.load.atlas(
      "desert-cactus",
      "assets/img/sprites/desert-cactus/desert-cactus.png",
      "assets/img/sprites/desert-cactus/desert-cactus.json"
    );
    this.load.atlas(
      "dev-portal",
      "assets/img/sprites/dev-portal/dev-portal.png",
      "assets/img/sprites/dev-portal/dev-portal.json"
    );
    this.load.image(
      "blueberry-bomb",
      "assets/img/sprites/blueberry-bomb/blueberry-bomb-sprite.png"
    );
    this.load.atlas(
      "pineapple-bomb",
      "assets/img/sprites/pineapple-bomb/pineapple-bomb.png",
      "assets/img/sprites/pineapple-bomb/pineapple-bomb.json"
    );
    this.load.atlas(
      "burning-fragment",
      "assets/img/sprites/burning-fragment/burning-fragment.png",
      "assets/img/sprites/burning-fragment/burning-fragment.json"
    );
    this.load.atlas(
      "enemy-death",
      "assets/img/sprites/enemy-death/enemy-death.png",
      "assets/img/sprites/enemy-death/enemy-death.json"
    );
    this.load.atlas(
      "watermelon-boss",
      "assets/img/sprites/watermelon-boss/watermelon-boss.png",
      "assets/img/sprites/watermelon-boss/watermelon-boss.json"
    );
    this.load.image(
      "watermelon-seed",
      "assets/img/sprites/watermelon-boss/watermelon-seed.png"
    );

    // Load HUD and menu elements
    this.load.image(
      "lifebar-outline",
      "assets/img/sprites/lifebar/lifebar-outline.png"
    );
    this.load.image(
      "lifebar-guts",
      "assets/img/sprites/lifebar/lifebar-guts.png"
    );
    this.load.image(
      "ant-token-hud",
      "assets/img/sprites/ant-token/hud/ant-token-hud.png"
    );
    this.load.image(
      "ant-token-outline-hud",
      "assets/img/sprites/ant-token/hud/ant-token-outline-hud.png"
    );
    this.load.image(
      "bossLifebar-outline",
      "assets/img/sprites/lifebar-boss/bossLifebar-outline.png"
    );
    this.load.image(
      "bossLifebar-guts",
      "assets/img/sprites/lifebar-boss/bossLifebar-guts.png"
    );
    this.load.image(
      "pause-menu-bg",
      "assets/img/sprites/pause-menu/pause-menu-bg.png"
    );
    this.load.image(
      "pause-menu-full-screen-button",
      "assets/img/sprites/pause-menu/pause-menu-full-screen-button.png"
    );
    this.load.image(
      "pause-menu-full-screen-button-mobile",
      "assets/img/sprites/pause-menu/pause-menu-full-screen-button-mobile.png"
    );
    this.load.image(
      "pause-menu-quit-game-button",
      "assets/img/sprites/pause-menu/pause-menu-quit-game-button.png"
    );
    this.load.image(
      "pause-menu-return-button",
      "assets/img/sprites/pause-menu/pause-menu-return-button.png"
    );
    this.load.image(
      "pause-menu-button-outline",
      "assets/img/sprites/pause-menu/pause-menu-button-outline.png"
    );

    // Load Gamepad control sprites
    this.load.image(
      "button-inactive",
      "assets/img/sprites/button/buttonSpriteInactive.png"
    );
    this.load.image(
      "button-active",
      "assets/img/sprites/button/buttonSpriteActive.png"
    );
    //this.load.image('', 'assets/img/');

    // Load images for touch screen controls
    this.load.spritesheet(
      "gamepad",
      "assets/img/gamepad/gamepad_spritesheet1.png",
      { frameWidth: 100, frameHeight: 100 }
    );

    // Load music
    this.load.audio("Jammed", "assets/audio/music/Jammed.mp3");
    this.load.audio("Level1MusicLoop", "assets/audio/music/SurfsUp.mp3");
    this.load.audio("BossBattle", "assets/audio/music/BossBattle.mp3");

    // Load sfx
    this.load.audio("startGameSound", "assets/audio/sfx/custom/startGame.mp3");
    this.load.audio("jumpSound", "assets/audio/sfx/custom/jump.mp3");
    this.load.audio("laserSound", "assets/audio/sfx/custom/fireAudioWave.mp3");
    this.load.audio("enemyDeathSound", "assets/audio/sfx/custom/enemyDeath.mp3");
    this.load.audio("shortWave", "assets/audio/sfx/custom/enemyTakeDamage.mp3");
    this.load.audio(
      "blueberryBombDropSound",
      "assets/audio/sfx/custom/blueberryBombDrop.mp3"
    );

    this.load.audio(
      "enemyHitSound",
      "assets/audio/sfx/custom/enemyTakeDamage.mp3"
    );
    this.load.audio(
      "pineappleBombFuseSound",
      "assets/audio/sfx/custom/pineappleBombFuse.mp3"
    );
    this.load.audio("powerUpSound", "assets/audio/sfx/custom/healthUp.mp3");
    this.load.audio(
      "antTokenCollectSound",
      "assets/audio/sfx/custom/collectBreadToken.mp3"
    );
    this.load.audio(
      "jammyTakeDamageSound",
      "assets/audio/sfx/custom/jammyTakeDamage.mp3"
    );
    this.load.audio(
      "jammyDeathSound",
      "assets/audio/sfx/custom/jammyDeath.mp3"
    );
    this.load.audio(
      "watermelonBossLandingSound",
      "assets/audio/sfx/custom/watermelonBossLanding.mp3"
    );
    this.load.audio("bossDeathSound", "assets/audio/sfx/custom/bossDeath.mp3");

    this.load.audio("shortExplosion", "assets/audio/sfx/shortExplosion.mp3");

    //load joystick plugin
    let url = "includes/phaser-plugin-virtual-gamepad.js";
    this.load.plugin("rexvirtualjoystickplugin", url, true);
  }
  create() {
    scene.anims.create({
      key: "resting-right",
      frames: scene.anims.generateFrameNames("jammy", {
        start: 1,
        end: 4,
        zeroPad: 0,
        prefix: "resting-right",
        suffix: "",
      }),
      frameRate: 4,
      repeat: -1,
    });
    scene.anims.create({
      key: "jammy-rocketaxe-right",
      frames: scene.anims.generateFrameNames("jammy-rocketaxe", {
        start: 1,
        end: 4,
        prefix: "rocketaxe-right",
      }),
      frameRate: 14,
      repeat: -1,
    });
    scene.anims.create({
      key: "resting-left",
      frames: scene.anims.generateFrameNames("jammy", {
        start: 1,
        end: 4,
        zeroPad: 0,
        prefix: "resting-left",
        suffix: "",
      }),
      frameRate: 4,
      repeat: -1,
    });
    scene.anims.create({
      key: "running-right",
      frames: scene.anims.generateFrameNames("jammy", {
        start: 1,
        end: 8,
        zeroPad: 0,
        prefix: "running-right",
        suffix: "",
      }),
      frameRate: 10,
      repeat: -1,
    });
    scene.anims.create({
      key: "running-left",
      frames: scene.anims.generateFrameNames("jammy", {
        start: 1,
        end: 8,
        zeroPad: 0,
        prefix: "running-left",
        suffix: "",
      }),
      frameRate: 10,
      repeat: -1,
    });
    scene.anims.create({
      key: "jumping-right",
      frames: scene.anims.generateFrameNames("jammy", {
        start: 2,
        end: 2,
        zeroPad: 0,
        prefix: "running-right",
        suffix: "",
      }),
      frameRate: 1,
      repeat: -1,
    });
    scene.anims.create({
      key: "jumping-left",
      frames: scene.anims.generateFrameNames("jammy", {
        start: 2,
        end: 2,
        zeroPad: 0,
        prefix: "running-left",
        suffix: "",
      }),
      frameRate: 1,
      repeat: -1,
    });
    scene.anims.create({
      key: "shooting-right",
      frames: scene.anims.generateFrameNames("jammy", {
        start: 1,
        end: 1,
        zeroPad: 0,
        prefix: "shooting-right",
        suffix: "",
      }),
      frameRate: 10,
      repeat: -1,
    });

    scene.anims.create({
      key: "shooting-left",
      frames: scene.anims.generateFrameNames("jammy", {
        start: 1,
        end: 1,
        zeroPad: 0,
        prefix: "shooting-left",
        suffix: "",
      }),
      frameRate: 10,
      repeat: -1,
    });
    scene.anims.create({
      key: "taking-damage-left",
      frames: scene.anims.generateFrameNames("jammy", {
        start: 1,
        end: 1,
        zeroPad: 0,
        prefix: "taking-damage-left",
        suffix: "",
      }),
      frameRate: 10,
      repeat: -1,
    });
    scene.anims.create({
      key: "taking-damage-right",
      frames: scene.anims.generateFrameNames("jammy", {
        start: 1,
        end: 1,
        zeroPad: 0,
        prefix: "taking-damage-right",
        suffix: "",
      }),
      frameRate: 10,
      repeat: -1,
    });
    scene.anims.create({
      key: "dead-right",
      frames: scene.anims.generateFrameNames("jammy", {
        start: 1,
        end: 1,
        zeroPad: 0,
        prefix: "dead-right",
        suffix: "",
      }),
      frameRate: 1,
      repeat: -1,
    });
    scene.anims.create({
      key: "dead-left",
      frames: scene.anims.generateFrameNames("jammy", {
        start: 1,
        end: 1,
        zeroPad: 0,
        prefix: "dead-left",
        suffix: "",
      }),
      frameRate: 1,
      repeat: -1,
    });

    scene.anims.create({
      key: "death",
      frames: scene.anims.generateFrameNames("enemy-death", {
        prefix: "death",
        start: 1,
        end: 2,
        zeroPad: 0,
      }),
      frameRate: 10,
      repeat: 3,
    });

    scene.anims.create({
      key: "ant-token-spin",
      frames: [
        { key: "ant-token", frame: "spin1" },
        { key: "ant-token", frame: "spin2" },
        { key: "ant-token", frame: "spin3" },
        { key: "ant-token", frame: "spin4" },
      ],
      frameRate: 4,
      repeat: -1,
    });
    scene.anims.create({
      key: "dev-portal-swirl",
      frames: scene.anims.generateFrameNames("dev-portal", { prefix: "portal", start: 1, end: 4 }),
      frameRate: 6,
      repeat: -1,
    });

    let pipeline = new ElectricPipeline(this.game);
    this.renderer.pipelines.add('Electric', pipeline);
    let pipeline2 = new ElectricPipeline2(this.game);
    this.renderer.pipelines.add('Electric2', pipeline2);

    this.scene.start("TitleScreen");
  }
}
