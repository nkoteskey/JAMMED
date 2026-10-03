// Plumbing shared by every gameplay scene: physics groups, the
// Jammy/enemy/bullet collisions that each stage used to wire up by
// hand, bread-token bookkeeping, Blubert revives, and the stage-clear
// hand-off that carries Jammy's HP and ammo into the next stage.
//
// Usage inside a scene's create():
//   LevelCommon.createGroups(this);
//   ... build the map, spawn enemies, create this.jammy ...
//   LevelCommon.wireCollisions(this);
//   LevelCommon.registerStage(this, tokenTotal);
// and when the exit is reached:
//   LevelCommon.finishStage(this, "NextSceneKey");
// Score award with a floating "+NNN" popup and the Riff combo. Every
// enemy kill goes through here; set opts.combo=false for pickups.
function awardScore(scn, score, x, y, opts = {}) {
  const ui = scn.scene.get("UIScene");
  let final = score;
  const run = getRunState();
  if (run && run.hard) final = Math.round(final * 1.5);
  if (ui && ui.registerKill && opts.combo !== false) {
    final = ui.registerKill(final);
  }
  if (ui && ui.setScore) ui.setScore(final);
  if (typeof x === "number" && typeof y === "number") {
    const pop = scn.add
      .bitmapText(x, y - 10, "tempFont", "+" + final, 8)
      .setOrigin(0.5)
      .setDepth(380)
      .setTintFill(opts.combo === false ? 0xffffff : 0xffee88);
    scn.tweens.add({
      targets: pop,
      y: y - 34,
      alpha: 0,
      duration: 700,
      ease: "Quad.easeOut",
      onComplete: () => pop.destroy(),
    });
  }
  return final;
}

const LevelCommon = {
  createGroups(scn) {
    // Scene instances survive restarts, so clear caches that point at
    // objects from the previous run of this scene.
    scn.cloudPlatforms = null;
    scn.grindRails = null;
    scn.blubert = null;
    scn.bullets = scn.physics.add.group();
    // Physics groups apply their defaults to every body added, which
    // used to switch gravity back on for tokens and pickups placed in
    // the air (they all sank to the floor). Collectibles float unless a
    // class asks for gravity itself (PowerUp does).
    scn.collectibles = scn.physics.add.group({ allowGravity: false });
    scn.enemies = scn.add.group();
    scn.enemyProjectiles = scn.physics.add.group();
  },

  // Standard collisions. Expects scn.jammy and the tile layers that the
  // scene actually has (missing layers are skipped).
  wireCollisions(scn, opts = {}) {
    const j = scn.jammy.sprite;

    if (scn.groundLayer) {
      scn.physics.add.collider(j, scn.groundLayer);
      scn.physics.add.collider(scn.collectibles, scn.groundLayer);
      scn.physics.add.collider(scn.enemies, scn.groundLayer);
    }
    if (scn.enemyStopBlocksLayer) {
      scn.physics.add.collider(scn.enemies, scn.enemyStopBlocksLayer);
      scn.physics.add.collider(scn.enemyProjectiles, scn.enemyStopBlocksLayer, (p) => {
        if (p.die) p.die();
        else p.destroy();
      });
    }
    if (scn.deathBlocksLayer) {
      scn.physics.add.collider(j, scn.deathBlocksLayer, () => scn.jammy.instantDeath());
      scn.physics.add.collider(scn.collectibles, scn.deathBlocksLayer, (c) => c.destroy());
    }
    if (scn.sceneChangeLayer && opts.onSceneChange) {
      scn.physics.add.collider(j, scn.sceneChangeLayer, () => opts.onSceneChange());
    }

    // Pickups
    scn.physics.add.overlap(j, scn.collectibles, (jammy, collectible) => {
      if (!scn.jammy.alive) return;
      if (collectible.active && collectible.effect) collectible.effect();
    });

    // Jammy's shots vs enemies — one overlap for the whole stage instead
    // of a collider per bullet (which leaked colliders and timers).
    // Phaser passes group-vs-group pairs in either order, so pick the
    // projectile by its hit() method rather than by position.
    scn.physics.add.overlap(scn.bullets, scn.enemies, (a, b) => {
      const bullet = typeof a.hit === "function" ? a : b;
      const enemy = bullet === a ? b : a;
      if (!bullet.active || !enemy.active || enemy.dead) return;
      bullet.hit(enemy);
    });
  },

  // Record how many bread tokens the stage holds and zero the running
  // count (a restart after death respawns them all).
  registerStage(scn, tokenTotal) {
    const run = getRunState();
    const key = scn.sys.settings.key;
    if (!run) return;
    run.tokens[key] = 0;
    if (typeof tokenTotal === "number") {
      run.tokenTotals[key] = tokenTotal;
    } else if (scn.collectibles) {
      run.tokenTotals[key] = scn.collectibles
        .getChildren()
        .filter((c) => c.gameName === "AntToken").length;
    }
    // Stage timer (for best times) and a fresh combo
    scn.stageStartTime = scn.time.now;
    const ui = scn.scene.get("UIScene");
    if (ui && ui.resetCombo) ui.resetCombo();
    scn.cameras.main.fadeIn(400, 0, 0, 0);
  },

  // A one-way floating platform drawn with the pixel-cloud art.
  // Jammy lands on it from above and passes through from below.
  addCloudPlatform(scn, x, y, variant = 1) {
    if (typeof Cloud !== "undefined") Cloud.ensureTextures(scn);
    const img = scn.physics.add.image(x, y, "pixel-cloud-" + variant);
    img.setDepth(54);
    img.body.setAllowGravity(false);
    img.body.setImmovable(true);
    img.body.setSize(img.width - 8, 10);
    img.body.setOffset(4, 4);
    img.body.checkCollision.down = false;
    img.body.checkCollision.left = false;
    img.body.checkCollision.right = false;
    if (!scn.cloudPlatforms) {
      scn.cloudPlatforms = scn.physics.add.group({ allowGravity: false, immovable: true });
      scn.physics.add.collider(scn.jammy.sprite, scn.cloudPlatforms);
    }
    scn.cloudPlatforms.add(img);
    img.body.setAllowGravity(false);
    img.body.setImmovable(true);
    return img;
  },

  // Grind rail: a thin one-way platform. With the Glacier Slide
  // equipped, Jammy auto-grinds along it in railDir at speed.
  addGrindRail(scn, x0, x1, y, railDir = 1) {
    if (!scn.textures.exists("grind-rail")) {
      const g = scn.make.graphics({ x: 0, y: 0, add: false });
      g.fillStyle(0x8c96b0, 1);
      g.fillRect(0, 0, 16, 2);
      g.fillStyle(0xdde4f0, 1);
      g.fillRect(0, 0, 16, 1);
      g.fillStyle(0x5d6680, 1);
      g.fillRect(0, 2, 16, 2);
      g.fillRect(7, 4, 2, 4);
      g.generateTexture("grind-rail", 16, 8);
      g.destroy();
    }
    const w = Math.abs(x1 - x0);
    const rail = scn.add.tileSprite((x0 + x1) / 2, y, w, 8, "grind-rail").setDepth(55);
    scn.physics.add.existing(rail);
    rail.body.setAllowGravity(false);
    rail.body.setImmovable(true);
    rail.body.setSize(w, 4);
    rail.body.setOffset(0, 0);
    rail.body.checkCollision.down = false;
    rail.body.checkCollision.left = false;
    rail.body.checkCollision.right = false;
    rail.railDir = railDir;
    scn.physics.add.collider(scn.jammy.sprite, rail);
    // Posts every 64px
    for (let x = Math.min(x0, x1) + 8; x < Math.max(x0, x1); x += 64) {
      scn.add.rectangle(x, y + 10, 3, 14, 0x5d6680).setDepth(54);
    }
    // Direction arrows
    for (let x = Math.min(x0, x1) + 24; x < Math.max(x0, x1) - 8; x += 48) {
      scn.add.bitmapText(x, y - 10, "tempFont", railDir > 0 ? ">" : "<", 8).setOrigin(0.5).setTintFill(0xffee88).setAlpha(0.8).setDepth(55);
    }
    if (!scn.grindRails) scn.grindRails = [];
    scn.grindRails.push(rail);
    return rail;
  },

  // Secret exit portal: a second way out of a stage, Super-Mario-World
  // style. Green swirl so it reads as "different" from the normal exit.
  addSecretExit(scn, x, y, target, label = "???") {
    const glow = scn.add.circle(x, y, 20, 0x8ce070, 0.25).setDepth(49);
    scn.tweens.add({
      targets: glow,
      scale: 1.3,
      alpha: 0.1,
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
    const portal = scn.physics.add.sprite(x, y, "dev-portal", "portal1");
    portal.body.setAllowGravity(false);
    portal.body.setImmovable(true);
    portal.setDepth(50);
    portal.setTint(0x8ce070);
    portal.play("dev-portal-swirl");
    scn.add
      .bitmapText(x, y - 24, "tempFont", label, 8)
      .setOrigin(0.5)
      .setTintFill(0xc8ffb0)
      .setDepth(50);
    scn.physics.add.overlap(scn.jammy.sprite, portal, () => {
      if (scn._changing) return;
      const run = getRunState();
      if (run) run.secretExits = (run.secretExits || 0) + 1;
      scn.sound.play("powerUpSound", { rate: 1.4, volume: 0.8 });
      LevelCommon.finishStage(scn, target, { secret: true });
    });
    return portal;
  },

  // Blubert revive — the next pickup after Blubert goes down brings him
  // back, once per stage.
  tryReviveBlubert(scn) {
    if (scn.blubert || !scn.jammy || (scn.blubertRevivesLeft || 0) <= 0) return;
    scn.blubertRevivesLeft -= 1;
    scn.blubert = new Blubert(scn, scn.jammy);
    if (scn.blubert.sprite) {
      scn.blubert.sprite.setScale(0.2);
      scn.blubert.sprite.setAlpha(0.2);
      scn.tweens.add({
        targets: scn.blubert.sprite,
        scaleX: 1,
        scaleY: 1,
        alpha: 1,
        duration: 260,
        ease: "Back.easeOut",
      });
    }
  },

  // Stage complete: freeze Jammy, save HP/ammo for the next stage, show
  // a "STAGE CLEAR" card with the bread-token tally, then fade out.
  finishStage(scn, nextSceneKey, opts = {}) {
    if (scn._changing) return;
    scn._changing = true;

    const jammy = scn.jammy;
    jammy.controlsEnabled = false;
    jammy.sprite.body.setVelocityX(0);

    const run = getRunState();
    const key = scn.sys.settings.key;
    const elapsed = typeof scn.stageStartTime === "number" ? scn.time.now - scn.stageStartTime : 0;
    let newBest = false;
    if (run) {
      run.hp = Math.max(1, jammy.hp);
      run.seedAmmo = jammy.seedAmmo;
      if (!run.stagesCleared.includes(key)) run.stagesCleared.push(key);
      run.stageTimes = run.stageTimes || {};
      run.stageTimes[key] = elapsed;
      if (elapsed > 0 && typeof recordBestTime === "function") newBest = recordBestTime(key, elapsed);
    }

    const showCard = opts.card !== false;
    const holdMs = showCard ? 3000 : 300;

    if (showCard) {
      const got = run ? run.tokens[key] || 0 : 0;
      const total = run ? run.tokenTotals[key] || 0 : 0;
      const cx = scn.cameras.main.width / 2;
      const items = [];
      const bg = scn.add
        .rectangle(cx, 118, 220, 100, 0x000000, 0.7)
        .setScrollFactor(0)
        .setDepth(500);
      bg.setStrokeStyle(2, 0xffd877, 1);
      items.push(bg);
      items.push(
        scn.add
          .bitmapText(cx, 92, "tempFont", "STAGE CLEAR", 16)
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(501)
          .setTintFill(0xffd877)
      );
      items.push(
        scn.add
          .bitmapText(cx, 114, "tempFont", STAGE_NAMES[key] || "", 10)
          .setOrigin(0.5)
          .setScrollFactor(0)
          .setDepth(501)
          .setTintFill(0xffffff)
      );
      items.push(
        scn.add.image(cx - 26, 140, "ant-token-hud").setScrollFactor(0).setDepth(501)
      );
      items.push(
        scn.add
          .bitmapText(cx - 14, 140, "tempFont", "x " + got + " / " + total, 12)
          .setOrigin(0, 0.5)
          .setScrollFactor(0)
          .setDepth(501)
          .setTintFill(got >= total && total > 0 ? 0x8ce070 : 0xffffff)
      );
      if (elapsed > 0 && typeof formatTime === "function") {
        items.push(
          scn.add
            .bitmapText(
              cx,
              156,
              "tempFont",
              "TIME " + formatTime(elapsed) + (newBest ? "  NEW BEST!" : ""),
              8
            )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(501)
            .setTintFill(newBest ? 0xffd877 : 0xc0b0c8)
        );
      }
      if (opts.secret) {
        items.push(
          scn.add
            .bitmapText(cx, 76, "tempFont", "SECRET EXIT!", 10)
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(501)
            .setTintFill(0x8ce070)
        );
      }
      items.forEach((it) => it.setAlpha(0));
      scn.tweens.add({ targets: items, alpha: 1, duration: 300 });
      scn.sound.play("powerUpSound", { volume: 0.8 });
    }

    scn.time.delayedCall(holdMs, () => {
      scn.cameras.main.fadeOut(500, 0, 0, 0);
      scn.cameras.main.once("camerafadeoutcomplete", () => {
        scn.sound.stopAll();
        scn.scene.start(nextSceneKey);
      });
    });
  },

  // The Rocket Axe double-jump is a Stage 1-3+ ability. First time it's
  // granted, show a banner so the player knows to jump again mid-air.
  unlockRocketAxe(scn) {
    const run = getRunState();
    if (!run) return;
    run.rocketAxe = true;
    if (scn.jammy) scn.jammy.rocketAxe = true;
    if (run.rocketAxeBannerShown) return;
    run.rocketAxeBannerShown = true;
    const cx = scn.cameras.main.width / 2;
    const t1 = scn.add
      .bitmapText(cx, 150, "tempFont", "ROCKET AXE UNLOCKED!", 12)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300)
      .setTintFill(0xffb347)
      .setAlpha(0);
    const t2 = scn.add
      .bitmapText(cx, 166, "tempFont", "JUMP AGAIN IN MID-AIR TO BLAST OFF", 8)
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(300)
      .setTintFill(0xffffff)
      .setAlpha(0);
    scn.tweens.add({ targets: [t1, t2], alpha: 1, delay: 2300, duration: 400 });
    scn.tweens.add({
      targets: [t1, t2],
      alpha: 0,
      delay: 6200,
      duration: 600,
      onComplete: () => {
        t1.destroy();
        t2.destroy();
      },
    });
  },

  // Dev warp portal (only built when the page is opened with ?dev)
  addDevPortal(scn, x, y, target, label, tint) {
    const portal = scn.physics.add.sprite(x, y, "dev-portal", "portal1");
    portal.body.setAllowGravity(false);
    portal.body.setImmovable(true);
    portal.setDepth(50);
    if (tint) portal.setTint(tint);
    portal.play("dev-portal-swirl");
    scn.add
      .bitmapText(x, y - 22, "tempFont", label, 8)
      .setOrigin(0.5)
      .setTintFill(0xffccff);
    scn.physics.add.overlap(scn.jammy.sprite, portal, () => {
      if (scn._changing) return;
      portal.destroy();
      LevelCommon.finishStage(scn, target, { card: false });
    });
    return portal;
  },
};
