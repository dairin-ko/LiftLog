// --- Дані тренування ---
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
    alert('Введи назву вправи!');
    return;
  }

  const workout = {
    id: Date.now(),
    exercise,
    sets:    sets    || '—',
    reps:    reps    || '—',
    weight:  weight  || '—',
    rest:    rest    || '—',
    feeling,
    notes,
    time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' })
  };

  workouts.push(workout);
  localStorage.setItem('liftlog_workouts', JSON.stringify(workouts));
  renderWorkouts();
  clearForm();

  // Автоматично запустити таймер якщо є відпочинок
  if (rest && parseInt(rest) > 0) {
    startTimer(parseInt(rest));
  }
});

// --- Відобразити список ---
function renderWorkouts() {
  const list = document.getElementById('workoutList');

  if (workouts.length === 0) {
    list.innerHTML = '<div class="empty-state"><p>Поки що немає записів. Додай першу вправу! 💪</p></div>';
    return;
  }

  const feelingEmoji = { great: '😄', good: '🙂', ok: '😐', bad: '😔' };

  list.innerHTML = workouts.map(w => `
    <div class="workout-item">
      <div class="workout-info">
        <h3>${w.exercise}</h3>
        <div class="workout-meta">
          <span>🔁 <strong>${w.sets}</strong> підходів</span>
          <span>✕ <strong>${w.reps}</strong> повт.</span>
          <span>⚖️ <strong>${w.weight}</strong> кг</span>
          <span>⏸ <strong>${w.rest}</strong> сек</span>
          <span>🕐 ${w.time}</span>
        </div>
        ${w.notes ? `<div class="workout-notes">📝 ${w.notes}</div>` : ''}
      </div>
      <div style="display:flex; flex-direction:column; align-items:flex-end; gap:8px;">
        <span class="workout-feeling">${feelingEmoji[w.feeling] || '🙂'}</span>
        <button class="delete-btn" onclick="deleteWorkout(${w.id})">✕</button>
      </div>
    </div>
  `).join('');
}

// --- Видалити вправу ---
function deleteWorkout(id) {
  workouts = workouts.filter(w => w.id !== id);
  localStorage.setItem('liftlog_workouts', JSON.stringify(workouts));
  renderWorkouts();
}

// --- Очистити форму ---
function clearForm() {
  document.getElementById('exercise').value = '';
  document.getElementById('sets').value = '';
  document.getElementById('reps').value = '';
  document.getElementById('weight').value = '';
  document.getElementById('rest').value = '';
  document.getElementById('notes').value = '';
  document.getElementById('feeling').value = 'good';
}

// --- Таймер ---
let timerInterval = null;
let timeLeft = 0;

function startTimer(seconds) {
  stopTimer();
  timeLeft = seconds;
  const display = document.getElementById('timerDisplay');
  display.classList.add('running');
  updateDisplay();

  timerInterval = setInterval(() => {
    timeLeft--;
    updateDisplay();
    if (timeLeft <= 0) {
      stopTimer();
      display.textContent = '✅ Готово!';
      setTimeout(() => { display.textContent = '00:00'; }, 2000);
    }
  }, 1000);
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  document.getElementById('timerDisplay').classList.remove('running');
  timeLeft = 0;
  document.getElementById('timerDisplay').textContent = '00:00';
}

function updateDisplay() {
  const m = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const s = (timeLeft % 60).toString().padStart(2, '0');
  document.getElementById('timerDisplay').textContent = `${m}:${s}`;
}

// --- Ініціалізація ---
renderWorkouts();
