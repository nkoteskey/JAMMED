class CutSceneWatermelonDefeated extends Phaser.Scene {
	constructor() {
	  super({ key: "CutSceneWatermelonDefeated" });
	}
  
	init() {
	  this.storyComplete = false;
	}
  
	preload() {
	  // Preload assets if necessary
	}
  
	create() {
  
	  const fadeTime = 500;
  
	  // Play background music
	  scene.sound.stopAll();
	  if (typeof Chip !== "undefined") Chip.stop();
	  Chip.play("mesa");
	  // Create background
	  this.background = this.add.sprite(0, 0, "storyboard-watermelon-defeated").setOrigin(0).setAlpha(0);
  
	  // Create text content
	  const text = "Jammy defeated the mighty, evil Watermelon and joined the rest of the band for rehearsal. Everything appears to be back to normal, for now...to be continued...";
  
	  this.textContentShadow = this.add
		.bitmapText(this.cameras.main.centerX + 1, 181, "8-bit-mono", text, 12)
		.setOrigin(0.5)
		.setMaxWidth(330)
		.setTint(0x000000)
		.setAlpha(0);
  
	  this.textContent = this.add
		.bitmapText(this.cameras.main.centerX, 180, "8-bit-mono", text, 12)
		.setOrigin(0.5)
		.setMaxWidth(330)
		.setTint(0xd8f878)
		.setAlpha(0);
  
	  // Fade in background and then text sequentially
	  this.tweens.add({
		targets: this.background,
		alpha: 1,
		duration: fadeTime,
		onComplete: () => {
		  this.tweens.add({
			targets: this.textContentShadow,
			alpha: 1,
			duration: fadeTime,
			onComplete: () => {
			  this.tweens.add({
				targets: this.textContent,
				alpha: 1,
				duration: fadeTime,
				onComplete: () => {
				  this.storyComplete = true;
				},
			  });
			},
		  });
		},
	  });
  
	  // Add virtual controls for non-desktop devices
	  if (!this.sys.game.device.os.desktop) {
		this.createMobileControls();
	  }
	}
  
	update() {
	  if (this.storyComplete) {
		const keys = this.input.keyboard;
  
		// Check for key presses
		if (
		  keys.addKey(Phaser.Input.Keyboard.KeyCodes.Z).isDown ||
		  keys.addKey(Phaser.Input.Keyboard.KeyCodes.X).isDown ||
		  
		  keys.addKey(Phaser.Input.Keyboard.KeyCodes.Q).isDown ||
		  keys.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).isDown 
		) {
		  this.transitionToNextScene();
		}
  
		// Check for virtual button presses
		if (!this.sys.game.device.os.desktop) {
		  if (this.jumpButtonPressed || this.attackButtonPressed) {
			this.transitionToNextScene();
		  }
		}
	  }
	}
  
	transitionToNextScene() {
	  const fadeTime = 500;
  
	  // Fade out background and text, then transition to EndCredits scene
	  this.tweens.add({
		targets: [this.background, this.textContent, this.textContentShadow],
		alpha: 0,
		duration: fadeTime,
		onComplete: () => {
			this.sound.stopAll();
			if (typeof Chip !== "undefined") Chip.stop();
		  this.scene.start("CutSceneBlubert");
		
		},
	  });
	}
  
	startSounds(songTitle) {
	  if (this.bgMusic?.key !== songTitle) {
		this.bgMusic?.stop();
		this.bgMusic = this.sound.add(songTitle, { loop: true });
	  }
  
	  this.bgMusic.play();
  
	  // Set up sound effects
	  this.jumpSound = this.sound.add("jumpSound");
	  this.laserSound = this.sound.add("laserSound");
	  this.heroTakeHitSound = this.sound.add("shortExplosion");
	  this.enemyHitSound = this.sound.add("shortWave");
	  this.enemyDeathSound = this.sound.add("shortExplosion");
  
	  this.allSounds = [
		this.bgMusic,
		this.jumpSound,
		this.laserSound,
		this.heroTakeHitSound,
		this.enemyHitSound,
		this.enemyDeathSound,
	  ];
	}
  
	createMobileControls() {
	  // Add virtual buttons for mobile controls
	  this.jumpButton = this.add.rectangle(50, 400, 50, 50, 0x0000ff).setInteractive();
	  this.attackButton = this.add.rectangle(150, 400, 50, 50, 0xff0000).setInteractive();
	}
  }
  