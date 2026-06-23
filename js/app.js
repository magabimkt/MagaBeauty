/* ============================================================
   MagaBeauty — app.js
   Toda a lógica da aplicação (roteamento, estado, CRUD).
   ============================================================ */
(function () {
  'use strict';

  /* ── Constantes ─────────────────────────────────────────── */

  // Dia da semana 0=Dom … 6=Sáb → modo da rotina noturna
  const WEEKLY_MODE = {
    0: 'recuperacao', // Domingo
    1: 'retinol',     // Segunda
    2: 'recuperacao', // Terça
    3: 'retinol',     // Quarta
    4: 'recuperacao', // Quinta
    5: 'retinol',     // Sexta
    6: 'recuperacao', // Sábado
  };

  // Produtos padrão carregados no primeiro acesso
  const DEFAULT_PRODUCTS = [
    {
      id: 'prod-vc10',
      categoria: 'Vitamina C',
      marca: 'Skinceuticals',
      nome: 'VC-10',
      periodo: 'manha',
      descricao: 'Sérum antioxidante com ácido ascórbico a 10%. Aplique sobre a pele limpa e seca antes do hidratante.',
    },
    {
      id: 'prod-melaclear',
      categoria: 'Despigmentante',
      marca: 'Adcos',
      nome: 'Melaclear',
      periodo: 'manha',
      descricao: 'Uniformizador de tom com agentes clareadores. Ideal para manchas superficiais.',
    },
    {
      id: 'prod-gh01',
      categoria: 'Hidratante',
      marca: 'Adcos',
      nome: 'GH-01',
      periodo: 'ambos',
      descricao: 'Hidratante facial com textura leve, adequado para uso manhã e noite.',
    },
    {
      id: 'prod-rn03',
      categoria: 'Retinol',
      marca: 'Principia',
      nome: 'RN-0,3',
      periodo: 'noite',
      descricao: 'Retinol 0,3% para renovação celular. Usar apenas nas noites do cronograma retinol.',
    },
    {
      id: 'prod-ni10',
      categoria: 'Niacinamida',
      marca: 'Adcos',
      nome: 'NI-10',
      periodo: 'noite',
      descricao: 'Niacinamida 10% para controle de oleosidade e uniformização do tom.',
    },
    {
      id: 'prod-cm01',
      categoria: 'Regenerador',
      marca: 'Adcos',
      nome: 'CM-01',
      periodo: 'noite',
      descricao: 'Creme regenerador noturno. Usar como último passo da rotina de noite.',
    },
    {
      id: 'prod-fps',
      categoria: 'Proteção Solar',
      marca: '',
      nome: 'Protetor Solar',
      periodo: 'manha',
      descricao: 'FPS 30 ou superior. Último passo obrigatório da rotina da manhã.',
    },
  ];

  /* ── Chaves do localStorage ──────────────────────────────── */
  const KEY_ROUTINE  = date => `mb_routine_${date}`;
  const KEY_META     = 'mb_meta';
  const KEY_PRODUCTS = 'mb_products';
  const KEY_DIARY    = 'mb_diary';

  /* ── Helpers de data ─────────────────────────────────────── */

  /**
   * Retorna a data do "dia de skincare" atual.
   * O dia começa às 05:00. Horários entre 00:00–04:59 pertencem ao dia anterior.
   */
  function getSkinDate() {
    const now = new Date();
    if (now.getHours() < 5) {
      const prev = new Date(now);
      prev.setDate(prev.getDate() - 1);
      return prev.toISOString().split('T')[0];
    }
    return now.toISOString().split('T')[0];
  }

  /** Dia da semana (0–6) para uma string YYYY-MM-DD. */
  function getWeekDay(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).getDay();
  }

  /** Modo da rotina ('retinol' | 'recuperacao') para uma data. */
  function getModeForDate(dateStr) {
    return WEEKLY_MODE[getWeekDay(dateStr)];
  }

  /** Formata YYYY-MM-DD para DD/MM/AAAA. */
  function formatDateBR(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }

  /** Retorna a data do dia anterior em formato YYYY-MM-DD. */
  function getPrevDate(dateStr) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() - 1);
    return dt.toISOString().split('T')[0];
  }

  /* ── Produtos ────────────────────────────────────────────── */

  function getProducts() {
    try {
      const raw = localStorage.getItem(KEY_PRODUCTS);
      if (raw) return JSON.parse(raw);
    } catch (e) { /* continua */ }
    // Primeiro acesso: semeia os produtos padrão
    saveProducts(DEFAULT_PRODUCTS);
    return DEFAULT_PRODUCTS;
  }

  function saveProducts(products) {
    localStorage.setItem(KEY_PRODUCTS, JSON.stringify(products));
  }

  function generateId() {
    return 'prod-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /* ── Estado da rotina diária ─────────────────────────────── */

  function getDay(date) {
    try {
      const raw = localStorage.getItem(KEY_ROUTINE(date));
      return raw ? JSON.parse(raw) : { manha: {}, noite: {} };
    } catch (e) {
      return { manha: {}, noite: {} };
    }
  }

  function saveDay(date, state) {
    localStorage.setItem(KEY_ROUTINE(date), JSON.stringify(state));
    // Registra a primeira data de uso para o cálculo de adesão
    const meta = getMeta();
    if (!meta.firstDate || date < meta.firstDate) {
      meta.firstDate = date;
      saveMeta(meta);
    }
  }

  function getMeta() {
    try {
      return JSON.parse(localStorage.getItem(KEY_META)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveMeta(m) {
    localStorage.setItem(KEY_META, JSON.stringify(m));
  }

  /**
   * Retorna os itens do checklist para um período e modo.
   * "Lavar o rosto" é sempre o primeiro item.
   * Produtos com categoria "Retinol" só aparecem no modo retinol.
   */
  function getChecklistItems(period, mode) {
    const products = getProducts();
    const items = [{ id: 'lavar-rosto', label: 'Lavar o rosto', tag: null }];

    products.forEach(p => {
      const pertenceManha = period === 'manha' && (p.periodo === 'manha' || p.periodo === 'ambos');
      const pertenceNoite = period === 'noite' && (p.periodo === 'noite' || p.periodo === 'ambos');

      if (pertenceManha) {
        items.push({ id: p.id, label: p.nome, tag: p.categoria });
        return;
      }
      if (pertenceNoite) {
        // Retinol só aparece nas noites de retinol
        if (p.categoria === 'Retinol') {
          if (mode === 'retinol') items.push({ id: p.id, label: p.nome, tag: p.categoria });
        } else {
          items.push({ id: p.id, label: p.nome, tag: p.categoria });
        }
      }
    });

    return items;
  }

  /* ── Métricas ────────────────────────────────────────────── */

  function isDayComplete(date, mode) {
    const state = getDay(date);
    const allItems = [
      ...getChecklistItems('manha', mode),
      ...getChecklistItems('noite', mode),
    ];
    if (!allItems.length) return false;
    return allItems.every(item => state.manha[item.id] || state.noite[item.id]);
  }

  function dayProgress(date, period, mode) {
    const state = getDay(date);
    const items = getChecklistItems(period, mode);
    if (!items.length) return 0;
    const done = items.filter(i => state[period][i.id]).length;
    return done / items.length;
  }

  function allStoredDates() {
    const dates = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('mb_routine_')) {
        dates.push(k.replace('mb_routine_', ''));
      }
    }
    return dates.sort();
  }

  function computeStreak() {
    const today = getSkinDate();
    const todayMode = getModeForDate(today);
    let streak = 0;
    // Se hoje já estiver completo, começa contando de hoje; senão de ontem
    let d = isDayComplete(today, todayMode) ? today : getPrevDate(today);
    for (let i = 0; i < 365; i++) {
      const mode = getModeForDate(d);
      if (isDayComplete(d, mode)) {
        streak++;
        d = getPrevDate(d);
      } else {
        break;
      }
    }
    return streak;
  }

  function countRetinolApplications() {
    return allStoredDates().filter(date => {
      if (getModeForDate(date) !== 'retinol') return false;
      const state = getDay(date);
      return getChecklistItems('noite', 'retinol').some(i => state.noite[i.id]);
    }).length;
  }

  function countCompletedChecklists() {
    return allStoredDates().filter(date => {
      const mode = getModeForDate(date);
      return isDayComplete(date, mode);
    }).length;
  }

  function computeAdesao() {
    const meta = getMeta();
    if (!meta.firstDate) return 0;
    const today = getSkinDate();
    const [fy, fm, fd] = meta.firstDate.split('-').map(Number);
    const [ty, tm, td] = today.split('-').map(Number);
    const first = new Date(fy, fm - 1, fd);
    const last  = new Date(ty, tm - 1, td);
    const totalDays = Math.round((last - first) / 86400000) + 1;
    if (totalDays <= 0) return 0;
    return Math.min(100, Math.round((countCompletedChecklists() / totalDays) * 100));
  }

  /* ── Diário da Pele ──────────────────────────────────────── */

  function getDiaryEntries() {
    try {
      return JSON.parse(localStorage.getItem(KEY_DIARY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveDiaryEntries(entries) {
    localStorage.setItem(KEY_DIARY, JSON.stringify(entries));
  }

  function generateDiaryId() {
    return 'diary-' + Date.now().toString(36);
  }

  /* ── Anel de progresso ───────────────────────────────────── */

  function setRing(el, pct) {
    const C = 2 * Math.PI * 50; // circunferência com r=50
    el.style.strokeDashoffset = C * (1 - Math.min(1, Math.max(0, pct)));
  }

  /* ── Navegação ───────────────────────────────────────────── */

  function highlightNav(page) {
    document.querySelectorAll('.bottom-nav a').forEach(a => {
      const active = a.dataset.nav === page;
      a.classList.toggle('is-active', active);
      if (active) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
  }

  /* ── Toast ───────────────────────────────────────────────── */

  let _toastTimer;
  function showToast(msg) {
    let t = document.getElementById('mbToast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'mbToast';
      t.className = 'toast';
      t.setAttribute('role', 'status');
      t.setAttribute('aria-live', 'polite');
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(_toastTimer);
    _toastTimer = setTimeout(() => t.classList.remove('is-visible'), 2600);
  }

  /* ── Modal / Confirm helpers ─────────────────────────────── */

  function openModal(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.add('is-open'); document.body.style.overflow = 'hidden'; }
  }

  function closeModal(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('is-open'); document.body.style.overflow = ''; }
  }

  function openConfirm(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.add('is-open'); document.body.style.overflow = 'hidden'; }
  }

  function closeConfirm(id) {
    const el = document.getElementById(id);
    if (el) { el.classList.remove('is-open'); document.body.style.overflow = ''; }
  }

  // Fechar ao clicar no backdrop
  document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-backdrop')) {
      e.target.classList.remove('is-open');
      document.body.style.overflow = '';
    }
    if (e.target.classList.contains('confirm-backdrop')) {
      e.target.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  });

  /* ── PÁGINA: Dashboard ───────────────────────────────────── */

  function initDashboard() {
    highlightNav('dashboard');

    const today = getSkinDate();
    const mode  = getModeForDate(today);
    let currentPeriod = 'manha';

    // Badge de modo
    const modeLabel = mode === 'retinol' ? 'Modo Retinol' : 'Modo Recuperação';
    const modeBadge = document.getElementById('modeBadge');
    if (modeBadge) modeBadge.textContent = `${modeLabel} · Hoje`;

    // Anel de progresso
    const ringFill = document.getElementById('ringFill');
    const ringPct  = document.getElementById('ringPct');

    function updateRing() {
      const itemsM = getChecklistItems('manha', mode).length;
      const itemsN = getChecklistItems('noite', mode).length;
      const total  = itemsM + itemsN;
      if (total === 0) {
        setRing(ringFill, 0);
        ringPct.textContent = '0%';
        return;
      }
      const pm  = dayProgress(today, 'manha', mode);
      const pn  = dayProgress(today, 'noite', mode);
      const pct = (pm * itemsM + pn * itemsN) / total;
      setRing(ringFill, pct);
      ringPct.textContent = `${Math.round(pct * 100)}%`;
    }

    // Estatísticas
    function updateStats() {
      const sv = document.getElementById('streakVal');
      const rv = document.getElementById('retinolVal');
      if (sv) sv.textContent = `${computeStreak()} dias`;
      if (rv) rv.textContent = `${countRetinolApplications()}×`;
    }

    // Checklist
    function renderChecklist(period) {
      const listEl  = document.getElementById('checklist');
      const emptyEl = document.getElementById('checklistEmpty');
      const items   = getChecklistItems(period, mode);

      if (!listEl) return;

      if (!items.length) {
        listEl.innerHTML = '';
        if (emptyEl) emptyEl.hidden = false;
        return;
      }
      if (emptyEl) emptyEl.hidden = true;

      const state = getDay(today);
      listEl.innerHTML = items.map(item => {
        const done = !!state[period][item.id];
        return `
          <li class="checklist-item${done ? ' checklist-item--done' : ''}"
              data-id="${item.id}"
              role="checkbox"
              aria-checked="${done}"
              tabindex="0">
            <span class="checklist-item__check" aria-hidden="true"></span>
            <span class="checklist-item__label">${item.label}</span>
            ${item.tag ? `<span class="checklist-item__tag">${item.tag}</span>` : ''}
          </li>`;
      }).join('');

      listEl.querySelectorAll('.checklist-item').forEach(li => {
        function toggle() {
          const s = getDay(today);
          s[period][li.dataset.id] = !s[period][li.dataset.id];
          saveDay(today, s);
          renderChecklist(period);
          updateRing();
          updateStats();
        }
        li.addEventListener('click', toggle);
        li.addEventListener('keydown', e => {
          if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); toggle(); }
        });
      });
    }

    // Abas
    const tabManha = document.getElementById('tabManha');
    const tabNoite = document.getElementById('tabNoite');

    function setTab(period) {
      currentPeriod = period;
      if (tabManha) {
        tabManha.classList.toggle('tab--active', period === 'manha');
        tabManha.setAttribute('aria-selected', period === 'manha');
      }
      if (tabNoite) {
        tabNoite.classList.toggle('tab--active', period === 'noite');
        tabNoite.setAttribute('aria-selected', period === 'noite');
      }
      renderChecklist(period);
    }

    if (tabManha) tabManha.addEventListener('click', () => setTab('manha'));
    if (tabNoite) tabNoite.addEventListener('click', () => setTab('noite'));

    // Cronograma semanal
    function renderWeekGrid() {
      const grid = document.getElementById('weekGrid');
      if (!grid) return;
      const DAY_NAMES = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'];
      const todayIdx  = getWeekDay(today);
      grid.innerHTML = DAY_NAMES.map((name, idx) => {
        const dayMode  = WEEKLY_MODE[idx];
        const isToday  = idx === todayIdx;
        const cls = [
          'week-day',
          dayMode === 'retinol' ? 'week-day--retinol' : 'week-day--recuperacao',
          isToday ? 'week-day--today' : '',
        ].filter(Boolean).join(' ');
        return `
          <div class="${cls}">
            <span class="week-day__label">${name}</span>
            <span class="week-day__dot" title="${dayMode === 'retinol' ? 'Retinol' : 'Recuperação'}"></span>
          </div>`;
      }).join('');
    }

    // Inicializa
    setTab('manha');
    updateRing();
    updateStats();
    renderWeekGrid();
  }

  /* ── PÁGINA: Produtos ────────────────────────────────────── */

  function initProdutos() {
    highlightNav('produtos');

    const listEl     = document.getElementById('productList');
    const emptyEl    = document.getElementById('productEmpty');
    const fabBtn     = document.getElementById('fabAdd');
    const formTitle  = document.getElementById('productModalTitle');
    const form       = document.getElementById('productForm');
    const confirmMsg = document.getElementById('confirmDeleteMsg');
    const confirmOk  = document.getElementById('confirmDeleteOk');
    const confirmCan = document.getElementById('confirmDeleteCancel');

    let editingId  = null;
    let deletingId = null;

    const PERIOD_LABELS = { manha: 'Manhã', noite: 'Noite', ambos: 'Ambos' };

    function render() {
      const products = getProducts();
      if (!listEl) return;

      if (!products.length) {
        listEl.innerHTML = '';
        if (emptyEl) emptyEl.hidden = false;
        return;
      }
      if (emptyEl) emptyEl.hidden = true;

      listEl.innerHTML = products.map(p => `
        <div class="product-card" data-id="${p.id}">
          <div class="product-card__header">
            <div class="product-card__info">
              <div class="product-card__category">${p.categoria || '—'}</div>
              <div class="product-card__name">${p.nome}</div>
              ${p.marca ? `<div class="product-card__brand">${p.marca}</div>` : ''}
            </div>
            <div class="product-card__period">
              <span class="tag-pill tag-pill--${p.periodo || 'ambos'}">
                ${PERIOD_LABELS[p.periodo] || p.periodo || 'Ambos'}
              </span>
            </div>
          </div>
          ${p.descricao ? `<div class="product-card__desc">${p.descricao}</div>` : ''}
          <div class="product-card__actions">
            <button class="product-card__btn btn-edit" data-id="${p.id}" aria-label="Editar ${p.nome}">Editar</button>
            <button class="product-card__btn btn-delete" data-id="${p.id}" aria-label="Excluir ${p.nome}">Excluir</button>
          </div>
        </div>`).join('');

      listEl.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => openEdit(btn.dataset.id));
      });
      listEl.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => askDelete(btn.dataset.id));
      });
    }

    function openAdd() {
      editingId = null;
      if (formTitle) formTitle.textContent = 'Adicionar produto';
      if (form) form.reset();
      openModal('productModal');
    }

    function openEdit(id) {
      editingId = id;
      const products = getProducts();
      const p = products.find(x => x.id === id);
      if (!p || !form) return;
      if (formTitle) formTitle.textContent = 'Editar produto';
      form.elements['categoria'].value = p.categoria  || '';
      form.elements['marca'].value     = p.marca       || '';
      form.elements['nome'].value      = p.nome        || '';
      form.elements['descricao'].value = p.descricao   || '';
      form.elements['periodo'].value   = p.periodo     || 'manha';
      openModal('productModal');
    }

    function askDelete(id) {
      deletingId = id;
      const p = getProducts().find(x => x.id === id);
      if (confirmMsg) confirmMsg.textContent = `Tem certeza que deseja excluir "${p ? p.nome : 'este produto'}"?`;
      openConfirm('confirmDelete');
    }

    function saveForm() {
      if (!form) return;
      const categoria = (form.elements['categoria'].value || '').trim();
      const marca     = (form.elements['marca'].value     || '').trim();
      const nome      = (form.elements['nome'].value      || '').trim();
      const descricao = (form.elements['descricao'].value || '').trim();
      const periodo   = form.elements['periodo'].value || 'manha';

      if (!nome) { showToast('O nome comercial é obrigatório.'); return; }

      const products = getProducts();
      if (editingId) {
        const idx = products.findIndex(x => x.id === editingId);
        if (idx !== -1) {
          products[idx] = { ...products[idx], categoria, marca, nome, descricao, periodo };
        }
        showToast('Produto atualizado.');
      } else {
        products.push({ id: generateId(), categoria, marca, nome, descricao, periodo });
        showToast('Produto adicionado.');
      }
      saveProducts(products);
      closeModal('productModal');
      render();
    }

    // Eventos
    if (fabBtn) fabBtn.addEventListener('click', openAdd);

    const closeBtn = document.getElementById('productModalClose');
    const saveBtn  = document.getElementById('productSave');
    const cancelBtn = document.getElementById('productCancel');
    if (closeBtn)  closeBtn.addEventListener('click',  () => closeModal('productModal'));
    if (saveBtn)   saveBtn.addEventListener('click',   saveForm);
    if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal('productModal'));

    if (confirmOk) confirmOk.addEventListener('click', () => {
      if (!deletingId) return;
      saveProducts(getProducts().filter(p => p.id !== deletingId));
      deletingId = null;
      closeConfirm('confirmDelete');
      showToast('Produto excluído.');
      render();
    });
    if (confirmCan) confirmCan.addEventListener('click', () => closeConfirm('confirmDelete'));

    render();
  }

  /* ── PÁGINA: Diário da Pele ──────────────────────────────── */

  function initDiario() {
    highlightNav('diario');

    const listEl     = document.getElementById('diaryList');
    const emptyEl    = document.getElementById('diaryEmpty');
    const fabBtn     = document.getElementById('fabAdd');
    const formTitle  = document.getElementById('diaryModalTitle');
    const form       = document.getElementById('diaryForm');
    const confirmMsg = document.getElementById('confirmDeleteMsg');
    const confirmOk  = document.getElementById('confirmDeleteOk');
    const confirmCan = document.getElementById('confirmDeleteCancel');

    let editingId  = null;
    let deletingId = null;

    const METRICS = ['sensibilidade', 'hidratacao', 'acne', 'manchas'];

    // Sliders → exibição ao vivo do valor
    METRICS.forEach(key => {
      const input = form ? form.elements[key] : null;
      const disp  = document.getElementById(`val-${key}`);
      if (input && disp) {
        input.addEventListener('input', () => { disp.textContent = input.value; });
      }
    });

    // Dots de métrica (1–5 preenchidos)
    function renderDots(val, max) {
      let html = '';
      for (let i = 1; i <= max; i++) {
        html += `<span class="diary-metric__dot${i <= val ? ' diary-metric__dot--filled' : ''}"></span>`;
      }
      return html;
    }

    function render() {
      const entries = getDiaryEntries().slice().sort((a, b) => b.date.localeCompare(a.date));
      if (!listEl) return;

      if (!entries.length) {
        listEl.innerHTML = '';
        if (emptyEl) emptyEl.hidden = false;
        return;
      }
      if (emptyEl) emptyEl.hidden = true;

      listEl.innerHTML = entries.map(e => `
        <div class="diary-entry" data-id="${e.id}">
          <div class="diary-entry__header">
            <div class="diary-entry__date">${formatDateBR(e.date)}</div>
            <div class="diary-entry__actions">
              <button class="diary-entry__action diary-entry__action--edit btn-edit" data-id="${e.id}">Editar</button>
              <button class="diary-entry__action diary-entry__action--delete btn-delete" data-id="${e.id}">Excluir</button>
            </div>
          </div>
          <div class="diary-entry__metrics">
            <div class="diary-metric">
              <div class="diary-metric__label">Sensibilidade</div>
              <div class="diary-metric__dots">${renderDots(e.sensibilidade, 5)}</div>
            </div>
            <div class="diary-metric">
              <div class="diary-metric__label">Hidratação</div>
              <div class="diary-metric__dots">${renderDots(e.hidratacao, 5)}</div>
            </div>
            <div class="diary-metric">
              <div class="diary-metric__label">Acne</div>
              <div class="diary-metric__dots">${renderDots(e.acne, 5)}</div>
            </div>
            <div class="diary-metric">
              <div class="diary-metric__label">Manchas</div>
              <div class="diary-metric__dots">${renderDots(e.manchas, 5)}</div>
            </div>
          </div>
          ${e.observacoes ? `<div class="diary-entry__obs">${e.observacoes}</div>` : ''}
        </div>`).join('');

      listEl.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => openEdit(btn.dataset.id));
      });
      listEl.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => askDelete(btn.dataset.id));
      });
    }

    function resetForm() {
      if (!form) return;
      form.elements['date'].value        = getSkinDate();
      form.elements['observacoes'].value = '';
      METRICS.forEach(key => {
        form.elements[key].value = '1';
        const disp = document.getElementById(`val-${key}`);
        if (disp) disp.textContent = '1';
      });
    }

    function openAdd() {
      editingId = null;
      if (formTitle) formTitle.textContent = 'Novo registro';
      resetForm();
      openModal('diaryModal');
    }

    function openEdit(id) {
      editingId = id;
      const e = getDiaryEntries().find(x => x.id === id);
      if (!e || !form) return;
      if (formTitle) formTitle.textContent = 'Editar registro';
      form.elements['date'].value        = e.date;
      form.elements['observacoes'].value = e.observacoes || '';
      METRICS.forEach(key => {
        form.elements[key].value = e[key] || 1;
        const disp = document.getElementById(`val-${key}`);
        if (disp) disp.textContent = e[key] || 1;
      });
      openModal('diaryModal');
    }

    function askDelete(id) {
      deletingId = id;
      const e = getDiaryEntries().find(x => x.id === id);
      if (confirmMsg) confirmMsg.textContent = `Excluir o registro do dia ${e ? formatDateBR(e.date) : ''}?`;
      openConfirm('confirmDelete');
    }

    function saveForm() {
      if (!form) return;
      const date        = form.elements['date'].value;
      const observacoes = (form.elements['observacoes'].value || '').trim();

      if (!date) { showToast('Selecione a data do registro.'); return; }

      const entry = {
        date,
        observacoes,
        sensibilidade: Number(form.elements['sensibilidade'].value) || 1,
        hidratacao:    Number(form.elements['hidratacao'].value)    || 1,
        acne:          Number(form.elements['acne'].value)          || 1,
        manchas:       Number(form.elements['manchas'].value)       || 1,
      };

      const entries = getDiaryEntries();
      if (editingId) {
        const idx = entries.findIndex(x => x.id === editingId);
        if (idx !== -1) entries[idx] = { ...entries[idx], ...entry };
        showToast('Registro atualizado.');
      } else {
        entries.push({ id: generateDiaryId(), ...entry });
        showToast('Registro salvo.');
      }
      saveDiaryEntries(entries);
      closeModal('diaryModal');
      render();
    }

    // Eventos
    if (fabBtn) fabBtn.addEventListener('click', openAdd);

    const closeBtn  = document.getElementById('diaryModalClose');
    const saveBtn   = document.getElementById('diarySave');
    const cancelBtn = document.getElementById('diaryCancel');
    if (closeBtn)  closeBtn.addEventListener('click',  () => closeModal('diaryModal'));
    if (saveBtn)   saveBtn.addEventListener('click',   saveForm);
    if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal('diaryModal'));

    if (confirmOk) confirmOk.addEventListener('click', () => {
      if (!deletingId) return;
      saveDiaryEntries(getDiaryEntries().filter(e => e.id !== deletingId));
      deletingId = null;
      closeConfirm('confirmDelete');
      showToast('Registro excluído.');
      render();
    });
    if (confirmCan) confirmCan.addEventListener('click', () => closeConfirm('confirmDelete'));

    render();
  }

  /* ── PÁGINA: Biblioteca ──────────────────────────────────── */

  function initBiblioteca() {
    highlightNav('biblioteca');

    const tabs     = document.querySelectorAll('.lib-tab');
    const sections = document.querySelectorAll('.lib-section');

    function activateTab(tabEl) {
      tabs.forEach(t => {
        t.classList.remove('lib-tab--active');
        t.setAttribute('aria-selected', 'false');
      });
      sections.forEach(s => s.classList.remove('is-active'));
      tabEl.classList.add('lib-tab--active');
      tabEl.setAttribute('aria-selected', 'true');
      const target = document.getElementById(tabEl.dataset.section);
      if (target) target.classList.add('is-active');
    }

    tabs.forEach(tab => tab.addEventListener('click', () => activateTab(tab)));

    // Acordeões
    document.querySelectorAll('.expand-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const body = trigger.nextElementSibling;
        if (!body || !body.classList.contains('expand-body')) return;
        const open = body.classList.toggle('is-open');
        trigger.setAttribute('aria-expanded', open);
      });
    });
  }

  /* ── PÁGINA: Perfil ──────────────────────────────────────── */

  function initPerfil() {
    highlightNav('perfil');

    const els = {
      streak:      document.getElementById('perfil-streak'),
      checklists:  document.getElementById('perfil-checklists'),
      retinol:     document.getElementById('perfil-retinol'),
      adesao:      document.getElementById('perfil-adesao'),
      diaryRecent: document.getElementById('perfil-diary-recent'),
    };

    if (els.streak)     els.streak.textContent     = computeStreak();
    if (els.checklists) els.checklists.textContent = countCompletedChecklists();
    if (els.retinol)    els.retinol.textContent     = countRetinolApplications();
    if (els.adesao)     els.adesao.textContent      = `${computeAdesao()}%`;

    // Últimos registros do diário
    if (els.diaryRecent) {
      const entries = getDiaryEntries()
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 3);

      if (!entries.length) {
        els.diaryRecent.innerHTML = `
          <p style="font-size:13px;color:var(--ink-light);line-height:1.55">
            Nenhum registro no diário ainda.
            <a href="diario.html" style="color:var(--sage-dark);font-weight:500">Criar o primeiro →</a>
          </p>`;
      } else {
        els.diaryRecent.innerHTML = entries.map(e => `
          <div style="display:flex;align-items:center;justify-content:space-between;
                      padding:11px 0;border-bottom:1px solid var(--nude-30)">
            <span style="font-size:14px;color:var(--ink);font-weight:500">${formatDateBR(e.date)}</span>
            <span style="font-size:12px;color:var(--ink-light)">
              Hid: ${e.hidratacao}/5 &nbsp;·&nbsp; Acne: ${e.acne}/5 &nbsp;·&nbsp; Manchas: ${e.manchas}/5
            </span>
          </div>`).join('');
      }
    }
  }

  /* ── Service Worker ──────────────────────────────────────── */

  function registerSW() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('./sw.js')
        .catch(err => console.warn('[MB] SW registration failed:', err));
    }
  }

  /* ── Boot ────────────────────────────────────────────────── */

  document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.dataset.page;

    if (document.body.dataset.registerSw === 'true') registerSW();

    switch (page) {
      case 'dashboard':  initDashboard();  break;
      case 'produtos':   initProdutos();   break;
      case 'diario':     initDiario();     break;
      case 'biblioteca': initBiblioteca(); break;
      case 'perfil':     initPerfil();     break;
    }
  });

  /* ── API pública mínima ──────────────────────────────────── */
  window.MB = {
    getSkinDate,
    getProducts,
    saveProducts,
    getDiaryEntries,
    saveDiaryEntries,
    showToast,
  };

})();
