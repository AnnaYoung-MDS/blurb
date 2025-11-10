(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const on = (el, ev, fn, opts) => {
    if (!el) return;
    if (Array.isArray(el) || (el instanceof NodeList)) {
      el.forEach((n) => n && n.addEventListener(ev, fn, opts));
    } else {
      el.addEventListener(ev, fn, opts);
    }
  };
  const setText = (el, text) => { if (el) el.textContent = text ?? ""; };

  const toStr = (v) => (v == null ? "" : String(v));
  const safeTrim = (v) => toStr(v).trim();
  const val = (el) => safeTrim(el?.value);
  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  const debounce = (fn, ms = 250) => { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); }; };

  const MIN_HOBBIES = 3;
  const MIN_GENRES  = 3;
  let onboardingLocked = false;

  const HOBBY_EMOJI = {
    gaming:"🎮", music:"🎵", art:"🎨", sports:"🏀", fashion:"🧢", coding:"💻",
    animals:"🐾", writing:"✍️", travel:"✈️", movies:"🎬", photography:"📸",
    baking:"🧁", skateboarding:"🛹", dance:"💃", fitness:"💪", makeup:"💄",
    nature:"🌿", collecting:"🧩", boardgames:"🎲", streaming:"📱",
  };

  const GENRE_EMOJI = {
    fantasy:"🐉", romance:"💘", mystery:"🕵️", dystopian:"🏙️", scifi:"🚀", graphic:"🎴",
    horror:"👻", realistic:"📖", adventure:"🧭", sports:"🏅", "contemporary-ya":"🎒",
    paranormal:"🔮", lgbtqia:"🏳️‍🌈", humor:"😄", fanfiction:"✍️", poetry:"🪶",
  };

  const els = {
    splash:        $("#splash"),
    funLine:       $("#funLine"),
    progressBar:   $("#progressBar"),
    progressText:  $("#progressText"),
    authRoot:      $("#auth"),
    sparkles:      $("#sparkles"),

    tabSignup:     $("#tab-signup"),
    tabSignin:     $("#tab-signin"),
    panelSignup:   $("#panel-signup"),
    panelSignin:   $("#panel-signin"),

    suUsername:    $("#su-username"),
    suEmail:       $("#su-email"),
    suPassword:    $("#su-password"),
    suConfirm:     $("#su-confirm"),
    suSubmit:      $("#su-submit"),
    suStatus:      $("#su-status"),
    usernameHint:  $("#usernameHint"),
    confirmHint:   $("#confirmHint"),

    siEmail:       $("#si-email"),
    siPassword:    $("#si-password"),
    siSubmit:      $("#si-submit"),
    siStatus:      $("#si-status"),

    prefsRoot:     $("#panel-preferences"),
    prefsBack:     $("#prefsBack"),
    stepHobbies:   $("#pref-step-hobbies"),
    stepGenres:    $("#pref-step-genres"),
    stepAvatars:   $("#pref-step-avatars"),

    nextToGenres:  $("#nextToGenres"),
    backToHobbies: $("#backToHobbies"),
    backToGenres:  $("#backToGenres"),
    savePrefs:     $("#savePrefs"),
    prefsStatus:   $("#prefsStatus"),

    hobbyChoices:  $("#hobbyChoices"),
    hobbyCount:    $("#hobbyCount"),
    hobbyProgress: $("#hobbyProgress"),

    genreChoices:  $("#genreChoices"),
    genreCount:    $("#genreCount"),
    genreProgress: $("#genreProgress"),

    avatarChoices: $("#avatarChoices"),
    avatarHint:    $("#avatarHint"),
    avatarProgress:$("#avatarProgress"),
    finishBtn:     $("#finishOnboarding"),
    avatarStatus:  $("#avatarStatus"),
  };

  function popEmojiFrom(el, emoji = "✨") {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const d = document.createElement("div");
    d.className = "float-emoji";
    d.textContent = emoji;
    d.style.left = `${r.left + r.width / 2}px`;
    d.style.top  = `${r.top  + r.height / 2}px`;
    d.style.setProperty("--dx", `${Math.round(Math.random() * 40 - 20)}px`);
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 800);
  }

  /* Loading */
  const funPhrases = [
    'Opening the library doors… 📚',
    'Skimming the preface…',
    'Dusting off the covers…',
    'Setting the table of contents…',
    'Bookmarking your place… 🔖',
    'Sharpening pencils for margin notes… ✍️',
    'Stacking fresh chapters…',
    'Brewing a plot twist…',
    'Checking out your library card…',
  ];
  let phraseIdx = 0;
  const rotatePhrase = () => setText(els.funLine, funPhrases[(++phraseIdx) % funPhrases.length]);

  function setProgress(pct) {
    const p = clamp(pct, 0, 100);
    if (els.progressBar) els.progressBar.style.width = `${p}%`;
    setText(els.progressText, `${Math.round(p)}%`);
    if (p >= 100) {
      els.splash?.closest('.page')?.remove();
      els.authRoot?.removeAttribute('hidden');
      runSparklesOnce();
    }
  }

  (function startLoader() {
    if (!els.progressBar) return;
    setText(els.funLine, funPhrases[0]);
    let pct = 0;
    const tick = () => {
      pct += Math.random() * 18 + 6;
      rotatePhrase();
      setProgress(pct);
      if (pct < 100) setTimeout(tick, 420);
    };
    setTimeout(tick, 420);
  })();

  (function setOverallStepProgress() {
    const current = 2, total = 4;
    const pct = Math.min(100, (current / Math.max(1, total)) * 100);
    setText($("#flowStep"), String(current));
    setText($("#flowTotal"), String(total));
    const fillEl = els.stepHobbies?.querySelector('.flow-bar .flow-fill');
    if (fillEl) fillEl.style.width = pct + '%';
  })();

  /* Sparkles effect */
  function runSparklesOnce() {
    const layer = els.sparkles;
    if (!layer) return;
    const MAX = 30;
    const spawn = () => {
      const star = document.createElement('div');
      star.className = 'star';
      star.textContent = '✦';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.opacity = '0';
      star.style.transition = 'opacity 300ms ease, transform 1200ms ease';
      layer.appendChild(star);
      requestAnimationFrame(() => { star.style.opacity = '1'; star.style.transform = 'translateY(-6px)'; });
      setTimeout(() => star.remove(), 1400);
    };
    const interval = setInterval(() => { if (layer.childElementCount < MAX) spawn(); }, 160);
    setTimeout(() => { clearInterval(interval); setTimeout(() => layer.replaceChildren(), 1500); }, 3000);
  }

  /* Sign up/Sign in */
  function showPanel(panelToShow, panelToHide, tabToSelect, tabToDeselect) {
    if (panelToShow)  panelToShow.hidden = false;
    if (panelToHide)  panelToHide.hidden = true;
    tabToSelect?.classList.add('is-active');
    tabToDeselect?.classList.remove('is-active');
    tabToSelect?.setAttribute('aria-selected', 'true');
    tabToDeselect?.setAttribute('aria-selected', 'false');
  }

  function activateTab(which) {
    const isSignup = which === 'signup';
    showPanel(isSignup ? els.panelSignup : els.panelSignin,
              isSignup ? els.panelSignin : els.panelSignup,
              isSignup ? els.tabSignup   : els.tabSignin,
              isSignup ? els.tabSignin   : els.tabSignup);
  }

  on(els.tabSignup, 'click', () => activateTab('signup'));
  on(els.tabSignin, 'click', () => activateTab('signin'));
  $$('button[data-switch]').forEach(btn => on(btn, 'click', () => activateTab(btn.getAttribute('data-switch'))));

  /* Show/Hide password */
  on(document, 'click', (e) => {
    const btn = e.target.closest('button[data-toggle]');
    if (!btn) return;
    e.preventDefault();
    const id = btn.getAttribute('data-toggle');
    const input = id ? document.getElementById(id) : null;
    if (!input) return;

    const isHidden = input.type === 'password';
    const start = input.selectionStart, end = input.selectionEnd;
    try { input.type = isHidden ? 'text' : 'password'; }
    catch {
      const clone = input.cloneNode(true);
      clone.type = isHidden ? 'text' : 'password';
      input.parentNode.replaceChild(clone, input);
    }
    btn.textContent = isHidden ? 'Hide' : 'Show';
    btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
    btn.setAttribute('aria-pressed', String(isHidden));
    setTimeout(() => {
      const target = id && document.getElementById(id);
      target?.focus();
      if (start != null && end != null && target?.setSelectionRange) {
        try { target.setSelectionRange(start, end); } catch {}
      }
    }, 0);
  });

  /* Username validation & availability */
  function validUsernameFormat(u) {
    if (!u) return false;
    if (u.length < 3 || u.length > 24) return false;
    return /^[a-zA-Z0-9_.]+$/.test(u);
  }

  async function checkUsername(u) {
    u = String(u ?? '').trim();
    if (!u) return setText(els.usernameHint, '');
    if (!validUsernameFormat(u)) return setText(els.usernameHint, 'Usernames are 3–24 chars: letters, numbers, . or _');
    if (!window.FirebaseAPI?.isUsernameAvailable) return; // skip if API not wired
    try {
      const res = await window.FirebaseAPI.isUsernameAvailable(u);
      const ok = !!(res?.available ?? res);
      setText(els.usernameHint, ok ? '✓ Username is available' : 'That username is taken.');
    } catch { setText(els.usernameHint, ''); }
  }

  const checkUsernameDebounced = debounce(checkUsername, 300);
  on(els.suUsername, 'input', (e) => checkUsernameDebounced(String(e?.target?.value ?? '').trim()));

  /* Password strength & confirmation */
  const reqList = $('#su-reqs');
  const reqLen  = reqList?.querySelector('[data-rule="len"]');
  const reqMix  = reqList?.querySelector('[data-rule="mix"]');
  const reqCase = reqList?.querySelector('[data-rule="case"]');
  const suStrengthFill = $('#su-strength');

  function scorePassword(pw) {
    pw = toStr(pw); let s = 0;
    if (pw.length >= 8) s++;
    if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    return s;
  }

  function updateReqs(pw) {
    pw = toStr(pw);
    reqLen?.classList.toggle('ok', pw.length >= 8);
    reqMix?.classList.toggle('ok', /[A-Za-z]/.test(pw) && /\d/.test(pw));
    reqCase?.classList.toggle('ok', /[a-z]/.test(pw) && /[A-Z]/.test(pw));
  }

  function updateStrength(pw) {
    const s = scorePassword(pw);
    if (suStrengthFill) suStrengthFill.style.width = `${(s / 3) * 100}%`;
  }

  function validateConfirm() {
    const pw = toStr(els.suPassword?.value);
    const conf = toStr(els.suConfirm?.value);
    const ok = conf.length > 0 && conf === pw;
    setText(els.confirmHint, ok ? 'Passwords match.' : (conf ? 'Passwords do not match.' : ''));
    return ok;
  }

  on(els.suPassword, 'input', (e) => { const pw = toStr(e?.target?.value); updateReqs(pw); updateStrength(pw); validateConfirm(); });
  on(els.suConfirm,  'input', validateConfirm);

  function showAuthCard(force = false) {
    if (onboardingLocked && !force) return; // only block when not forced
    if (els.authRoot) els.authRoot.hidden = false;
    if (els.prefsRoot) els.prefsRoot.hidden = true;
  }

  function openOnboardingHobbies() {
    onboardingLocked = true;
    if (els.authRoot) els.authRoot.hidden = true;
    if (els.prefsRoot) els.prefsRoot.hidden = false;
    if (els.stepHobbies) els.stepHobbies.hidden = false;
    if (els.stepGenres)  els.stepGenres.hidden  = true;
    els.prefsRoot?.querySelector('#hobbyChoices .chip')?.focus();
  }

  on($('#panel-signup'), 'submit', async (e) => {
    e.preventDefault();
    const username = val(els.suUsername);
    const email    = val(els.suEmail);
    const pw       = toStr(els.suPassword?.value);

    const strong = scorePassword(pw) >= 3;
    const match  = validateConfirm();
    const termsOK = $('#su-terms') ? !!$('#su-terms').checked : true;

    if (!strong || !match || !termsOK) return setText(els.suStatus, 'Please complete all requirements.');

    if (els.suSubmit) els.suSubmit.disabled = true;
    setText(els.suStatus, 'Creating your account…');
    openOnboardingHobbies();

    try {
      let user;
      if (window.FirebaseAPI?.signUp) {
        user = await window.FirebaseAPI.signUp(email, pw, { username });
      } else {
        await new Promise((r) => setTimeout(r, 900));
        user = { email };
      }
      setText(els.suStatus, `Welcome, ${user.email ?? 'reader'}!`);
    } catch (err) {
      setText(els.suStatus, err?.message ?? 'Sign-up failed.');
      showAuthCard();
    } finally {
      if (els.suSubmit) els.suSubmit.disabled = false;
    }
  });

  on($('#panel-signin'), 'submit', async (e) => {
    e.preventDefault();
    const email = val(els.siEmail);
    const pw    = toStr(els.siPassword?.value);

    setText(els.siStatus, pw ? 'Signing you in…' : 'Enter your password.');
    if (!pw) return;

    if (els.siSubmit) els.siSubmit.disabled = true;
    try {
      let user;
      if (window.FirebaseAPI?.signIn) {
        user = await window.FirebaseAPI.signIn(email, pw);
      } else {
        await new Promise((r) => setTimeout(r, 700));
        user = { email };
      }
      setText(els.siStatus, `Welcome back, ${user.email ?? 'reader'}!`);
    } catch (err) {
      setText(els.siStatus, err?.message ?? 'Could not sign in.');
    } finally {
      if (els.siSubmit) els.siSubmit.disabled = false;
    }
  });

  /* Preferences flow (Hobbies - Genres - Avatars) */
  function setStep(n) {
    if (els.stepHobbies)  els.stepHobbies.hidden  = n !== 1;
    if (els.stepGenres)   els.stepGenres.hidden   = n !== 2;
    if (els.stepAvatars)  els.stepAvatars.hidden  = n !== 4; // keeping numbering to match UI copy
  }

  function ensureProgressUI(stepRoot, countId, progressId, min) {
    if (!stepRoot) return;
    let progress = stepRoot.querySelector('.pref-progress');
    if (!progress) {
      progress = document.createElement('div');
      progress.className = 'pref-progress';
      progress.innerHTML = `
        <span id="${countId}" class="pref-count">Selected: 0/${min}</span>
        <div class="pill"><div id="${progressId}" class="pill-fill" style="width:0%"></div></div>
      `;
      const chips = stepRoot.querySelector('.chip-group');
      (chips && chips.parentNode ? chips.parentNode : stepRoot).insertBefore(progress, chips || stepRoot.firstChild);
    } else {
      const label = progress.querySelector(`#${countId}`);
      if (label) label.textContent = `Selected: 0/${min}`;
    }
  }

  function initChipGroup(group, opts = {}) {
    if (!group) return { values: [], max: 0 };
    const rawMax = opts.max === Infinity ? Infinity : (group.dataset.max || String(opts.max ?? 5));
    const max = rawMax === Infinity ? Infinity : parseInt(String(rawMax), 10);
    const min = parseInt(String(opts.min ?? 0), 10);
    const values = new Set();

    const countEl = opts.countEl || null;
    const fillEl  = opts.fillEl  || null;
    const nextBtn = opts.nextBtn || null;

    function updateProgress() {
      if (countEl) setText(countEl, `Selected: ${values.size}/${min}`);
      if (fillEl && min > 0) fillEl.style.width = `${Math.min(100, (values.size / min) * 100)}%`;
      if (nextBtn) nextBtn.disabled = values.size < min;
    }
    updateProgress();

    on(group, 'click', (e) => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      const v = btn.dataset.value; if (!v) return;
      if (btn.classList.contains('selected')) {
        btn.classList.remove('selected'); values.delete(v);
      } else if (max === Infinity || values.size < max) {
        btn.classList.add('selected'); values.add(v);
        const map = group.id === 'genreChoices' ? GENRE_EMOJI : HOBBY_EMOJI;
        popEmojiFrom(btn, map[v] || '✨');
      }
      updateProgress();
      // Instant-save: persist selections as user clicks
      try {
        const key = group.id === 'genreChoices' ? 'selectedGenres' : 'selectedHobbies';
        localStorage.setItem(key, JSON.stringify(Array.from(values)));
      } catch {}
      // If the book rail exists, repopulate immediately
      try {
        if (typeof populateRail === 'function') populateRail();
      } catch {}
    
    });

    return { get values() { return Array.from(values); }, min, max };
  }

  if (els.nextToGenres) els.nextToGenres.disabled = true;
  const hobbies = initChipGroup(els.hobbyChoices, {
    min: MIN_HOBBIES,
    max: Infinity,
    countEl: els.hobbyCount,
    fillEl: els.hobbyProgress,
    nextBtn: els.nextToGenres,
  });

  on(els.nextToGenres, 'click', (e) => {
    e.preventDefault();
    if (hobbies.values.length >= MIN_HOBBIES) {
      ensureProgressUI(els.stepGenres, 'genreCount', 'genreProgress', MIN_GENRES);
      if (!window.__genresInitDone) {
        window.__genresInitDone = true;
        if (els.savePrefs) els.savePrefs.disabled = true;
        window.__genresGroup = initChipGroup(els.genreChoices, {
          min: MIN_GENRES,
          max: Infinity,
          countEl: els.genreCount,
          fillEl: els.genreProgress,
          nextBtn: els.savePrefs,
        });
      }
      setStep(2);
      els.stepGenres?.querySelector('.pref-title')?.focus?.();
      els.stepGenres?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      console.log('Switched to Genres:', { hobbiesChosen: hobbies.values.length });
    }
  });

  (function initGenresJustInCase() {
    ensureProgressUI(els.stepGenres, 'genreCount', 'genreProgress', MIN_GENRES);
    if (!window.__genresInitDone) {
      window.__genresInitDone = true;
      if (els.savePrefs) els.savePrefs.disabled = true;
      window.__genresGroup = initChipGroup(els.genreChoices, {
        min: MIN_GENRES,
        max: Infinity,
        countEl: els.genreCount,
        fillEl: els.genreProgress,
        nextBtn: els.savePrefs,
      });
    }
  })();

  on(els.backToHobbies, 'click', () => setStep(1));

  /* Avatars */
  function goToAvatars() {
    setStep(4);

    const grid = els.avatarChoices;
    const hero = document.getElementById('avatarHeroEmoji');

    if (grid && hero) {
      const firstFree = grid.querySelector('.avatar-card:not(.is-locked) .emoji');
      if (firstFree) {
        hero.textContent = firstFree.textContent.trim();
        hero.classList.remove('animate');
        void hero.offsetWidth;
        hero.classList.add('animate');
      }
    }
  }

  (() => {
    const avatarGrid  = els.avatarChoices;
    const heroEmoji   = document.getElementById('avatarHeroEmoji');
    const continueBtn = els.finishBtn;

    if (!avatarGrid || !continueBtn) return; 

    let selectedAvatarId = null;

    avatarGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.avatar-card');
      if (!card || card.classList.contains('is-locked')) return; 

      avatarGrid.querySelectorAll('.avatar-card').forEach(btn => {
        btn.classList.remove('selected');
        btn.setAttribute('aria-pressed', 'false');
      });

      card.classList.add('selected');
      card.setAttribute('aria-pressed', 'true');
      selectedAvatarId = card.dataset.id;

      const emojiSpan = card.querySelector('.emoji');
      if (emojiSpan && heroEmoji) {
        heroEmoji.textContent = emojiSpan.textContent.trim();
        heroEmoji.classList.remove('animate');
        void heroEmoji.offsetWidth; 
        heroEmoji.classList.add('animate');
      }

      continueBtn.disabled = false;
    });

    continueBtn.addEventListener('click', () => {
      if (!selectedAvatarId) return;
      try { localStorage.setItem('blurb:selectedAvatar', selectedAvatarId); } catch {}
      window.location.href = 'homepage.html';
    });
  })();

  on(els.backToGenres, 'click', (e) => {
    e.preventDefault();
    setStep(2);
    els.stepGenres?.querySelector('.pref-title')?.focus?.();
    els.stepGenres?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  });

  /* Save Genres - go to Avatars */
  on(els.savePrefs, 'click', async () => {
    const data = { hobbies: hobbies.values, genres: (window.__genresGroup?.values ?? []) };
    if (els.savePrefs) els.savePrefs.disabled = true;
    setText(els.prefsStatus, 'Saving your preferences…');
    try {
      if (window.FirebaseAPI?.savePreferences) await window.FirebaseAPI.savePreferences(data);
      else await new Promise((r) => setTimeout(r, 800));
      setText(els.prefsStatus, 'Preferences saved!');
      goToAvatars();
    } catch {
      setText(els.prefsStatus, 'Could not save preferences.');
    } finally {
      if (els.savePrefs) els.savePrefs.disabled = false;
    }
  });

  /* Back buttons */
  on(els.prefsBack, 'click', () => {
    onboardingLocked = false;      
    showAuthCard(true);            
    activateTab('signup');
    els.suUsername?.focus();
  });

  activateTab('signup');
  setStep(1);

  window.FirebaseAPI?.onAuth?.((user) => { console.log('Auth state:', user ? `signed in as ${user.email}` : 'signed out'); });
})();

// Avatar
document.addEventListener('DOMContentLoaded', () => {
  const link = document.getElementById('userLink');
  const img = document.getElementById('headerAvatar');  
  const fallback = document.getElementById('avatarFallback');

  if (!link || !fallback) return;

  const emoji = localStorage.getItem('avatarEmoji');
  const isAuthed = localStorage.getItem('isAuthed') === 'true';

  // Show the emoji if we have one, regardless of isAuthed flag;
  // this avoids cases where storage has the emoji but the auth flag wasn't set.
  if (emoji) {
    fallback.textContent = emoji;
    fallback.hidden = false;
    if (img) img.hidden = true;
    link.href = isAuthed ? '/account' : 'index.html';
    link.setAttribute('aria-label', 'Your account');
  } else {
    // default
    fallback.textContent = '•';
    fallback.hidden = false;
    if (img) img.hidden = true;
    link.href = '/login';
    link.setAttribute('aria-label', 'Sign in');
  }
});

/* Book suggestions */

const railEl = document.getElementById('bookRail');
const leftBtn = document.querySelector('.rail-btn.left');
const rightBtn = document.querySelector('.rail-btn.right');

const BOOKS = [
  {
    id: 'g1',
    title: "Ready Player One",
    author: "Ernest Cline",
    pages: 384,
    img: "assets/ready-player-one.jpg",
    tags: ['gaming', 'scifi', 'vr', 'quests', 'nostalgia']
  },
  {
    id: 'g2',
    title: "Warcross",
    author: "Marie Lu",
    pages: 416,
    img: "assets/warcross.jpg",
    tags: ['gaming', 'coding', 'esports', 'mystery']
  },
  {
    id: 'm1',
    title: "Dumplin\u2019",
    author: "Julie Murphy",
    pages: 400,
    img: "assets/dumplin.jpg",
    tags: ['music', 'coming-of-age', 'pageant', 'friendship']
  },
  {
    id: 'm2',
    title: "This Song Will Save Your Life",
    author: "Leila Sales",
    pages: 288,
    img: "assets/this-song-will-save-your-life.jpg",
    tags: ['music', 'dj', 'identity', 'contemporary-ya']
  },
  {
    id: 'a1',
    title: "Eliza and Her Monsters",
    author: "Francesca Zappia",
    pages: 385,
    img: "assets/eliza-and-her-monsters.jpg",
    tags: ['art', 'webcomics', 'mental-health', 'realistic', 'fanfiction']
  },
  {
    id: 'a2',
    title: "The Art of Secrets",
    author: "James Klise",
    pages: 256,
    img: "assets/the-art-of-secrets.jpg",
    tags: ['art', 'mystery', 'thriller']
  },
  {
    id: 's1',
    title: "The Crossover",
    author: "Kwame Alexander",
    pages: 240,
    img: "assets/crossover.jpg",
    tags: ['sports', 'basketball', 'poetry']
  },
  {
    id: 's2',
    title: "Patina",
    author: "Jason Reynolds",
    pages: 240,
    img: "assets/patina.jpeg",
    tags: ['sports', 'track', 'friendship']
  },
  {
    id: 'f1',
    title: "The Fashion Committee",
    author: "Susan Juby",
    pages: 352,
    img: "assets/fashion-comittee.jpg",
    tags: ['fashion', 'school', 'drama']
  },
  {
    id: 'f2',
    title: "Project Runway Junior Companion Books",
    author: "Various",
    pages: 224,
    img: "assets/project_runway.jpg",
    tags: ['fashion', 'nonfiction', 'inspiration']
  },
  {
    id: 'c2',
    title: "Little Brother",
    author: "Cory Doctorow",
    pages: 384,
    img: "assets/little-brother.jpg",
    tags: ['coding', 'hacking', 'activism', 'scifi']
  },
  {
    id: 'an1',
    title: "The One and Only Ivan",
    author: "Katherine Applegate",
    pages: 336,
    img: "assets/the_one_and_only_ivan.jpg",
    tags: ['animals', 'friendship', 'heartfelt']
  },
  {
    id: 'w1',
    title: "Fangirl",
    author: "Rainbow Rowell",
    pages: 480,
    img: "assets/fangirl.jpg",
    tags: ['writing', 'fanfiction', 'romance', 'contemporary-ya']
  },
  {
    id: 'w2',
    title: "Words on Bathroom Walls",
    author: "Julia Walton",
    pages: 304,
    img: "assets/bathroom-walls.jpg",
    tags: ['writing', 'journal', 'mental-health']
  },
  {
    id: 't1',
    title: "Love & Gelato",
    author: "Jenna Evans Welch",
    pages: 400,
    img: "assets/love_and_gelato.jpg",
    tags: ['travel', 'romance', 'mystery']
  },
  {
    id: 't2',
    title: "The Gentleman\u2019s Guide to Vice and Virtue",
    author: "Mackenzi Lee",
    pages: 528,
    img: "assets/the_gentleman.jpg",
    tags: ['travel', 'historical', 'adventure', 'romance']
  },
  {
    id: 'mv1',
    title: "Paper Towns",
    author: "John Green",
    pages: 336,
    img: "assets/paper_towns.jpg",
    tags: ['movies', 'mystery', 'adventure']
  },
  {
    id: 'mv2',
    title: "One of Us Is Lying",
    author: "Karen M. McManus",
    pages: 416,
    img: "assets/lying.jpg",
    tags: ['movies', 'thriller', 'mystery']
  },
  {
    id: 'p1',
    title: "Hold Still",
    author: "Nina LaCour",
    pages: 240,
    img: "assets/hold_still.jpg",
    tags: ['photography', 'grief', 'healing']
  },
  {
    id: 'p2',
    title: "The Girl in the Picture",
    author: "Alexandra Monir",
    pages: 272,
    img: "assets/girl_in_picture.jpg",
    tags: ['photography', 'mystery', 'thriller']
  },
  {
    id: 'b1',
    title: "Love Sugar Magic",
    author: "Anna Meriano",
    pages: 320,
    img: "assets/love_sugar_magic.jpg",
    tags: ['baking', 'magic', 'family']
  },
  {
    id: 'b2',
    title: "A Pho Love Story",
    author: "Loan Le",
    pages: 416,
    img: "assets/pho.jpg",
    tags: ['baking', 'cooking', 'romance', 'family']
  },
  {
    id: 'd1',
    title: "Tiny Pretty Things",
    author: "Sona Charaipotra & Dhonielle Clayton",
    pages: 448,
    img: "assets/tiny_pretty_things.jpg",
    tags: ['dance', 'ballet', 'drama']
  },
  {
    id: 'd2',
    title: "I\u2019ll Be the One",
    author: "Lyla Lee",
    pages: 336,
    img: "assets/be_the_one.jpg",
    tags: ['dance', 'k-pop', 'competition', 'romance']
  },
  {
    id: 'fit1',
    title: "Turtles All the Way Down",
    author: "John Green",
    pages: 304,
    img: "assets/all_the_way_down.jpg",
    tags: ['fitness', 'mental-health', 'friendship']
  },
  {
    id: 'fit2',
    title: "Girls Guide to Conquering Life",
    author: "Erica & Jonathan Catherman",
    pages: 224,
    img: "assets/girls_guide.jpg",
    tags: ['fitness', 'growth', 'nonfiction']
  },
  {
    id: 'mu1',
    title: "Beauty Queens",
    author: "Libba Bray",
    pages: 400,
    img: "assets/beauty_queens.jpg",
    tags: ['makeup', 'satire', 'pageant']
  },
  {
    id: 'mu2',
    title: "The Summer I Turned Pretty",
    author: "Jenny Han",
    pages: 304,
    img: "assets/the_summer.jpg",
    tags: ['makeup', 'romance', 'summer']
  },
  {
    id: 'n1',
    title: "The Wild Robot",
    author: "Peter Brown",
    pages: 288,
    img: "assets/the_robot.jpg",
    tags: ['nature', 'survival', 'tech']
  },
  {
    id: 'n2',
    title: "Where the Crawdads Sing",
    author: "Delia Owens",
    pages: 384,
    img: "assets/crawdad_sing.jpg",
    tags: ['nature', 'mystery', 'older-teen']
  },
  {
    id: 'bg1',
    title: "The Westing Game",
    author: "Ellen Raskin",
    pages: 192,
    img: "assets/westwing_game.jpg",
    tags: ['boardgames', 'mystery', 'puzzle']
  },
  {
    id: 'bg2',
    title: "Slay",
    author: "Brittney Morris",
    pages: 352,
    img: "assets/slay.jpg",
    tags: ['boardgames', 'gaming', 'strategy']
  },
  {
    id: 'sm1',
    title: "Follow Me",
    author: "Sara Shepard",
    pages: 320,
    img: "assets/follow_me.jpg",
    tags: ['streaming', 'social-media', 'thriller']
  },

  /* ==== NEWLY ADDED SUGGESTIONS (appended) ==== */

  // 🧙‍♀️ Fantasy
  { id: 'nf1', title: "Six of Crows", author: "Leigh Bardugo", pages: 480, img: "assets/six-of-crows.jpg", tags: ['fantasy','criminal-crew','magic','heist'] },
  { id: 'nf2', title: "Throne of Glass", author: "Sarah J. Maas", pages: 432, img: "assets/throne-of-glass.jpg", tags: ['fantasy','assassin','court-politics'] },
  { id: 'nf3', title: "An Ember in the Ashes", author: "Sabaa Tahir", pages: 464, img: "assets/an-ember-in-the-ashes.jpg", tags: ['fantasy','rebellion','roman-inspired'] },

  // 💕 Romance
  { id: 'nr1', title: "To All the Boys I\u2019ve Loved Before", author: "Jenny Han", pages: 355, img: "assets/to-all-the-boys.jpg", tags: ['romance','letters','school','contemporary-ya'] },
  { id: 'nr2', title: "Anna and the French Kiss", author: "Stephanie Perkins", pages: 372, img: "assets/anna-and-the-french-kiss.jpg", tags: ['romance','paris','love-triangle','contemporary-ya'] },
  { id: 'nr3', title: "Better Than the Movies", author: "Lynn Painter", pages: 384, img: "assets/better-than-the-movies.jpg", tags: ['romance','rom-com','contemporary-ya'] },

  // 🔍 Mystery / Thriller
  // (Skipping duplicate: One of Us Is Lying already present)
  { id: 'nmt1', title: "A Good Girl\u2019s Guide to Murder", author: "Holly Jackson", pages: 400, img: "assets/good-girls-guide.jpg", tags: ['mystery','thriller','podcast','investigation'] },
  { id: 'nmt2', title: "Truly Devious", author: "Maureen Johnson", pages: 416, img: "assets/truly-devious.jpg", tags: ['mystery','thriller','boarding-school','cold-case'] },

  // 🔥 Dystopian
  { id: 'nd1', title: "The Hunger Games", author: "Suzanne Collins", pages: 374, img: "assets/hunger-games.jpg", tags: ['dystopian','survival','rebellion','games'] },
  { id: 'nd2', title: "Legend", author: "Marie Lu", pages: 305, img: "assets/legend.jpg", tags: ['dystopian','military','rebellion','enemies-to-lovers','romance'] },
  { id: 'nd3', title: "The Maze Runner", author: "James Dashner", pages: 375, img: "assets/maze-runner.jpg", tags: ['dystopian','survival','puzzle','secrets'] },

  // 🚀 Sci-Fi
  { id: 'nsf1', title: "Cinder", author: "Marissa Meyer", pages: 390, img: "assets/cinder.jpg", tags: ['scifi','space','cyborg','fairy-tale'] },
  { id: 'nsf2', title: "Illuminae", author: "Amie Kaufman & Jay Kristoff", pages: 608, img: "assets/illuminae.jpg", tags: ['scifi','space','ai','found-footage'] },
  { id: 'nsf3', title: "Skyward", author: "Brandon Sanderson", pages: 513, img: "assets/skyward.jpg", tags: ['scifi','space','fighter-pilots','ai'] },

  // 💬 Graphic Novels / Manga
  { id: 'ng1', title: "Heartstopper (Vol. 1)", author: "Alice Oseman", pages: 288, img: "assets/heartstopper.jpg", tags: ['graphic','lgbtqia','romance','school'] },
  { id: 'ng2', title: "Check, Please! (Book 1)", author: "Ngozi Ukazu", pages: 288, img: "assets/check-please.jpg", tags: ['graphic','sports','hockey','friendship'] },
  { id: 'ng3', title: "Spy x Family (Vol. 1)", author: "Tatsuya Endo", pages: 220, img: "assets/spy-x-family.jpg", tags: ['graphic','manga','spy','found-family','humor'] },

  // 👻 Horror
  { id: 'nh1', title: "The Girl from the Well", author: "Rin Chupeco", pages: 267, img: "assets/girl-from-the-well.jpg", tags: ['horror','ghost','japanese-folklore'] },
  { id: 'nh2', title: "There\u2019s Someone Inside Your House", author: "Stephanie Perkins", pages: 320, img: "assets/inside-your-house.jpg", tags: ['horror','slasher','romance'] },
  { id: 'nh3', title: "House of Hollow", author: "Krystal Sutherland", pages: 304, img: "assets/house-of-hollow.jpg", tags: ['horror','dark-fairy','mystery'] },

  // 🧍 Realistic Fiction
  { id: 'nrf1', title: "The Hate U Give", author: "Angie Thomas", pages: 464, img: "assets/the-hate-u-give.jpg", tags: ['realistic','justice','identity','race'] },
  { id: 'nrf2', title: "Everything, Everything", author: "Nicola Yoon", pages: 320, img: "assets/everything-everything.jpg", tags: ['realistic','romance','illness'] },
  { id: 'nrf3', title: "We Are Not Free", author: "Traci Chee", pages: 384, img: "assets/we-are-not-free.jpg", tags: ['realistic','historical','wwii','japanese-american'] },

  // 🧭 Adventure
  { id: 'na1', title: "Percy Jackson & the Olympians: The Lightning Thief", author: "Rick Riordan", pages: 377, img: "assets/lightning-thief.jpg", tags: ['adventure','fantasy','mythology','greek-gods'] },
  { id: 'na2', title: "Daughter of the Deep", author: "Rick Riordan", pages: 416, img: "assets/daughter-of-the-deep.jpg", tags: ['adventure','underwater','tech','school'] },
  { id: 'na3', title: "Inkheart", author: "Cornelia Funke", pages: 534, img: "assets/inkheart.jpg", tags: ['adventure','fantasy','books','magic'] },

  // 🏀 Sports
  // (Skipping duplicate: The Crossover already present)
  { id: 'nsp1', title: "Ghost", author: "Jason Reynolds", pages: 192, img: "assets/ghost.jpg", tags: ['sports','track','coming-of-age'] },
  { id: 'nsp2', title: "Golden Arm", author: "Carl Deuker", pages: 304, img: "assets/golden-arm.jpg", tags: ['sports','baseball','grit'] },

  // 🧡 Contemporary YA
  { id: 'ncya1', title: "They Both Die at the End", author: "Adam Silvera", pages: 384, img: "assets/they-both-die.jpg", tags: ['contemporary-ya','romance','speculative'] },
  { id: 'ncya2', title: "You Should See Me in a Crown", author: "Leah Johnson", pages: 336, img: "assets/see-me-in-a-crown.jpg", tags: ['contemporary-ya','romance','prom','identity','lgbtqia'] },
  { id: 'ncya3', title: "Five Feet Apart", author: "Rachael Lippincott", pages: 288, img: "assets/five-feet-apart.jpg", tags: ['contemporary-ya','romance','illness'] },

  // 👁️ Paranormal
  { id: 'np1', title: "Miss Peregrine\u2019s Home for Peculiar Children", author: "Ransom Riggs", pages: 382, img: "assets/miss-peregrine.jpg", tags: ['paranormal','time-loops','peculiar','photography'] },
  { id: 'np2', title: "Beautiful Creatures", author: "Kami Garcia & Margaret Stohl", pages: 563, img: "assets/beautiful-creatures.jpg", tags: ['paranormal','southern-gothic','magic','romance'] },
  { id: 'np3', title: "City of Bones", author: "Cassandra Clare", pages: 485, img: "assets/city-of-bones.jpg", tags: ['paranormal','fantasy','demons','angels','urban-fantasy'] },

  // 🏳️‍🌈 LGBTQIA+
  { id: 'nl1', title: "Aristotle and Dante Discover the Secrets of the Universe", author: "Benjamin Alire Sáenz", pages: 352, img: "assets/aristotle-and-dante.jpg", tags: ['lgbtqia','romance','coming-of-age'] },
  { id: 'nl2', title: "Simon vs. the Homo Sapiens Agenda", author: "Becky Albertalli", pages: 303, img: "assets/simon-vs.jpg", tags: ['lgbtqia','romance','school'] },
  { id: 'nl3', title: "If This Gets Out", author: "Sophie Gonzales & Cale Dietrich", pages: 416, img: "assets/if-this-gets-out.jpg", tags: ['lgbtqia','romance','music','boy-band'] },

  // 😂 Humor
  { id: 'nhu1', title: "The Absolutely True Diary of a Part-Time Indian", author: "Sherman Alexie", pages: 240, img: "assets/part-time-indian.jpg", tags: ['humor','coming-of-age','realistic'] },
  { id: 'nhu2', title: "The Field Guide to the North American Teenager", author: "Ben Philippe", pages: 372, img: "assets/field-guide-teenager.jpg", tags: ['humor','sarcasm','new-kid','realistic'] },
  { id: 'nhu3', title: "No Good Deed", author: "Kara Connolly", pages: 352, img: "assets/no-good-deed.jpg", tags: ['humor','time-travel','medieval'] },

  // 🖋️ Fanfiction (adjacent)
  // (Skipping duplicates: Fangirl, Eliza and Her Monsters already present)
  { id: 'nff1', title: "Stay Sweet", author: "Siobhan Vivian", pages: 368, img: "assets/stay-sweet.jpg", tags: ['contemporary-ya','summer','friendship','work'] },

  // 🪶 Poetry / Spoken Word
  { id: 'npw1', title: "The Poet X", author: "Elizabeth Acevedo", pages: 368, img: "assets/the-poet-x.jpg", tags: ['poetry','verse','coming-of-age'] },
  { id: 'npw2', title: "Clap When You Land", author: "Elizabeth Acevedo", pages: 432, img: "assets/clap-when-you-land.jpg", tags: ['poetry','verse','sisters'] },
  { id: 'npw3', title: "Shout", author: "Laurie Halse Anderson", pages: 304, img: "assets/shout.jpg", tags: ['poetry','memoir'] },
];

function getUserPrefs() {
  const hobbies = JSON.parse(localStorage.getItem('selectedHobbies') || '[]');
  const genres = JSON.parse(localStorage.getItem('selectedGenres') || '[]');

  return {
    hobbies: hobbies.map(s => s.toLowerCase()),
    genres: genres.map(s => s.toLowerCase())
  };
}

function scoreBook(book, prefs) {
  const { hobbies, genres } = prefs;
  let score = 0;
  let matched = [];

  book.tags.forEach(tag => {
    const t = tag.toLowerCase();
    if (genres.includes(t)) { score += 2; matched.push(t); }
    else if (hobbies.includes(t)) { score += 1; matched.push(t); }
  });

  return { score, matched };
}

function renderTile(book, matchedTags) {
  const card = document.createElement('article');
  card.className = 'book-tile';

  const cover = document.createElement('div');
  cover.className = 'book-cover';
  cover.style.backgroundImage = `url("${book.img}")`;

  const meta = document.createElement('div');
  meta.className = 'book-meta';
  meta.innerHTML = `
    <h3>${book.title}</h3>
    <p class="byline">by ${book.author}</p>
    ${book.pages ? `<p class="pages">${book.pages} pages</p>` : ''}
  `;

  const tags = document.createElement('div');
  tags.className = 'tag-row';

  const displayTags = matchedTags.length ? matchedTags : book.tags;

  displayTags.forEach(tag => {
    const chip = document.createElement('span');
    chip.className = 'tag' + (matchedTags.includes(tag) ? '' : ' faded');
    chip.textContent = tag;
    tags.appendChild(chip);
  });

  card.append(cover, meta, tags);
  return card;
}


function populateRail() {
  const prefs = getUserPrefs();
  const scoredBooks = BOOKS.map(book => {
    const { score, matched } = scoreBook(book, prefs);
    return { book, score, matched };
  });

  const matches = scoredBooks.filter(sb => sb.score > 0).sort((a, b) => b.score - a.score);
  const displayBooks = matches.length ? matches : scoredBooks.slice(0, 12);

  railEl.innerHTML = '';
  displayBooks.forEach(({ book, matched }) => {
    railEl.appendChild(renderTile(book, matched));
  });

  updateArrows();
}

function updateArrows() {
  const maxScroll = railEl.scrollWidth - railEl.clientWidth;
  leftBtn.disabled = railEl.scrollLeft <= 2;
  rightBtn.disabled = railEl.scrollLeft >= maxScroll - 2;
}

function scrollByTiles(direction) {
  const tileWidth = railEl.querySelector('.book-tile')?.clientWidth || 200;
  railEl.scrollBy({ left: direction * (tileWidth + 12), behavior: 'smooth' });
}

leftBtn.addEventListener('click', () => scrollByTiles(-1));
rightBtn.addEventListener('click', () => scrollByTiles(1));
railEl.addEventListener('scroll', updateArrows);

populateRail();
