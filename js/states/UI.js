class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: "UIScene" });
  }

  init(data) {
    this.score = data.score;
    this.gameScene = data.key;
  }

  create() {
    if (!this.score) {
      this.score = 0;
    }
    this.newScore = 0;
    if (!this.gameScene) {
      this.gameScene = "Level1";
    }
    this.scoreText = this.add.bitmapText(
      10,
      10,
      "tempFont",
      "Score: " + this.score,
      12
    ).setTintFill(0xffffff);

    // Weapon indicator (top-right)
    this.currentWeapon = "sonic";
    this.weaponIcon = this.add.sprite(410, 14, "audio-wave");
    this.weaponIcon.setDisplaySize(20, 16);
    this.weaponLabel = this.add.bitmapText(374, 22, "tempFont", "SONIC", 8)
      .setTintFill(0xffee88);
    this.weaponAmmoText = this.add.bitmapText(374, 2, "tempFont", "", 8)
      .setTintFill(0xffffff);

    // HUD only shown during gameplay scenes — hidden over title/cutscenes/credits
    this.gameplaySceneKeys = ["Level1", "Level1BossFight", "Stage1_3", "Stage1_4"];
    this.scene.setVisible(false);

    this.input.keyboard.on(
      "keydown-E",
      () => {
        const key = this._activeGameplayKey();
        if (!key) return;
        let level = this.scene.get(key);
        level.cameras.main.setAlpha(0.5);
        this.scene.pause("UIScene");
        this.scene.pause(key);
        this.scene.launch("PauseScene", { key });
      },
      this
    );

    // Guitar Rack — collection/equip overlay
    this.input.keyboard.on(
      "keydown-G",
      () => {
        const key = this._activeGameplayKey();
        if (!key) return;
        if (this.scene.isActive("GuitarRack")) return;
        this.scene.pause("UIScene");
        this.scene.pause(key);
        this.scene.launch("GuitarRack", { key });
      },
      this
    );
  }

  // The gameplay scene actually running right now — init data goes
  // stale once warps/portals change scenes, so always look it up.
  _activeGameplayKey() {
    const active = this.scene.manager
      .getScenes(true)
      .map((s) => s.sys.settings.key);
    return active.find((k) => this.gameplaySceneKeys.includes(k));
  }

  update() {
    if (!this.gameplaySceneKeys) return;
    const active = this.scene.manager
      .getScenes(true)
      .some((s) => this.gameplaySceneKeys.includes(s.sys.settings.key));
    if (this.scene.isVisible() !== active) {
      this.scene.setVisible(active);
    }
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
      if (!this.textures.exists("seed-teardrop") &&
          typeof SeedOfDestruction !== "undefined" &&
          SeedOfDestruction.ensureTexture) {
        SeedOfDestruction.ensureTexture(this);
      }
      this.weaponIcon.setTexture("seed-teardrop");
      this.weaponIcon.setDisplaySize(18, 12);
      this.weaponIcon.setRotation(0);
      this.weaponLabel.setText("SEEDS");
      this.weaponLabel.setTintFill(0xff9966);
    } else if (weapon === "bass") {
      if (!this.textures.exists("bass-wave") &&
          typeof BassWave !== "undefined" && BassWave.ensureTexture) {
        BassWave.ensureTexture(this);
      }
      this.weaponIcon.setTexture("bass-wave");
      this.weaponIcon.setDisplaySize(12, 20);
      this.weaponIcon.setRotation(0);
      this.weaponLabel.setText("BASS");
      this.weaponLabel.setTintFill(0xb08cff);
    } else {
      this.weaponIcon.setTexture("audio-wave");
      this.weaponIcon.setDisplaySize(20, 16);
      this.weaponIcon.setRotation(0);
      this.weaponLabel.setText("SONIC");
      this.weaponLabel.setTintFill(0xffee88);
    }
    // Refresh ammo readout for the new weapon
    if (this.weaponAmmoText) {
      if (weapon === "seed" && scene && scene.jammy) {
        this.weaponAmmoText.setText(`x${scene.jammy.seedAmmo}`);
        this.weaponAmmoText.setTintFill(scene.jammy.seedAmmo > 0 ? 0xffffff : 0xff4444);
      } else {
        this.weaponAmmoText.setText("");
      }
    }
  }

  setScore(score=100){
    this.newScore+=score;
    scene.tweens.add({
    targets:this,
    callbackScope:this,
    score:this.newScore,
    duration:1000,
    onUpdate:function(){
      this.scoreText.setText("Score: "+Math.floor(this.score))
    
    
    }
    
    });
    
    
    
    
    
    }
}
