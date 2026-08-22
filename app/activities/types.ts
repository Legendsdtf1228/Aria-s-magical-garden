import type { RewardResult } from "../data/collectionTypes";
import type { FriendId } from "../types/game";

export type ActivityAudio = {
  tap: () => void;
  correct: () => void;
  sparkle: () => void;
  retry: () => void;
  animal: (kind: string) => void;
  movementCue: (cue: string) => void;
  ensure: () => AudioContext | null;
};

export type ActivityVoice = {
  speak: (en: string, es?: string, keys?: { en?: string; es?: string }) => void;
  speakParts: (parts: { text: string; lang: "en" | "es"; phraseKey?: string }[]) => void;
  cancel: () => void;
  speaking: boolean;
};

export type ActivityCommonProps = {
  collected: FriendId[];
  speechOn: boolean;
  voice: ActivityVoice;
  audio: ActivityAudio;
  onToggleSpeech: () => void;
  onHome: () => void;
  onHomeRequest: () => void;
  onAward: () => RewardResult;
  onCatchFriend: (id: FriendId) => void;
};
