class EnemyDeath extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "enemy-death");
        this.scene = scene;

        // Add sprite to the scene
        this.scene.add.existing(this);

        // Set anchor (origin)
        this.setOrigin(0.5, 0.5);

        // The "death" animation is created once in Preload
        this.scene.sound.play("enemyDeathSound"); // Play sound effect

        this.play("death").once("animationcomplete", () => {
            this.destroy();
        });

      
    }

   


    // Empty update method (if needed for future functionality)
    update() {}
}
