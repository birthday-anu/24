/* ============================================================
   APP.JS — screen routing + interactions
   Vanilla JS, no framework, no build step.
   ============================================================ */

const state = {
  visited: { message: false, memories: false, cake: false, adore: false, prediction: false },
  mysteryOpened: false,
  musicStarted: false,
  currentWish: "",
};

const REQUIRED = ["message", "memories", "cake", "adore", "prediction"];

/* ---------- screen navigation ---------- */
function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
  const el = document.getElementById("screen-" + id);
  if (el) el.classList.remove("hidden");
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
}

/* ---------- ambient floating hearts/stars ---------- */
function startAmbient() {
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
  }, 1400);
}

/* ---------- confetti + balloons ---------- */
const CONFETTI_COLORS = ["#F3C9D4", "#CBB8E6", "#F4B48A", "#E8B23E", "#3E2244"];
function burstConfetti(count = 60) {
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

function tickCountdown() {
  const diff = getUnlockEpoch() - nowMs();
  if (diff <= 0) {
    clearInterval(gateInterval);
    gateInterval = null;
    document.getElementById("gate-sub").textContent = CONTENT.gate.afterUnlockHint;
    setTimeout(() => {
      showScreen("entrance");
    }, 900);
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
    showScreen("entrance");
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
  const wrap = document.getElementById("reveal-lines");
  wrap.innerHTML = "";
  CONTENT.reveal.lines.forEach((line, i) => {
    const div = document.createElement("div");
    div.className = "reveal-line";
    div.textContent = line;
    wrap.appendChild(div);
    setTimeout(() => div.classList.add("show"), 200 + i * 350);
  });
  const sub = document.getElementById("reveal-sub");
  sub.textContent = CONTENT.reveal.sub;
  sub.classList.remove("show");
  setTimeout(() => {
    sub.classList.add("show");
    riseBalloons(10);
    burstConfetti(70);
  }, 200 + CONTENT.reveal.lines.length * 350 + 200);
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
  grid.innerHTML = "";
  CONTENT.dashboard.cards.forEach(card => {
    const btn = document.createElement("button");
    const isMystery = card.id === "mystery";
    const done = isMystery ? state.mysteryOpened : state.visited[card.id];
    const locked = isMystery && !allRequiredDone();

    btn.className = "dash-card btn--wiggle" + (done ? " done" : "") + (locked ? " locked" : "");
    btn.innerHTML = `<span class="icon">${card.icon}</span><span>${card.label}</span>`;
    btn.disabled = locked;
    btn.addEventListener("click", () => goToCard(card.id));
    grid.appendChild(btn);
  });

  const bonusBtn = document.getElementById("dash-bonus");
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
  if (REQUIRED.includes(id)) state.visited[id] = true;
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
function renderAdore() {
  const grid = document.getElementById("adore-grid");
  grid.innerHTML = "";
  CONTENT.adore.forEach((item) => {
    const card = document.createElement("div");
    card.className = "flip-card";
    card.innerHTML = `
      <div class="flip-inner">
        <div class="flip-face flip-front"><span>${item.emoji}</span><span>Tap to reveal ✨</span></div>
        <div class="flip-face flip-back">${item.text}</div>
      </div>`;
    card.addEventListener("click", () => card.classList.toggle("flipped"));
    grid.appendChild(card);
  });
}
function initAdoreBack() {
  document.getElementById("adore-back").addEventListener("click", () => {
    markVisited("adore");
    backToDashboard();
  });
}

/* ============================================================
   6. MEMORIES (polaroids)
   ============================================================ */
function renderMemories() {
  const desk = document.getElementById("polaroid-desk");
  desk.innerHTML = "";
  CONTENT.memories.forEach((m, i) => {
    const p = document.createElement("div");
    p.className = "polaroid";
    p.style.transform = `rotate(${m.rotate}deg)`;
    p.innerHTML = `<div class="photo-slot">${m.src ? `<img src="${m.src}" alt="Memory ${i + 1}" onerror="this.parentElement.innerHTML='📷'">` : "📷"}</div>`;
    p.addEventListener("click", () => openLightbox(m));
    desk.appendChild(p);
  });
}
function openLightbox(m) {
  const lb = document.getElementById("lightbox");
  document.getElementById("lightbox-photo").innerHTML = m.src
    ? `<img src="${m.src}" alt="" onerror="this.parentElement.innerHTML='📷'">`
    : "📷";
  document.getElementById("lightbox-caption").textContent = m.caption;
  document.getElementById("lightbox-meta").textContent = m.meta || "";
  lb.classList.remove("hidden");
}
function initMemoriesBack() {
  document.getElementById("memories-back").addEventListener("click", () => {
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
function resetQuiz() { quizIndex = 0; renderQuizQuestion(); }
function renderQuizQuestion() {
  const q = CONTENT.quiz[quizIndex];
  document.getElementById("quiz-progress").textContent = `QUESTION ${quizIndex + 1} / ${CONTENT.quiz.length}`;
  document.getElementById("quiz-q").textContent = q.q;
  document.getElementById("quiz-reaction").textContent = "";
  const optWrap = document.getElementById("quiz-options");
  optWrap.innerHTML = "";
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.className = "quiz-opt";
    btn.textContent = opt;
    btn.addEventListener("click", () => {
      optWrap.querySelectorAll(".quiz-opt").forEach(b => b.classList.remove("picked"));
      btn.classList.add("picked");
      document.getElementById("quiz-reaction").textContent = q.reaction;
      setTimeout(() => {
        quizIndex++;
        if (quizIndex < CONTENT.quiz.length) {
          renderQuizQuestion();
        } else {
          document.getElementById("quiz-q").textContent = "That's it — you passed your own personality test.";
          optWrap.innerHTML = "";
          document.getElementById("quiz-reaction").textContent = "Suspiciously well, honestly.";
        }
      }, 900);
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
    document.querySelectorAll("#candles .candle").forEach((c, i) => {
      setTimeout(() => c.classList.add("out"), i * 25);
    });
    document.getElementById("smoke").classList.add("show");
    document.getElementById("cake-btn").classList.add("hidden");
    burstConfetti(35);
    setTimeout(() => {
      document.getElementById("after-title").textContent = CONTENT.cake.afterTitle;
      document.getElementById("after-sub").textContent = CONTENT.cake.afterSub;
      document.getElementById("cake-after").classList.remove("hidden");
    }, 900);
  });
  document.getElementById("cake-back").addEventListener("click", () => {
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
      CONTENT.prediction.resultItems.forEach(it => {
        const li = document.createElement("li");
        li.textContent = it;
        ul.appendChild(li);
      });
      document.getElementById("predict-confirm").textContent = CONTENT.prediction.button2;
      burstConfetti(25);
    }, 300 + CONTENT.prediction.loadingSteps.length * 500 + 400);
  });
  document.getElementById("predict-back").addEventListener("click", () => {
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
  document.getElementById("letter-sal").textContent = CONTENT.letter.salutation;
  const body = document.getElementById("letter-body");
  body.innerHTML = "";
  CONTENT.letter.body.forEach(p => {
    const para = document.createElement("p");
    para.textContent = p;
    body.appendChild(para);
  });
  document.getElementById("letter-signoff").textContent = CONTENT.letter.signoff;
  document.getElementById("letter-signature").textContent = CONTENT.letter.signature;
  document.getElementById("letter-next").textContent = CONTENT.letter.button;
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
  document.getElementById("ending-title").textContent = CONTENT.ending.title;
  document.getElementById("ending-sub").textContent = CONTENT.ending.sub;
  document.getElementById("ending-replay").textContent = CONTENT.ending.replay;
  burstConfetti(90);
  riseBalloons(12);
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
  initLetter();
  initFinal();
  initEnding();
  wireHeartVisibility();
  renderProgressHearts();
  runGateCheck();
});
