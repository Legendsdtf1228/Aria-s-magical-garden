"use client";

import { FRIENDS } from "../data/friends";
import type { FriendId } from "../types/game";
import { GardenAnimal } from "./GardenAnimal";
import { GardenScene } from "./GardenScene";

type Props = {
  collected: FriendId[];
  onHear: (en: string, es: string) => void;
  onHome: () => void;
};

export function MyGardenScreen({ collected, onHear, onHome }: Props) {
  return (
    <GardenScene scene="hub" className="my-garden-screen">
      <section className="card wide-card">
        <p className="eyebrow">My Garden • Mi Jardín</p>
        <h1>
          Aria&apos;s<br />
          <span>Friends</span>
        </h1>
        <p className="intro">
          Tap a friend to hear their name. · Toca un amigo para oír su nombre.
        </p>
        <div className="friend-grid">
          {FRIENDS.map((f) => {
            const owned = collected.includes(f.id);
            return (
              <button
                key={f.id}
                type="button"
                className={`friend-card ${owned ? "owned" : "mystery"}`}
                onClick={() => owned && onHear(f.en, f.es)}
                aria-label={owned ? `${f.en}, ${f.es}` : "Mystery friend"}
                disabled={!owned}
              >
                <span className="friend-pic">
                  {owned ? (
                    <GardenAnimal id={f.id} pose="idle" size={72} title={`${f.en} ${f.es}`} />
                  ) : (
                    "?"
                  )}
                </span>
                {owned ? (
                  <>
                    <strong>{f.en}</strong>
                    <small>{f.es}</small>
                  </>
                ) : (
                  <strong>Friend?</strong>
                )}
              </button>
            );
          })}
        </div>
        <button type="button" className="play" onClick={onHome}>
          Home • Inicio
        </button>
      </section>
    </GardenScene>
  );
}
