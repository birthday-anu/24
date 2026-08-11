/* ============================================================
   CONTENT.JS
   Every piece of text/photo/copy lives here. Edit this file,
   never the HTML or app.js, to update the site.
   ============================================================ */

const CONTENT = {

  name: "Anuradha",
  age: 24,
  from: "Kshitiz",

  // ---------- 0. Gate / countdown ----------
  // Site stays locked until this date/time in INDIA STANDARD TIME (IST,
  // UTC+5:30) — fixed regardless of the visitor's device timezone or clock.
  // Format: [year, monthIndex(0-11), day, hour, minute] — all in IST.
  gate: {
    unlockAt: [2026, 7, 17, 0, 0], // Aug 17, 2026, 00:00 IST
    title: "Something's coming... 🎀",
    sub: "A little birthday world for Anuradha unlocks in:",
    afterUnlockHint: "It's time. 👀",
    welcomeLine: "Welcome to your 24th year.",
    // Manual override: open the site with ?unlock=KEY appended to the URL
    // to skip the countdown entirely, regardless of real time. Only use
    // this yourself if the timer breaks — the normal link stays locked
    // for her since she won't have this in the URL.
    // e.g. index.html?unlock=cake24
    skipParam: "unlock",
    skipValue: "cake24",
  },

  // ---------- 1. Entrance ----------
  entrance: {
    whisper: "Psst... 👀",
    line: "Anuradha, I made something for you.",
    button: "Open your birthday surprise 🎁",
  },

  // ---------- 2. Fake loading ----------
  loading: {
    title: "Preparing Anuradha's birthday...",
    steps: [
      "Finding the cutest birthday girl...",
      "Loading cake...",
      "Adding unnecessary amounts of happiness...",
      "Making sure she's smiling...",
      "Finding 24 candles...",
    ],
    error: "24 candles may be a fire hazard 🔥",
    errorSub: "Continue anyway? 😂",
    button: "Obviously →",
  },

  // ---------- 3. Reveal ----------
  reveal: {
    lines: ["HAPPY", "24TH", "BIRTHDAY", "ANURADHA! 🎀"],
    sub: "Okay birthday girl... your little adventure starts here. 💗",
    button: "Start →",
  },

  // ---------- 4. Dashboard ----------
  dashboard: {
    title: "ANURADHA'S BIRTHDAY",
    subtitle: "CONTROL ROOM",
    cards: [
      { id: "message",  icon: "💌", label: "A Message" },
      { id: "memories", icon: "📸", label: "Our Memories" },
      { id: "cake",     icon: "🧁", label: "Birthday Cake" },
      { id: "adore",    icon: "💗", label: "Things I Adore" },
      { id: "prediction", icon: "🔮", label: "Birthday Prediction" },
      { id: "mystery",  icon: "🎁", label: "Mystery Box", locked: true },
    ],
    bonus: { id: "quiz", icon: "🤔", label: "Bonus: Do You Even Know Yourself?" },
  },

  // ---------- Secret interaction ----------
  // Tap the 🎀 in the control room corner 3 times to find this. Not
  // announced anywhere — genuinely hidden, not a password.
  secret: {
    message: "You found the secret bow. There's no prize. I just liked knowing you'd tap on things you weren't told to.",
  },

  // ---------- Wish of the visit ----------
  // A new one shows each time she opens the site. Pulled from this pool
  // with no repeats until all have been shown once, then it reshuffles.
  // EDIT ME: swap/add/remove — no fixed count required, code adapts.
  wishBanner: {
    // A few variants — one picked at random each visit, alongside the wish text.
    labels: [
      "An advance birthday wish 🎀",
      "Happy birthday, in advance ✨",
      "A little early, but here's one anyway 👀",
      "Jumping the gun a bit — happy birthday 🎉",
    ],
  },
  wishes: [
    "May your coffee be strong and your architecture critiques be gentle.",
    "Here's to another year of you redesigning buildings in your head that you'll never admit to designing.",
    "May every stray dog you meet this year know you're a soft touch.",
    "Wishing you a year where the good food finds you, not the other way around.",
    "May your blueprints be straight and your birthday be crooked with cake.",
    "Here's to you being right about being right, most of the time.",
    "May this year bring you at least one perfect meal you still talk about in December.",
    "Wishing you patience for people slower than you and snacks for when that patience runs out.",
    "May every dog you pass on the street look at you like you're the main character.",
    "Here's to your creativity never running out of walls to redesign.",
    "May you find a reason to laugh your real laugh at least once this week.",
    "Wishing you fewer deadlines and more dessert.",
    "May your kindness come back to you in ways you don't expect.",
    "Here's to a year where your stubbornness works entirely in your favor.",
    "May you build something this year — literal or otherwise — that makes you proud.",
    "Wishing you good light, good food, and good company, roughly in that order.",
    "May every plan you make actually survive contact with real life this year.",
    "Here's to you adopting exactly the number of animals your apartment lease allows. Or doesn't.",
    "May your birthday cake be exactly as many candles as it takes to set off a smoke alarm.",
    "Wishing you a year that's kinder to you than you are to yourself.",
    "May you never run out of new restaurants to be suspiciously excited about.",
    "Here's to your eye for beautiful things — buildings, food, and otherwise.",
    "Wishing you naps that feel earned and mornings that don't.",
    "May this year hand you at least one genuinely great story to tell.",
    "Here's to you being effortlessly, infuriatingly good at things you just started doing.",
    "Wishing you a year with fewer things to worry about and more things to enjoy.",
    "May your playlist stay good and your wifi stay faster.",
    "Here's to the buildings you'll notice today that everyone else walks right past.",
    "Wishing you a birthday that feels like it belongs entirely to you.",
    "May you get exactly the kind of attention you secretly want on your birthday.",
    "Here's to another year of making ordinary afternoons feel like something worth remembering.",
    "Wishing you good weather for whatever you're planning and bad weather for whatever you're avoiding.",
    "May your ambition and your appetite grow at exactly the same rate.",
    "Here's to you being someone's favorite person to text good news to.",
    "Wishing you a year that surprises you in the good way, repeatedly.",
    "May every dog, cat, and questionable street animal sense that you mean well.",
    "Here's to the version of you that exists a year from now — she's going to be even better.",
    "Wishing you fewer things falling through and more things falling into place.",
    "May you get away with at least one thing you probably shouldn't have this year.",
    "Here's to you, exactly as you are, on your 24th trip around the sun.",
  ],
  message: {
    title: "A tiny message before the chaos begins 💌",
    // EDIT ME: 2-4 short lines. Playful, not the big emotional one — that comes later.
    lines: [
      "Before you go tap every button on this site like a raccoon in a kitchen —",
      "just know that today is entirely about you.",
      "There's a lot more waiting for you here. Go on, get into it.",
    ],
    button: "Back to control room",
  },

  // ---------- 5. Things I Adore ----------
  // EDIT ME: swap these for real, specific things. Mix sweet + teasing.
  adore: [
    { emoji: "🏛️", text: "Your ambitious architect brain — you see buildings the rest of us just walk past." },
    { emoji: "🍜", text: "How ridiculously excited you get about good food. It's borderline a personality trait." },
    { emoji: "🐾", text: "The way you care about every stray animal like it's personally your responsibility." },
    { emoji: "✨", text: "Your creativity. You can't look at a blank wall without redesigning it in your head." },
    { emoji: "💗", text: "Your kindness — the kind that shows up in small moments, not just big gestures." },
    { emoji: "😤", text: "How stubborn you get when you've decided you're right. Which is often." },
    { emoji: "🍕", text: "Your ability to somehow make me hungry just by talking about food." },
    { emoji: "🐶", text: "You’d adopt every dog on the street if you could. I might just let you… you’re kind of adorable when you do that." },
    { emoji: "🎯", text: "How seriously you take the things you care about. It's honestly kind of intimidating." },
    { emoji: "😂", text: "Your laugh when something's actually funny — completely different from your polite laugh." },
  ],

  // ---------- 6. Memories (polaroids) ----------
  // EDIT ME: replace src with real photo paths in assets/images/, add real captions.
  // Rotation values give the scattered-desk look.
  memories: [
    { src: "assets/images/memory-1.jpg", caption: "One of those days I wish had lasted a little longer.", meta: "", rotate: -4 },
    { src: "assets/images/memory-2.jpg", caption: "This one, obviously, because of the food.", meta: "", rotate: 3 },
    { src: "assets/images/memory-3.jpg", caption: "You weren't supposed to see me take this photo.", meta: "", rotate: -2 },
    { src: "assets/images/memory-4.jpg", caption: "Still one of my favorite evenings.", meta: "", rotate: 5 },
    { src: "assets/images/memory-5.jpg", caption: "You have no idea how often I look at this one.", meta: "", rotate: -3 },
    { src: "assets/images/memory-6.jpg", caption: "Proof that you can't take a bad photo even when you try.", meta: "", rotate: 2 },
  ],

  // ---------- 7. Bonus quiz ----------
  // EDIT ME: swap questions/options for real inside jokes.
  // Wrong answers pull a random line from quizWrongReactions and let her
  // try again — only the correct pick advances to the next question.
  quizWrongReactions: [
    "Absolutely not.",
    "Bold guess. Wrong, but bold.",
    "That's... not it.",
    "Try again, birthday girl.",
    "No, but I respect the confidence.",
    "Denied. Pick again.",
  ],
  quiz: [
    {
      q: "What makes Anuradha happiest?",
      options: ["Architecture", "Food", "Animals", "All of the above"],
      correct: 3,
      reaction: "Correct. It was never going to be one answer.",
    },
    {
      q: "Who is officially allowed to annoy you today?",
      options: ["Nobody", "Me", "Also me", "Unfortunately, still me"],
      correct: 1,
      reaction: "Correct answer accepted. Annoying commences now.",
    },
    {
      q: "How many candles is 'too many' candles?",
      options: ["12", "18", "24", "There's no such thing"],
      correct: 3,
      reaction: "The correct answer, and also a fire hazard.",
    },
    {
      q: "Best use of a free afternoon?",
      options: ["Sketching buildings", "Finding food", "Petting a stray dog", "All three, in that order"],
      correct: 3,
      reaction: "Efficient. Very on brand.",
    },
  ],

  // ---------- 8. Cake ----------
  cake: {
    title: "Birthday rule #1: Make a wish ✨",
    candleCount: 24,
    button: "Blow the candles",
    afterTitle: "Wish saved successfully. 🔒",
    afterSub: "Don't tell me what it was.",
  },

  // ---------- 9. Prediction ----------
  prediction: {
    button: "Tell me my future",
    loadingSteps: [
      "Consulting the stars...",
      "Checking architectural drawings...",
      "Asking several dogs...",
      "Analysing dessert consumption...",
    ],
    resultTitle: "🔮 OFFICIAL PREDICTION",
    resultIntro: "Your 24th year contains:",
    resultItems: [
      "✨ new adventures",
      "🏛️ amazing things you'll create",
      "🍕 suspicious amounts of good food",
      "🐶 many animals you'll want to adopt",
      "😂 terrible jokes from me",
      "💗 and a lot of memories still waiting for us",
    ],
    button2: "Seems scientifically accurate.",
  },

  // ---------- 10. Mystery gift ----------
  mystery: {
    lockedTitle: "🎁 FINAL SURPRISE",
    lockedSub: "🔒 Complete the birthday adventure first",
    unlockedTitle: "UNLOCKED ✨",
    instruction: "Tap the box.",
    instruction2: "Tap again.",
  },

  // ---------- 11. The letter ----------
  // EDIT ME: this is the real one. 200-350 words. Write it yourself — no
  // placeholder can replace the actual thing you want to say.
  letter: {
    salutation: `Dear ${'Anuradha'},`,
    // Replace this paragraph-by-paragraph with your real letter.
    body: [
      "Happy birthday. Twenty-four looks good on you already, and it's not even 6:23am yet.",
      "I built this whole ridiculous thing because you deserve more than a text that says 'happy bday 🎉' — you deserve candles that are a fire hazard, a quiz you're forced to ace, and a control room with your name on it.",
      "Somewhere between the jokes on this site, I mean every word. I love how seriously you take the things you care about, how you notice buildings the rest of us walk past without seeing, and how a good meal can turn your whole day around. I love that you’d bring home every stray dog in the city if you could. There’s something ridiculously endearing about how soft your heart is, especially when you’re not even trying to show it.",
      "This year, I hope you build the things you've been sketching in your head. I hope you find more food worth getting excited about. I hope every stray you meet gets a good day because of you. And I hope, through all of it, I get to be around for most of the story.",
      "Thank you for putting up with my jokes, my chaos, and apparently now, my HTML.",
    ],
    signoff: "Happy 24th Birthday. ❤️",
    signature: "— Kshitiz",
    button: "Wait...",
  },

  // ---------- 12. Final surprise ----------
  final: {
    line1: "Wait...",
    line2: "There is one more thing.",
    button: "What now? 👀",
    // Point this at a real file in assets/video/ when you have one.
    // If left empty, the site shows a placeholder card instead of a broken video.
    videoSrc: "assets/video/birthday-video.mp4", // e.g. "assets/video/birthday-video.mp4"
    videoFallback: "🎬 Your video goes here — drop it into assets/video/ and set videoSrc in content.js",
  },

  // ---------- Ending ----------
  ending: {
    beat1: "And that's it.",
    beat2: "Except it isn't.",
    title: `Happy Birthday, ${'Anuradha'}. 💗`,
    sub: "Thanks for existing.",
    replay: "Replay the chaos ↻",
  },

  // ---------- Sound effects ----------
  // Drop short files into assets/audio/sfx/ and set paths here. Any left
  // blank simply play nothing — nothing breaks if you skip some or all.
  // Keep them SHORT (under ~1s) and subtle — clicks/chimes, not jingles.
  sfx: {
    click: "",     // general button taps
    envelope: "",  // entrance envelope opening
    unlock: "",    // dashboard card completed
    candle: "",    // blowing out candles
    gift: "",      // mystery box opening
    reveal: "",    // big birthday reveal burst
  },

  // ---------- Music ----------
  // Drop a track into assets/audio/ and set the filename here. Leave empty to skip.
  music: {
    src: "assets/audio/theme.mp3", // e.g. "assets/audio/theme.mp3"
  },
};
