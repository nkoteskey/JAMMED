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
    this._breadTotal = 0; // scene instances persist across restart()
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
    initCheckpoints(this, [[904,176],[1800,176],[2696,176],[3624,176],[4296,176]], 176);

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
    // The stage's one hidden ANT token (marked by an x0x tag)
    new AntSecret(this, 330, 96);


    // Stage progression is handled by the Stage Select menu on the
    // title screen now — no debug portals cluttering the first screen
    // a player ever sees.

    // Concentrate, Inc. is already in the city — Drip billboards over
    // the skyline, and the murmur's glyph if you know where to look.
    // Planted on verified flat rooftops (posts land on the roof)
    // rather than floating across a building facade.
    addDripBillboard(this, 1960, 73);
    // Second sign planted on an open stretch of street, legs down to
    // the pavement — the rooftop spot sat above the normal camera
    // view, so it was only visible if you happened to climb up there.
    addDripBillboard(this, 1536, 104, { groundY: 176 });
    ensureX0XTexture(this);
    addX0XTag(this, 330, 150, { depth: 1 });

    // Sync UI weapon indicator with Jammy's starting weapon
    // Anything already killed stays killed across a checkpoint respawn
    trackEnemyDeaths(this);

    const ui = this.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(this.jammy.currentWeapon);
    if (ui && ui.setBread) ui.setBread(BreadToken.collectedIn(this), this._breadTotal || 5);
    if (ui && ui.setAnts) ui.setAnts(AntSecret.count(), AntSecret.TOTAL);
  }

  update() {
    this.jammy.update();
    updatePlatformerCamera(this, this.jammy);
    updateX0XTags(this, this.jammy);
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
