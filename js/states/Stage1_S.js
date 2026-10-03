// Stage 1-S — CLOUD NINE. The hidden bonus stage behind Sunset Mesa's
// secret exit. A sky run across drifting pixel clouds laid out from
// Jammy's real jump and Rocket Axe arcs, with bread tokens tracing the
// flight path, a Lost Jam at the summit and a Heart Container hidden
// above it. There's no floor: fall and you drop back to the last big
// cloud (no damage — it's a bonus, not a punishment). Exits to The Jam
// Works.
class Stage1_S extends Phaser.Scene {
  constructor() {
    super({ key: "Stage1_S" });
  }

  preload() {
    scene = this;
  }

  create() {
    this._changing = false;
    this._respawning = false;
    this.sound.stopAll();
    this.sound.play(this.cache.audio.exists("CloudWaltz") ? "CloudWaltz" : "Jammed", {
      loop: true,
      volume: 0.8,
    });

    this.cameras.main.setBackgroundColor("#5ec8f0");
    this.worldH = 480;

    // Lay out the route first so the world width follows it
    this.route = this._designRoute();
    this.worldW = this.route.clouds[this.route.clouds.length - 1].x + 140;

    this._paintSky();

    LevelCommon.createGroups(this);

    // Jammy starts on the big cloud at the left
    const first = this.route.clouds[0];
    this.jammy = new Jammy(first.x, first.y - 60);
    this.jammy.sprite.setDepth(100);
    this.cameras.main.startFollow(this.jammy.sprite, true);
    this.cameras.main.setBounds(0, -240, this.worldW, this.worldH + 240);

    // No tile layers here, so wire the generic bits by hand
    LevelCommon.wireCollisions(this);

    this._buildClouds();
    this._buildTokens();
    this._buildDrones();

    // Lost Jam on the summit cloud
    const summit = this.route.clouds[this.route.summitIndex];
    new LostRecord(this, summit.x, summit.y - 60, "Stage1_S");

    // Heart Container on the hidden cloud above and behind the summit
    const secret = this.route.secretCloud;
    new HeartContainer(this, secret.x, secret.y - 30);

    // Exit portal on the last cloud
    const last = this.route.clouds[this.route.clouds.length - 1];
    this._buildExitPortal(last.x, last.y - 20);

    // Blubert tags along
    this.blubert = new Blubert(this, this.jammy);
    this.blubertRevivesLeft = 1;

    this._showTitleCard();
    LevelCommon.registerStage(this);
    LevelCommon.unlockRocketAxe(this);

    const ui = this.scene.get("UIScene");
    if (ui && ui.setWeapon) ui.setWeapon(this.jammy.currentWeapon);
  }

  update() {
    this.jammy.update();
    if (this.blubert) this.blubert.update();
    this.enemies.getChildren().forEach((e) => {
      if (e.update) e.update();
    });
    if (this.cloudRigs) this.cloudRigs.forEach((fn) => fn());

    // Fell off the clouds: whisk Jammy back above the last checkpoint
    // cloud. He is dropped well above it so he lands on top rather
    // than spawning inside the thin one-way platform and slipping
    // straight through.
    if (this.jammy.alive && this.jammy.sprite.y > this.worldH + 20 && !this._respawning) {
      this._respawning = true;
      const cp = this._nearestCheckpoint(this.jammy.sprite.x);
      this.cameras.main.flash(200, 255, 255, 255);
      this.sound.play("jumpSound", { rate: 0.6, volume: 0.6 });
      this.jammy.sprite.setPosition(cp.x, cp.y - 70);
      this.jammy.sprite.body.reset(cp.x, cp.y - 70);
      this.jammy.sprite.body.setVelocity(0, 0);
      if (this.jammy.rocketBoostActive) this.jammy._endRocketBoost();
      this.time.delayedCall(400, () => {
        this._respawning = false;
      });
    }
  }

  tryReviveBlubert() {
    LevelCommon.tryReviveBlubert(this);
  }

  _nearestCheckpoint(x) {
    let best = this.checkpoints[0];
    for (const cp of this.checkpoints) if (cp.x <= x + 20) best = cp;
    return best;
  }

  // ---------------------------------------------------------------
  // Route design. Jammy's jump (vy -300, walk 125) and Rocket Axe (vy
  // -560, 300 sideways for 520ms, fired near the top of a jump) are
  // simulated under the game's 900px/s^2 gravity, so each cloud sits
  // exactly where the hop lands and the tokens trace the flight path.
  // ---------------------------------------------------------------
  static simulateHop(type, dir, tEnd, dt = 1 / 120) {
    const G = 900, RUN = 125, JUMP = -300, ROCKET = -560, BOOST_VX = 300, BOOST_S = 0.52, TR = 0.3;
    let x = 0, y = 0, vx = RUN * dir, vy = JUMP, t = 0, rocketed = false;
    const pts = [];
    while (t < tEnd - 1e-6) {
      if (type === "rocket" && !rocketed && t >= TR) {
        rocketed = true;
        vy = ROCKET;
        vx = BOOST_VX * dir;
      }
      if (rocketed && t >= TR + BOOST_S) vx = RUN * dir;
      vy += G * dt;
      x += vx * dt;
      y += vy * dt;
      t += dt;
      pts.push({ t, x, y });
    }
    return pts;
  }

  _designRoute() {
    // Standing offset: Jammy's centre sits 23px above a big cloud's
    // centre and 20px above a small one.
    const STAND = { 1: 23, 2: 20 };
    // [type, landing time]. Rocket hops land on big clouds (wider
    // target); plain jumps land on small ones. Big clouds are also the
    // respawn checkpoints.
    // A third entry of 1 forces a big cloud (summit, finish).
    const hops = [
      ["jump", 0.6], ["jump", 0.55], ["rocket", 1.55], ["jump", 0.667], ["rocket", 1.5],
      ["jump", 0.7], ["rocket", 1.45], ["jump", 0.55, 1], // -> summit
      ["rocket", 1.75], ["jump", 0.8], ["rocket", 1.65], ["jump", 0.75], ["rocket", 1.6], ["jump", 0.7, 1],
    ];
    const clouds = [{ x: 80, y: 360, v: 1 }];
    const arcs = [];
    let sx = 80, sy = 360 - STAND[1];
    hops.forEach(([type, t, forceV]) => {
      const pts = Stage1_S.simulateHop(type, 1, t);
      const end = pts[pts.length - 1];
      const v = forceV || (type === "rocket" ? 1 : 2);
      const lx = sx + end.x, ly = sy + end.y;
      arcs.push({ type, x0: sx, y0: sy, pts });
      clouds.push({ x: Math.round(lx), y: Math.round(ly + STAND[v]), v });
      sx = lx;
      sy = ly;
    });
    const summitIndex = 8;
    // Secret branch: rocket LEFT off the summit cloud, well above the
    // main route, with no token trail.
    const s = clouds[summitIndex];
    const back = Stage1_S.simulateHop("rocket", -1, 1.2);
    const bend = back[back.length - 1];
    const secretCloud = { x: Math.round(s.x + bend.x), y: Math.round(s.y - STAND[1] + bend.y + STAND[1]), v: 1 };
    return { clouds, arcs, summitIndex, secretCloud };
  }

  _buildClouds() {
    this.checkpoints = [];
    this.cloudRigs = [];
    const start = this.time.now;
    const all = this.route.clouds.concat([this.route.secretCloud]);
    all.forEach(({ x, y, v }) => {
      const c = LevelCommon.addCloudPlatform(this, x, y, v);
      // Gentle drift, driven by velocity so Jammy rides it smoothly
      const omega = (Math.PI * 2) / ((3600 + (x % 1400)) / 1000);
      const amp = 6;
      this.cloudRigs.push(() => {
        const t = (this.time.now - start) / 1000;
        const targetY = y - amp + Math.sin(t * omega) * amp;
        c.body.setVelocityY(amp * omega * Math.cos(t * omega) + (targetY - c.y) * 2);
      });
      if (v === 1) this.checkpoints.push({ x, y });
    });
    this.checkpoints.sort((a, b) => a.x - b.x);
  }

  // Tokens on the flight path: a string of them along each Rocket Axe
  // arc, one at the top of each plain jump.
  _buildTokens() {
    this.route.arcs.forEach(({ type, x0, y0, pts }) => {
      if (type === "rocket") {
        const tEnd = pts[pts.length - 1].t;
        for (let t = 0.42; t < tEnd - 0.12; t += 0.17) {
          const p = pts.find((q) => q.t >= t);
          if (p) new AntToken(this, Math.round(x0 + p.x), Math.round(y0 + p.y - 6));
        }
      } else {
        const apex = pts.reduce((a, b) => (b.y < a.y ? b : a));
        new AntToken(this, Math.round(x0 + apex.x), Math.round(y0 + apex.y - 8));
      }
    });
  }

  _buildDrones() {
    const c = this.route.clouds;
    [c[3], c[7], c[11]].forEach((cl) => {
      const b = new Blueberry(this, cl.x + 40, cl.y - 110);
      b.setPosition(cl.x + 40, cl.y - 110);
    });
  }

  _paintSky() {
    const bands = [
      [-120, 60, 0x3aa0e0],
      [60, 180, 0x5ec8f0],
      [180, 320, 0x8ee0f8],
      [320, 600, 0xc8f0ff],
    ];
    bands.forEach(([y0, y1, color]) => {
      this.add
        .rectangle(213, (y0 + y1) / 2, 426, y1 - y0, color)
        .setScrollFactor(0)
        .setDepth(-40);
    });
    // Far cloud bank
    if (typeof Cloud !== "undefined") Cloud.ensureTextures(this);
    for (let x = 0; x < this.worldW + 400; x += 180) {
      const y = 140 + ((x / 180) % 4) * 50;
      this.add
        .image(x, y, "pixel-cloud-" + (1 + ((x / 180) % 2)))
        .setScrollFactor(0.3)
        .setAlpha(0.55)
        .setDepth(-30);
    }
    // Sunset Mesa far below: a strip of sand at the bottom of the world
    this.add
      .rectangle(this.worldW / 2, this.worldH + 60, this.worldW + 800, 160, 0xe8c878)
      .setScrollFactor(0.6, 1)
      .setDepth(-20);
  }

  _buildExitPortal(x, y) {
    const glow = this.add.circle(x, y - 22, 22, 0xffb86b, 0.25).setDepth(49);
    this.tweens.add({
      targets: glow,
      scale: 1.3,
      alpha: 0.1,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    const portal = this.physics.add.sprite(x, y - 22, "dev-portal", "portal1");
    portal.body.setAllowGravity(false);
    portal.body.setImmovable(true);
    portal.setScale(1.4);
    portal.setDepth(50);
    portal.setTint(0xffb86b);
    portal.play("dev-portal-swirl");
    this.add
      .bitmapText(x, y - 54, "tempFont", "1-4", 8)
      .setOrigin(0.5)
      .setTintFill(0xffd9a0)
      .setDepth(50);
    this.physics.add.overlap(this.jammy.sprite, portal, () => this.changeScene());
  }

  _showTitleCard() {
    const t1 = this.add
      .bitmapText(213, 92, "tempFont", "SECRET STAGE 1-S", 16)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300)
      .setTintFill(0xffffff);
    const t2 = this.add
      .bitmapText(213, 114, "tempFont", "CLOUD NINE", 16)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300)
      .setTintFill(0x8ce070);
    const t3 = this.add
      .bitmapText(213, 136, "tempFont", "NO FALLING DAMAGE - SOMETHING SPECIAL HIDES UP HERE", 8)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300)
      .setTintFill(0xffffff);
    this.tweens.add({
      targets: [t1, t2, t3],
      alpha: 0,
      delay: 2200,
      duration: 600,
      onComplete: () => {
        t1.destroy();
        t2.destroy();
        t3.destroy();
      },
    });
  }

  changeScene() {
    LevelCommon.finishStage(this, "Stage1_4");
  }
}
