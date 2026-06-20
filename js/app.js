/* ==========================================================================
   MagaBeauty — app.js
   Estado local (LocalStorage), navegação e renderização por página.
   Sem backend, sem autenticação, 100% client-side.
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- Helpers genéricos ---------- */
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const base = document.body.dataset.base || '';

  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function dateStr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }
  function todayStr() { return dateStr(new Date()); }

  const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  // Cronograma semanal fixo: 0=Domingo ... 6=Sábado
  const WEEKLY_MODE = {
    0: 'recuperacao', // Domingo
    1: 'retinol',     // Segunda
    2: 'recuperacao', // Terça
    3: 'retinol',     // Quarta
    4: 'recuperacao', // Quinta
    5: 'retinol',      // Sexta
    6: 'recuperacao'  // Sábado
  };

  function modeForDate(d) { return WEEKLY_MODE[d.getDay()]; }
  function modeLabel(mode) { return mode === 'retinol' ? 'Modo Retinol' : 'Modo Recuperação'; }

  const MANHA_ITEMS = [
    { id: 'lavar', label: 'Lavar o rosto' },
    { id: 'vc10', label: 'VC-10' },
    { id: 'melaclear', label: 'Melaclear' },
    { id: 'gh01', label: 'GH-01' },
    { id: 'protetor', label: 'Protetor Solar' }
  ];

  const NOITE_ITEMS = {
    retinol: [
      { id: 'limpeza', label: 'Limpeza' },
      { id: 'rn03', label: 'RN-0,3' },
      { id: 'cm01', label: 'CM-01' }
    ],
    recuperacao: [
      { id: 'limpeza', label: 'Limpeza' },
      { id: 'ni10', label: 'NI-10' },
      { id: 'gh01', label: 'GH-01' },
      { id: 'cm01', label: 'CM-01' }
    ]
  };

  /* ---------- Estado / LocalStorage ---------- */
  const ROUTINE_PREFIX = 'mb_routine_';
  const META_KEY = 'mb_meta';

  function getMeta() {
    try { return JSON.parse(localStorage.getItem(META_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveMeta(meta) { localStorage.setItem(META_KEY, JSON.stringify(meta)); }
  function ensureFirstDate() {
    const meta = getMeta();
    if (!meta.firstDate) { meta.firstDate = todayStr(); saveMeta(meta); }
  }

  function emptyDay(dStrKey) {
    const d = new Date(dStrKey + 'T00:00:00');
    const mode = modeForDate(d);
    return { date: dStrKey, mode: mode, manha: {}, noite: {} };
  }

  function getDay(dStrKey) {
    try {
      const raw = localStorage.getItem(ROUTINE_PREFIX + dStrKey);
      if (!raw) return emptyDay(dStrKey);
      const parsed = JSON.parse(raw);
      return Object.assign(emptyDay(dStrKey), parsed);
    } catch (e) { return emptyDay(dStrKey); }
  }

  function saveDay(day) {
    localStorage.setItem(ROUTINE_PREFIX + day.date, JSON.stringify(day));
    ensureFirstDate();
  }

  function toggleItem(dStrKey, period, itemId) {
    const day = getDay(dStrKey);
    day[period][itemId] = !day[period][itemId];
    saveDay(day);
    return day;
  }

  function isDayComplete(dStrKey) {
    const day = getDay(dStrKey);
    const manhaDone = MANHA_ITEMS.every(it => day.manha[it.id]);
    const noiteItems = NOITE_ITEMS[day.mode];
    const noiteDone = noiteItems.every(it => day.noite[it.id]);
    return manhaDone && noiteDone;
  }

  function dayProgress(dStrKey) {
    const day = getDay(dStrKey);
    const noiteItems = NOITE_ITEMS[day.mode];
    const total = MANHA_ITEMS.length + noiteItems.length;
    let done = 0;
    MANHA_ITEMS.forEach(it => { if (day.manha[it.id]) done++; });
    noiteItems.forEach(it => { if (day.noite[it.id]) done++; });
    return total ? Math.round((done / total) * 100) : 0;
  }

  function allStoredDates() {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.indexOf(ROUTINE_PREFIX) === 0) out.push(key.slice(ROUTINE_PREFIX.length));
    }
    return out.sort();
  }

  function computeStreak() {
    let streak = 0;
    const d = new Date();
    if (isDayComplete(dateStr(d))) { streak++; }
    d.setDate(d.getDate() - 1);
    while (isDayComplete(dateStr(d))) { streak++; d.setDate(d.getDate() - 1); }
    return streak;
  }

  function countRetinolApplications() {
    return allStoredDates().reduce((acc, dStrKey) => {
      const day = getDay(dStrKey);
      return acc + (day.noite.rn03 ? 1 : 0);
    }, 0);
  }

  function countCompletedChecklists() {
    return allStoredDates().reduce((acc, dStrKey) => acc + (isDayComplete(dStrKey) ? 1 : 0), 0);
  }

  function computeAdesao() {
    const meta = getMeta();
    if (!meta.firstDate) return 0;
    const start = new Date(meta.firstDate + 'T00:00:00');
    const today = new Date();
    const msPerDay = 86400000;
    const daysSince = Math.max(1, Math.round((new Date(dateStr(today) + 'T00:00:00') - start) / msPerDay) + 1);
    const completed = countCompletedChecklists();
    return Math.min(100, Math.round((completed / daysSince) * 100));
  }

  /* ---------- UI utilitários ---------- */
  function showToast(msg) {
    let toast = $('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('is-visible');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toast.classList.remove('is-visible'), 1800);
  }

  function setRing(el, percent) {
    const circle = el.querySelector('.ring-progress');
    if (!circle) return;
    const r = circle.r.baseVal.value;
    const c = 2 * Math.PI * r;
    circle.style.strokeDasharray = `${c} ${c}`;
    circle.style.strokeDashoffset = c - (Math.max(0, Math.min(100, percent)) / 100) * c;
    const pctLabel = el.querySelector('.ritual-ring__pct');
    if (pctLabel) pctLabel.textContent = `${percent}%`;
  }

  function highlightNav() {
    const path = location.pathname.split('/').pop() || 'index.html';
    $$('.bottom-nav a').forEach(a => {
      const target = a.dataset.nav;
      const isActive = (target === 'index' && (path === '' || path === 'index.html')) || target === path.replace('.html', '');
      a.classList.toggle('is-active', isActive);
    });
  }

  async function loadJSON(relativePath) {
    const res = await fetch(base + relativePath, { cache: 'no-cache' });
    if (!res.ok) throw new Error('Falha ao carregar ' + relativePath);
    return res.json();
  }

  function icon(name) {
    const icons = {
      check: '<svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
      flame: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c1 3-2 4-2 7a3 3 0 0 0 6 0c2 2 2 5 0 8a7 7 0 0 1-9-11c.5 1 1.5 1.5 2 1.5C9 5 10 3 12 2z"/></svg>',
      drop: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2s7 7.5 7 12a7 7 0 1 1-14 0c0-4.5 7-12 7-12z"/></svg>',
      moon: '<svg viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.5A9 9 0 1 1 11.5 3 7 7 0 0 0 21 12.5z"/></svg>',
      chevron: '<svg class="expand-chevron" viewBox="0 0 24 24" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>'
    };
    return icons[name] || '';
  }

  /* ---------- Expansíveis (produtos / artigos / nutrição) ---------- */
  function wireExpandable(container) {
    $$('.expand-trigger', container).forEach(trigger => {
      trigger.addEventListener('click', () => {
        const card = trigger.closest('.product-card, .article-card, .nutrition-card');
        card.classList.toggle('is-open');
      });
    });
  }

  /* ==========================================================================
     PÁGINA: DASHBOARD (index.html)
     ========================================================================== */
  function initDashboard() {
    const today = todayStr();
    let activeTab = 'manha';

    function render() {
      const day = getDay(today);
      const progress = dayProgress(today);

      setRing($('.ritual-ring'), progress);
      $('#streak-value').textContent = computeStreak();
      $('#retinol-value').textContent = countRetinolApplications();

      $('#mode-badge').textContent = modeLabel(day.mode) + ' · Hoje';

      const tabsEl = $('.routine-tabs');
      $$('.routine-tab', tabsEl).forEach(t => t.setAttribute('aria-selected', t.dataset.tab === activeTab ? 'true' : 'false'));

      const items = activeTab === 'manha' ? MANHA_ITEMS : NOITE_ITEMS[day.mode];
      const list = $('#routine-list');
      list.innerHTML = items.map(it => {
        const done = !!day[activeTab][it.id];
        return `<li class="checklist-item ${done ? 'is-done' : ''}">
          <button class="checklist-item__btn" data-period="${activeTab}" data-item="${it.id}">
            <span class="checklist-item__check">${icon('check')}</span>
            <span class="checklist-item__label">${it.label}</span>
          </button>
        </li>`;
      }).join('');

      $$('.checklist-item__btn', list).forEach(btn => {
        btn.addEventListener('click', () => {
          toggleItem(today, btn.dataset.period, btn.dataset.item);
          render();
        });
      });

      renderWeek();
    }

    function renderWeek() {
      const grid = $('#week-grid');
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // domingo
      let html = '';
      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const mode = modeForDate(d);
        const isToday = dateStr(d) === today;
        html += `<div class="week-day ${isToday ? 'is-today' : ''}">
          <span class="week-day__name">${WEEKDAY_NAMES[d.getDay()]}</span>
          <span class="week-day__dot week-day__dot--${mode}"></span>
          <span class="week-day__mode">${mode === 'retinol' ? 'Retinol' : 'Recup.'}</span>
        </div>`;
      }
      grid.innerHTML = html;
    }

    $$('.routine-tab').forEach(tab => {
      tab.addEventListener('click', () => { activeTab = tab.dataset.tab; render(); });
    });

    render();
  }

  /* ==========================================================================
     PÁGINA: PRODUTOS
     ========================================================================== */
  async function initProdutos() {
    const container = $('#produtos-list');
    try {
      const produtos = await loadJSON('data/produtos.json');
      container.innerHTML = produtos.map(p => `
        <div class="product-card">
          <button class="expand-trigger">
            <span class="expand-trigger__left">
              <span class="tag-pill ${p.periodo === 'Noite' ? 'tag-pill--noite' : ''}">${p.periodo}</span>
              <span>
                <h3>${p.nome}</h3>
                <div class="expand-trigger__sub">${p.subtitulo}</div>
              </span>
            </span>
            ${icon('chevron')}
          </button>
          <div class="expand-body">
            <div class="expand-body__inner">
              <p style="margin-bottom:10px;"><strong style="color:var(--ink)">${p.funcao}</strong></p>
              <ul>${p.beneficios.map(b => `<li>${b}</li>`).join('')}</ul>
              <div class="how-to-use">${p.comoUsar}</div>
            </div>
          </div>
        </div>`).join('');
      wireExpandable(container);
    } catch (e) {
      container.innerHTML = '<p>Não foi possível carregar os produtos. Verifique se o app está sendo aberto via servidor (ex: GitHub Pages) e não diretamente como arquivo local.</p>';
    }
  }

  /* ==========================================================================
     PÁGINA: NUTRIÇÃO
     ========================================================================== */
  async function initNutricao() {
    const container = $('#nutricao-list');
    try {
      const itens = await loadJSON('data/nutricao.json');
      container.innerHTML = itens.map(n => `
        <div class="nutrition-card">
          <button class="expand-trigger">
            <span class="expand-trigger__left">
              <span>
                <h3>${n.categoria}</h3>
                <div class="expand-trigger__sub">${n.exemplos.slice(0, 2).join(', ')}...</div>
              </span>
            </span>
            ${icon('chevron')}
          </button>
          <div class="expand-body">
            <div class="expand-body__inner">
              <p>${n.beneficio}</p>
              <div class="examples-row">${n.exemplos.map(e => `<span class="example-chip">${e}</span>`).join('')}</div>
            </div>
          </div>
        </div>`).join('');
      wireExpandable(container);
    } catch (e) {
      container.innerHTML = '<p>Não foi possível carregar o conteúdo de nutrição.</p>';
    }
  }

  /* ==========================================================================
     PÁGINA: BIBLIOTECA
     ========================================================================== */
  async function initBiblioteca() {
    const container = $('#artigos-list');
    try {
      const artigos = await loadJSON('data/artigos.json');
      container.innerHTML = artigos.map(a => `
        <div class="article-card" id="artigo-${a.id}">
          <button class="expand-trigger">
            <span class="expand-trigger__left">
              <span>
                <h3>${a.titulo}</h3>
                <div class="expand-trigger__sub">${a.resumo}</div>
              </span>
            </span>
            ${icon('chevron')}
          </button>
          <div class="expand-body">
            <div class="expand-body__inner">
              ${a.conteudo.map(par => `<p>${par}</p>`).join('')}
            </div>
          </div>
        </div>`).join('');
      wireExpandable(container);

      if (location.hash) {
        const target = $(location.hash);
        if (target) { target.classList.add('is-open'); target.scrollIntoView({ block: 'center' }); }
      }
    } catch (e) {
      container.innerHTML = '<p>Não foi possível carregar a biblioteca.</p>';
    }
  }

  /* ==========================================================================
     PÁGINA: PERFIL
     ========================================================================== */
  function initPerfil() {
    $('#perfil-streak').textContent = computeStreak();
    $('#perfil-checklists').textContent = countCompletedChecklists();
    $('#perfil-retinol').textContent = countRetinolApplications();
    $('#perfil-adesao').textContent = computeAdesao() + '%';
  }

  /* ---------- Service Worker (apenas registrado a partir da raiz) ---------- */
  function registerSW() {
    if ('serviceWorker' in navigator && document.body.dataset.registerSw === 'true') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      });
    }
  }

  /* ---------- Boot ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    highlightNav();
    registerSW();
    const page = document.body.dataset.page;
    if (page === 'dashboard') initDashboard();
    else if (page === 'produtos') initProdutos();
    else if (page === 'nutricao') initNutricao();
    else if (page === 'biblioteca') initBiblioteca();
    else if (page === 'perfil') initPerfil();
  });

  window.MB = { showToast };
})();
