class CutScene1_1 extends Phaser.Scene {
	constructor() {
	  super({ key: "CutScene1_1" });
	}
  
init(){scene = this}

	preload() {
	  // Preload assets if necessary
	}
  
	create() {
  
	  this.storyComplete = false;
	  const fadeTime = 500;
  
	  // Play music
	  this.sound.stopAll();
	  if (typeof Chip !== "undefined") Chip.stop();
	  this.startSounds("Jammed",{loop:true});
  
	  // Create background
	  this.background = this.add.sprite(0, 0, "storyboard-try-out").setAlpha(0).setOrigin(0);
  
	  // Create and configure text
	  const text =
		"Jammy is trying out for a fill-in position with the hottest punk rock band in town, and gets the gig! Rehearsal starts in downtown Los Jamgeles in ten minutes. Time to get moving!!!";
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
  
	  // Fade in background and text sequentially
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
	  if (!this.game.device.desktop) {
		this.createMobileControls();
	  }

	  scene.input.on('pointerdown', function(pointer){
		this.transitionToNextScene();
	  },this);

	  this.input.keyboard.on('keydown', function(event){
		this.transitionToNextScene();
	  }
	  ,this);
	}
  
	update() {
		
	  }
	  
  
	  transitionToNextScene() {

		if(this.storyComplete){
		  const fadeTime = 500;
	  
		  // Fade out background and text, then start next scene
		  this.tweens.add({
			targets: [this.background, this.textContent, this.textContentShadow],
			alpha: 0,
			duration: fadeTime,
			onComplete: () => {
			  this.scene.start("CutScene1_2");
			},
		  });
		}
	}
  
	startSounds(songTitle) {
	  // Ensure the correct music is playing
	  if (this.bgMusic?.name !== songTitle) {
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
	  // Example placeholders:
	  this.jumpButton = this.add.rectangle(50, 400, 50, 50, 0x0000ff).setInteractive();
	  this.attackButton = this.add.rectangle(150, 400, 50, 50, 0xff0000).setInteractive();
	  this.pauseButton = this.add.rectangle(250, 400, 50, 50, 0x00ff00).setInteractive();
	}
  }
  