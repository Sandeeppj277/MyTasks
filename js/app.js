/**
 * app.js — Goals & Tasks Management
 */

(function () {
  'use strict';

  let goals = Storage.loadGoals();
  let tasks = Storage.loadTasks();
  let activeFilter = 'all'; // all | pending | completed

  const goalsContainer  = document.getElementById('goalsContainer');
  const emptyStateEl    = document.getElementById('emptyState');
  const progressFill    = document.getElementById('progressFill');
  const progressPercent = document.getElementById('progressPercent');
  const progressDetail  = document.getElementById('progressDetail');
  const toastContainer  = document.getElementById('toastContainer');
  const badgeAll        = document.getElementById('badgeAll');
  const badgePending    = document.getElementById('badgePending');
  const badgeCompleted  = document.getElementById('badgeCompleted');
  const navBadge        = document.getElementById('navBadge');
  const clearBtn        = document.getElementById('clearCompleted');
  const footerEl        = document.getElementById('footer');

  const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
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

  function filterTasks(list) {
    if (activeFilter === 'pending')   return list.filter(t => !t.completed);
    if (activeFilter === 'completed') return list.filter(t =>  t.completed);
    return list;
  }

  function render() {
    goalsContainer.innerHTML = '';

    const allFilteredTasks = filterTasks(tasks);
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;

    // Badges & Overall Progress
    badgeAll.textContent       = totalTasks;
    badgePending.textContent   = pendingTasks;
    badgeCompleted.textContent = completedTasks;
    navBadge.textContent       = pendingTasks;

    const overallPct = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
    progressFill.style.width    = overallPct + '%';
    progressPercent.textContent = overallPct + '%';
    progressDetail.textContent  = `${completedTasks} of ${totalTasks} tasks completed across all goals`;

    footerEl.style.display = completedTasks > 0 ? 'flex' : 'none';

    if (goals.length === 0 || allFilteredTasks.length === 0) {
      emptyStateEl.style.display = 'block';
    } else {
      emptyStateEl.style.display = 'none';
    }

    // Render each Goal card
    goals.forEach(goal => {
      const goalTasks = tasks.filter(t => t.goalId === goal.id);
      const filteredGoalTasks = filterTasks(goalTasks);

      // In filter mode, if this goal has no matching tasks, only show if activeFilter is 'all'
      if (filteredGoalTasks.length === 0 && activeFilter !== 'all') {
        return;
      }

      const goalTotal = goalTasks.length;
      const goalDone  = goalTasks.filter(t => t.completed).length;
      const goalPct   = goalTotal === 0 ? 0 : Math.round((goalDone / goalTotal) * 100);

      const goalCard = document.createElement('div');
      goalCard.className = 'goal-card';
      goalCard.dataset.goalId = goal.id;

      goalCard.innerHTML = `
        <div class="goal-header">
          <div class="goal-title-wrap">
            <span class="goal-badge">🎯 Goal</span>
            <h3 class="goal-title">${escapeHtml(goal.title)}</h3>
          </div>
          <div class="goal-header-right">
            <span class="goal-progress-pill">${goalDone}/${goalTotal} done (${goalPct}%)</span>
            <button class="btn-delete-goal" title="Delete this goal and its tasks">✕</button>
          </div>
        </div>

        <div class="goal-progress-bar">
          <div class="goal-progress-fill" style="width: ${goalPct}%"></div>
        </div>

        <!-- Task List inside Goal -->
        <div class="goal-task-list"></div>

        <!-- Quick Add Task inline to this Goal -->
        <form class="quick-add-task-form">
          <input
            type="text"
            class="input-quick-add"
            placeholder="+ Add task to this goal..."
            autocomplete="off"
            required
          />
          <button type="submit" class="btn-quick-add">Add</button>
        </form>
      `;

      // Render tasks inside this goal
      const taskListEl = goalCard.querySelector('.goal-task-list');
      if (filteredGoalTasks.length === 0) {
        const noTasks = document.createElement('div');
        noTasks.className = 'goal-no-tasks';
        noTasks.textContent = activeFilter === 'all' ? 'No tasks yet for this goal.' : 'No tasks match filter.';
        taskListEl.appendChild(noTasks);
      } else {
        filteredGoalTasks.forEach(task => {
          taskListEl.appendChild(createTaskElement(task));
        });
      }

      // Quick add task listener
      const quickForm = goalCard.querySelector('.quick-add-task-form');
      const quickInput = goalCard.querySelector('.input-quick-add');
      quickForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = quickInput.value.trim();
        if (!text) return;

        tasks.unshift({
          id: genId(),
          goalId: goal.id,
          text: text,
          completed: false,
          createdAt: new Date().toISOString()
        });
        Storage.saveTasks(tasks);
        render();
        toast('Task added to goal!', 'success');
      });

      // Delete goal listener
      const delGoalBtn = goalCard.querySelector('.btn-delete-goal');
      delGoalBtn.addEventListener('click', () => {
        if (confirm(`Delete the goal "${goal.title}" and its ${goalTotal} tasks?`)) {
          goals = goals.filter(g => g.id !== goal.id);
          tasks = tasks.filter(t => t.goalId !== goal.id);
          Storage.saveGoals(goals);
          Storage.saveTasks(tasks);
          render();
          toast('Goal deleted', 'error');
        }
      });

      goalsContainer.appendChild(goalCard);
    });
  }

  function createTaskElement(task) {
    const el = document.createElement('div');
    el.className = `task-item${task.completed ? ' completed' : ''}`;
    el.innerHTML = `
      <label class="task-checkbox">
        <input type="checkbox" ${task.completed ? 'checked' : ''} />
        <span class="checkmark"></span>
      </label>
      <div class="task-content">
        <p class="task-text">${escapeHtml(task.text)}</p>
        <span class="task-date">${formatDate(task.createdAt)}</span>
      </div>
      <button class="btn-delete" title="Delete Task">🗑️</button>
    `;

    // Toggle complete
    el.querySelector('input').addEventListener('change', () => {
      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date().toISOString() : null;
      Storage.saveTasks(tasks);
      render();
      toast(task.completed ? 'Task completed! 🎉' : 'Task marked pending', task.completed ? 'success' : 'info');
    });

    // Delete task
    el.querySelector('.btn-delete').addEventListener('click', () => {
      el.classList.add('removing');
      el.addEventListener('animationend', () => {
        tasks = tasks.filter(t => t.id !== task.id);
        Storage.saveTasks(tasks);
        render();
        toast('Task removed', 'error');
      });
    });

    return el;
  }

  // Filter Buttons
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      render();
    });
  });

  // Clear completed tasks
  clearBtn.addEventListener('click', () => {
    const count = tasks.filter(t => t.completed).length;
    if (count === 0) return;
    tasks = tasks.filter(t => !t.completed);
    Storage.saveTasks(tasks);
    render();
    toast(`Cleared ${count} completed task${count > 1 ? 's' : ''}`, 'success');
  });

  render();
})();
