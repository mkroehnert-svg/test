(function () {
  "use strict";

  const STORAGE_KEY = "habit-tracker-data";
  const DAY_NAMES = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

  // --- State ---
  let habits = [];
  let weekOffset = 0; // 0 = current week

  // --- DOM refs ---
  const habitInput = document.getElementById("habit-input");
  const addBtn = document.getElementById("add-btn");
  const habitList = document.getElementById("habit-list");
  const emptyMsg = document.getElementById("empty-msg");
  const dayHeaders = document.getElementById("day-headers");
  const weekLabel = document.getElementById("week-label");
  const prevWeekBtn = document.getElementById("prev-week");
  const nextWeekBtn = document.getElementById("next-week");

  // --- Helpers ---
  function toDateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function getWeekDays() {
    const today = new Date();
    const monday = getMonday(today);
    monday.setDate(monday.getDate() + weekOffset * 7);
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  }

  function formatWeekLabel(days) {
    const opts = { day: "numeric", month: "short" };
    const start = days[0].toLocaleDateString("de-DE", opts);
    const end = days[6].toLocaleDateString("de-DE", opts);
    const year = days[0].getFullYear();
    return `${start} - ${end} ${year}`;
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function calcStreak(habit) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let streak = 0;
    let d = new Date(today);
    // Check today first; if not checked, start from yesterday
    if (!habit.completions[toDateKey(d)]) {
      d.setDate(d.getDate() - 1);
    }
    while (habit.completions[toDateKey(d)]) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  // --- Persistence ---
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(habits));
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        habits = JSON.parse(raw);
      }
    } catch {
      habits = [];
    }
  }

  // --- Rendering ---
  function renderDayHeaders() {
    const days = getWeekDays();
    const todayKey = toDateKey(new Date());
    dayHeaders.innerHTML = "";

    days.forEach(function (d) {
      const div = document.createElement("div");
      div.className = "day-header";
      if (toDateKey(d) === todayKey) {
        div.classList.add("today");
      }
      const dayName = document.createElement("span");
      dayName.className = "day-name";
      dayName.textContent = DAY_NAMES[d.getDay()];
      const dayNum = document.createElement("span");
      dayNum.className = "day-num";
      dayNum.textContent = d.getDate();
      div.appendChild(dayName);
      div.appendChild(dayNum);
      dayHeaders.appendChild(div);
    });

    weekLabel.textContent = formatWeekLabel(days);
  }

  function renderHabits() {
    const days = getWeekDays();
    const todayKey = toDateKey(new Date());
    habitList.innerHTML = "";

    if (habits.length === 0) {
      emptyMsg.classList.remove("hidden");
      return;
    }

    emptyMsg.classList.add("hidden");

    habits.forEach(function (habit) {
      const row = document.createElement("div");
      row.className = "habit-row";

      // Name
      const nameDiv = document.createElement("div");
      nameDiv.className = "habit-name";
      nameDiv.textContent = habit.name;
      nameDiv.title = habit.name;
      row.appendChild(nameDiv);

      // Day cells
      days.forEach(function (d) {
        const key = toDateKey(d);
        const cell = document.createElement("div");
        cell.className = "day-cell";
        const btn = document.createElement("button");
        btn.className = "check-btn";
        if (habit.completions[key]) {
          btn.classList.add("checked");
          btn.innerHTML = "&#10003;";
        }
        btn.addEventListener("click", function () {
          toggleCompletion(habit.id, key);
        });
        cell.appendChild(btn);
        row.appendChild(cell);
      });

      // Streak
      const streakDiv = document.createElement("div");
      streakDiv.className = "streak";
      const streak = calcStreak(habit);
      streakDiv.textContent = streak > 0 ? streak + "d" : "-";
      row.appendChild(streakDiv);

      // Delete
      const delBtn = document.createElement("button");
      delBtn.className = "delete-btn";
      delBtn.innerHTML = "&#10005;";
      delBtn.title = "Habit löschen";
      delBtn.addEventListener("click", function () {
        removeHabit(habit.id);
      });
      row.appendChild(delBtn);

      habitList.appendChild(row);
    });
  }

  function render() {
    renderDayHeaders();
    renderHabits();
  }

  // --- Actions ---
  function addHabit(name) {
    const trimmed = name.trim();
    if (!trimmed) return;

    habits.push({
      id: generateId(),
      name: trimmed,
      completions: {},
    });
    save();
    render();
    habitInput.value = "";
    habitInput.focus();
  }

  function removeHabit(id) {
    habits = habits.filter(function (h) {
      return h.id !== id;
    });
    save();
    render();
  }

  function toggleCompletion(habitId, dateKey) {
    const habit = habits.find(function (h) {
      return h.id === habitId;
    });
    if (!habit) return;

    if (habit.completions[dateKey]) {
      delete habit.completions[dateKey];
    } else {
      habit.completions[dateKey] = true;
    }
    save();
    render();
  }

  // --- Events ---
  addBtn.addEventListener("click", function () {
    addHabit(habitInput.value);
  });

  habitInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
      addHabit(habitInput.value);
    }
  });

  prevWeekBtn.addEventListener("click", function () {
    weekOffset--;
    render();
  });

  nextWeekBtn.addEventListener("click", function () {
    weekOffset++;
    render();
  });

  // --- Init ---
  load();
  render();
})();
