class Level1BossFight extends Phaser.Scene {
  constructor() {
    super({ key: "Level1BossFight" });
  }

  preload() {
    scene = this;
    // Preload any assets specific to the boss fight here if needed
  }

  create() {
  
    // Stop all existing sounds and play boss battle music
    this.sound.stopAll();
    if (typeof Chip !== "undefined") Chip.stop();
    Chip.play("boss");
    // Set background color
    this.cameras.main.setBackgroundColor("#000000");

    // Load tilemap and tilesets
    this.map = this.make.tilemap({
      key: "level1BossFight",
      tileWidth: 16,
      tileHeight: 16,
    });
    const customCityTiles = this.map.addTilesetImage("custom-city-tiles");
    const theaterTiles = this.map.addTilesetImage("theater-tiles");

    // Create layers from the tilemap
    this.backgroundLayer = this.map.createLayer("BackgroundLayer", [
      customCityTiles,
      theaterTiles,
    ]);
    this.groundLayer = this.map.createLayer("GroundLayer", [
      customCityTiles,
      theaterTiles,
    ]);
    this.enemyStopBlocksLayer = this.map.createLayer("EnemyStopBlocks", [
      customCityTiles,
      theaterTiles,
    ]);
    this.deathBlocksLayer = this.map.createLayer("DeathBlocksLayer", [
      customCityTiles,
      theaterTiles,
    ]);
    this.sceneChangeLayer = this.map.createLayer("SceneChangeLayer", [
      customCityTiles,
      theaterTiles,
    ]);

    // Set transparent layers to invisible
    this.enemyStopBlocksLayer.setAlpha(0);
    this.deathBlocksLayer.setAlpha(0);
    this.sceneChangeLayer.setAlpha(0);

    // Enable collisions on layers
    this.groundLayer.setCollisionByExclusion(-1);
    this.enemyStopBlocksLayer.setCollisionByExclusion(-1);
    this.deathBlocksLayer.setCollisionByExclusion(-1);
    this.sceneChangeLayer.setCollisionByExclusion(-1);

    // Create groups for bullets, enemies, and enemy projectiles
    this.bullets = this.physics.add.group();
    this.enemies = this.add.group();
    this.enemyProjectiles = this.add.group();



    // Add boss enemy from tilemap as game object
    this.map.createFromObjects("WatermelonBossLayer", {
      name: "watermelonBoss",
      key: "watermelon-boss",
      classType: WatermelonBoss,
    });

    // Add boss lifebar to HUD
    this.bossLifebar = {
      guts: this.add
        .image(this.cameras.main.width - 104, 8, "bossLifebar-guts")
        .setScrollFactor(0),
      outline: this.add
        .image(this.cameras.main.width - 104, 8, "bossLifebar-outline")
        .setScrollFactor(0),
    };
    this.bossLifebar.crop = new Phaser.Geom.Rectangle(
      0,
      0,
      0,
      this.bossLifebar.guts.height
    );

    // Create and configure Jammy

   this.jammy = new Jammy(50, 50);

    this.jammy.sprite.setDepth(100);
    this.jammy.controlsEnabled = true;

    // Make the camera follow Jammy
    //this.cameras.main.startFollow(this.jammy.sprite);
    //this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    // Collision handling between Jammy and tilemap
    this.physics.add.collider(this.jammy.sprite, this.groundLayer);

    this.physics.add.collider(this.jammy.sprite, this.sceneChangeLayer, () =>
      this.changeScene()
    );
    this.physics.add.collider(this.enemies, this.groundLayer);
    this.physics.add.collider(this.enemies, this.enemyStopBlocksLayer);
    this.physics.add.collider(
      this.enemyProjectiles,
      this.enemyStopBlocksLayer,
      function (projectile, block) {
        projectile.die();
      },
      null,
      this
    );

    //SET UP JAMMY COLLIDERS
    this.physics.add.collider(this.jammy.sprite, this.enemyProjectiles, (jammy,projectile) => {
      this.jammy.takeDamage();
      projectile.die();

    });

    this.physics.add.collider(this.jammy.sprite, this.enemies, () => {
      this.jammy.takeDamage();
    });

 







    // Set up pause menu and mobile controls if necessary
  


  }

  update() {
    this.jammy.update();
    this.enemies.getChildren().forEach((enemy) => {
      if (enemy.update) enemy.update();
    });

    // Update boss lifebar
    const boss = this.enemies.getChildren()[0];
    if (boss && boss.hp) {
      this.bossLifebar.crop.width = (96 / boss.maxHP) * boss.hp;
      this.bossLifebar.guts.setCrop(this.bossLifebar.crop);
    }

  
  }

  changeScene() {
    // Save Jammy's state for next scene
    this.jammyData = {
      hp: this.jammy.hp,
      x: this.jammy.x,
      y: this.jammy.y,
      nextX: 32,
      nextY: 160,
      velX: this.jammy.sprite.body.velocity.x,
      velY: this.jammy.sprite.body.velocity.y,
      facing: this.jammy.facing,
    };

    // Set next scene
    let nextScene = "CutSceneWatermelonDefeated";
    this.scene.start(nextScene);
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

  updateHUD() {
    // Update the HUD's lifebar or other on-screen indicators as needed
  }

  createMobileControls() {
    // Set up mobile controls for non-desktop devices
  }
}
