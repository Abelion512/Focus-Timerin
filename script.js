// Timer Variables
let timer;
let count = 0;
let totalSeconds = 0;
let currentSeconds = totalSeconds;
let isRunning = false;
let currentMode = 'focus';

// Default settings
const defaultSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  notificationSound: 'default',
  soundVolume: 80,
  theme: 'dark'
};

// Sistem Versi Aplikasi
const CURRENT_VERSION = '1.2.2'; // Ganti sesuai update
const VERSION_CHANGELOG = 'Bugfix & fitur baru: update otomatis versi, eye icon login, perbaikan mobile, dsb.';

function updateVersion(newVersion, changelog) {
  localStorage.setItem('focusTimerVersion', newVersion);
  localStorage.setItem('focusTimerChangelog', changelog);
}

function getCurrentVersion() {
  return localStorage.getItem('focusTimerVersion') || CURRENT_VERSION;
}

function getCurrentChangelog() {
  return localStorage.getItem('focusTimerChangelog') || VERSION_CHANGELOG;
}

// Update versi otomatis saat script dijalankan
updateVersion(CURRENT_VERSION, VERSION_CHANGELOG);

// DOM Content Loaded - Initialize everything
document.addEventListener('DOMContentLoaded', () => {
  loadTimerState();
  // Theme Toggle
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      document.body.classList.toggle('light-mode');
      // Simpan preferensi
      const settings = JSON.parse(localStorage.getItem('focusTimerSettings')) || defaultSettings;
      settings.theme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
      localStorage.setItem('focusTimerSettings', JSON.stringify(settings));
    });
  }

  // Fullscreen Toggle
  const fullscreenToggle = document.getElementById('fullscreenToggle');
  if (fullscreenToggle) {
    fullscreenToggle.addEventListener('click', () => {
      const icon = document.querySelector('.fullscreen-toggle i');
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
          console.error(`Error attempting to enable fullscreen: ${err.message}`);
        });
        if (icon) {
          icon.classList.remove('fa-expand');
          icon.classList.add('fa-compress');
        }
      } else if (document.exitFullscreen) {
        document.exitFullscreen();
        if (icon) {
          icon.classList.remove('fa-compress');
          icon.classList.add('fa-expand');
        }
      }
    });
  }

  // Hamburger menu toggle for mobile
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.querySelector('.nav-links');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }

  // Mode selector (Fokus, Short Break, Long Break)
  const modeButtons = document.querySelectorAll('.mode-btn');
  if (modeButtons.length > 0) {
    modeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;

        // Use saved settings for duration
        const savedSettings = JSON.parse(localStorage.getItem('focusTimerSettings')) || defaultSettings;
        let minutes = parseInt(btn.dataset.minutes);

        if (currentMode === 'focus') {
          minutes = savedSettings.focusDuration;
        } else if (currentMode === 'short-break') {
          minutes = savedSettings.shortBreakDuration;
        } else if (currentMode === 'long-break') {
          minutes = savedSettings.longBreakDuration;
        }

        initializeTimer(minutes * 60);

        // Reset timer state
        clearInterval(timer);
        isRunning = false;
        document.getElementById('startButton').textContent = 'Start';
      });
    });
  }

  // Edit timer
  const editButton = document.getElementById('editButton');
  if (editButton) {
    editButton.addEventListener('click', () => {
      const inputDiv = document.getElementById('editInputs');
      inputDiv.classList.toggle('hidden');

      if (!inputDiv.classList.contains('hidden')) {
        const hours = Math.floor(currentSeconds / 3600);
        const minutes = Math.floor((currentSeconds % 3600) / 60);
        const seconds = currentSeconds % 60;

        document.getElementById('customHours').value = hours;
        document.getElementById('customMinutes').value = minutes;
        document.getElementById('customSeconds').value = seconds;

        const timeSlider = document.getElementById('timeSlider');
        if (minutes >= 1 && minutes <= 120 && hours === 0 && seconds === 0 && timeSlider) {
          timeSlider.value = minutes;
        }
      }
    });
  }

  // Custom time slider
  const timeSlider = document.getElementById('timeSlider');
  if (timeSlider) {
    timeSlider.addEventListener('input', () => {
      const minutes = parseInt(timeSlider.value);
      document.getElementById('customMinutes').value = minutes;
      document.getElementById('customHours').value = 0;
      document.getElementById('customSeconds').value = 0;
    });
  }

  // Sync custom time inputs
  const customHours = document.getElementById('customHours');
  const customMinutes = document.getElementById('customMinutes');
  const customSeconds = document.getElementById('customSeconds');
  if (customHours && customMinutes && customSeconds) {
    [customHours, customMinutes, customSeconds].forEach(input => {
      input.addEventListener('input', () => {
        if (timeSlider) {
          const hours = parseInt(customHours.value) || 0;
          const minutes = parseInt(customMinutes.value) || 0;
          const seconds = parseInt(customSeconds.value) || 0;
          if (minutes >= 1 && minutes <= 120 && hours === 0 && seconds === 0) {
            timeSlider.value = minutes;
          }
        }
      });
    });
  }

  // Start/Pause button
  const startButton = document.getElementById('startButton');
  if (startButton) {
    startButton.addEventListener('click', () => {
      // Cek input tugas
      const taskInput = document.getElementById('taskInput');
      if (!taskInput?.value?.trim()) {
        alert('Isi dulu apa yang kamu kerjakan hari ini!');
        return;
      }
      // Cek tabel tugas (pastikan id-nya benar)
      const taskTable = document.getElementById('taskTable');
      // Jika tabel tidak punya header, gunakan === 0
      // Jika tabel punya header, gunakan <= 1
      if (taskTable && taskTable.rows.length <= 1) {
        showNotification('Isi tabel tugas terlebih dahulu untuk mulai timer!');
        return;
      }
      // Alert if task input is empty (redundant, bisa dihapus jika sudah dicek di atas)
      // const taskInput = document.getElementById('taskInput');
      // if (taskInput && (!taskInput.value || taskInput.value.trim() === '')) {
      //   showNotification('Isi task terlebih dahulu untuk mulai timer!');
      //   return;
      // }
      const editInputs = document.getElementById('editInputs');
      if (editInputs && !editInputs.classList.contains('hidden')) {
        const hours = parseInt(document.getElementById('customHours').value) || 0;
        const minutes = parseInt(document.getElementById('customMinutes').value) || 0;
        const seconds = parseInt(document.getElementById('customSeconds').value) || 0;
        const duration = hours * 3600 + minutes * 60 + seconds;
        if (duration <= 0) {
          showNotification("Waktu harus lebih dari 0 detik!");
          return;
        }
        initializeTimer(duration);
        editInputs.classList.add('hidden');
      }

      if (isRunning) {
        clearInterval(timer);
        startButton.textContent = 'Continue';
        isRunning = false;
      } else {
        if (currentMode === 'focus' && currentSeconds === totalSeconds) {
          count++;
          const countElement = document.getElementById('count');
          if (countElement) countElement.textContent = count;
          saveTimerState();
        }
        startTimer();
        startButton.textContent = 'Pause';
      }
    });
  }

  // Progress Ring Elements
  const circle = document.querySelector('.progress-ring-circle');
  if (circle) {
    const radius = circle.r.baseVal.value;
    const circumference = radius * 2 * Math.PI;
    circle.style.strokeDasharray = `${circumference} ${circumference}`;
    circle.style.strokeDashoffset = `${circumference}`;
  }

  // Load saved theme on page load
  loadSavedTheme();

  // Initial setup
  setRandomQuote();
  updateTimerDisplay();
  const countElement = document.getElementById('count');
  if (countElement) countElement.textContent = count;

  // Preload audio if exists
  const endSound = document.getElementById('endSound');
  if (endSound) endSound.load();
});

// Progress ring function
function setProgress(percent) {
  const circle = document.querySelector('.progress-ring-circle');
  if (!circle) return;
  const radius = circle.r.baseVal.value;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percent / 100 * circumference);
  circle.style.strokeDashoffset = offset;
}

// Update timer display
function updateTimerDisplay() {
  const timerDisplay = document.getElementById('timer');
  if (!timerDisplay) return;
  const hours = Math.floor(currentSeconds / 3600);
  const minutes = Math.floor((currentSeconds % 3600) / 60);
  const seconds = currentSeconds % 60;
  const display = hours > 0
    ? `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
    : `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  timerDisplay.textContent = display;
  const progressPercentage = totalSeconds > 0 ? ((totalSeconds - currentSeconds) / totalSeconds) * 100 : 0;
  setProgress(progressPercentage);
  saveTimerState();
}

// Initialize timer
function initializeTimer(seconds) {
  totalSeconds = seconds;
  currentSeconds = seconds;
  updateTimerDisplay();
  setProgress(0);
  saveTimerState();
}

// Start timer
function startTimer() {
  isRunning = true;
  saveTimerState();
  timer = setInterval(() => {
    if (currentSeconds <= 0) {
      clearInterval(timer);
      isRunning = false;
      // Play sound
      const savedSettings = JSON.parse(localStorage.getItem('focusTimerSettings')) || defaultSettings;
      const endSound = document.getElementById('endSound');
      if (endSound) {
        endSound.volume = savedSettings.soundVolume / 100;
        try { 
          endSound.play(); 
        } catch (error) {
          console.error('Failed to play end sound:', error);
          showNotification('Gagal memutar suara akhir.');
        }
      }
      showNotification(`${currentMode.charAt(0).toUpperCase() + currentMode.slice(1)} time is up!`);
      saveSessionHistory();
      currentSeconds = totalSeconds;
      updateTimerDisplay();
      saveTimerState();
      return;
    }
    currentSeconds--;
    updateTimerDisplay();
    saveTimerState();
  }, 1000);
}

// Random motivation quotes
const quotes = [
  { text: "Kesuksesan adalah kemampuan untuk bergerak dari satu kegagalan ke kegagalan lainnya tanpa kehilangan semangat.", author: "Winston Churchill" },
  { text: "Jika kamu tidak bisa terbang, maka larilah. Jika kamu tidak bisa berlari, maka berjalanlah. Jika kamu tidak bisa berjalan, maka merangkaklah. Tapi apapun yang kamu lakukan, teruslah bergerak maju.", author: "Martin Luther King Jr." },
  { text: "Cara untuk memulai adalah dengan berhenti berbicara dan mulai melakukan.", author: "Walt Disney" },
  { text: "Apa yang kamu lakukan hari ini dapat memperbaiki semua hari esokmu.", author: "Ralph Marston" },
  { text: "Jangan menunggu inspirasi, kejarlah inspirasi.", author: "Jack London" },
  { text: "Disiplin adalah jembatan antara tujuan dan pencapaian.", author: "Jim Rohn" },
  { text: "Waktu itu seperti sungai. Kamu tidak bisa menyentuh air yang sama dua kali.", author: "Heraclitus" },
  { text: "Fokus pada perjalanan, bukan tujuan. Kegembiraan ditemukan bukan dalam menyelesaikan suatu aktivitas melainkan dalam melakukannya.", author: "Greg Anderson" },
  { text: "Produktivitas tidak pernah tentang melakukan lebih banyak hal, tetapi tentang fokus pada hal yang tepat.", author: "Gary Keller" },
  { text: "Waktu hilang tidak pernah ditemukan lagi.", author: "Benjamin Franklin" }
];

// Set random quote on load
function setRandomQuote() {
  const quoteText = document.getElementById('quoteText');
  const quoteAuthor = document.getElementById('quoteAuthor');
  if (quoteText && quoteAuthor) {
    const randomIndex = Math.floor(Math.random() * quotes.length);
    const quote = quotes[randomIndex];
    quoteText.textContent = quote.text;
    quoteAuthor.textContent = `— ${quote.author}`;
  }
}

// Show notification
function showNotification(message) {
  let notification = document.querySelector('.notification');
  if (!notification) {
    notification = document.createElement('div');
    notification.className = 'notification';
    document.body.appendChild(notification);
  }
  notification.textContent = message;
  notification.classList.remove('hide');
  setTimeout(() => {
    notification.classList.add('hide');
    setTimeout(() => {
      if (notification.parentNode) {
        document.body.removeChild(notification);
      }
    }, 500);
  }, 2500);
}

// Theme helpers
function setTheme(theme) {
  const body = document.body;
  const themeIcon = document.querySelector('.theme-toggle i');
  if (theme === 'light') {
    body.classList.remove('dark-mode');
    body.classList.add('light-mode');
    if (themeIcon) {
      themeIcon.classList.remove('fa-moon');
      themeIcon.classList.add('fa-sun');
    }
  } else {
    body.classList.remove('light-mode');
    body.classList.add('dark-mode');
    if (themeIcon) {
      themeIcon.classList.remove('fa-sun');
      themeIcon.classList.add('fa-moon');
    }
  }
  // Save theme preference to localStorage
  const settings = JSON.parse(localStorage.getItem('focusTimerSettings')) || defaultSettings;
  settings.theme = theme;
  localStorage.setItem('focusTimerSettings', JSON.stringify(settings));
}

function loadSavedTheme() {
  const savedSettings = JSON.parse(localStorage.getItem('focusTimerSettings')) || defaultSettings;
  setTheme(savedSettings.theme);
}

function saveSessionHistory() {
  // Gunakan 'guest' jika userEmail tidak ada
  let userEmail = window.localStorage.getItem('userEmail') || 'guest';
  const key = 'focusHistory_' + userEmail.replace(/[^\w]/g, '');
  const historyData = JSON.parse(localStorage.getItem(key)) || [];
  const now = new Date();
  const dateStr = now.toLocaleDateString('id-ID') + ' ' + now.toLocaleTimeString('id-ID');
  const task = document.getElementById('taskInput') ? document.getElementById('taskInput').value : '-';
  const duration = Math.floor(totalSeconds / 60);
  historyData.unshift({
    date: dateStr,
    task: task,
    duration: duration,
    completed: 'Yes'
  });
  localStorage.setItem(key, JSON.stringify(historyData));
}

function saveTimerState() {
  const state = {
    currentSeconds,
    totalSeconds,
    isRunning,
    currentMode,
    count
  };
  localStorage.setItem('focusTimerState', JSON.stringify(state));
}

function loadTimerState() {
  const state = JSON.parse(localStorage.getItem('focusTimerState'));
  if (state) {
    currentSeconds = state.currentSeconds;
    totalSeconds = state.totalSeconds;
    isRunning = state.isRunning;
    currentMode = state.currentMode;
    count = state.count || 0;
  }
}