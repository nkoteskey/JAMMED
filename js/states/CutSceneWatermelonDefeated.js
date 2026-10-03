class CutSceneWatermelonDefeated extends StoryScene {
  constructor() {
    super("CutSceneWatermelonDefeated", {
      storyboard: "storyboard-watermelon-defeated",
      music: "Level1MusicLoop",
      musicVolume: 0.8,
      text:
        "Jammy defeated the mighty, evil Watermelon and freed its prisoner: a little blueberry drone named BLUBERT, who can sniff out hidden Zomberries! Blubert picks up a trail heading for the mesa beyond town, so Jammy bolts boosters onto his guitar: the ROCKET AXE is ready for liftoff!",
      next: "Stage1_3",
      stopMusicOnExit: true,
    });
  }
}
