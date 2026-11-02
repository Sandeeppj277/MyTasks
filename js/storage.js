/**
 * storage.js — Persistent Storage Layer
 * 
 * Handles localStorage read/write for tasks.
 * Designed to be swapped out for an API layer when
 * you integrate online sync (e.g., Firebase, Supabase, REST API).
 */

const STORAGE_KEY = 'mytasks_data';

const Storage = {
  /**
   * Load all tasks from localStorage.
   * @returns {Array} Array of task objects
   */
  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('Failed to load tasks:', e);
      return [];
    }
  },

  /**
   * Save all tasks to localStorage.
   * @param {Array} tasks — Array of task objects
   */
  save(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks:', e);
    }
  },

  /**
   * Export tasks as a downloadable JSON file.
   * @param {Array} tasks
   */
  exportToFile(tasks) {
    const blob = new Blob([JSON.stringify(tasks, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mytasks_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  /**
   * Import tasks from a JSON file.
   * @param {File} file
   * @returns {Promise<Array>}
   */
  importFromFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (Array.isArray(data)) {
            resolve(data);
          } else {
            reject(new Error('Invalid file format'));
          }
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsText(file);
    });
  },
};
