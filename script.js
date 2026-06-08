// ── Storage ──
let workouts = JSON.parse(localStorage.getItem('liftlog_workouts')) || [];

// ── Header date ──
const now = new Date();
document.getElementById('headerDate').textContent =
  now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

// ── Collapsible form ──
const formBody   = document.getElementById('formBody');
const toggleArrow = document.getElementById('toggleArrow');

document.getElementById('toggleForm').addEventListener('click', () => {
  const isOpen = formBody.classList.toggle('open');
  toggleArrow.classList.toggle('open', isOpen);
});

// ── Add workout ──
document.getElementById('addBtn').addEventListener('click', () => {
  const exercise = document.getElementById('exercise').value.trim();
  if (!exercise) {
    document.getElementById('exercise').focus();
    document.getElementById('exercise').style.borderColor = '#ef4444';
    document.getElementById('exercise').style.boxShadow  = '0 0 0 3px rgba(239,68,68,0.12)';
    setTimeout(() => {
      document.getElementById('exercise').style.borderColor = '';
      document.getElementById('exercise').style.boxShadow  = '';
    }, 1800);
    return;
  }

  const workout = {
    id:       Date.now(),
    exercise,
    sets:     document.getElementById('sets').value    || null,
    reps:     document.getElementById('reps').value    || null,
    weight:   document.getElementById('weight').value  || null,
    feeling:  document.getElementById('feeling').value,
    notes:    document.getElementById('notes').value.trim() || null,
    date:     new Date().toLocaleDateString('uk-UA'),
    time:     new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
  };

  workouts.unshift(workout); // newest first
  save();
  render();
  clearForm();

  // Close form after adding
  formBody.classList.remove('open');
  toggleArrow.classList.remove('open');
});

// ── Render all ──
function render() {
  renderKPI();
  renderHistory();
}

// ── KPI ──
function renderKPI() {
  const today = new Date().toLocaleDateString('uk-UA');
  const todayItems = workouts.filter(w => w.date === today);

  // Unique training days
  const uniqueDays = new Set(workouts.map(w => w.date)).size;

  // Total sets
  const totalSets = workouts.reduce((acc, w) => acc + (parseInt(w.sets) || 0), 0);

  // Total volume (sets × reps × weight)
  const totalVolume = workouts.reduce((acc, w) => {
    const s = parseInt(w.sets) || 0;
    const r = parseInt(w.reps) || 0;
    const kg = parseFloat(w.weight) || 0;
    return acc + s * r * kg;
  }, 0);

  document.getElementById('kpiWorkouts').textContent = uniqueDays;
  document.getElementById('kpiSets').textContent     = totalSets;
  document.getElementById('kpiWeight').textContent   = totalVolume >= 1000
    ? (totalVolume / 1000).toFixed(1) + ' t'
    : totalVolume + ' kg';
  document.getElementById('kpiToday').textContent    = todayItems.length;
}

// ── History grouped by date ──
function renderHistory() {
  const container = document.getElementById('historyList');

  if (!workouts.length) {
    container.innerHTML = `
      <div class="empty-history">
        <div class="empty-history-icon">📋</div>
        <div class="empty-history-text">No workouts yet.<br>Add your first exercise!</div>
      </div>`;
    return;
  }

  // Group by date
  const groups = {};
  workouts.forEach(w => {
    if (!groups[w.date]) groups[w.date] = [];
    groups[w.date].push(w);
  });

  const feelings = { great: '😄', good: '🙂', ok: '😐', bad: '😔' };
  const today    = new Date().toLocaleDateString('uk-UA');

  container.innerHTML = Object.entries(groups).map(([date, items]) => `
    <div class="day-group">
      <div class="day-label">${date === today ? '🟢 Today' : date} — ${items.length} exercise${items.length !== 1 ? 's' : ''}</div>
      ${items.map(w => `
        <div class="workout-item">
          <div style="flex:1;min-width:0;">
            <div class="workout-name">${w.exercise}</div>
            <div class="badges">
              ${w.sets   ? `<span class="badge">🔁 ${w.sets} sets</span>` : ''}
              ${w.reps   ? `<span class="badge">✕ ${w.reps} reps</span>` : ''}
              ${w.weight ? `<span class="badge">⚖️ ${w.weight} kg</span>` : ''}
            </div>
            ${w.notes ? `<div class="workout-note">📝 ${w.notes}</div>` : ''}
          </div>
          <div class="workout-right">
            <span>${feelings[w.feeling] || '🙂'}</span>
            <span class="time-label">${w.time}</span>
            <button class="btn-delete" onclick="removeWorkout(${w.id})">✕</button>
          </div>
        </div>
      `).join('')}
    </div>
  `).join('');
}

function removeWorkout(id) {
  workouts = workouts.filter(w => w.id !== id);
  save();
  render();
}

document.getElementById('clearAll').addEventListener('click', () => {
  if (workouts.length && confirm('Delete all workout records?')) {
    workouts = [];
    save();
    render();
  }
});

function save() {
  localStorage.setItem('liftlog_workouts', JSON.stringify(workouts));
}

function clearForm() {
  ['exercise','sets','reps','weight','notes'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('feeling').value = 'good';
}

function declension(n, one, few, many) {
  const m = n % 10, h = n % 100;
  if (m === 1 && h !== 11) return `${n} ${one}`;
  if (m >= 2 && m <= 4 && (h < 10 || h >= 20)) return `${n} ${few}`;
  return `${n} ${many}`;
}

// ── Timer ──
let timerInterval = null;
let timeLeft = 0;

const timerPanel  = document.getElementById('timerPanel');
const timerToggle = document.getElementById('timerToggle');
const timerClose  = document.getElementById('timerClose');

timerToggle.addEventListener('click', () => timerPanel.classList.toggle('open'));
timerClose.addEventListener('click',  () => timerPanel.classList.remove('open'));

function startTimer(seconds) {
  stopTimer();
  timeLeft = seconds;
  const el = document.getElementById('timerDisplay');
  el.classList.add('running');
  el.classList.remove('done');
  tick();
  timerPanel.classList.add('open');

  timerInterval = setInterval(() => {
    timeLeft--;
    tick();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
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

function tick() {
  const m = String(Math.floor(timeLeft / 60)).padStart(2,'0');
  const s = String(timeLeft % 60).padStart(2,'0');
  document.getElementById('timerDisplay').textContent = `${m}:${s}`;
}

// ── Init ──
render();
lucide.createIcons();
