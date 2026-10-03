class BurningFragment extends Phaser.Physics.Arcade.Sprite {
	constructor(scene, x, y, velocityX, velocityY) {
	  super(scene, x, y, 'burning-fragment');
	  // Set initial properties
	  this.invincible = true;
	  this.dead = false;
  
	  // Add fragment to scene and enable physics
	  scene.add.existing(this);
	  scene.physics.add.existing(this);
  
	  // Setup physics properties
	  this.body.setBounce(0);
	  this.body.setAllowGravity(false);
	  this.body.setVelocity(velocityX, velocityY); // Set initial velocity based on PineappleBomb input
	  this.body.setSize(8, 8);
  
	  // Animation for burning effect
	  this.anims.create({
		key: 'burn',
		frames: this.anims.generateFrameNames('burning-fragment', {
		  prefix: 'burn',
		  start: 1,
		  end: 2,
		}),
		frameRate: 4,
		repeat: -1,
	  });
	  this.play('burn');
  
  
	  // Add fragment to the enemy projectiles group
		  // Check collision with Jammy
		  this.scene.physics.add.overlap(this, this.scene.jammy.sprite, (frag, jammy) => {
			if (!jammy.parentObject.invincible) {
			  jammy.parentObject.takeDamage(frag.x);
			}
		  }, null, this);

		// Shrapnel sets off other pineapples (chain reaction) and singes
		// anything else it touches.
		this._burned = new Set();
		if (scene.enemies) {
			this.scene.physics.add.overlap(this, scene.enemies, (frag, e) => {
				if (!e || !e.active || e.dead || this._burned.has(e)) return;
				this._burned.add(e);
				if (typeof e.igniteFromBlast === "function") {
					if (e.alive) e.igniteFromBlast();
				} else if (!e.invincible && typeof e.takeDamage === "function") {
					e.takeDamage(1);
				}
			});
		}

		this.autoDestroyTimer = scene.time.addEvent({
			delay: 2000,
			callback: () => { if (this.active) this.destroy(); },
		});
		this.once(Phaser.GameObjects.Events.DESTROY, () => {
			if (this.autoDestroyTimer) this.autoDestroyTimer.remove(false);
		});
	
		

		
	}
  
	
  
	die() {
	  this.destroy(); // Remove from the scene
	}
  }
  