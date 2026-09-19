/* ==========================================================================
   main.js — мантиқи саҳифа. Одатан тағйир додан лозим нест.
   ========================================================================== */

(function () {
  "use strict";

  var C = window.CARD || {};
  var $ = function (id) { return document.getElementById(id); };
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var timers = [];

  function wait(ms, fn) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearAll() { timers.forEach(clearTimeout); timers = []; }

  /* ---------- Санаҳо ------------------------------------------------------ */

  function pad(n) { return n < 10 ? "0" + n : "" + n; }
  function fmt(d) { return pad(d.getDate()) + "." + pad(d.getMonth() + 1) + "." + d.getFullYear(); }

  var born = new Date(C.birthDate + "T00:00:00");
  var now = new Date();
  var daysAlive = Math.max(0, Math.round((now - born) / 86400000));

  /* ---------- Матнҳо ------------------------------------------------------ */

  function fillText() {
    $("noteName").textContent = C.name;
    $("fromName").textContent = C.from;
    $("dob").textContent = fmt(born);
    $("today").textContent = fmt(now);
    $("paperTitle").textContent = "Зодрӯзат муборак, " + C.name;
    $("facts").textContent =
      C.turning + "-солагӣ · " + daysAlive.toLocaleString("ru-RU") + " рӯз · " +
      C.role + " дар " + C.city;
    $("finaleText").textContent = C.finale;
    $("finaleSub").textContent = "— " + C.from;
    document.title = "Зодрӯзат муборак, " + C.name;
  }

  /* ---------- Ситораҳо ---------------------------------------------------- */

  function makeSky() {
    if (calm) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 28; i++) {
      var s = document.createElement("span");
      s.className = "spark";
      s.style.left = (Math.random() * 100).toFixed(2) + "%";
      s.style.top = (100 + Math.random() * 25).toFixed(2) + "%";
      s.style.animationDuration = (9 + Math.random() * 11).toFixed(1) + "s";
      s.style.animationDelay = (Math.random() * 14).toFixed(1) + "s";
      if (i % 3 === 0) s.style.background = "#e0637d";
      frag.appendChild(s);
    }
    $("sky").appendChild(frag);
  }

  /* ---------- Салют ------------------------------------------------------- */

  function boom(power) {
    if (typeof window.confetti !== "function" || calm) return;
    window.confetti({
      particleCount: power || 90,
      spread: power ? 100 : 72,
      startVelocity: 40,
      origin: { y: 0.62 },
      colors: ["#e9b451", "#f3cd7e", "#e0637d", "#f5eee4"]
    });
  }

  /* ---------- Оҳанг ------------------------------------------------------- */

  var audio = {
    ctx: null, on: false, timer: null, step: 0,
    notes: [262, 262, 294, 262, 349, 330,
            262, 262, 294, 262, 392, 349,
            262, 262, 523, 440, 349, 330, 294,
            466, 466, 440, 349, 392, 349],
    beats: [0.35, 0.35, 0.7, 0.7, 0.7, 1.3,
            0.35, 0.35, 0.7, 0.7, 0.7, 1.3,
            0.35, 0.35, 0.7, 0.7, 0.7, 0.7, 1.3,
            0.35, 0.35, 0.7, 0.7, 0.7, 1.6]
  };

  function note() {
    if (!audio.on) return;
    var t = audio.ctx.currentTime;
    var dur = audio.beats[audio.step];
    var osc = audio.ctx.createOscillator();
    var gain = audio.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(audio.notes[audio.step], t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.06, t + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.92);
    osc.connect(gain).connect(audio.ctx.destination);
    osc.start(t); osc.stop(t + dur);
    audio.step = (audio.step + 1) % audio.notes.length;
    audio.timer = setTimeout(note, dur * 1000);
  }

  function musicOn() {
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    if (!audio.ctx) audio.ctx = new AC();
    if (audio.ctx.state === "suspended") {
      audio.ctx.resume().catch(function () {});
    }
    if (audio.ctx.state !== "running") { syncMusic(); return; }
    if (audio.on) return;
    audio.on = true;
    clearTimeout(audio.timer);
    note();
    syncMusic();
  }

  function musicOff() {
    audio.on = false;
    clearTimeout(audio.timer);
    syncMusic();
  }

  function syncMusic() {
    var b = $("musicBtn");
    b.setAttribute("aria-pressed", audio.on ? "true" : "false");
    b.setAttribute("aria-label", audio.on ? "Оҳангро хомӯш кардан" : "Оҳангро фаъол кардан");
    b.querySelector("i").className = audio.on ? "fa-solid fa-volume-high" : "fa-solid fa-music";
  }

  /* Браузерҳо садоро то аввалин ламси экран намемонанд — интизор мешавем */
  function armMusic() {
    if (!C.music) return;
    musicOn();
    var start = function () {
      musicOn();
      window.removeEventListener("pointerdown", start);
      window.removeEventListener("keydown", start);
      window.removeEventListener("touchstart", start);
    };
    window.addEventListener("pointerdown", start);
    window.addEventListener("keydown", start);
    window.addEventListener("touchstart", start);
  }

  /* ---------- Пардаҳо ----------------------------------------------------- */

  var current = "act1";

  function show(id) {
    if (current === id) return;
    var from = $(current), to = $(id);
    from.classList.remove("is-live");
    to.classList.add("is-live");
    current = id;
    var focusable = to.querySelector("button:not([hidden])");
    if (focusable) wait(900, function () { focusable.focus({ preventScroll: true }); });
  }

  /* ---------- Пардаи 1: конверт ------------------------------------------- */

  var opened = false;

  function openEnvelope() {
    if (opened) return;
    opened = true;
    var env = $("envelope");
    env.classList.add("is-open");
    env.setAttribute("aria-expanded", "true");
    $("hint").textContent = "";
    boom();
    wait(calm ? 200 : 1700, function () {
      show("act2");
      wait(400, typeLetter);
    });
  }

  /* ---------- Пардаи 2: мактуб ҳарф ба ҳарф ------------------------------- */

  var typing = { done: false, line: 0, char: 0, node: null, timer: null };

  function typeLetter() {
    var box = $("type");
    box.innerHTML = "";
    typing.done = false;
    typing.line = 0;
    typing.char = 0;
    nextLine();
  }

  function nextLine() {
    if (typing.line >= C.letter.length) { finishTyping(); return; }
    var p = document.createElement("p");
    var span = document.createElement("span");
    var cur = document.createElement("i");
    cur.className = "cursor";
    p.appendChild(span);
    p.appendChild(cur);
    $("type").appendChild(p);
    typing.node = span;
    typing.char = 0;
    typeChar(p, cur);
  }

  function typeChar(p, cur) {
    var text = C.letter[typing.line];
    if (typing.char >= text.length) {
      cur.remove();
      typing.line++;
      typing.timer = setTimeout(nextLine, 520);
      timers.push(typing.timer);
      return;
    }
    var ch = text.charAt(typing.char);
    typing.node.textContent += ch;
    typing.char++;
    var extra = (ch === "," || ch === "—") ? 160 : (ch === "." || ch === "!" || ch === "?") ? 300 : 0;
    typing.timer = setTimeout(function () { typeChar(p, cur); }, C.typeSpeed + extra);
    timers.push(typing.timer);
  }

  function skipTyping() {
    if (typing.done) return;
    clearTimeout(typing.timer);
    var box = $("type");
    box.innerHTML = "";
    C.letter.forEach(function (line) {
      var p = document.createElement("p");
      p.textContent = line;
      box.appendChild(p);
    });
    typing.line = C.letter.length;
    finishTyping();
  }

  function finishTyping() {
    if (typing.done) return;
    typing.done = true;
    $("sign").classList.add("show");
    $("skipBtn").hidden = true;
    $("toReelBtn").hidden = false;
    wait(2600, function () { if (current === "act2") startReel(); });
  }

  /* ---------- Пардаи 3: монтажи аксҳо ------------------------------------- */

  var reel = { i: 0, playing: false, timer: null, slides: [], bars: [], total: 0, built: false };

  function buildReel() {
    var box = $("slides"), barBox = $("bars");
    reel.total = C.photos.length;

    C.photos.forEach(function (photo, n) {
      var slide = document.createElement("div");
      slide.className = "slide a" + ((n % 5) + 1);
      slide.style.setProperty("--pan", (C.slideDuration / 1000 + 1.6) + "s");

      var img = document.createElement("img");
      img.src = photo.src;
      img.alt = photo.caption || "Акс " + (n + 1);
      img.loading = n < 3 ? "eager" : "lazy";
      img.decoding = "async";
      img.addEventListener("error", function () {
        slide.classList.add("no-photo");
        slide.innerHTML = "<div><b>Акси " + (n + 1) + "</b>файли " + photo.src + " ёфт нашуд</div>";
      });
      slide.appendChild(img);
      box.appendChild(slide);
      reel.slides.push(slide);

      var bar = document.createElement("button");
      bar.className = "bar";
      bar.type = "button";
      bar.setAttribute("aria-label", "Акси " + (n + 1));
      bar.innerHTML = "<i></i>";
      bar.addEventListener("click", function () { goTo(n, true); });
      barBox.appendChild(bar);
      reel.bars.push(bar);
    });
    reel.built = true;
  }

  function goTo(n, byUser) {
    clearTimeout(reel.timer);

    if (n >= reel.total) { finale(); return; }
    reel.i = (n + reel.total) % reel.total;

    reel.slides.forEach(function (s, k) { s.classList.toggle("is-active", k === reel.i); });

    reel.bars.forEach(function (b, k) {
      b.classList.remove("now", "done");
      if (k < reel.i) b.classList.add("done");
    });

    var live = reel.bars[reel.i];
    live.style.setProperty("--dur", C.slideDuration + "ms");
    var fill = live.querySelector("i");
    fill.style.animation = "none";
    void fill.offsetWidth;
    fill.style.animation = "";

    if (byUser && reel.playing) pause();
    if (reel.playing && !calm) live.classList.add("now"); else live.classList.add("done");

    var cap = $("caption");
    cap.innerHTML = "";
    var span = document.createElement("span");
    span.textContent = C.photos[reel.i].caption || "";
    cap.appendChild(span);

    $("counter").textContent = (reel.i + 1) + " / " + reel.total;

    if (reel.playing) {
      reel.timer = setTimeout(function () { goTo(reel.i + 1); }, C.slideDuration);
      timers.push(reel.timer);
    }
  }

  function startReel() {
    show("act3");
    reel.playing = !calm;
    syncPlay();
    wait(500, function () { goTo(0); });
  }

  function pause() {
    reel.playing = false;
    clearTimeout(reel.timer);
    reel.bars.forEach(function (b) { b.classList.remove("now"); });
    reel.bars[reel.i].classList.add("done");
    syncPlay();
  }

  function play() {
    reel.playing = true;
    syncPlay();
    goTo(reel.i);
  }

  function syncPlay() {
    var b = $("playBtn");
    b.querySelector("i").className = reel.playing ? "fa-solid fa-pause" : "fa-solid fa-play";
    b.setAttribute("aria-label", reel.playing ? "Таваққуф" : "Давом додан");
  }

  /* ---------- Пардаи 4: табрикоти охирин ---------------------------------- */

  function finale() {
    reel.playing = false;
    clearTimeout(reel.timer);
    reel.bars.forEach(function (b) { b.classList.remove("now"); b.classList.add("done"); });
    show("act4");
    wait(700, function () { boom(160); });
    wait(1600, function () { boom(120); });
  }

  /* ---------- Аз нав ------------------------------------------------------ */

  function restart() {
    clearAll();
    clearTimeout(reel.timer);
    clearTimeout(typing.timer);
    opened = false;
    typing.done = false;
    reel.i = 0;
    reel.playing = false;
    reel.slides.forEach(function (s) { s.classList.remove("is-active"); });
    reel.bars.forEach(function (b) { b.classList.remove("now", "done"); });
    $("type").innerHTML = "";
    $("sign").classList.remove("show");
    $("skipBtn").hidden = false;
    $("toReelBtn").hidden = true;
    var env = $("envelope");
    env.classList.remove("is-open");
    env.setAttribute("aria-expanded", "false");
    $("hint").textContent = "кушода шуда истодааст…";
    show("act1");
    wait(C.autoOpenDelay, openEnvelope);
  }

  /* ---------- Рӯйдодҳо ---------------------------------------------------- */

  function wire() {
    var env = $("envelope");
    env.addEventListener("click", openEnvelope);
    env.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEnvelope(); }
    });

    $("skipBtn").addEventListener("click", skipTyping);
    $("toReelBtn").addEventListener("click", function () { clearAll(); startReel(); });

    $("nextBtn").addEventListener("click", function () { goTo(reel.i + 1, true); });
    $("prevBtn").addEventListener("click", function () { goTo(reel.i - 1, true); });
    $("playBtn").addEventListener("click", function () { reel.playing ? pause() : play(); });
    $("endBtn").addEventListener("click", finale);
    $("confettiBtn").addEventListener("click", function () { boom(140); });
    $("againBtn").addEventListener("click", restart);

    $("musicBtn").addEventListener("click", function () {
      audio.on ? musicOff() : musicOn();
    });

    document.addEventListener("keydown", function (e) {
      if (current === "act2" && (e.key === "Enter" || e.key === " ")) { skipTyping(); }
      if (current !== "act3") return;
      if (e.key === "ArrowRight") goTo(reel.i + 1, true);
      if (e.key === "ArrowLeft") goTo(reel.i - 1, true);
    });

    document.addEventListener("visibilitychange", function () {
      if (document.hidden) {
        if (reel.playing) pause();
        if (audio.on) musicOff();
      }
    });

    var x0 = null, stage = $("stage");
    stage.addEventListener("touchstart", function (e) { x0 = e.changedTouches[0].clientX; }, { passive: true });
    stage.addEventListener("touchend", function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 48) goTo(reel.i + (dx < 0 ? 1 : -1), true);
      x0 = null;
    }, { passive: true });
  }

  /* ---------- Оғоз -------------------------------------------------------- */

  fillText();
  makeSky();
  buildReel();
  syncPlay();
  syncMusic();
  wire();
  armMusic();
  wait(calm ? 300 : C.autoOpenDelay, openEnvelope);
})();
