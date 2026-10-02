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
    this.gameplaySceneKeys = ["Level1", "Level1BossFight", "Stage1_3", "Stage1_4"];
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
    }
    if (this.gamepad) this.gamepad.update(jammy);
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
