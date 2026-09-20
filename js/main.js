/* ==========================================================
   PHANTOM PORTFOLIO — interaction engine
   intro · menu · slash transitions · reveals · SFX · GitHub
   ========================================================== */
(function () {
  "use strict";

  var GH_HANDLES = ["gustaveems", "totallynotgus"];
  var CONTACT_EMAIL = "GusatveAMS@gmail.com";

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------------- SFX (WebAudio, zero assets) ---------------- */
  var Sfx = {
    ctx: null,
    muted: localStorage.getItem("p5-muted") === "1",
    boot: function () {
      if (!this.ctx) {
        try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
      }
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume();
    },
    tone: function (freq, dur, type, vol, slideTo) {
      if (this.muted || !this.ctx) return;
      var t = this.ctx.currentTime;
      var o = this.ctx.createOscillator();
      var g = this.ctx.createGain();
      o.type = type || "square";
      o.frequency.setValueAtTime(freq, t);
      if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
      g.gain.setValueAtTime(vol || 0.04, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(this.ctx.destination);
      o.start(t); o.stop(t + dur + 0.02);
    },
    hover: function () { this.tone(720, 0.06, "square", 0.025); },
    confirm: function () {
      this.tone(520, 0.07, "square", 0.05);
      var s = this; setTimeout(function () { s.tone(880, 0.09, "square", 0.05); }, 60);
    },
    whoosh: function () { this.tone(1400, 0.22, "sawtooth", 0.03, 120); },
    reveal: function () { this.tone(300, 0.12, "triangle", 0.03, 600); }
  };

  var soundBtn = $("#soundToggle");
  function paintSound() {
    if (!soundBtn) return;
    soundBtn.classList.toggle("muted", Sfx.muted);
    soundBtn.textContent = Sfx.muted ? "♪̸" : "♪";
    soundBtn.title = Sfx.muted ? "Sound off" : "Sound on";
  }
  paintSound();
  if (soundBtn) soundBtn.addEventListener("click", function () {
    Sfx.muted = !Sfx.muted;
    localStorage.setItem("p5-muted", Sfx.muted ? "1" : "0");
    paintSound();
    if (!Sfx.muted) { Sfx.boot(); Sfx.confirm(); }
  });

  document.addEventListener("pointerover", function (e) {
    var el = (e.target && e.target.closest) ? e.target.closest("[data-sfx]") : null;
    if (!el) return;
    if (el.dataset.sfx === "hover") Sfx.hover();
    else if (el.dataset.sfx === "confirm") Sfx.confirm();
  });

  /* ---------------- INTRO ---------------- */
  var intro = $("#intro");
  var entered = false;
  function enter() {
    if (entered) return;
    entered = true;
    Sfx.boot(); Sfx.whoosh();
    intro.classList.add("gone");
    document.body.style.overflow = "";
    setTimeout(function () { intro.remove(); }, 1200);
    revealScan();
  }
  if (intro) {
    document.body.style.overflow = "hidden";
    intro.addEventListener("click", enter);
    document.addEventListener("keydown", function (e) {
      if (!entered && (e.key === "x" || e.key === "X" || e.key === "Enter" || e.key === " ")) enter();
    });
  }

  /* ---------------- MENU ---------------- */
  var menu = $("#menu");
  var menuBtn = $("#menuToggle");
  var menuOpen = false;
  function setMenu(open) {
    menuOpen = !!open;
    menu.classList.toggle("open", menuOpen);
    menu.setAttribute("aria-hidden", menuOpen ? "false" : "true");
    menuBtn.classList.toggle("open", menuOpen);
    menuBtn.setAttribute("aria-expanded", menuOpen ? "true" : "false");
    menuBtn.setAttribute("aria-label", menuOpen ? "Close menu" : "Open menu");
  }
  menuBtn.addEventListener("click", function () { setMenu(!menuOpen); });
  menu.addEventListener("click", function (e) {
    if (e.target === menu || e.target.classList.contains("menu__halftone")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "b" || e.key === "B" || e.key === "Escape") setMenu(false);
  });

  /* ---------------- SLASH WIPE + NAV ---------------- */
  var wipe = $("#slashWipe");
  var wipeWord = $(".slash-wipe__word", wipe);
  function slashTo(hash, label) {
    wipeWord.textContent = (label || hash).replace("#", "").toUpperCase();
    wipe.classList.remove("go", "go2");
    void wipe.offsetWidth;
    wipe.classList.add("go");
    Sfx.whoosh();
    setTimeout(function () {
      var target = $(hash);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      wipe.classList.add("go2");
    }, 360);
    setTimeout(function () {
      wipe.style.transition = "none";
      wipe.classList.remove("go", "go2");
      void wipe.offsetWidth;
      wipe.style.transition = "";
    }, 900);
  }
  $$("[data-nav]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      var hash = a.getAttribute("href");
      if (!hash || hash.charAt(0) !== "#") return;
      e.preventDefault();
      setMenu(false);
      if (hash === "#hero") { window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      slashTo(hash, a.textContent);
    });
  });

  /* active nav highlight */
  var navLinks = $$(".menu__list a");
  var sections = navLinks.map(function (a) { return $(a.getAttribute("href")); });
  function markActive() {
    var y = window.scrollY + window.innerHeight * 0.35;
    var best = -1;
    sections.forEach(function (s, i) { if (s && s.offsetTop <= y) best = i; });
    navLinks.forEach(function (a, i) { a.classList.toggle("active", i === best); });
  }
  window.addEventListener("scroll", markActive, { passive: true });
  markActive();

  /* ---------------- REVEAL ON SCROLL ---------------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("on");
        io.unobserve(en.target);
      }
    });
  }, { threshold: 0.12 });
  function revealScan() { $$(".reveal").forEach(function (el) { io.observe(el); }); }
  if (!intro) revealScan();

  /* ---------------- HUD DATE ---------------- */
  var d = new Date();
  var months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  var hudDate = $("#hudDate");
  if (hudDate) hudDate.textContent = months[d.getMonth()] + " " + d.getDate();
  var yearEl = $("#year");
  if (yearEl) yearEl.textContent = d.getFullYear();

  /* ---------------- GITHUB ---------------- */
  function ghFetch(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  }
  function fmt(n) { return n >= 1000 ? (n / 1000).toFixed(1).replace(".0", "") + "k" : String(n); }

  function renderProfileCard(handle, profile) {
    var box = $('.conf__stats[data-gh="' + handle + '"]');
    if (!box) return;
    if (!profile) {
      box.innerHTML = "<span class='lbl'>AWAITING FIRST HEIST…</span>";
      return;
    }
    box.innerHTML =
      "<span>★ " + fmt(profile.public_repos) + " <i class='lbl'>REPOS</i></span>" +
      "<span>♥ " + fmt(profile.followers) + " <i class='lbl'>FOLLOWERS</i></span>" +
      "<span class='lbl'>" + (profile.login || handle) + "</span>";
  }

  function renderRepos(handle, repos) {
    var grid = $("#repoGrid");
    if (!grid) return;
    repos.forEach(function (r) {
      var a = document.createElement("a");
      a.className = "repo";
      a.href = r.html_url; a.target = "_blank"; a.rel = "noopener";
      a.innerHTML =
        "<b>" + r.name + "</b>" +
        "<p>" + (r.description || "No description — stealth mode.") + "</p>" +
        "<span>★ " + r.stargazers_count +
        (r.language ? " <i class='lang'>⬤ " + r.language + "</i>" : "") + "</span>";
      grid.appendChild(a);
    });
  }

  function loadGitHub() {
    var status = $("#repoStatus");
    var any = false;
    Promise.all(GH_HANDLES.map(function (h) {
      return Promise.all([
        ghFetch("https://api.github.com/users/" + h).catch(function () { return null; }),
        ghFetch("https://api.github.com/users/" + h + "/repos?sort=updated&per_page=8").catch(function () { return []; })
      ]).then(function (res) {
        var profile = res[0], repos = res[1];
        renderProfileCard(h, profile);
        if (profile && repos && repos.length) { any = true; renderRepos(h, repos.slice(0, 6)); }
      });
    })).then(function () {
      if (status) {
        status.innerHTML = any
          ? "LIVE FEED SYNCED ✦ latest repos raided from the Metaverse."
          : "NO PUBLIC REPOS YET — the phantom is still coding in stealth. Raid returns soon.";
      }
    });
  }
  loadGitHub();
})();
