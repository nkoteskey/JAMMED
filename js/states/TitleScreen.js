class TitleScreen extends Phaser.Scene {
  constructor() {
    super({ key: "TitleScreen" });
    scene=this
  }

  create() {
console.log(this.input)
    this.nextScene = "CutScene1_1";

    // The original title theme. The runtime chiptune synth scores the
    // stages built since, but the intro music is the game's signature
    // and stays exactly as it was.
    if (typeof Chip !== "undefined") Chip.stop();
    this.sound.stopAll();
    this.sound.play("Jammed", { loop: true });

    const startGame = () => {
      if (typeof Chip !== "undefined") Chip.stop();
      this.scene.start('CutScene1_1');
      this.scene.launch('UIScene', { score: 0, key: 'Level1' });
      this.scene.bringToTop('UIScene');
    };

    //start the game on click/tap anywhere (except the stage-select chip)
    this.input.once("pointerdown", startGame, this);
    this.input.keyboard.on("keydown-SPACE", startGame);


    // display the background
    var background = this.add.sprite(0, 0, "titleScreenBg");
    let centerX = this.cameras.main.centerX;
    let centerY = this.cameras.main.centerY;
    background.setOrigin(0, 0);
    // Create the press start text
    this.startTextShadow = this.add.bitmapText(
      centerX + 2,
      centerY + 2,
      "8-bit-mono",
      "START GAME",
      15
    );

    this.startTextShadow.tint = 0x000000;
    this.startText = this.add.bitmapText(
      centerX,
      centerY,
      "8-bit-mono",
      "PRESS BUTTON TO START",
      15
    );
    this.startText.setOrigin(0.5, 0.5);
    this.startTextShadow.setOrigin(0.5, 0.5);

    this.tweens.add({
      targets: [this.startText, this.startTextShadow],
      alpha: 0,
      yoyo: true,
      repeat: -1,
      duration: 500,
      ease: "Linear",
    });

    // Stage select — tap the chip or press S. Sits below the start
    // prompt and swallows its own pointer event so it doesn't also
    // trigger "start game".
    const selY = this.cameras.main.height - 26;
    const selBg = this.add.rectangle(centerX, selY, 148, 18, 0x1c1430, 0.92);
    selBg.setStrokeStyle(1, 0xffd877, 0.8);
    this.add.bitmapText(centerX, selY, "tempFont", "S - STAGE SELECT", 8)
      .setOrigin(0.5).setTintFill(0xffd877);
    const openSelect = () => {
      if (typeof Chip !== "undefined") Chip.stop();
      this.sound.stopAll();
      this.scene.start("StageSelect");
    };
    selBg.setInteractive();
    selBg.on("pointerdown", (pointer, lx, ly, event) => {
      if (event && event.stopPropagation) event.stopPropagation();
      openSelect();
    });
    this.input.keyboard.on("keydown-S", openSelect);
    // Conditionally, add the VirtualGamepad plugin to the scene
    // if(!this.device.desktop) {
    // 	this.createMobileControls();
    // }

    

   

  }
  update() {
   if(this.jammy){
    this.jammy.update();
    }
    // // Listen for keyboard input and act accordingly
    // if(this.input.keyboard.isDown(Phaser.Keyboard.Z) ||
    //    this.input.keyboard.isDown(Phaser.Keyboard.X)) {
    // 	this.state.start(this.nextScene);
    //     this.startGameSound.play();
    // }
    // // Go to next scene
    // if(!this.device.desktop) {
    //     if (this.jumpButton.isDown || this.attackButton.isDown || this.pauseButton.isDown) {
    //         this.state.start(this.nextScene);
    //         this.startGameSound.play();
    //     }
    // }
  }
  /**
   * Destroys or revives the start text game objects
   */
  updateCounter() {
    if (this.startText.exists) {
      this.startText.kill();
    } else {
      this.startText.revive();
    }

    if (this.startTextShadow.exists) {
      this.startTextShadow.kill();
    } else {
      this.startTextShadow.revive();
    }
  }
  render() {
    //this.debug();
    // this.debug.text('android: ' + this.device.android, 4, 14, "#00ff00");
    // this.debug.text('iOS: ' + this.device.iOS, 4, 30, "#00ff00");
    // var renderer = this.renderType == 1 ? 'Canvas' : 'WebGL';
    // this.debug.text('renderer: ' + renderer, 4, 44, "#00ff00");
    //this.debug.text(Phaser.VERSION, 4, 14, "#00ff00");
  }
}
