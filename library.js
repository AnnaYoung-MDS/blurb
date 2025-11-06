// library.js
// ---------- data + rendering ----------
function getBooks() {
  try {
    const raw = localStorage.getItem('libraryBooks');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function renderBooks(books) {
  const grid = document.getElementById('libraryGrid');
  grid.innerHTML = '';
  for (const b of books) {
    const card = document.createElement('article');
    card.className = 'book-card';
    card.innerHTML = `
      <div class="cover">${b.emoji || '📕'}</div>
      <div class="meta">
        <h3>${b.title || 'Untitled'}</h3>
        <p>${b.author || ''}</p>
      </div>`;
    grid.appendChild(card);
  }
}

function updateEmptyState(books) {
  const empty = document.getElementById('emptyState');
  empty.hidden = books.length > 0;
}

// ---------- panes ----------
function showBooksPane() {
  const books = getBooks();
  renderBooks(books);
  updateEmptyState(books);
  const addPane = document.getElementById('addPane');
  if (addPane) addPane.hidden = true;
  document.getElementById('libraryGrid').hidden = false;
  document.body.classList.remove('is-add-mode');
}

function showAddPane() {
  const addPane = document.getElementById('addPane');
  if (addPane) addPane.hidden = false;
  document.getElementById('libraryGrid').hidden = true;
  document.getElementById('emptyState').hidden = true;
  document.body.classList.add('is-add-mode');

  // force sub slider to re-measure AFTER it becomes visible
  requestAnimationFrame(() => {
    requestAnimationFrame(() => refreshSubSegbarSlider());
  });
}

/* ---------- simple modal for ISBN help (NEW) ---------- */
function ensureIsbnModal() {
  if (document.getElementById('isbnHelpModal')) return;

  const modal = document.createElement('div');
  modal.id = 'isbnHelpModal';
  modal.className = 'modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="modal__backdrop" data-close="true"></div>
    <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="isbnHelpTitle" tabindex="-1">
      <button class="modal__close" type="button" aria-label="Close" data-close="true">×</button>
      <h2 id="isbnHelpTitle">Where to find the ISBN</h2>
      <div class="modal__content">
        <p><strong>ISBN</strong> is a 10 or 13-digit code that uniquely identifies a book.</p>
        <ul>
          <li>On the <strong>back cover</strong> near the barcode (most common).</li>
          <li>On the book’s <strong>copyright page</strong> inside the front.</li>
          <li>Sometimes on the dust jacket near the price.</li>
        </ul>
        <p>Examples: <code>9780307474278</code> (ISBN-13) or <code>0307474275</code> (ISBN-10).</p>
        <p>You can type digits without hyphens.</p>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // Close on backdrop/close button
  modal.addEventListener('click', (e) => {
    if (e.target.dataset.close === 'true') closeIsbnModal();
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeIsbnModal();
  });
}

function openIsbnModal() {
  ensureIsbnModal();
  const modal = document.getElementById('isbnHelpModal');
  if (!modal) return;
  modal.removeAttribute('aria-hidden');
  document.body.classList.add('modal-open');
  modal.querySelector('.modal__dialog')?.focus();
}

function closeIsbnModal() {
  const modal = document.getElementById('isbnHelpModal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

// ---------- initial render ----------
document.addEventListener('DOMContentLoaded', () => {
  const books = getBooks();
  renderBooks(books);
  updateEmptyState(books);

  mountMainSegbarSlider();
  mountSubSegbarSlider();
});



// ---------- main segbar (books / add / etc.) ----------
function mountMainSegbarSlider() {
  const segbar = document.querySelector('.segbar');
  if (!segbar) return;

  let slider = segbar.querySelector('.segbar__slider');
  if (!slider) {
    slider = document.createElement('div');
    slider.className = 'segbar__slider';
    slider.style.pointerEvents = 'none';
    segbar.appendChild(slider);
  }

  const positionSlider = (btn) => {
    const pr = segbar.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    slider.style.width = br.width + 'px';
    slider.style.height = br.height + 'px';
    slider.style.transform = `translate(${br.left - pr.left}px, ${br.top - pr.top}px)`;
  };

  let active = segbar.querySelector('.seg.is-active') || segbar.querySelector('.seg');
  if (active) {
    positionSlider(active);
    if (active.id === 'seg-add') showAddPane();
    else showBooksPane();
  }

  segbar.querySelectorAll('.seg').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn === active) return;

      const prev = active;
      const prevWasAdd = prev?.id === 'seg-add';
      const nextIsAdd = btn.id === 'seg-add';

      prev?.classList.remove('is-active');
      prev?.setAttribute('aria-selected', 'false');

      if (prevWasAdd && !nextIsAdd) {
        document.body.classList.remove('is-add-mode');
      }

      segbar.classList.add('is-animating');
      positionSlider(btn);

      const onDone = () => {
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected', 'true');
        active = btn;

        if (nextIsAdd) {
          document.body.classList.add('is-add-mode');
          showAddPane();
        } else if (btn.id === 'seg-books') {
          showBooksPane();
        }

        segbar.classList.remove('is-animating');
      };

      slider.addEventListener('transitionend', onDone, { once: true });
    });
  });

  window.addEventListener('resize', () => active && positionSlider(active), { passive: true });
}

// ---------- sub segbar (camera / upload / keyboard) ----------
function mountSubSegbarSlider() {
  const segbar = document.querySelector('.segbar--sub');
  if (!segbar) return;

  // --- RENDERERS ------------------------------------------------------------
  const hero = document.querySelector('#addPane .add-hero');

  // add this helper right under the hero query
  const setHeroAlign = (isLeft) => {
    if (!hero) return;
    hero.classList.toggle('align-left', !!isLeft);
  };

  const renderCamera = () => {
    if (!hero) return;
    setHeroAlign(false);            // keep centered
    hero.innerHTML = `
      <div class="big-icon solar--camera-bold"></div>
      <p class="add-sub">Scan the barcode on the back of your book</p>
      <button class="btn btn-dark" id="openCameraBtn" type="button">Open Camera</button>
    `;
  };

  const renderUpload = () => {
    if (!hero) return;
    setHeroAlign(false);            // keep centered
    hero.innerHTML = `
      <div class="big-icon" id="bigUploadIcon" aria-hidden="true"></div>
      <p class="add-sub">Upload a photo of the barcode<br/>on the back of your book</p>
      <input id="bookUploadInput" type="file" accept="image/*" hidden />
      <button class="btn btn-dark" id="triggerUploadBtn" type="button">Upload Photo</button>
    `;

    // Make the big icon use the same SVG as the small .line-md--upload
    const probe = document.createElement('span');
    probe.className = 'line-md--upload';
    probe.style.position = 'absolute';
    probe.style.left = '-9999px';
    document.body.appendChild(probe);
    const bg = getComputedStyle(probe).backgroundImage;
    document.body.removeChild(probe);
    const big = document.getElementById('bigUploadIcon');
    if (big) big.style.backgroundImage = bg;

    const file = hero.querySelector('#bookUploadInput');
    hero.querySelector('#triggerUploadBtn').addEventListener('click', () => file.click());
  };

  // --- Manual entry layout ---
  const renderManual = () => {
    if (!hero) return;
    setHeroAlign(true);             // left-align the manual form
    hero.innerHTML = `
      <form id="manualForm" class="manual-form" novalidate>
        <div class="form-row">
          <label for="isbnInput">ISBN Number</label>
          <div class="input-with-btn">
            <input id="isbnInput" type="text" inputmode="numeric" placeholder="" />
            <button id="isbnSearchBtn" class="btn btn-ghost" type="button">Search</button>
          </div>
          <a id="isbnHelp" class="link" href="#" aria-label="Where do I find the ISBN number?">Where do I find the ISBN number?</a>
        </div>

        <div class="divider-row" aria-hidden="true">
          <span class="line"></span>
          <span class="divider-text">Or enter manually</span>
          <span class="line"></span>
        </div>

        <div class="form-row">
          <label for="titleInput">Book Title</label>
          <input id="titleInput" type="text" placeholder="" required />
        </div>

        <div class="form-row">
          <label for="authorInput">Author</label>
          <input id="authorInput" type="text" placeholder="" />
        </div>

        <div class="form-row">
          <label for="pagesInput">Total Pages</label>
          <input id="pagesInput" type="number" inputmode="numeric" min="1" placeholder="" />
        </div>

        <div class="form-actions">
          <input id="coverInput" type="file" accept="image/*" hidden />
          <button id="addCoverBtn" class="btn" type="button">Add Book Cover</button>
          <button id="addBookBtn" class="btn btn-dark" type="submit">Add Book</button>
        </div>
      </form>
    `;

    // Wire actions
    const form = hero.querySelector('#manualForm');
    const coverInput = form.querySelector('#coverInput');

    // NEW: open the ISBN help modal
    form.querySelector('#isbnHelp').addEventListener('click', (e) => {
      e.preventDefault();
      openIsbnModal();
    });

    form.querySelector('#addCoverBtn').addEventListener('click', () => coverInput.click());
    form.querySelector('#isbnSearchBtn').addEventListener('click', () => {
      const isbn = form.querySelector('#isbnInput').value.trim();
      if (!isbn) return;
      // TODO: plug into your ISBN lookup flow
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = form.querySelector('#titleInput').value.trim();
      if (!title) { form.querySelector('#titleInput').focus(); return; }

      const author = form.querySelector('#authorInput').value.trim();
      const pages = parseInt(form.querySelector('#pagesInput').value, 10) || null;

      // Save to localStorage the same way your grid expects
      const books = getBooks();
      books.push({ title, author, pages, emoji: '📘' });
      localStorage.setItem('libraryBooks', JSON.stringify(books));
      showBooksPane(); // return to list
    });
  };

  // --------------------------------------------------------------------------

  let slider = segbar.querySelector('.segbar__slider');
  if (!slider) {
    slider = document.createElement('div');
    slider.className = 'segbar__slider';
    segbar.appendChild(slider);
  }

  const position = (btn) => {
    const pr = segbar.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    slider.style.width = br.width + 'px';
    slider.style.height = br.height + 'px';
    slider.style.transform = `translate(${br.left - pr.left}px, ${br.top - pr.top}px)`;
  };

  let active = segbar.querySelector('.seg.is-active') || segbar.querySelector('.seg');
  if (active) {
    position(active);
    // Ensure hero matches whichever tab is active on load
    if (active.id === 'add-camera') renderCamera();
    else if (active.id === 'add-upload') renderUpload();
    else renderManual();
  }

  segbar.querySelectorAll('.seg').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn === active) return;

      const prev = active;

      // remove the old active state BEFORE sliding
      prev?.classList.remove('is-active');
      prev?.setAttribute('aria-selected','false');

      position(btn);

      // wait until slide completes, THEN finalize active state + render hero
      const onDone = () => {
        btn.classList.add('is-active');
        btn.setAttribute('aria-selected','true');
        active = btn;

        if (btn.id === 'add-camera') renderCamera();
        else if (btn.id === 'add-upload') renderUpload();
        else renderManual();
      };

      slider.addEventListener('transitionend', onDone, { once: true });
    });
  });

  window.addEventListener('resize', () => active && position(active), { passive: true });
}

// re-measure sub slider after pane becomes visible
function refreshSubSegbarSlider() {
  const segbar = document.querySelector('.segbar--sub');
  if (!segbar) return;
  const active = segbar.querySelector('.seg.is-active') || segbar.querySelector('.seg');
  if (!active) return;

  const pr = segbar.getBoundingClientRect();
  const br = active.getBoundingClientRect();
  const slider = segbar.querySelector('.segbar__slider');

  slider.style.width = br.width + 'px';
  slider.style.height = br.height + 'px';
  slider.style.transform = `translate(${br.left - pr.left}px, ${br.top - pr.top}px)`;
}
