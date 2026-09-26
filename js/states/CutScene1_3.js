class CutScene1_3 extends Phaser.Scene {
	constructor() {
	  super({ key: "CutScene1_3" });
	}
  
	init() {
		scene=this;
	  this.storyComplete = false;
	}
  
	preload() {
	  // Preload assets if necessary
	}
  
	create() {
  
	  const fadeTime = 500;
  
	
  
	  // Create background
	  this.background = this.add.sprite(0, 0, "storyboard-jammy-get-to-business").setAlpha(0).setOrigin(0);
  
	  // Create text content
	  const text = "Jammy must hurry to wipe out the Zomberries, save the city, and make it in time to his biggest gig yet!!!";
  
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
	  const fadeTime = 500;
  
	  // Fade out background and text, then start the next scene
	  this.tweens.add({
		targets: [this.background, this.textContent, this.textContentShadow],
		alpha: 0,
		duration: fadeTime,
		onComplete: () => {
		  this.scene.start("Level1");
		},
	  });
	}
  

  
	
  }
  