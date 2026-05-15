const words = [
  { text: "我", meaning: "我", emoji: "🙋" },
  { text: "你", meaning: "你", emoji: "👧" },
  { text: "媽媽", meaning: "媽媽", emoji: "👩" },
  { text: "爸爸", meaning: "爸爸", emoji: "👨" },
  { text: "家", meaning: "家", emoji: "🏠" },
  { text: "書", meaning: "書", emoji: "📚" },
  { text: "水", meaning: "水", emoji: "💧" },
  { text: "吃", meaning: "吃", emoji: "🍚" },
  { text: "貓", meaning: "貓", emoji: "🐱" },
  { text: "狗", meaning: "狗", emoji: "🐶" },
  { text: "大", meaning: "大", emoji: "👐" },
  { text: "小", meaning: "小", emoji: "🤏" },
];

const state = {
  mode: "listen",
  current: null,
  answered: false,
  score: 0,
  practiced: 0,
  soundOn: true,
  recentIndexes: [],
};

const choiceGrid = document.querySelector("#choice-grid");
const instruction = document.querySelector("#instruction");
const picturePrompt = document.querySelector("#picture-prompt");
const characterPrompt = document.querySelector("#character-prompt");
const speakButton = document.querySelector("#speak-button");
const nextButton = document.querySelector("#next-button");
const resetButton = document.querySelector("#reset-button");
const score = document.querySelector("#score");
const roundLabel = document.querySelector("#round-label");
const progressFill = document.querySelector("#progress-fill");
const knownCount = document.querySelector("#known-count");
const practiceCount = document.querySelector("#practice-count");
const wordList = document.querySelector("#word-list");
const soundToggle = document.querySelector("#sound-toggle");
const gardenScene = document.querySelector("#garden-scene");
const tabs = document.querySelectorAll(".tab");
const parentDetails = document.querySelector(".parent-details");
let audioContext;
let speechKeepAlive;
let speechToken = 0;

function pickWord() {
  let index = Math.floor(Math.random() * words.length);
  while (state.recentIndexes.includes(index) && words.length > 3) {
    index = Math.floor(Math.random() * words.length);
  }

  state.recentIndexes = [...state.recentIndexes.slice(-2), index];
  return words[index];
}

function getChoices(answer) {
  const pool = words.filter((word) => word.text !== answer.text);
  const shuffled = pool.sort(() => Math.random() - 0.5).slice(0, 3);
  return [...shuffled, answer].sort(() => Math.random() - 0.5);
}

function speak(text) {
  if (!state.soundOn || !("speechSynthesis" in window)) return;

  speechToken += 1;
  const currentToken = speechToken;
  let hasStarted = false;
  let hasFinished = false;

  const buildUtterance = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 0.78;
    utterance.pitch = 1.08;
    utterance.onstart = () => {
      hasStarted = true;
    };
    utterance.onend = () => {
      hasFinished = true;
      if (currentToken === speechToken) {
        clearInterval(speechKeepAlive);
      }
    };
    utterance.onerror = () => {
      hasFinished = true;
      if (currentToken === speechToken) {
        clearInterval(speechKeepAlive);
      }
    };
    return utterance;
  };

  clearInterval(speechKeepAlive);
  window.speechSynthesis.cancel();
  window.speechSynthesis.resume();
  window.speechSynthesis.speak(buildUtterance());

  speechKeepAlive = setInterval(() => {
    window.speechSynthesis.resume();
  }, 120);

  setTimeout(() => {
    if (currentToken !== speechToken || hasStarted || hasFinished) return;

    clearInterval(speechKeepAlive);
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume();
    window.speechSynthesis.speak(buildUtterance());
  }, 220);

  setTimeout(() => {
    if (currentToken === speechToken) {
      clearInterval(speechKeepAlive);
    }
  }, 1600);
}

function speakCurrentWord() {
  if (state.mode === "listen" && state.current) {
    speak(state.current.text);
  }
}

function playCorrectFeedback() {
  if (!state.soundOn) return;

  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return;

  audioContext ||= new AudioCtx();
  const now = audioContext.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];

  notes.forEach((frequency, index) => {
    const start = now + index * 0.07;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.16, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);

    gain.connect(audioContext.destination);
    oscillator.connect(gain);
    oscillator.start(start);
    oscillator.stop(start + 0.2);
  });
}

function renderPrompt() {
  picturePrompt.hidden = true;
  characterPrompt.hidden = true;
  speakButton.hidden = false;

  if (state.mode === "listen") {
    instruction.textContent = "聽一聽，選出你聽到的字。";
    return;
  }

  if (state.mode === "picture") {
    instruction.textContent = "看圖片，選出對的詞。";
    picturePrompt.textContent = state.current.emoji;
    picturePrompt.hidden = false;
    speakButton.hidden = true;
    return;
  }

  instruction.textContent = "找出一樣的字。";
  characterPrompt.textContent = state.current.text;
  characterPrompt.hidden = false;
}

function renderChoices() {
  choiceGrid.innerHTML = "";
  getChoices(state.current).forEach((word) => {
    const button = document.createElement("button");
    button.className = "choice-button";
    button.type = "button";
    button.textContent = word.text;
    button.addEventListener("click", () => handleAnswer(button, word));
    choiceGrid.append(button);
  });
}

function renderStats() {
  score.textContent = state.score;
  knownCount.textContent = state.score;
  practiceCount.textContent = state.practiced;
  roundLabel.textContent = `第 ${state.practiced + 1} 題`;
  progressFill.style.width = `${Math.min((state.practiced / 10) * 100, 100)}%`;

  [...gardenScene.children].forEach((item, index) => {
    item.classList.toggle("awake", index < Math.min(state.score, 3));
  });
}

function renderWordList() {
  wordList.innerHTML = "";
  words.forEach((word) => {
    const item = document.createElement("li");
    item.innerHTML = `<strong>${word.text}</strong><span>${word.meaning}</span>`;
    wordList.append(item);
  });
}

function handleAnswer(button, selected) {
  if (state.answered) return;

  const isCorrect = selected.text === state.current.text;

  if (isCorrect) {
    state.answered = true;
    state.practiced += 1;
    state.score += 1;
    button.classList.add("correct");
    playCorrectFeedback();
    nextButton.disabled = false;
  } else {
    button.classList.add("wrong");
    button.disabled = true;
    speak(state.current.text);
  }

  renderStats();
}

function nextRound() {
  state.current = pickWord();
  state.answered = false;
  nextButton.disabled = true;
  renderStats();
  renderPrompt();
  renderChoices();
  speakCurrentWord();
}

function setMode(mode) {
  state.mode = mode;
  tabs.forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.mode === mode);
  });
  nextRound();
}

function resetGame() {
  state.score = 0;
  state.practiced = 0;
  state.recentIndexes = [];
  nextRound();
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setMode(tab.dataset.mode));
});

speakButton.addEventListener("click", () => speak(state.current.text));
nextButton.addEventListener("click", nextRound);
resetButton.addEventListener("click", resetGame);
soundToggle.addEventListener("click", () => {
  state.soundOn = !state.soundOn;
  soundToggle.textContent = state.soundOn ? "🔊" : "🔇";
});

renderWordList();
if (window.matchMedia("(max-width: 860px)").matches) {
  parentDetails.open = false;
}
nextRound();
