"use client";

/**
 * LEGACY QUARANTINE STUB — GardenAnimal SVG is forbidden in V5.
 * Renders painted-garden-v1 CharacterSprite only. Never SVG/emoji.
 */
import { CharacterSprite } from "./game/SceneKit";
import { characterArtId } from "../game/assets";
import type { GardenAnimalId, AnimalPose } from "../data/gardenAnimals";

type Props = {
  id: GardenAnimalId;
  pose?: AnimalPose;
  size?: number;
  title?: string;
  className?: string;
};

export function GardenAnimal({ id, pose = "idle", size = 120, title, className = "" }: Props) {
  const mappedPose = pose === "celebrate" || pose === "tap" ? pose : "idle";
  return (
    <CharacterSprite
      id={characterArtId(id)}
      size={size}
      pose={mappedPose === "idle" ? "idle" : mappedPose}
      title={title || id}
      className={`painted-animal ${className}`}
    />
  );
}
