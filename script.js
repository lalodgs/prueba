/* ---------------- BANNER ---------------- */
const bannerTrack = document.getElementById('bannerTrack');
const bannerOriginals = bannerTrack ? Array.from(bannerTrack.children) : [];
const bannerOriginalCount = bannerOriginals.length;
let bannerVisualIndex = 1;
let bannerInterval = null;
let bannerAnimating = false;
const AUTOPLAY_MS = 6000;

function setupBannerLoop() {
  if (!bannerTrack || bannerOriginalCount === 0) return;
  const firstClone = bannerOriginals[0].cloneNode(true);
  firstClone.classList.add('clone');
  firstClone.setAttribute('aria-hidden', 'true');
  const lastClone = bannerOriginals[bannerOriginalCount - 1].cloneNode(true);
  lastClone.classList.add('clone');
  lastClone.setAttribute('aria-hidden', 'true');
  bannerTrack.innerHTML = '';
  bannerTrack.appendChild(lastClone);
  bannerOriginals.forEach(s => bannerTrack.appendChild(s.cloneNode(true)));
  bannerTrack.appendChild(firstClone);
  bannerVisualIndex = 1;
  bannerTrack.style.transition = 'none';
  bannerTrack.style.transform = `translateX(-${bannerVisualIndex * 100}%)`;
  updateBannerAria();
  bannerTrack.offsetHeight;
  bannerTrack.style.transition = 'transform 0.8s cubic-bezier(.2,.9,.2,1)';
}

function updateBannerAria() {
  if (!bannerTrack) return;
  const slides = Array.from(bannerTrack.children);
  slides.forEach((el, i) => el.setAttribute('aria-hidden', i === bannerVisualIndex ? 'false' : 'true'));
}

function moveBannerToVisual(index) {
  if (!bannerTrack || bannerAnimating) return;
  bannerAnimating = true;
  bannerVisualIndex = index;
  bannerTrack.style.transition = 'transform 0.8s cubic-bezier(.2,.9,.2,1)';
  bannerTrack.style.transform = `translateX(-${bannerVisualIndex * 100}%)`;
  updateBannerAria();
}

if (bannerTrack) {
  bannerTrack.addEventListener('transitionend', (e) => {
    if (e.target !== bannerTrack) return;
    if (bannerVisualIndex === bannerOriginalCount + 1) {
      bannerTrack.style.transition = 'none';
      bannerVisualIndex = 1;
      bannerTrack.style.transform = `translateX(-${bannerVisualIndex * 100}%)`;
      updateBannerAria();
      bannerTrack.offsetHeight;
      bannerTrack.style.transition = 'transform 0.8s cubic-bezier(.2,.9,.2,1)';
    }
    if (bannerVisualIndex === 0) {
      bannerTrack.style.transition = 'none';
      bannerVisualIndex = bannerOriginalCount;
      bannerTrack.style.transform = `translateX(-${bannerVisualIndex * 100}%)`;
      updateBannerAria();
      bannerTrack.offsetHeight;
      bannerTrack.style.transition = 'transform 0.8s cubic-bezier(.2,.9,.2,1)';
    }
    bannerAnimating = false;
  });
}

function bannerNext() { if (bannerAnimating) return; moveBannerToVisual(bannerVisualIndex + 1); restartBannerAutoplay(); }
function bannerPrev() { if (bannerAnimating) return; moveBannerToVisual(bannerVisualIndex - 1); restartBannerAutoplay(); }
function startBannerAutoplay(){ if (bannerInterval) return; bannerInterval = setInterval(()=>{ if (bannerAnimating) return; bannerNext(); }, AUTOPLAY_MS); }
function stopBannerAutoplay(){ if (bannerInterval){ clearInterval(bannerInterval); bannerInterval=null; } }
function restartBannerAutoplay(){ stopBannerAutoplay(); startBannerAutoplay(); }

setupBannerLoop();
startBannerAutoplay();

if (bannerTrack) {
  bannerTrack.addEventListener('mouseenter', stopBannerAutoplay);
  bannerTrack.addEventListener('mouseleave', startBannerAutoplay);
}
const bannerPrevBtn = document.getElementById('bannerPrev');
const bannerNextBtn = document.getElementById('bannerNext');
if (bannerPrevBtn) bannerPrevBtn.addEventListener('click', ()=>bannerPrev());
if (bannerNextBtn) bannerNextBtn.addEventListener('click', ()=>bannerNext());

/* ---------------- CARRUSEL HORIZONTAL (inicia desde el primer item) ---------------- */
const horizontalCarousel = document.getElementById('horizontalCarousel');
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
let items = [];
let N = 0;
let itemFullWidth = 0;
let gap = 12;
let isAnimating = false;
const STEP_SLOTS = 1;

function smoothScrollBy(container, distance, duration = 420) {
  return new Promise((resolve) => {
    const start = container.scrollLeft;
    const startTime = performance.now();
    function animate(time) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      container.scrollLeft = start + distance * ease;
      if (progress < 1) requestAnimationFrame(animate);
      else resolve();
    }
    requestAnimationFrame(animate);
  });
}

function computeSizes(){
  if (!horizontalCarousel) return false;
  const firstItem = horizontalCarousel.querySelector('.icon-card');
  if(!firstItem) return false;
  const style = getComputedStyle(horizontalCarousel);
  const gapStr = style.getPropertyValue('gap') || style.gap || '12px';
  gap = parseFloat(gapStr) || 12;
  const rect = firstItem.getBoundingClientRect();
  itemFullWidth = rect.width + gap;
  return itemFullWidth > 0;
}

function ensureSizesReady() {
  return new Promise(resolve => {
    const tryReady = () => {
      if (computeSizes()) return resolve();
      requestAnimationFrame(tryReady);
    };
    requestAnimationFrame(tryReady);
  });
}

function cleanNodeListeners(node) { const clone = node.cloneNode(true); node.replaceWith(clone); return clone; }

function attachIconInteractions(){
  if (!horizontalCarousel) return;
  horizontalCarousel.querySelectorAll('.icon-card').forEach(card => {
    const fresh = cleanNodeListeners(card);
    fresh.addEventListener('click', () => {
      const content = fresh.querySelector('.icon-card-content');
      const text = content ? content.textContent.trim() : fresh.textContent.trim();
      console.log('Categoría (click):', text);
    });
    const content = fresh.querySelector('.icon-card-content');
    if (!content) return;
    const maxMove = 10;
    const onMove = (e) => {
      const clientX = e.clientX ?? (e.touches && e.touches[0] && e.touches[0].clientX);
      const clientY = e.clientY ?? (e.touches && e.touches[0] && e.touches[0].clientY);
      if (clientX == null) return;
      const rect = fresh.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const centerX = rect.width/2;
      const centerY = rect.height/2;
      const moveX = Math.max(Math.min(-(x - centerX) / centerX * maxMove, maxMove), -maxMove);
      const moveY = Math.max(Math.min(-(y - centerY) / centerY * maxMove, maxMove), -maxMove);
      content.style.transform = `translate(${moveX}px, ${moveY}px)`;
    };
    const onLeave = () => content.style.transform = `translate(0px, 0px)`;
    fresh.addEventListener('pointermove', onMove);
    fresh.addEventListener('pointerleave', onLeave);
  });
}

async function setupNonLoopCarousel() {
  if (!horizontalCarousel) return;
  items = Array.from(horizontalCarousel.children);
  N = items.length;
  await ensureSizesReady();
  attachIconInteractions();

  // inicio en el primer slot
  horizontalCarousel.scrollLeft = 0;
  updateNavButtons();
  updateEdgeClasses();
}

function getVisibleCount() {
  if (!itemFullWidth || !horizontalCarousel) return 6;
  return Math.max(1, Math.floor(horizontalCarousel.clientWidth / itemFullWidth));
}
function getMaxIndex() {
  const visible = getVisibleCount();
  return Math.max(0, N - visible);
}

function updateNavButtons() {
  if (!horizontalCarousel) return;
  if (!itemFullWidth) { computeSizes(); }
  const startIndex = Math.round(horizontalCarousel.scrollLeft / (itemFullWidth || 1));
  const maxIndex = getMaxIndex();
  // left button: still disabled at leftmost
  if (leftBtn) leftBtn.disabled = startIndex <= 0;
  // Right button stays enabled as before
}

async function scrollSlots(direction = 1) {
  if (isAnimating || !horizontalCarousel) return;
  if (!itemFullWidth) { if(!computeSizes()) await ensureSizesReady(); }
  const startIndex = Math.round(horizontalCarousel.scrollLeft / itemFullWidth);
  const maxIndex = getMaxIndex();
  const targetIndexUnclamped = startIndex + STEP_SLOTS * direction;
  const targetIndex = Math.max(0, Math.min(maxIndex, targetIndexUnclamped));
  const deltaSlots = targetIndex - startIndex;
  if (deltaSlots === 0) { updateNavButtons(); updateEdgeClasses(); return; }
  const distance = itemFullWidth * deltaSlots;
  try {
    isAnimating = true;
    await smoothScrollBy(horizontalCarousel, distance, 420);
    horizontalCarousel.scrollLeft = Math.round(targetIndex * itemFullWidth);
    updateNavButtons();
    updateEdgeClasses();
  } finally {
    setTimeout(()=>{ isAnimating=false; }, 60);
  }
}

if (leftBtn) leftBtn.addEventListener('click', ()=>scrollSlots(-1));
if (rightBtn) rightBtn.addEventListener('click', ()=>scrollSlots(1));

if (horizontalCarousel) {
  horizontalCarousel.addEventListener('keydown', (e)=>{
    if (e.key === 'ArrowLeft') scrollSlots(-1);
    if (e.key === 'ArrowRight') scrollSlots(1);
  });
}

let scrollDebounce = null;
if (horizontalCarousel) {
  horizontalCarousel.addEventListener('scroll', ()=>{
    if (scrollDebounce) clearTimeout(scrollDebounce);
    scrollDebounce = setTimeout(()=>{
      if (itemFullWidth) {
        const nearest = Math.round(horizontalCarousel.scrollLeft / itemFullWidth);
        horizontalCarousel.scrollLeft = Math.round(nearest * itemFullWidth);
      }
      updateNavButtons();
      updateEdgeClasses();
    }, 80);
  });
}

if ('ontouchstart' in window && horizontalCarousel) {
  horizontalCarousel.addEventListener('touchend', ()=>{
    if (!itemFullWidth) return;
    const nearest = Math.round(horizontalCarousel.scrollLeft / itemFullWidth);
    horizontalCarousel.scrollLeft = Math.round(nearest * itemFullWidth);
    setTimeout(()=>{ updateNavButtons(); updateEdgeClasses(); }, 60);
  });
}

let resizeTimer = null;
window.addEventListener('resize', ()=>{
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(async ()=>{
    const oldItemFull = itemFullWidth;
    computeSizes();
    const approxIndex = oldItemFull ? Math.round(horizontalCarousel.scrollLeft / oldItemFull) : Math.round(horizontalCarousel.scrollLeft / (itemFullWidth || 1));
    const maxIndex = getMaxIndex();
    const indexToUse = Math.max(0, Math.min(maxIndex, approxIndex));
    horizontalCarousel.scrollLeft = Math.round(indexToUse * itemFullWidth);
    updateNavButtons();
    updateEdgeClasses();
  }, 120);
});

/* ---------------------------------------- */
function clearEdgeClasses() {
  items.forEach(it => { it.classList.remove('edge-1','edge-2'); });
}
function updateEdgeClasses(){
  if (!itemFullWidth) { computeSizes(); }
  clearEdgeClasses();
  const startIndex = Math.round((horizontalCarousel?.scrollLeft || 0) / (itemFullWidth||1));
  const visible = getVisibleCount();
  const endIndex = startIndex + visible - 1;
  if (items[startIndex]) items[startIndex].classList.add('edge-1');
  if (items[startIndex+1]) items[startIndex+1].classList.add('edge-2');
  if (items[endIndex]) items[endIndex].classList.add('edge-1');
  if (items[endIndex-1]) items[endIndex-1].classList.add('edge-2');
}

/* Inicializar carousel */
setupNonLoopCarousel();

/* GRID items click: console (sin alert) */
document.querySelectorAll('.grid-item').forEach(item => {
  item.addEventListener('click', () => {
    const txt = item.querySelector('.item-label')?.textContent || item.textContent.trim();
    console.log('Producto clic:', txt);
  });
});

/* ---------------- PANELES (LEFT + RIGHT + BOTTOM + TOP) ---------------- */
(function(){
  const body = document.body;
  const overlay = document.getElementById('panelOverlay');

  // LEFT (global)
  const leftPanel = document.getElementById('sidePanel');
  const leftOpenBtn = document.querySelector('.btn-edge-left'); // configuración global
  const leftCloseBtn = document.getElementById('sidePanelClose');

  // RIGHT (user)
  const rightPanel = document.getElementById('userPanel');
  const rightOpenBtn = document.querySelector('.btn-edge-right'); // configuración usuario
  const rightCloseBtn = document.getElementById('userPanelClose');

  // BOTTOM (tech)
  const bottomPanel = document.getElementById('techPanel');
  const bottomOpenBtn = document.querySelector('.btn-gutter-left'); // tecnico
  const bottomCloseBtn = document.getElementById('techPanelClose');

  // TOP (search)
  const topPanel = document.getElementById('searchPanel');
  const topOpenBtn = document.querySelector('.btn-gutter-right'); // busqueda
  const topCloseBtn = document.getElementById('searchPanelClose');

  // search form elements (may be null if panel not present)
  const searchInput = document.getElementById('searchInput');
  const searchCategory = document.getElementById('searchCategory');
  const searchPriceMin = document.getElementById('searchPriceMin');
  const searchPriceMax = document.getElementById('searchPriceMax');
  const searchOffers = document.getElementById('searchOffers');
  const searchInStock = document.getElementById('searchInStock');
  const searchBtn = document.getElementById('searchBtn');
  const searchClear = document.getElementById('searchClear');
  const searchHint = document.getElementById('searchHint');

  // todos los botones fijos (gutter + edge) - ya no manipulamos su visibilidad individualmente
  const allBtns = Array.from(document.querySelectorAll('.btn'));

  // seguridad
  if (!overlay) return;

  // focus helpers
  function getFocusable(root){
    return Array.from(root.querySelectorAll('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'))
      .filter(el => el.offsetParent !== null);
  }

  let previouslyFocused = null;

  /* GENERIC: cerrar cualquier panel abierto */
  function closeAnyOpenPanel() {
    if (body.classList.contains('panel-open-left')) closeLeftPanel();
    if (body.classList.contains('panel-open-right')) closeRightPanel();
    if (body.classList.contains('panel-open-bottom')) closeBottomPanel();
    if (body.classList.contains('panel-open-top')) closeTopPanel();
  }

  /* LEFT panel funcs */
  function openLeftPanel() {
    if (!leftPanel) return;
    closeAnyOpenPanel();
    previouslyFocused = document.activeElement;
    body.classList.add('panel-open-left');
    leftPanel.setAttribute('aria-hidden','false');
    overlay.setAttribute('aria-hidden','false');
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.touchAction = 'none';
    const focusables = getFocusable(leftPanel);
    if (focusables.length) focusables[0].focus();
    document.addEventListener('focus', leftFocusTrap, true);
    document.addEventListener('keydown', leftKeyHandler);
  }
  function closeLeftPanel() {
    if (!leftPanel) return;
    body.classList.remove('panel-open-left');
    leftPanel.setAttribute('aria-hidden','true');
    overlay.setAttribute('aria-hidden','true');
    document.documentElement.style.overflow = '';
    document.documentElement.style.touchAction = '';
    if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    document.removeEventListener('focus', leftFocusTrap, true);
    document.removeEventListener('keydown', leftKeyHandler);
  }
  function leftFocusTrap(e) {
    if (!body.classList.contains('panel-open-left')) return;
    if (leftPanel.contains(e.target)) return;
    const focusables = getFocusable(leftPanel);
    if (focusables.length) focusables[0].focus();
  }
  function leftKeyHandler(e) {
    if (!body.classList.contains('panel-open-left')) return;
    if (e.key === 'Escape') { closeLeftPanel(); return; }
    if (e.key === 'Tab') {
      const focusables = getFocusable(leftPanel);
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length-1];
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    }
  }

  /* RIGHT panel funcs */
  function openRightPanel() {
    if (!rightPanel) return;
    closeAnyOpenPanel();
    previouslyFocused = document.activeElement;
    body.classList.add('panel-open-right');
    rightPanel.setAttribute('aria-hidden','false');
    overlay.setAttribute('aria-hidden','false');
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.touchAction = 'none';
    const focusables = getFocusable(rightPanel);
    if (focusables.length) focusables[0].focus();
    document.addEventListener('focus', rightFocusTrap, true);
    document.addEventListener('keydown', rightKeyHandler);
  }
  function closeRightPanel() {
    if (!rightPanel) return;
    body.classList.remove('panel-open-right');
    rightPanel.setAttribute('aria-hidden','true');
    overlay.setAttribute('aria-hidden','true');
    document.documentElement.style.overflow = '';
    document.documentElement.style.touchAction = '';
    if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    document.removeEventListener('focus', rightFocusTrap, true);
    document.removeEventListener('keydown', rightKeyHandler);
  }
  function rightFocusTrap(e) {
    if (!body.classList.contains('panel-open-right')) return;
    if (rightPanel.contains(e.target)) return;
    const focusables = getFocusable(rightPanel);
    if (focusables.length) focusables[0].focus();
  }
  function rightKeyHandler(e) {
    if (!body.classList.contains('panel-open-right')) return;
    if (e.key === 'Escape') { closeRightPanel(); return; }
    if (e.key === 'Tab') {
      const focusables = getFocusable(rightPanel);
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length-1];
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    }
  }

  /* BOTTOM panel funcs (Técnico) */
  function openBottomPanel() {
    if (!bottomPanel) return;
    closeAnyOpenPanel();
    previouslyFocused = document.activeElement;
    body.classList.add('panel-open-bottom');
    bottomPanel.setAttribute('aria-hidden','false');
    overlay.setAttribute('aria-hidden','false');
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.touchAction = 'none';
    const focusables = getFocusable(bottomPanel);
    if (focusables.length) focusables[0].focus();
    document.addEventListener('focus', bottomFocusTrap, true);
    document.addEventListener('keydown', bottomKeyHandler);
  }
  function closeBottomPanel() {
    if (!bottomPanel) return;
    body.classList.remove('panel-open-bottom');
    bottomPanel.setAttribute('aria-hidden','true');
    overlay.setAttribute('aria-hidden','true');
    document.documentElement.style.overflow = '';
    document.documentElement.style.touchAction = '';
    if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    document.removeEventListener('focus', bottomFocusTrap, true);
    document.removeEventListener('keydown', bottomKeyHandler);
  }
  function bottomFocusTrap(e) {
    if (!body.classList.contains('panel-open-bottom')) return;
    if (bottomPanel.contains(e.target)) return;
    const focusables = getFocusable(bottomPanel);
    if (focusables.length) focusables[0].focus();
  }
  function bottomKeyHandler(e) {
    if (!body.classList.contains('panel-open-bottom')) return;
    if (e.key === 'Escape') { closeBottomPanel(); return; }
    if (e.key === 'Tab') {
      const focusables = getFocusable(bottomPanel);
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length-1];
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    }
  }

  /* TOP panel funcs (Búsqueda) */
  function openTopPanel() {
    if (!topPanel) return;
    closeAnyOpenPanel();
    previouslyFocused = document.activeElement;
    body.classList.add('panel-open-top');
    topPanel.setAttribute('aria-hidden','false');
    overlay.setAttribute('aria-hidden','false');
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.touchAction = 'none';
    const focusables = getFocusable(topPanel);
    if (focusables.length) focusables[0].focus();
    document.addEventListener('focus', topFocusTrap, true);
    document.addEventListener('keydown', topKeyHandler);
  }
  function closeTopPanel() {
    if (!topPanel) return;
    body.classList.remove('panel-open-top');
    topPanel.setAttribute('aria-hidden','true');
    overlay.setAttribute('aria-hidden','true');
    document.documentElement.style.overflow = '';
    document.documentElement.style.touchAction = '';
    if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
    document.removeEventListener('focus', topFocusTrap, true);
    document.removeEventListener('keydown', topKeyHandler);
  }
  function topFocusTrap(e) {
    if (!body.classList.contains('panel-open-top')) return;
    if (topPanel.contains(e.target)) return;
    const focusables = getFocusable(topPanel);
    if (focusables.length) focusables[0].focus();
  }
  function topKeyHandler(e) {
    if (!body.classList.contains('panel-open-top')) return;
    if (e.key === 'Escape') { closeTopPanel(); return; }
    if (e.key === 'Tab') {
      const focusables = getFocusable(topPanel);
      if (!focusables.length) return;
      const first = focusables[0], last = focusables[focusables.length-1];
      if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    }
  }

  // abrir al click en botones (sin alert)
  if (leftOpenBtn) leftOpenBtn.addEventListener('click', (ev)=>{ ev.preventDefault(); if (body.classList.contains('panel-open-left')) closeLeftPanel(); else openLeftPanel(); });
  if (rightOpenBtn) rightOpenBtn.addEventListener('click', (ev)=>{ ev.preventDefault(); if (body.classList.contains('panel-open-right')) closeRightPanel(); else openRightPanel(); });
  if (bottomOpenBtn) bottomOpenBtn.addEventListener('click', (ev)=>{ ev.preventDefault(); if (body.classList.contains('panel-open-bottom')) closeBottomPanel(); else openBottomPanel(); });
  if (topOpenBtn) topOpenBtn.addEventListener('click', (ev)=>{ ev.preventDefault(); if (body.classList.contains('panel-open-top')) closeTopPanel(); else openTopPanel(); });

  // cerrar por overlay o botones close
  overlay.addEventListener('click', ()=>{ closeLeftPanel(); closeRightPanel(); closeBottomPanel(); closeTopPanel(); });
  if (leftCloseBtn) leftCloseBtn.addEventListener('click', closeLeftPanel);
  if (rightCloseBtn) rightCloseBtn.addEventListener('click', closeRightPanel);
  if (bottomCloseBtn) bottomCloseBtn.addEventListener('click', closeBottomPanel);
  if (topCloseBtn) topCloseBtn.addEventListener('click', closeTopPanel);

  // si hay resize no forzamos cierre, solo mantenemos (vw/vh)
  window.addEventListener('resize', ()=>{ /* no-op */ });

  /* SUBMENUS - delegado para todos los paneles */
  function handlePanelClick(e) {
    const btn = e.target.closest('.panel-btn');
    if (!btn) return;
    const submenuId = btn.dataset.submenu;
    if (!submenuId) return;
    const submenu = document.getElementById(submenuId);
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    // detect qué panel contiene el btn para exclusividad solo en ese panel
    const parentPanel = btn.closest('.side-panel') || btn.closest('.user-panel') || btn.closest('.bottom-panel') || btn.closest('.top-panel');
    if (isOpen) {
      btn.setAttribute('aria-expanded','false');
      if (submenu){ submenu.setAttribute('aria-hidden','true'); submenu.classList.remove('open'); submenu.style.maxHeight = null; }
    } else {
      // cerrar otros dentro del mismo panel (accordion)
      if (parentPanel) {
        parentPanel.querySelectorAll('.panel-btn').forEach(other=>{
          if (other === btn) return;
          const otherId = other.dataset.submenu;
          if (!otherId) return;
          const sub = document.getElementById(otherId);
          other.setAttribute('aria-expanded','false');
          if (sub){ sub.setAttribute('aria-hidden','true'); sub.classList.remove('open'); sub.style.maxHeight = null; }
        });
      }
      btn.setAttribute('aria-expanded','true');
      if (submenu){ submenu.setAttribute('aria-hidden','false'); submenu.classList.add('open'); submenu.style.maxHeight = submenu.scrollHeight + 16 + "px"; }
    }
  }

  // items submenu: acción (por ahora log en consola; reemplaza por navegación real)
  function handleSubmenuItemClick(e) {
    const item = e.target.closest('.submenu-item');
    if (!item) return;
    const text = item.textContent.trim();
    console.log('Submenu item:', text);
  }

  // delegado de click en todos paneles
  if (leftPanel) leftPanel.addEventListener('click', (e)=>{ handlePanelClick(e); handleSubmenuItemClick(e); });
  if (rightPanel) rightPanel.addEventListener('click', (e)=>{ handlePanelClick(e); handleSubmenuItemClick(e); });
  if (bottomPanel) bottomPanel.addEventListener('click', (e)=>{ handlePanelClick(e); handleSubmenuItemClick(e); });
  if (topPanel) topPanel.addEventListener('click', (e)=>{ handlePanelClick(e); handleSubmenuItemClick(e); });

  // acción Cerrar sesión en user panel (id panelSignOut)
  const signOutBtn = document.getElementById('panelSignOut');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', (e)=>{
      e.preventDefault();
      closeRightPanel();
      console.log('Cerrar sesión: acción ejecutada');
    });
  }

  // cerrar panel si cambia el hash (opcional)
  window.addEventListener('hashchange', ()=>{ closeLeftPanel(); closeRightPanel(); closeBottomPanel(); closeTopPanel(); });

  /* --------------- Search form logic (client-side ready) --------------- */
  const searchState = {
    q: '',
    category: '',
    priceMin: null,
    priceMax: null,
    offersOnly: false,
    inStock: true
  };

  function updateSearchHint() {
    if (!searchHint) return;
    const parts = [];
    if (searchState.q) parts.push(`q="${searchState.q}"`);
    if (searchState.category) parts.push(`cat=${searchState.category}`);
    if (searchState.priceMin != null) parts.push(`min=${searchState.priceMin}`);
    if (searchState.priceMax != null) parts.push(`max=${searchState.priceMax}`);
    if (searchState.offersOnly) parts.push('offers');
    if (searchState.inStock === false) parts.push('including out-of-stock');
    searchHint.textContent = parts.length ? `Filtros: ${parts.join(' • ')}` : 'Lista de filtros vacía';
  }

  // wire inputs (check for existence)
  if (searchInput) {
    searchInput.addEventListener('input', (e)=>{ searchState.q = e.target.value.trim(); updateSearchHint(); });
  }
  if (searchCategory) {
    searchCategory.addEventListener('change', (e)=>{ searchState.category = e.target.value; updateSearchHint(); });
  }
  if (searchPriceMin) {
    searchPriceMin.addEventListener('input', (e)=>{ searchState.priceMin = e.target.value ? Number(e.target.value) : null; updateSearchHint(); });
  }
  if (searchPriceMax) {
    searchPriceMax.addEventListener('input', (e)=>{ searchState.priceMax = e.target.value ? Number(e.target.value) : null; updateSearchHint(); });
  }
  if (searchOffers) {
    searchOffers.addEventListener('change', (e)=>{ searchState.offersOnly = !!e.target.checked; updateSearchHint(); });
  }
  if (searchInStock) {
    searchInStock.addEventListener('change', (e)=>{ searchState.inStock = !!e.target.checked; updateSearchHint(); });
  }

  function performSearch() {
    // Esta función es sólo el stub cliente. Aquí puedes conectar tu fetch / websocket.
    const payload = { ...searchState };
    console.log('Search submit:', payload);
    // También disparamos un evento para que la app lo capture:
    window.dispatchEvent(new CustomEvent('search:submit', { detail: payload }));
    // UX: mostrar hint breve
    if (searchHint) {
      searchHint.textContent = 'Búsqueda enviada — revisa la consola (o escucha "search:submit")';
      setTimeout(()=> updateSearchHint(), 1400);
    }
  }

  if (searchBtn) searchBtn.addEventListener('click', ()=> performSearch());
  if (searchClear) searchClear.addEventListener('click', ()=>{
    if (searchInput) searchInput.value = '';
    if (searchCategory) searchCategory.value = '';
    if (searchPriceMin) searchPriceMin.value = '';
    if (searchPriceMax) searchPriceMax.value = '';
    if (searchOffers) searchOffers.checked = false;
    if (searchInStock) searchInStock.checked = true;
    searchState.q = ''; searchState.category = ''; searchState.priceMin = null; searchState.priceMax = null; searchState.offersOnly = false; searchState.inStock = true;
    updateSearchHint();
  });

  updateSearchHint();

})();
