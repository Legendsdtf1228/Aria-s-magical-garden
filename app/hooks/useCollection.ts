"use client";

import {
  addFriend,
  loadCollectedFromStorage,
  nextUnownedFriend,
  rewardForCorrect,
  saveCollectedToStorage,
} from "../data/collection";
import type { RewardResult } from "../data/collectionTypes";
import { friendById } from "../data/friends";
import type { FriendId } from "../types/game";
import { useCallback, useEffect, useState } from "react";

export function useCollection() {
  const [collected, setCollected] = useState<FriendId[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCollected(loadCollectedFromStorage());
    setHydrated(true);
  }, []);

  const awardCorrect = useCallback((): RewardResult => {
    const owned = loadCollectedFromStorage();
    const result = rewardForCorrect(owned);
    if (result.kind === "friend") {
      const next = addFriend(owned, result.id);
      saveCollectedToStorage(next);
      setCollected(next);
    }
    return result;
  }, []);

  const catchFriend = useCallback((id: FriendId): boolean => {
    const owned = loadCollectedFromStorage();
    if (owned.includes(id)) return false;
    const next = addFriend(owned, id);
    saveCollectedToStorage(next);
    setCollected(next);
    return true;
  }, []);

  const resetCollection = useCallback(() => {
    saveCollectedToStorage([]);
    setCollected([]);
  }, []);

  const peekNextFriend = useCallback(() => {
    const id = nextUnownedFriend(collected);
    return id ? friendById(id) : null;
  }, [collected]);

  return {
    collected,
    hydrated,
    awardCorrect,
    catchFriend,
    resetCollection,
    peekNextFriend,
    ownedCount: collected.length,
  };
}
