/* ============================================================
   APP.JS — screen routing + interactions
   Vanilla JS, no framework, no build step.
   ============================================================ */

/* ============================================================
   ACCESSIBILITY: prefers-reduced-motion
   Checked once; used to skip staggered reveals, ambient generation,
   and confetti/balloon bursts. CSS also has a blanket override for
   any animation this JS doesn't explicitly gate.
   ============================================================ */
function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

const state = {
  visited: { message: false, memories: false, cake: false, adore: false, prediction: false },
  mysteryOpened: false,
  musicStarted: false,
  currentWish: "",
};

const REQUIRED = ["message", "memories", "cake", "adore", "prediction"];

/* ---------- screen navigation ---------- */
function shiftBackground() {
  const x = (Math.random() * 16 - 8).toFixed(1);
  const y = (Math.random() * 16 - 8).toFixed(1);
  document.body.style.backgroundPosition = `${x}px ${y}px`;
}

function showScreen(id) {
  const next = document.getElementById("screen-" + id);
  if (!next) return;
  const current = [...document.querySelectorAll(".screen")].find(s => !s.classList.contains("hidden"));

  shiftBackground();

  if (!current || current === next || prefersReducedMotion()) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    next.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }

  current.classList.add("screen-out");
  setTimeout(() => {
    current.classList.add("hidden");
    current.classList.remove("screen-out");
    next.classList.remove("hidden");
    next.classList.add("screen-in");
    window.scrollTo({ top: 0, behavior: "auto" });
    requestAnimationFrame(() => {
      next.classList.add("screen-in-active");
    });
    setTimeout(() => {
      next.classList.remove("screen-in", "screen-in-active");
    }, 450);
  }, 260);
}

/* ---------- ambient floating hearts/stars ---------- */
function startAmbient() {
  if (prefersReducedMotion()) return;
  const layer = document.getElementById("ambient");
  const symbols = ["💗", "✨", "🎀", "⭐"];
  setInterval(() => {
    const el = document.createElement("div");
    el.className = "floaty";
    el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
    el.style.left = Math.random() * 100 + "vw";
    el.style.animationDuration = (8 + Math.random() * 6) + "s";
    el.style.fontSize = (14 + Math.random() * 14) + "px";
    layer.appendChild(el);
    setTimeout(() => el.remove(), 15000);
  }, 2200);
}

/* ---------- confetti + balloons ---------- */
const CONFETTI_COLORS = ["#F3C9D4", "#CBB8E6", "#F4B48A", "#E8B23E", "#3E2244"];
function burstConfetti(count = 60) {
  if (prefersReducedMotion()) return;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "confetti-piece";
    p.style.left = Math.random() * 100 + "vw";
    p.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    p.style.animationDuration = (2 + Math.random() * 1.5) + "s";
    p.style.transform = `rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 4000);
  }
}
function riseBalloons(count = 8) {
  if (prefersReducedMotion()) return;
  const emojis = ["🎈"];
  for (let i = 0; i < count; i++) {
    const b = document.createElement("div");
    b.className = "balloon";
    b.textContent = emojis[0];
    b.style.left = (5 + Math.random() * 90) + "vw";
    b.style.animationDuration = (5 + Math.random() * 3) + "s";
    b.style.filter = `hue-rotate(${Math.random() * 360}deg)`;
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 9000);
  }
}

/* ---------- sound effects ---------- */
const sfxCache = {};
function playSfx(name) {
  const src = CONTENT.sfx && CONTENT.sfx[name];
  if (!src) return; // no file configured — silently skip
  try {
    if (!sfxCache[name]) sfxCache[name] = new Audio(src);
    const audio = sfxCache[name].cloneNode();
    audio.volume = 0.55;
    audio.play().catch(() => {});
  } catch (e) { /* ignore playback errors */ }
}

/* ---------- music ---------- */
function startMusicIfAny() {
  if (state.musicStarted) return;
  if (!CONTENT.music.src) return;
  const audio = document.getElementById("bg-music");
  audio.src = CONTENT.music.src;
  audio.volume = 0.5;
  audio.play().catch(() => {});
  state.musicStarted = true;
}

/* ============================================================
   WISH OF THE VISIT
   A new message from CONTENT.wishes shows each time she opens the site.
   Uses a shuffled queue stored in localStorage so nothing repeats until
   every wish has been shown once, then it reshuffles automatically.
   Falls back to a plain random pick (no persistence) if localStorage
   is unavailable — e.g. private/incognito mode in some browsers.
   ============================================================ */
const WISH_QUEUE_KEY = "anuradha_wish_queue_v1";

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getNextWish() {
  const pool = CONTENT.wishes;
  if (!pool || pool.length === 0) return "";

  try {
    let queue = JSON.parse(localStorage.getItem(WISH_QUEUE_KEY) || "[]");
    if (!Array.isArray(queue) || queue.length === 0) {
      queue = shuffle([...Array(pool.length).keys()]);
    }
    const index = queue.shift();
    localStorage.setItem(WISH_QUEUE_KEY, JSON.stringify(queue));
    return pool[index];
  } catch (e) {
    // localStorage blocked — just pick something random, no memory of past picks.
    return pool[Math.floor(Math.random() * pool.length)];
  }
}

/* ============================================================
   0. GATE / COUNTDOWN
   Site is locked until CONTENT.gate.unlockAt, in fixed India Standard
   Time (UTC+5:30). The unlock check is based on REAL TIME FETCHED FROM
   THE INTERNET, not the visitor's device clock — so changing your
   system clock does not bypass the lock.

   How it works:
   1. On load, fetch the current time from a public time API.
   2. Compute serverOffsetMs = (network time) - (device time) once.
   3. From then on, "now" = Date.now() + serverOffsetMs. This stays
      accurate every second without re-fetching, because we're only
      using the device clock to measure ELAPSED time (which ticks
      normally even if someone changes the clock's displayed date —
      OS clock changes don't rewind a page's running timers), not to
      read an absolute "what time is it" value.
   4. If every time API fails (offline, blocked, API down), we fall
      back to the device clock rather than leaving the page stuck
      forever. This is a deliberate trade-off: a small hole for
      network failures, in exchange for the site never being
      permanently unusable if an API changes or goes down.
   ============================================================ */
let gateInterval = null;
let serverOffsetMs = 0; // (network time) - (device time), 0 until synced
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // IST = UTC+5:30, no DST

// Each provider returns an absolute UTC epoch in ms, or throws.
const TIME_PROVIDERS = [
  async () => {
    // time.now — confirmed working, same response shape as worldtimeapi.org.
    const res = await fetch("https://time.now/developer/api/timezone/Asia/Kolkata", { cache: "no-store" });
    if (!res.ok) throw new Error("time.now bad response");
    const data = await res.json();
    if (typeof data.unixtime !== "number") throw new Error("time.now missing unixtime");
    return data.unixtime * 1000;
  },
  async () => {
    // worldtimeapi.org — same schema, kept as a fallback (has had uptime issues).
    const res = await fetch("https://worldtimeapi.org/api/timezone/Asia/Kolkata", { cache: "no-store" });
    if (!res.ok) throw new Error("worldtimeapi bad response");
    const data = await res.json();
    if (typeof data.unixtime !== "number") throw new Error("worldtimeapi missing unixtime");
    return data.unixtime * 1000;
  },
  async () => {
    // timeapi.io — gives IST wall-clock fields, convert to UTC epoch.
    const res = await fetch("https://timeapi.io/api/Time/current/zone?timeZone=Asia/Kolkata", { cache: "no-store" });
    if (!res.ok) throw new Error("timeapi.io bad response");
    const d = await res.json();
    if (d.year == null) throw new Error("timeapi.io missing fields");
    return Date.UTC(d.year, d.month - 1, d.day, d.hour, d.minute, d.seconds || 0) - IST_OFFSET_MS;
  },
  async () => {
    // worldclockapi.com — gives UTC ISO string directly.
    const res = await fetch("http://worldclockapi.com/api/json/utc/now", { cache: "no-store" });
    if (!res.ok) throw new Error("worldclockapi bad response");
    const d = await res.json();
    if (!d.currentDateTime) throw new Error("worldclockapi missing field");
    return new Date(d.currentDateTime).getTime();
  },
];

async function syncNetworkTime() {
  for (const provider of TIME_PROVIDERS) {
    try {
      const before = Date.now();
      const networkEpoch = await provider();
      const after = Date.now();
      // Correct for request round-trip by using the midpoint device time.
      const deviceMidpoint = (before + after) / 2;
      serverOffsetMs = networkEpoch - deviceMidpoint;
      return true; // synced successfully
    } catch (e) {
      continue; // try next provider
    }
  }
  serverOffsetMs = 0; // all providers failed — fall back to device clock
  return false;
}

function nowMs() {
  return Date.now() + serverOffsetMs;
}

function getUnlockEpoch() {
  const [y, m, d, h, min] = CONTENT.gate.unlockAt;
  return Date.UTC(y, m, d, h, min, 0) - IST_OFFSET_MS;
}

function isUnlocked() {
  return nowMs() >= getUnlockEpoch();
}

function pad2(n) { return String(n).padStart(2, "0"); }

function transitionToEntranceWithWelcome() {
  const sub = document.getElementById("gate-sub");
  const reduced = prefersReducedMotion();
  sub.textContent = CONTENT.gate.afterUnlockHint;
  setTimeout(() => {
    sub.textContent = CONTENT.gate.welcomeLine;
  }, reduced ? 0 : 1000);
  setTimeout(() => {
    showScreen("entrance");
  }, reduced ? 0 : 2200);
}

function tickCountdown() {
  const diff = getUnlockEpoch() - nowMs();
  if (diff <= 0) {
    clearInterval(gateInterval);
    gateInterval = null;
    transitionToEntranceWithWelcome();
    return;
  }
  const totalSec = Math.floor(diff / 1000);
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  document.getElementById("cd-days").textContent = pad2(days);
  document.getElementById("cd-hours").textContent = pad2(hours);
  document.getElementById("cd-mins").textContent = pad2(mins);
  document.getElementById("cd-secs").textContent = pad2(secs);
}

function initGate() {
  document.getElementById("gate-title").textContent = CONTENT.gate.title;
  document.getElementById("gate-sub").textContent = CONTENT.gate.sub;
  const labels = CONTENT.wishBanner.labels;
  document.getElementById("wish-label").textContent = labels[Math.floor(Math.random() * labels.length)];
  document.getElementById("wish-text").textContent = state.currentWish;
}

async function runGateCheck() {
  // Manual override: ?unlock=KEY in the URL bypasses the countdown entirely.
  // Use this only for yourself if the timer/network check ever breaks —
  // the normal shared link has no query param, so it stays locked for her.
  const params = new URLSearchParams(window.location.search);
  if (params.get(CONTENT.gate.skipParam) === CONTENT.gate.skipValue) {
    showScreen("entrance");
    return;
  }

  showScreen("gate");
  document.getElementById("gate-sub").textContent = "Checking the time...";
  document.getElementById("countdown-grid").style.visibility = "hidden";

  await syncNetworkTime();

  document.getElementById("countdown-grid").style.visibility = "visible";
  document.getElementById("gate-sub").textContent = CONTENT.gate.sub;

  if (isUnlocked()) {
    transitionToEntranceWithWelcome();
    return;
  }
  tickCountdown();
  gateInterval = setInterval(tickCountdown, 1000);

  // Re-sync every 5 minutes in case the first attempt silently fell back
  // to the device clock (e.g. a transient network blip) — this gives it
  // repeated chances to pick up real network time during the wait.
  setInterval(() => { if (gateInterval) syncNetworkTime(); }, 5 * 60 * 1000);
}

/* ============================================================
   1. ENTRANCE
   ============================================================ */
function initEntrance() {
  document.getElementById("entrance-whisper").textContent = CONTENT.entrance.whisper;
  document.getElementById("entrance-line").textContent = CONTENT.entrance.line;
  const btn = document.getElementById("entrance-btn");
  btn.textContent = CONTENT.entrance.button;
  btn.addEventListener("click", () => {
    startMusicIfAny();
    playSfx("envelope");
    const burst = document.getElementById("entrance-burst");
    burst.classList.add("pop");
    burstConfetti(40);
    setTimeout(() => {
      showScreen("loading");
      runLoadingSequence();
    }, 550);
  });
}

/* ============================================================
   2. LOADING
   ============================================================ */
function runLoadingSequence() {
  const list = document.getElementById("loading-checklist");
  list.innerHTML = "";
  document.getElementById("loading-title").textContent = CONTENT.loading.title;

  CONTENT.loading.steps.forEach((step) => {
    const li = document.createElement("li");
    li.innerHTML = `<span>${step}</span><span class="tick">✓</span>`;
    list.appendChild(li);
  });

  const items = list.querySelectorAll("li");
  const errorBox = document.getElementById("loading-error");
  errorBox.classList.remove("show");
  document.getElementById("loading-continue").classList.add("hidden");

  items.forEach((li, i) => {
    setTimeout(() => li.classList.add("show"), 500 + i * 550);
  });

  setTimeout(() => {
    document.getElementById("err-title").textContent = CONTENT.loading.error;
    document.getElementById("err-sub").textContent = CONTENT.loading.errorSub;
    errorBox.classList.add("show");
    const cbtn = document.getElementById("loading-continue");
    cbtn.textContent = CONTENT.loading.button;
    cbtn.classList.remove("hidden");
  }, 500 + items.length * 550 + 300);
}
function initLoading() {
  document.getElementById("loading-continue").addEventListener("click", () => {
    showScreen("reveal");
    runReveal();
  });
}

/* ============================================================
   3. REVEAL
   ============================================================ */
function runReveal() {
  const cake = document.querySelector("#screen-reveal .cake-emoji");
  cake.classList.remove("show");
  const wrap = document.getElementById("reveal-lines");
  wrap.innerHTML = "";
  const sub = document.getElementById("reveal-sub");
  sub.classList.remove("show");

  const reduced = prefersReducedMotion();
  const lineGap = reduced ? 0 : 650;
  const startDelay = reduced ? 0 : 500;

  setTimeout(() => cake.classList.add("show"), reduced ? 0 : 200);

  CONTENT.reveal.lines.forEach((line, i) => {
    const div = document.createElement("div");
    div.className = "reveal-line";
    div.textContent = line;
    wrap.appendChild(div);
    const isLast = i === CONTENT.reveal.lines.length - 1;
    setTimeout(() => {
      div.classList.add("show");
      if (isLast) {
        playSfx("reveal");
        burstConfetti(70);
        riseBalloons(10);
      }
    }, startDelay + i * lineGap);
  });

  const subDelay = startDelay + CONTENT.reveal.lines.length * lineGap + (reduced ? 0 : 400);
  sub.textContent = CONTENT.reveal.sub;
  setTimeout(() => sub.classList.add("show"), subDelay);
}
function initReveal() {
  const btn = document.getElementById("reveal-btn");
  btn.textContent = CONTENT.reveal.button;
  btn.addEventListener("click", () => {
    showScreen("dashboard");
    renderDashboard();
  });
}

/* ============================================================
   4. DASHBOARD
   ============================================================ */
function renderDashboard() {
  document.getElementById("dash-title").textContent = CONTENT.dashboard.title;
  document.getElementById("dash-subtitle").textContent = CONTENT.dashboard.subtitle;

  const grid = document.getElementById("dash-grid");
  const bonusBtn = document.getElementById("dash-bonus");
  const unlockCount = document.getElementById("unlock-count");
  const completion = document.getElementById("dash-completion");

  const allDone = allRequiredDone();

  if (allDone && !state.mysteryOpened) {
    grid.classList.add("hidden");
    bonusBtn.classList.add("hidden");
    unlockCount.classList.add("hidden");
    completion.classList.remove("hidden");
    renderProgressHearts();
    return;
  }

  grid.classList.remove("hidden");
  bonusBtn.classList.remove("hidden");
  unlockCount.classList.remove("hidden");
  completion.classList.add("hidden");

  grid.innerHTML = "";
  const doneRequired = REQUIRED.filter(id => state.visited[id]);
  const nextUpId = REQUIRED[doneRequired.length]; // undefined once all required are done

  CONTENT.dashboard.cards.forEach(card => {
    const btn = document.createElement("button");
    const isMystery = card.id === "mystery";
    const done = isMystery ? state.mysteryOpened : state.visited[card.id];

    let locked;
    if (isMystery) {
      locked = !allRequiredDone();
    } else {
      // Sequential unlock: a required card is locked unless everything
      // before it in REQUIRED has already been visited (or it's done itself).
      const reqIndex = REQUIRED.indexOf(card.id);
      const priorAllDone = REQUIRED.slice(0, reqIndex).every(id => state.visited[id]);
      locked = !done && !priorAllDone;
    }
    const isNextUp = !isMystery && card.id === nextUpId;

    btn.className = "dash-card btn--wiggle"
      + (done ? " done" : "")
      + (locked ? " locked" : "")
      + (isNextUp ? " next-up" : "");
    btn.dataset.cardId = card.id;
    btn.innerHTML = `<span class="icon">${card.icon}</span><span>${card.label}</span>`;
    btn.disabled = locked;
    btn.addEventListener("click", () => goToCard(card.id));
    grid.appendChild(btn);
  });

  bonusBtn.textContent = CONTENT.dashboard.bonus.icon + "  " + CONTENT.dashboard.bonus.label;
  bonusBtn.onclick = () => goToCard("quiz");

  const doneCount = REQUIRED.filter(k => state.visited[k]).length + (state.mysteryOpened ? 1 : 0);
  document.getElementById("unlock-count").textContent = `${doneCount} / 6 unlocked`;

  renderProgressHearts();
}

function allRequiredDone() {
  return REQUIRED.every(k => state.visited[k]);
}

function markVisited(id) {
  if (REQUIRED.includes(id)) {
    const wasVisited = state.visited[id];
    state.visited[id] = true;
    if (!wasVisited) playSfx("unlock");
  }
  renderProgressHearts();
}

function goToCard(id) {
  const routes = {
    message: () => { showScreen("message"); },
    memories: () => { showScreen("memories"); renderMemories(); },
    cake: () => { showScreen("cake"); resetCake(); },
    adore: () => { showScreen("adore"); renderAdore(); },
    prediction: () => { showScreen("prediction"); resetPrediction(); },
    mystery: () => { showScreen("mystery"); resetMystery(); },
    quiz: () => { showScreen("quiz"); resetQuiz(); },
  };
  if (routes[id]) routes[id]();
}

function backToDashboard() {
  showScreen("dashboard");
  renderDashboard();
}

function initDashCompletion() {
  document.getElementById("completion-gift").addEventListener("click", () => goToCard("mystery"));
}

/* ---------- secret interaction: triple-tap the bow ---------- */
let secretTapCount = 0;
let secretTapTimer = null;
function initSecret() {
  const bow = document.getElementById("secret-bow");
  bow.addEventListener("click", () => {
    secretTapCount++;
    bow.classList.remove("pulse");
    void bow.offsetWidth; // restart animation
    bow.classList.add("pulse");
    clearTimeout(secretTapTimer);
    secretTapTimer = setTimeout(() => { secretTapCount = 0; }, 1500);
    if (secretTapCount >= 3) {
      secretTapCount = 0;
      document.getElementById("secret-msg").textContent = CONTENT.secret.message;
      document.getElementById("secret-modal").classList.remove("hidden");
    }
  });
  document.getElementById("secret-close").addEventListener("click", () => {
    document.getElementById("secret-modal").classList.add("hidden");
  });
  document.getElementById("secret-modal").addEventListener("click", (e) => {
    if (e.target.id === "secret-modal") document.getElementById("secret-modal").classList.add("hidden");
  });
}

/* progress hearts (persistent widget, hidden on entrance/loading/reveal/final/ending) */
function renderProgressHearts() {
  const wrap = document.getElementById("progress-hearts");
  wrap.innerHTML = "";
  const total = 6;
  const filled = REQUIRED.filter(k => state.visited[k]).length + (state.mysteryOpened ? 1 : 0);
  for (let i = 0; i < total; i++) {
    const span = document.createElement("span");
    span.className = "heart-slot" + (i < filled ? " filled" : "");
    span.textContent = i < filled ? "💗" : "♡";
    wrap.appendChild(span);
  }
}

/* ============================================================
   MESSAGE CARD
   ============================================================ */
function initMessage() {
  document.getElementById("message-title").textContent = CONTENT.message.title;
  const body = document.getElementById("message-body");
  body.innerHTML = "";
  CONTENT.message.lines.forEach(l => {
    const p = document.createElement("p");
    p.textContent = l;
    body.appendChild(p);
  });
  document.getElementById("message-back").textContent = CONTENT.message.button;
  document.getElementById("message-back").addEventListener("click", () => {
    markVisited("message");
    backToDashboard();
  });
}

/* ============================================================
   5. ADORE (flip cards)
   ============================================================ */
const adoreFlipped = new Set();

function renderAdore() {
  adoreFlipped.clear();
  const grid = document.getElementById("adore-grid");
  grid.innerHTML = "";
  CONTENT.adore.forEach((item, i) => {
    const card = document.createElement("div");
    card.className = "flip-card";
    card.innerHTML = `
      <div class="flip-inner">
        <div class="flip-face flip-front"><span>${item.emoji}</span><span>Tap to reveal ✨</span></div>
        <div class="flip-face flip-back">${item.text}</div>
      </div>`;
    card.addEventListener("click", () => {
      card.classList.toggle("flipped");
      if (card.classList.contains("flipped")) {
        adoreFlipped.add(i);
        updateAdoreGate();
      }
    });
    grid.appendChild(card);
  });
  updateAdoreGate();
}

function updateAdoreGate() {
  const total = CONTENT.adore.length;
  const seen = adoreFlipped.size;
  const backBtn = document.getElementById("adore-back");
  const hint = document.getElementById("adore-hint");
  const allSeen = seen >= total;

  backBtn.disabled = !allSeen;
  backBtn.classList.toggle("locked-btn", !allSeen);
  hint.textContent = allSeen ? "all revealed ✓" : `${seen}/${total} revealed`;
  hint.classList.toggle("done", allSeen);
}

function initAdoreBack() {
  document.getElementById("adore-back").addEventListener("click", () => {
    if (adoreFlipped.size < CONTENT.adore.length) return;
    markVisited("adore");
    backToDashboard();
  });
}

/* ============================================================
   6. MEMORIES (polaroids)
   ============================================================ */
const memoriesViewed = new Set();

function renderMemories() {
  memoriesViewed.clear();
  const desk = document.getElementById("polaroid-desk");
  desk.innerHTML = "";
  CONTENT.memories.forEach((m, i) => {
    const p = document.createElement("div");
    p.className = "polaroid";
    p.style.transform = `rotate(${m.rotate}deg)`;
    p.innerHTML = `<div class="photo-slot">${m.src ? `<img src="${m.src}" alt="Memory ${i + 1}" onerror="this.parentElement.innerHTML='📷'">` : "📷"}</div>`;
    p.addEventListener("click", () => openLightbox(m, i));
    desk.appendChild(p);
  });
  updateMemoriesGate();
}

function updateMemoriesGate() {
  const total = CONTENT.memories.length;
  const seen = memoriesViewed.size;
  const backBtn = document.getElementById("memories-back");
  const hint = document.getElementById("memories-hint");
  const allSeen = seen >= total;

  backBtn.disabled = !allSeen;
  backBtn.classList.toggle("locked-btn", !allSeen);
  hint.textContent = allSeen ? "all photos seen ✓" : `${seen}/${total} photos viewed`;
  hint.classList.toggle("done", allSeen);
}

function openLightbox(m, index) {
  const lb = document.getElementById("lightbox");
  document.getElementById("lightbox-photo").innerHTML = m.src
    ? `<img src="${m.src}" alt="" onerror="this.parentElement.innerHTML='📷'">`
    : "📷";
  document.getElementById("lightbox-caption").textContent = m.caption;
  document.getElementById("lightbox-meta").textContent = m.meta || "";
  lb.classList.remove("hidden");
  if (typeof index === "number") {
    memoriesViewed.add(index);
    updateMemoriesGate();
  }
}
function initMemoriesBack() {
  document.getElementById("memories-back").addEventListener("click", () => {
    if (memoriesViewed.size < CONTENT.memories.length) return; // guard against disabled-state edge cases
    markVisited("memories");
    backToDashboard();
  });
  document.getElementById("lightbox-close").addEventListener("click", () => {
    document.getElementById("lightbox").classList.add("hidden");
  });
  document.getElementById("lightbox").addEventListener("click", (e) => {
    if (e.target.id === "lightbox") document.getElementById("lightbox").classList.add("hidden");
  });
}

/* ============================================================
   7. QUIZ
   ============================================================ */
let quizIndex = 0;
let quizLocked = false;
function resetQuiz() { quizIndex = 0; quizLocked = false; renderQuizQuestion(); }
function renderQuizQuestion() {
  quizLocked = false;
  const q = CONTENT.quiz[quizIndex];
  document.getElementById("quiz-progress").textContent = `QUESTION ${quizIndex + 1} / ${CONTENT.quiz.length}`;
  document.getElementById("quiz-q").textContent = q.q;
  document.getElementById("quiz-reaction").textContent = "";
  document.getElementById("quiz-reaction").className = "quiz-reaction";
  const optWrap = document.getElementById("quiz-options");
  optWrap.innerHTML = "";
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "quiz-opt";
    btn.textContent = opt;
    btn.addEventListener("click", () => {
      if (quizLocked) return;
      const reactionEl = document.getElementById("quiz-reaction");

      if (i === q.correct) {
        quizLocked = true;
        optWrap.querySelectorAll(".quiz-opt").forEach(b => b.disabled = true);
        btn.classList.add("picked", "correct");
        reactionEl.textContent = q.reaction;
        reactionEl.className = "quiz-reaction correct-text";
        playSfx("unlock");
        setTimeout(() => {
          quizIndex++;
          if (quizIndex < CONTENT.quiz.length) {
            renderQuizQuestion();
          } else {
            document.getElementById("quiz-q").textContent = "That's it — you passed your own personality test.";
            optWrap.innerHTML = "";
            reactionEl.textContent = "Suspiciously well, honestly.";
            reactionEl.className = "quiz-reaction correct-text";
          }
        }, 1000);
      } else {
        const wrongPool = CONTENT.quizWrongReactions;
        reactionEl.textContent = wrongPool[Math.floor(Math.random() * wrongPool.length)];
        reactionEl.className = "quiz-reaction wrong-text";
        btn.classList.add("shake");
        setTimeout(() => btn.classList.remove("shake"), 450);
      }
    });
    optWrap.appendChild(btn);
  });
}
function initQuizBack() {
  document.getElementById("quiz-back").addEventListener("click", backToDashboard);
}

/* ============================================================
   8. CAKE
   ============================================================ */
function resetCake() {
  document.getElementById("cake-title").textContent = CONTENT.cake.title;
  document.getElementById("cake-btn").textContent = CONTENT.cake.button;
  document.getElementById("cake-btn").classList.remove("hidden");
  document.getElementById("cake-after").classList.add("hidden");
  document.getElementById("smoke").classList.remove("show");

  const backBtn = document.getElementById("cake-back");
  backBtn.disabled = true;
  backBtn.classList.add("locked-btn");
  document.getElementById("cake-hint").textContent = "make a wish first";
  document.getElementById("cake-hint").classList.remove("done");

  const candleWrap = document.getElementById("candles");
  candleWrap.innerHTML = "";
  const n = Math.min(CONTENT.cake.candleCount, 24); // visually cap at 24 for layout
  for (let i = 0; i < n; i++) {
    const c = document.createElement("span");
    c.className = "candle";
    c.innerHTML = `<span class="flame">🕯️</span>`;
    candleWrap.appendChild(c);
  }
}
function initCake() {
  document.getElementById("cake-btn").addEventListener("click", () => {
    playSfx("candle");
    document.querySelectorAll("#candles .candle").forEach((c, i) => {
      setTimeout(() => c.classList.add("out"), i * 45);
    });
    document.getElementById("smoke").classList.add("show");
    document.getElementById("cake-btn").classList.add("hidden");
    burstConfetti(35);

    const candleCount = document.querySelectorAll("#candles .candle").length;
    const flashDelay = candleCount * 45 + 500;
    const flash = document.getElementById("cake-flash");

    setTimeout(() => {
      flash.classList.add("show");
    }, flashDelay);

    setTimeout(() => {
      flash.classList.remove("show");
      document.getElementById("after-title").textContent = CONTENT.cake.afterTitle;
      document.getElementById("after-sub").textContent = CONTENT.cake.afterSub;
      document.getElementById("cake-after").classList.remove("hidden");

      const backBtn = document.getElementById("cake-back");
      backBtn.disabled = false;
      backBtn.classList.remove("locked-btn");
      const hint = document.getElementById("cake-hint");
      hint.textContent = "wish saved ✓";
      hint.classList.add("done");
    }, flashDelay + 450);
  });
  document.getElementById("cake-back").addEventListener("click", () => {
    if (document.getElementById("cake-back").disabled) return;
    markVisited("cake");
    backToDashboard();
  });
}

/* ============================================================
   9. PREDICTION
   ============================================================ */
function resetPrediction() {
  document.getElementById("predict-btn").classList.remove("hidden");
  document.getElementById("predict-btn").textContent = CONTENT.prediction.button;
  document.getElementById("predict-loading").classList.add("hidden");
  document.getElementById("predict-result").classList.add("hidden");

  const backBtn = document.getElementById("predict-back");
  backBtn.disabled = true;
  backBtn.classList.add("locked-btn");
  document.getElementById("predict-hint").textContent = "run your prediction first";
  document.getElementById("predict-hint").classList.remove("done");
}
function initPrediction() {
  document.getElementById("predict-btn").addEventListener("click", () => {
    document.getElementById("predict-btn").classList.add("hidden");
    const loadingWrap = document.getElementById("predict-loading");
    loadingWrap.classList.remove("hidden");
    loadingWrap.innerHTML = "";
    CONTENT.prediction.loadingSteps.forEach((s, i) => {
      const li = document.createElement("li");
      li.textContent = s;
      loadingWrap.appendChild(li);
      setTimeout(() => li.classList.add("show"), 300 + i * 500);
    });
    setTimeout(() => {
      loadingWrap.classList.add("hidden");
      const result = document.getElementById("predict-result");
      result.classList.remove("hidden");
      document.getElementById("predict-result-title").textContent = CONTENT.prediction.resultTitle;
      document.getElementById("predict-result-intro").textContent = CONTENT.prediction.resultIntro;
      const ul = document.getElementById("predict-items");
      ul.innerHTML = "";
      const confirmBtn = document.getElementById("predict-confirm");
      confirmBtn.classList.add("hidden");

      const reduced = prefersReducedMotion();
      const itemGap = reduced ? 0 : 500;
      const itemEls = CONTENT.prediction.resultItems.map(it => {
        const li = document.createElement("li");
        li.textContent = it;
        li.className = "predict-item";
        ul.appendChild(li);
        return li;
      });
      itemEls.forEach((li, i) => {
        setTimeout(() => li.classList.add("show"), i * itemGap);
      });
      setTimeout(() => {
        confirmBtn.textContent = CONTENT.prediction.button2;
        confirmBtn.classList.remove("hidden");
        burstConfetti(25);

        const backBtn = document.getElementById("predict-back");
        backBtn.disabled = false;
        backBtn.classList.remove("locked-btn");
        const hint = document.getElementById("predict-hint");
        hint.textContent = "prediction complete ✓";
        hint.classList.add("done");
      }, itemEls.length * itemGap + (reduced ? 0 : 300));
    }, 300 + CONTENT.prediction.loadingSteps.length * 500 + 400);
  });
  document.getElementById("predict-back").addEventListener("click", () => {
    if (document.getElementById("predict-back").disabled) return;
    markVisited("prediction");
    backToDashboard();
  });
}

/* ============================================================
   10. MYSTERY BOX
   ============================================================ */
let mysteryTapCount = 0;
function resetMystery() {
  mysteryTapCount = 0;
  const box = document.getElementById("gift-box");
  box.className = "gift-box";
  box.textContent = "🎁";
  const locked = !allRequiredDone();
  document.getElementById("mystery-locked-msg").classList.toggle("hidden", !locked);
  document.getElementById("mystery-locked-msg").textContent = locked
    ? CONTENT.mystery.lockedSub
    : "";
  document.getElementById("mystery-title").textContent = locked ? CONTENT.mystery.lockedTitle : CONTENT.mystery.unlockedTitle;
  document.getElementById("mystery-instruction").textContent = locked ? "" : CONTENT.mystery.instruction;
  box.style.pointerEvents = locked ? "none" : "auto";
  box.style.opacity = locked ? "0.4" : "1";
}
function initMystery() {
  document.getElementById("gift-box").addEventListener("click", () => {
    const box = document.getElementById("gift-box");
    mysteryTapCount++;
    if (mysteryTapCount === 1) {
      box.classList.add("shake");
      document.getElementById("mystery-instruction").textContent = CONTENT.mystery.instruction2;
      setTimeout(() => box.classList.remove("shake"), 500);
    } else {
      box.classList.add("opened");
      box.textContent = "🎉";
      playSfx("gift");
      burstConfetti(80);
      riseBalloons(6);
      state.mysteryOpened = true;
      renderProgressHearts();
      setTimeout(() => {
        showScreen("letter");
        renderLetter();
      }, 1100);
    }
  });
  document.getElementById("mystery-back").addEventListener("click", backToDashboard);
}

/* ============================================================
   11. LETTER
   ============================================================ */
function renderLetter() {
  const sal = document.getElementById("letter-sal");
  const body = document.getElementById("letter-body");
  const signoff = document.getElementById("letter-signoff");
  const signature = document.getElementById("letter-signature");
  const nextBtn = document.getElementById("letter-next");

  sal.textContent = CONTENT.letter.salutation;
  sal.classList.remove("show");
  sal.classList.add("letter-reveal");

  body.innerHTML = "";
  const paraEls = CONTENT.letter.body.map(p => {
    const para = document.createElement("p");
    para.textContent = p;
    para.className = "letter-reveal";
    body.appendChild(para);
    return para;
  });

  signoff.textContent = CONTENT.letter.signoff;
  signoff.classList.remove("show");
  signoff.classList.add("letter-reveal");

  signature.textContent = CONTENT.letter.signature;
  signature.classList.remove("show");
  signature.classList.add("letter-reveal");

  nextBtn.textContent = CONTENT.letter.button;
  nextBtn.classList.remove("show");

  const reduced = prefersReducedMotion();
  const sequence = [sal, ...paraEls, signoff, signature];
  const gap = reduced ? 0 : 750;
  let delay = reduced ? 0 : 400;

  sequence.forEach(el => {
    setTimeout(() => el.classList.add("show"), delay);
    delay += gap;
  });

  setTimeout(() => nextBtn.classList.add("show"), delay + (reduced ? 0 : 600));
}
function initLetter() {
  document.getElementById("letter-next").addEventListener("click", () => {
    showScreen("final");
    runFinal();
  });
}

/* ============================================================
   12. FINAL SURPRISE
   ============================================================ */
function makeStars() {
  const wrap = document.getElementById("final-stars");
  if (wrap.dataset.done) return;
  wrap.dataset.done = "1";
  for (let i = 0; i < 60; i++) {
    const s = document.createElement("div");
    s.className = "star-dot";
    s.style.left = Math.random() * 100 + "%";
    s.style.top = Math.random() * 100 + "%";
    s.style.animationDelay = (Math.random() * 2.5) + "s";
    wrap.appendChild(s);
  }
}
function runFinal() {
  makeStars();
  document.getElementById("final-line1").textContent = CONTENT.final.line1;
  document.getElementById("final-line2").textContent = CONTENT.final.line2;
  document.getElementById("final-line1").classList.remove("show");
  document.getElementById("final-line2").classList.remove("show");
  document.getElementById("final-btn").classList.add("hidden");
  document.getElementById("final-video-wrap").classList.add("hidden");

  setTimeout(() => document.getElementById("final-line1").classList.add("show"), 300);
  setTimeout(() => document.getElementById("final-line2").classList.add("show"), 1400);
  setTimeout(() => {
    const btn = document.getElementById("final-btn");
    btn.textContent = CONTENT.final.button;
    btn.classList.remove("hidden");
  }, 2400);
}
function initFinal() {
  document.getElementById("final-btn").addEventListener("click", () => {
    document.getElementById("final-btn").classList.add("hidden");
    const wrap = document.getElementById("final-video-wrap");
    wrap.classList.remove("hidden");
    const frame = document.getElementById("video-frame");
    if (CONTENT.final.videoSrc) {
      frame.innerHTML = `<video src="${CONTENT.final.videoSrc}" controls autoplay playsinline></video>`;
    } else {
      frame.innerHTML = CONTENT.final.videoFallback;
    }
    const cont = document.getElementById("final-continue");
    cont.classList.remove("hidden");
  });
  document.getElementById("final-continue").addEventListener("click", () => {
    showScreen("ending");
    runEnding();
  });
}

/* ============================================================
   ENDING
   ============================================================ */
function runEnding() {
  const beat1 = document.getElementById("ending-beat1");
  const beat2 = document.getElementById("ending-beat2");
  const final = document.getElementById("ending-final");
  const replay = document.getElementById("ending-replay");

  beat1.textContent = CONTENT.ending.beat1;
  beat2.textContent = CONTENT.ending.beat2;
  document.getElementById("ending-title").textContent = CONTENT.ending.title;
  document.getElementById("ending-sub").textContent = CONTENT.ending.sub;
  replay.textContent = CONTENT.ending.replay;

  beat1.classList.remove("show");
  beat2.classList.remove("show");
  final.classList.add("hidden");
  replay.classList.add("hidden");

  const reduced = prefersReducedMotion();
  const t = reduced ? [0, 0, 0, 0] : [300, 1700, 3400, 5200];

  setTimeout(() => beat1.classList.add("show"), t[0]);
  setTimeout(() => { beat1.classList.remove("show"); beat2.classList.add("show"); }, t[1]);
  setTimeout(() => {
    beat2.classList.remove("show");
    final.classList.remove("hidden");
    burstConfetti(90);
    riseBalloons(12);
  }, t[2]);
  setTimeout(() => replay.classList.remove("hidden"), t[3]);
}
function initEnding() {
  document.getElementById("ending-replay").addEventListener("click", () => {
    state.visited = { message: false, memories: false, cake: false, adore: false, prediction: false };
    state.mysteryOpened = false;
    showScreen("entrance");
    renderProgressHearts();
  });
}

/* ---------- show/hide the persistent heart bar depending on screen ---------- */
function wireHeartVisibility() {
  const hideOn = ["gate", "entrance", "loading", "reveal", "final", "ending"];
  const observer = new MutationObserver(() => {
    const active = [...document.querySelectorAll(".screen")].find(s => !s.classList.contains("hidden"));
    const bar = document.getElementById("progress-hearts");
    if (!active) return;
    const id = active.id.replace("screen-", "");
    bar.classList.toggle("hide", hideOn.includes(id));
  });
  document.querySelectorAll(".screen").forEach(s => observer.observe(s, { attributes: true, attributeFilter: ["class"] }));
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  startAmbient();
  state.currentWish = getNextWish();
  initGate();
  initEntrance();
  initLoading();
  initReveal();
  initMessage();
  initAdoreBack();
  initMemoriesBack();
  initQuizBack();
  initCake();
  initPrediction();
  initMystery();
  initDashCompletion();
  initSecret();
  initLetter();
  initFinal();
  initEnding();
  wireHeartVisibility();
  renderProgressHearts();
  runGateCheck();
});
