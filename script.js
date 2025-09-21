const STORAGE_KEY = 'tm_tasks_v1';
let tasks = [];
let editingId = null;

const titleEl = document.querySelector('#title');
const descEl = document.querySelector('#desc');
const dueEl = document.querySelector('#due');
const priorityEl = document.querySelector('#priority');
const saveBtn = document.querySelector('#save');
const resetBtn = document.querySelector('#reset');
const taskContainer = document.querySelector('#taskContainer');
const countsEl = document.querySelector('#counts');
const percentEl = document.querySelector('#percent');
const progressFill = document.querySelector('#progressFill');
const filterEl = document.querySelector('#filter');
const clearCompletedBtn = document.querySelector('#clearCompleted');
const exportBtn = document.querySelector('#export');
const toggleAllBtn = document.querySelector('#toggleAll');
const deleteAllBtn = document.querySelector('#deleteAll');

function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  tasks = raw ? JSON.parse(raw) : [];
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  render();
}
function uid() { return 't_' + Math.random().toString(36).slice(2, 9); }

function addTask(data) {
  tasks.unshift({
    id: uid(),
    title: data.title,
    desc: data.desc || '',
    due: data.due || '',
    priority: data.priority || 'medium',
    done: false,
    created: Date.now()
  });
  save();
}
function updateTask(id, patch) {
  tasks = tasks.map(t => t.id === id ? {...t, ...patch} : t);
  save();
}
function removeTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  save();
}
function clearCompleted() {
  tasks = tasks.filter(t => !t.done);
  save();
}
function deleteAll() {
  if (confirm('Delete ALL tasks?')) { tasks = []; save(); }
}
function toggleAll() {
  const allDone = tasks.every(t => t.done);
  tasks = tasks.map(t => ({...t, done: !allDone}));
  save();
}
function exportJSON() {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'tasks.json';
  a.click();
  URL.revokeObjectURL(url);
}

function formatDate(d) {
  if (!d) return '';
  const dt = new Date(d);
  return isNaN(dt) ? d : dt.toLocaleDateString();
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, ch => (
    {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]
  ));
}

function render() {
  const filter = filterEl.value;
  const filtered = tasks.filter(t =>
    filter === 'all' ? true : filter === 'active' ? !t.done : t.done
  );

  taskContainer.innerHTML = '';
  if (filtered.length === 0) {
    const el = document.createElement('div');
    el.className = 'empty';
    el.textContent = tasks.length === 0
      ? 'No tasks yet — add one on the left.'
      : 'No tasks match the filter.';
    taskContainer.appendChild(el);
  } else {
    filtered.forEach(t => {
      const item = document.createElement('div');
      item.className = 'task';
      item.innerHTML = `
        <div class="left">
          <h3>
            <label>
              <input type="checkbox" data-id="${t.id}" ${t.done?'checked':''}/>
              <span style="${t.done?'text-decoration:line-through;color:#aaa':''}">
                ${escapeHtml(t.title)}
              </span>
            </label>
          </h3>
          <div class="meta">${t.desc ? escapeHtml(t.desc)+' • ' : ''}${t.due ? 'Due: '+formatDate(t.due) : ''}</div>
          <div class="chips">
            <div class="chip">${t.priority}</div>
            <div class="chip">Created: ${new Date(t.created).toLocaleDateString()}</div>
            ${t.done ? '<div class="chip">Completed</div>' : ''}
          </div>
        </div>
        <div class="actions">
          <button class="icon-btn" data-edit="${t.id}">📝</button>
          <button class="icon-btn" data-delete="${t.id}">🗑️</button>
        </div>`;
      taskContainer.appendChild(item);
    });
  }

  const total = tasks.length;
  const completed = tasks.filter(t => t.done).length;
  countsEl.textContent = `${total} task${total!==1?'s':''} • ${completed} completed`;
  const pct = total === 0 ? 0 : Math.round((completed/total)*100);
  percentEl.textContent = pct + '%';
  progressFill.style.width = pct + '%';
}

// UI events
saveBtn.addEventListener('click', () => {
  const title = titleEl.value.trim();
  if (!title) return alert('Title required.');
  const payload = {
    title,
    desc: descEl.value.trim(),
    due: dueEl.value || '',
    priority: priorityEl.value
  };
  if (editingId) {
    updateTask(editingId, payload);
    editingId = null;
    saveBtn.textContent = 'Add Task';
  } else addTask(payload);
  resetForm();
});
resetBtn.addEventListener('click', resetForm);

function resetForm() {
  editingId = null;
  titleEl.value = ''; descEl.value = ''; dueEl.value = '';
  priorityEl.value = 'medium'; saveBtn.textContent = 'Add Task';
}

taskContainer.addEventListener('click', e => {
  const id = e.target.getAttribute('data-id');
  if (id) updateTask(id, {done: e.target.checked});
  if (e.target.dataset.edit) {
    const t = tasks.find(x => x.id===e.target.dataset.edit);
    if (!t) return;
    editingId = t.id;
    titleEl.value = t.title; descEl.value = t.desc;
    dueEl.value = t.due; priorityEl.value = t.priority;
    saveBtn.textContent = 'Save Changes';
  }
  if (e.target.dataset.delete) {
    if (confirm('Delete this task?')) removeTask(e.target.dataset.delete);
  }
});

filterEl.addEventListener('change', render);
clearCompletedBtn.addEventListener('click', () => {
  if (confirm('Clear completed tasks?')) clearCompleted();
});
exportBtn.addEventListener('click', exportJSON);
toggleAllBtn.addEventListener('click', toggleAll);
deleteAllBtn.addEventListener('click', deleteAll);

load(); render();
