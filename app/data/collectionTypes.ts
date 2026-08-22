import type { FriendId } from "../types/game";

export type RewardResult =
  | { kind: "friend"; id: FriendId; en: string; es: string; emoji: string }
  | { kind: "sparkle"; en: string; es: string; emoji: string };
