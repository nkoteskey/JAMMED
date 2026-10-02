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
const LevelCommon = {
  createGroups(scn) {
    scn.bullets = scn.physics.add.group();
    scn.collectibles = scn.physics.add.group();
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
    scn.physics.add.overlap(scn.bullets, scn.enemies, (bullet, enemy) => {
      if (!bullet.active || !enemy.active || enemy.dead) return;
      if (bullet.hit) bullet.hit(enemy);
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
    scn.cameras.main.fadeIn(400, 0, 0, 0);
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
    if (run) {
      run.hp = Math.max(1, jammy.hp);
      run.seedAmmo = jammy.seedAmmo;
      if (!run.stagesCleared.includes(key)) run.stagesCleared.push(key);
    }

    const showCard = opts.card !== false;
    const holdMs = showCard ? 2600 : 300;

    if (showCard) {
      const got = run ? run.tokens[key] || 0 : 0;
      const total = run ? run.tokenTotals[key] || 0 : 0;
      const cx = scn.cameras.main.width / 2;
      const items = [];
      const bg = scn.add
        .rectangle(cx, 118, 220, 86, 0x000000, 0.7)
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
