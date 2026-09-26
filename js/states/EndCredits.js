class EndCredits extends Phaser.Scene {
  constructor() {
    super({ key: "EndCredits" });
  }

  preload() {}
  create() {

    // Bool to track state of scene
    this.sceneComplete = false;
    this.fadeDelay = 1000;
    this.fadeTime = 3000;
    this.nextLineDelay = 240; // 4 seconds

    // Start decoding music and sfx, and start when ready
    this.sound.stopAll();
    if (typeof Chip !== "undefined") Chip.stop();
    this.bgMusic= this.sound.add("Level1MusicLoop");
   this.bgMusic.play();

    // Create the background

    // Create award statements for collected bread tokens
    this.awardStatements = [
      "Good try! Next time, try collecting the Bread Tokens.",
      "Good try! Next time, try collecting all five Bread Tokens.",
      "Not bad! Next time, try collecting all five Bread Tokens.",
      "Pretty Good! Next time, try collecting all five Bread Tokens.",
      "Excellent! You were just one Bread Token shy of perfection.",
      "Superb! You are a Jammed Master!",
    ];

    // Create credit roll text
    this.textBlockIndex = 0;
    this.textBlocks = [
      {
        topLine: "Executive Producer",
        bottomLine: "Nicholas Koteskey",
      },
      {
        topLine: "Producer",
        bottomLine: "Jim Kulakowski",
      },
      {
        topLine: "Programmers\n",
        bottomLine: " Dustin McMurry \n Jim Kulakowski",
      },
      {
        topLine: "Level Design\n\n",
        bottomLine: "\nNicholas Koteskey \n  Jim Kulakowski \n  Dustin McMurry",
      },
      {
        topLine: "Music Composer / Sound Engineer",
        bottomLine: "Jim Kulakowski",
      },
      {
        topLine: "Artist",
        bottomLine: "Jim Kulakowski",
      },
      {
        topLine: "Storyboard Art",
        bottomLine: "Nicholas Koteskey",
      },
    ];

    let centerX = this.cameras.main.centerX;
    let centerY = this.cameras.main.centerY;

    this.textTopLine = this.add.bitmapText(
      centerX,
      centerY - 8,
      "8-bit-mono",
      this.textBlocks[this.textBlockIndex].topLine,
      12
    );
    this.textTopLine.setOrigin(0.5, 0.5);
    //this.textTopLine.maxWidth = 330;
    this.textTopLine.tint = 0xffffff;
    this.textTopLine.alpha = 0;

    this.textBottomLine = this.add.bitmapText(
      centerX,
      centerY + 8,
      "8-bit-mono",
      this.textBlocks[this.textBlockIndex].bottomLine,
      12
    );
    this.textBottomLine.setOrigin(0.5, 0.5);
    // this.textBottomLine.maxWidth = 330;
    this.textBottomLine.tint = 0xffffff;
    this.textBottomLine.alpha = 0;

  

    // Fade in the text
    //this.fadeLinesIn();
    // Fade this text block out
    this.textTween=this.tweens.add({
      targets: this.textTopLine,
      alpha: 1,
      duration: this.fadeTime,
      //easing: "Linear",
      yoyo: true,
      //delay: this.fadeDelay,
      repeat: -1,
      ease: "Cubic",
      callbackScope: this,
      onRepeat: function () {

        this.textBlockIndex++;
   
        if (this.textBlockIndex > this.textBlocks.length - 1) {
          this.textBlockIndex = 0;
        this.restartGame();
        }
       
        this.textTopLine.setText(this.textBlocks[this.textBlockIndex].topLine);
        this.textBottomLine.setText(
          this.textBlocks[this.textBlockIndex].bottomLine
        );
      },
    });
this.bottomTextTween= this.tweens.add({
      targets: [this.textBottomLine],
      alpha: 1,
      duration: this.fadeTime,
      ease: "Cubic",
      yoyo: true,
      //delay: this.fadeDelay,
      repeat: -1,
      callbackScope: this,
    });
  }
 

  initAntTokens() {
    // Initiate group to store Bread Tokens
    this.collectibles = this.add.group();

    // Add bread tokens to stage and center anchor each
    this.finalAntTokenOutlines = [
      this.add.image(centerX - 32, centerY, "bread-token-outline-hud"),
      this.add.image(centerX - 16, centerY, "bread-token-outline-hud"),
      this.add.image(centerX, centerY, "bread-token-outline-hud"),
      this.add.image(centerX + 16, centerY, "bread-token-outline-hud"),
      this.add.image(centerX + 32, centerY, "bread-token-outline-hud"),
    ];
    for (var i = 0; i < this.finalAntTokenOutlines.length; i++) {
      this.finalAntTokenOutlines[i].anchor.setTo(0.5, 0.5);
    }

    // Add animated bread tokens and hide them
    this.finalAntTokens = [
      new AntToken(this, centerX - 32, centerY),
      new AntToken(this, centerX - 16, centerY),
      new AntToken(this, centerX, centerY),
      new AntToken(this, centerX + 16, centerY),
      new AntToken(this, centerX + 32, centerY),
    ];
    for (var i = 0; i < this.finalAntTokens.length; i++) {
      this.finalAntTokens[i].alpha = 0;
    }
  }
  transitionToNextScene() {
    this.state.start("TitleScreen");
  }
  launchSound() {
    this.allSounds.shift();
    if (!this.bgMusic.isPlaying) {
      this.bgMusic.loopFull(0.9);
    }
  }
  restartGame() {
   this.bottomTextTween.stop();
   this.textTween.stop();
   this.tweens.add({
      targets:this.bgMusic,
     volume:0,
      duration: 1000,
      ease: "Cubic",
      callbackScope: this,
      onComplete: () => {
      this.sound.stopAll();
      if (typeof Chip !== "undefined") Chip.stop();
    this.scene.start("TitleScreen");

      }});
  }
}
