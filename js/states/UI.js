// The HUD. Launched once from the title screen and kept running for the
// whole game: it draws the score, Jammy's lifebar, the bread-token
// counter and the equipped guitar, owns the pause / guitar-rack keys,
// and hosts the touch controls on phones. It hides itself whenever no
// gameplay scene is active (cutscenes, credits).
class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene" });
  }

  init(data) {
    this.score = (data && data.score) || 0;
    this.gameScene = (data && data.key) || "Level1";
  }

  create() {
    this.newScore = this.score;
    this.gameplaySceneKeys = ["Level1", "Level1BossFight", "Stage1_3", "Stage1_S", "Stage1_4", "Stage1_4Boss", "Stage2_1"];
    this.currentWeapon = "sonic";

    // --- Score (top-left) ---
    this.scoreText = this.add
      .bitmapText(10, 6, "tempFont", "Score: " + this.score, 12)
      .setTintFill(0xffffff);

    // --- Lifebar (under the score) ---
    this.lifebar = {
      guts: this.add.image(10, 24, "lifebar-guts").setOrigin(0, 0),
      outline: this.add.image(10, 24, "lifebar-outline").setOrigin(0, 0),
    };
    this.lifebarCrop = new Phaser.Geom.Rectangle(0, 0, 91, 12);
    this._shownHp = -1;
    this._shownMaxHp = -1;

    // --- Bread tokens (next to the lifebar) ---
    this.tokenIcon = this.add.image(112, 30, "ant-token-hud");
    this.tokenText = this.add
      .bitmapText(122, 30, "tempFont", "x0", 10)
      .setOrigin(0, 0.5)
      .setTintFill(0xffffff);

    // --- Weapon indicator (top-right) ---
    this.weaponIcon = this.add.sprite(410, 14, "audio-wave");
    this.weaponIcon.setDisplaySize(20, 16);
    this.weaponLabel = this.add
      .bitmapText(374, 22, "tempFont", "SONIC", 8)
      .setTintFill(0xffee88);
    this.weaponAmmoText = this.add
      .bitmapText(374, 2, "tempFont", "", 8)
      .setTintFill(0xffffff);
    // Rocket Axe toggle state (DOWN flips it)
    this.axeLabel = this.add
      .bitmapText(422, 32, "tempFont", "", 8)
      .setOrigin(1, 0)
      .setTintFill(0xffb347);

    // --- Riff combo (top, right of the score so the two never overlap) ---
    this.combo = 0;
    this.comboExpires = 0;
    this.comboWindowMs = 4000;
    this.comboText = this.add
      .bitmapText(262, 6, "tempFont", "", 8)
      .setOrigin(0.5, 0)
      .setTintFill(0xffee88)
      .setAlpha(0);
    this.comboBar = this.add.rectangle(262, 16, 60, 3, 0xffee88).setOrigin(0.5, 0).setAlpha(0);

    // --- Keys: pause + guitar rack ---
    const kb = this.input.keyboard;
    onKeys(addKeys(kb, controls.pause), "down", () => this.togglePause(), this);
    onKeys(addKeys(kb, controls.guitarRack), "down", () => this.openGuitarRack(), this);

    // --- Touch controls on phones / tablets ---
    this.gamepad = null;
    if (isTouchDevice()) {
      this.gamepad = new VirtualGamepad(this);
    }

    this.scene.setVisible(false);
  }

  // The gameplay scene actually running right now — init data goes
  // stale once warps/portals change scenes, so always look it up.
  _activeGameplayKey() {
    const active = this.scene.manager.getScenes(true).map((s) => s.sys.settings.key);
    return active.find((k) => this.gameplaySceneKeys.includes(k));
  }

  _activeJammy() {
    const key = this._activeGameplayKey();
    if (!key) return null;
    const lv = this.scene.get(key);
    return lv && lv.jammy ? lv.jammy : null;
  }

  update() {
    const key = this._activeGameplayKey();
    const active = !!key;
    if (this.scene.isVisible() !== active) {
      this.scene.setVisible(active);
    }
    if (!active) return;

    const jammy = this._activeJammy();
    if (jammy) {
      this.setHP(jammy.hp, jammy.maxHP);
      const run = getRunState();
      const n = run && run.tokens ? run.tokens[key] || 0 : 0;
      const txt = "x" + n;
      if (this.tokenText.text !== txt) this.tokenText.setText(txt);
      this._refreshAxe(jammy);
    }
    if (this.gamepad) this.gamepad.update(jammy);

    // Combo decay
    if (this.combo > 0) {
      const left = this.comboExpires - this.time.now;
      if (left <= 0) {
        this.resetCombo();
      } else {
        this.comboBar.width = 60 * (left / this.comboWindowMs);
      }
    }
  }

  // ---------------------------------------------------------------
  // Riff combo: chain kills without a pause (or a hit) to multiply
  // score. x2 at 3 kills, x3 at 6, x4 "ENCORE" at 10.
  // ---------------------------------------------------------------
  comboMultiplier() {
    if (this.combo >= 10) return 4;
    if (this.combo >= 6) return 3;
    if (this.combo >= 3) return 2;
    return 1;
  }

  registerKill(score) {
    const before = this.comboMultiplier();
    this.combo += 1;
    this.comboExpires = this.time.now + this.comboWindowMs;
    const mult = this.comboMultiplier();
    if (mult > before) {
      this.sound.play("antTokenCollectSound", { rate: 0.9 + mult * 0.25, volume: 0.5 });
    }
    const label =
      mult >= 4 ? "ENCORE! x4" : this.combo >= 2 ? "RIFF x" + this.combo + (mult > 1 ? "  (x" + mult + ")" : "") : "";
    this.comboText.setText(label);
    this.comboText.setTintFill(mult >= 4 ? 0xff6a9a : mult >= 3 ? 0xffb347 : 0xffee88);
    this.comboBar.setFillStyle(mult >= 4 ? 0xff6a9a : mult >= 3 ? 0xffb347 : 0xffee88);
    const vis = this.combo >= 2 ? 1 : 0;
    this.comboText.setAlpha(vis);
    this.comboBar.setAlpha(vis);
    if (this.combo >= 2) {
      this.comboText.setScale(1.4);
      this.tweens.add({ targets: this.comboText, scaleX: 1, scaleY: 1, duration: 160 });
    }
    return score * mult;
  }

  // Combo broken by time or by taking a hit
  resetCombo(byDamage = false) {
    if (this.combo >= 3 && byDamage) {
      this.sound.play("enemyHitSound", { rate: 0.5, volume: 0.3 });
    }
    this.combo = 0;
    this.comboExpires = 0;
    if (this.comboText) {
      this.comboText.setAlpha(0);
      this.comboBar.setAlpha(0);
    }
  }

  // ---------------------------------------------------------------
  // Pause / rack
  // ---------------------------------------------------------------
  togglePause() {
    const key = this._activeGameplayKey();
    if (!key) return;
    if (this.scene.isActive("PauseScene") || this.scene.isActive("GuitarRack")) return;
    const level = this.scene.get(key);
    if (level.jammy && !level.jammy.alive) return;
    level.cameras.main.setAlpha(0.5);
    this.scene.pause(key);
    this.scene.launch("PauseScene", { key });
    this.scene.pause("UIScene");
  }

  openGuitarRack() {
    const key = this._activeGameplayKey();
    if (!key) return;
    if (this.scene.isActive("GuitarRack") || this.scene.isActive("PauseScene")) return;
    const level = this.scene.get(key);
    if (level.jammy && !level.jammy.alive) return;
    this.scene.pause(key);
    this.scene.launch("GuitarRack", { key });
    this.scene.pause("UIScene");
  }

  refreshAxe() {
    this._refreshAxe(this._activeJammy());
  }

  _refreshAxe(jammy) {
    if (!this.axeLabel) return;
    const txt = jammy && jammy.rocketAxe ? (jammy.rocketArmed ? "ROCKET" : "HOP ONLY") : "";
    if (this.axeLabel.text === txt) return;
    this.axeLabel.setText(txt);
    this.axeLabel.setTintFill(jammy && jammy.rocketArmed ? 0xffb347 : 0x9a8aa8);
  }

  cycleWeapon() {
    const jammy = this._activeJammy();
    if (jammy && jammy.cycleWeapon) jammy.cycleWeapon();
  }

  // ---------------------------------------------------------------
  // HUD setters
  // ---------------------------------------------------------------
  setHP(hp, maxHP) {
    if (hp === this._shownHp && maxHP === this._shownMaxHp) return;
    const dropped = this._shownHp >= 0 && hp < this._shownHp;
    const gained = this._shownHp >= 0 && hp > this._shownHp;
    this._shownHp = hp;
    this._shownMaxHp = maxHP;
    const frac = Phaser.Math.Clamp(maxHP > 0 ? hp / maxHP : 0, 0, 1);
    // The guts art has a 1px border — crop the fill area only
    this.lifebarCrop.width = Math.round(frac * 91);
    this.lifebar.guts.setCrop(this.lifebarCrop);
    if (dropped) this._flashLifebar(0xff4040);
    if (gained) this._flashLifebar(0xf8a4c0);
  }

  _flashLifebar(tint) {
    this.lifebar.guts.setTint(tint);
    this.time.delayedCall(120, () => this.lifebar.guts.clearTint());
  }

  setSeedAmmo(n) {
    if (!this.weaponAmmoText) return;
    this.weaponAmmoText.setText(this.currentWeapon === "seed" ? `x${n}` : "");
    this.weaponAmmoText.setTintFill(n > 0 ? 0xffffff : 0xff4444);
  }

  setWeapon(weapon) {
    this.currentWeapon = weapon;
    if (!this.weaponIcon) return;
    if (weapon === "seed") {
      // Use the same generated teardrop texture the projectile uses.
      if (
        !this.textures.exists("seed-teardrop") &&
        typeof SeedOfDestruction !== "undefined" &&
        SeedOfDestruction.ensureTexture
      ) {
        SeedOfDestruction.ensureTexture(this);
      }
      this.weaponIcon.setTexture("seed-teardrop");
      this.weaponIcon.setDisplaySize(18, 12);
      this.weaponLabel.setText("SEEDS");
      this.weaponLabel.setTintFill(0xff9966);
    } else if (weapon === "slide") {
      if (!this.textures.exists("echo-note") && typeof EchoNote !== "undefined") EchoNote.ensureTexture(this);
      this.weaponIcon.setTexture("echo-note");
      this.weaponIcon.setDisplaySize(14, 16);
      this.weaponLabel.setText("SLIDE");
      this.weaponLabel.setTintFill(0x9ad8ff);
    } else if (weapon === "bass") {
      if (
        !this.textures.exists("bass-wave") &&
        typeof BassWave !== "undefined" &&
        BassWave.ensureTexture
      ) {
        BassWave.ensureTexture(this);
      }
      this.weaponIcon.setTexture("bass-wave");
      this.weaponIcon.setDisplaySize(12, 20);
      this.weaponLabel.setText("BASS");
      this.weaponLabel.setTintFill(0xb08cff);
    } else {
      this.weaponIcon.setTexture("audio-wave");
      this.weaponIcon.setDisplaySize(20, 16);
      this.weaponLabel.setText("SONIC");
      this.weaponLabel.setTintFill(0xffee88);
    }
    this.weaponIcon.setRotation(0);

    // Refresh ammo readout for the new weapon
    const jammy = this._activeJammy();
    if (weapon === "seed" && jammy) {
      this.setSeedAmmo(jammy.seedAmmo);
    } else {
      this.weaponAmmoText.setText("");
    }
  }

  setScore(score = 100) {
    this.newScore += score;
    if (this._scoreTween) this._scoreTween.stop();
    this._scoreTween = this.tweens.add({
      targets: this,
      score: this.newScore,
      duration: 600,
      onUpdate: () => {
        this.scoreText.setText("Score: " + Math.floor(this.score));
      },
      onComplete: () => {
        this.score = this.newScore;
        this.scoreText.setText("Score: " + this.score);
      },
    });
  }
}
