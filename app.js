(() => {
  /* --------------------------------------------------
   * Helpers
   * -------------------------------------------------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const setText = (el, text) => { if (el) el.textContent = text ?? ""; };

  // Safe string helpers
  const toStr = (v) => (v == null ? "" : String(v));
  const safeTrim = (v) => toStr(v).trim();
  const val = (el) => safeTrim(el?.value);

  // Debounce helper
  const debounce = (fn, ms = 250) => {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  };

  let onboardingLocked = false;

  // === Back arrow on Hobbies -> go back to Sign up ===
  document.getElementById('prefsBack')?.addEventListener('click', () => {
    // hide preferences
    const prefs = document.getElementById('panel-preferences');
    if (prefs) { prefs.hidden = true; prefs.classList.add('is-hidden'); }

    // show auth
    const auth = document.getElementById('auth');
    if (auth) auth.hidden = false;

    // activate Sign up tab
    if (typeof activateTab === 'function') activateTab('signup');

    // focus username for convenience
    document.getElementById('su-username')?.focus();
  });

  // === Optional: derive 2/4 dynamically ===
  (function setOverallStepProgress() {
    const current = 2;   // this screen is step 2
    const total   = 4;   // total steps in onboarding
    const pct = Math.min(100, (current / Math.max(1, total)) * 100);

    const stepEl = document.getElementById('flowStep');
    const totalEl = document.getElementById('flowTotal');
    const fillEl = document.getElementById('flowFill');

    if (stepEl) stepEl.textContent = String(current);
    if (totalEl) totalEl.textContent = String(total);
    if (fillEl) fillEl.style.width = pct + '%';
  })();

  // --- Onboarding constants + emoji map ---
  const MIN_HOBBIES = 3;
  const MIN_GENRES  = 3; // NEW: minimum required for the Genres step

  const HOBBY_EMOJI = {
    gaming:"🎮", music:"🎵", art:"🎨", sports:"🏀", fashion:"🧢", coding:"💻",
    animals:"🐾", writing:"✍️", travel:"✈️", movies:"🎬", photography:"📸",
    baking:"🧁", skateboarding:"🛹", dance:"💃", fitness:"💪", makeup:"💄",
    nature:"🌿", collecting:"🧩", boardgames:"🎲", streaming:"📱",
  };

  function popEmojiFrom(el, emoji="✨"){
    if (!el) return;
    const r = el.getBoundingClientRect();
    const d = document.createElement("div");
    d.className = "float-emoji";
    d.textContent = emoji;
    d.style.left = `${r.left + r.width/2}px`;
    d.style.top  = `${r.top  + r.height/2}px`;
    d.style.setProperty("--dx", `${Math.round(Math.random()*40-20)}px`);
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 800);
  }

  /* --------------------------------------------------
   * Splash Screen + Progress
   * -------------------------------------------------- */
  const progressBar = $('#progressBar');
  const progressText = $('#progressText');
  const splash = $('#splash');
  const funLine = $('#funLine');
  const authRoot = $('#auth');

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
  function rotatePhrase() {
    phraseIdx = (phraseIdx + 1) % funPhrases.length;
    setText(funLine, funPhrases[phraseIdx]);
  }

  function setProgress(pct) {
    const p = Math.max(0, Math.min(100, pct));
    if (progressBar) progressBar.style.width = `${p}%`;
    setText(progressText, `${Math.round(p)}%`);
    if (p >= 100) {
      splash?.closest('.page')?.remove();
      authRoot?.removeAttribute('hidden');

      // ✨ run sparkles for a few seconds after page reveals
      runSparklesOnce();
    }
  }

  (function startLoader() {
    if (!progressBar) return;
    setText(funLine, funPhrases[0]);
    let pct = 0;
    const tick = () => {
      pct += Math.random() * 18 + 6;
      rotatePhrase();
      setProgress(pct);
      if (pct < 100) setTimeout(tick, 420);
    };
    setTimeout(tick, 420);
  })();

  /* --------------------------------------------------
   * Sparkles effect (only for a few seconds after load)
   * -------------------------------------------------- */
  function runSparklesOnce() {
    const layer = document.getElementById('sparkles');
    if (!layer) return;

    const MAX = 30;
    let interval;

    function spawn() {
      const star = document.createElement('div');
      star.className = 'star';
      star.textContent = '✦';
      star.style.left = Math.random() * 100 + '%';
      star.style.top = Math.random() * 100 + '%';
      star.style.opacity = '0';
      star.style.transition = 'opacity 300ms ease, transform 1200ms ease';
      layer.appendChild(star);

      requestAnimationFrame(() => {
        star.style.opacity = '1';
        star.style.transform = 'translateY(-6px)';
      });

      setTimeout(() => star.remove(), 1400);
    }

    // Start spawning sparkles
    interval = setInterval(() => {
      if (layer.childElementCount < MAX) spawn();
    }, 160);

    // Stop after 3 seconds & clear any remaining sparkles
    setTimeout(() => {
      clearInterval(interval);
      setTimeout(() => layer.replaceChildren(), 1500);
    }, 3000);
  }

  /* --------------------------------------------------
   * Auth Tabs (Signup / Signin)
   * -------------------------------------------------- */
  const tabSignup = $('#tab-signup');
  const tabSignin = $('#tab-signin');
  const panelSignup = $('#panel-signup');
  const panelSignin = $('#panel-signin');

  function activateTab(which) {
    const isSignup = which === 'signup';
    tabSignup?.classList.toggle('is-active', isSignup);
    tabSignin?.classList.toggle('is-active', !isSignup);
    tabSignup?.setAttribute('aria-selected', String(isSignup));
    tabSignin?.setAttribute('aria-selected', String(!isSignup));
    panelSignup.hidden = !isSignup;
    panelSignin.hidden = isSignup;
    panelSignup.classList.toggle('is-hidden', !isSignup);
    panelSignin.classList.toggle('is-hidden', isSignup);
  }

  on(tabSignup, 'click', () => activateTab('signup'));
  on(tabSignin, 'click', () => activateTab('signin'));

  $$('button[data-switch]').forEach(btn => {
    on(btn, 'click', () => activateTab(btn.getAttribute('data-switch')));
  });

  /* --------------------------------------------------
   * Show / Hide Password Buttons (Safari-safe)
   * -------------------------------------------------- */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-toggle]');
    if (!btn) return;

    // Stop implicit form submission (Safari can be picky here)
    e.preventDefault();

    const id = btn.getAttribute('data-toggle');
    const input = id ? document.getElementById(id) : null;
    if (!input) return;

    const isHidden = input.type === 'password';

    // Preserve selection/caret (iOS Safari can drop it on type switch)
    const start = input.selectionStart;
    const end = input.selectionEnd;

    try {
      input.type = isHidden ? 'text' : 'password';
    } catch {
      // Ultra-old Safari fallback: swap the node
      const clone = input.cloneNode(true);
      clone.type = isHidden ? 'text' : 'password';
      input.parentNode.replaceChild(clone, input);
    }

    btn.textContent = isHidden ? 'Hide' : 'Show';
    btn.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');

    // Defer focus so iOS Safari doesn’t immediately blur it
    setTimeout(() => {
      const target = document.getElementById(id);
      target?.focus();
      if (start != null && end != null && target?.setSelectionRange) {
        try { target.setSelectionRange(start, end); } catch {}
      }
    }, 0);
  });

  /* --------------------------------------------------
   * Username Validation & Availability
   * -------------------------------------------------- */
  const suUsername = $('#su-username');
  const usernameHint = $('#usernameHint');

  function validUsernameFormat(u) {
    if (!u) return false;
    if (u.length < 3 || u.length > 24) return false;
    return /^[a-zA-Z0-9_.]+$/.test(u);
  }

  async function checkUsername(u) {
    // Always make 'u' a string BEFORE trimming
    u = String(u ?? '').trim();

    if (!u) return setText(usernameHint, '');
    if (!validUsernameFormat(u))
      return setText(usernameHint, 'Usernames are 3–24 chars: letters, numbers, . or _');

    // Skip API check if Firebase isn't wired
    if (!window.FirebaseAPI?.isUsernameAvailable) return;

    try {
      // Supports boolean or { available: true }
      const res = await window.FirebaseAPI.isUsernameAvailable(u);
      const ok = !!(res?.available ?? res);
      setText(usernameHint, ok ? '✓ Username is available' : 'That username is taken.');
    } catch {
      setText(usernameHint, '');
    }
  }

  const checkUsernameDebounced = debounce(checkUsername, 300);

  // Username input -> always pass a string; never trim the debounced function's return
  on(suUsername, 'input', (e) => {
    const v = String(e?.target?.value ?? '').trim();
    checkUsernameDebounced(v);
  });

  /* --------------------------------------------------
   * Password Strength + Requirements
   * -------------------------------------------------- */
  const suPassword = $('#su-password');
  const suStrengthFill = $('#su-strength');
  const reqList = $('#su-reqs');
  const reqLen = reqList?.querySelector('[data-rule="len"]');
  const reqMix = reqList?.querySelector('[data-rule="mix"]');
  const reqCase = reqList?.querySelector('[data-rule="case"]');

  function scorePassword(pw) {
    pw = toStr(pw);
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    return score;
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

  on(suPassword, 'input', (e) => {
    const pw = toStr(e?.target?.value);
    updateReqs(pw);
    updateStrength(pw);
    validateConfirm();
  });

  /* --------------------------------------------------
   * Confirm Password
   * -------------------------------------------------- */
  const suConfirm = $('#su-confirm');
  const confirmHint = $('#confirmHint');

  function validateConfirm() {
    const pw = toStr(suPassword?.value);
    const confirmVal = toStr(suConfirm?.value);
    const ok = confirmVal.length > 0 && confirmVal === pw;
    setText(confirmHint, ok ? 'Passwords match.' : (confirmVal ? 'Passwords do not match.' : ''));
    return ok;
  }
  on(suConfirm, 'input', validateConfirm);

  /* --------------------------------------------------
   * Onboarding show/hide helpers
   * -------------------------------------------------- */
  function showAuthCard() {
    const auth = document.getElementById('auth');
    const prefs = document.getElementById('panel-preferences');
    if (auth) { auth.hidden = false; }
    if (prefs) { prefs.hidden = true; prefs.classList.add('is-hidden'); }
  }

  function openOnboardingHobbies() {
    onboardingLocked = true; // ✅ Lock onboarding once opened

    const auth = document.getElementById('auth');
    const prefs = document.getElementById('panel-preferences');
    const stepperEls = document.querySelectorAll('.stepper .step');
    const step1 = document.getElementById('pref-step-hobbies');
    const step2 = document.getElementById('pref-step-genres');

    if (auth) auth.hidden = true;

    if (prefs) {
      prefs.hidden = false;
      prefs.classList.remove('is-hidden');
    }

    stepperEls.forEach((el, i) => el.classList.toggle('is-active', i === 0));

    if (step1) { step1.hidden = false; step1.classList.remove('is-hidden'); }
    if (step2) { step2.hidden = true;  step2.classList.add('is-hidden'); }

    prefs?.querySelector('#hobbyChoices .chip')?.focus();
  }

  /* --------------------------------------------------
   * Sign Up Handler — show onboarding immediately
   * -------------------------------------------------- */
  const suEmail = $('#su-email');
  const suSubmit = $('#su-submit');
  const suStatus = $('#su-status');

  on($('#panel-signup'), 'submit', async (e) => {
    e.preventDefault();
    const username = val(suUsername);
    const email = val(suEmail);
    const pw = toStr(suPassword?.value);

    const termsEl = $('#su-terms');
    const termsOK = termsEl ? !!termsEl.checked : true;

    const strong = scorePassword(pw) >= 3;
    const match = validateConfirm();

    if (!strong || !match || !termsOK) {
      setText(suStatus, 'Please complete all requirements.');
      return;
    }

    suSubmit && (suSubmit.disabled = true);
    setText(suStatus, 'Creating your account…');

    // 🚀 Immediately open onboarding (even while the network request runs)
    openOnboardingHobbies();

    try {
      let user;
      if (window.FirebaseAPI?.signUp) {
        user = await window.FirebaseAPI.signUp(email, pw, { username });
      } else {
        await new Promise((r) => setTimeout(r, 900));
        user = { email };
      }
      // Optionally update status somewhere persistent if you like
      setText(suStatus, `Welcome, ${user.email ?? 'reader'}!`);
      // already on onboarding
    } catch (err) {
      // If sign-up fails, bounce the user back to the auth card with the error
      function showAuthCard() {
        if (onboardingLocked) return; // ✅ Don't leave onboarding once it's locked
        const auth = document.getElementById('auth');
        const prefs = document.getElementById('panel-preferences');
        if (auth) auth.hidden = false;
        if (prefs) {
          prefs.hidden = true;
          prefs.classList.add('is-hidden');
        }
      }

    } finally {
      suSubmit && (suSubmit.disabled = false);
    }
  });

  /* --------------------------------------------------
   * Sign In Handler
   * -------------------------------------------------- */
  const siEmail = $('#si-email');
  const siPassword = $('#si-password');
  const siSubmit = $('#si-submit');
  const siStatus = $('#si-status');

  on($('#panel-signin'), 'submit', async (e) => {
    e.preventDefault();
    const email = val(siEmail);
    const pw = toStr(siPassword?.value);

    setText(siStatus, pw ? 'Signing you in…' : 'Enter your password.');
    if (!pw) return;

    siSubmit && (siSubmit.disabled = true);
    try {
      let user;
      if (window.FirebaseAPI?.signIn) {
        user = await window.FirebaseAPI.signIn(email, pw);
      } else {
        await new Promise((r) => setTimeout(r, 700));
        user = { email };
      }
      setText(siStatus, `Welcome back, ${user.email ?? 'reader'}!`);
    } catch (err) {
      setText(siStatus, err?.message ?? 'Could not sign in.');
    } finally {
      siSubmit && (siSubmit.disabled = false);
    }
  });

  /* --------------------------------------------------
   * Preferences Onboarding (interactions)
   * -------------------------------------------------- */
  const stepperEls = $$('.stepper .step');
  const step1El = $('#pref-step-hobbies');
  const step2El = $('#pref-step-genres');
  const nextToGenres = $('#nextToGenres');
  const backToHobbies = $('#backToHobbies');
  const savePrefs = $('#savePrefs');
  const prefsStatus = $('#prefsStatus');

  function setStep(n) {
    stepperEls.forEach((el, i) => el.classList.toggle('is-active', i === n - 1));
    if (step1El) { step1El.hidden = n !== 1; step1El.classList.toggle('is-hidden', n !== 1); }
    if (step2El) { step2El.hidden = n !== 2; step2El.classList.toggle('is-hidden', n !== 2); }
  }

  // NEW: helper to ensure the step has a counter + progress UI identical to Hobbies
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
      if (chips && chips.parentNode) chips.parentNode.insertBefore(progress, chips);
      else stepRoot.prepend(progress);
    } else {
      const label = progress.querySelector(`#${countId}`);
      if (label) label.textContent = `Selected: 0/${min}`;
    }
  }

  // UPDATED: options-based initChipGroup with unlimited selection + labeled counter
  function initChipGroup(group, opts = {}) {
    if (!group) return { values: [], max: 0 };

    // Support unlimited selections via opts.max === Infinity
    const rawMax = opts.max === Infinity ? Infinity : (group.dataset.max || String(opts.max ?? 5));
    const max = rawMax === Infinity ? Infinity : parseInt(String(rawMax), 10);
    const min = parseInt(String(opts.min ?? 0), 10);
    const values = new Set();

    const countEl = opts.countEl || null;   // e.g. #hobbyCount or #genreCount
    const fillEl  = opts.fillEl  || null;   // e.g. #hobbyProgress or #genreProgress
    const nextBtn = opts.nextBtn || null;   // e.g. #nextToGenres or #savePrefs

    function updateProgress() {
      // Label shows "Selected: X/min" and increments live
      if (countEl) setText(countEl, `Selected: ${values.size}/${min}`);

      // Fill toward the minimum; cap at 100%
      if (fillEl && min > 0) {
        const pct = Math.min(100, (values.size / min) * 100);
        fillEl.style.width = `${pct}%`;
      }

      // Gate the CTA button until min is reached
      if (nextBtn) nextBtn.disabled = values.size < min;
    }
    updateProgress();

    group.addEventListener('click', (e) => {
      const btn = e.target.closest('.chip');
      if (!btn) return;
      const v = btn.dataset.value;
      if (!v) return;

      if (btn.classList.contains('selected')) {
        btn.classList.remove('selected');
        values.delete(v);
      } else if (max === Infinity || values.size < max) {
        btn.classList.add('selected');
        values.add(v);
        if (group.id === 'hobbyChoices') popEmojiFrom(btn, HOBBY_EMOJI[v] || "✨");
      }
      updateProgress();
    });

    return { get values() { return Array.from(values); }, min, max };
  }

  // Ensure Continue starts disabled
  if (nextToGenres) nextToGenres.disabled = true;

  // Hobbies chip group: require at least 3 (unchanged except max Infinity)
  const hobbies = initChipGroup($('#hobbyChoices'), {
    min: MIN_HOBBIES,
    max: Infinity,                 // allow selecting as many as they like
    countEl: $('#hobbyCount'),     // shows "Selected: X/3"
    fillEl: $('#hobbyProgress'),
    nextBtn: $('#nextToGenres'),
  });

  // NEW: When Continue is clicked with ≥3 hobbies, show and init Genres like Hobbies
  on($('#nextToGenres'), 'click', () => {
    if (hobbies.values.length >= MIN_HOBBIES) {
      ensureProgressUI(step2El, 'genreCount', 'genreProgress', MIN_GENRES); // NEW
      if (!window.__genresInitDone) { // NEW
        window.__genresInitDone = true; // NEW
        if ($('#savePrefs')) $('#savePrefs').disabled = true; // NEW: gate Save until min reached
        window.__genresGroup = initChipGroup($('#genreChoices'), { // NEW
          min: MIN_GENRES,            // NEW: require 3 genres
          max: Infinity,              // NEW: unlimited selections
          countEl: $('#genreCount'),  // NEW: Selected: X/3
          fillEl: $('#genreProgress'),// NEW: progress fill toward 3
          nextBtn: $('#savePrefs'),   // NEW: enable Save when X ≥ 3
        });
      }
      setStep(2); // switch to Genres
    }
  });

  // NEW (optional safety): if the user lands on step 2 directly
  (function initGenresJustInCase(){
    ensureProgressUI(step2El, 'genreCount', 'genreProgress', MIN_GENRES);
    if (!window.__genresInitDone) {
      window.__genresInitDone = true;
      if ($('#savePrefs')) $('#savePrefs').disabled = true;
      window.__genresGroup = initChipGroup($('#genreChoices'), {
        min: MIN_GENRES,
        max: Infinity,
        countEl: $('#genreCount'),
        fillEl: $('#genreProgress'),
        nextBtn: $('#savePrefs'),
      });
    }
  })();

 on(backToHobbies, 'click', () => setStep(1));

  on(savePrefs, 'click', async () => {
    const data = { hobbies: hobbies.values, genres: (window.__genresGroup?.values ?? []) };
    savePrefs && (savePrefs.disabled = true);
    setText(prefsStatus, 'Saving your preferences…');

    try {
      if (window.FirebaseAPI?.savePreferences) {
        await window.FirebaseAPI.savePreferences(data);
      } else {
        await new Promise((r) => setTimeout(r, 800));
      }
      setText(prefsStatus, 'Preferences saved!');
    } catch {
      setText(prefsStatus, 'Could not save preferences.');
    } finally {
      savePrefs && (savePrefs.disabled = false);
    }
  });

  /* --------------------------------------------------
   * Init
   * -------------------------------------------------- */
  activateTab('signup');
  setStep(1);

  window.FirebaseAPI?.onAuth?.((user) => {
    console.log('Auth state:', user ? `signed in as ${user.email}` : 'signed out');
  });
})();
