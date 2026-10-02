# JAMMED
An 8-bit platformer inspired by Jams Player, featuring retro-style gameplay and nostalgic pixel art.

Play it here: https://nkoteskey.github.io/JAMMED/

(The game is published automatically by the *Deploy to GitHub Pages* workflow in `.github/workflows/deploy-pages.yml` on every push to `main`.)

![image](https://github.com/user-attachments/assets/4126a93b-7b5d-4edd-b78f-aae124eff760)

## Controls

| Action | Keys |
| --- | --- |
| Move | A / D or ← / → |
| Jump (press again in the air to double jump) | SPACE, Z or K |
| Shoot | Q, N, SHIFT or X |
| Aim up | W or ↑ |
| Swap guitar / weapon | C |
| Guitar Rack (collection) | G |
| Pause | E, P or ESC |

On phones and tablets an on-screen joystick, JUMP and SHOOT buttons, a pause button (top centre) and a weapon-swap tap target (top right) appear automatically.

## Progression

* **Stage 1-1 Los Jamgeles** and **1-2 The Theater** (the Watermelon boss): sonic blast from the Crimson V plus a plain double jump.
* Beating the Watermelon earns the **Rocket Axe** — from then on the second jump fires the guitar's boosters for a long arc, and it stays with you for the rest of the game.
* **Stage 1-3 Sunset Mesa**: the **Seedcaster** is found on the main path. Seed bombs blow Zomberries out of their bushes (Blubert's scan reveals which bushes are hiding one) and home onto whatever Blubert has locked.
* **Stage 1-4 The Jam Works**: the **Royal Bass** sits on the staircase plateau. Its quake wave rolls along the floor and pierces every enemy in a row — ideal for the jar sentries patrolling the factory.

HP and seed ammo carry from stage to stage; dying restarts the current stage with full health. Bread Tokens are tallied per stage on the Stage Clear card and in the end credits.

## Running locally

The game is plain HTML/JS with Phaser vendored in `includes/`. Serve the folder with any static server, e.g.

```
python3 -m http.server 8000
```

and open http://localhost:8000/. Add `?dev` to the URL for warp portals at the start of Stage 1-1 (to 1-3, 1-4 and the boss) and `?debug` to draw physics bodies.

Leave feedback or suggestions in issues. Enjoy!

## License

This project is licensed under the **Autonomi Network Restricted License** – see the [LICENSE](./LICENSE) file for details.
