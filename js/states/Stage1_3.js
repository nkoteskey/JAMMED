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
    // fresh below (sky, skyline, desert tiles).
    this.groundLayer.setAlpha(0);
    this._paintSky();
    this._buildDesertTiles();
    this._scatterDesertDecor();

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

    // Needle cactuses — goofy-eyed sentries that blast needles in
    // every direction if Jammy lingers too close. Shoot them out or
    // Rocket-Axe over the top; the last one guards the exit portal.
    this.cactuses = [
      new NeedleCactus(this, 460, 158),
      new NeedleCactus(this, 1000, 158),
      new NeedleCactus(this, 1700, 158),
      new NeedleCactus(this, 2120, 158),
      new NeedleCactus(this, 2430, 158),
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

    // The murmur — x0x rumor lines and etched glyphs
    ensureX0XTexture(this);
    this.add.image(700, 208, "x0x-glyph").setDepth(2);
    this.add.image(2462, 208, "x0x-glyph").setDepth(2);
    this.murmur = new Murmur(this);
    this.murmur.addTrigger(420, "there were orchards here before they drained the river for the plant");
    this.murmur.addTrigger(1500, "the runoff flows uphill to the works. follow the drip");
    this.murmur.addTrigger(2300, "heard from 3 nodes: the press runs day and night past the works");

    // Sync UI weapon indicator
    const ui = this.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(this.jammy.currentWeapon);
  }

  update() {
    this.jammy.update();
    if (this.murmur) this.murmur.update(this.jammy.sprite.x);
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

    // Sun — gritty dithered pixel disc with stripe cuts, half-sunk
    // behind the skyline
    this._ensureSunTexture();
    this.add.circle(330, 132, 38, 0xffe2a8, 0.30)
      .setScrollFactor(0.12, 1)
      .setDepth(-38);
    this.add.image(330, 132, "mesa-sun")
      .setScrollFactor(0.12, 1)
      .setDepth(-37);

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

  // Dithered pixel sun, drawn as stepped 2px rows with a lighter core,
  // dither flecks along the rim, and transparent stripe cuts across
  // the lower half (the sky shows through the gaps).
  _ensureSunTexture() {
    if (this.textures.exists("mesa-sun")) return;
    const g = this.make.graphics({ x: 0, y: 0, add: false });
    const R = 27, C = 32; // radius, center
    const cutRows = new Set([8, 9, 14, 15, 20, 21]); // dy bands to skip
    for (let dy = -R + 1; dy < R; dy += 2) {
      if (cutRows.has(dy) || cutRows.has(dy + 1)) continue;
      // stepped half-width, quantized to chunky 2px
      const hw = Math.floor(Math.sqrt(R * R - dy * dy) / 2) * 2;
      if (hw <= 0) continue;
      g.fillStyle(0xffb850, 1);
      g.fillRect(C - hw, C + dy, hw * 2, 2);
      // rim dither flecks just outside the edge, alternating rows
      if ((dy & 2) === 0 && hw < R - 2) {
        g.fillStyle(0xe89048, 1);
        g.fillRect(C - hw - 2, C + dy, 2, 2);
        g.fillRect(C + hw, C + dy, 2, 2);
      }
    }
    // hotter core, offset up-left
    for (let dy = -19; dy < 1; dy += 2) {
      const hw = Math.floor(Math.sqrt(361 - dy * dy) / 2) * 2 - 2;
      if (hw <= 0) continue;
      g.fillStyle(0xffd877, 1);
      g.fillRect(C - 3 - hw, C - 5 + dy, hw * 2, 2);
    }
    for (let dy = -11; dy < -1; dy += 2) {
      const hw = Math.floor(Math.sqrt(121 - dy * dy) / 2) * 2 - 2;
      if (hw <= 0) continue;
      g.fillStyle(0xfff0b0, 1);
      g.fillRect(C - 6 - hw, C - 8 + dy, hw * 2, 2);
    }
    g.generateTexture("mesa-sun", 64, 64);
    g.destroy();
  }

  // Sandy desert strip rendered over the invisible collision floor:
  // rippled sand lip on row 11, loose sand, then banded sandstone.
  // Several variants per row, mixed by position hash, keep it from
  // reading as a repeated single tile.
  _buildDesertTiles() {
    if (!this.textures.exists("desert-tiles")) {
      const g = this.make.graphics({ x: 0, y: 0, add: false });
      const o = (i) => i * 16;
      const SAND = 0xe8c878, SANDLT = 0xf8e0a0, SANDDK = 0xc89850,
            SANDMD = 0xe0bc70, PEB = 0xa88858, PEBLT = 0xd8c098,
            STONE = 0xc87848, STONEDK = 0xb05c34, STONELT = 0xd88858;

      const sandTop = (x, seed) => {
        g.fillStyle(SAND, 1);
        g.fillRect(x, 0, 16, 16);
        // bright wind-blown lip with notches
        g.fillStyle(SANDLT, 1);
        g.fillRect(x, 0, 16, 2);
        g.fillRect(x + ((seed * 5) % 9), 2, 4, 1);
        g.fillRect(x + ((seed * 11) % 11), 2, 2, 2);
        // ripple dashes at staggered heights
        g.fillStyle(SANDDK, 1);
        g.fillRect(x + ((seed * 7) % 6), 5 + (seed % 3), 6, 1);
        g.fillRect(x + 8 + ((seed * 3) % 5), 9 + ((seed * 2) % 3), 5, 1);
        g.fillRect(x + ((seed * 13) % 8), 13, 4, 1);
        // speckles
        g.fillStyle(SANDMD, 1);
        g.fillRect(x + ((seed * 17) % 14), 7, 1, 1);
        g.fillRect(x + ((seed * 23) % 14), 11, 1, 1);
      };

      // 1-3: sand surface variants
      sandTop(o(1), 1);
      sandTop(o(2), 2);
      g.fillStyle(PEB, 1);            // half-buried pebbles on variant 2
      g.fillRect(o(2) + 10, 1, 4, 3);
      g.fillStyle(PEBLT, 1);
      g.fillRect(o(2) + 11, 1, 2, 1);
      sandTop(o(3), 3);
      g.fillStyle(0xb89c50, 1);       // dry grass wisps on variant 3
      g.fillRect(o(3) + 3, 0, 1, 3);
      g.fillRect(o(3) + 5, 0, 1, 2);
      g.fillRect(o(3) + 7, 1, 1, 2);

      // 4-5: loose sand body
      const sandBody = (x, seed) => {
        g.fillStyle(SANDMD, 1);
        g.fillRect(x, 0, 16, 16);
        g.fillStyle(SANDDK, 1);
        g.fillRect(x + ((seed * 7) % 7), 3 + (seed % 4), 5, 1);
        g.fillRect(x + 7 + ((seed * 5) % 6), 10 + (seed % 3), 5, 1);
        g.fillStyle(SAND, 1);
        g.fillRect(x + ((seed * 11) % 12), 6, 2, 2);
        g.fillRect(x + ((seed * 13) % 12), 13, 2, 1);
      };
      sandBody(o(4), 1);
      sandBody(o(5), 4);
      g.fillStyle(PEB, 1);            // pebble cluster on variant 5
      g.fillRect(o(5) + 4, 7, 5, 4);
      g.fillRect(o(5) + 10, 9, 3, 3);
      g.fillStyle(PEBLT, 1);
      g.fillRect(o(5) + 5, 8, 2, 1);

      // 6-7: banded sandstone bedrock
      const stone = (x, seed) => {
        g.fillStyle(STONE, 1);
        g.fillRect(x, 0, 16, 16);
        g.fillStyle(STONEDK, 1);
        g.fillRect(x, 3 + (seed % 2), 16, 2);
        g.fillRect(x, 11 - (seed % 2), 16, 2);
        g.fillStyle(STONELT, 1);
        g.fillRect(x, 0, 16, 1);
        g.fillRect(x + ((seed * 7) % 9), 7, 6, 1);
      };
      stone(o(6), 1);
      stone(o(7), 2);
      g.fillStyle(0x8c4828, 1);       // crack on variant 7
      g.fillRect(o(7) + 6, 5, 1, 3);
      g.fillRect(o(7) + 7, 8, 1, 3);
      g.fillRect(o(7) + 6, 11, 1, 2);

      g.generateTexture("desert-tiles", 8 * 16, 16);
      g.destroy();
    }

    const W = this.map.width;
    const pick = (c, opts, salt) => opts[(c * 31 + salt * 17 + ((c * 13) >> 2)) % opts.length];
    const data = [];
    for (let r = 0; r < this.map.height; r++) {
      const row = [];
      for (let c = 0; c < W; c++) {
        if (r === 11) row.push(pick(c, [1, 1, 2, 1, 3, 1, 2, 1, 1, 3], 1));
        else if (r === 12) row.push(pick(c, [4, 4, 5, 4, 4, 5, 4], 2));
        else if (r > 12) row.push(pick(c, [6, 6, 7, 6, 7, 6], r));
        else row.push(-1);
      }
      data.push(row);
    }
    const vmap = this.make.tilemap({ data, tileWidth: 16, tileHeight: 16 });
    const ts = vmap.addTilesetImage("desert-tiles");
    this.desertLayer = vmap.createLayer(0, ts, 0, 0);
    this.desertLayer.setDepth(1);
  }

  // Surface dressing: low dune mounds, rock piles, and one bleached
  // longhorn skull, spaced irregularly so the strip never tiles visibly.
  _scatterDesertDecor() {
    const g1 = this.make.graphics({ x: 0, y: 0, add: false });
    if (!this.textures.exists("desert-dune")) {
      g1.fillStyle(0xf0d490, 1);
      g1.fillRect(8, 4, 26, 4);
      g1.fillRect(2, 8, 38, 2);
      g1.fillStyle(0xf8e0a0, 1);
      g1.fillRect(10, 4, 12, 2);
      g1.fillStyle(0xc89850, 1);
      g1.fillRect(4, 9, 10, 1);
      g1.generateTexture("desert-dune", 42, 10);
    }
    g1.destroy();

    const g2 = this.make.graphics({ x: 0, y: 0, add: false });
    if (!this.textures.exists("desert-rocks")) {
      g2.fillStyle(0x8c6a48, 1);
      g2.fillRect(2, 4, 8, 6);
      g2.fillRect(9, 6, 7, 4);
      g2.fillStyle(0xb08c60, 1);
      g2.fillRect(3, 4, 4, 2);
      g2.fillRect(10, 6, 3, 2);
      g2.fillStyle(0x6a4e34, 1);
      g2.fillRect(2, 9, 14, 1);
      g2.generateTexture("desert-rocks", 18, 10);
    }
    g2.destroy();

    const g3 = this.make.graphics({ x: 0, y: 0, add: false });
    if (!this.textures.exists("desert-skull")) {
      g3.fillStyle(0xe8e0c8, 1);
      g3.fillRect(4, 2, 8, 6);
      g3.fillRect(0, 0, 4, 3);  // horns
      g3.fillRect(12, 0, 4, 3);
      g3.fillRect(6, 8, 4, 2);  // snout
      g3.fillStyle(0x3a2818, 1);
      g3.fillRect(5, 4, 2, 2);  // sockets
      g3.fillRect(9, 4, 2, 2);
      g3.generateTexture("desert-skull", 16, 10);
    }
    g3.destroy();

    // Irregular spacing via a stride that drifts each step
    let x = 90;
    let i = 0;
    while (x < this.map.widthInPixels - 80) {
      const kind = i % 3;
      if (kind === 0) this.add.image(x, 172, "desert-dune").setDepth(2);
      else if (kind === 1) this.add.image(x, 172, "desert-rocks").setDepth(2);
      else this.add.image(x, 172, "desert-dune").setDepth(2).setFlipX(true);
      x += 210 + ((i * 73) % 160);
      i++;
    }
    this.add.image(1234, 172, "desert-skull").setDepth(2);
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
    const t2 = this.add.bitmapText(213, 114, "tempFont", "SUNSET MESA", 12)
      .setOrigin(0.5).setScrollFactor(0).setDepth(300).setTintFill(0xffc9a0);
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
