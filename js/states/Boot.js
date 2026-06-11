class Boot extends Phaser.Scene{

	constructor(){

		super('Boot');

	};
	preload() {
		// Load loading bar image
		this.load.image('loadingBar', 'assets/img/misc/loadingBar.png');
		this.load.image('jammyLoader', 'assets/img/sprites/jammy/resting/jammy-still.png');
	}
	create() {
		// Register the crisp runtime retro font before any scene
		// renders text — replaces the blurry downscaled bitmap font.
		installRetroFont(this);

		let centerX=this.cameras.main.centerX;
		let centerY=this.cameras.main.centerY;
		// Add jammy image
    	this.jammyImage = this.add.image(centerX, centerY,'jammyLoader');
    	this.jammyImage.setOrigin(0.5, 0.5);


			// Go fullscreen on mobile devices and go to next screen
		this.input.on('pointerup', function(){
			this.scale.startFullscreen();
			// Go to Preload scene
			this.scene.start('Preload');
		}, this);
		
	}
	


}