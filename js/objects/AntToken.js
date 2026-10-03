class AntToken extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, "ant-token", "spin1");
        this.score = 1000;
        this.gameName = 'AntToken';

        scene.add.existing(this);
        this.scene.physics.add.existing(this);
        this.body.setAllowGravity(false);
        this.setDepth(58);
        this.setDisplaySize(16, 16);
        this.play("ant-token-spin");

        scene.collectibles.add(this);
    }

    effect() {
        awardScore(scene, this.score, this.x, this.y, { combo: false });
        scene.sound.play("antTokenCollectSound");
        this.body.setEnable(false);
        this.stop();

        if (scene.jammy && typeof scene.jammy.antTokens === 'number') {
            scene.jammy.antTokens += 1;
        }
        const run = getRunState();
        if (run) {
            const key = scene.sys.settings.key;
            run.tokens[key] = (run.tokens[key] || 0) + 1;
        }
        if (typeof scene.tryReviveBlubert === 'function') scene.tryReviveBlubert();

        this.setAlpha(1);
        this.setDisplaySize(48, 48);
        scene.tweens.add({
            targets: this,
            displayWidth: 0,
            displayHeight: 0,
            alpha: 0,
            duration: 200,
            ease: "Linear",
            onComplete: () => {
                this.destroy();
            },
        });
    }
}
