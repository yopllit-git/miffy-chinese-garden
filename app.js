const audioByText = {
  我: "wo.wav",
  你: "ni.wav",
  媽媽: "mama.wav",
  爸爸: "baba.wav",
  家: "jia.wav",
  書: "shu.wav",
  水: "shui.wav",
  吃: "chi.wav",
  貓: "mao.wav",
  狗: "gou.wav",
  大: "da.wav",
  小: "xiao.wav",
};

const defaultWords = [
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
].map(withAudio);

const starterGroups = [
  {
    name: "入門詞",
    words: defaultWords,
  },
];

const state = {
  mode: "listen",
  current: null,
  answered: false,
  score: 0,
  practiced: 0,
  soundOn: true,
  recentIndexes: [],
  activeGroupIndex: 0,
  groups: loadGroups(),
  dailyStars: loadDailyStars(),
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
const tabs = document.querySelectorAll(".tab");
const navButtons = document.querySelectorAll(".nav-button");
const pagePanels = document.querySelectorAll(".app-page");
const parentDetails = document.querySelector(".parent-details");
const groupTabs = document.querySelector("#group-tabs");
const addGroupButton = document.querySelector("#add-group-button");
const saveGroupButton = document.querySelector("#save-group-button");
const deleteGroupButton = document.querySelector("#delete-group-button");
const groupNameInput = document.querySelector("#group-name");
const wordEditor = document.querySelector("#word-editor");
const groupCount = document.querySelector("#group-count");
const todayStars = document.querySelector("#today-stars");
const weekGrid = document.querySelector("#week-grid");

let audioContext;
let currentWordAudio;
let speechKeepAlive;
let speechToken = 0;

function withAudio(word) {
  return {
    ...word,
    meaning: word.meaning || word.text,
    emoji: word.emoji || "🌟",
    audio: audioByText[word.text] || null,
  };
}

function loadGroups() {
  try {
    const stored = JSON.parse(localStorage.getItem("miffy-word-groups"));
    if (!Array.isArray(stored) || stored.length === 0) return starterGroups;
    return stored.slice(0, 10).map((group, index) => ({
      name: group.name || `第 ${index + 1} 組`,
      words: normalizeWords(group.words),
    }));
  } catch {
    return starterGroups;
  }
}

function saveGroups() {
  localStorage.setItem("miffy-word-groups", JSON.stringify(state.groups));
}

function loadDailyStars() {
  try {
    return JSON.parse(localStorage.getItem("miffy-daily-stars")) || {};
  } catch {
    return {};
  }
}

function saveDailyStars() {
  localStorage.setItem("miffy-daily-stars", JSON.stringify(state.dailyStars));
}

function normalizeWords(words) {
  const cleaned = Array.isArray(words)
    ? words
        .map((word) => {
          if (typeof word === "string") return { text: word.trim() };
          return {
            text: String(word.text || "").trim(),
            meaning: String(word.meaning || word.text || "").trim(),
            emoji: String(word.emoji || "🌟").trim(),
          };
        })
        .filter((word) => word.text)
    : [];

  return (cleaned.length ? cleaned : defaultWords).map(withAudio);
}

function activeWords() {
  return state.groups[state.activeGroupIndex]?.words || defaultWords;
}

function pickWord() {
  const words = activeWords();
  let index = Math.floor(Math.random() * words.length);
  while (state.recentIndexes.includes(index) && words.length > 3) {
    index = Math.floor(Math.random() * words.length);
  }

  state.recentIndexes = [...state.recentIndexes.slice(-2), index];
  return words[index];
}

function getChoices(answer) {
  const candidates = [...activeWords(), ...defaultWords]
    .map(withAudio)
    .filter((word, index, list) => list.findIndex((item) => item.text === word.text) === index)
    .filter((word) => word.text !== answer.text);

  const shuffled = candidates.sort(() => Math.random() - 0.5).slice(0, 3);
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
    utterance.rate = 0.68;
    utterance.pitch = 1.08;
    utterance.onstart = () => {
      hasStarted = true;
    };
    utterance.onend = () => {
      hasFinished = true;
      if (currentToken === speechToken) clearInterval(speechKeepAlive);
    };
    utterance.onerror = () => {
      hasFinished = true;
      if (currentToken === speechToken) clearInterval(speechKeepAlive);
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
    if (currentToken === speechToken) clearInterval(speechKeepAlive);
  }, 1600);
}

function playWordAudio(word) {
  if (!state.soundOn || !word) return;

  window.speechSynthesis?.cancel();
  currentWordAudio?.pause();

  if (!word.audio) {
    speak(word.text);
    return;
  }

  const audio = new Audio(`./audio/${word.audio}?v=3`);
  currentWordAudio = audio;
  audio.currentTime = 0;
  audio.playbackRate = 0.85;
  audio.play().catch(() => speak(word.text));
}

function speakCurrentWord() {
  if (state.mode === "listen" && state.current) {
    playWordAudio(state.current);
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

  instruction.textContent = "聽一聽，選出你聽到的字。";
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
  todayStars.textContent = `${getTodayStars()} / 3 ⭐`;
  renderWeekGrid();
}

function renderWordList() {
  wordList.innerHTML = "";
  activeWords().forEach((word) => {
    const item = document.createElement("li");
    const audioLabel = word.audio ? "固定音檔" : "系統朗讀";
    item.innerHTML = `<strong>${word.text}</strong><span>${word.meaning} · ${audioLabel}</span>`;
    wordList.append(item);
  });
}

function renderGroupManager() {
  groupTabs.innerHTML = "";
  state.groups.forEach((group, index) => {
    const button = document.createElement("button");
    button.className = `group-tab${index === state.activeGroupIndex ? " active" : ""}`;
    button.type = "button";
    button.textContent = group.name;
    button.addEventListener("click", () => {
      state.activeGroupIndex = index;
      resetGame();
      renderGroupManager();
      renderWordList();
    });
    groupTabs.append(button);
  });

  const activeGroup = state.groups[state.activeGroupIndex];
  groupNameInput.value = activeGroup.name;
  wordEditor.value = activeGroup.words.map((word) => word.text).join("\n");

  addGroupButton.disabled = state.groups.length >= 10;
  deleteGroupButton.disabled = state.groups.length <= 1;
  groupCount.textContent = `${state.groups.length} / 10`;
}

function parseEditorWords() {
  return wordEditor.value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [text] = line.split(",").map((part) => part?.trim());
      return withAudio({
        text,
        meaning: text,
        emoji: "🌟",
      });
    });
}

function saveCurrentGroup() {
  const words = parseEditorWords();
  if (!words.length) return;

  state.groups[state.activeGroupIndex] = {
    name: groupNameInput.value.trim() || `第 ${state.activeGroupIndex + 1} 組`,
    words,
  };
  saveGroups();
  resetGame();
  renderGroupManager();
  renderWordList();
}

function addGroup() {
  if (state.groups.length >= 10) return;

  state.groups.push({
    name: `第 ${state.groups.length + 1} 組`,
    words: [withAudio({ text: "新字", meaning: "新字", emoji: "🌟" })],
  });
  state.activeGroupIndex = state.groups.length - 1;
  saveGroups();
  resetGame();
  renderGroupManager();
  renderWordList();
}

function deleteGroup() {
  if (state.groups.length <= 1) return;

  state.groups.splice(state.activeGroupIndex, 1);
  state.activeGroupIndex = Math.max(0, state.activeGroupIndex - 1);
  saveGroups();
  resetGame();
  renderGroupManager();
  renderWordList();
}

function dateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getTodayStars() {
  return state.dailyStars[dateKey(new Date())] || 0;
}

function addTodayStar() {
  const key = dateKey(new Date());
  state.dailyStars[key] = Math.min((state.dailyStars[key] || 0) + 1, 3);
  saveDailyStars();
}

function getWeekStart(date) {
  const start = new Date(date);
  const day = start.getDay() || 7;
  start.setDate(start.getDate() - day + 1);
  start.setHours(0, 0, 0, 0);
  return start;
}

function renderWeekGrid() {
  weekGrid.innerHTML = "";
  const labels = ["一", "二", "三", "四", "五", "六", "日"];
  const start = getWeekStart(new Date());

  labels.forEach((label, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = dateKey(date);
    const stars = state.dailyStars[key] || 0;
    const card = document.createElement("article");
    card.className = `day-card${stars >= 3 ? " complete" : ""}`;
    card.innerHTML = `
      <p class="day-name">星期${label}</p>
      <div class="day-stars" aria-label="${stars} 顆星">
        ${[0, 1, 2].map((star) => `<span class="${star < stars ? "earned" : ""}">⭐</span>`).join("")}
      </div>
      <p class="day-status">${stars >= 3 ? "完成" : `${stars} / 3`}</p>
    `;
    weekGrid.append(card);
  });
}

function showPage(page) {
  navButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.page === page);
  });
  pagePanels.forEach((panel) => {
    const isActive = panel.dataset.pagePanel === page;
    panel.classList.toggle("active", isActive);
    panel.hidden = !isActive;
  });
  if (page === "rewards") renderWeekGrid();
}

function handleAnswer(button, selected) {
  if (state.answered) return;

  const isCorrect = selected.text === state.current.text;

  if (isCorrect) {
    state.answered = true;
    state.practiced += 1;
    state.score += 1;
    addTodayStar();
    button.classList.add("correct");
    playCorrectFeedback();
    nextButton.disabled = false;
  } else {
    button.classList.add("wrong");
    button.disabled = true;
    playWordAudio(state.current);
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

navButtons.forEach((button) => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

speakButton.addEventListener("click", () => playWordAudio(state.current));
nextButton.addEventListener("click", nextRound);
resetButton.addEventListener("click", resetGame);
addGroupButton.addEventListener("click", addGroup);
saveGroupButton.addEventListener("click", saveCurrentGroup);
deleteGroupButton.addEventListener("click", deleteGroup);
soundToggle.addEventListener("click", () => {
  state.soundOn = !state.soundOn;
  soundToggle.textContent = state.soundOn ? "🔊" : "🔇";
});

renderGroupManager();
renderWordList();
renderWeekGrid();
parentDetails.open = true;
nextRound();
