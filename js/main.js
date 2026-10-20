/* ==========================================================
   PHANTOM PORTFOLIO — interaction engine
   intro · CV view · menu · slash transitions · reveals · SFX · GitHub
   ========================================================== */
(function () {
  "use strict";

  var GH_HANDLES = ["gustaveems", "totallynotgus"];
  var root = document.documentElement;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  function store(key, val) {
    try {
      if (val === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, val);
    } catch (e) { return null; }
  }
  /* shortcuts must never fire while someone is typing or using modifiers */
  function isTyping(e) {
    var t = e.target;
    return e.ctrlKey || e.metaKey || e.altKey ||
      (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)));
  }
  var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- SFX (WebAudio, zero assets) — off by default ---------------- */
  var Sfx = {
    ctx: null,
    muted: store("p5-muted") !== "0",
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
    whoosh: function () { this.tone(1400, 0.22, "sawtooth", 0.03, 120); }
  };

  var soundBtn = $("#soundToggle");
  function paintSound() {
    if (!soundBtn) return;
    soundBtn.classList.toggle("muted", Sfx.muted);
    soundBtn.textContent = Sfx.muted ? "♪̸" : "♪";
    soundBtn.title = Sfx.muted ? "Sound off" : "Sound on";
    soundBtn.setAttribute("aria-pressed", Sfx.muted ? "false" : "true");
  }
  paintSound();
  if (soundBtn) soundBtn.addEventListener("click", function () {
    Sfx.muted = !Sfx.muted;
    store("p5-muted", Sfx.muted ? "1" : "0");
    paintSound();
    if (!Sfx.muted) { Sfx.boot(); Sfx.confirm(); }
  });

  /* hover blips only when entering an element, confirm only on click */
  document.addEventListener("pointerover", function (e) {
    var el = (e.target && e.target.closest) ? e.target.closest('[data-sfx="hover"]') : null;
    if (!el || (e.relatedTarget && el.contains(e.relatedTarget))) return;
    Sfx.hover();
  });
  document.addEventListener("click", function (e) {
    var el = (e.target && e.target.closest) ? e.target.closest('[data-sfx="confirm"]') : null;
    if (el) { Sfx.boot(); Sfx.confirm(); }
  });

  /* ---------------- REVEAL ON SCROLL ---------------- */
  /* bottom margin fires reveals before cards enter the viewport, so fast scrolling never shows a blank screen */
  var io = "IntersectionObserver" in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add("on");
        io.unobserve(en.target);
      }
    });
  }, { rootMargin: "0px 0px 25% 0px", threshold: 0 }) : null;
  $$(".reveal").forEach(function (el) {
    if (io) io.observe(el); else el.classList.add("on");
  });

  /* ---------------- INTRO (first visit only, auto-plays, never blocks) ---------------- */
  var intro = $("#intro");
  if (intro) {
    var skipIntro = store("p5-entered") === "1" || reducedMotion || root.classList.contains("cv-mode");
    if (skipIntro) {
      intro.remove();
    } else {
      store("p5-entered", "1");
      var dismiss = function () {
        if (!intro) return;
        intro.classList.add("gone");
        var node = intro; intro = null;
        setTimeout(function () { node.remove(); }, 1200);
      };
      setTimeout(dismiss, 1300);
      intro.addEventListener("click", dismiss);
      document.addEventListener("keydown", dismiss, { once: true });
    }
  }

  /* ---------------- CV VIEW (recruiter mode) ---------------- */
  var cvToggle = $("#cvToggle");
  function setCv(on, opts) {
    opts = opts || {};
    root.classList.toggle("cv-mode", on);
    if (cvToggle) {
      cvToggle.textContent = on ? "FULL SITE" : "CV VIEW";
      cvToggle.setAttribute("aria-pressed", on ? "true" : "false");
    }
    if (opts.history !== false) {
      var url = location.pathname + location.search + (on ? "#cv" : "");
      history.replaceState(null, "", url);
    }
    if (opts.scroll !== false) window.scrollTo(0, 0);
  }
  setCv(root.classList.contains("cv-mode"), { history: false, scroll: false });
  if (cvToggle) cvToggle.addEventListener("click", function () {
    setCv(!root.classList.contains("cv-mode"));
  });
  $$('a[href="#cv"]').forEach(function (a) {
    a.addEventListener("click", function (e) { e.preventDefault(); setCv(true); });
  });
  window.addEventListener("hashchange", function () {
    if (location.hash === "#cv") setCv(true, { history: false });
  });

  /* printing always uses the clean CV layout */
  var cvBeforePrint = false;
  window.addEventListener("beforeprint", function () {
    cvBeforePrint = root.classList.contains("cv-mode");
    if (!cvBeforePrint) setCv(true, { history: false, scroll: false });
  });
  window.addEventListener("afterprint", function () {
    if (!cvBeforePrint) setCv(false, { history: false, scroll: false });
  });
  var printBtn = $("#printBtn");
  if (printBtn) printBtn.addEventListener("click", function () { window.print(); });

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
    if (menuOpen) { var first = $(".menu__list a", menu); if (first) first.focus(); }
  }
  menuBtn.addEventListener("click", function () { setMenu(!menuOpen); });
  menu.addEventListener("click", function (e) {
    if (e.target === menu || e.target.classList.contains("menu__halftone")) setMenu(false);
  });
  document.addEventListener("keydown", function (e) {
    if (!menuOpen || isTyping(e)) return;
    if (e.key === "Escape" || e.key === "b" || e.key === "B") { setMenu(false); menuBtn.focus(); }
  });

  /* ---------------- SLASH WIPE + NAV ---------------- */
  var wipe = $("#slashWipe");
  var wipeWord = $(".slash-wipe__word", wipe);
  function jumpTo(hash) {
    var target = $(hash);
    if (target) target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
  }
  function slashTo(hash, label) {
    if (reducedMotion || root.classList.contains("cv-mode")) { jumpTo(hash); return; }
    wipeWord.textContent = label || hash.replace("#", "").toUpperCase();
    wipe.classList.remove("go", "go2");
    void wipe.offsetWidth;
    wipe.classList.add("go");
    Sfx.whoosh();
    setTimeout(function () {
      jumpTo(hash);
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
      if (hash === "#hero") { window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }); return; }
      slashTo(hash, a.dataset.label);
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

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function renderProfileCard(handle, profile) {
    var box = $('.conf__stats[data-gh="' + handle + '"]');
    if (!box) return;
    box.textContent = "";
    if (!profile) {
      box.appendChild(el("span", "lbl", "repos & commits ↗"));
      return;
    }
    var repos = el("span", null, "★ " + fmt(profile.public_repos) + " ");
    repos.appendChild(el("i", "lbl", "REPOS"));
    var fols = el("span", null, "♥ " + fmt(profile.followers) + " ");
    fols.appendChild(el("i", "lbl", "FOLLOWERS"));
    box.appendChild(repos);
    box.appendChild(fols);
  }

  function renderRepos(repos) {
    var grid = $("#repoGrid");
    if (!grid) return;
    repos.forEach(function (r) {
      var a = document.createElement("a");
      a.className = "repo";
      a.href = r.html_url; a.target = "_blank"; a.rel = "noopener";
      a.appendChild(el("b", null, r.name));
      a.appendChild(el("p", null, r.description || "No description yet."));
      var stats = el("span", null, "★ " + r.stargazers_count);
      if (r.language) {
        stats.appendChild(document.createTextNode(" "));
        stats.appendChild(el("i", "lang", "⬤ " + r.language));
      }
      a.appendChild(stats);
      grid.appendChild(a);
    });
  }

  function loadGitHub() {
    var status = $("#repoStatus");
    var any = false, failed = false;
    Promise.all(GH_HANDLES.map(function (h) {
      return Promise.all([
        ghFetch("https://api.github.com/users/" + h).catch(function () { failed = true; return null; }),
        ghFetch("https://api.github.com/users/" + h + "/repos?sort=updated&per_page=8").catch(function () { return []; })
      ]).then(function (res) {
        var profile = res[0], repos = res[1];
        renderProfileCard(h, profile);
        if (profile && repos && repos.length) { any = true; renderRepos(repos.filter(function (r) { return !r.fork; }).slice(0, 6)); }
      });
    })).then(function () {
      if (!status) return;
      status.textContent = "";
      if (any) { status.textContent = "Most recently updated public repositories, synced live from GitHub."; return; }
      status.textContent = failed ? "GitHub is rate-limiting this browser right now — browse " : "No public repositories to show yet — browse ";
      var a = el("a", "inline-link", "github.com/gustaveems");
      a.href = "https://github.com/gustaveems"; a.target = "_blank"; a.rel = "noopener";
      status.appendChild(a);
      status.appendChild(document.createTextNode(" directly."));
    });
  }
  loadGitHub();
})();
