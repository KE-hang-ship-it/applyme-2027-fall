"use client";

import { useState, useEffect, useCallback } from "react";
import type { SchoolListItem, SchoolListCategory, SchoolListStatus } from "@/types/application";

const STORAGE_KEY = "applyme-school-list-items";
const MIGRATION_KEY = "applyme-school-list-migrated";

const LEGACY_TARGETS_KEY = "me-targets";
const LEGACY_CATEGORIES_KEY = "me-categories";
const LEGACY_NOTES_KEY = "me-notes";

function migrateLegacyData(): SchoolListItem[] {
  const items: SchoolListItem[] = [];
  
  try {
    const savedTargets = localStorage.getItem(LEGACY_TARGETS_KEY);
    const savedCategories = localStorage.getItem(LEGACY_CATEGORIES_KEY);
    const savedNotes = localStorage.getItem(LEGACY_NOTES_KEY);

    const targets = savedTargets ? JSON.parse(savedTargets) : [];
    const categories = savedCategories ? JSON.parse(savedCategories) : {};
    const notes = savedNotes ? JSON.parse(savedNotes) : {};

    if (Array.isArray(targets)) {
      const now = new Date().toISOString();
      targets.forEach((programId: string) => {
        const legacyCategory = categories[programId] as string;
        let category: SchoolListCategory = "unclassified";
        
        if (legacyCategory === "Dream" || legacyCategory === "Priority") {
          category = "reach";
        } else if (legacyCategory === "Target") {
          category = "match";
        } else if (legacyCategory === "Safety") {
          category = "safety";
        }

        items.push({
          programId,
          category,
          status: "considering",
          note: notes[programId] || "",
          addedAt: now,
        });
      });
    }
  } catch {
    return [];
  }

  return items;
}

export function useSchoolList() {
  const [items, setItems] = useState<SchoolListItem[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const migrated = localStorage.getItem(MIGRATION_KEY) === "true";
      const saved = localStorage.getItem(STORAGE_KEY);

      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      } else if (!migrated) {
        const legacyItems = migrateLegacyData();
        setItems(legacyItems);
        localStorage.setItem(MIGRATION_KEY, "true");
      }
    } catch {
      setItems([]);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    }
  }, [items, ready]);

  const addItem = useCallback((programId: string) => {
    setItems(prev => {
      if (prev.some(item => item.programId === programId)) return prev;
      return [...prev, {
        programId,
        category: "unclassified",
        status: "considering",
        note: "",
        addedAt: new Date().toISOString(),
      }];
    });
  }, []);

  const removeItem = useCallback((programId: string) => {
    setItems(prev => prev.filter(item => item.programId !== programId));
  }, []);

  const updateCategory = useCallback((programId: string, category: SchoolListCategory) => {
    setItems(prev => prev.map(item => 
      item.programId === programId ? { ...item, category } : item
    ));
  }, []);

  const updateNote = useCallback((programId: string, note: string) => {
    setItems(prev => prev.map(item => 
      item.programId === programId ? { ...item, note } : item
    ));
  }, []);

  const updateStatus = useCallback((programId: string, status: SchoolListStatus) => {
    setItems(prev => prev.map(item => 
      item.programId === programId ? { ...item, status } : item
    ));
  }, []);

  const getItem = useCallback((programId: string) => {
    return items.find(item => item.programId === programId);
  }, [items]);

  const isInSchoolList = useCallback((programId: string) => {
    return items.some(item => item.programId === programId);
  }, [items]);

  const getByCategory = useCallback((category: SchoolListCategory) => {
    return items.filter(item => item.category === category);
  }, [items]);

  const stats = useCallback(() => {
    const stats: Record<SchoolListCategory, number> = {
      reach: 0,
      match: 0,
      safety: 0,
      unclassified: 0,
    };
    items.forEach(item => {
      stats[item.category]++;
    });
    return stats;
  }, [items]);

  return {
    items,
    addItem,
    removeItem,
    updateCategory,
    updateNote,
    updateStatus,
    getItem,
    isInSchoolList,
    getByCategory,
    stats,
    ready,
  };
}