// Stage 2-2 — FROSTBITE FALLS. Down from the lodge through a frozen
// gorge: a staircase of crumbling ice ledges beside the frozen
// waterfall, a wind-scoured gorge floor where the gusts fight your
// jumps, a crumbling bridge over a lake with the wind at your back,
// then a grape-rolling ice shelf up to the mouth of the Preserve Mines.
// Still cold: only the Glacier Slide plays without thawing.
class Stage2_2 extends Phaser.Scene {
  constructor() {
    super({ key: "Stage2_2" });
  }

  preload() {
    scene = this;
  }

  create() {
    this._changing = false;
    this.sound.stopAll();
    this.sound.play(this.cache.audio.exists("Frostbite") ? "Frostbite" : "Level1MusicLoop", { loop: true, volume: 0.9 });
    this.cameras.main.setBackgroundColor("#1a2a5a");
    this.coldStage = true;

    this._buildLevel();
    MountainTiles.paintNightSky(this, { horizon: 230, skyTop: -200, skyBottom: 520 });

    LevelCommon.createGroups(this);

    this.jammy = new Jammy(48, 110);
    this.jammy.sprite.setDepth(100);
    this.children.bringToTop(this.jammy.sprite);
    this.cameras.main.startFollow(this.jammy.sprite, true);
    this.cameras.main.setBounds(0, -200, this.map.widthInPixels, this.map.heightInPixels + 200);

    LevelCommon.wireCollisions(this, { onSceneChange: () => this.changeScene() });

    // Hail, snowballs and jam hurt on touch
    this.physics.add.overlap(this.jammy.sprite, this.enemyProjectiles, (js, p) => {
      if (!this.jammy.alive || !p.active) return;
      this.jammy.takeDamage(p.x);
      if (p.die) p.die();
      else p.destroy();
    });

    this._buildHazards();
    this._spawnEnemies();
    this._spawnPickups();
    this._decorate();

    this.blubert = new Blubert(this, this.jammy);
    this.blubertRevivesLeft = 1;

    MountainTiles.snowfall(this, { drift: 60, wind: -40 });
    MountainTiles.titleCard(this, "STAGE 2-2", "FROSTBITE FALLS", "THE WIND HAS TEETH - CRACKED ICE WON'T HOLD");
    LevelCommon.registerStage(this);
    LevelCommon.unlockRocketAxe(this);

    const ui = this.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(this.jammy.currentWeapon);
  }

  update() {
    this.jammy.windPush = 0;
    if (this.windZones) this.windZones.forEach((w) => w.update());
    this.jammy.update();
    if (this.blubert) this.blubert.update();
    this.enemies.getChildren().forEach((e) => {
      if (e.update) e.update();
    });
  }

  tryReviveBlubert() {
    LevelCommon.tryReviveBlubert(this);
  }

  isIceAt(x, y) {
    return MountainTiles.isIceAt(this, x, y);
  }

  // ------------------------------------------------------------------
  _buildLevel() {
    const W = 200, H = 20;
    const T = MountainTiles;
    const { E, SNOW, ROCK, ICE, CAVE, LAKE, TIMBER } = T;
    const g = T.grids(W, H);
    const { ground, death, stops, change, fill, floor, ice, pit } = g;

    fill(ground, 0, 0, 0, H - 1, ROCK);
    fill(ground, W - 1, 0, W - 1, H - 1, ROCK);

    // S1: the high trail out of the lodge (cols 1-30), floor at row 8
    floor(1, 30, 8);
    fill(ground, 22, 5, 25, 5, SNOW); // turret ledge
    fill(ground, 23, 6, 24, 6, ROCK);

    // S2: the falls. Cliff face of ice from the trail down to the gorge;
    // the way down is the crumble-ledge staircase to its right.
    fill(ground, 31, 9, 33, H - 1, ICE);
    fill(ground, 31, 8, 33, 8, SNOW);
    ice(34, 62, 17);
    pit(50, 51, LAKE, 18);
    // Gorge floor enemy fences at the pit lips
    stops[16][49] = ROCK;
    stops[16][52] = ROCK;

    // S4: climb out of the gorge (cols 63-100)
    floor(63, 70, 17);
    floor(71, 76, 15);
    floor(77, 84, 13);
    floor(92, 100, 8);
    fill(ground, 96, 4, 99, 4, SNOW); // high perch over the plateau
    stops[12][77] = ROCK;
    stops[7][92] = ROCK;

    // S5: the wind bridge: lake crossed on crumbling ledges (101-140)
    floor(101, 110, 12);
    pit(111, 130, LAKE, 14);
    floor(131, 140, 12);
    stops[11][110] = ROCK;
    stops[11][131] = ROCK;

    // S6: grape shelf up to the mine mouth (141-198)
    ice(141, 160, 12);
    floor(161, 198, 12);
    fill(ground, 168, 9, 171, 9, SNOW); // turret ledge
    stops[11][141] = ROCK;
    // Mine mouth: timber frame, dark tunnel, change tiles inside
    fill(ground, 186, 5, 192, 5, TIMBER);
    fill(ground, 186, 6, 186, 7, TIMBER); // lintel post: the doorway below is open
    fill(ground, 192, 6, 192, 11, TIMBER);
    fill(ground, 187, 6, 191, 6, CAVE);
    fill(change, 190, 7, 191, 11, ROCK);

    T.makeLayers(this, g);
  }

  _buildHazards() {
    // Crumble staircase down the falls (col, row), two tiles wide
    [[36, 11], [41, 13], [46, 15]].forEach(([c, r]) => new CrumbleLedge(this, c * 16 + 16, r * 16 + 8, 2));
    // Climb out of the gorge
    [[86, 11], [90, 9]].forEach(([c, r]) => new CrumbleLedge(this, c * 16 + 16, r * 16 + 8, 2));
    // The wind bridge
    [[113, 12], [118, 13], [123, 12], [128, 13]].forEach(([c, r]) => new CrumbleLedge(this, c * 16 + 16, r * 16 + 8, 2));
    // Heart Container perch: a single crumbling tile high over the plateau
    new CrumbleLedge(this, 88 * 16 + 8, 5 * 16 + 8, 1);

    // Gorge floor: a headwind blowing back toward the falls
    new WindZone(this, 40 * 16, 10 * 16, 63 * 16, 18 * 16, -1, 60);
    // Wind bridge: a tailwind that wants to throw you past each ledge
    new WindZone(this, 111 * 16, 6 * 16, 131 * 16, 14 * 16, 1, 60);
  }

  _spawnEnemies() {
    // Trail
    [300, 440].forEach((x) => new Frostberry(this, x, 100));
    new Snowberry(this, 23 * 16 + 16, 70);
    // Icicles along the cliff lip over the staircase
    [34, 37, 40, 43].forEach((c) => new Icicle(this, c * 16 + 8, 9 * 16 + 10));
    // Gorge floor
    new Hailberry(this, 46 * 16, 12 * 16, 40 * 16, 60 * 16);
    new Grapeshot(this, 58 * 16, 16 * 16);
    new Frostberry(this, 66 * 16, 16 * 16);
    // Climb and plateau
    new Snowberry(this, 80 * 16, 13 * 16 - 10);
    [94 * 16, 98 * 16].forEach((x) => new Frostberry(this, x, 7 * 16));
    // Wind bridge
    new Hailberry(this, 116 * 16, 6 * 16, 112 * 16, 122 * 16);
    new Hailberry(this, 126 * 16, 7 * 16, 120 * 16, 130 * 16);
    // Grape shelf
    [144, 150, 156].forEach((c) => new Grapeshot(this, c * 16, 11 * 16));
    new Snowberry(this, 169 * 16 + 8, 9 * 16 - 10);
    new Frostberry(this, 176 * 16, 11 * 16);
    [164 * 16, 182 * 16].forEach((x) => new Pineapple(this, x, 11 * 16 - 4));
  }

  _spawnPickups() {
    const X = (c) => c * 16 + 8;
    [
      [X(6), 100], [X(12), 100],
      [X(23), 50], [X(25), 50],
      [X(36), 160], [X(41), 192], [X(46), 224],
      [X(50), 236], [X(51), 236],
      [X(62), 250],
      [X(73), 220], [X(80), 190], [X(86), 160], [X(90), 128],
      [X(97), 44], [X(98), 44],
      [X(104), 170], [X(113), 176], [X(118), 192], [X(123), 176], [X(128), 192],
      [X(135), 170],
      [X(146), 160], [X(158), 160],
      [X(170), 120],
      [X(178), 170],
    ].forEach(([x, y]) => new AntToken(this, x, y));
    // Bread: atop the ice cliff, over the lake shore, and before the mine mouth
    [[X(32), 108], [X(107), 136], [X(176), 148]].forEach(([x, y]) => new BreadToken(this, x, y));

    [[X(28), 110], [X(108), 176], [X(163), 172]].forEach(([x, y]) => new SeedAmmoPickup(this, x, y));
    const p = new PowerUp(this, X(70), 16 * 16 + 6);
    p.setData("powerUpType", "heal");
    p.val = 2;

    // Lost Jam: high over the wind bridge, a Rocket Axe hop up from the
    // second ledge, with the tailwind trying to carry you past it
    new LostRecord(this, X(118), 4 * 16, "Stage2_2");
    // Heart Container: on the one-tile crumbling perch above the plateau
    new HeartContainer(this, X(88), 4 * 16);
  }

  _decorate() {
    // The frozen waterfall: pale streaks down the ice cliff
    for (let i = 0; i < 9; i++) {
      const x = 31 * 16 + 4 + i * 5;
      this.add.rectangle(x, 9 * 16 + 88, 1, 176, 0xffffff, 0.25 + (i % 3) * 0.1).setDepth(4);
    }
    // Mine mouth: dark tunnel, lantern, sign
    const mx = 189 * 16;
    this.add.rectangle(mx, 9 * 16, 48, 80, 0x0a0612).setDepth(1);
    const lamp = this.add.circle(187 * 16 + 4, 7 * 16, 3, 0xffd9a0).setDepth(2);
    const glow = this.add.circle(187 * 16 + 4, 7 * 16, 22, 0xffd9a0, 0.18).setDepth(1);
    this.tweens.add({ targets: glow, alpha: 0.08, duration: 700, yoyo: true, repeat: -1 });
    this.add.rectangle(187 * 16 + 4, 6 * 16 + 10, 1, 8, 0x3a2818).setDepth(2);
    // Signpost beside the mouth
    const sx = 182 * 16;
    this.add.rectangle(sx, 10 * 16 + 8, 3, 32, 0x3a2818).setDepth(2);
    this.add.rectangle(sx, 8 * 16 + 4, 92, 22, 0x5a3a1e).setDepth(2);
    this.add.bitmapText(sx, 8 * 16, "tempFont", "PRESERVE MINES", 8).setOrigin(0.5).setTintFill(0xffd9a0).setDepth(3);
    this.add.bitmapText(sx, 8 * 16 + 9, "tempFont", "KEEP OUT - B.P.", 8).setOrigin(0.5).setTintFill(0xc8a0ff).setDepth(3);
    lamp.setDepth(2);
    // Signpost at the top of the staircase
    this.add.bitmapText(31 * 16 + 24, 7 * 16 - 2, "tempFont", "V FALLS V", 8).setOrigin(0.5).setTintFill(0x9ad8ff).setDepth(2);
  }

  changeScene() {
    LevelCommon.finishStage(this, "Stage2_3");
  }
}
