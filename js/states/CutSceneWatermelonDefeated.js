class CutSceneWatermelonDefeated extends StoryScene {
  constructor() {
    super("CutSceneWatermelonDefeated", {
      storyboard: "storyboard-watermelon-defeated",
      music: "Level1MusicLoop",
      musicVolume: 0.8,
      text:
        "Jammy defeated the mighty, evil Watermelon and the city is safe... for now. Blubert sniffs out a trail of Zomberries heading for the mesa beyond town, so Jammy bolts boosters onto his guitar: the ROCKET AXE is ready for liftoff!",
      next: "Stage1_3",
      stopMusicOnExit: true,
    });
  }
}
