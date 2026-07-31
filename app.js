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

const ALLOWED_EMAILS = ["yopllit@gmail.com", "myseofamily@gmail.com"];

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
const DEFAULT_DAILY_CAP = 3;
const MIN_DAILY_CAP = 1;
const MAX_DAILY_CAP = 10;

// Traditional -> Simplified map, scoped to this app's own interface
// vocabulary (not a general-purpose converter). Only app-authored copy
// is ever run through this — user-entered names/words/word-lists are
// shown exactly as typed, in whichever script the parent used.
const TRADITIONAL_TO_SIMPLIFIED = {
  來: "来", 佈: "布", 係: "系", 個: "个", 們: "们", 傳: "传", 儲: "储", 兩: "两",
  刪: "删", 則: "则", 剛: "刚", 動: "动", 區: "区", 嗎: "吗", 囉: "啰", 園: "园",
  媽: "妈", 學: "学", 帳: "账", 幾: "几", 後: "后", 從: "从", 復: "复", 愛: "爱",
  態: "态", 換: "换", 揮: "挥", 搖: "摇", 擇: "择", 擺: "摆", 敗: "败", 數: "数",
  於: "于", 書: "书", 會: "会", 樂: "乐", 樣: "样", 機: "机", 權: "权", 氣: "气",
  沒: "没", 減: "减", 滿: "满", 澆: "浇", 灑: "洒", 無: "无", 狀: "状", 甦: "苏",
  畫: "画", 發: "发", 睜: "睁", 確: "确", 種: "种", 稱: "称", 紀: "纪", 紛: "纷",
  細: "细", 組: "组", 結: "结", 給: "给", 經: "经", 綠: "绿", 綻: "绽", 練: "练",
  繼: "继", 繽: "缤", 續: "续", 習: "习", 聲: "声", 聽: "听", 與: "与", 葉: "叶",
  號: "号", 裝: "装", 裡: "里", 規: "规", 親: "亲", 覺: "觉", 覽: "览", 記: "记",
  設: "设", 詞: "词", 試: "试", 認: "认", 說: "说", 課: "课", 請: "请", 讓: "让",
  貓: "猫", 資: "资", 輕: "轻", 輪: "轮", 這: "这", 週: "周", 進: "进", 過: "过",
  達: "达", 選: "选", 還: "还", 錄: "录", 錯: "错", 鑽: "钻", 長: "长", 門: "门",
  閃: "闪", 開: "开", 關: "关", 陽: "阳", 險: "险", 雲: "云", 靜: "静", 響: "响",
  頁: "页", 項: "项", 順: "顺", 頭: "头", 顆: "颗", 題: "题", 風: "风", 麗: "丽",
  麼: "么", 點: "点", 體: "体",
};

const SCRIPT_STORAGE_KEY = "miffy-script";

function loadScript() {
  return localStorage.getItem(SCRIPT_STORAGE_KEY) === "hans" ? "hans" : "hant";
}

function toSimplified(text) {
  return String(text).replace(/[一-鿿]/g, (ch) => TRADITIONAL_TO_SIMPLIFIED[ch] || ch);
}

function t(text) {
  return state.script === "hans" ? toSimplified(text) : text;
}

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
  dailyCap: loadDailyCap(),
  script: loadScript(),
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
const leaderboardPanel = document.querySelector('[data-page-panel="leaderboard"]');
const saveGroupButton = document.querySelector("#save-group-button");
const deleteGroupButton = document.querySelector("#delete-group-button");
const groupNameInput = document.querySelector("#group-name");
const wordEditor = document.querySelector("#word-editor");
const weekGrid = document.querySelector("#week-grid");
const rewardTitle = document.querySelector("#reward-title");
const weekSummary = document.querySelector("#week-summary");
const leaderboardList = document.querySelector("#leaderboard-list");
const leaderboardEmpty = document.querySelector("#leaderboard-empty");
const practiceProfileSelect = document.querySelector("#practice-profile-select");
const rewardProfileSelect = document.querySelector("#reward-profile-select");
const gardensProfileSelect = document.querySelector("#gardens-profile-select");
const practiceCourseSelect = document.querySelector("#practice-course-select");
const addProfileButton = document.querySelector("#add-profile-button");
const saveProfileButton = document.querySelector("#save-profile-button");
const deleteProfileButton = document.querySelector("#delete-profile-button");
const profileNameInput = document.querySelector("#profile-name");

const settingsViews = document.querySelectorAll(".settings-view");
const settingsNavTriggers = document.querySelectorAll("[data-nav]");
const gardenerListEl = document.querySelector("#gardener-list");
const gardenerDetailTitle = document.querySelector("#gardener-detail-title");
const gardensByOwnerEl = document.querySelector("#gardens-by-owner");
const gardenDetailTitle = document.querySelector("#garden-detail-title");
const sessionLengthValue = document.querySelector("#session-length-value");
const sessionLengthMinus = document.querySelector("#session-length-minus");
const sessionLengthPlus = document.querySelector("#session-length-plus");
const maxFailsValue = document.querySelector("#max-fails-value");
const maxFailsMinus = document.querySelector("#max-fails-minus");
const maxFailsPlus = document.querySelector("#max-fails-plus");
const dailyCapValue = document.querySelector("#daily-cap-value");
const dailyCapMinus = document.querySelector("#daily-cap-minus");
const dailyCapPlus = document.querySelector("#daily-cap-plus");
const settingsGardenerCount = document.querySelector("#settings-gardener-count");
const settingsGardenCount = document.querySelector("#settings-garden-count");
const settingsRulesSummary = document.querySelector("#settings-rules-summary");
const settingsStarsSummary = document.querySelector("#settings-stars-summary");
const scriptToggleButton = document.querySelector("#script-toggle-button");
const scriptToggleValue = document.querySelector("#script-toggle-value");
const syncEmail = document.querySelector("#sync-email");
const syncStatusText = document.querySelector("#sync-status-text");
const syncStatusIcon = document.querySelector("#sync-status-icon");
const confirmOverlay = document.querySelector("#confirm-overlay");
const confirmTitle = document.querySelector("#confirm-title");
const confirmBody = document.querySelector("#confirm-body");
const confirmCancelButton = document.querySelector("#confirm-cancel");
const confirmConfirmButton = document.querySelector("#confirm-confirm");

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

function clampDailyCap(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return DEFAULT_DAILY_CAP;
  return Math.min(Math.max(Math.round(number), MIN_DAILY_CAP), MAX_DAILY_CAP);
}

function loadDailyCap() {
  return clampDailyCap(localStorage.getItem("miffy-daily-cap") || DEFAULT_DAILY_CAP);
}

function saveDailyCap() {
  const profile = activeProfile();
  profile.dailyCap = clampDailyCap(profile.dailyCap || state.dailyCap);
  state.dailyCap = profile.dailyCap;
  localStorage.setItem("miffy-daily-cap", String(state.dailyCap));
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
    existing.dailyCap = clampDailyCap(localProfile.dailyCap || existing.dailyCap);
    existing.activeGroupIndex = Math.min(existing.activeGroupIndex || 0, existing.groups.length - 1);
  });

  return merged;
}

function persistLocalOnly() {
  state.groups = activeGroups();
  state.activeGroupIndex = activeGroupIndex();
  state.sessionLength = activeSessionLength();
  state.maxFails = activeMaxFails();
  state.dailyCap = activeDailyCap();
  localStorage.setItem("miffy-word-groups", JSON.stringify(state.groups));
  localStorage.setItem("miffy-active-group", String(state.activeGroupIndex));
  localStorage.setItem("miffy-profiles", JSON.stringify(state.profiles));
  localStorage.setItem("miffy-active-profile", state.activeProfileId);
  localStorage.setItem("miffy-session-length", String(state.sessionLength));
  localStorage.setItem("miffy-max-fails", String(state.maxFails));
  localStorage.setItem("miffy-daily-cap", String(state.dailyCap));
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
      state.dailyCap = activeDailyCap();
      persistLocalOnly();
    }

    state.cloudReady = true;
    state.cloudLoading = false;
    await saveCloudData();
    resetGame();
    renderCourseSelectors();
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
  state.dailyCap = activeDailyCap();

  await setDoc(
    cloudDocRef,
    {
      groups: state.groups,
      activeGroupIndex: state.activeGroupIndex,
      profiles: state.profiles,
      activeProfileId: state.activeProfileId,
      sessionLength: state.sessionLength,
      maxFails: state.maxFails,
      dailyCap: state.dailyCap,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  ).catch((error) => {
    console.warn("Cloud save failed", error);
  });
}

function setAuthMessage(message) {
  authStatus.textContent = t(message);
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
            dailyCap: clampDailyCap(profile.dailyCap || loadDailyCap()),
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
    dailyCap: loadDailyCap(),
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
  profile.dailyCap = clampDailyCap(profile.dailyCap || state.dailyCap || DEFAULT_DAILY_CAP);
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

function activeDailyCap() {
  return activeProfile().dailyCap;
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
  // The answer is user-entered word content, never converted by t() —
  // convert the template first, then splice the untouched answer in.
  const template = pickFrom([
    "這顆種子需要多一點陽光，答案是「⟦ANSWER⟧」，我們澆下一顆吧！",
    "沒關係，園丁都是從練習中學會的。答案是「⟦ANSWER⟧」。",
  ]);
  return t(template).replace("⟦ANSWER⟧", answer);
}

function renderPrompt() {
  picturePrompt.hidden = true;
  characterPrompt.hidden = true;
  celebration.hidden = true;
  startButton.hidden = true;
  speakButton.hidden = false;

  instruction.textContent = t("仔細聽一聽，找出正在發芽的那個字吧！");
}

function ordinalText(number) {
  const labels = ["零", "一", "二", "三"];
  return labels[number] || String(number);
}

function renderStartScreen() {
  const todayComplete = getTodayStars() >= activeDailyCap();
  const sessionLength = activeSessionLength();
  choiceGrid.innerHTML = "";
  state.answered = false;
  state.current = null;
  instruction.textContent = t(
    todayComplete
      ? `今天的花園已經開滿花囉！要不要再種一顆，讓花園更繽紛？`
      : `今天想種下哪一顆種子呢？輕輕澆水，看看它會長成什麼樣子。`,
  );
  roundLabel.hidden = true;
  score.textContent = state.score;
  progressFill.style.width = `${Math.min((state.practiced / sessionLength) * 100, 100)}%`;
  celebration.hidden = true;
  completionMessage.textContent = "";
  startButton.hidden = false;
  startButton.textContent = t(todayComplete ? "🌸 再種一顆" : "🌱 種下今天的種子");
  startButton.disabled = false;
  speakButton.hidden = true;
  nextButton.disabled = true;
  nextButton.textContent = t("下一顆");
}

function renderCompletionScreen() {
  const completedPracticeNumber = state.completedPracticeNumber || getTodayStars();
  const todayComplete = getTodayStars() >= activeDailyCap();
  choiceGrid.innerHTML = "";
  instruction.textContent = "";
  roundLabel.hidden = true;
  confetti.hidden = !state.sessionPassed;
  completionMessage.textContent = t(
    !state.sessionPassed
      ? pickFrom(RETRY_ROUND_MESSAGES)
      : todayComplete
        ? "🌸 今天的花園已經開滿花囉！還能繼續探索更多花朵。"
        : pickFrom([`🌸 恭喜！今天第${ordinalText(completedPracticeNumber)}朵花盛開了，你的花園又更繽紛了一點。`, ...PASS_MESSAGES]),
  );
  celebration.hidden = false;
  startButton.hidden = false;
  startButton.textContent = t(state.sessionPassed ? (todayComplete ? "🌸 再種一顆" : "🌱 種下下一顆") : "🌦 再澆一次水");
  startButton.disabled = false;
  speakButton.hidden = true;
  nextButton.disabled = true;
  nextButton.textContent = t("下一顆");
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
  roundLabel.textContent = t(`第 ${Math.min(state.practiced + 1, sessionLength)} 顆種子 / 共 ${sessionLength} 顆`);
  progressFill.style.width = `${Math.min((state.practiced / sessionLength) * 100, 100)}%`;
  renderWeekGrid();
  if (state.sessionComplete) {
    renderCompletionScreen();
  } else if (!state.sessionStarted) {
    renderStartScreen();
  } else {
    roundLabel.hidden = false;
    nextButton.textContent = t("下一顆");
  }
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

function renderProfileSelectors() {
  [practiceProfileSelect, rewardProfileSelect, gardensProfileSelect].forEach((select) => {
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
  renderCourseSelectors();
  renderGardenDetailView();
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
  renderCourseSelectors();
}

function saveCurrentProfile() {
  const profile = activeProfile();
  profile.name = profileNameInput.value.trim() || profile.name;
  saveProfiles();
  renderProfileSelectors();
  renderWeekGrid();
  renderGardenerDetailView();
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
    dailyCap: DEFAULT_DAILY_CAP,
  });
  state.activeProfileId = id;
  saveProfiles();
  resetGame();
  renderProfileSelectors();
  renderCourseSelectors();
  renderWeekGrid();
  showSettingsView("gardener-detail");
}

function deleteProfile() {
  if (state.profiles.length <= 1) return;

  const index = state.profiles.findIndex((profile) => profile.id === state.activeProfileId);
  state.profiles.splice(index, 1);
  state.activeProfileId = state.profiles[Math.max(0, index - 1)].id;
  saveProfiles();
  resetGame();
  renderProfileSelectors();
  renderCourseSelectors();
  renderWeekGrid();
}

function requestDeleteProfile() {
  if (state.profiles.length <= 1) return;
  const profile = activeProfile();
  openConfirm({
    title: t("刪除「⟦NAME⟧」的花園？").replace("⟦NAME⟧", profile.name),
    body: t(`這會刪除⟦NAME⟧所有的花園（共 ${profile.groups.length} 座）、字詞和本週集點紀錄，而且無法復原。`).replace(
      "⟦NAME⟧",
      profile.name,
    ),
    onConfirm: () => {
      deleteProfile();
      showSettingsView("gardeners");
    },
  });
}

function deleteGroup() {
  const groups = activeGroups();
  if (groups.length <= 1) return;

  const index = activeGroupIndex();
  groups.splice(index, 1);
  setActiveGroupIndex(Math.max(0, index - 1));
  saveGroups();
  resetGame();
  renderCourseSelectors();
}

function requestDeleteGroup() {
  const groups = activeGroups();
  if (groups.length <= 1) return;
  const group = groups[activeGroupIndex()];
  openConfirm({
    title: t("刪除「⟦NAME⟧」花園？").replace("⟦NAME⟧", group.name),
    body: t(`這座花園裡的 ${group.words.length} 個字詞會一起消失，而且無法復原。`),
    onConfirm: () => {
      deleteGroup();
      showSettingsView("gardens");
    },
  });
}

function updateSessionLength(nextValue) {
  const profile = activeProfile();
  profile.sessionLength = clampSessionLength(nextValue);
  state.sessionLength = profile.sessionLength;
  saveSessionLength();
  resetGame();
  renderGrowingRulesView();
}

function updateMaxFails(nextValue) {
  const profile = activeProfile();
  profile.maxFails = clampMaxFails(nextValue);
  state.maxFails = profile.maxFails;
  saveMaxFails();
  resetGame();
  renderGrowingRulesView();
}

function updateDailyCap(nextValue) {
  const profile = activeProfile();
  profile.dailyCap = clampDailyCap(nextValue);
  state.dailyCap = profile.dailyCap;
  saveDailyCap();
  resetGame();
  renderStarsView();
}

function selectProfile(profileId) {
  state.activeProfileId = profileId;
  state.groups = activeGroups();
  state.activeGroupIndex = activeGroupIndex();
  state.sessionLength = activeSessionLength();
  saveProfiles();
  resetGame();
  renderProfileSelectors();
  renderCourseSelectors();
  renderWeekGrid();
}

function selectCourse(index) {
  setActiveGroupIndex(index);
  saveGroups();
  resetGame();
  renderCourseSelectors();
}

function createSettingsRow({ icon, tile, title, desc, value, onClick }) {
  const row = document.createElement("button");
  row.type = "button";
  row.className = "settings-row";

  const tileEl = document.createElement("span");
  tileEl.className = `settings-tile tile-${tile}`;
  tileEl.textContent = icon;
  row.append(tileEl);

  const textWrap = document.createElement("span");
  textWrap.className = "settings-row-text";

  const titleEl = document.createElement("span");
  titleEl.className = "settings-row-title";
  titleEl.textContent = title;
  textWrap.append(titleEl);

  if (desc) {
    const descEl = document.createElement("span");
    descEl.className = "settings-row-desc";
    descEl.textContent = desc;
    textWrap.append(descEl);
  }
  row.append(textWrap);

  if (value) {
    const valueEl = document.createElement("span");
    valueEl.className = "settings-row-value";
    valueEl.textContent = value;
    row.append(valueEl);
  }

  const chevron = document.createElement("span");
  chevron.className = "settings-chevron";
  chevron.setAttribute("aria-hidden", "true");
  chevron.textContent = "›";
  row.append(chevron);

  row.addEventListener("click", onClick);
  return row;
}

function totalGardenCount() {
  return state.profiles.reduce((sum, profile) => sum + (profile.groups?.length || 0), 0);
}

let currentSettingsView = "main";

function showSettingsView(view) {
  currentSettingsView = view;
  settingsViews.forEach((el) => {
    el.classList.toggle("active", el.dataset.settingsView === view);
  });
  if (view === "main") renderSettingsMain();
  else if (view === "gardeners") renderGardenersList();
  else if (view === "gardener-detail") renderGardenerDetailView();
  else if (view === "gardens") renderGardensList();
  else if (view === "garden-detail") renderGardenDetailView();
  else if (view === "rules") renderGrowingRulesView();
  else if (view === "stars") renderStarsView();
  else if (view === "sync") renderSyncView();
}

function renderSettingsMain() {
  settingsGardenerCount.textContent = t(`${state.profiles.length} 位園丁`);
  settingsGardenCount.textContent = t(`${totalGardenCount()} 座花園`);
  settingsRulesSummary.textContent = t(`${activeSessionLength()} 顆種子・可錯 ${activeMaxFails()} 次`);
  settingsStarsSummary.textContent = t(`每天 ${activeDailyCap()} 朵`);
}

function renderGardenersList() {
  gardenerListEl.innerHTML = "";
  state.profiles.forEach((profile) => {
    gardenerListEl.append(
      createSettingsRow({
        icon: "👧",
        tile: "green",
        title: profile.name,
        desc: t(`${profile.groups.length} 座花園`),
        onClick: () => {
          if (state.activeProfileId !== profile.id) selectProfile(profile.id);
          showSettingsView("gardener-detail");
        },
      }),
    );
  });
}

function renderGardenerDetailView() {
  const profile = activeProfile();
  gardenerDetailTitle.textContent = `👧 ${profile.name}`;
  profileNameInput.value = profile.name;
  deleteProfileButton.disabled = state.profiles.length <= 1;
}

function renderGardensList() {
  gardensProfileSelect.value = state.activeProfileId;

  const profile = activeProfile();
  gardensByOwnerEl.innerHTML = "";

  const card = document.createElement("div");
  card.className = "settings-card";
  profile.groups.forEach((group, index) => {
    card.append(
      createSettingsRow({
        icon: "🌷",
        tile: "gold",
        title: group.name,
        desc: t(`${group.words.length} 顆種子`),
        onClick: () => {
          setActiveGroupIndex(index);
          saveGroups();
          showSettingsView("garden-detail");
        },
      }),
    );
  });
  gardensByOwnerEl.append(card);

  if (profile.groups.length < 10) {
    const addCard = document.createElement("div");
    addCard.className = "settings-card settings-card-gap";
    addCard.append(
      createSettingsRow({
        icon: "＋",
        tile: "gold",
        title: t("開一座新花園"),
        onClick: () => {
          addGroup();
          showSettingsView("garden-detail");
        },
      }),
    );
    gardensByOwnerEl.append(addCard);
  }
}

function renderGardenDetailView() {
  const group = activeGroups()[activeGroupIndex()];
  gardenDetailTitle.textContent = `🌷 ${group.name}`;
  groupNameInput.value = group.name;
  wordEditor.value = group.words.map((word) => word.text).join("\n");
  deleteGroupButton.disabled = activeGroups().length <= 1;
}

function renderGrowingRulesView() {
  sessionLengthValue.textContent = activeSessionLength();
  maxFailsValue.textContent = activeMaxFails();
}

function renderStarsView() {
  dailyCapValue.textContent = activeDailyCap();
}

function renderSyncView() {
  syncEmail.textContent = auth.currentUser?.email || "-";
  syncStatusText.textContent = t(state.cloudLoading ? "同步中..." : state.cloudReady ? "已同步" : "本機模式");
  syncStatusIcon.textContent = state.cloudReady ? "✓" : state.cloudLoading ? "…" : "○";
}

const SCRIPT_EXCLUDED_TAGS = new Set(["INPUT", "TEXTAREA", "SELECT", "OPTION", "SCRIPT", "STYLE"]);
const SCRIPT_EXCLUDED_CONTAINER_SELECTOR =
  "#gardener-list, #gardens-by-owner, #leaderboard-list, #week-grid, #choice-grid";

function walkAndSnapshotScript(root) {
  if (!root) return;
  root.querySelectorAll("*").forEach((el) => {
    if (SCRIPT_EXCLUDED_TAGS.has(el.tagName)) return;
    if (el.closest(SCRIPT_EXCLUDED_CONTAINER_SELECTOR)) return;
    if (el.children.length > 0) return;
    if (el.dataset.hant) return;
    const text = el.textContent;
    if (!text || !/[一-鿿]/.test(text)) return;
    el.dataset.hant = text;
  });
}

function applyScriptToStatic() {
  document.querySelectorAll("[data-hant]").forEach((el) => {
    el.textContent = t(el.dataset.hant);
  });
}

function refreshDynamicScriptText() {
  renderStats();
  renderWeekGrid();
  showSettingsView(currentSettingsView);
  if (!leaderboardPanel.hidden) renderLeaderboard();
}

function applyScript(nextScript) {
  state.script = nextScript;
  localStorage.setItem(SCRIPT_STORAGE_KEY, nextScript);
  scriptToggleValue.textContent = state.script === "hans" ? "简体中文" : "繁體中文";
  applyScriptToStatic();
  refreshDynamicScriptText();
}

function toggleScript() {
  applyScript(state.script === "hans" ? "hant" : "hans");
}

let confirmAction = null;

function openConfirm({ title, body, onConfirm }) {
  confirmTitle.textContent = title;
  confirmBody.textContent = body;
  confirmAction = onConfirm;
  confirmOverlay.hidden = false;
}

function closeConfirm() {
  confirmOverlay.hidden = true;
  confirmAction = null;
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
  if (getTodayStars() >= activeDailyCap()) return;

  const key = dateKey(new Date());
  const profile = activeProfile();
  profile.dailyStars[key] = Math.min((profile.dailyStars[key] || 0) + 1, activeDailyCap());
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
  const cap = activeDailyCap();
  let totalStars = 0;

  labels.forEach((label, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = dateKey(date);
    const stars = activeProfile().dailyStars[key] || 0;
    totalStars += stars;
    const card = document.createElement("article");
    card.className = `day-card${stars >= cap ? " complete" : ""}`;
    card.innerHTML = `
      <p class="day-name">${t(`週${label}`)}</p>
      <div class="day-stars" aria-label="${t(`開了 ${stars} 朵花`)}">
        ${Array.from({ length: cap }, (_, star) => `<span class="${star < stars ? "earned" : ""}">🌸</span>`).join("")}
      </div>
      <p class="day-status">${stars >= cap ? t("盛開") : t(`${stars} / ${cap} 朵`)}</p>
    `;
    weekGrid.append(card);
  });

  rewardTitle.textContent = t("⟦NAME⟧的花園日記").replace("⟦NAME⟧", activeProfile().name);
  weekSummary.textContent = t(`這週你的花園開了 ${totalStars} 朵花🌸`);
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
  if (page === "parent") showSettingsView("main");
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
    name.textContent = `${entry.name || t("小園丁")}${t("的花園")}`;

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
    instruction.textContent = t(pickGrowthMessage());
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
      instruction.textContent = t(pickFrom(RETRY_MESSAGES));
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
gardensProfileSelect.addEventListener("change", () => {
  selectProfile(gardensProfileSelect.value);
  renderGardensList();
});
speakButton.addEventListener("click", () => playWordAudio(state.current));
startButton.addEventListener("click", startPractice);
nextButton.addEventListener("click", nextRound);
saveGroupButton.addEventListener("click", saveCurrentGroup);
deleteGroupButton.addEventListener("click", requestDeleteGroup);
addProfileButton.addEventListener("click", addProfile);
saveProfileButton.addEventListener("click", saveCurrentProfile);
deleteProfileButton.addEventListener("click", requestDeleteProfile);
googleSigninButton.addEventListener("click", googleSignIn);
logoutButton.addEventListener("click", () => signOut(auth));

settingsNavTriggers.forEach((el) => {
  el.addEventListener("click", () => showSettingsView(el.dataset.nav));
});
sessionLengthMinus.addEventListener("click", () => updateSessionLength(activeSessionLength() - 1));
sessionLengthPlus.addEventListener("click", () => updateSessionLength(activeSessionLength() + 1));
maxFailsMinus.addEventListener("click", () => updateMaxFails(activeMaxFails() - 1));
maxFailsPlus.addEventListener("click", () => updateMaxFails(activeMaxFails() + 1));
dailyCapMinus.addEventListener("click", () => updateDailyCap(activeDailyCap() - 1));
dailyCapPlus.addEventListener("click", () => updateDailyCap(activeDailyCap() + 1));
confirmCancelButton.addEventListener("click", closeConfirm);
confirmConfirmButton.addEventListener("click", () => {
  const action = confirmAction;
  closeConfirm();
  if (action) action();
});
scriptToggleButton.addEventListener("click", toggleScript);

walkAndSnapshotScript(document.querySelector("#auth-screen"));
walkAndSnapshotScript(document.querySelector("#app-shell"));
scriptToggleValue.textContent = state.script === "hans" ? "简体中文" : "繁體中文";
applyScriptToStatic();

renderCourseSelectors();
renderProfileSelectors();
renderWeekGrid();
renderStats();
