/**
 * app.js — MyGoals Single Page Logic
 */

(function () {
  'use strict';

  let goals = Storage.load();
  let activeFilter = 'all'; // all | pending | completed

  const goalInput       = document.getElementById('goalInput');
  const addGoalForm     = document.getElementById('addGoalForm');
  const goalsListEl     = document.getElementById('goalsList');
  const emptyStateEl    = document.getElementById('emptyState');
  const progressFill    = document.getElementById('progressFill');
  const progressPercent = document.getElementById('progressPercent');
  const progressSummary = document.getElementById('progressSummary');
  const badgeAll        = document.getElementById('badgeAll');
  const badgePending    = document.getElementById('badgePending');
  const badgeCompleted  = document.getElementById('badgeCompleted');
  const currentDateEl   = document.getElementById('currentDate');
  const footerBar       = document.getElementById('footerBar');
  const clearBtn        = document.getElementById('clearCompletedBtn');
  const toastContainer  = document.getElementById('toastContainer');

  const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function formatDate(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function setDate() {
    const now = new Date();
    currentDateEl.textContent = now.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric'
    });
  }

  function toast(msg, type = 'info') {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => {
      el.classList.add('hiding');
      el.addEventListener('animationend', () => el.remove());
    }, 2200);
  }

  function getFilteredGoals() {
    if (activeFilter === 'pending')   return goals.filter(g => !g.completed);
    if (activeFilter === 'completed') return goals.filter(g => g.completed);
    return goals;
  }

  function render() {
    const filtered = getFilteredGoals();
    goalsListEl.innerHTML = '';

    if (filtered.length === 0) {
      emptyStateEl.style.display = 'block';
    } else {
      emptyStateEl.style.display = 'none';
      filtered.forEach(goal => {
        goalsListEl.appendChild(createGoalElement(goal));
      });
    }

    // Progress & counts
    const total = goals.length;
    const completed = goals.filter(g => g.completed).length;
    const pending = total - completed;
    const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

    progressFill.style.width = pct + '%';
    progressPercent.textContent = pct + '%';
    progressSummary.textContent = `${completed} of ${total} goals completed`;

    badgeAll.textContent = total;
    badgePending.textContent = pending;
    badgeCompleted.textContent = completed;

    footerBar.style.display = completed > 0 ? 'flex' : 'none';
  }

  function createGoalElement(goal) {
    const el = document.createElement('div');
    el.className = `goal-row${goal.completed ? ' completed' : ''}`;
    el.dataset.id = goal.id;

    el.innerHTML = `
      <label class="goal-checkbox">
        <input type="checkbox" ${goal.completed ? 'checked' : ''} aria-label="Mark goal complete" />
        <span class="checkmark"></span>
      </label>
      <div class="goal-details">
        <p class="goal-text">${escapeHtml(goal.text)}</p>
        <span class="goal-date">${formatDate(goal.createdAt)}</span>
      </div>
      <button class="btn-delete" title="Delete goal" aria-label="Delete goal">🗑️</button>
    `;

    // Checkbox toggle
    const checkbox = el.querySelector('input[type="checkbox"]');
    checkbox.addEventListener('change', () => {
      goal.completed = !goal.completed;
      goal.completedAt = goal.completed ? new Date().toISOString() : null;
      Storage.save(goals);
      render();
      toast(goal.completed ? 'Goal completed! 🎉' : 'Goal marked pending', goal.completed ? 'success' : 'info');
    });

    // Delete
    const delBtn = el.querySelector('.btn-delete');
    delBtn.addEventListener('click', () => {
      el.classList.add('removing');
      el.addEventListener('animationend', () => {
        goals = goals.filter(g => g.id !== goal.id);
        Storage.save(goals);
        render();
        toast('Goal removed', 'error');
      });
    });

    return el;
  }

  // Add goal submit
  addGoalForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = goalInput.value.trim();
    if (!text) return;

    goals.unshift({
      id: genId(),
      text: text,
      completed: false,
      createdAt: new Date().toISOString()
    });

    Storage.save(goals);
    goalInput.value = '';
    render();
    toast('Goal added!', 'success');
    goalInput.focus();
  });

  // Filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      render();
    });
  });

  // Clear completed
  clearBtn.addEventListener('click', () => {
    const count = goals.filter(g => g.completed).length;
    if (count === 0) return;
    goals = goals.filter(g => !g.completed);
    Storage.save(goals);
    render();
    toast(`Cleared ${count} completed goal${count > 1 ? 's' : ''}`, 'success');
  });

  setDate();
  render();
})();
