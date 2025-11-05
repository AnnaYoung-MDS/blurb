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
  progressBar.style.width = n + '%';
  progressBar.parentElement.setAttribute('aria-valuenow', String(n));
  progressText.textContent = n + '%';
}
function randomPhrase(){ funLine.textContent = funPhrases[Math.floor(Math.random()*funPhrases.length)]; }

/* sparkles */
function sparkleBurst(){
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) return;

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

  const fade = splash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 520, easing: 'ease' });
  fade.addEventListener('finish', () => {
    splash.style.display = 'none';
    document.dispatchEvent(new Event('app:loaded'));
  });
}

window.addEventListener('DOMContentLoaded', simulateLoading);
