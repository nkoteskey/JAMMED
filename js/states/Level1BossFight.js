class Level1BossFight extends Phaser.Scene {
  constructor() {
    super({ key: "Level1BossFight" });
  }

  preload() {
    scene = this;
  }

  create() {
    this._changing = false;

    // Stop all existing sounds and play boss battle music
    this.sound.stopAll();
    this.sound.play("BossBattle", { loop: true });

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
    const tilesets = [customCityTiles, theaterTiles];

    // Create layers from the tilemap
    this.backgroundLayer = this.map.createLayer("BackgroundLayer", tilesets);
    this.groundLayer = this.map.createLayer("GroundLayer", tilesets);
    this.enemyStopBlocksLayer = this.map.createLayer("EnemyStopBlocks", tilesets);
    this.deathBlocksLayer = this.map.createLayer("DeathBlocksLayer", tilesets);

    this.enemyStopBlocksLayer.setAlpha(0);
    this.deathBlocksLayer.setAlpha(0);

    this.groundLayer.setCollisionByExclusion(-1);
    this.enemyStopBlocksLayer.setCollisionByExclusion(-1);
    this.deathBlocksLayer.setCollisionByExclusion(-1);

    LevelCommon.createGroups(this);

    // Add boss enemy from tilemap as game object
    this.map.createFromObjects("WatermelonBossLayer", {
      name: "watermelonBoss",
      key: "watermelon-boss",
      classType: WatermelonBoss,
    });
    this.boss = this.enemies.getChildren().find((e) => e instanceof WatermelonBoss) || null;

    // Boss lifebar (top-right, under the weapon indicator)
    this.bossLifebar = {
      guts: this.add
        .image(this.cameras.main.width - 10, 30, "bossLifebar-guts")
        .setOrigin(1, 0)
        .setScrollFactor(0)
        .setDepth(400),
      outline: this.add
        .image(this.cameras.main.width - 10, 30, "bossLifebar-outline")
        .setOrigin(1, 0)
        .setScrollFactor(0)
        .setDepth(400),
    };
    this.bossLifebar.crop = new Phaser.Geom.Rectangle(0, 0, 91, 12);
    this.bossLabel = this.add
      .bitmapText(this.cameras.main.width - 10, 44, "tempFont", "WATERMELON", 8)
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setDepth(400)
      .setTintFill(0xff8080);

    // Create and configure Jammy
    this.jammy = new Jammy(50, 50);
    this.jammy.sprite.setDepth(100);

    // Single-screen arena: no camera follow, but keep Jammy inside it
    this.jammy.sprite.setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);

    LevelCommon.wireCollisions(this);

    // Seeds hurt on contact; touching the boss hurts too
    this.physics.add.overlap(this.jammy.sprite, this.enemyProjectiles, (jammySprite, projectile) => {
      if (!this.jammy.alive) return;
      this.jammy.takeDamage(projectile.x);
      if (projectile.die) projectile.die();
      else projectile.destroy();
    });
    // Overlap, not a collider: an immovable boss landing on Jammy used
    // to shove him straight through the floor.
    this.physics.add.overlap(this.jammy.sprite, this.enemies, (jammySprite, enemy) => {
      if (enemy.dead || !enemy.alive) return;
      this.jammy.takeDamage(enemy.x);
    });

    LevelCommon.registerStage(this, 0);
    this._showTitleCard();

    const ui = this.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(this.jammy.currentWeapon);
  }

  update() {
    this.jammy.update();
    this.enemies.getChildren().forEach((enemy) => {
      if (enemy.update) enemy.update();
    });

    // Update boss lifebar
    const boss = this.boss;
    if (boss && boss.active) {
      const hp = Math.max(0, boss.hp);
      this.bossLifebar.crop.width = Math.round((91 / boss.maxHP) * hp);
      this.bossLifebar.guts.setCrop(this.bossLifebar.crop);
    }
  }

  _showTitleCard() {
    const t1 = this.add
      .bitmapText(213, 92, "tempFont", "STAGE 1-2", 16)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300)
      .setTintFill(0xffffff);
    const t2 = this.add
      .bitmapText(213, 114, "tempFont", "THE THEATER", 12)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300)
      .setTintFill(0xff8080);
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

  // Called by the boss when it dies
  bossDefeated() {
    if (this._changing) return;
    // Celebrate: Jammy is safe from anything still flying around
    this.jammy.invincible = true;
    // Beating the Watermelon earns the Rocket Axe — from here on the
    // guitar doubles as a booster for the rest of the game.
    const run = getRunState();
    if (run) run.rocketAxe = true;
    this.enemyProjectiles.getChildren().forEach((p) => p.destroy());
    this.time.delayedCall(1600, () => {
      LevelCommon.finishStage(this, "CutSceneWatermelonDefeated");
    });
  }
}
