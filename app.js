const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const splash = document.getElementById('splash');
const funLine = document.getElementById('funLine');
const sparklesLayer = document.getElementById('sparkles');

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
  'Turning the next page…',
  'Lining up footnotes…',
  'Almost at the last page…'
];

function setProgress(v){
  const n = Math.max(0, Math.min(100, Math.floor(v)));
  if (progressBar) progressBar.style.width = n + '%';
  if (progressBar?.parentElement) progressBar.parentElement.setAttribute('aria-valuenow', String(n));
  if (progressText) progressText.textContent = n + '%';
}
function randomPhrase(){
  if (!funLine) return;
  funLine.textContent = funPhrases[Math.floor(Math.random()*funPhrases.length)];
}

/* sparkles */
function sparkleBurst(){
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion || !sparklesLayer) return;

  const count = 20;
  for (let i = 0; i < count; i++) {
    const star = document.createElement('span');
    star.className = 'star';
    star.textContent = '✦';
    const x = 30 + Math.random() * 40;
    const y = 35 + Math.random() * 30;

    Object.assign(star.style, {
      left: x + 'vw',
      top: y + 'vh',
      fontSize: (10 + Math.random()*12) + 'px',
    });

    sparklesLayer.appendChild(star);

    const dx = (Math.random() * 2 - 1) * 30;
    const dy = (Math.random() * -1) * 40;
    star.animate(
      [
        { transform: 'translate(0,0) scale(.6)', opacity: 0 },
        { transform: `translate(${dx}px, ${dy}px) scale(1)`, opacity: 1, offset: 0.35 },
        { transform: `translate(${dx}px, ${dy-10}px) scale(.9)`, opacity: 0 }
      ],
      { duration: 1400 + Math.random()*600, easing: 'ease-out', fill: 'forwards' }
    ).addEventListener('finish', () => star.remove());
  }
}

function simulateLoading(){
  const DURATION = 4800 + Math.random()*1400;
  const start = performance.now();
  let nextPhraseAt = 0.0;

  function tick(now){
    const t = Math.min(1, (now - start) / DURATION);
    const eased = 1 - Math.pow(1 - t, 3);
    const wobble = Math.sin(t * Math.PI * 2) * 0.008;

    setProgress((eased + wobble) * 100);

    if (t >= nextPhraseAt){ randomPhrase(); nextPhraseAt += 0.5; }

    if (t < 1) requestAnimationFrame(tick);
    else completeLoading();
  }
  requestAnimationFrame(tick);
}

function completeLoading(){
  setProgress(100);
  sparkleBurst(); // ✨

  const auth = document.getElementById('auth');
  const page = document.querySelector('.page');

  if (splash && splash.animate) {
    const fade = splash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 520, easing: 'ease' });
    fade.addEventListener('finish', () => {
      if (splash) splash.style.display = 'none';
      if (page) page.style.display = 'none';
      if (auth) auth.hidden = false;
      document.dispatchEvent(new Event('app:loaded'));
    });
  } else {
    if (splash) splash.style.display = 'none';
    if (page) page.style.display = 'none';
    if (auth) auth.hidden = false;
    document.dispatchEvent(new Event('app:loaded'));
  }
}

window.addEventListener('DOMContentLoaded', simulateLoading);

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const auth = document.getElementById('auth');
    if (auth && auth.hidden) {
      if (splash) splash.style.display = 'none';
      auth.hidden = false;
      document.dispatchEvent(new Event('app:loaded'));
    }
  }, 7000);
});

document.addEventListener('app:loaded', () => {
  const auth = document.getElementById('auth');
  if (auth) auth.hidden = false;
});

/* sign up log in */
const tabSignup = document.getElementById('tab-signup');
const tabSignin = document.getElementById('tab-signin');
const panelSignup = document.getElementById('panel-signup');
const panelSignin = document.getElementById('panel-signin');

function setTab(which){
  const isSignup = which === 'signup';
  tabSignup?.classList.toggle('is-active', isSignup);
  tabSignin?.classList.toggle('is-active', !isSignup);
  tabSignup?.setAttribute('aria-selected', String(isSignup));
  tabSignin?.setAttribute('aria-selected', String(!isSignup));
  if (panelSignup) { panelSignup.hidden = !isSignup; panelSignup.classList.toggle('is-hidden', !isSignup); }
  if (panelSignin) { panelSignin.hidden = isSignup; panelSignin.classList.toggle('is-hidden', isSignup); }

  (isSignup ? document.getElementById('su-email') : document.getElementById('si-email'))?.focus();
}
tabSignup?.addEventListener('click', () => setTab('signup'));
tabSignin?.addEventListener('click', () => setTab('signin'));
document.querySelectorAll('[data-switch="signin"]').forEach(b=>b.addEventListener('click',()=>setTab('signin')));
document.querySelectorAll('[data-switch="signup"]').forEach(b=>b.addEventListener('click',()=>setTab('signup')));

document.querySelectorAll('[data-toggle]').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const id = btn.getAttribute('data-toggle');
    const input = document.getElementById(id);
    if (!input) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.textContent = show ? 'Hide' : 'Show';
    btn.setAttribute('aria-label', (show ? 'Hide' : 'Show') + ' password');
  });
});

const suPass = document.getElementById('su-password');
const suConfirm = document.getElementById('su-confirm');
const suStrength = document.getElementById('su-strength');
const suReqs = document.getElementById('su-reqs');
const confirmHint = document.getElementById('confirmHint');

function scorePassword(pw){
  let score = 0;
  if (!pw) return 0;
  if (pw.length >= 8) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  if (pw.length >= 12) score += 1;
  return Math.min(score, 5);
}
function updateReqs(pw){
  suReqs?.querySelector('[data-rule="len"]')?.classList.toggle('ok', pw.length >= 8);
  suReqs?.querySelector('[data-rule="mix"]')?.classList.toggle('ok', /\d/.test(pw) && /[A-Za-z]/.test(pw));
  suReqs?.querySelector('[data-rule="case"]')?.classList.toggle('ok', /[a-z]/.test(pw) && /[A-Z]/.test(pw));
}
function renderStrength(pw){
  const s = scorePassword(pw);
  const pct = (s / 5) * 100;
  if (suStrength) suStrength.style.width = pct + '%';
}
function checkMatch(){
  if (!suConfirm || !suPass || !confirmHint) return;
  if (!suConfirm.value) { confirmHint.textContent = ''; return; }
  confirmHint.textContent = suConfirm.value === suPass.value ? 'Passwords match.' : 'Passwords do not match.';
}

suPass?.addEventListener('input', e=>{
  const v = e.target.value;
  updateReqs(v);
  renderStrength(v);
  checkMatch();
});
suConfirm?.addEventListener('input', checkMatch);

const suForm = panelSignup;
const siForm = panelSignin;
const suStatus = document.getElementById('su-status');
const siStatus = document.getElementById('si-status');

function validEmail(email){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

suForm?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = document.getElementById('su-email')?.value.trim() ?? '';
  const pw = suPass?.value ?? '';
  const ok = validEmail(email) && scorePassword(pw) >= 3 && pw === (suConfirm?.value ?? '') && document.getElementById('su-terms')?.checked;

  if (suStatus) suStatus.textContent = ok ? 'Creating your library account…' : 'Please complete all requirements.';
  if (!ok) return;

  await new Promise(r=>setTimeout(r, 900));
  if (suStatus) suStatus.textContent = 'Account created! You are signed in.';
});

siForm?.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const email = document.getElementById('si-email')?.value.trim() ?? '';
  const pw = document.getElementById('si-password')?.value ?? '';

  if (siStatus) siStatus.textContent = (validEmail(email) && pw.length > 0) ? 'Signing you in…' : 'Enter a valid email and password.';
  if (!(validEmail(email) && pw)) return;

  await new Promise(r=>setTimeout(r, 700));
  if (siStatus) siStatus.textContent = 'Welcome back! 📚';
});

