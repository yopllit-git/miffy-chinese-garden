import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import {
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDjXk4wdZWOi8CxX3Quz3eJLCN89UGeCsQ",
  authDomain: "miffy-chinese-garden.vercel.app",
  projectId: "miffy-chinese-garden",
  storageBucket: "miffy-chinese-garden.firebasestorage.app",
  messagingSenderId: "46399762559",
  appId: "1:46399762559:web:5464bd10ccb9e05fbb4f4a",
};

const ALLOWED_EMAILS = ["yopllit@gmail.com"];

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();
const LEGACY_FAMILY_DOC_ID = "miffy-chinese-garden";
const LEGACY_OWNER_EMAIL = "yopllit@gmail.com";
let cloudDocRef = null;
let currentUid = null;
const LEADERBOARD_LIMIT = 50;
const DEFAULT_SESSION_LENGTH = 15;
const MIN_SESSION_LENGTH = 5;
const MAX_SESSION_LENGTH = 30;
const MAX_ATTEMPTS_PER_WORD = 2;
const DEFAULT_MAX_FAILS = 3;
const MIN_MAX_FAILS = 1;
const MAX_MAX_FAILS = 10;

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
  wrongAttempts: 0,
  missed: 0,
  sessionComplete: false,
  sessionPassed: false,
  sessionStarted: false,
  completedPracticeNumber: 0,
  soundOn: true,
  recentIndexes: [],
  activeGroupIndex: loadActiveGroupIndex(),
  groups: loadGroups(),
  profiles: loadProfiles(),
  activeProfileId: loadActiveProfileId(),
  sessionLength: loadSessionLength(),
  maxFails: loadMaxFails(),
  cloudReady: false,
  cloudLoading: false,
};

const authScreen = document.querySelector("#auth-screen");
const appShell = document.querySelector("#app-shell");
const authLoading = document.querySelector("#auth-loading");
const authInteractive = document.querySelector("#auth-interactive");
const googleSigninButton = document.querySelector("#google-signin-button");
const authStatus = document.querySelector("#auth-status");
const logoutButton = document.querySelector("#logout-button");
const choiceGrid = document.querySelector("#choice-grid");
const instruction = document.querySelector("#instruction");
const picturePrompt = document.querySelector("#picture-prompt");
const characterPrompt = document.querySelector("#character-prompt");
const celebration = document.querySelector("#celebration");
const confetti = document.querySelector("#confetti");
const completionMessage = document.querySelector("#completion-message");
const startButton = document.querySelector("#start-button");
const speakButton = document.querySelector("#speak-button");
const nextButton = document.querySelector("#next-button");
const score = document.querySelector("#score");
const roundLabel = document.querySelector("#round-label");
const progressFill = document.querySelector("#progress-fill");
const navButtons = document.querySelectorAll(".nav-button");
const pagePanels = document.querySelectorAll(".app-page");
const groupTabs = document.querySelector("#group-tabs");
const addGroupButton = document.querySelector("#add-group-button");
const saveGroupButton = document.querySelector("#save-group-button");
const deleteGroupButton = document.querySelector("#delete-group-button");
const groupNameInput = document.querySelector("#group-name");
const wordEditor = document.querySelector("#word-editor");
const groupCount = document.querySelector("#group-count");
const weekGrid = document.querySelector("#week-grid");
const rewardTitle = document.querySelector("#reward-title");
const weekSummary = document.querySelector("#week-summary");
const leaderboardList = document.querySelector("#leaderboard-list");
const leaderboardEmpty = document.querySelector("#leaderboard-empty");
const practiceProfileSelect = document.querySelector("#practice-profile-select");
const rewardProfileSelect = document.querySelector("#reward-profile-select");
const practiceCourseSelect = document.querySelector("#practice-course-select");
const profileTabs = document.querySelector("#profile-tabs");
const addProfileButton = document.querySelector("#add-profile-button");
const saveProfileButton = document.querySelector("#save-profile-button");
const deleteProfileButton = document.querySelector("#delete-profile-button");
const profileNameInput = document.querySelector("#profile-name");
const sessionLengthInput = document.querySelector("#session-length");
const maxFailsInput = document.querySelector("#max-fails");
const settingsContext = document.querySelector("#settings-context");

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
  const profile = activeProfile();
  profile.groups = activeGroups();
  profile.activeGroupIndex = activeGroupIndex();
  state.groups = profile.groups;
  state.activeGroupIndex = profile.activeGroupIndex;
  persistLocalOnly();
  saveLocalData();
}

function loadActiveGroupIndex() {
  const stored = Number(localStorage.getItem("miffy-active-group"));
  return Number.isInteger(stored) && stored >= 0 ? stored : 0;
}

function loadProfiles() {
  try {
    const stored = JSON.parse(localStorage.getItem("miffy-profiles"));
    if (Array.isArray(stored) && stored.length) return normalizeProfiles(stored, {}, loadGroups());
  } catch {
  }

  let legacyStars = {};
  try {
    legacyStars = JSON.parse(localStorage.getItem("miffy-daily-stars") || "{}");
  } catch {
    legacyStars = {};
  }
  return normalizeProfiles([{ ...starterProfiles[0], dailyStars: legacyStars || {} }], {}, loadGroups());
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
  const profile = activeProfile();
  profile.sessionLength = clampSessionLength(profile.sessionLength || state.sessionLength);
  state.sessionLength = profile.sessionLength;
  localStorage.setItem("miffy-session-length", String(state.sessionLength));
  saveLocalData();
}

function clampMaxFails(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_MAX_FAILS;
  return Math.min(Math.max(Math.round(number), MIN_MAX_FAILS), MAX_MAX_FAILS);
}

function loadMaxFails() {
  return clampMaxFails(localStorage.getItem("miffy-max-fails") || DEFAULT_MAX_FAILS);
}

function saveMaxFails() {
  const profile = activeProfile();
  profile.maxFails = clampMaxFails(profile.maxFails || state.maxFails);
  state.maxFails = profile.maxFails;
  localStorage.setItem("miffy-max-fails", String(state.maxFails));
  saveLocalData();
}

function saveProfiles() {
  const profile = activeProfile();
  profile.groups = activeGroups();
  profile.activeGroupIndex = activeGroupIndex();
  localStorage.setItem("miffy-profiles", JSON.stringify(state.profiles));
  localStorage.setItem("miffy-active-profile", state.activeProfileId);
  saveLocalData();
}

function saveLocalData() {
  persistLocalOnly();
  saveCloudData();
}

function normalizeGroups(groups) {
  if (!Array.isArray(groups) || groups.length === 0) return starterGroups;
  return groups.slice(0, 10).map((group, index) => ({
    name: group.name || `第 ${index + 1} 組`,
    words: normalizeWords(group.words),
  }));
}

function groupSignature(group) {
  return `${group.name}:${group.words.map((word) => word.text).join("|")}`;
}

function mergeGroups(localGroups, cloudGroups) {
  const merged = normalizeGroups(cloudGroups);
  const signatures = new Set(merged.map(groupSignature));

  normalizeGroups(localGroups).forEach((group) => {
    const signature = groupSignature(group);
    if (signatures.has(signature) || merged.length >= 10) return;
    signatures.add(signature);
    merged.push(group);
  });

  return merged;
}

function mergeDailyStars(localStars = {}, cloudStars = {}) {
  const merged = { ...cloudStars };
  Object.entries(localStars).forEach(([key, value]) => {
    merged[key] = Math.max(Number(value) || 0, Number(merged[key]) || 0);
  });
  return merged;
}

function mergeProfiles(localProfiles, cloudProfiles, legacyStars = {}, fallbackGroups = null) {
  const merged = normalizeProfiles(cloudProfiles, legacyStars, fallbackGroups);

  normalizeProfiles(localProfiles, {}, fallbackGroups).forEach((localProfile) => {
    const existing = merged.find((profile) => profile.id === localProfile.id);
    if (!existing) {
      merged.push(localProfile);
      return;
    }
    existing.dailyStars = mergeDailyStars(localProfile.dailyStars, existing.dailyStars);
    existing.groups = mergeGroups(localProfile.groups, existing.groups);
    existing.sessionLength = clampSessionLength(localProfile.sessionLength || existing.sessionLength);
    existing.maxFails = clampMaxFails(localProfile.maxFails || existing.maxFails);
    existing.activeGroupIndex = Math.min(existing.activeGroupIndex || 0, existing.groups.length - 1);
  });

  return merged;
}

function persistLocalOnly() {
  state.groups = activeGroups();
  state.activeGroupIndex = activeGroupIndex();
  state.sessionLength = activeSessionLength();
  state.maxFails = activeMaxFails();
  localStorage.setItem("miffy-word-groups", JSON.stringify(state.groups));
  localStorage.setItem("miffy-active-group", String(state.activeGroupIndex));
  localStorage.setItem("miffy-profiles", JSON.stringify(state.profiles));
  localStorage.setItem("miffy-active-profile", state.activeProfileId);
  localStorage.setItem("miffy-session-length", String(state.sessionLength));
  localStorage.setItem("miffy-max-fails", String(state.maxFails));
}

async function loadCloudData() {
  state.cloudLoading = true;

  try {
    const snapshot = await getDoc(cloudDocRef);
    if (snapshot.exists()) {
      const data = snapshot.data();
      const fallbackGroups = mergeGroups(state.groups, data.groups);
      state.profiles = mergeProfiles(state.profiles, data.profiles, data.dailyStars, fallbackGroups);
      state.activeProfileId = state.profiles.some((profile) => profile.id === state.activeProfileId)
        ? state.activeProfileId
        : data.activeProfileId || state.profiles[0].id;
      state.groups = activeGroups();
      state.activeGroupIndex = activeGroupIndex();
      state.sessionLength = activeSessionLength();
      state.maxFails = activeMaxFails();
      persistLocalOnly();
    }

    state.cloudReady = true;
    state.cloudLoading = false;
    await saveCloudData();
    resetGame();
    renderGroupManager();
    renderProfileManager();
    renderProfileSelectors();
    renderWeekGrid();
  } catch (error) {
    state.cloudReady = false;
    state.cloudLoading = false;
    console.warn("Cloud load failed", error);
  }
}

async function saveCloudData() {
  if (!state.cloudReady) return;

  state.groups = activeGroups();
  state.activeGroupIndex = activeGroupIndex();
  state.sessionLength = activeSessionLength();
  state.maxFails = activeMaxFails();

  await setDoc(
    cloudDocRef,
    {
      groups: state.groups,
      activeGroupIndex: state.activeGroupIndex,
      profiles: state.profiles,
      activeProfileId: state.activeProfileId,
      sessionLength: state.sessionLength,
      maxFails: state.maxFails,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  ).catch((error) => {
    console.warn("Cloud save failed", error);
  });
}

function setAuthMessage(message) {
  authStatus.textContent = message;
}

const SIGNIN_FLAG_KEY = "miffy-signing-in";
const SIGNIN_FLAG_MAX_AGE_MS = 20000;

function markSignInStarted() {
  localStorage.setItem(SIGNIN_FLAG_KEY, String(Date.now()));
}

function clearSignInFlag() {
  localStorage.removeItem(SIGNIN_FLAG_KEY);
}

function isSignInRecentlyStarted() {
  const startedAt = Number(localStorage.getItem(SIGNIN_FLAG_KEY));
  return Number.isFinite(startedAt) && Date.now() - startedAt < SIGNIN_FLAG_MAX_AGE_MS;
}

function showAuthLoading() {
  authScreen.hidden = false;
  appShell.hidden = true;
  authLoading.hidden = false;
  authInteractive.hidden = true;
}

function showAuthGate() {
  authScreen.hidden = false;
  appShell.hidden = true;
  authLoading.hidden = true;
  authInteractive.hidden = false;
  googleSigninButton.disabled = false;
}

function grantAccess() {
  authScreen.hidden = true;
  appShell.hidden = false;
}

async function googleSignIn() {
  googleSigninButton.disabled = true;
  setAuthMessage("登入中...");
  markSignInStarted();
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.warn("Sign-in failed", error);
    clearSignInFlag();
    setAuthMessage("登入失敗，請重試");
    showAuthGate();
  }
}

async function migrateLegacyDataIfNeeded(user) {
  if (user.email !== LEGACY_OWNER_EMAIL) return;

  try {
    const existing = await getDoc(cloudDocRef);
    if (existing.exists()) return;

    const legacyRef = doc(db, "families", LEGACY_FAMILY_DOC_ID);
    const legacySnap = await getDoc(legacyRef);
    if (!legacySnap.exists()) return;

    await setDoc(cloudDocRef, { ...legacySnap.data(), updatedAt: serverTimestamp() });
  } catch (error) {
    console.warn("Legacy data migration failed", error);
  }
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    if (isSignInRecentlyStarted()) {
      showAuthLoading();
      return;
    }
    showAuthGate();
    return;
  }
  clearSignInFlag();
  if (!ALLOWED_EMAILS.includes(user.email)) {
    await signOut(auth);
    setAuthMessage("此帳號沒有存取權限");
    showAuthGate();
    return;
  }
  currentUid = user.uid;
  cloudDocRef = doc(db, "families", currentUid);
  grantAccess();
  await migrateLegacyDataIfNeeded(user);
  loadCloudData();
});

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

function normalizeProfiles(profiles, legacyStars = {}, fallbackGroups = null) {
  const cleaned = Array.isArray(profiles)
    ? profiles
        .map((profile, index) => {
          const groups = normalizeGroups(profile.groups || fallbackGroups || starterGroups);
          return {
            id: String(profile.id || `child-${index + 1}`).trim(),
            name: String(profile.name || `小園丁 ${index + 1}`).trim(),
            dailyStars: profile.dailyStars || {},
            groups,
            activeGroupIndex: Math.min(Math.max(Number(profile.activeGroupIndex) || 0, 0), groups.length - 1),
            sessionLength: clampSessionLength(profile.sessionLength || loadSessionLength()),
            maxFails: clampMaxFails(profile.maxFails || loadMaxFails()),
          };
        })
        .filter((profile) => profile.id && profile.name)
    : [];

  if (cleaned.length) return cleaned;

  const groups = normalizeGroups(fallbackGroups || starterGroups);
  return [{
    ...starterProfiles[0],
    dailyStars: legacyStars || {},
    groups,
    activeGroupIndex: 0,
    sessionLength: loadSessionLength(),
    maxFails: loadMaxFails(),
  }];
}

function activeWords() {
  return activeGroups()[activeGroupIndex()]?.words || defaultWords;
}

function activeProfile() {
  let profile = state.profiles.find((item) => item.id === state.activeProfileId);
  if (!profile) {
    profile = state.profiles[0] || starterProfiles[0];
    state.activeProfileId = profile.id;
  }
  if (!profile.groups) profile.groups = normalizeGroups(state.groups || starterGroups);
  profile.activeGroupIndex = Math.min(Math.max(Number(profile.activeGroupIndex) || 0, 0), profile.groups.length - 1);
  profile.sessionLength = clampSessionLength(profile.sessionLength || state.sessionLength || DEFAULT_SESSION_LENGTH);
  profile.maxFails = clampMaxFails(profile.maxFails || state.maxFails || DEFAULT_MAX_FAILS);
  return profile;
}

function activeGroups() {
  return activeProfile().groups;
}

function activeGroupIndex() {
  return activeProfile().activeGroupIndex || 0;
}

function setActiveGroupIndex(index) {
  const profile = activeProfile();
  profile.activeGroupIndex = Math.min(Math.max(Number(index), 0), activeGroups().length - 1);
  state.activeGroupIndex = profile.activeGroupIndex;
}

function activeSessionLength() {
  return activeProfile().sessionLength;
}

function activeMaxFails() {
  return activeProfile().maxFails;
}

function renderSettingsContext() {
  const profile = activeProfile();
  const courseName = activeGroups()[activeGroupIndex()]?.name || "";
  settingsContext.textContent = `${profile.name} · ${courseName}`;
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

const GROWTH_STAGE_MESSAGES = [
  ["🌱 種子偷偷睜開了眼睛。", "🌱 小種子動了一下，好像在說「你好」。", "🌱 土壤裡傳來一點點動靜⋯⋯種子醒了！", "🌱 種子感覺到你的澆水，輕輕地甦醒了。"],
  ["🌿 一根嫩綠的小芽鑽出了泥土。", "🌿 芽尖朝著陽光，悄悄地探出頭來。", "🌿 你看！小芽已經比剛才高了一點點。", "🌿 嫩芽輕輕搖擺，像在跟你揮手。"],
  ["🍃 兩片翠綠的葉子舒展開來。", "🍃 微風吹過，葉子沙沙作響，像在唱歌。", "🍃 葉子裡流動著滿滿的元氣。", "🍃 葉子越長越茂盛，快要遮住陽光了！"],
  ["🌼 一顆小小的花苞悄悄鼓了起來。", "🌼 花苞害羞地藏在葉子後面，快要忍不住了。", "🌼 再等一下下，花苞就要打開囉！", "🌼 你能感覺到嗎？花朵就要綻放了。"],
  ["🌸 花朵「啵」的一聲，綻放了！", "🌸 好美的一朵花！你做到了。", "🌸 陽光灑在花瓣上，閃閃發光。", "🌸 這朵花，是你親手種出來的。"],
];
const RETRY_MESSAGES = ["再仔細看看，你可以的！", "沒關係，再靠近一點點試試看。", "種子還在等你找到它，再試一次！"];
const PASS_MESSAGES = [
  "🌸 你做到了！陽光灑落，一朵新的花在花園裡綻放。",
  "🌸 今天的種子順利長成了美麗的花朵，你是最棒的小園丁！",
  "🌸 花園裡又多了一份色彩，這都是你細心澆水的結果。",
  "🌸 微風輕輕吹過你的花園，新開的花朵正在跳舞呢！",
];
const RETRY_ROUND_MESSAGES = [
  "🌦 今天的種子需要多一點陽光才能開花，我們明天再試一次吧！",
  "🌦 沒關係，有些種子要澆更多次水才會綻放。咪菲會一直陪著你！",
  "🌦 這次種子還在努力生長，再澆一次水，它一定會開花的！",
];
let lastGrowthMessage = "";

function pickFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function pickGrowthMessage() {
  const ratio = state.practiced / activeSessionLength();
  const stageIndex = ratio > 0.85 ? 4 : ratio > 0.6 ? 3 : ratio > 0.4 ? 2 : ratio > 0.2 ? 1 : 0;
  const pool = GROWTH_STAGE_MESSAGES[stageIndex].filter((message) => message !== lastGrowthMessage);
  const message = pickFrom(pool.length ? pool : GROWTH_STAGE_MESSAGES[stageIndex]);
  lastGrowthMessage = message;
  return message;
}

function pickRevealMessage(answer) {
  return pickFrom([
    `這顆種子需要多一點陽光，答案是「${answer}」，我們澆下一顆吧！`,
    `沒關係，園丁都是從練習中學會的。答案是「${answer}」。`,
  ]);
}

function renderPrompt() {
  picturePrompt.hidden = true;
  characterPrompt.hidden = true;
  celebration.hidden = true;
  startButton.hidden = true;
  speakButton.hidden = false;

  instruction.textContent = "仔細聽一聽，找出正在發芽的那個字吧！";
}

function ordinalText(number) {
  const labels = ["零", "一", "二", "三"];
  return labels[number] || String(number);
}

function renderStartScreen() {
  const todayComplete = getTodayStars() >= 3;
  const sessionLength = activeSessionLength();
  choiceGrid.innerHTML = "";
  state.answered = false;
  state.current = null;
  instruction.textContent = todayComplete
    ? `今天的花園已經開滿花囉！要不要再種一顆，讓花園更繽紛？`
    : `今天想種下哪一顆種子呢？輕輕澆水，看看它會長成什麼樣子。`;
  roundLabel.textContent = todayComplete ? "花園已盛開" : "花園在等你";
  score.textContent = state.score;
  progressFill.style.width = `${Math.min((state.practiced / sessionLength) * 100, 100)}%`;
  sessionLengthInput.value = sessionLength;
  maxFailsInput.value = activeMaxFails();
  celebration.hidden = true;
  completionMessage.textContent = "";
  startButton.hidden = false;
  startButton.textContent = todayComplete ? "🌸 再種一顆" : "🌱 種下今天的種子";
  startButton.disabled = false;
  speakButton.hidden = true;
  nextButton.disabled = true;
  nextButton.textContent = "下一顆";
}

function renderCompletionScreen() {
  const completedPracticeNumber = state.completedPracticeNumber || getTodayStars();
  const todayComplete = getTodayStars() >= 3;
  choiceGrid.innerHTML = "";
  instruction.textContent = "";
  confetti.hidden = !state.sessionPassed;
  completionMessage.textContent = !state.sessionPassed
    ? pickFrom(RETRY_ROUND_MESSAGES)
    : todayComplete
      ? "🌸 今天的花園已經開滿花囉！還能繼續探索更多花朵。"
      : pickFrom([`🌸 恭喜！今天第${ordinalText(completedPracticeNumber)}朵花盛開了，你的花園又更繽紛了一點。`, ...PASS_MESSAGES]);
  celebration.hidden = false;
  startButton.hidden = false;
  startButton.textContent = state.sessionPassed ? (todayComplete ? "🌸 再種一顆" : "🌱 種下下一顆") : "🌦 再澆一次水";
  startButton.disabled = false;
  speakButton.hidden = true;
  nextButton.disabled = true;
  nextButton.textContent = "下一顆";
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
  const sessionLength = activeSessionLength();
  score.textContent = state.score;
  roundLabel.textContent = `第 ${Math.min(state.practiced + 1, sessionLength)} 顆種子 / 共 ${sessionLength} 顆`;
  progressFill.style.width = `${Math.min((state.practiced / sessionLength) * 100, 100)}%`;
  sessionLengthInput.value = sessionLength;
  maxFailsInput.value = activeMaxFails();
  renderSettingsContext();
  renderWeekGrid();
  if (state.sessionComplete) {
    renderCompletionScreen();
  } else if (!state.sessionStarted) {
    renderStartScreen();
  } else {
    nextButton.textContent = "下一顆";
  }
}

function renderGroupManager() {
  const groups = activeGroups();
  const index = activeGroupIndex();
  groupTabs.innerHTML = "";
  groups.forEach((group, groupIndex) => {
    const option = document.createElement("option");
    option.value = String(groupIndex);
    option.textContent = group.name;
    option.selected = groupIndex === index;
    groupTabs.append(option);
  });

  const activeGroup = groups[index];
  groupNameInput.value = activeGroup.name;
  wordEditor.value = activeGroup.words.map((word) => word.text).join("\n");

  addGroupButton.disabled = groups.length >= 10;
  deleteGroupButton.disabled = groups.length <= 1;
  groupCount.textContent = `${groups.length} / 10`;
  renderCourseSelectors();
}

function renderCourseSelectors() {
  const groups = activeGroups();
  const index = activeGroupIndex();
  practiceCourseSelect.innerHTML = "";
  groups.forEach((group, groupIndex) => {
    const option = document.createElement("option");
    option.value = String(groupIndex);
    option.textContent = group.name;
    option.selected = groupIndex === index;
    practiceCourseSelect.append(option);
  });
}

function renderProfileManager() {
  profileTabs.innerHTML = "";
  state.profiles.forEach((profile) => {
    const option = document.createElement("option");
    option.value = profile.id;
    option.textContent = profile.name;
    option.selected = profile.id === state.activeProfileId;
    profileTabs.append(option);
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

  const groups = activeGroups();
  groups[activeGroupIndex()] = {
    name: groupNameInput.value.trim() || `第 ${activeGroupIndex() + 1} 組`,
    words,
  };
  saveGroups();
  resetGame();
  renderGroupManager();
}

function addGroup() {
  const groups = activeGroups();
  if (groups.length >= 10) return;

  groups.push({
    name: `第 ${groups.length + 1} 組`,
    words: [withAudio({ text: "新字", meaning: "新字", emoji: "🌟" })],
  });
  setActiveGroupIndex(groups.length - 1);
  saveGroups();
  resetGame();
  renderGroupManager();
}

function saveCurrentProfile() {
  const profile = activeProfile();
  profile.name = profileNameInput.value.trim() || profile.name;
  saveProfiles();
  renderProfileManager();
  renderProfileSelectors();
  renderWeekGrid();
  renderGroupManager();
}

function addProfile() {
  const id = `child-${Date.now()}`;
  state.profiles.push({
    id,
    name: `小園丁 ${state.profiles.length + 1}`,
    dailyStars: {},
    groups: normalizeGroups(starterGroups),
    activeGroupIndex: 0,
    sessionLength: DEFAULT_SESSION_LENGTH,
    maxFails: DEFAULT_MAX_FAILS,
  });
  state.activeProfileId = id;
  saveProfiles();
  resetGame();
  renderProfileManager();
  renderProfileSelectors();
  renderWeekGrid();
  renderGroupManager();
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
  const groups = activeGroups();
  if (groups.length <= 1) return;

  const index = activeGroupIndex();
  groups.splice(index, 1);
  setActiveGroupIndex(Math.max(0, index - 1));
  saveGroups();
  resetGame();
  renderGroupManager();
}

function updateSessionLength() {
  const profile = activeProfile();
  profile.sessionLength = clampSessionLength(sessionLengthInput.value);
  state.sessionLength = profile.sessionLength;
  saveSessionLength();
  resetGame();
}

function updateMaxFails() {
  const profile = activeProfile();
  profile.maxFails = clampMaxFails(maxFailsInput.value);
  state.maxFails = profile.maxFails;
  saveMaxFails();
  resetGame();
}

function selectProfile(profileId) {
  state.activeProfileId = profileId;
  state.groups = activeGroups();
  state.activeGroupIndex = activeGroupIndex();
  state.sessionLength = activeSessionLength();
  saveProfiles();
  resetGame();
  renderProfileManager();
  renderProfileSelectors();
  renderWeekGrid();
  renderGroupManager();
}

function selectCourse(index) {
  setActiveGroupIndex(index);
  saveGroups();
  resetGame();
  renderGroupManager();
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
      <div class="day-stars" aria-label="開了 ${stars} 朵花">
        ${[0, 1, 2].map((star) => `<span class="${star < stars ? "earned" : ""}">🌸</span>`).join("")}
      </div>
      <p class="day-status">${stars >= 3 ? "盛開" : `${stars} / 3 朵`}</p>
    `;
    weekGrid.append(card);
  });

  rewardTitle.textContent = `${activeProfile().name}的花園日記`;
  weekSummary.textContent = `這週你的花園開了 ${totalStars} 朵花🌸`;
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
  if (page === "leaderboard") renderLeaderboard();
}

async function awardLeaderboardPoint() {
  if (!state.cloudReady || !cloudDocRef || !currentUid) return;

  const profile = activeProfile();
  const entryRef = doc(db, "families", currentUid, "leaderboard", profile.id);
  try {
    await setDoc(
      entryRef,
      { name: profile.name, points: increment(1), updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch (error) {
    console.warn("Leaderboard update failed", error);
  }
}

async function renderLeaderboard() {
  let entries = [];
  try {
    const snapshot = await getDocs(
      query(collectionGroup(db, "leaderboard"), orderBy("points", "desc"), limit(LEADERBOARD_LIMIT)),
    );
    entries = snapshot.docs.map((entrySnap) => entrySnap.data());
  } catch (error) {
    console.warn("Leaderboard load failed", error);
  }

  leaderboardList.innerHTML = "";

  if (!entries.length) {
    leaderboardEmpty.hidden = false;
    return;
  }

  leaderboardEmpty.hidden = true;

  entries.forEach((entry, index) => {
    const item = document.createElement("li");
    item.className = `leaderboard-item${index < 3 ? " top-rank" : ""}`;

    const rank = document.createElement("span");
    rank.className = "leaderboard-rank";
    rank.textContent = String(index + 1);

    const name = document.createElement("p");
    name.className = "leaderboard-name";
    name.textContent = `${entry.name || "小園丁"}的花園`;

    const points = document.createElement("span");
    points.className = "leaderboard-points";
    points.textContent = `🌸 x ${entry.points || 0}`;

    item.append(rank, name, points);
    leaderboardList.append(item);
  });
}

function revealCorrectChoice() {
  choiceGrid.querySelectorAll(".choice-button").forEach((choiceButton) => {
    choiceButton.disabled = true;
    if (choiceButton.textContent === state.current.text) {
      choiceButton.classList.add("correct");
    }
  });
}

function finishRound() {
  state.answered = true;
  state.practiced += 1;
  if (state.practiced >= activeSessionLength()) {
    state.sessionPassed = state.missed <= activeMaxFails();
    if (state.sessionPassed) {
      addTodayStar();
      awardLeaderboardPoint();
    }
    state.sessionComplete = true;
    state.sessionStarted = false;
  } else {
    nextButton.disabled = false;
  }
}

function handleAnswer(button, selected) {
  if (state.answered) return;

  const isCorrect = selected.text === state.current.text;

  if (isCorrect) {
    state.score += 1;
    button.classList.add("correct");
    playCorrectFeedback();
    finishRound();
    instruction.textContent = pickGrowthMessage();
  } else {
    button.classList.add("wrong");
    button.disabled = true;
    state.wrongAttempts += 1;
    playWordAudio(state.current);

    if (state.wrongAttempts >= MAX_ATTEMPTS_PER_WORD) {
      state.missed += 1;
      revealCorrectChoice();
      finishRound();
      instruction.textContent = pickRevealMessage(state.current.text);
    } else {
      instruction.textContent = pickFrom(RETRY_MESSAGES);
    }
  }

  renderStats();
}

function nextRound() {
  if (!state.sessionStarted || state.sessionComplete) return;

  state.current = pickWord();
  state.answered = false;
  state.wrongAttempts = 0;
  nextButton.disabled = true;
  renderStats();
  renderPrompt();
  renderChoices();
  speakCurrentWord();
}

function startPractice() {
  state.score = 0;
  state.practiced = 0;
  state.missed = 0;
  state.sessionPassed = false;
  state.recentIndexes = [];
  state.sessionComplete = false;
  state.sessionStarted = true;
  startButton.disabled = false;
  nextRound();
}

function resetGame() {
  state.score = 0;
  state.practiced = 0;
  state.missed = 0;
  state.sessionPassed = false;
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
groupTabs.addEventListener("change", () => selectCourse(groupTabs.value));
profileTabs.addEventListener("change", () => selectProfile(profileTabs.value));
speakButton.addEventListener("click", () => playWordAudio(state.current));
startButton.addEventListener("click", startPractice);
nextButton.addEventListener("click", nextRound);
addGroupButton.addEventListener("click", addGroup);
saveGroupButton.addEventListener("click", saveCurrentGroup);
deleteGroupButton.addEventListener("click", deleteGroup);
addProfileButton.addEventListener("click", addProfile);
saveProfileButton.addEventListener("click", saveCurrentProfile);
deleteProfileButton.addEventListener("click", deleteProfile);
sessionLengthInput.addEventListener("change", updateSessionLength);
maxFailsInput.addEventListener("change", updateMaxFails);
googleSigninButton.addEventListener("click", googleSignIn);
logoutButton.addEventListener("click", () => signOut(auth));

renderGroupManager();
renderProfileManager();
renderProfileSelectors();
renderWeekGrid();
renderStats();
