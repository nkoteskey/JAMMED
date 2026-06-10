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
    // Deep sunset magenta behind everything (top sky band color)
    this.cameras.main.setBackgroundColor("#c84890");

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

    // The Tiled ground row is collision-only; all visuals are painted
    // fresh below (sky, skyline, meadow tiles).
    this.groundLayer.setAlpha(0);
    this._paintSky();
    this._buildMeadowTiles();

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

    // The Seedcaster guitar — unlocks the seed weapon. Right on the
    // main path before the first bush so nobody misses it.
    new GuitarPickup(this, 240, 152, "desert-seedcaster");

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

    // The Tiled map has no scene-change tiles, so the level exit is a
    // real portal object at the end of the run.
    this._buildExitPortal();
    this._showTitleCard();

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
    // Solid wooden plank platform (pixel-art texture, tiled to width)
    this._ensurePlankTexture();
    const plat = this.add.tileSprite(x, y, w, 8, "wood-platform");
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

  // ------------------------------------------------------------------
  // NES sunset sky: flat color bands pinned to the screen, a posterized
  // sun with horizon cuts, the city skyline far below (this stage sits
  // above the city of Level 1), and a soft cloud bank at the horizon.
  _paintSky() {
    const bands = [
      [0, 70, 0xc84890],
      [70, 115, 0xe06898],
      [115, 150, 0xf5a8b8],
      [150, 240, 0xffc9a0],
    ];
    bands.forEach(([y0, y1, color]) => {
      this.add.rectangle(213, (y0 + y1) / 2, 426, y1 - y0, color)
        .setScrollFactor(0)
        .setDepth(-40);
    });

    // Sun — half-sunk behind the skyline, with sunset stripe cuts
    const sun = this.add.container(330, 132);
    sun.setScrollFactor(0.12, 1);
    sun.setDepth(-37);
    sun.add(this.add.circle(0, 0, 36, 0xffe2a8, 0.4));
    sun.add(this.add.circle(0, 0, 30, 0xffd877));
    sun.add(this.add.circle(0, -4, 24, 0xfff0b0));
    for (let i = 0; i < 3; i++) {
      sun.add(this.add.rectangle(0, 10 + i * 8, 64, 3 - i * 0.5, 0xf5a8b8));
    }

    // Far skyline — a second, paler row of towers behind the near one
    for (let x = 20; x < 980; x += 64) {
      const h = 24 + ((x * 5) % 20);
      this.add.rectangle(x, 176 - h / 2, 30, h, 0xc06090)
        .setScrollFactor(0.14, 1)
        .setDepth(-36);
    }

    // City skyline silhouette — Level 1's city, far below this skyway.
    // Modest heights: only rooftops peek over the horizon line.
    const bld = [
      [0, 40, 30], [36, 26, 26], [70, 48, 34], [110, 30, 22], [136, 58, 38],
      [180, 36, 30], [216, 50, 26], [248, 28, 30], [284, 62, 40], [330, 44, 28],
      [364, 32, 24], [392, 52, 34], [432, 38, 26], [462, 28, 30], [498, 60, 36],
      [540, 46, 28], [574, 34, 24], [604, 50, 32], [642, 30, 26], [674, 54, 36],
      [716, 40, 28], [750, 48, 26], [782, 32, 30], [818, 58, 38], [862, 42, 28],
      [896, 30, 26], [928, 46, 32],
    ];
    bld.forEach(([x, h, w]) => {
      this.add.rectangle(x + w / 2, 176 - h / 2, w, h, 0xa04878)
        .setScrollFactor(0.2, 1)
        .setDepth(-35);
      // A few lit windows per tower
      for (let i = 0; i < 3; i++) {
        const wx = x + 4 + ((x * 7 + i * 13) % (w - 8));
        const wy = 176 - 6 - ((x * 11 + i * 23) % (h - 10));
        this.add.rectangle(wx, wy, 2, 3, 0xffd9a0, 0.9)
          .setScrollFactor(0.2, 1)
          .setDepth(-35);
      }
      // Antenna on the tall ones
      if (h > 52) {
        this.add.rectangle(x + w / 2, 176 - h - 6, 2, 12, 0xa04878)
          .setScrollFactor(0.2, 1)
          .setDepth(-35);
      }
    });

    // Thin haze drifting just over the rooftops
    for (let x = 0; x < 1000; x += 170) {
      const puffY = 164 + ((x / 170) % 3) * 4;
      this.add.ellipse(x + 40, puffY, 120, 10, 0xffc8d8, 0.35)
        .setScrollFactor(0.22, 1)
        .setDepth(-34);
    }
  }

  // Grass-topped meadow strip rendered over the invisible collision
  // floor: grass lip on row 11, packed soil below.
  _buildMeadowTiles() {
    if (!this.textures.exists("meadow-tiles")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      const o = (i) => i * 16;

      const grass = (x) => {
        // Soil body
        g.fillStyle(0x8c5a34, 1);
        g.fillRect(x, 5, 16, 11);
        g.fillStyle(0x6e4527, 1);
        g.fillRect(x + 2, 8, 3, 2);
        g.fillRect(x + 10, 12, 4, 2);
        g.fillRect(x + 6, 10, 2, 2);
        // Grass cap with a ragged blade edge
        g.fillStyle(0x58c04a, 1);
        g.fillRect(x, 0, 16, 5);
        g.fillStyle(0x8ce070, 1);
        g.fillRect(x, 0, 16, 1);
        g.fillStyle(0x3a9838, 1);
        g.fillRect(x + 2, 4, 2, 3);
        g.fillRect(x + 7, 4, 2, 2);
        g.fillRect(x + 12, 4, 2, 3);
      };

      // 1: grass
      grass(o(1));
      // 2: grass with flowers
      grass(o(2));
      g.fillStyle(0xf06898, 1);
      g.fillRect(o(2) + 4, 0, 3, 3);
      g.fillStyle(0xfff0b0, 1);
      g.fillRect(o(2) + 5, 1, 1, 1);
      g.fillRect(o(2) + 11, 1, 2, 2);
      // 3: packed soil
      g.fillStyle(0x8c5a34, 1);
      g.fillRect(o(3), 0, 16, 16);
      g.fillStyle(0x6e4527, 1);
      g.fillRect(o(3) + 3, 3, 4, 3);
      g.fillRect(o(3) + 11, 9, 4, 3);
      g.fillRect(o(3) + 5, 12, 3, 2);
      g.fillStyle(0xaa7748, 1);
      g.fillRect(o(3) + 9, 5, 2, 2);
      g.fillRect(o(3) + 2, 10, 2, 1);
      // 4: deep soil
      g.fillStyle(0x74462a, 1);
      g.fillRect(o(4), 0, 16, 16);
      g.fillStyle(0x5c3620, 1);
      g.fillRect(o(4) + 4, 4, 5, 4);
      g.fillRect(o(4) + 12, 10, 3, 3);
      g.fillStyle(0x8c5a34, 1);
      g.fillRect(o(4) + 10, 2, 2, 2);

      g.generateTexture("meadow-tiles", 5 * 16, 16);
      g.destroy();
    }

    const W = this.map.width;
    const data = [];
    for (let r = 0; r < this.map.height; r++) {
      const row = [];
      for (let c = 0; c < W; c++) {
        if (r === 11) row.push((c * 13) % 7 === 0 ? 2 : 1);
        else if (r === 12) row.push((c * 11) % 9 === 0 ? 4 : 3);
        else if (r > 12) row.push((c * 7 + r) % 5 === 0 ? 3 : 4);
        else row.push(-1);
      }
      data.push(row);
    }
    const vmap = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
    const ts = vmap.addTilesetImage("meadow-tiles");
    this.meadowLayer = vmap.createLayer(0, ts, 0, 0);
    this.meadowLayer.setDepth(1);
  }

  _ensurePlankTexture() {
    if (this.textures.exists("wood-platform")) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    // 16x8 plank segment
    g.fillStyle(0xa87848, 1);
    g.fillRect(0, 0, 16, 8);
    g.fillStyle(0xd8a868, 1);
    g.fillRect(0, 0, 16, 2);
    g.fillStyle(0x7a5430, 1);
    g.fillRect(7, 0, 1, 8);   // plank seam
    g.fillRect(2, 4, 3, 1);   // grain
    g.fillRect(11, 5, 3, 1);
    g.fillStyle(0x6e4527, 1);
    g.fillRect(0, 7, 16, 1);
    g.fillStyle(0x3a2818, 1); // nails
    g.fillRect(3, 1, 1, 1);
    g.fillRect(12, 1, 1, 1);
    g.generateTexture("wood-platform", 16, 8);
    g.destroy();
  }

  _buildExitPortal() {
    const x = 2500, y = 158;
    // Pulsing glow behind the swirl
    const glow = this.add.circle(x, y, 22, 0xffb86b, 0.25);
    glow.setDepth(49);
    this.tweens.add({
      targets: glow, scale: 1.3, alpha: 0.1,
      duration: 700, yoyo: true, repeat: -1, ease: "Sine.easeInOut",
    });

    this.exitPortal = this.physics.add.sprite(x, y, "dev-portal", "portal1");
    this.exitPortal.body.setAllowGravity(false);
    this.exitPortal.body.setImmovable(true);
    this.exitPortal.setScale(1.5);
    this.exitPortal.setDepth(50);
    this.exitPortal.setTint(0xffb86b);
    this.exitPortal.play("dev-portal-swirl");
    this.add.bitmapText(x, y - 34, "tempFont", "1-4", 8)
      .setOrigin(0.5)
      .setTintFill(0xffd9a0)
      .setDepth(50);

    this.physics.add.overlap(this.jammy.sprite, this.exitPortal, () =>
      this.changeScene()
    );
  }

  _showTitleCard() {
    const t1 = this.add.bitmapText(213, 92, "tempFont", "STAGE 1-3", 16)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xffffff);
    const t2 = this.add.bitmapText(213, 114, "tempFont", "SKYLINE MEADOWS", 12)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xc84890);
    this.tweens.add({
      targets: [t1, t2],
      alpha: 0,
      delay: 1700,
      duration: 600,
      onComplete: () => { t1.destroy(); t2.destroy(); },
    });
  }

  changeScene() {
    // Onward to the fortress stage — The Jam Works
    if (this._changing) return;
    this._changing = true;
    this.jammy.controlsEnabled = false;
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.start("Stage1_4");
    });
  }
}
