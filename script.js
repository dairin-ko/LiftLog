// ─────────────────────────────────────────
//  Data
// ─────────────────────────────────────────
let sessions     = JSON.parse(localStorage.getItem('ll_sessions'))     || [];
let activeWorkout = JSON.parse(localStorage.getItem('ll_active'))      || null;

// ─────────────────────────────────────────
//  Header date
// ─────────────────────────────────────────
document.getElementById('headerDate').textContent = new Date().toLocaleDateString('en-US', {
  weekday: 'long', month: 'long', day: 'numeric'
});

// ─────────────────────────────────────────
//  Workout lifecycle
// ─────────────────────────────────────────
document.getElementById('startBtn').addEventListener('click', startWorkout);
document.getElementById('finishBtn').addEventListener('click', finishWorkout);

// SVG icons for badges (Lucide inline)
const ICONS = {
  repeat: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>`,
  x:      `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>`,
  weight: `<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="5" r="3"/><path d="M6.5 8a2 2 0 0 0-1.905 1.46L2.1 18.5A2 2 0 0 0 4 21h16a2 2 0 0 0 1.925-2.54L19.4 9.46A2 2 0 0 0 17.48 8Z"/></svg>`,
};

function startWorkout() {
  activeWorkout = {
    id:        Date.now(),
    startTime: Date.now(),
    date:      new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    exercises: []
  };
  saveActive();
  renderAll();
  startWorkoutClock();
}

function finishWorkout() {
  if (!activeWorkout) return;
  if (activeWorkout.exercises.length === 0 && !confirm('No exercises logged. Finish anyway?')) return;

  activeWorkout.endTime  = Date.now();
  activeWorkout.duration = Math.floor((activeWorkout.endTime - activeWorkout.startTime) / 1000);

  sessions.unshift(activeWorkout);
  activeWorkout = null;

  saveSessions();
  saveActive();
  stopWorkoutClock();
  renderAll();
}

// ─────────────────────────────────────────
//  Add exercise to active workout
// ─────────────────────────────────────────
document.getElementById('addBtn').addEventListener('click', () => {
  const exercise = document.getElementById('exercise').value.trim();
  if (!exercise) {
    const inp = document.getElementById('exercise');
    inp.style.borderColor = '#ef4444';
    inp.style.boxShadow   = '0 0 0 3px rgba(239,68,68,0.12)';
    inp.focus();
    setTimeout(() => { inp.style.borderColor = ''; inp.style.boxShadow = ''; }, 1800);
    return;
  }

  const entry = {
    id:      Date.now(),
    exercise,
    sets:    document.getElementById('sets').value    || null,
    reps:    document.getElementById('reps').value    || null,
    weight:  document.getElementById('weight').value  || null,
    feeling: document.getElementById('feeling').value,
    notes:   document.getElementById('notes').value.trim() || null,
    time:    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  };

  activeWorkout.exercises.push(entry);
  saveActive();
  renderActiveExercises();
  clearForm();

  // Collapse form after adding
  closeForm();
});

// ─────────────────────────────────────────
//  Collapsible form
// ─────────────────────────────────────────
document.getElementById('toggleForm').addEventListener('click', () => {
  const isOpen = document.getElementById('formBody').classList.toggle('open');
  document.getElementById('toggleChevron').classList.toggle('open', isOpen);
});

function closeForm() {
  document.getElementById('formBody').classList.remove('open');
  document.getElementById('toggleChevron').classList.remove('open');
}

// ─────────────────────────────────────────
//  Workout clock (elapsed time)
// ─────────────────────────────────────────
let clockInterval = null;

function startWorkoutClock() {
  stopWorkoutClock();
  clockInterval = setInterval(updateClock, 1000);
  updateClock();
}

function stopWorkoutClock() {
  if (clockInterval) { clearInterval(clockInterval); clockInterval = null; }
}

function updateClock() {
  if (!activeWorkout) return;
  const elapsed = Math.floor((Date.now() - activeWorkout.startTime) / 1000);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  const str = h > 0
    ? `${pad(h)}:${pad(m)}:${pad(s)}`
    : `${pad(m)}:${pad(s)}`;
  document.getElementById('activeTimer').textContent = str;
}

function pad(n) { return String(n).padStart(2, '0'); }

// ─────────────────────────────────────────
//  Render
// ─────────────────────────────────────────
function renderAll() {
  renderUI();
  renderKPI();
  renderHistory();
  lucide.createIcons();
}

function renderUI() {
  const hasActive = !!activeWorkout;
  document.getElementById('activeSection').style.display = hasActive ? 'block' : 'none';
  document.getElementById('startBtn').style.display      = hasActive ? 'none'  : 'flex';
  if (hasActive) renderActiveExercises();
}

function renderActiveExercises() {
  const container = document.getElementById('activeExercises');
  const feelings  = { great: '😄', good: '🙂', ok: '😐', bad: '😔' };

  if (!activeWorkout.exercises.length) {
    container.innerHTML = `
      <div style="text-align:center; padding:20px 0 12px; color:#a1a1aa; font-size:0.82rem;">
        No exercises yet — add your first one below
      </div>`;
    return;
  }

  container.innerHTML = activeWorkout.exercises.map(e => `
    <div class="active-exercise-item">
      <div style="flex:1; min-width:0;">
        <div class="active-exercise-name">${e.exercise}</div>
        <div class="badges">
          ${e.sets   ? `<span class="badge">${ICONS.repeat} ${e.sets} sets</span>`  : ''}
          ${e.reps   ? `<span class="badge">${ICONS.x} ${e.reps} reps</span>`       : ''}
          ${e.weight ? `<span class="badge">${ICONS.weight} ${e.weight} kg</span>`  : ''}
        </div>
        ${e.notes ? `<div style="font-size:0.73rem;color:#71717a;margin-top:5px;">${e.notes}</div>` : ''}
      </div>
      <button class="btn-delete" onclick="removeExercise(${e.id})">
        <i data-lucide="x" style="width:13px;height:13px;"></i>
      </button>
    </div>
  `).join('');
}

function removeExercise(id) {
  activeWorkout.exercises = activeWorkout.exercises.filter(e => e.id !== id);
  saveActive();
  renderActiveExercises();
  renderKPI();
}

// ─────────────────────────────────────────
//  KPI
// ─────────────────────────────────────────
function renderKPI() {
  const allExercises = sessions.flatMap(s => s.exercises);

  // Total workouts
  document.getElementById('kpiWorkouts').textContent = sessions.length;

  // Total sets
  const totalSets = allExercises.reduce((acc, e) => acc + (parseInt(e.sets) || 0), 0);
  document.getElementById('kpiSets').textContent = totalSets;

  // Total volume (sets × reps × weight)
  const vol = allExercises.reduce((acc, e) => {
    return acc + (parseInt(e.sets)||0) * (parseInt(e.reps)||0) * (parseFloat(e.weight)||0);
  }, 0);
  document.getElementById('kpiWeight').textContent = vol >= 1000
    ? (vol / 1000).toFixed(1) + ' t'
    : vol + ' kg';

  // This week
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = sessions.filter(s => s.startTime >= weekAgo).length;
  document.getElementById('kpiWeek').textContent = thisWeek;
}

// ─────────────────────────────────────────
//  History
// ─────────────────────────────────────────
function renderHistory() {
  const container = document.getElementById('historyList');
  const feelings  = { great: '😄', good: '🙂', ok: '😐', bad: '😔' };

  if (!sessions.length) {
    container.innerHTML = `
      <div class="empty-history">
        <div class="empty-history-icon">📋</div>
        <div class="empty-history-text">No workouts yet.<br>Hit <strong>Start New Workout</strong> to begin!</div>
      </div>`;
    return;
  }

  container.innerHTML = sessions.map(s => {
    const duration = s.duration ? formatDuration(s.duration) : '';
    const exCount  = s.exercises.length;

    return `
      <div class="history-card">
        <div class="history-card-header">
          <div>
            <div class="history-date">${s.date}</div>
            <div class="history-meta">
              ${exCount} exercise${exCount !== 1 ? 's' : ''}
              ${duration ? ` · ${duration}` : ''}
            </div>
          </div>
          <button class="btn-delete" onclick="removeSession(${s.id})">✕</button>
        </div>
        ${s.exercises.map(e => `
          <div class="history-exercise">
            <div>
              <div class="history-exercise-name">${e.exercise}</div>
              <div class="badges">
                ${e.sets   ? `<span class="badge">${ICONS.repeat} ${e.sets} sets</span>`  : ''}
                ${e.reps   ? `<span class="badge">${ICONS.x} ${e.reps} reps</span>`       : ''}
                ${e.weight ? `<span class="badge">${ICONS.weight} ${e.weight} kg</span>`  : ''}
              </div>
            </div>
          </div>
        `).join('')}
      </div>`;
  }).join('');
}

function removeSession(id) {
  sessions = sessions.filter(s => s.id !== id);
  saveSessions();
  renderKPI();
  renderHistory();
}


function formatDuration(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ─────────────────────────────────────────
//  Persist
// ─────────────────────────────────────────
function saveSessions() { localStorage.setItem('ll_sessions', JSON.stringify(sessions)); }
function saveActive()   { localStorage.setItem('ll_active',   JSON.stringify(activeWorkout)); }

function clearForm() {
  ['exercise','sets','reps','weight','notes'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('feeling').value = 'good';
}

// ─────────────────────────────────────────
//  Rest Timer
// ─────────────────────────────────────────
let timerInterval = null;
let timeLeft      = 0;

document.getElementById('timerToggle').addEventListener('click', () =>
  document.getElementById('timerPanel').classList.toggle('open'));
document.getElementById('timerClose').addEventListener('click', () =>
  document.getElementById('timerPanel').classList.remove('open'));

function startTimer(seconds) {
  stopTimer();
  timeLeft = seconds;
  const el = document.getElementById('timerDisplay');
  el.classList.add('running');
  el.classList.remove('done');
  tickTimer();
  document.getElementById('timerPanel').classList.add('open');

  timerInterval = setInterval(() => {
    timeLeft--;
    tickTimer();
    if (timeLeft <= 0) {
      clearInterval(timerInterval); timerInterval = null;
      el.classList.remove('running');
      el.classList.add('done');
      el.textContent = '✓ Done!';
      setTimeout(() => { el.classList.remove('done'); el.textContent = '00:00'; }, 2500);
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  const el = document.getElementById('timerDisplay');
  el.classList.remove('running','done');
  el.textContent = '00:00';
  timeLeft = 0;
}

function tickTimer() {
  const m = String(Math.floor(timeLeft / 60)).padStart(2,'0');
  const s = String(timeLeft % 60).padStart(2,'0');
  document.getElementById('timerDisplay').textContent = `${m}:${s}`;
}

// ─────────────────────────────────────────
//  Init
// ─────────────────────────────────────────
renderAll();
if (activeWorkout) startWorkoutClock();
