import { ExploreScene } from "./ExploreScene";

const FRIENDS = [
  { id: "bunny", en: "Bunny", es: "Conejito" },
  { id: "frog", en: "Frog", es: "Rana" },
  { id: "cat", en: "Cat", es: "Gatito" },
] as const;

/** Free Play Garden — ExploreScene proof. */
export class FreePlayScene extends ExploreScene {
  constructor() {
    super("FreePlay");
  }

  backgroundKeys() {
    return { landscape: "freeplay-landscape", portrait: "freeplay-portrait" };
  }

  setupWorld() {
    this.speak("Play in the garden! Tap the friends.", "¡Juega en el jardín! Toca a los amigos.");
    FRIENDS.forEach((f, i) => {
      this.addTappableFriend(f.id, `char-${f.id}`, f.en, f.es, i);
    });
    this.addSceneryTap(0.72, 0.55, "Sparkles!", "¡Brillos!", "flower");
  }
}
