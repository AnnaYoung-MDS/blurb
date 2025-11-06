const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const setHidden = (el, hide) => { if (el) el.hidden = !!hide; };
const isFiniteNum = (n) => Number.isFinite(Number(n));
const toInt = (v) => Number.parseInt(v, 10);
const clampPct = (n) => Math.min(100, Math.max(0, Math.round(n)));
const normalizeDigits = (s) => String(s || "").replace(/\D/g, "");

function getBooks() {
  try {
    const raw = localStorage.getItem("libraryBooks");
    const arr = raw ? JSON.parse(raw) : [];

    return arr.map((b) => {
      if (typeof b.fav !== "boolean") {
        b.fav =
          b.fav === true ||
          b.fav === "true" ||
          b.fav === 1 ||
          b.fav === "1";
      }
      return b;
    });
  } catch {
    return [];
  }
}

function saveBooks(books) {
  localStorage.setItem("libraryBooks", JSON.stringify(books));
}

function ensureBookId(b) {
  if (!b.id) {
    b.id =
      (crypto?.randomUUID?.() ||
        "id_" + Date.now() + "_" + Math.random().toString(36).slice(2));
  }
  return b;
}

function addBookToLocalLibrary(book) {
  const books = getBooks();

  const incomingCats = Array.isArray(book.categories)
    ? book.categories.map(String).filter(Boolean)
    : [];

  const idx = book.isbn
    ? books.findIndex(
        (b) => normalizeDigits(b.isbn) === normalizeDigits(book.isbn)
      )
    : -1;

  if (idx >= 0) {
    const existing = ensureBookId(books[idx]);
    const existingCats = Array.isArray(existing.categories)
      ? existing.categories
      : [];
    const mergedCats = Array.from(
      new Set([...existingCats, ...incomingCats])
    );

    books[idx] = ensureBookId({
      ...existing,
      ...book,
      fav: typeof book.fav === "boolean" ? book.fav : existing.fav,
      categories: mergedCats,
    });
  } else {
    books.unshift(
      ensureBookId({
        ...book,
        categories: incomingCats,
        fav: !!book.fav,
      })
    );
  }

  saveBooks(books);

  triggerBookEmojiRain();

  if (typeof setActiveMainSeg === "function") setActiveMainSeg("books");
  else showBooksPane();
}

function renderBooks(books) {
  const grid = document.getElementById("libraryGrid");
  grid.innerHTML = "";

  books.forEach((b, idx) => {
    const currentPage = isFiniteNum(b.currentPage) ? Number(b.currentPage) : 0;
    const parsedPages = toInt(b.pages);
    const pages = isFiniteNum(parsedPages) && parsedPages > 0 ? parsedPages : null;

    const percent = pages ? clampPct((currentPage / pages) * 100) : 0;

    const card = document.createElement("article");
    card.className = "bookcard";

    const coverHtml = b.cover
      ? `<img src="${b.cover}" alt="" loading="lazy" />`
      : `<div class="cover-fallback">${escapeHtml(b.emoji || "📕")}</div>`;

    card.innerHTML = `
      <div class="bookcard__cover">${coverHtml}</div>

      <div class="bookcard__body">
        <div class="bookcard__head">
          <h3 class="bookcard__title">${escapeHtml(b.title || "Untitled")}</h3>
          <button
            class="bookcard__fav"
            type="button"
            aria-label="Favorite"
            aria-pressed="${b.fav ? "true" : "false"}"
            data-book-id="${b.id || ""}"
          >${b.fav ? "♥" : "♡"}</button>
        </div>

        <p class="bookcard__author">${escapeHtml(b.author || "")}</p>
        ${
          pages
            ? `<p class="bookcard__pages" id="pages-${idx}">${pages} Pages</p>`
            : `<p class="bookcard__pages" id="pages-${idx}" hidden></p>`
        }

        <div class="bookcard__chips">
          ${(b.categories || [])
            .slice(0, 4)
            .map(
              (c) => `
            <span class="chip chip--yellow">${escapeHtml(c)}</span>
          `
            )
            .join("")}
        </div>

        <div class="bookcard__actions">
          <button class="btn-log" type="button" data-log-index="${idx}">Log Reading</button>
          <div class="bookcard__progress" id="progress-${idx}">${percent}% Read</div>
        </div>
      </div>
    `;

    grid.appendChild(card);
  });

  $$("[data-log-index]", grid).forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const i = Number(e.currentTarget.dataset.logIndex);
      openLogModal(i);
    });
  });

  $$(".bookcard__fav", grid).forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.bookId;
      if (!id) return;

      const books = getBooks();
      const i = books.findIndex((b) => b.id === id);
      if (i < 0) return;

      books[i].fav = !books[i].fav;
      saveBooks(books);

      btn.textContent = books[i].fav ? "♥" : "♡";
      btn.setAttribute("aria-pressed", books[i].fav ? "true" : "false");

      if (document.body.classList.contains("is-favorites-mode") && !books[i].fav) {
        btn.closest(".bookcard")?.remove();
        const remaining = getBooks().filter((b) => b.fav === true).length;

        const emptyFavEl = document.getElementById("emptyState");
        if (emptyFavEl) emptyFavEl.hidden = remaining > 0;
      }
    });
  });
}

function escapeHtml(s) {
  return String(s || "").replace(/[&<>"]/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  }[c]));
}

function updateEmptyState(books) {
  setHidden(document.getElementById("emptyState"), books.length > 0);
}

function showBooksPane() {
  const books = getBooks();
  renderBooks(books);
  updateEmptyState(books);
  const addPane = document.getElementById("addPane");
  if (addPane) addPane.hidden = true;
  document.getElementById("libraryGrid").hidden = false;
  document.body.classList.remove("is-add-mode", "is-favorites-mode");
}

function getFavoriteBooks() {
  return getBooks().filter((b) => b.fav === true);
}

function showFavoritesPane() {
  const favs = getFavoriteBooks();
  renderBooks(favs);
  updateEmptyState(favs);
  const addPane = document.getElementById("addPane");
  if (addPane) addPane.hidden = true;
  document.getElementById("libraryGrid").hidden = false;
  document.body.classList.remove("is-add-mode");
  document.body.classList.add("is-favorites-mode");
}

function showAddPane() {
  const addPane = document.getElementById("addPane");
  if (addPane) addPane.hidden = false;
  document.getElementById("libraryGrid").hidden = true;
  document.getElementById("emptyState").hidden = true;
  document.body.classList.add("is-add-mode");
  document.body.classList.remove("is-favorites-mode");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => refreshSubSegbarSlider());
  });
}

function ensureIsbnModal() {
  if (document.getElementById("isbnHelpModal")) return;

  const modal = document.createElement("div");
  modal.id = "isbnHelpModal";
  modal.className = "modal";
  modal.setAttribute("aria-hidden", "true");
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

  modal.addEventListener("click", (e) => {
    if (e.target.dataset.close === "true") closeIsbnModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeIsbnModal();
  });
}

function openIsbnModal() {
  ensureIsbnModal();
  const modal = document.getElementById("isbnHelpModal");
  if (!modal) return;
  modal.removeAttribute("aria-hidden");
  document.body.classList.add("modal-open");
  modal.querySelector(".modal__dialog")?.focus();
}

function closeIsbnModal() {
  const modal = document.getElementById("isbnHelpModal");
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function ensureScanModal() {
  if (document.getElementById("scanModal")) return;

  const modal = document.createElement("div");
  modal.id = "scanModal";
  modal.className = "modal";
  modal.setAttribute("aria-hidden", "true");

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

  modal.addEventListener("click", (e) => {
    if (e.target.dataset.close === "true") {
      try { stopScanner(); } catch {}
      closeScanModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      try { stopScanner(); } catch {}
      closeScanModal();
    }
  });
}

function ensureLogModal() {
  if (document.getElementById("logModal")) return;

  const modal = document.createElement("div");
  modal.id = "logModal";
  modal.className = "modal";
  modal.setAttribute("aria-hidden", "true");
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

  modal.addEventListener("click", (e) => {
    if (e.target.dataset.close === "true") closeLogModal();
  });

  document.addEventListener("keydown", (e) => {
    if (!isLogModalOpen()) return;
    if (e.key === "Escape") closeLogModal();
    if (e.key === "Enter") document.getElementById("logConfirmBtn")?.click();
  });
}

function isLogModalOpen() {
  const m = document.getElementById("logModal");
  return m && m.getAttribute("aria-hidden") !== "true";
}

let _logBookIndex = null;

function openLogModal(bookIndex) {
  ensureLogModal();

  _logBookIndex = bookIndex;
  const books = getBooks();
  const b = books[bookIndex];
  if (!b) return;

  const modal = document.getElementById("logModal");
  modal.removeAttribute("aria-hidden");
  document.body.classList.add("modal-open");

  document.getElementById("logSubtitle").textContent = b.title ? b.title : "Selected Book";

  const total = isFiniteNum(b.pages) ? Number(b.pages) : 0;
  const curr  = isFiniteNum(b.currentPage) ? Number(b.currentPage) : 0;

  document.getElementById("currentPageNote").textContent =
    total ? `Current Page: ${curr}/${total}` : `Current Page: ${curr}`;

  const totalRow = document.getElementById("totalRow");
  const totalInput = document.getElementById("totalPagesInput");
  if (total > 0) {
    totalRow.hidden = true;
    totalInput.value = "";
  } else {
    totalRow.hidden = false;
    totalInput.value = "";
  }

  const input = document.getElementById("pagesReadInput");
  input.value = "";
  input.focus();

  const confirm = document.getElementById("logConfirmBtn");
  confirm.replaceWith(confirm.cloneNode(true));
  document.getElementById("logConfirmBtn").addEventListener("click", commitLogReading);
}

function closeLogModal() {
  const modal = document.getElementById("logModal");
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  _logBookIndex = null;
}

function commitLogReading() {
  const amt = toInt(document.getElementById("pagesReadInput").value);
  if (!Number.isFinite(amt) || amt <= 0) {
    document.getElementById("pagesReadInput").focus();
    return;
  }

  const books = getBooks();
  const b = books[_logBookIndex];
  if (!b) return;

  let total = isFiniteNum(b.pages) ? Number(b.pages) : null;
  if (!total) {
    const enteredTotal = toInt(document.getElementById("totalPagesInput").value);
    if (!Number.isFinite(enteredTotal) || enteredTotal <= 0) {
      document.getElementById("totalPagesInput")?.focus();
      return;
    }
    total = enteredTotal;
    b.pages = total; 
  }

  const prev = isFiniteNum(b.currentPage) ? Number(b.currentPage) : 0;
  const next = Math.min(total, prev + amt);
  b.currentPage = next;

  saveBooks(books);

  const pct = clampPct((next / total) * 100);
  const progressEl = document.getElementById(`progress-${_logBookIndex}`);
  if (progressEl) progressEl.textContent = `${pct}% Read`;

  const pagesEl = document.getElementById(`pages-${_logBookIndex}`);
  if (pagesEl) {
    pagesEl.textContent = `${total} Pages`;
    pagesEl.hidden = false;
  }

  triggerReadingConfetti();

  closeLogModal();
}

function segKind(btn) {
  const id = btn?.id || "";
  const view = btn?.dataset?.view || "";
  if (id === "seg-add" || view === "add") return "add";
  if (id === "seg-fav" || view === "fav" || view === "favorites") return "favorites";
  return "books";
}

function setActiveMainSeg(which) {
  const segbar = document.querySelector(".segbar");
  if (!segbar) {
    if (which === "favorites") showFavoritesPane();
    else if (which === "add") showAddPane();
    else showBooksPane();
    return;
  }

  const segBooks =
    document.getElementById("seg-books") ||
    segbar.querySelector('[data-view="books"]') ||
    segbar.querySelector(".seg");

  const segAdd =
    document.getElementById("seg-add") || segbar.querySelector('[data-view="add"]');

  const segFav =
    document.getElementById("seg-fav") ||
    segbar.querySelector('[data-view="fav"],[data-view="favorites"]');

  const slider = segbar.querySelector(".segbar__slider");

  const next =
    which === "favorites" ? segFav : which === "add" ? segAdd : segBooks;

  const curr = segbar.querySelector(".seg.is-active");

  if (curr !== next) {
    curr?.classList.remove("is-active");
    curr?.setAttribute("aria-selected", "false");
    next?.classList.add("is-active");
    next?.setAttribute("aria-selected", "true");
  }

  if (next && slider) {
    const pr = segbar.getBoundingClientRect();
    const br = next.getBoundingClientRect();
    slider.style.width = br.width + "px";
    slider.style.height = br.height + "px";
    slider.style.transform = `translate(${br.left - pr.left}px, ${br.top - pr.top}px)`;
  }

  if (which === "favorites") showFavoritesPane();
  else if (which === "add") showAddPane();
  else showBooksPane();
}

let scanning = false;
let lastDetectedAt = 0;
let _onDetectedHandler = null; 

function setScanStatus(msg) {
  const el = document.getElementById("scanStatus");
  if (el) el.textContent = msg || "";
}

function openScanModal() {
  ensureScanModal();
  const modal = document.getElementById("scanModal");
  if (!modal) return;

  const btn = modal.querySelector(".modal__close");
  if (btn) {
    Object.assign(btn.style, {
      position: "absolute",
      top: "14px",
      right: "14px",
      left: "auto",
      fontSize: "22px",
      lineHeight: "1",
      background: "none",
      border: "0",
      padding: "4px",
      cursor: "pointer",
      zIndex: "2",
    });
  }

  modal.removeAttribute("aria-hidden");
  document.body.classList.add("modal-open");
  modal.querySelector(".modal__dialog")?.focus();
}

function closeScanModal() {
  const modal = document.getElementById("scanModal");
  if (!modal) return;
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

function startScanner() {
  if (scanning) return;
  if (typeof Quagga === "undefined") {
    alert("QuaggaJS not loaded. Include it on the page.");
    return;
  }
  openScanModal();
  const target = document.getElementById("scannerViewport");
  if (!target) return;

  scanning = true;
  setScanStatus("Starting camera…");

  Quagga.init(
    {
      inputStream: {
        type: "LiveStream",
        target,
        constraints: {
          facingMode: "environment",
          aspectRatio: { min: 1, ideal: 1.777, max: 2 },
        },
      },
      locator: { patchSize: "medium", halfSample: true },
      numOfWorkers: navigator.hardwareConcurrency || 2,
      frequency: 8,
      decoder: {
        readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader"],
      },
      locate: true,
    },
    (err) => {
      if (err) {
        console.error(err);
        scanning = false;
        setScanStatus("Camera failed to start. Check permissions/HTTPS.");
        return;
      }
      Quagga.start();
      setScanStatus("Camera ready — point at the barcode.");
    }
  );

  _onDetectedHandler = async (res) => {
    const now = Date.now();
    if (now - lastDetectedAt < 1200) return;
    lastDetectedAt = now;

    const raw = res?.codeResult?.code?.trim();
    if (!raw) return;

    setScanStatus(`Detected: ${raw}. Looking up the book…`);
    stopScanner();

    try {
      const book = await fetchBookByIsbn(raw);
      if (!book) {
        setScanStatus("No book found for that code. Try again or use ISBN search.");
        setTimeout(() => {
          setScanStatus("");
          closeScanModal();
        }, 900);
        return;
      }
      addBookToLocalLibrary(book); 
      setScanStatus(`Added “${book.title}” ✅`);
    } catch (e) {
      console.error(e);
      setScanStatus("Something went wrong adding the book.");
    } finally {
      setTimeout(() => {
        setScanStatus("");
        closeScanModal();
      }, 900);
    }
  };

  Quagga.onDetected(_onDetectedHandler);
}

function stopScanner() {
  try {
    if (_onDetectedHandler && typeof Quagga.offDetected === "function") {
      Quagga.offDetected(_onDetectedHandler);
    }
  } catch {}
  _onDetectedHandler = null;

  try { Quagga.stop(); } catch {}
  scanning = false;

  const vp = document.getElementById("scannerViewport");
  if (vp) vp.innerHTML = "";
}

async function onPhotoChosen(e) {
  const file = e.target.files?.[0];
  const status = document.querySelector("#uploadStatus");
  if (!file) return;

  if (status) status.textContent = "Reading barcode…";

  const srcUrl = URL.createObjectURL(file);

  Quagga.decodeSingle(
    {
      src: srcUrl,
      numOfWorkers: 0,
      inputStream: { size: 800 }, 
      decoder: { readers: ["ean_reader"] },
    },
    async (result) => {
      URL.revokeObjectURL(srcUrl);

      const code = result && result.codeResult ? result.codeResult.code : null;
      if (!code) {
        if (status) status.textContent = "";
        alert("Could not find an ISBN from the photo. Please enter the book manually.");
        return;
      }

      if (status) status.textContent = `Found ISBN: ${code}. Looking up book…`;
      try {
        const book = await fetchBookByIsbn(code);
        if (!book) {
          if (status) status.textContent = "";
          alert("No book found for that ISBN. Please enter the book manually.");
          return;
        }

        addBookToLocalLibrary({
          isbn: code,
          title: book.title || "",
          author: book.author || "",
          pages: book.pages || null,
          categories: book.categories || [],
          cover: book.cover || "",
        });

        if (status) status.textContent = "Added to your library!";
      } catch (err) {
        console.error(err);
        if (status) status.textContent = "";
        alert("There was a problem contacting Google Books. Please enter the book manually.");
      }
    }
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const books = getBooks();
  renderBooks(books);
  updateEmptyState(books);

  mountMainSegbarSlider();
  mountSubSegbarSlider();
  mountExitButton();
});

function mountMainSegbarSlider() {
  const segbar = document.querySelector(".segbar");
  if (!segbar) return;

  let slider = segbar.querySelector(".segbar__slider");
  if (!slider) {
    slider = document.createElement("div");
    slider.className = "segbar__slider";
    slider.style.pointerEvents = "none";
    segbar.appendChild(slider);
  }

  const positionSlider = (btn) => {
    const pr = segbar.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    slider.style.width = br.width + "px";
    slider.style.height = br.height + "px";
    slider.style.transform = `translate(${br.left - pr.left}px, ${br.top - pr.top}px)`;
  };

  const initialActive = segbar.querySelector(".seg.is-active") || segbar.querySelector(".seg");
  if (initialActive) {
    positionSlider(initialActive);
    const kind = segKind(initialActive);
    if (kind === "add") showAddPane();
    else if (kind === "favorites") showFavoritesPane();
    else showBooksPane();
  }

  $$(".seg", segbar).forEach((btn) => {
    btn.addEventListener("click", () => {
      const activeNow = segbar.querySelector(".seg.is-active");
      if (btn === activeNow) return;

      segbar.classList.add("is-animating");
      positionSlider(btn);

      const onDone = () => {
        activeNow?.classList.remove("is-active");
        activeNow?.setAttribute("aria-selected", "false");

        btn.classList.add("is-active");
        btn.setAttribute("aria-selected", "true");

        const kind = segKind(btn);
        if (kind === "add") showAddPane();
        else if (kind === "favorites") showFavoritesPane();
        else showBooksPane();

        segbar.classList.remove("is-animating");
      };

      slider.addEventListener("transitionend", onDone, { once: true });
    });
  });

  window.addEventListener(
    "resize",
    () => {
      const activeNow = segbar.querySelector(".seg.is-active");
      if (activeNow) positionSlider(activeNow);
    },
    { passive: true }
  );
}

function mountSubSegbarSlider() {
  const segbar = document.querySelector(".segbar--sub");
  if (!segbar) return;

  const hero = document.querySelector("#addPane .add-hero");

  const setHeroAlign = (isLeft) => {
    if (!hero) return;
    hero.classList.toggle("align-left", !!isLeft);
  };

  const renderCamera = () => {
    if (!hero) return;
    setHeroAlign(false);
    hero.innerHTML = `
      <div class="big-icon solar--camera-bold"></div>
      <p class="add-sub">Scan the barcode on the back of your book</p>
      <button class="btn btn-dark" id="openCameraBtn" type="button">Open Camera</button>
    `;
    hero.querySelector("#openCameraBtn")?.addEventListener("click", () => {
      ensureScanModal();
      startScanner();
    });
  };

  const renderUpload = () => {
    if (!hero) return;
    setHeroAlign(false);
    hero.innerHTML = `
      <div class="big-icon big-upload" aria-hidden="true"></div>
      <p class="add-sub">Upload a photo of the barcode<br/>on the back of your book</p>
      <input id="photoInput" type="file" accept="image/*" hidden />
      <button class="btn btn-dark" id="choosePhotoBtn" type="button">Upload Photo</button>
      <p id="uploadStatus" class="status" style="margin:.6rem 0 0; color:#666;"></p>
    `;

    const fileInput = hero.querySelector("#photoInput");
    const chooseBtn = hero.querySelector("#choosePhotoBtn");
    chooseBtn.addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", onPhotoChosen);
  };

  const renderManual = () => {
    if (!hero) return;
    setHeroAlign(true);
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

    const form = hero.querySelector("#manualForm");
    const coverInput = form.querySelector("#coverInput");

    form.querySelector("#isbnHelp").addEventListener("click", (e) => {
      e.preventDefault();
      openIsbnModal();
    });

    form.querySelector("#addCoverBtn").addEventListener("click", () => coverInput.click());

    form.querySelector("#isbnSearchBtn").addEventListener("click", async () => {
      const isbn = normalizeDigits(form.querySelector("#isbnInput").value.trim());
      if (!isbn) return form.querySelector("#isbnInput").focus();
      try {
        form.querySelector("#isbnSearchBtn").disabled = true;
        const book = await fetchBookByIsbn(isbn);
        if (!book) {
          alert("No book found for that ISBN.");
        } else {
          addBookToLocalLibrary(book);
        }
      } catch (e) {
        console.error(e);
        alert("Error looking up that ISBN.");
      } finally {
        form.querySelector("#isbnSearchBtn").disabled = false;
      }
    });

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const title = form.querySelector("#titleInput").value.trim();
      if (!title) {
        form.querySelector("#titleInput").focus();
        return;
      }

      const author = form.querySelector("#authorInput").value.trim();
      const pages = toInt(form.querySelector("#pagesInput").value) || null;

      addBookToLocalLibrary({ title, author, pages, emoji: "📘" });
    });
  };

  let slider = segbar.querySelector(".segbar__slider");
  if (!slider) {
    slider = document.createElement("div");
    slider.className = "segbar__slider";
    segbar.appendChild(slider);
  }

  const position = (btn) => {
    const pr = segbar.getBoundingClientRect();
    const br = btn.getBoundingClientRect();
    slider.style.width = br.width + "px";
    slider.style.height = br.height + "px";
    slider.style.transform = `translate(${br.left - pr.left}px, ${br.top - pr.top}px)`;
  };

  const initialActive =
    segbar.querySelector(".seg.is-active") || segbar.querySelector(".seg");
  if (initialActive) {
    position(initialActive);
    if (initialActive.id === "add-camera") renderCamera();
    else if (initialActive.id === "add-upload") renderUpload();
    else renderManual();
  }

  $$(".seg", segbar).forEach((btn) => {
    btn.addEventListener("click", () => {
      const activeNow = segbar.querySelector(".seg.is-active");
      if (btn === activeNow) return;

      activeNow?.classList.remove("is-active");
      activeNow?.setAttribute("aria-selected", "false");

      position(btn);

      const onDone = () => {
        btn.classList.add("is-active");
        btn.setAttribute("aria-selected", "true");

        if (btn.id === "add-camera") renderCamera();
        else if (btn.id === "add-upload") renderUpload();
        else renderManual();
      };

      slider.addEventListener("transitionend", onDone, { once: true });
    });
  });

  window.addEventListener(
    "resize",
    () => {
      const activeNow =
        segbar.querySelector(".seg.is-active") || segbar.querySelector(".seg");
      if (activeNow) position(activeNow);
    },
    { passive: true }
  );
}

function refreshSubSegbarSlider() {
  const segbar = document.querySelector(".segbar--sub");
  if (!segbar) return;
  const active = segbar.querySelector(".seg.is-active") || segbar.querySelector(".seg");
  if (!active) return;

  const pr = segbar.getBoundingClientRect();
  const br = active.getBoundingClientRect();
  const slider = segbar.querySelector(".segbar__slider");

  slider.style.width = br.width + "px";
  slider.style.height = br.height + "px";
  slider.style.transform = `translate(${br.left - pr.left}px, ${br.top - pr.top}px)`;
}

function mountExitButton() {
  const btn =
    document.getElementById("exitButton") ||
    document.querySelector('[data-action="exit"]') ||
    document.querySelector(".js-exit");

  if (!btn) return;

  btn.addEventListener("click", () => {
    try { stopScanner?.(); } catch {}
    try { closeScanModal?.(); } catch {}
    try { closeIsbnModal?.(); } catch {}

    setActiveMainSeg?.("books") || showBooksPane();
  });
}

function toIsbnQuery(code) {
  const clean = normalizeDigits(code);
  return clean || code;
}

async function fetchBookByIsbn(code) {
  const q = toIsbnQuery(code);
  const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${encodeURIComponent(
    q
  )}&maxResults=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Google Books API error");
  const data = await res.json();
  const item = data.items?.[0];
  const v = item?.volumeInfo;
  if (!v) return null;

  const image = v.imageLinks?.thumbnail || v.imageLinks?.smallThumbnail || "";
  const httpsImage = image ? image.replace("http://", "https://") : "";

  return {
    googleId: item.id,
    isbn: q,
    title: v.title || "",
    author: (v.authors && v.authors.join(", ")) || "",
    pages: v.pageCount || null,
    publisher: v.publisher || "",
    publishedDate: v.publishedDate || "",
    categories: v.categories || [],
    language: v.language || "",
    cover: httpsImage,
  };
}

function triggerBookEmojiRain(opts = {}) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const {
    count = 70,
    fallMin = 4,
    fallMax = 7,
    drift = 80,
    emojis = ["📚", "📘", "📕", "📗", "📙", "📒", "📖", "🔖"],
  } = opts;

  if (!document.getElementById("book-rain-styles")) {
    const style = document.createElement("style");
    style.id = "book-rain-styles";
    style.textContent = `
      @keyframes bookRainFall {
        0%   { transform: translate3d(var(--x,0), -10vh, 0) rotate(var(--r0,0deg)); opacity: 0; }
        5%   { opacity: 1; }
        100% { transform: translate3d(calc(var(--x,0) + var(--drift,0px)), 110vh, 0) rotate(var(--r1,0deg)); opacity: 0.9; }
      }
      .book-rain {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 2147483000;
        overflow: hidden;
      }
      .book-drop {
        position: absolute;
        top: 0;
        will-change: transform, opacity;
        font-size: clamp(18px, 3.2vw, 36px);
        filter: drop-shadow(0 3px 3px rgba(0,0,0,.15));
        animation-name: bookRainFall;
        animation-timing-function: cubic-bezier(.2,.6,.35,1);
        animation-fill-mode: forwards;
      }
    `;
    document.head.appendChild(style);
  }

  const layer = document.createElement("div");
  layer.className = "book-rain";
  document.body.appendChild(layer);

  const rand = (min, max) => Math.random() * (max - min) + min;

  for (let i = 0; i < count; i++) {
    const el = document.createElement("span");
    el.className = "book-drop";
    el.textContent = emojis[(Math.random() * emojis.length) | 0];

    const startX = rand(0, window.innerWidth);
    const endDrift = (Math.random() < 0.5 ? -1 : 1) * rand(drift * 0.4, drift);
    const rot0 = `${rand(-30, 30)}deg`;
    const rot1 = `${rand(160, 520)}deg`;
    const delay = rand(0, 0.9);
    const dur = rand(fallMin, fallMax);

    el.style.left = `${startX}px`;
    el.style.setProperty("--x", "0px");
    el.style.setProperty("--drift", `${endDrift}px`);
    el.style.setProperty("--r0", rot0);
    el.style.setProperty("--r1", rot1);
    el.style.animationDuration = `${dur}s`;
    el.style.animationDelay = `${delay}s`;

    layer.appendChild(el);
  }

  const maxLifetime = (fallMax + 1) * 1000;
  window.setTimeout(() => {
    layer.remove();
  }, maxLifetime);
}

function triggerReadingConfetti(opts = {}) {
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const {
    count = 120,
    fallMin = 900, 
    fallMax = 1800,
    sizeMin = 6,
    sizeMax = 12,
    spread = 120,
    colors = [
      "#ff4757",
      "#ffa502",
      "#2ed573",
      "#1e90ff",
      "#a55eea",
      "#ff6b81",
      "#7bed9f",
      "#70a1ff",
      "#eccc68",
      "#2f3542",
    ],
  } = opts;

  if (!document.getElementById("confetti-styles")) {
    const style = document.createElement("style");
    style.id = "confetti-styles";
    style.textContent = `
      @keyframes confetti-fall {
        0%   { transform: translate3d(var(--x,0), -10vh, 0) rotate(var(--r0)); opacity: 0; }
        10%  { opacity: 1; }
        100% { transform: translate3d(calc(var(--x,0) + var(--dx)), 105vh, 0) rotate(var(--r1)); opacity: 1; }
      }
      .confetti-layer {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 2147483001; /* above modals */
        overflow: hidden;
      }
      .confetti-piece {
        position: absolute;
        top: 0;
        will-change: transform, opacity;
        animation-name: confetti-fall;
        animation-timing-function: cubic-bezier(.2,.6,.35,1);
        animation-fill-mode: forwards;
        border-radius: 2px;
      }
    `;
    document.head.appendChild(style);
  }

  const layer = document.createElement("div");
  layer.className = "confetti-layer";
  document.body.appendChild(layer);

  const rand = (min, max) => Math.random() * (max - min) + min;

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";

    const w = rand(sizeMin, sizeMax);
    const h = rand(sizeMin * 0.6, sizeMax * 1.4);
    piece.style.width = `${w}px`;
    piece.style.height = `${h}px`;

    piece.style.background = colors[(Math.random() * colors.length) | 0];
    const x = rand(0, window.innerWidth);
    piece.style.left = `${x}px`;

    const drift = (Math.random() < 0.5 ? -1 : 1) * rand(spread * 0.5, spread);
    const r0 = `${rand(-90, 90)}deg`;
    const r1 = `${rand(360, 1080)}deg`;
    const dur = rand(fallMin, fallMax);
    const delay = rand(0, 200);

    piece.style.setProperty("--x", "0px");
    piece.style.setProperty("--dx", `${drift}px`);
    piece.style.setProperty("--r0", r0);
    piece.style.setProperty("--r1", r1);
    piece.style.animationDuration = `${dur}ms`;
    piece.style.animationDelay = `${delay}ms`;

    layer.appendChild(piece);
  }

  const maxLifetime = fallMax + 250;
  setTimeout(() => layer.remove(), maxLifetime + 220);
}