"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "applyme-favorite-program-ids";

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setFavoriteIds(parsed);
        }
      }
    } catch {
      setFavoriteIds([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favoriteIds));
    }
  }, [favoriteIds, ready]);

  const addFavorite = useCallback((programId: string) => {
    setFavoriteIds(prev => {
      if (prev.includes(programId)) return prev;
      return [...prev, programId];
    });
  }, []);

  const removeFavorite = useCallback((programId: string) => {
    setFavoriteIds(prev => prev.filter(id => id !== programId));
  }, []);

  const toggleFavorite = useCallback((programId: string) => {
    setFavoriteIds(prev => {
      if (prev.includes(programId)) {
        return prev.filter(id => id !== programId);
      }
      return [...prev, programId];
    });
  }, []);

  const isFavorite = useCallback((programId: string) => {
    return favoriteIds.includes(programId);
  }, [favoriteIds]);

  return {
    favoriteIds,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    ready,
  };
}