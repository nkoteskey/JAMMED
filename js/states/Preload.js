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

    // Fonts are drawn in code (js/helpers/pixelfont.js) — see create()

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
      "bread-token",
      "assets/img/sprites/bread-token/bread-token.png",
      "assets/img/sprites/bread-token/bread-token.json"
    );
    this.load.image("bread-token-hud", "assets/img/sprites/bread-token/hud/bread-token-hud.png");
    this.load.image("bread-token-outline-hud", "assets/img/sprites/bread-token/hud/bread-token-outline-hud.png");
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
    // One clean pixel font for everything, under both historical names
    installPixelFont(this, "tempFont");
    installPixelFont(this, "8-bit-mono");
    // Code-written chiptunes (Cloud Waltz) render in the background
    CHIPTUNE.install(this);

    // Jammy's guitar changes finish with the equipped weapon: build the
    // recoloured sprite sheets, then one animation set per finish.
    buildJammySkins(this);
    createJammyAnims(this, "jammy", "jammy-rocketaxe", "");
    Object.keys(JAMMY_SKINS).forEach((skin) => {
      createJammyAnims(this, "jammy-" + skin, "jammy-rocketaxe-" + skin, skin + ":");
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
      key: "bread-token-shimmer",
      frames: [1, 2, 3, 4, 5].map((i) => ({ key: "bread-token", frame: "shimmer" + i })),
      frameRate: 6,
      repeat: -1,
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

// The Flying V's red body (two NES reds) is swapped for each guitar's
// finish: sand for the Seedcaster, purple for the Royal Bass, ice for
// the Glacier Slide. Everything else about Jammy stays the same.
const JAMMY_SKINS = {
  seed: { f83800: [0xd8, 0xa8, 0x68], f83500: [0xb0, 0x82, 0x4c] },
  bass: { f83800: [0x50, 0x28, 0xa0], f83500: [0x3a, 0x1c, 0x78] },
  slide: { f83800: [0x8e, 0xd8, 0xf8], f83500: [0x5a, 0xb0, 0xe0] },
};

function buildJammySkins(scene) {
  // Only the guitar changes colour: for each frame, flood-fill from the
  // neck (ac7c00) through guitar colours and repaint just those pixels.
  // Jammy's shoes and hat use the same red and must stay red.
  const GUITAR = { ac7c00: 1, ae7d00: 1, f83800: 1, f83500: 1, e40058: 1 };
  const recolor = (srcKey, dstKey, map) => {
    if (scene.textures.exists(dstKey)) return;
    const base = scene.textures.get(srcKey);
    const img = base.getSourceImage();
    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    try {
      const W = canvas.width;
      const id = ctx.getImageData(0, 0, W, canvas.height);
      const d = id.data;
      const hexAt = (i) =>
        d[i].toString(16).padStart(2, "0") + d[i + 1].toString(16).padStart(2, "0") + d[i + 2].toString(16).padStart(2, "0");
      base.getFrameNames().forEach((n) => {
        const f = base.get(n);
        const x0 = f.cutX, y0 = f.cutY, x1 = x0 + f.cutWidth, y1 = y0 + f.cutHeight;
        const seen = new Set();
        const stack = [];
        for (let y = y0; y < y1; y++) {
          for (let x = x0; x < x1; x++) {
            const i = (y * W + x) * 4;
            if (d[i + 3] > 0 && (hexAt(i) === "ac7c00" || hexAt(i) === "ae7d00")) stack.push(y * W + x);
          }
        }
        while (stack.length) {
          const p = stack.pop();
          if (seen.has(p)) continue;
          seen.add(p);
          const x = p % W, y = (p - x) / W;
          const i = p * 4;
          if (d[i + 3] === 0) continue;
          const hex = hexAt(i);
          if (!GUITAR[hex]) continue;
          const to = map[hex];
          if (to) {
            d[i] = to[0];
            d[i + 1] = to[1];
            d[i + 2] = to[2];
          }
          if (x > x0) stack.push(p - 1);
          if (x < x1 - 1) stack.push(p + 1);
          if (y > y0) stack.push(p - W);
          if (y < y1 - 1) stack.push(p + W);
        }
      });
      ctx.putImageData(id, 0, 0);
    } catch (e) {
      // Canvas tainted (e.g. file://): keep the plain copy
    }
    const tex = scene.textures.addCanvas(dstKey, canvas);
    tex.setFilter(Phaser.Textures.FilterMode.NEAREST);
    base.getFrameNames().forEach((n) => {
      const f = base.get(n);
      tex.add(n, 0, f.cutX, f.cutY, f.cutWidth, f.cutHeight);
    });
  };
  Object.keys(JAMMY_SKINS).forEach((skin) => {
    const map = Object.assign({ e40058: JAMMY_SKINS[skin].f83500 }, JAMMY_SKINS[skin]);
    recolor("jammy", "jammy-" + skin, map);
    recolor("jammy-rocketaxe", "jammy-rocketaxe-" + skin, map);
  });
}

// One full animation set for a Jammy sprite sheet. `prefix` namespaces
// the keys ("" for the base Flying V, "seed:" etc. for finishes).
function createJammyAnims(scene, tex, rocketTex, prefix) {
  const mk = (key, cfg) => {
    if (scene.anims.exists(prefix + key)) return;
    scene.anims.create(Object.assign({ key: prefix + key }, cfg));
  };
  const names = (p, start, end) => scene.anims.generateFrameNames(tex, { start, end, prefix: p });
  mk("resting-right", { frames: names("resting-right", 1, 4), frameRate: 4, repeat: -1 });
  mk("resting-left", { frames: names("resting-left", 1, 4), frameRate: 4, repeat: -1 });
  mk("running-right", { frames: names("running-right", 1, 8), frameRate: 10, repeat: -1 });
  mk("running-left", { frames: names("running-left", 1, 8), frameRate: 10, repeat: -1 });
  mk("jumping-right", { frames: names("running-right", 2, 2), frameRate: 1, repeat: -1 });
  mk("jumping-left", { frames: names("running-left", 2, 2), frameRate: 1, repeat: -1 });
  mk("shooting-right", { frames: names("shooting-right", 1, 1), frameRate: 10, repeat: -1 });
  mk("shooting-left", { frames: names("shooting-left", 1, 1), frameRate: 10, repeat: -1 });
  mk("taking-damage-left", { frames: names("taking-damage-left", 1, 1), frameRate: 10, repeat: -1 });
  mk("taking-damage-right", { frames: names("taking-damage-right", 1, 1), frameRate: 10, repeat: -1 });
  mk("dead-right", { frames: names("dead-right", 1, 1), frameRate: 1, repeat: -1 });
  mk("dead-left", { frames: names("dead-left", 1, 1), frameRate: 1, repeat: -1 });
  mk("jammy-rocketaxe-right", {
    frames: scene.anims.generateFrameNames(rocketTex, { start: 1, end: 4, prefix: "rocketaxe-right" }),
    frameRate: 14,
    repeat: -1,
  });
}
