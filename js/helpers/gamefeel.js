// Shared platformer feel: a camera that looks where you're going,
// checkpoints that respect the player's time, and impact feedback.
// Every gameplay scene calls these so the whole game feels the same.

// --- Camera -----------------------------------------------------------
// Deadzone + smoothing + look-ahead in the direction of travel, so the
// player sees what's coming instead of what they just walked past.
function setupPlatformerCamera(scene, jammy, opts = {}) {
  const cam = scene.cameras.main;
  cam.startFollow(jammy.sprite, true, opts.lerpX || 0.14, opts.lerpY || 0.12);
  cam.setDeadzone(opts.dzW || 48, opts.dzH || 56);
  scene._camLook = 0;
  scene._camLookMax = opts.look !== undefined ? opts.look : 48;
  scene._camVertBias = opts.vertBias || 0;
}

function updatePlatformerCamera(scene, jammy) {
  if (!jammy || !jammy.sprite || scene._camLookMax === undefined) return;
  const cam = scene.cameras.main;
  const vx = jammy.sprite.body ? jammy.sprite.body.velocity.x : 0;
  // Only lead once actually moving, so standing still doesn't drift
  let want = 0;
  if (Math.abs(vx) > 20) want = (vx > 0 ? 1 : -1) * scene._camLookMax;
  scene._camLook += (want - scene._camLook) * 0.045;
  cam.setFollowOffset(-scene._camLook, scene._camVertBias);
}

// --- Checkpoints ------------------------------------------------------
// Diegetic save points: x0x relay posts. Touch one and the murmur
// remembers you there, so a death late in a long stage doesn't send
// you back to the front door.
//
// Phaser reuses the scene instance across restart(), so the recorded
// checkpoint survives a death without any extra plumbing.
function ensureRelayTexture(scn) {
  if (scn.textures.exists("relay-post-off")) return;
  const draw = (lit) => {
    const g = scn.make.graphics({ x: 0, y: 0, add: false });
    // Post
    g.fillStyle(0x3a3f52, 1);
    g.fillRect(6, 10, 4, 30);
    g.fillStyle(0x575e78, 1);
    g.fillRect(6, 10, 2, 30);
    // Base
    g.fillStyle(0x23273a, 1);
    g.fillRect(2, 38, 12, 4);
    // Dish
    g.fillStyle(lit ? 0x2ab8b0 : 0x4a5468, 1);
    g.fillRect(2, 2, 12, 3);
    g.fillRect(0, 5, 16, 2);
    g.fillRect(3, 7, 10, 2);
    g.fillStyle(lit ? 0x7fe8e0 : 0x666f88, 1);
    g.fillRect(2, 2, 12, 1);
    // Lamp
    g.fillStyle(lit ? 0xffd877 : 0x2a2f40, 1);
    g.fillRect(6, 13, 4, 4);
    if (lit) {
      g.fillStyle(0xfff0b0, 1);
      g.fillRect(7, 14, 2, 2);
    }
    g.generateTexture(lit ? "relay-post-on" : "relay-post-off", 16, 42);
    g.destroy();
  };
  draw(false);
  draw(true);
}

// spots: array of [x, groundY] — the ground the post stands on.
// Works for horizontal stages and for the vertical Spire alike.
function initCheckpoints(scene, spots, defaultGroundY) {
  ensureRelayTexture(scene);
  scene._checkpoints = [];
  spots.forEach((spot) => {
    const x = Array.isArray(spot) ? spot[0] : spot;
    const groundY = Array.isArray(spot) ? spot[1] : defaultGroundY;
    const lit = scene._checkpointX === x;
    const post = scene.physics.add.sprite(x, groundY - 21,
      lit ? "relay-post-on" : "relay-post-off");
    post.body.setAllowGravity(false);
    post.body.setImmovable(true);
    post.setDepth(45);
    post.cpX = x;
    post.lit = lit;
    scene._checkpoints.push(post);
    scene.physics.add.overlap(scene.jammy.sprite, post, () => {
      if (post.lit) return;
      post.lit = true;
      scene._checkpointX = x;
      scene._checkpointY = groundY - 28;
      post.setTexture("relay-post-on");
      // Ping outward — the murmur picking up a new node
      const ring = scene.add.circle(post.x, post.y - 16, 8, 0x7fe8e0, 0);
      ring.setStrokeStyle(2, 0x7fe8e0, 0.9);
      ring.setDepth(46);
      scene.tweens.add({
        targets: ring, scale: 4, alpha: 0, duration: 620,
        onComplete: () => ring.destroy(),
      });
      if (scene.cache.audio.exists("antTokenCollectSound")) {
        scene.sound.play("antTokenCollectSound", { volume: 0.5, rate: 1.5 });
      }
      if (scene.murmur) scene.murmur.say("relay up. the murmur has you here");
    });
  });
}

// Where should Jammy start this attempt? Falls back to the level start.
function checkpointSpawn(scene, defaultX, defaultY) {
  if (scene._checkpointX !== undefined && scene._checkpointX !== null) {
    return {
      x: scene._checkpointX,
      y: scene._checkpointY !== undefined ? scene._checkpointY : defaultY,
    };
  }
  return { x: defaultX, y: defaultY };
}

// Call when a stage is completed so the next visit starts clean.
function clearCheckpoints(scene) {
  scene._checkpointX = null;
  scene._checkpointY = null;
}

// --- Impact feedback --------------------------------------------------
// A few frames of frozen physics on a meaningful hit. Reads as weight;
// the single cheapest thing that makes combat feel good.
function hitStop(scene, ms = 60) {
  if (!scene.physics || !scene.physics.world || scene._hitStopping) return;
  scene._hitStopping = true;
  scene.physics.world.pause();
  scene.time.delayedCall(ms, () => {
    scene._hitStopping = false;
    if (scene.physics && scene.physics.world) scene.physics.world.resume();
  });
}

// Red edge flash when Jammy is hurt — readable even on a small phone
// screen where a sprite tint is easy to miss.
function damageVignette(scene) {
  const cam = scene.cameras.main;
  const g = scene.add.graphics();
  g.setScrollFactor(0).setDepth(370);
  g.fillStyle(0xff2244, 0.5);
  g.fillRect(0, 0, cam.width, 10);
  g.fillRect(0, cam.height - 10, cam.width, 10);
  g.fillRect(0, 0, 10, cam.height);
  g.fillRect(cam.width - 10, 0, 10, cam.height);
  scene.tweens.add({
    targets: g, alpha: 0, duration: 340,
    onComplete: () => g.destroy(),
  });
}
