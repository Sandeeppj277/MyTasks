/**
 * storage.js — Persistent Storage Layer for Goals & Tasks
 */

const GOALS_KEY = 'mygoals_data';
const TASKS_KEY = 'mytasks_data';

const Storage = {
  // ─── Goals ───────────────────────────────
  loadGoals() {
    try {
      const raw = localStorage.getItem(GOALS_KEY);
      if (!raw) {
        // Default initial goal
        const defaultGoals = [
          { id: 'goal_main', title: 'Personal Goals', createdAt: new Date().toISOString() }
        ];
        this.saveGoals(defaultGoals);
        return defaultGoals;
      }
      const data = JSON.parse(raw);
      return Array.isArray(data) && data.length > 0 ? data : [
        { id: 'goal_main', title: 'Personal Goals', createdAt: new Date().toISOString() }
      ];
    } catch (e) {
      console.error('Failed to load goals:', e);
      return [{ id: 'goal_main', title: 'Personal Goals', createdAt: new Date().toISOString() }];
    }
  },

  saveGoals(goals) {
    try {
      localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
    } catch (e) {
      console.error('Failed to save goals:', e);
    }
  },

  // ─── Tasks ───────────────────────────────
  loadTasks() {
    try {
      const raw = localStorage.getItem(TASKS_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) return [];

      // Auto-migrate any tasks that lack a goalId
      const goals = this.loadGoals();
      const defaultGoalId = goals[0]?.id || 'goal_main';
      return data.map(t => ({
        ...t,
        goalId: t.goalId || defaultGoalId
      }));
    } catch (e) {
      console.error('Failed to load tasks:', e);
      return [];
    }
  },

  saveTasks(tasks) {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks:', e);
    }
  },

  // Backward compatibility alias
  load() {
    return this.loadTasks();
  },
  save(tasks) {
    return this.saveTasks(tasks);
  }
};
