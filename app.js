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
