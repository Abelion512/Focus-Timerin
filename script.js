let timer;
let count = 0;
let phoneCount = 0;
let phoneLockTimer;
const endSound = document.getElementById("endSound");
const timerSection = document.getElementById("timerSection");
const phoneLockSection = document.getElementById("phoneLockSection");
const phoneCountDisplay = document.getElementById("phoneCount");
const phoneLockTimerDisplay = document.getElementById("timerDisplay");

// Preload audio untuk mengurangi delay
endSound.load();

document.getElementById('startButton').addEventListener('click', () => {
  count++;
  document.getElementById('count').textContent = count;

  let hours = parseInt(document.getElementById('customHours').value) || 0;
  let minutes = parseInt(document.getElementById('customMinutes').value) || 0;
  let seconds = parseInt(document.getElementById('customSeconds').value) || 0;

  let duration = hours * 3600 + minutes * 60 + seconds;

  if (duration <= 0) {
    alert("atur waktunya dulu yaa!");
    return;
  }

  clearInterval(timer);
  clearInterval(phoneLockTimer);

  // Reset dan prepair audio sebelum memulai
  endSound.currentTime = 0;

  // Switch to phone lock screen
  timerSection.classList.add('hidden');
  phoneLockSection.classList.remove('hidden');

  // Reset phone count
  phoneCount = 0;
  phoneCountDisplay.textContent = phoneCount;

  // Start countdown timer for phone lock screen
  let phoneLockDuration = 235; // 3 minutes and 55 seconds
  updatePhoneLockTimer(phoneLockDuration);

  timer = setInterval(() => {
    if (duration <= 0) {
      clearInterval(timer);
      clearInterval(phoneLockTimer);

      // Coba mainkan suara dengan metode berbeda
      try {
        endSound.play().catch(error => {
          console.error("Error playing sound:", error);
        });
      } catch (error) {
        console.error("Exception playing sound:", error);
      }

      document.getElementById("timer").textContent = "00:00:00";
      
      // Return to timer section
      timerSection.classList.remove('hidden');
      phoneLockSection.classList.add('hidden');
      return;
    }

    duration--;
    let h = String(Math.floor(duration / 3600)).padStart(2, "0");
    let m = String(Math.floor((duration % 3600) / 60)).padStart(2, "0");
    let s = String(duration % 60).padStart(2, "0");

    document.getElementById("timer").textContent = `${h}:${m}:${s}`;
  }, 1000);
});

function updatePhoneLockTimer(duration) {
  phoneLockTimer = setInterval(() => {
    if (duration <= 0) {
      clearInterval(phoneLockTimer);
      return;
    }

    let m = String(Math.floor(duration / 60)).padStart(2, "0");
    let s = String(duration % 60).padStart(2, "0");

    phoneLockTimerDisplay.textContent = `00:${m}:${s}`;
    duration--;
  }, 1000);
}

document.getElementById("editButton").addEventListener("click", () => {
  const inputDiv = document.getElementById("editInputs");
  inputDiv.classList.toggle("hidden");
});

// Add event to track phone interactions
document.addEventListener('visibilitychange', () => {
  if (document.hidden && !phoneLockSection.classList.contains('hidden')) {
    phoneCount++;
    phoneCountDisplay.textContent = phoneCount;
  }
});

// Tambahkan event listener untuk memastikan audio siap dimuat
endSound.addEventListener('canplaythrough', () => {
  console.log('Audio is ready to play');
});

// Tangani kemungkinan browser tidak mendukung audio autoplay
endSound.addEventListener('error', (e) => {
  console.error('Audio error:', e);
});