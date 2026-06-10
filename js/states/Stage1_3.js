class Stage1_3 extends Phaser.Scene {
  constructor() {
    super({ key: "Stage1_3" });
  }

  preload() {
    scene = this;
  }

  create() {
    this.sound.stopAll();
    this.sound.play("Level1MusicLoop", { loop: true });

    // Make sure the teardrop texture exists before the HUD tries to show it
    if (typeof SeedOfDestruction !== "undefined" && SeedOfDestruction.ensureTexture) {
      SeedOfDestruction.ensureTexture(this);
    }
    // Pink sunset sky — camera background
    this.cameras.main.setBackgroundColor("#f5a8b8");

    this.map = this.make.tilemap({
      key: "stage1_3",
      tileWidth: 16,
      tileHeight: 16,
    });
    const tileset = this.map.addTilesetImage("custom-city-tiles");

    this.backgroundLayer = this.map.createLayer("BackgroundLayer", tileset);
    this.groundLayer = this.map.createLayer("GroundLayer", tileset);
    this.enemyStopBlocksLayer = this.map.createLayer("EnemyStopBlocks", tileset);
    this.deathBlocksLayer = this.map.createLayer("DeathBlocksLayer", tileset);
    this.sceneChangeLayer = this.map.createLayer("SceneChangeLayer", tileset);

    // Horizon sun — fixed parallax behind everything
    this.sun = this.add.circle(320, 88, 28, 0xfff0a8);
    this.sun.setScrollFactor(0.2);
    this.sun.setDepth(-10);

    // Blue brick ground — solid bar along the invisible-floor row
    // Floor is at tile row 11 (y=176). Paint a brick-blue block from y=176 down.
    this.groundVisual = this.add.rectangle(
      this.map.widthInPixels / 2, 216,
      this.map.widthInPixels, 80,
      0x3a5a8c
    );
    this.groundVisual.setDepth(1);
    // Subtle brick seam every 32px for texture
    for (let bx = 0; bx < this.map.widthInPixels; bx += 32) {
      const seam = this.add.rectangle(bx, 216, 1, 80, 0x2a416a);
      seam.setDepth(2);
    }

    this.enemyStopBlocksLayer.setAlpha(0);
    this.deathBlocksLayer.setAlpha(0);
    this.sceneChangeLayer.setAlpha(0);

    this.groundLayer.setCollisionByExclusion(-1);
    this.deathBlocksLayer.setCollisionByExclusion(-1);
    this.sceneChangeLayer.setCollisionByExclusion(-1);
    this.enemyStopBlocksLayer.setCollisionByExclusion(-1);

    this.bullets = this.physics.add.group();
    this.collectibles = this.physics.add.group();
    this.enemies = this.add.group();
    this.enemyProjectiles = this.physics.add.group();

    // Tilemap-driven spawns
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
    this.map.createFromObjects("BushZomberryLayer", {
      name: "BushZomberry",
      key: "raspberry",
      classType: BushZomberry,
    });
    // HornedFruit are no longer spawned from the tilemap; each
    // Rocket-Axe fruit-platform owns its own cluster (see _buildFruitPlatforms).
    this.map.createFromObjects("WatermelonSnapperLayer", {
      name: "WatermelonSnapper",
      key: "watermelon-snapper",
      classType: WatermelonSnapper,
    });

    // Jammy
    if (this.jammyData) {
      this.jammy = new Jammy(
        this.jammyData.nextX,
        this.jammyData.nextY,
        this.jammyData.hp,
        this.jammyData.facing
      );
    } else {
      this.jammy = new Jammy(60, 100);
    }
    this.jammy.sprite.setDepth(100);
    this.jammy.controlsEnabled = true;
    this.children.bringToTop(this.jammy.sprite);

    this.cameras.main.startFollow(this.jammy.sprite);
    // Extra 240px of vertical headroom so the camera follows Jammy up
    // during a Rocket Axe boost instead of leaving him off the top edge.
    this.cameras.main.setBounds(
      0,
      -240,
      this.map.widthInPixels,
      this.map.heightInPixels + 240
    );

    // Collisions
    this.physics.add.overlap(
      this.jammy.sprite,
      this.collectibles,
      (jammy, collectible) => {
        collectible.effect();
      }
    );
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

    // Bullets vs ground — AudioWaves don't currently collide with ground, so skip

    // Decoy bushes — visually identical to BushZomberry bushes but empty.
    // Mixed in so the player can't tell by sight alone; Blubert's eyes
    // reveal the real ones.
    this.decoyBushes = [
      new Bush(this, 540, 176),
      new Bush(this, 1360, 176),
      new Bush(this, 1900, 176),
      new Bush(this, 2280, 176),
    ];

    // Sky clouds — some pure decoys, some hiding blueberry drones that
    // emerge and alternate between bomb-drops and dive-bombs.
    this.decoyClouds = [
      new Cloud(this, 320, 56),
      new Cloud(this, 900, 48),
      new Cloud(this, 1480, 60),
      new Cloud(this, 2000, 52),
      new Cloud(this, 2380, 58),
    ];
    // Blueberry-bearing clouds — these create their own cover cloud
    this.cloudBlueberries = [
      new CloudBlueberry(this, 760, 56),
      new CloudBlueberry(this, 1640, 52),
      new CloudBlueberry(this, 2240, 58),
    ];
    this.cloudBlueberries.forEach(b => this.enemies.add(b));

    // Seed-ammo pickups — scarce on purpose so the player budgets shots.
    // One pre-first-bush, one mid-run, one late.
    this.seedPickups = [
      new SeedAmmoPickup(this, 300,  128),
      new SeedAmmoPickup(this, 1260, 128),
      new SeedAmmoPickup(this, 2340, 120),
    ];

    // Fruit-platforms — each solid platform bobs vertically and hosts
    // multiple HornedFruit hanging at staggered vine lengths below it.
    this.fruitPlatforms = this.physics.add.group({
      allowGravity: false,
      immovable: true,
    });
    this.physics.add.collider(this.jammy.sprite, this.fruitPlatforms);
    this.hornedRigs = [];
    this._buildFruitPlatforms();

    // Blubert companion
    this.blubert = new Blubert(this, this.jammy);
    // One revive per stage — the next pickup Jammy grabs after
    // Blubert is disposed brings him back.
    this.blubertRevivesLeft = 1;

    // Sync UI weapon indicator
    const ui = this.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(this.jammy.currentWeapon);
  }

  update() {
    this.jammy.update();
    if (this.blubert) this.blubert.update();
    this.enemies.getChildren().forEach((enemy) => {
      if (enemy.update) enemy.update();
    });
    if (this.hornedRigs) this.hornedRigs.forEach(r => r.update());
  }

  tryReviveBlubert() {
    if (this.blubert || !this.jammy || (this.blubertRevivesLeft || 0) <= 0) return;
    this.blubertRevivesLeft -= 1;
    this.blubert = new Blubert(this, this.jammy);
    // Small pop-in so the revive reads
    if (this.blubert.sprite) {
      this.blubert.sprite.setScale(0.2);
      this.blubert.sprite.setAlpha(0.2);
      this.tweens.add({
        targets: this.blubert.sprite,
        scaleX: 1, scaleY: 1, alpha: 1,
        duration: 260, ease: "Back.easeOut",
      });
    }
  }

  _buildFruitPlatforms() {
    // Each platform is a solid bar Jammy can land on, bobbing up/down,
    // with several horned fruits hanging from its underside at varying
    // vine lengths. fruits[].ox is horizontal offset from platform
    // center; fruits[].len is the vine length at rest.
    const platforms = [
      { x: 640,  y: 74,  w: 74, amp: 20, period: 2400,
        fruits: [{ox: -26, len: 32}, {ox: 0, len: 58}, {ox: 24, len: 40}] },
      { x: 1480, y: 86,  w: 92, amp: 24, period: 2800,
        fruits: [{ox: -32, len: 48}, {ox: -8, len: 28}, {ox: 18, len: 66}, {ox: 36, len: 36}] },
      { x: 2200, y: 62,  w: 108, amp: 22, period: 2200,
        fruits: [{ox: -40, len: 72}, {ox: -14, len: 42}, {ox: 12, len: 56}, {ox: 40, len: 28}] },
    ];
    platforms.forEach((cfg, pi) => this._buildFruitPlatform(cfg, pi));
  }

  _buildFruitPlatform(cfg, index) {
    const { x, y, w, amp, period, fruits } = cfg;
    // Solid wooden platform
    const plat = this.add.rectangle(x, y, w, 6, 0x8b6f4a);
    plat.setDepth(54);
    this.physics.add.existing(plat);
    plat.body.setAllowGravity(false);
    plat.body.setImmovable(true);
    // One-way platform: only the top face blocks. Jammy can jump up
    // through from below and pass sideways; landing from above lands.
    plat.body.checkCollision.down = false;
    plat.body.checkCollision.left = false;
    plat.body.checkCollision.right = false;
    this.fruitPlatforms.add(plat);
    // Top capstone (visual only, no physics)
    const cap = this.add.rectangle(x, y - 3, w, 2, 0x6a5432);
    cap.setDepth(55);

    // Vine graphics for the whole cluster
    const vineGfx = this.add.graphics();
    vineGfx.setDepth(53);

    // Spawn the hanging fruits. HornedFruit constructor adds the sprite
    // to scene/enemies; setPosition captures baseY for its sin-bob.
    const hfs = fruits.map(f => {
      const hf = new HornedFruit(this);
      hf.setPosition(x + f.ox, y + f.len);
      hf.setDepth(53);
      return { hf, ox: f.ox, len: f.len };
    });

    // Stagger phases between platforms so they don't all dip in sync
    const phase = index * 600;
    const startTime = this.time.now - phase;
    const baseY = y;

    const rig = {
      update: () => {
        const t = (this.time.now - startTime) / period;
        const py = baseY + Math.sin(t * Math.PI * 2) * amp;
        plat.y = py;
        cap.y = py - 3;
        // Refresh the body manually so the collider tracks the moved
        // position (immovable bodies don't auto-sync from velocity).
        if (plat.body && typeof plat.body.updateFromGameObject === "function") {
          plat.body.updateFromGameObject();
        }

        vineGfx.clear();
        for (const { hf, ox, len } of hfs) {
          if (!hf || !hf.scene) continue;
          const fx = x + ox;
          if (!hf.dropped) {
            hf.x = fx;
            hf.y = py + len;
            hf.baseY = hf.y;
          }
          // Only draw vine if fruit still hanging
          if (!hf.dropped) {
            const topY = py + 3;
            const botY = hf.y - 6;
            vineGfx.lineStyle(2, 0x2f6a2a, 1);
            vineGfx.beginPath();
            vineGfx.moveTo(fx, topY);
            vineGfx.lineTo(fx, botY);
            vineGfx.strokePath();
            // Thorns
            vineGfx.fillStyle(0x2f6a2a, 1);
            const vineLen = botY - topY;
            const steps = Math.max(3, Math.floor(vineLen / 6));
            for (let s = 1; s < steps; s++) {
              const ty = topY + (vineLen * s) / steps;
              const side = s % 2 === 0 ? -1 : 1;
              vineGfx.fillTriangle(
                fx, ty,
                fx + side * 4, ty - 2,
                fx + side * 4, ty + 2
              );
            }
          }
        }
      },
    };
    this.hornedRigs.push(rig);
  }

  changeScene() {
    // Onward to the fortress stage — The Jam Works
    this.scene.start("Stage1_4");
  }
}
