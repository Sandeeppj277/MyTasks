/**
 * app.js — Tasks page logic (tasks.html)
 *
 * Complete · Delete · Filter (All / Pending / Completed) · Progress
 */

(function () {
  'use strict';

  let tasks = Storage.load();
  let activeFilter = 'all';

  const taskListEl      = document.getElementById('taskList');
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

  function filtered() {
    if (activeFilter === 'pending')   return tasks.filter(t => !t.completed);
    if (activeFilter === 'completed') return tasks.filter(t =>  t.completed);
    return tasks;
  }

  function render() {
    const list = filtered();

    taskListEl.innerHTML = '';
    emptyStateEl.style.display = list.length === 0 ? 'block' : 'none';

    list.forEach(task => taskListEl.appendChild(buildTask(task)));

    const total = tasks.length;
    const done  = tasks.filter(t => t.completed).length;
    const pct   = total === 0 ? 0 : Math.round((done / total) * 100);

    progressFill.style.width    = pct + '%';
    progressPercent.textContent = pct + '%';
    progressDetail.textContent  = `${done} of ${total} tasks done`;

    badgeAll.textContent       = total;
    badgePending.textContent   = total - done;
    badgeCompleted.textContent = done;
    navBadge.textContent       = total - done;

    footerEl.style.display = done > 0 ? 'flex' : 'none';
  }

  function buildTask(task) {
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
      <button class="btn-delete" title="Delete">🗑️</button>
    `;

    el.querySelector('input').addEventListener('change', () => {
      task.completed = !task.completed;
      task.completedAt = task.completed ? new Date().toISOString() : null;
      Storage.save(tasks);
      render();
      toast(task.completed ? 'Done! 🎉' : 'Reopened', task.completed ? 'success' : 'info');
    });

    el.querySelector('.btn-delete').addEventListener('click', () => {
      el.classList.add('removing');
      el.addEventListener('animationend', () => {
        tasks = tasks.filter(t => t.id !== task.id);
        Storage.save(tasks);
        render();
        toast('Deleted', 'error');
      });
    });

    return el;
  }

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
    const n = tasks.filter(t => t.completed).length;
    tasks = tasks.filter(t => !t.completed);
    Storage.save(tasks);
    render();
    toast(`Cleared ${n} task${n > 1 ? 's' : ''}`, 'success');
  });

  render();
})();
