/**
 * storage.js — Storage for MyGoals
 */

const STORAGE_KEY = 'mygoals_items';

const Storage = {
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('mytasks_data');
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('Failed to load goals:', e);
      return [];
    }
  },

  save(items) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save goals:', e);
    }
  }
};
