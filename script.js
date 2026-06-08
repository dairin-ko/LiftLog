// --- Дані ---
let workouts = JSON.parse(localStorage.getItem('liftlog_workouts')) || [];

// --- Додати вправу ---
document.getElementById('addBtn').addEventListener('click', () => {
  const exercise = document.getElementById('exercise').value.trim();
  const sets     = document.getElementById('sets').value;
  const reps     = document.getElementById('reps').value;
  const weight   = document.getElementById('weight').value;
  const rest     = document.getElementById('rest').value;
  const feeling  = document.getElementById('feeling').value;
  const notes    = document.getElementById('notes').value.trim();

  if (!exercise) {
    document.getElementById('exercise').focus();
    document.getElementById('exercise').style.borderColor = '#ef4444';
    setTimeout(() => document.getElementById('exercise').style.borderColor = '', 1500);
    return;
  }

  const workout = {
    id: Date.now(),
    exercise, sets, reps, weight, rest, feeling, notes,
    time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
  };

  workouts.push(workout);
  save();
  render();
  clearForm();

  if (rest && parseInt(rest) > 0) startTimer(parseInt(rest));
});

// --- Рендер ---
function render() {
  const list = document.getElementById('workoutList');
  const count = document.getElementById('workoutCount');

  count.textContent = workouts.length
    ? `${workouts.length} ${declension(workouts.length, 'вправа', 'вправи', 'вправ')}`
    : 'Немає записів';

  if (!workouts.length) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">🏋️</div>
        <div class="empty-text">Поки що немає записів.<br>Додай першу вправу!</div>
      </div>`;
    return;
  }

  const feelings = { great: '😄', good: '🙂', ok: '😐', bad: '😔' };

  list.innerHTML = workouts.map(w => `
    <div class="workout-item">
      <div style="flex:1; min-width:0;">
        <div class="workout-name">${w.exercise}</div>
        <div class="workout-badges">
          ${w.sets   ? `<span class="badge">🔁 ${w.sets} підх.</span>` : ''}
          ${w.reps   ? `<span class="badge">✕ ${w.reps} повт.</span>` : ''}
          ${w.weight ? `<span class="badge">⚖️ ${w.weight} кг</span>` : ''}
          ${w.rest   ? `<span class="badge">⏸ ${w.rest} сек</span>` : ''}
        </div>
        ${w.notes ? `<div class="workout-note">📝 ${w.notes}</div>` : ''}
      </div>
      <div class="workout-right">
        <span class="feeling-badge">${feelings[w.feeling] || '🙂'}</span>
        <span class="time-label">${w.time}</span>
        <button class="btn-delete" onclick="remove(${w.id})">✕</button>
      </div>
    </div>
  `).join('');
}

function remove(id) {
  workouts = workouts.filter(w => w.id !== id);
  save();
  render();
}

function save() {
  localStorage.setItem('liftlog_workouts', JSON.stringify(workouts));
}

function clearForm() {
  ['exercise','sets','reps','weight','rest','notes'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.getElementById('feeling').value = 'good';
}

function declension(n, one, few, many) {
  const mod10 = n % 10, mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} ${one}`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return `${n} ${few}`;
  return `${n} ${many}`;
}

// --- Таймер ---
let timerInterval = null;
let timeLeft = 0;

function startTimer(seconds) {
  stopTimer();
  timeLeft = seconds;
  const el = document.getElementById('timerDisplay');
  el.classList.add('running');
  el.classList.remove('done');
  tick();

  timerInterval = setInterval(() => {
    timeLeft--;
    tick();
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerInterval = null;
      el.classList.remove('running');
      el.classList.add('done');
      el.textContent = '✓ Готово!';
      setTimeout(() => {
        el.classList.remove('done');
        el.textContent = '00:00';
      }, 2500);
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  const el = document.getElementById('timerDisplay');
  el.classList.remove('running', 'done');
  el.textContent = '00:00';
  timeLeft = 0;
}

function tick() {
  const m = String(Math.floor(timeLeft / 60)).padStart(2, '0');
  const s = String(timeLeft % 60).padStart(2, '0');
  document.getElementById('timerDisplay').textContent = `${m}:${s}`;
}

// --- Init ---
render();
