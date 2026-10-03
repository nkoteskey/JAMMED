class Level1 extends Phaser.Scene {
  constructor() {
    super({ key: "Level1" });
  }

  preload() {
    scene = this;
  }

  create() {
    this._changing = false;

    // Start music and sound effects
    this.sound.stopAll();
    this.sound.play("Level1MusicLoop", { loop: true });
    // Set the background color
    this.cameras.main.setBackgroundColor("#940084");

    // Add the tilemap
    this.map = this.make.tilemap({
      key: "level1Alt",
      tileWidth: 16,
      tileHeight: 16,
    });
    const tileset = this.map.addTilesetImage("custom-city-tiles");
    // Create layers from tilemap
    this.backgroundLayer = this.map.createLayer("BackgroundLayer", tileset);
    this.groundLayer = this.map.createLayer("GroundLayer", tileset);
    this.enemyStopBlocksLayer = this.map.createLayer("EnemyStopBlocks", tileset);
    this.deathBlocksLayer = this.map.createLayer("DeathBlocksLayer", tileset);
    this.sceneChangeLayer = this.map.createLayer("SceneChangeLayer", tileset);

    // Make invisible layers transparent
    this.enemyStopBlocksLayer.setAlpha(0);
    this.deathBlocksLayer.setAlpha(0);
    this.sceneChangeLayer.setAlpha(0);

    // Enable collision on layers
    this.groundLayer.setCollisionByExclusion(-1);
    this.deathBlocksLayer.setCollisionByExclusion(-1);
    this.sceneChangeLayer.setCollisionByExclusion(-1);
    this.enemyStopBlocksLayer.setCollisionByExclusion(-1);

    LevelCommon.createGroups(this);

    // Convert tiles into game objects
    this.map.createFromObjects("PowerUpsLayer", {
      name: "PowerUp",
      key: "power-up",
      classType: PowerUp,
    });
    this.map.createFromObjects("AntTokenLayer", {
      key: "ant-token",
      classType: AntToken,
    });
    this.map.createFromObjects("RaspberryLayer", {
      name: "Raspberry",
      key: "raspberry",
      classType: Raspberry,
    });
    this.map.createFromObjects("BlueberryLayer", {
      key: "blueberry",
      classType: Blueberry,
    });
    this.map.createFromObjects("PineappleLayer", {
      name: "Pineapple",
      key: "pineapple-bomb",
      classType: Pineapple,
    });

    // Create the foreground layer
    this.foreGroundLayer = this.map.createLayer("ForegroundLayer", tileset);

    // Create and configure Jammy
    this.jammy = new Jammy(132, 100);
    this.jammy.sprite.setDepth(100);
    this.children.bringToTop(this.jammy.sprite);

    // Make the camera follow Jammy — with vertical headroom so the
    // Rocket Axe boost stays in frame.
    this.cameras.main.startFollow(this.jammy.sprite);
    this.cameras.main.setBounds(0, -240, this.map.widthInPixels, this.map.heightInPixels + 240);

    LevelCommon.wireCollisions(this, { onSceneChange: () => this.changeScene() });

    // Lost Jam: tucked on the little ledge above the start — the classic
    // "walk left first" secret.
    new LostRecord(this, 40, 84, "Level1");

    // Blubert companion — follows Jammy, locks onto threats
    this.blubert = new Blubert(this, this.jammy);
    this.blubertRevivesLeft = 1;

    // Dev teleport portals (only with ?dev in the URL)
    if (this.game.devMode) {
      LevelCommon.addDevPortal(this, 200, 168, "Stage1_3", "DEV->1-3");
      LevelCommon.addDevPortal(this, 84, 168, "Stage1_4", "DEV->1-4", 0xffb86b);
      LevelCommon.addDevPortal(this, 260, 168, "Level1BossFight", "DEV->BOSS", 0xff6b6b);
      LevelCommon.addDevPortal(this, 320, 168, "Stage1_S", "DEV->1-S", 0x8ce070);
      LevelCommon.addDevPortal(this, 380, 168, "Stage1_4Boss", "DEV->1-5", 0xff8fb3);
    }

    LevelCommon.registerStage(this);
    this._showTitleCard();

    // Sync UI weapon indicator with Jammy's starting weapon
    const ui = this.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(this.jammy.currentWeapon);
  }

  update() {
    this.jammy.update();
    if (this.blubert) this.blubert.update();
    this.enemies.getChildren().forEach((enemy) => {
      if (enemy.update) enemy.update();
    });
  }

  tryReviveBlubert() {
    LevelCommon.tryReviveBlubert(this);
  }

  _showTitleCard() {
    const t1 = this.add
      .bitmapText(213, 92, "tempFont", "STAGE 1-1", 16)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300)
      .setTintFill(0xffffff);
    const t2 = this.add
      .bitmapText(213, 114, "tempFont", "LOS JAMGELES", 12)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300)
      .setTintFill(0xf8a4c0);
    this.tweens.add({
      targets: [t1, t2],
      alpha: 0,
      delay: 1700,
      duration: 600,
      onComplete: () => {
        t1.destroy();
        t2.destroy();
      },
    });
  }

  changeScene() {
    // Straight into the theater — the boss is waiting, so no results
    // card here; the stage is scored once the Watermelon falls.
    LevelCommon.finishStage(this, "Level1BossFight", { card: false });
  }
}
