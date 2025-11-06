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

function saveBooks(books) {
  localStorage.setItem('libraryBooks', JSON.stringify(books));
}

/* NEW: programmatically set the main segbar's active button + move the slider */
function setMainSegbarActive(id) {
  const segbar = document.querySelector('.segbar');
  if (!segbar) return;

  const btn = document.getElementById(id);
  const slider = segbar.querySelector('.segbar__slider');
  if (!btn || !slider) return;

  // Update active + aria
  segbar.querySelectorAll('.seg').forEach(b => {
    const isActive = b === btn;
    b.classList.toggle('is-active', isActive);
    b.setAttribute('aria-selected', String(isActive));
  });

  // Force slider position
  const pr = segbar.getBoundingClientRect();
  const br = btn.getBoundingClientRect();
  slider.style.width = br.width + 'px';
  slider.style.height = br.height + 'px';
  slider.style.transform = `translate(${br.left - pr.left}px, ${br.top - pr.top}px)`;
}

/* NEW: force the UI to the Books tab */
function switchToBooksTab() {
  const segBooks = document.getElementById('seg-books');
  const segAdd   = document.getElementById('seg-add');

  if (segBooks && segAdd) {
    segAdd.classList.remove('is-active');
    segAdd.setAttribute('aria-selected', 'false');
    segBooks.classList.add('is-active');
    segBooks.setAttribute('aria-selected', 'true');
  }

  // move the orange slider back to the Library button
  setMainSegbarActive('seg-books');

  showBooksPane(); // updates list + hides Add pane
}

function addBookToLocalLibrary(book) {
  const books = getBooks();

  // normalize categories -> array of strings
  const incomingCats = Array.isArray(book.categories)
    ? book.categories.map(String).filter(Boolean)
    : [];

  // de-dupe by ISBN if present
  const idx = book.isbn
    ? books.findIndex(b => normalizeDigits(b.isbn) === normalizeDigits(book.isbn))
    : -1;

  if (idx >= 0) {
    // merge/upgrade existing book with any missing fields + categories
    const existing = books[idx];
    const mergedCats = Array.from(new Set([...(existing.categories || []), ...incomingCats]));
    books[idx] = {
      ...existing,
      ...book,
      categories: mergedCats
    };
  } else {
    books.unshift({
      ...book,
      categories: incomingCats
    });
  }

  saveBooks(books);
  // redirect to Library and move the slider
  switchToBooksTab();
}

function renderBooks(books) {
  const grid = document.getElementById('libraryGrid');
  grid.innerHTML = '';

  books.forEach((b, idx) => {
    // ensure numeric + sane defaults
    b.currentPage = Number.isFinite(Number(b.currentPage)) ? Number(b.currentPage) : 0;
    const parsedPages = parseInt(b.pages, 10);
    b.pages = Number.isFinite(parsedPages) && parsedPages > 0 ? parsedPages : null;

    const percent = b.pages ? Math.min(100, Math.round((b.currentPage / b.pages) * 100)) : 0;

    const card = document.createElement('article');
    card.className = 'bookcard';

    const coverHtml = b.cover
      ? `<img src="${b.cover}" alt="" loading="lazy" />`
      : `<div class="cover-fallback">${escapeHtml(b.emoji || '📕')}</div>`;

    card.innerHTML = `
      <div class="bookcard__cover">${coverHtml}</div>

      <div class="bookcard__body">
        <div class="bookcard__head">
          <h3 class="bookcard__title">${escapeHtml(b.title || 'Untitled')}</h3>
          <button class="bookcard__fav" type="button" aria-label="Favorite">♡</button>
        </div>

        <p class="bookcard__author">${escapeHtml(b.author || '')}</p>
        ${b.pages
          ? `<p class="bookcard__pages" id="pages-${idx}">${b.pages} Pages</p>`
          : `<p class="bookcard__pages" id="pages-${idx}" hidden></p>`}

        <div class="bookcard__chips">
          ${(b.categories || []).slice(0, 4).map(c => `
            <span class="chip chip--yellow">${escapeHtml(c)}</span>
          `).join('')}
        </div>

        <div class="bookcard__actions">
          <button class="btn-log" type="button" data-log-index="${idx}">Log Reading</button>
          <div class="bookcard__progress" id="progress-${idx}">${percent}% Read</div>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  // delegate “Log Reading” clicks
  grid.querySelectorAll('[data-log-index]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const i = Number(e.currentTarget.dataset.logIndex);
      openLogModal(i);
    });
  });
}

function escapeHtml(s) {
  return String(s || '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
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

/* ---------- simple modal for ISBN help ---------- */
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

/* ---------- NEW: scanner modal (flex header) ---------- */
function ensureScanModal() {
  if (document.getElementById('scanModal')) return;

  const modal = document.createElement('div');
  modal.id = 'scanModal';
  modal.className = 'modal';
  modal.setAttribute('aria-hidden', 'true');

  modal.innerHTML = `
    <div class="modal__backdrop" data-close="true"></div>
    <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="scanTitle" tabindex="-1">
      <div class="modal__header" style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
        <h2 id="scanTitle" style="margin:0;">Scan the barcode</h2>
        <button class="modal__close" type="button" aria-label="Close" data-close="true"
          style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;background:none;border:0;cursor:pointer;font-size:22px;line-height:1;">
          ×
        </button>
      </div>

      <div id="scannerViewport" style="width:100%;aspect-ratio:3/2;border-radius:12px;overflow:hidden;background:#000;"></div>
      <p id="scanStatus" style="margin-top:8px;color:#666" aria-live="polite"></p>
    </div>
  `;
  document.body.appendChild(modal);

  // Close on backdrop / X
  modal.addEventListener('click', (e) => {
    if (e.target.dataset.close === 'true') {
      try { stopScanner(); } catch {}
      closeScanModal();
    }
  });

  // Close on Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { try { stopScanner(); } catch {} closeScanModal(); }
  });
}

/* ---------- Log Reading modal ---------- */
function ensureLogModal() {
  if (document.getElementById('logModal')) return;

  const modal = document.createElement('div');
  modal.id = 'logModal';
  modal.className = 'modal';
  modal.setAttribute('aria-hidden', 'true');
  modal.innerHTML = `
    <div class="modal__backdrop" data-close="true"></div>
    <div class="modal__dialog" role="dialog" aria-modal="true" aria-labelledby="logTitle" tabindex="-1">
      <button class="modal__close" type="button" aria-label="Close" data-close="true">×</button>

      <h2 id="logTitle" style="text-align:center;margin:.2rem 0 .25rem;font-weight:900;">Log Reading Session</h2>
      <p id="logSubtitle" style="text-align:center;margin:.1rem 0 1rem;font-style:italic;color:#555"></p>

      <div class="form-row" style="margin-top:6px;">
        <label for="pagesReadInput">Pages Read</label>
        <input id="pagesReadInput" type="number" min="1" inputmode="numeric" placeholder="e.g. 25" />
      </div>

      <!-- NEW: Total pages only shown when book has no total -->
      <div class="form-row" id="totalRow" hidden>
        <label for="totalPagesInput">Total Pages</label>
        <input id="totalPagesInput" type="number" min="1" inputmode="numeric" placeholder="e.g. 374" />
      </div>

      <p id="currentPageNote" style="margin:.5rem 0 1rem;color:#666;font-weight:800;"></p>

      <div class="actions" style="justify-content:flex-start;">
        <button id="logConfirmBtn" class="btn">Log Book</button>
        <button class="link" type="button" data-close="true">Cancel</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  // close on backdrop / × / Cancel
  modal.addEventListener('click', (e) => {
    if (e.target.dataset.close === 'true') closeLogModal();
  });

  // Esc + Enter handlers
  document.addEventListener('keydown', (e) => {
    if (!isLogModalOpen()) return;
    if (e.key === 'Escape') closeLogModal();
    if (e.key === 'Enter') document.getElementById('logConfirmBtn')?.click();
  });
}

function isLogModalOpen() {
  const m = document.getElementById('logModal');
  return m && m.getAttribute('aria-hidden') !== 'true';
}

let _logBookIndex = null;

function openLogModal(bookIndex) {
  ensureLogModal();

  _logBookIndex = bookIndex;
  const books = getBooks();
  const b = books[bookIndex];
  if (!b) return;

  const modal = document.getElementById('logModal');
  modal.removeAttribute('aria-hidden');
  document.body.classList.add('modal-open');

  // hydrate content
  document.getElementById('logSubtitle').textContent = b.title ? b.title : 'Selected Book';

  const total = Number.isFinite(Number(b.pages)) ? Number(b.pages) : 0;
  const curr  = Number.isFinite(Number(b.currentPage)) ? Number(b.currentPage) : 0;

  document.getElementById('currentPageNote').textContent =
    total ? `Current Page: ${curr}/${total}` : `Current Page: ${curr}`;

  // show/hide total pages row
  const totalRow = document.getElementById('totalRow');
  const totalInput = document.getElementById('totalPagesInput');
  if (total > 0) {
    totalRow.hidden = true;
    totalInput.value = '';
  } else {
    totalRow.hidden = false;
    totalInput.value = '';
  }

  const input = document.getElementById('pagesReadInput');
  input.value = '';
  input.focus();

  // wire confirm handler (replace any old one)
  const confirm = document.getElementById('logConfirmBtn');
  confirm.replaceWith(confirm.cloneNode(true));
  const confirmNew = document.getElementById('logConfirmBtn');
  confirmNew.addEventListener('click', commitLogReading);
}

function closeLogModal() {
  const modal = document.getElementById('logModal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
  _logBookIndex = null;
}

function commitLogReading() {
  const amt = parseInt(document.getElementById('pagesReadInput').value, 10);
  if (!Number.isFinite(amt) || amt <= 0) {
    document.getElementById('pagesReadInput').focus();
    return;
  }

  const books = getBooks();
  const b = books[_logBookIndex];
  if (!b) return;

  // resolve total pages
  let total = Number.isFinite(Number(b.pages)) ? Number(b.pages) : null;
  if (!total) {
    const enteredTotal = parseInt(document.getElementById('totalPagesInput').value, 10);
    if (!Number.isFinite(enteredTotal) || enteredTotal <= 0) {
      document.getElementById('totalPagesInput')?.focus();
      return;
    }
    total = enteredTotal;
    b.pages = total; // persist for future
  }

  const prev = Number.isFinite(Number(b.currentPage)) ? Number(b.currentPage) : 0;
  const next = Math.min(total, prev + amt);
  b.currentPage = next;

  saveBooks(books);

  // Update UI without full re-render
  const pct = Math.min(100, Math.round((next / total) * 100));
  const progressEl = document.getElementById(`progress-${_logBookIndex}`);
  if (progressEl) progressEl.textContent = `${pct}% Read`;

  const pagesEl = document.getElementById(`pages-${_logBookIndex}`);
  if (pagesEl) {
    pagesEl.textContent = `${total} Pages`;
    pagesEl.hidden = false;
  }

  closeLogModal();
}

function openScanModal() {
  ensureScanModal();
  const modal = document.getElementById('scanModal');
  if (!modal) return;

  // Safety re-apply in case DOM is rebuilt
  const btn = modal.querySelector('.modal__close');
  if (btn) {
    Object.assign(btn.style, {
      position: 'absolute',
      top: '14px',
      right: '14px',
      left: 'auto',
      fontSize: '22px',
      lineHeight: '1',
      background: 'none',
      border: '0',
      padding: '4px',
      cursor: 'pointer',
      zIndex: '2'
    });
  }

  modal.removeAttribute('aria-hidden');
  document.body.classList.add('modal-open');
  modal.querySelector('.modal__dialog')?.focus();
}

function closeScanModal() {
  const modal = document.getElementById('scanModal');
  if (!modal) return;
  modal.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('modal-open');
}

/* ---------- Google Books lookup helpers ---------- */
function normalizeDigits(s) {
  return String(s || '').replace(/\D/g, '');
}

function toIsbnQuery(code) {
  const clean = normalizeDigits(code);
  // Accept EAN-13 starting 978/979, or pass-through others (UPC often maps to books too)
  return clean || code;
}

async function fetchBookByIsbn(code) {
  const q = toIsbnQuery(code);
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(q)}&maxResults=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Google Books API error');
  const data = await res.json();
  const item = data.items?.[0];
  const v = item?.volumeInfo;
  if (!v) return null;

  // Prefer https covers
  const image = v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail || '';
  const httpsImage = image ? image.replace('http://', 'https://') : '';

  return {
    googleId: item.id,
    isbn: q,
    title: v.title || '',
    author: (v.authors && v.authors.join(', ')) || '',
    pages: v.pageCount || null,
    publisher: v.publisher || '',
    publishedDate: v.publishedDate || '',
    categories: v.categories || [],
    language: v.language || '',
    cover: httpsImage
  };
}

/* ---------- Quagga integration (camera live stream) ---------- */
let scanning = false;
let lastDetectedAt = 0;

function setScanStatus(msg) {
  const el = document.getElementById('scanStatus');
  if (el) el.textContent = msg || '';
}

function startScanner() {
  if (scanning) return;
  if (typeof Quagga === 'undefined') {
    alert('QuaggaJS not loaded. Include it on the page.');
    return;
  }
  openScanModal();
  const target = document.getElementById('scannerViewport');
  if (!target) return;

  scanning = true;
  setScanStatus('Starting camera…');

  Quagga.init({
    inputStream: {
      type: 'LiveStream',
      target,
      constraints: {
        facingMode: 'environment',
        aspectRatio: { min: 1, ideal: 1.777, max: 2 }
      }
    },
    locator: { patchSize: 'medium', halfSample: true },
    numOfWorkers: navigator.hardwareConcurrency || 2,
    frequency: 8,
    decoder: {
      readers: [
        'ean_reader',     // EAN-13 (ISBN-13 likely 978/979)
        'ean_8_reader',
        'upc_reader',
        'upc_e_reader'
      ]
    },
    locate: true
  }, (err) => {
    if (err) {
      console.error(err);
      scanning = false;
      setScanStatus('Camera failed to start. Check permissions/HTTPS.');
      return;
    }
    Quagga.start();
    setScanStatus('Camera ready — point at the barcode.');
  });

  Quagga.onDetected(async (res) => {
    const now = Date.now();
    if (now - lastDetectedAt < 1200) return; // throttle duplicate frames
    lastDetectedAt = now;

    const raw = res?.codeResult?.code?.trim();
    if (!raw) return;

    setScanStatus(`Detected: ${raw}. Looking up the book…`);
    stopScanner(); // stop as soon as we capture one good code

    try {
      const book = await fetchBookByIsbn(raw);
      if (!book) {
        setScanStatus('No book found for that code. Try again or use ISBN search.');
        setTimeout(() => { setScanStatus(''); closeScanModal(); }, 900);
        return;
      }
      addBookToLocalLibrary(book);
      setScanStatus(`Added “${book.title}” ✅`);
    } catch (e) {
      console.error(e);
      setScanStatus('Something went wrong adding the book.');
    } finally {
      setTimeout(() => { setScanStatus(''); closeScanModal(); }, 900);
    }
  });
}

function stopScanner() {
  try { Quagga.stop(); } catch {}
  scanning = false;
}

/* ---------- Upload-photo → decodeSingle → add ---------- */
async function onPhotoChosen(e) {
  const file = e.target.files?.[0];
  const status = document.querySelector('#uploadStatus');
  if (!file) return;

  if (status) status.textContent = 'Reading barcode…';

  const srcUrl = URL.createObjectURL(file);

  Quagga.decodeSingle(
    {
      src: srcUrl,
      numOfWorkers: 0,
      inputStream: { size: 800 },
      decoder: { readers: ['ean_reader'] }
    },
    async (result) => {
      URL.revokeObjectURL(srcUrl);

      const code = result && result.codeResult ? result.codeResult.code : null;
      if (!code) {
        if (status) status.textContent = '';
        alert('Could not find an ISBN from the photo. Please enter the book manually.');
        return;
      }

      if (status) status.textContent = `Found ISBN: ${code}. Looking up book…`;
      try {
        const book = await fetchBookByIsbn(code);
        if (!book) {
          if (status) status.textContent = '';
          alert('No book found for that ISBN. Please enter the book manually.');
          return;
        }

        addBookToLocalLibrary({
          isbn: code,
          title: book.title || '',
          author: book.author || '',
          pages: book.pages || null,
          categories: book.categories || [],
          cover: book.cover || ''
        });

        if (status) status.textContent = 'Added to your library!';
      } catch (err) {
        console.error(err);
        if (status) status.textContent = '';
        alert('There was a problem contacting Google Books. Please enter the book manually.');
      }
    }
  );
}

/* ---------- initial render ---------- */
document.addEventListener('DOMContentLoaded', () => {
  const books = getBooks();
  renderBooks(books);
  updateEmptyState(books);

  mountMainSegbarSlider();
  mountSubSegbarSlider();
  mountExitButton();
});

/* ---------- main segbar (books / add / etc.) ---------- */
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

/* ---------- sub segbar (camera / upload / keyboard) ---------- */
function mountSubSegbarSlider() {
  const segbar = document.querySelector('.segbar--sub');
  if (!segbar) return;

  // --- RENDERERS ------------------------------------------------------------
  const hero = document.querySelector('#addPane .add-hero');

  // helper to align hero
  const setHeroAlign = (isLeft) => {
    if (!hero) return;
    hero.classList.toggle('align-left', !!isLeft);
  };

  const renderCamera = () => {
    if (!hero) return;
    setHeroAlign(false);            // centered
    hero.innerHTML = `
      <div class="big-icon solar--camera-bold"></div>
      <p class="add-sub">Scan the barcode on the back of your book</p>
      <button class="btn btn-dark" id="openCameraBtn" type="button">Open Camera</button>
    `;
    // Wire camera button -> scanner
    const btn = hero.querySelector('#openCameraBtn');
    btn?.addEventListener('click', () => {
      ensureScanModal();
      startScanner();
    });
  };

  // Upload hero with proper IDs + event wiring
  const renderUpload = () => {
    if (!hero) return;
    setHeroAlign(false); // centered
    hero.innerHTML = `
      <div class="big-icon big-upload" aria-hidden="true"></div>
      <p class="add-sub">Upload a photo of the barcode<br/>on the back of your book</p>
      <input id="photoInput" type="file" accept="image/*" hidden />
      <button class="btn btn-dark" id="choosePhotoBtn" type="button">Upload Photo</button>
      <p id="uploadStatus" class="status" style="margin:.6rem 0 0; color:#666;"></p>
    `;

    const fileInput = hero.querySelector('#photoInput');
    const chooseBtn = hero.querySelector('#choosePhotoBtn');
    chooseBtn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', onPhotoChosen);
  };

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

    // ISBN help modal
    form.querySelector('#isbnHelp').addEventListener('click', (e) => {
      e.preventDefault();
      openIsbnModal();
    });

    form.querySelector('#addCoverBtn').addEventListener('click', () => coverInput.click());

    // ISBN search -> fetch from Google Books and add
    form.querySelector('#isbnSearchBtn').addEventListener('click', async () => {
      const isbn = normalizeDigits(form.querySelector('#isbnInput').value.trim());
      if (!isbn) return form.querySelector('#isbnInput').focus();
      try {
        form.querySelector('#isbnSearchBtn').disabled = true;
        const book = await fetchBookByIsbn(isbn);
        if (!book) {
          alert('No book found for that ISBN.');
        } else {
          addBookToLocalLibrary(book);
        }
      } catch (e) {
        console.error(e);
        alert('Error looking up that ISBN.');
      } finally {
        form.querySelector('#isbnSearchBtn').disabled = false;
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const title = form.querySelector('#titleInput').value.trim();
      if (!title) { form.querySelector('#titleInput').focus(); return; }

      const author = form.querySelector('#authorInput').value.trim();
      const pages = parseInt(form.querySelector('#pagesInput').value, 10) || null;

      // Save to localStorage the same way your grid expects, no cover if user didn't upload
      addBookToLocalLibrary({ title, author, pages, emoji: '📘' });
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

// Make the Exit button work (leave Add pane, stop scanner, close modals)
function mountExitButton() {
  const btn =
    document.getElementById('exitButton') ||
    document.querySelector('[data-action="exit"]') ||
    document.querySelector('.js-exit');

  if (!btn) return;

  btn.addEventListener('click', () => {
    // Stop any active scanner and close modals
    try { stopScanner?.(); } catch {}
    try { closeScanModal?.(); } catch {}
    try { closeIsbnModal?.(); } catch {}

    // Return to the Books pane and sync slider/tab
    switchToBooksTab();
  });
}
