class Level1 extends Phaser.Scene {
  constructor() {
    super({ key: "Level1" });
  }

  preload() {
    // Load necessary assets here if needed
    scene = this;
  }

  create() {
    // Start music and sound effects
    
    this.sound.stopAll();
    
    if (typeof Chip !== "undefined") Chip.stop();
    Chip.play("city");
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
    this.enemyStopBlocksLayer = this.map.createLayer(
      "EnemyStopBlocks",
      tileset
    );
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

    // Create groups for bullets, enemies, collectibles, and enemy projectiles
    this.bullets = this.physics.add.group();
    this.collectibles = this.physics.add.group();
    this.enemies = this.add.group();
    this.enemyProjectiles = this.physics.add.group();

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
      key: "pineapple",
      classType: Pineapple,
    });

    // Create the foreground layer
    this.foreGroundLayer = this.map.createLayer("ForegroundLayer", tileset);

    // Enable controls

    // Update HUD lifebar

    // Create and configure Jammy
    if (this.jammyData) {
      this.jammy = new Jammy(
        this.jammyData.nextX,
        this.jammyData.nextY,
        this.jammyData.hp,
        this.jammyData.velX,
        this.jammyData.velY,
        this.jammyData.facing,
        this.jammyData.levelTokensCollected
      );
    } else {
      this.jammy = new Jammy(checkpointSpawn(this, 132, 100).x, checkpointSpawn(this, 132, 100).y);
    }
    this.jammy.sprite.setDepth(100);
    this.jammy.controlsEnabled = true;
    this.children.bringToTop(this.jammy.sprite);

    // Checkpoints — x0x relay posts the murmur remembers you at
    initCheckpoints(this, [[900,176],[1900,176],[2900,176],[3900,176]], 176);

    // Make the camera follow Jammy
    setupPlatformerCamera(this, this.jammy, {});
    // Vertical headroom so the Rocket Axe boost stays in frame.
    this.cameras.main.setBounds(
      0,
      -240,
      this.map.widthInPixels,
      this.map.heightInPixels + 240
    );
    // Check for collectibles and award tokens
    this.physics.add.overlap(
      this.jammy.sprite,
      this.collectibles,
      (jammy, collectible) => {
        collectible.effect();
      }
    );

    //create collision between Jammy and tilemap

    this.physics.add.collider(this.jammy.sprite, this.groundLayer);
    this.physics.add.collider(this.jammy.sprite, this.deathBlocksLayer, () =>
      this.jammy.instantDeath()
    );
    this.physics.add.collider(this.jammy.sprite, this.sceneChangeLayer, () =>
      this.changeScene()
    );
    this.physics.add.collider(this.collectibles, this.groundLayer);
    this.physics.add.collider(this.enemies, this.groundLayer);
    this.physics.add.collider(this.enemies, this.enemyStopBlocksLayer);

    // Blubert companion — follows Jammy, scans for hidden zomberries
    this.blubert = new Blubert(this, this.jammy);

    // Stage progression is handled by the Stage Select menu on the
    // title screen now — no debug portals cluttering the first screen
    // a player ever sees.

    // Concentrate, Inc. is already in the city — Drip billboards over
    // the skyline, and the murmur's glyph if you know where to look.
    addDripBillboard(this, 620, 60);
    addDripBillboard(this, 1500, 56);
    ensureX0XTexture(this);
    this.add.image(330, 150, "x0x-glyph").setDepth(1);

    // Sync UI weapon indicator with Jammy's starting weapon
    const ui = this.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(this.jammy.currentWeapon);
  }

  update() {
    this.jammy.update();
    updatePlatformerCamera(this, this.jammy);
    if (this.blubert) this.blubert.update();
    this.enemies.getChildren().forEach((enemy) => {
      if (enemy.update) {
        enemy.update();
      }
    });
  }

  changeScene() {

    clearCheckpoints(this);
    this.scene.start("Level1BossFight");
  }

  getJammyQuadrant() {
    const worldWidth = this.cameras.main.width;
    const worldHeight = this.cameras.main.height;

    if (this.jammy.x < worldWidth / 2 && this.jammy.y < worldHeight / 2)
      return 1;
    if (this.jammy.x > worldWidth / 2 && this.jammy.y < worldHeight / 2)
      return 2;
    if (this.jammy.x < worldWidth / 2 && this.jammy.y > worldHeight / 2)
      return 3;
    return 4;
  }
}
