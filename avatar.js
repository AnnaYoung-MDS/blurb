document.addEventListener('DOMContentLoaded', () => {
  const grid = document.getElementById('avatarChoices');
  if (!grid) return;

  const hero = document.getElementById('avatarHeroEmoji');
  const finishBtn = document.getElementById('finishOnboarding');
  const hint = document.getElementById('avatarHint');
  const progress = document.getElementById('avatarProgress');

  let selected = null;

  grid.addEventListener('click', (e) => {
    const btn = e.target.closest('.avatar-card');
    if (!btn || btn.classList.contains('is-locked')) return;

    grid.querySelectorAll('.avatar-card').forEach(b => {
      b.classList.toggle('selected', b === btn);
      b.setAttribute('aria-pressed', b === btn ? 'true' : 'false');
    });

    const emoji = btn.querySelector('.emoji')?.textContent?.trim() || '';
    const id = btn.dataset.id || '';
    selected = { id, emoji };

    if (hero) {
      hero.textContent = emoji;
      hero.classList.remove('animate'); void hero.offsetWidth; hero.classList.add('animate');
    }
    if (hint) hint.textContent = 'Nice! Click Continue to finish.';
    if (progress) progress.style.width = '100%';
    if (finishBtn) finishBtn.disabled = false;
  });

  finishBtn?.addEventListener('click', () => {
    if (!selected) return;

    localStorage.setItem('avatarId', selected.id);
    localStorage.setItem('avatarEmoji', selected.emoji);
    localStorage.setItem('isAuthed', 'true');

    // go to the homepage
    window.location.href = 'homepage.html';
  });
});

