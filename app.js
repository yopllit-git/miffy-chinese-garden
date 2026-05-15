import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import {
  doc,
  getDoc,
  getFirestore,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDjXk4wdZWOi8CxX3Quz3eJLCN89UGeCsQ",
  authDomain: "miffy-chinese-garden.firebaseapp.com",
  projectId: "miffy-chinese-garden",
  storageBucket: "miffy-chinese-garden.firebasestorage.app",
  messagingSenderId: "46399762559",
  appId: "1:46399762559:web:5464bd10ccb9e05fbb4f4a",
};

const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);
const DEFAULT_SESSION_LENGTH = 15;
const MIN_SESSION_LENGTH = 5;
const MAX_SESSION_LENGTH = 30;

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

const starterProfiles = [
  {
    id: "miffy",
    name: "咪菲",
    dailyStars: {},
  },
];

const state = {
  mode: "listen",
  current: null,
  answered: false,
  score: 0,
  practiced: 0,
  sessionComplete: false,
  sessionStarted: false,
  completedPracticeNumber: 0,
  soundOn: true,
  recentIndexes: [],
  activeGroupIndex: loadActiveGroupIndex(),
  groups: loadGroups(),
  profiles: loadProfiles(),
  activeProfileId: loadActiveProfileId(),
  sessionLength: loadSessionLength(),
  user: null,
  cloudReady: false,
};

const choiceGrid = document.querySelector("#choice-grid");
const instruction = document.querySelector("#instruction");
const picturePrompt = document.querySelector("#picture-prompt");
const characterPrompt = document.querySelector("#character-prompt");
const celebration = document.querySelector("#celebration");
const completionMessage = document.querySelector("#completion-message");
const missionTitle = document.querySelector("#mission-title");
const startButton = document.querySelector("#start-button");
const speakButton = document.querySelector("#speak-button");
const nextButton = document.querySelector("#next-button");
const resetButton = document.querySelector("#reset-button");
const score = document.querySelector("#score");
const roundLabel = document.querySelector("#round-label");
const progressFill = document.querySelector("#progress-fill");
const wordList = document.querySelector("#word-list");
const soundToggle = document.querySelector("#sound-toggle");
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
const rewardTitle = document.querySelector("#reward-title");
const weekSummary = document.querySelector("#week-summary");
const practiceProfileSelect = document.querySelector("#practice-profile-select");
const rewardProfileSelect = document.querySelector("#reward-profile-select");
const practiceCourseSelect = document.querySelector("#practice-course-select");
const profileTabs = document.querySelector("#profile-tabs");
const addProfileButton = document.querySelector("#add-profile-button");
const saveProfileButton = document.querySelector("#save-profile-button");
const deleteProfileButton = document.querySelector("#delete-profile-button");
const profileNameInput = document.querySelector("#profile-name");
const sessionLengthInput = document.querySelector("#session-length");

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
  localStorage.setItem("miffy-active-group", String(state.activeGroupIndex));
  saveCloudData();
}

function loadActiveGroupIndex() {
  const stored = Number(localStorage.getItem("miffy-active-group"));
  return Number.isInteger(stored) && stored >= 0 ? stored : 0;
}

function loadProfiles() {
  try {
    const stored = JSON.parse(localStorage.getItem("miffy-profiles"));
    if (Array.isArray(stored) && stored.length) return normalizeProfiles(stored);
  } catch {
  }

  let legacyStars = {};
  try {
    legacyStars = JSON.parse(localStorage.getItem("miffy-daily-stars") || "{}");
  } catch {
    legacyStars = {};
  }
  return [{ ...starterProfiles[0], dailyStars: legacyStars || {} }];
}

function loadActiveProfileId() {
  return localStorage.getItem("miffy-active-profile") || "miffy";
}

function clampSessionLength(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_SESSION_LENGTH;
  return Math.min(Math.max(Math.round(number), MIN_SESSION_LENGTH), MAX_SESSION_LENGTH);
}

function loadSessionLength() {
  return clampSessionLength(localStorage.getItem("miffy-session-length") || DEFAULT_SESSION_LENGTH);
}

function saveSessionLength() {
  state.sessionLength = clampSessionLength(state.sessionLength);
  localStorage.setItem("miffy-session-length", String(state.sessionLength));
  saveCloudData();
}

function saveProfiles() {
  localStorage.setItem("miffy-profiles", JSON.stringify(state.profiles));
  localStorage.setItem("miffy-active-profile", state.activeProfileId);
  saveCloudData();
}

function cloudDocRef() {
  if (!state.user) return null;
  return doc(db, "users", state.user.uid, "app", "miffy-chinese-garden");
}

async function loadCloudData(user) {
  state.user = user;
  const ref = cloudDocRef();
  if (!ref) return;

  const snapshot = await getDoc(ref);
  if (snapshot.exists()) {
    const data = snapshot.data();
    state.groups = normalizeGroups(data.groups);
    state.activeGroupIndex = Math.min(data.activeGroupIndex || 0, state.groups.length - 1);
    state.profiles = normalizeProfiles(data.profiles, data.dailyStars);
    state.activeProfileId = data.activeProfileId || state.profiles[0].id;
    state.sessionLength = clampSessionLength(data.sessionLength || state.sessionLength);
    persistLocalOnly();
  } else {
    state.cloudReady = true;
    await saveCloudData();
  }

  state.cloudReady = true;
  showAuthMessage("已同步雲端");
  resetGame();
  renderAuth();
  renderGroupManager();
  renderProfileManager();
  renderProfileSelectors();
  renderWordList();
  renderWeekGrid();
}

function normalizeGroups(groups) {
  if (!Array.isArray(groups) || groups.length === 0) return starterGroups;
  return groups.slice(0, 10).map((group, index) => ({
    name: group.name || `第 ${index + 1} 組`,
    words: normalizeWords(group.words),
  }));
}

function persistLocalOnly() {
  localStorage.setItem("miffy-word-groups", JSON.stringify(state.groups));
  localStorage.setItem("miffy-active-group", String(state.activeGroupIndex));
  localStorage.setItem("miffy-profiles", JSON.stringify(state.profiles));
  localStorage.setItem("miffy-active-profile", state.activeProfileId);
  localStorage.setItem("miffy-session-length", String(state.sessionLength));
}

async function saveCloudData() {
  if (!state.user || !state.cloudReady) return;

  const ref = cloudDocRef();
  if (!ref) return;

  await setDoc(
    ref,
    {
      groups: state.groups,
      activeGroupIndex: state.activeGroupIndex,
      profiles: state.profiles,
      activeProfileId: state.activeProfileId,
      sessionLength: state.sessionLength,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  ).catch((error) => {
    console.warn("Cloud save failed", error);
  });
}

function renderAuth() {
  return;
}

function showAuthMessage(message, isError = false) {
  console[isError ? "warn" : "info"](message);
}

function friendlyAuthError(error) {
  const code = error?.code || "";
  if (code.includes("unauthorized-domain")) {
    return "這個網址還沒加入 Firebase Authorized domains。";
  }
  if (code.includes("operation-not-allowed")) {
    return "Firebase 還沒啟用 Google 登入。";
  }
  if (code.includes("popup-blocked")) {
    return "瀏覽器擋住登入視窗，正在改用跳轉登入。";
  }
  if (code.includes("permission-denied")) {
    return "Firestore 權限規則還沒允許這個帳號存取資料。";
  }
  return `登入/同步失敗：${code || error?.message || "未知錯誤"}`;
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

function normalizeProfiles(profiles, legacyStars = {}) {
  const cleaned = Array.isArray(profiles)
    ? profiles
        .map((profile, index) => ({
          id: String(profile.id || `child-${index + 1}`).trim(),
          name: String(profile.name || `小孩 ${index + 1}`).trim(),
          dailyStars: profile.dailyStars || {},
        }))
        .filter((profile) => profile.id && profile.name)
    : [];

  return cleaned.length ? cleaned : [{ ...starterProfiles[0], dailyStars: legacyStars || {} }];
}

function activeWords() {
  return state.groups[state.activeGroupIndex]?.words || defaultWords;
}

function activeProfile() {
  let profile = state.profiles.find((item) => item.id === state.activeProfileId);
  if (!profile) {
    profile = state.profiles[0] || starterProfiles[0];
    state.activeProfileId = profile.id;
  }
  return profile;
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
  const courseWords = activeWords();
  const fallbackWords = courseWords.length >= 4 ? [] : defaultWords;
  const candidates = [...courseWords, ...fallbackWords]
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
  celebration.hidden = true;
  startButton.hidden = true;
  speakButton.hidden = false;

  instruction.textContent = "聽一聽，選出你聽到的字。";
}

function ordinalText(number) {
  const labels = ["零", "一", "二", "三"];
  return labels[number] || String(number);
}

function renderStartScreen() {
  const todayComplete = getTodayStars() >= 3;
  choiceGrid.innerHTML = "";
  state.answered = false;
  state.current = null;
  instruction.textContent = todayComplete ? "" : `準備好了就開始。完成 ${state.sessionLength} 題可以得到 1 顆星星。`;
  roundLabel.textContent = todayComplete ? "今日完成" : "尚未開始";
  score.textContent = state.score;
  progressFill.style.width = `${Math.min((state.practiced / state.sessionLength) * 100, 100)}%`;
  todayStars.textContent = `${getTodayStars()} / 3 ⭐`;
  missionTitle.textContent = `完成 ${state.sessionLength} 題拿 1 顆星`;
  sessionLengthInput.value = state.sessionLength;
  celebration.hidden = !todayComplete;
  completionMessage.textContent = todayComplete ? "今天任務已完成！明天再來拿星星。" : "";
  startButton.hidden = todayComplete;
  startButton.textContent = "開始練習";
  startButton.disabled = todayComplete;
  speakButton.hidden = true;
  nextButton.disabled = true;
  nextButton.textContent = "下一題";
}

function renderCompletionScreen() {
  const completedPracticeNumber = state.completedPracticeNumber || getTodayStars();
  choiceGrid.innerHTML = "";
  instruction.textContent = "";
  completionMessage.textContent = `恭喜完成第${ordinalText(completedPracticeNumber)}個練習`;
  celebration.hidden = false;
  startButton.hidden = getTodayStars() >= 3;
  startButton.textContent = getTodayStars() >= 3 ? "今天任務完成" : "開始下一個練習";
  startButton.disabled = getTodayStars() >= 3;
  speakButton.hidden = true;
  nextButton.disabled = true;
  nextButton.textContent = "下一題";
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
  roundLabel.textContent = `第 ${Math.min(state.practiced + 1, state.sessionLength)} / ${state.sessionLength} 題`;
  progressFill.style.width = `${Math.min((state.practiced / state.sessionLength) * 100, 100)}%`;
  todayStars.textContent = `${getTodayStars()} / 3 ⭐`;
  missionTitle.textContent = `完成 ${state.sessionLength} 題拿 1 顆星`;
  sessionLengthInput.value = state.sessionLength;
  renderWeekGrid();
  if (state.sessionComplete) {
    renderCompletionScreen();
  } else if (!state.sessionStarted) {
    renderStartScreen();
  } else {
    nextButton.textContent = "下一題";
  }
}

function renderWordList() {
  wordList.innerHTML = "";
  activeWords().forEach((word) => {
    const item = document.createElement("li");
    item.innerHTML = `<strong>${word.text}</strong>`;
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
      saveGroups();
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
  renderCourseSelectors();
}

function renderCourseSelectors() {
  practiceCourseSelect.innerHTML = "";
  state.groups.forEach((group, index) => {
    const option = document.createElement("option");
    option.value = String(index);
    option.textContent = group.name;
    option.selected = index === state.activeGroupIndex;
    practiceCourseSelect.append(option);
  });
}

function renderProfileManager() {
  profileTabs.innerHTML = "";
  state.profiles.forEach((profile) => {
    const button = document.createElement("button");
    button.className = `profile-tab${profile.id === state.activeProfileId ? " active" : ""}`;
    button.type = "button";
    button.textContent = profile.name;
    button.addEventListener("click", () => {
      state.activeProfileId = profile.id;
      saveProfiles();
      resetGame();
      renderProfileManager();
      renderProfileSelectors();
      renderWeekGrid();
    });
    profileTabs.append(button);
  });

  profileNameInput.value = activeProfile().name;
  deleteProfileButton.disabled = state.profiles.length <= 1;
}

function renderProfileSelectors() {
  [practiceProfileSelect, rewardProfileSelect].forEach((select) => {
    select.innerHTML = "";
    state.profiles.forEach((profile) => {
      const option = document.createElement("option");
      option.value = profile.id;
      option.textContent = profile.name;
      option.selected = profile.id === state.activeProfileId;
      select.append(option);
    });
  });
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

function saveCurrentProfile() {
  const profile = activeProfile();
  profile.name = profileNameInput.value.trim() || profile.name;
  saveProfiles();
  renderProfileManager();
  renderProfileSelectors();
  renderWeekGrid();
}

function addProfile() {
  const id = `child-${Date.now()}`;
  state.profiles.push({
    id,
    name: `小孩 ${state.profiles.length + 1}`,
    dailyStars: {},
  });
  state.activeProfileId = id;
  saveProfiles();
  resetGame();
  renderProfileManager();
  renderProfileSelectors();
  renderWeekGrid();
}

function deleteProfile() {
  if (state.profiles.length <= 1) return;

  const profile = activeProfile();
  const confirmed = window.confirm(`刪除「${profile.name}」和所有學習紀錄？`);
  if (!confirmed) return;

  const index = state.profiles.findIndex((profile) => profile.id === state.activeProfileId);
  state.profiles.splice(index, 1);
  state.activeProfileId = state.profiles[Math.max(0, index - 1)].id;
  saveProfiles();
  resetGame();
  renderProfileManager();
  renderProfileSelectors();
  renderWeekGrid();
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

function updateSessionLength() {
  state.sessionLength = clampSessionLength(sessionLengthInput.value);
  saveSessionLength();
  resetGame();
}

function selectProfile(profileId) {
  state.activeProfileId = profileId;
  saveProfiles();
  resetGame();
  renderProfileManager();
  renderProfileSelectors();
  renderWeekGrid();
}

function selectCourse(index) {
  state.activeGroupIndex = Math.min(Math.max(Number(index), 0), state.groups.length - 1);
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
  return activeProfile().dailyStars[dateKey(new Date())] || 0;
}

function addTodayStar() {
  if (getTodayStars() >= 3) return;

  const key = dateKey(new Date());
  const profile = activeProfile();
  profile.dailyStars[key] = Math.min((profile.dailyStars[key] || 0) + 1, 3);
  state.completedPracticeNumber = profile.dailyStars[key];
  saveProfiles();
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
  let totalStars = 0;

  labels.forEach((label, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = dateKey(date);
    const stars = activeProfile().dailyStars[key] || 0;
    totalStars += stars;
    const card = document.createElement("article");
    card.className = `day-card${stars >= 3 ? " complete" : ""}`;
    card.innerHTML = `
      <p class="day-name">週${label}</p>
      <div class="day-stars" aria-label="${stars} 顆星">
        ${[0, 1, 2].map((star) => `<span class="${star < stars ? "earned" : ""}">⭐</span>`).join("")}
      </div>
      <p class="day-status">${stars >= 3 ? "完成" : `${stars} / 3`}</p>
    `;
    weekGrid.append(card);
  });

  rewardTitle.textContent = `${activeProfile().name}的中文集點卡`;
  weekSummary.textContent = `本週 ${totalStars} / 21 ⭐`;
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
    if (state.practiced >= state.sessionLength) {
      addTodayStar();
      state.sessionComplete = true;
      state.sessionStarted = false;
    }
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
  if (!state.sessionStarted || state.sessionComplete) return;

  state.current = pickWord();
  state.answered = false;
  nextButton.disabled = true;
  renderStats();
  renderPrompt();
  renderChoices();
  speakCurrentWord();
}

function startPractice() {
  if (getTodayStars() >= 3) return;

  state.score = 0;
  state.practiced = 0;
  state.recentIndexes = [];
  state.sessionComplete = false;
  state.sessionStarted = true;
  startButton.disabled = false;
  nextRound();
}

function resetGame() {
  state.score = 0;
  state.practiced = 0;
  state.sessionComplete = false;
  state.sessionStarted = false;
  state.recentIndexes = [];
  renderStats();
}

navButtons.forEach((button) => {
  button.addEventListener("click", () => showPage(button.dataset.page));
});

practiceCourseSelect.addEventListener("change", () => selectCourse(practiceCourseSelect.value));
practiceProfileSelect.addEventListener("change", () => selectProfile(practiceProfileSelect.value));
rewardProfileSelect.addEventListener("change", () => selectProfile(rewardProfileSelect.value));
speakButton.addEventListener("click", () => playWordAudio(state.current));
startButton.addEventListener("click", startPractice);
nextButton.addEventListener("click", nextRound);
resetButton.addEventListener("click", resetGame);
addGroupButton.addEventListener("click", addGroup);
saveGroupButton.addEventListener("click", saveCurrentGroup);
deleteGroupButton.addEventListener("click", deleteGroup);
addProfileButton.addEventListener("click", addProfile);
saveProfileButton.addEventListener("click", saveCurrentProfile);
deleteProfileButton.addEventListener("click", deleteProfile);
sessionLengthInput.addEventListener("change", updateSessionLength);
soundToggle.addEventListener("click", () => {
  state.soundOn = !state.soundOn;
  soundToggle.textContent = state.soundOn ? "🔊" : "🔇";
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    showAuthMessage("已登入，正在同步資料...");
    loadCloudData(user).catch((error) => {
      console.warn("Cloud load failed", error);
      state.user = user;
      state.cloudReady = false;
      showAuthMessage(friendlyAuthError(error), true);
      renderAuth();
    });
    return;
  }

  state.user = null;
  state.cloudReady = false;
  renderAuth();
});

renderGroupManager();
renderProfileManager();
renderProfileSelectors();
renderWordList();
renderWeekGrid();
parentDetails.open = true;
renderAuth();
renderStats();
