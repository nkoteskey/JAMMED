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
      this.jammy = new Jammy(132, 100);
    }
    this.jammy.sprite.setDepth(100);
    this.jammy.controlsEnabled = true;
    this.children.bringToTop(this.jammy.sprite);

    // Make the camera follow Jammy
    this.cameras.main.startFollow(this.jammy.sprite);
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

    // Dev teleport portal — walk into it to warp straight to Stage 1-3
    this.devPortal = this.physics.add.sprite(200, 168, "dev-portal", "portal1");
    this.devPortal.body.setAllowGravity(false);
    this.devPortal.body.setImmovable(true);
    this.devPortal.setDepth(50);
    this.devPortal.play("dev-portal-swirl");
    this.add.bitmapText(this.devPortal.x - 24, this.devPortal.y - 22, "tempFont", "DEV->1-3", 8)
      .setTintFill(0xffccff);
    this._teleporting = false;
    this.physics.add.overlap(this.jammy.sprite, this.devPortal, () => {
      if (this._teleporting) return;
      this._teleporting = true;
      this.devPortal.destroy();
      this.time.delayedCall(10, () => this.scene.start("Stage1_3"));
    });

    // Second dev portal — warp straight to Stage 1-4 (The Jam Works).
    // Left of Jammy's spawn so walking right still reaches the 1-3
    // portal without crossing this one.
    this.devPortal2 = this.physics.add.sprite(84, 168, "dev-portal", "portal1");
    this.devPortal2.body.setAllowGravity(false);
    this.devPortal2.body.setImmovable(true);
    this.devPortal2.setDepth(50);
    this.devPortal2.setTint(0xffb86b);
    this.devPortal2.play("dev-portal-swirl");
    this.add.bitmapText(this.devPortal2.x - 24, this.devPortal2.y - 22, "tempFont", "DEV->1-4", 8)
      .setTintFill(0xffd9a0);
    this.physics.add.overlap(this.jammy.sprite, this.devPortal2, () => {
      if (this._teleporting) return;
      this._teleporting = true;
      this.devPortal2.destroy();
      this.time.delayedCall(10, () => this.scene.start("Stage1_4"));
    });

    // Sync UI weapon indicator with Jammy's starting weapon
    const ui = this.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(this.jammy.currentWeapon);
  }

  update() {
    this.jammy.update();
    if (this.blubert) this.blubert.update();
    this.enemies.getChildren().forEach((enemy) => {
      if (enemy.update) {
        enemy.update();
      }
    });
  }

  changeScene() {
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
