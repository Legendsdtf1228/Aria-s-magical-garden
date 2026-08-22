export {
  FRIEND_IDS,
  FRIENDS_STORAGE_KEY,
  normalizeCollected,
  loadCollectedFromStorage,
  saveCollectedToStorage,
  nextUnownedFriend,
  rewardForCorrect,
  addFriend,
  shuffle,
  pickChoices,
} from "./collectionCore.mjs";

export type { RewardResult } from "./collectionTypes";
