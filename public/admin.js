// ═══════════ ADMIN DASHBOARD - ECHTE DATEN ═══════════
const API_BASE = '/api';
let adminToken = localStorage.getItem('adminToken');
let dashboardData = null;

// Debug-Logging
console.log('admin.js geladen. Token:', adminToken ? 'vorhanden' : 'fehlt');

// ═══════════ LOGIN ═══════════
async function doLogin() {
  // Finde das erste Passwort-Feld im Login-Gate (nicht das Stripe-Feld)
  const loginGate = document.getElementById('loginGate');
  const passwordInput = loginGate.querySelector('input[type="password"]');
  const password = passwordInput ? passwordInput.value : '';

  if (!password) {
    showToast('Bitte Passwort eingeben');
    return;
  }

  // Demo-Modus: Einfaches Passwort akzeptieren
  // In Produktion würde hier ein API-Call erfolgen
  if (password.length >= 4) {
    // Demo-Modus: Token setzen damit API-Calls funktionieren
    adminToken = 'demo-' + Date.now();
    localStorage.setItem('adminToken', adminToken);
    console.log('Login erfolgreich, Token gesetzt:', adminToken);

    hideLoginGate();
    showToast('✅ Admin-Login erfolgreich');

    // Versuche trotzdem Dashboard-Daten zu laden
    try {
      await loadDashboard();
    } catch(e) {
      console.log('Dashboard-Daten konnten nicht geladen werden:', e);
    }
    return;
  }

  showToast('❌ Passwort muss mindestens 4 Zeichen haben');
}

function hideLoginGate() {
  const gate = document.getElementById('loginGate');
  gate.classList.add('opacity-0');
  setTimeout(() => {
    gate.classList.add('hidden');
    document.body.style.overflow = '';
  }, 450);
}

function showLoginGate() {
  const gate = document.getElementById('loginGate');
  gate.classList.remove('hidden', 'opacity-0');
  document.body.style.overflow = 'hidden';
  localStorage.removeItem('adminToken');
  adminToken = null;
}

function logout() {
  showLoginGate();
  showToast('Abgemeldet - der Bereich ist jetzt gesperrt.');
}

// ═══════════ DASHBOARD LADEN ═══════════
async function loadDashboard() {
  console.log('loadDashboard() aufgerufen. Token:', adminToken ? 'vorhanden' : 'fehlt');
  if (!adminToken) {
    showLoginGate();
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/admin/stats/`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    console.log('API Response Status:', res.status);

    if (res.status === 401) {
      showToast('⚠️ Session abgelaufen - bitte neu einloggen');
      showLoginGate();
      return;
    }

    dashboardData = await res.json();
    console.log('Dashboard Daten geladen:', dashboardData.stats);
    renderDashboard(dashboardData);

    // Alle Gewerke für Filter laden
    await loadAllTrades();

    // Pages laden - Limit auf 500 erhöht, damit alle 105+ Seiten geladen werden
    await loadPages(1, 500);

  } catch (err) {
    console.error('Dashboard load error:', err);
    showToast('❌ Fehler beim Laden der Daten');
  }
}

// ═══════════ PAGES MIT PAGINATION LADEN ═══════════
let currentPages = [];
let currentPageNum = 1;
let currentPageLimit = 500;
let totalPagesCount = 0;

// Global verfügbar machen für Pagination-Buttons
window.loadPages = async function(page = 1, limit = 500) {
  if (!adminToken) return;

  try {
    const res = await fetch(`${API_BASE}/admin/pages?page=${page}&limit=${limit}`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (res.status === 401) {
      showLoginGate();
      return;
    }

    const data = await res.json();
    currentPages = data.pages || [];
    currentPageNum = page;
    currentPageLimit = limit;
    totalPagesCount = data.pagination?.total || 0;

    // Views aktualisieren die Pages brauchen
    renderPagesOverview(currentPages);
    populateGenPageDropdown(currentPages);
    renderWebsitesView(currentPages, data.pagination);
    renderTodoList(dashboardData?.tenants || [], currentPages);

  } catch (err) {
    console.error('Pages load error:', err);
    showToast('❌ Fehler beim Laden der Seiten');
  }
}

// ═══════════ DASHBOARD RENDERN ═══════════
function renderDashboard(data) {
  const { stats, recentLeads, tenants } = data;

  // ── KPI-Karten (per ID) ──
  setText('stat-rented', stats.rented || 0);
  setText('stat-rented-trend', stats.rented > 0 ? 'Aktive Mieter' : 'Noch keine Mieter', 'text-ink-400');

  setText('stat-mrr', (stats.mrr || 0) + ' €');
  setText('stat-mrr-trend', stats.mrr > 0 ? 'MRR' : 'Noch keine Einnahmen', 'text-ink-400');

  setText('stat-leads', stats.leads || 0);

  setText('stat-total', stats.total || 0);
  setText('stat-available', (stats.available || 0) + ' noch frei', 'text-brand-600');

  // ── Tenant-Statistiken ──
  if (stats.tenantStats) {
    setText('tenantStatActive', stats.tenantStats.active || 0);
    setText('tenantStatSetup', stats.tenantStats.setup || 0);
    setText('tenantStatOverdue', stats.tenantStats.overdue || 0);
    setText('tenantStatCanceled', stats.tenantStats.cancelled || 0);
  }

  // ── Mieter-Tabelle ──
  renderMieterTable(tenants || []);

  // ── Leads-Liste ──
  renderLeadsList(recentLeads || []);

  // NOTE: Pages werden über loadPages() separat geladen (Pagination)
  // renderPagesOverview, populateGenPageDropdown, renderWebsitesView
  // werden in loadPages() aufgerufen
}

function populateGenPageDropdown(pages) {
  const select = document.getElementById('genPageId');
  if (!select) return;

  // Keep first option
  select.innerHTML = '<option value="">Bitte wählen...</option>';

  pages.forEach(page => {
    const option = document.createElement('option');
    option.value = page.id;
    option.textContent = `${page.trade?.name || 'Gewerk'} · ${page.city?.name || 'Stadt'} (${page.slug})`;
    select.appendChild(option);
  });
}

function setText(id, text, colorClass) {
  const el = document.getElementById(id);
  if (el) {
    el.textContent = text;
    if (colorClass) el.className = `mt-1 text-xs font-bold ${colorClass}`;
  }
}

// ═══════════ MIETER TABELLE ═══════════
function renderMieterTable(tenants) {
  const tbody = document.getElementById('mieterTbody');
  const emptyMsg = document.getElementById('mieterEmpty');

  if (!tbody) return;

  if (tenants.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-12 text-center">
          <div class="text-ink-400">
            <p class="text-4xl mb-3">🏠</p>
            <p class="font-bold text-ink-600 text-lg">Noch keine Mieter</p>
            <p class="text-sm mt-1">Alle Städte sind aktuell verfügbar.</p>
            <p class="text-xs mt-3 text-ink-400">Sobald sich ein Handwerker über die Salespage anmeldet, erscheint er hier automatisch.</p>
          </div>
        </td>
      </tr>
    `;
    if (emptyMsg) emptyMsg.classList.add('hidden');
    return;
  }

  if (emptyMsg) emptyMsg.classList.add('hidden');

  // Status-Mapping
  const statusConfig = {
    'active':    { label: 'Aktiv',      class: 'bg-green-100 text-green-700' },
    'inactive':  { label: 'Im Aufbau',  class: 'bg-amber-100 text-amber-700' },
    'past_due':  { label: 'Überfällig', class: 'bg-red-100 text-red-700' },
    'cancelled': { label: 'Gekündigt',  class: 'bg-ink-100 text-ink-500' },
  };

  tbody.innerHTML = tenants.map(t => {
    const page = t.landing_page || {};
    const status = statusConfig[t.subscription_status] || statusConfig['inactive'];

    return `
      <tr class="hover:bg-ink-50 transition" data-status="${t.subscription_status || 'inactive'}">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold text-sm">
              ${(t.company_name || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <p class="font-bold text-ink-900">${t.company_name || 'Unbekannt'}</p>
              <p class="text-xs text-ink-500">${t.email || ''}</p>
            </div>
          </div>
        </td>
        <td class="px-6 py-4 text-sm text-ink-600">${page.title || page.slug || '-'}</td>
        <td class="px-6 py-4 text-sm text-ink-600">-</td>
        <td class="px-6 py-4 text-sm text-ink-600">${formatDate(t.created_at)}</td>
        <td class="px-6 py-4">
          <span class="text-xs font-bold px-2.5 py-1 rounded-full ${status.class}">${status.label}</span>
        </td>
        <td class="px-6 py-4 text-right">
          <button onclick="showTenantDetail('${t.id}')" class="text-brand-600 font-semibold hover:underline">Details</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ═══════════ LEADS LISTE ═══════════
function renderLeadsList(leads) {
  const container = document.getElementById('recentLeadsList');
  if (!container) return;

  if (leads.length === 0) {
    container.innerHTML = `
      <li class="py-3 text-center text-sm text-ink-400 italic">
        Keine Leads in den letzten 30 Tagen
      </li>
    `;
    return;
  }

  container.innerHTML = leads.map(lead => {
    const page = lead.landing_page || {};
    const timeAgo = timeSince(new Date(lead.created_at));
    const isNew = !lead.status || lead.status === 'new';
    return `
      <li class="py-3 flex items-center justify-between gap-3">
        <div>
          <p class="font-bold text-ink-900">${lead.name || 'Anonym'} · ${lead.service || 'Anfrage'}</p>
          <p class="text-ink-500 text-xs">${page.title || page.slug || '-'} · ${timeAgo}</p>
        </div>
        <span class="${isNew ? 'bg-red-100 text-red-700' : 'bg-ink-100 text-ink-500'} text-xs font-bold px-2.5 py-1 rounded-full shrink-0">
          ${isNew ? 'Neu' : (lead.status || 'Gesehen')}
        </span>
      </li>
    `;
  }).join('');
}

// ═══════════ SEITEN ÜBERSICHT ═══════════
function renderPagesOverview(pages) {
  const tbody = document.getElementById('ovTbody');
  if (!tbody) return;

  if (pages.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="px-6 py-8 text-center text-sm text-ink-400 italic">
          Noch keine Seiten erstellt. Verwende den Seed-Button oder erstelle Seiten über die API.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = pages.map(p => {
    const tenant = p.page_customizations?.[0]?.tenant;
    const status = p.status === 'rented'
      ? '<span class="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">Vermietet</span>'
      : '<span class="text-xs font-bold bg-brand-100 text-brand-700 px-2 py-1 rounded-full">Frei</span>';

    return `
      <tr class="hover:bg-ink-50 transition" data-gewerk="${p.trade?.name || ''}">
        <td class="px-6 py-4">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-full ${p.status === 'rented' ? 'bg-green-100 text-green-600' : 'bg-brand-100 text-brand-600'} flex items-center justify-center font-bold text-sm">
              ${(p.trade?.name || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <p class="font-bold text-ink-900">${p.title || p.slug}</p>
              <p class="text-xs text-ink-500">${p.trade?.name || '-'} · ${p.city?.name || '-'}</p>
            </div>
          </div>
        </td>
        <td class="px-6 py-4">${p.trade?.name || '-'}</td>
        <td class="px-6 py-4">${p.city?.name || '-'}</td>
        <td class="px-6 py-4">${status}</td>
        <td class="px-6 py-4 text-sm text-ink-600">${tenant ? '1' : '0'}</td>
        <td class="px-6 py-4 text-right">
          <button onclick="showPageDetail('${p.id}')" class="text-brand-600 font-semibold hover:underline">Details</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ═══════════ TODO-LISTE ═══════════
function renderTodoList(tenants, pages) {
  const container = document.getElementById('todoList');
  if (!container) return;

  const todos = [];

  // Wenn es freie Seiten gibt
  const freePages = pages.filter(p => p.status === 'available');
  if (freePages.length > 0) {
    todos.push({
      color: 'bg-brand-400',
      text: `<strong>Marketing:</strong> ${freePages.length} Website${freePages.length > 1 ? 's' : ''} noch frei - Salespage bewerben`
    });
  }

  // Wenn es keine Seiten gibt
  if (pages.length === 0) {
    todos.push({
      color: 'bg-amber-400',
      text: '<strong>Setup:</strong> Erstelle erste Landing-Pages mit dem Seed-Tool'
    });
  }

  // Wenn es keine Mieter gibt
  if (tenants.length === 0 && pages.length > 0) {
    todos.push({
      color: 'bg-brand-400',
      text: '<strong>Vertrieb:</strong> Noch keine Mieter - Social Media / Google Ads starten'
    });
  }

  if (todos.length === 0) {
    container.innerHTML = `
      <li class="text-ink-400 italic">Keine offenen Aufgaben - alles läuft!</li>
    `;
    return;
  }

  container.innerHTML = todos.map(todo => `
    <li class="flex items-start gap-3">
      <span class="mt-1 w-2.5 h-2.5 rounded-full ${todo.color} shrink-0"></span>
      <span>${todo.text}</span>
    </li>
  `).join('');
}

// ═══════════ WEBSITES & STÄDTE ═══════════
function renderWebsitesView(pages, pagination) {
  console.log('renderWebsitesView() aufgerufen mit', pages.length, 'Seiten');
  const grid = document.getElementById('stadtGrid');
  const hint = document.getElementById('stadtGridHint');
  if (!grid) {
    console.error('stadtGrid Element nicht gefunden!');
    return;
  }

  if (pages.length === 0) {
    grid.innerHTML = '';
    if (hint) hint.textContent = 'Noch keine Seiten vorhanden.';
    return;
  }

  // Pagination Info
  const total = pagination?.total || pages.length;
  const currentPage = pagination?.page || 1;
  const totalPages = pagination?.totalPages || 1;

  if (hint) hint.textContent = `${total} Stadt-Websites im Portfolio - Seite ${currentPage} von ${totalPages}.`;

  grid.innerHTML = pages.map(p => {
    const isRented = p.status === 'rented';
    const statusBadge = isRented
      ? '<span class="bg-ink-100 text-ink-500 text-xs font-bold px-2.5 py-1 rounded-full">vermietet</span>'
      : '<span class="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">frei</span>';

    const tradeEmoji = {
      'Dachdecker': '🏠',
      'Elektriker': '⚡',
      'Klempner': '🔧',
      'Zimmerer': '🔨',
      'Maler': '🖌️',
    }[p.trade?.name] || '🏗️';

    return `
      <div class="stadt-card bg-white rounded-2xl border-2 ${isRented ? 'border-ink-200' : 'border-green-200'} p-5" data-gewerk="${p.trade?.name || ''}" data-status="${isRented ? 'vermietet' : 'frei'}">
        <div class="flex items-center justify-between">
          <p class="font-black text-ink-900">${p.city?.name || 'Unbekannt'}</p>
          ${statusBadge}
        </div>
        <p class="text-xs text-ink-500 mt-1">${tradeEmoji} ${p.trade?.name || '-'} · fachschmiede.de${getStaticFileUrl(p.trade?.slug, p.city?.slug)}</p>
        <p class="text-xs text-ink-500 mt-2">Erstellt: ${formatDate(p.created_at)} · ${p.page_views || 0} Aufrufe</p>
        <div class="mt-4 flex gap-2">
          <a href="${getStaticFileUrl(p.trade?.slug, p.city?.slug)}" target="_blank" class="w-full text-center text-xs font-bold text-brand-600 border border-brand-200 rounded-lg py-2 hover:bg-brand-50 transition">Ansehen</a>
        </div>
      </div>
    `;
  }).join('') + renderPaginationControls(pagination);

  // Filter-Buttons dynamisch erstellen
  renderWebsitesFilter(pages);
}

// Pagination Controls
function renderPaginationControls(pagination) {
  if (!pagination || pagination.totalPages <= 1) return '';

  const { page, totalPages } = pagination;

  let html = '<div class="col-span-full flex justify-center gap-2 mt-6">';

  // Prev Button
  if (page > 1) {
    html += `<button onclick="loadPages(${page - 1}, ${currentPageLimit})" class="px-4 py-2 text-sm font-bold text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition">← Zurück</button>`;
  }

  // Page Info
  html += `<span class="px-4 py-2 text-sm font-bold text-ink-600">Seite ${page} von ${totalPages}</span>`;

  // Next Button
  if (page < totalPages) {
    html += `<button onclick="loadPages(${page + 1}, ${currentPageLimit})" class="px-4 py-2 text-sm font-bold text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 transition">Weiter →</button>`;
  }

  html += '</div>';
  return html;
}

// URL-Slug Mapping: Interner Name → SEO-freundlicher URL-Name
const URL_SLUG_MAP = {
  'shk': 'klempner',
};

// Mapping für statische HTML-Dateien: Trade → Datei-Prefix
const TRADE_FILE_PREFIX = {
  'klempner': 'klempner',
  'dachdecker': 'dach',
  'elektriker': 'elek',
  'maler': 'maler',
  'zimmerer': 'zimm',
};

function getUrlSlug(slug) {
  return URL_SLUG_MAP[slug] || slug;
}

function getStaticFileUrl(tradeSlug, citySlug) {
  // Nutze die Next.js App Route: /dachdecker/muenchen
  const seoSlug = getUrlSlug(tradeSlug);
  return `/${seoSlug}/${citySlug}`;
}

let allTrades = [];

async function loadAllTrades() {
  if (!adminToken || allTrades.length > 0) return;
  try {
    const res = await fetch(`${API_BASE}/admin/trades`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      allTrades = data.trades || [];
    }
  } catch (e) {
    console.log('Trades laden fehlgeschlagen');
  }
}

function renderWebsitesFilter(pages) {
  const container = document.getElementById('stadtFilter');
  if (!container) return;

  // Verwende alle Gewerke (nicht nur aus aktuellen Pages)
  const gewerke = allTrades.length > 0
    ? allTrades.map(t => t.name).sort()
    : [...new Set(pages.map(p => p.trade?.name).filter(Boolean))].sort();

  container.innerHTML = `
    <span class="text-sm font-bold text-ink-700">Filter:</span>
    <button onclick="filterStaedte('', this)" class="stadt-f bg-ink-900 text-white text-xs font-bold px-3.5 py-1.5 rounded-full">Alle</button>
    ${gewerke.map(g => {
      const emoji = {'Dachdecker':'🏠','Elektriker':'⚡','Klempner':'🔧','Zimmerer':'🔨','Maler':'🖌️'}[g] || '🏗️';
      return `<button onclick="filterStaedte('${g}', this)" class="stadt-f bg-ink-100 text-ink-600 text-xs font-bold px-3.5 py-1.5 rounded-full hover:bg-ink-200">${emoji} ${g}</button>`;
    }).join('')}
    <span class="ml-auto text-xs text-ink-400 font-semibold"><span class="inline-block w-2.5 h-2.5 rounded-full bg-green-500 mr-1"></span>frei · <span class="inline-block w-2.5 h-2.5 rounded-full bg-ink-300 mr-1 ml-2"></span>vermietet</span>
  `;
}

// Globale Filter-Funktion für Websites & Städte
window.filterStaedte = function(gewerk, btn) {
  // Buttons aktualisieren
  document.querySelectorAll('.stadt-f').forEach(b => {
    b.classList.remove('bg-ink-900', 'text-white');
    b.classList.add('bg-ink-100', 'text-ink-600');
  });
  if (btn) {
    btn.classList.remove('bg-ink-100', 'text-ink-600');
    btn.classList.add('bg-ink-900', 'text-white');
  }

  // Cards filtern
  document.querySelectorAll('.stadt-card').forEach(card => {
    if (!gewerk || card.dataset.gewerk === gewerk) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
};

// ═══════════ HILFSFUNKTIONEN ═══════════
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function timeSince(date) {
  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + ' Jahren';
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + ' Monaten';
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + ' Tagen';
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + ' Stunden';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + ' Minuten';
  return 'Gerade eben';
}

function showToast(msg) {
  let toast = document.getElementById('adminToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'adminToast';
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(80px);background:#0f172a;color:#fff;padding:14px 24px;border-radius:12px;font-weight:600;font-size:14px;opacity:0;transition:all .35s ease;z-index:90;box-shadow:0 10px 30px rgba(0,0,0,.3);max-width:90vw;';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.transform = 'translateX(-50%) translateY(0)';
  toast.style.opacity = '1';
  setTimeout(() => {
    toast.style.transform = 'translateX(-50%) translateY(80px)';
    toast.style.opacity = '0';
  }, 3000);
}

function showTenantDetail(id) {
  showToast(`Mieter-Details für ID: ${id} - Funktion folgt`);
}

function showPageDetail(id) {
  showToast(`Seiten-Details für ID: ${id} - Funktion folgt`);
}

// ═══════════ LEADS FUNKTIONEN ═══════════
let allLeads = [];
let currentLeadFilter = { status: '', site: '' };

async function loadLeads() {
  if (!adminToken) return;

  try {
    const res = await fetch(`${API_BASE}/admin/leads/?limit=100`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (res.status === 401) {
      showLoginGate();
      return;
    }

    const data = await res.json();
    allLeads = data.leads || [];

    // Update KPIs
    setText('leadStatNew', data.stats.new || 0);
    setText('leadStat30d', data.stats.recent30d || 0);
    setText('leadStatTotal', data.stats.total || 0);

    // Render table
    renderLeadsTable(allLeads);

    // Populate site filter
    populateLeadSiteFilter(allLeads);

  } catch (err) {
    console.error('Leads load error:', err);
    showToast('❌ Fehler beim Laden der Leads');
  }
}

function renderLeadsTable(leads) {
  const tbody = document.getElementById('leadTbody');
  const emptyMsg = document.getElementById('leadEmpty');

  if (!tbody) return;

  if (leads.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-12 text-center">
          <div class="text-ink-400">
            <p class="text-4xl mb-3">📭</p>
            <p class="font-bold text-ink-600 text-lg">Noch keine Leads</p>
            <p class="text-sm mt-1">Sobald Anfragen eingehen, erscheinen sie hier automatisch.</p>
          </div>
        </td>
      </tr>
    `;
    if (emptyMsg) emptyMsg.classList.add('hidden');
    return;
  }

  if (emptyMsg) emptyMsg.classList.add('hidden');

  tbody.innerHTML = leads.map(lead => {
    const page = lead.landing_page || {};
    const trade = lead.trade || {};
    const city = lead.city || {};
    const timeAgo = timeSince(new Date(lead.created_at));

    const statusColors = {
      'new': 'bg-red-100 text-red-700',
      'sent': 'bg-brand-100 text-brand-700',
      'answered': 'bg-green-100 text-green-700',
      'done': 'bg-ink-100 text-ink-500',
    };
    const statusLabels = {
      'new': 'Neu',
      'sent': 'An Mieter gesendet',
      'answered': 'Beantwortet',
      'done': 'Erledigt',
    };
    const statusClass = statusColors[lead.status] || 'bg-ink-100 text-ink-500';
    const statusLabel = statusLabels[lead.status] || lead.status || 'Neu';

    return `
      <tr class="hover:bg-ink-50 transition" data-status="${lead.status || 'new'}" data-site="${page.slug || ''}">
        <td class="px-6 py-4 text-sm text-ink-600 whitespace-nowrap">${timeAgo}</td>
        <td class="px-6 py-4">
          <p class="font-bold text-ink-900">${lead.name || 'Anonym'}</p>
          <p class="text-xs text-ink-500">${lead.email || ''} ${lead.phone ? '· ' + lead.phone : ''}</p>
        </td>
        <td class="px-6 py-4 text-sm text-ink-600">${lead.service || 'Anfrage'}</td>
        <td class="px-6 py-4 text-sm text-ink-600">${trade.name || '-'} · ${city.name || '-'}</td>
        <td class="px-6 py-4 text-sm text-ink-600">${lead.source || 'Website'}</td>
        <td class="px-6 py-4">
          <span class="text-xs font-bold px-2.5 py-1 rounded-full ${statusClass}">${statusLabel}</span>
        </td>
        <td class="px-6 py-4 text-right">
          <button onclick="showLeadDetail('${lead.id}')" class="text-brand-600 font-semibold hover:underline">Details</button>
        </td>
      </tr>
    `;
  }).join('');
}

function populateLeadSiteFilter(leads) {
  const select = document.getElementById('leadSite');
  if (!select) return;

  // Get unique sites
  const sites = [...new Set(leads.map(l => l.landing_page?.slug).filter(Boolean))];

  // Keep first option, add new ones
  select.innerHTML = '<option value="">Alle Websites</option>';
  sites.forEach(slug => {
    const option = document.createElement('option');
    option.value = slug;
    option.textContent = slug;
    select.appendChild(option);
  });
}

function filterLeads() {
  const statusFilter = document.getElementById('leadStatus')?.value || '';
  const siteFilter = document.getElementById('leadSite')?.value || '';

  let filtered = allLeads;

  if (statusFilter) {
    // Map German labels to status codes
    const statusMap = {
      'Neu': 'new',
      'An Mieter gesendet': 'sent',
      'Beantwortet': 'answered',
    };
    const code = statusMap[statusFilter] || statusFilter;
    filtered = filtered.filter(l => (l.status || 'new') === code);
  }

  if (siteFilter) {
    filtered = filtered.filter(l => (l.landing_page?.slug || '') === siteFilter);
  }

  renderLeadsTable(filtered);
}

function showLeadDetail(leadId) {
  const lead = allLeads.find(l => l.id === leadId);
  if (!lead) {
    showToast('Lead nicht gefunden');
    return;
  }

  const page = lead.landing_page || {};
  const trade = lead.trade || {};
  const city = lead.city || {};

  // Create modal content
  const modalHTML = `
    <div class="fixed inset-0 z-[80] bg-ink-900/60 backdrop-blur flex items-center justify-center p-4" id="leadDetailModal">
      <div class="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-black text-ink-900">Lead-Details</h3>
          <button onclick="document.getElementById('leadDetailModal').remove()" class="text-ink-400 hover:text-ink-600">✕</button>
        </div>
        <div class="space-y-4">
          <div>
            <p class="text-xs font-bold text-ink-400 uppercase">Name</p>
            <p class="font-bold text-ink-900">${lead.name || 'Anonym'}</p>
          </div>
          <div>
            <p class="text-xs font-bold text-ink-400 uppercase">Kontakt</p>
            <p class="text-sm text-ink-600">${lead.email || '-'}<br>${lead.phone || '-'}</p>
          </div>
          <div>
            <p class="text-xs font-bold text-ink-400 uppercase">Anliegen</p>
            <p class="text-sm text-ink-900">${lead.service || 'Anfrage'}</p>
          </div>
          <div>
            <p class="text-xs font-bold text-ink-400 uppercase">Website</p>
            <p class="text-sm text-ink-600">${trade.name || '-'} · ${city.name || '-'}</p>
          </div>
          <div>
            <p class="text-xs font-bold text-ink-400 uppercase">Nachricht</p>
            <p class="text-sm text-ink-900 bg-ink-50 rounded-lg p-3">${lead.message || 'Keine Nachricht'}</p>
          </div>
          <div>
            <p class="text-xs font-bold text-ink-400 uppercase mb-2">Status ändern</p>
            <div class="flex gap-2">
              <button onclick="updateLeadStatus('${lead.id}', 'new')" class="text-xs font-bold px-3 py-2 rounded-lg border ${lead.status === 'new' ? 'bg-red-100 text-red-700 border-red-300' : 'border-ink-200 text-ink-600'}">Neu</button>
              <button onclick="updateLeadStatus('${lead.id}', 'sent')" class="text-xs font-bold px-3 py-2 rounded-lg border ${lead.status === 'sent' ? 'bg-brand-100 text-brand-700 border-brand-300' : 'border-ink-200 text-ink-600'}">Gesendet</button>
              <button onclick="updateLeadStatus('${lead.id}', 'answered')" class="text-xs font-bold px-3 py-2 rounded-lg border ${lead.status === 'answered' ? 'bg-green-100 text-green-700 border-green-300' : 'border-ink-200 text-ink-600'}">Beantwortet</button>
              <button onclick="updateLeadStatus('${lead.id}', 'done')" class="text-xs font-bold px-3 py-2 rounded-lg border ${lead.status === 'done' ? 'bg-ink-100 text-ink-700 border-ink-300' : 'border-ink-200 text-ink-600'}">Erledigt</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove existing modal
  const existing = document.getElementById('leadDetailModal');
  if (existing) existing.remove();

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function updateLeadStatus(leadId, status) {
  try {
    const res = await fetch(`${API_BASE}/admin/leads/`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: leadId, status })
    });

    if (res.ok) {
      showToast('✅ Status aktualisiert');
      // Update local data
      const lead = allLeads.find(l => l.id === leadId);
      if (lead) lead.status = status;
      // Re-render
      filterLeads();
      // Close modal
      const modal = document.getElementById('leadDetailModal');
      if (modal) modal.remove();
    } else {
      showToast('❌ Status-Update fehlgeschlagen');
    }
  } catch (err) {
    console.error('Lead update error:', err);
    showToast('❌ Fehler beim Aktualisieren');
  }
}

// ═══════════ BILLING / MIETEN ═══════════
async function loadBillingData() {
  if (!adminToken) return;

  try {
    const res = await fetch(`${API_BASE}/admin/billing`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (res.status === 401) {
      showLoginGate();
      return;
    }

    const data = await res.json();

    if (!data.success) {
      console.error('Billing API error:', data.error);
      return;
    }

    const stats = data.stats;

    // KPI Cards
    const mrrEl = document.getElementById('billMrr');
    if (mrrEl) mrrEl.textContent = stats.mrr.toLocaleString('de-DE') + ' €';

    const openEl = document.getElementById('billOpen');
    if (openEl) openEl.textContent = stats.openInvoicesTotal.toLocaleString('de-DE') + ' €';

    const openCountEl = document.getElementById('billOpenCount');
    if (openCountEl) openCountEl.textContent = stats.openInvoicesCount + ' überfällig';

    const basisEl = document.getElementById('billBasis');
    if (basisEl) basisEl.textContent = stats.basisCount + ' × ' + stats.basisPrice + ' €';

    const proEl = document.getElementById('billPro');
    if (proEl) proEl.textContent = stats.proCount + ' × ' + stats.proPrice + ' €';

    // Tenant table
    const tbody = document.getElementById('billTenantTbody');
    if (tbody) {
      if (!data.tenants || data.tenants.length === 0) {
        tbody.innerHTML = `
          <tr>
            <td colspan="5" class="px-6 py-12 text-center">
              <p class="font-bold text-ink-600 text-lg">Noch keine aktiven Mieter</p>
              <p class="text-sm text-ink-400 mt-1">Sobald eine Website vermietet wird, erscheint der Mieter hier.</p>
            </td>
          </tr>
        `;
      } else {
        tbody.innerHTML = data.tenants.map((t) => {
          const page = t.landing_page || {};
          const trade = page.trade || {};
          const city = page.city || {};
          const price = (page.monthly_price || 0) / 100;
          const since = t.created_at ? new Date(t.created_at).toLocaleDateString('de-DE') : '-';

          return `
            <tr class="hover:bg-ink-50">
              <td class="px-6 py-4 font-bold text-ink-900">${t.company_name || t.contact_name || 'Unbekannt'}</td>
              <td class="px-6 py-4 text-ink-600">${trade.name || '-'} / ${city.name || '-'}</td>
              <td class="px-6 py-4 text-ink-900 font-bold">${price.toLocaleString('de-DE')} €</td>
              <td class="px-6 py-4 text-ink-600">${since}</td>
              <td class="px-6 py-4"><span class="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">Aktiv</span></td>
            </tr>
          `;
        }).join('');
      }
    }

    // Revenue by trade
    const revEl = document.getElementById('billRevenueByTrade');
    if (revEl) {
      if (!data.revenueByTrade || data.revenueByTrade.length === 0) {
        revEl.innerHTML = '<p class="text-ink-400 italic">Noch keine Umsatzdaten verfügbar</p>';
      } else {
        const maxRev = Math.max(...data.revenueByTrade.map((r) => r.revenue), 1);
        const colors = ['bg-orange-500', 'bg-blue-500', 'bg-teal-500', 'bg-brand-500', 'bg-purple-500', 'bg-red-500'];
        const emojis = {
          dachdecker: '🏠', elektriker: '⚡', klempner: '🔥', zimmerer: '🔨', maler: '🖌️', fliesenleger: '🧱'
        };

        revEl.innerHTML = data.revenueByTrade.map((r, i) => {
          const pct = Math.round((r.revenue / maxRev) * 100);
          const color = colors[i % colors.length];
          const emoji = emojis[r.slug] || '🏢';
          return `
            <div>
              <div class="flex justify-between font-semibold">
                <span>${emoji} ${r.name}</span>
                <span>${r.revenue.toLocaleString('de-DE')} €</span>
              </div>
              <div class="mt-1 h-2.5 bg-ink-100 rounded-full">
                <div class="h-2.5 ${color} rounded-full" style="width:${pct}%"></div>
              </div>
            </div>
          `;
        }).join('');
      }
    }

  } catch (err) {
    console.error('Billing load error:', err);
  }
}

// ═══════════ INVOICE / RECHNUNGEN ═══════════
async function loadInvoiceData() {
  if (!adminToken) return;

  try {
    const res = await fetch(`${API_BASE}/admin/invoices`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (res.status === 401) {
      showLoginGate();
      return;
    }

    const data = await res.json();

    if (!data.success) {
      console.error('Invoice API error:', data.error);
      return;
    }

    // Badge update
    const badge = document.getElementById('invoiceAutoBadge');
    if (badge) badge.textContent = data.stats.total + ' automatisch';

    // Table
    const tbody = document.getElementById('invoiceList');
    if (!tbody) return;

    if (!data.invoices || data.invoices.length === 0) {
      tbody.innerHTML = `
        <tr id="invoiceListEmpty">
          <td colspan="7" class="px-6 py-12 text-center">
            <p class="font-bold text-ink-600 text-lg">Noch keine Rechnungen</p>
            <p class="text-sm text-ink-400 mt-1">Rechnungen werden automatisch erstellt, sobald Mieter über Stripe bezahlen.</p>
          </td>
        </tr>
      `;
      return;
    }

    tbody.innerHTML = data.invoices.map((inv) => {
      const since = inv.created_at ? new Date(inv.created_at).toLocaleDateString('de-DE') : '-';
      return `
        <tr class="hover:bg-ink-50">
          <td class="px-6 py-4 font-mono text-ink-600">${inv.number}</td>
          <td class="px-6 py-4">
            <p class="font-bold text-ink-900">${inv.tenant_name}</p>
            <p class="text-xs text-ink-400">${inv.website}</p>
          </td>
          <td class="px-6 py-4 text-ink-600">${inv.month}</td>
          <td class="px-6 py-4 font-bold text-ink-900">${inv.amount.toLocaleString('de-DE')} €</td>
          <td class="px-6 py-4 text-ink-600">${inv.payment_method}</td>
          <td class="px-6 py-4"><span class="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">Bezahlt</span></td>
          <td class="px-6 py-4 text-right">
            <button onclick="showToast('PDF-Download folgt...')" class="text-brand-600 font-semibold hover:underline">PDF</button>
          </td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    console.error('Invoice load error:', err);
  }
}

// ═══════════ TRADES / GEWERKE ═══════════
let allTradeRequests = [];

async function loadTrades() {
  const grid = document.getElementById('gewerkGrid');
  if (!grid) return;

  // Fallback: Statische Daten
  const fallbackTrades = [
    { name: 'Dachdecker', slug: 'dachdecker', emoji: '🏠', total_pages: 21, rented_pages: 0, available_pages: 21 },
    { name: 'Elektriker', slug: 'elektriker', emoji: '⚡', total_pages: 21, rented_pages: 0, available_pages: 21 },
    { name: 'Klempner', slug: 'klempner', emoji: '🔥', total_pages: 21, rented_pages: 0, available_pages: 21 },
    { name: 'Maler', slug: 'maler', emoji: '🎨', total_pages: 21, rented_pages: 0, available_pages: 21 },
    { name: 'Zimmerer', slug: 'zimmerer', emoji: '🔨', total_pages: 21, rented_pages: 0, available_pages: 21 },
  ];

  // 1. Zuerst Trade Requests laden (pending items)
  if (adminToken) {
    try {
      await loadTradeRequests();
    } catch (err) {
      console.log('Trade requests konnten nicht geladen werden:', err);
    }
  }

  // 2. Echte Trades von API laden
  let trades = fallbackTrades;
  if (adminToken) {
    try {
      const res = await fetch(`${API_BASE}/admin/trades?_=${Date.now()}`, {
        headers: { 'Authorization': `Bearer ${adminToken}` }
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.trades?.length > 0) {
          trades = data.trades;
        }
      }
    } catch (err) {
      console.log('API fallback used');
    }
  }

  // 3. Alles zusammen rendern: Trades + Pending Requests
  const pendingRequests = (allTradeRequests || []).filter(r => r.status !== 'ready');
  renderCombinedTradeGrid(trades, pendingRequests);
}

// Trade Requests aus Supabase laden
async function loadTradeRequests() {
  try {
    const res = await fetch(`${API_BASE}/admin/trade-requests`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (!res.ok) throw new Error('API Fehler');

    const data = await res.json();
    allTradeRequests = data.requests || [];

    // Nur die Requests-Tabelle aktualisieren
    // Das Grid wird von loadTrades() / renderCombinedTradeGrid() verwaltet
    renderTradeRequests();

  } catch (err) {
    console.error('Load trade requests error:', err);
  }
}

function getRequestStatusConfig(status) {
  const configs = {
    pending: { border: 'border-brand-300', bg: 'bg-brand-50', badge: 'bg-brand-600 text-white', label: 'Ausstehend' },
    generating: { border: 'border-amber-300', bg: 'bg-amber-50', badge: 'bg-amber-500 text-white', label: 'Generiere...' },
    ready: { border: 'border-green-300', bg: 'bg-green-50', badge: 'bg-green-600 text-white', label: 'Fertig' },
    error: { border: 'border-red-300', bg: 'bg-red-50', badge: 'bg-red-600 text-white', label: 'Fehler' }
  };
  return configs[status] || configs.pending;
}

function renderTradeRequests() {
  const reqBody = document.getElementById('tradeRequestsBody');
  if (!reqBody) return;

  if (allTradeRequests.length === 0) {
    reqBody.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-ink-400 text-sm">Noch keine Anfragen vorhanden.</td></tr>`;
    return;
  }

  reqBody.innerHTML = allTradeRequests.map(req => {
    const statusConfig = getRequestStatusConfig(req.status);
    const created = new Date(req.created_at).toLocaleDateString('de-DE');
    const needsSalespage = req.status === 'ready' && !req.salespage_build_requested;
    return `
      <tr class="hover:bg-ink-50 transition">
        <td class="px-4 py-3 font-bold text-ink-900">${req.emoji || '🆕'} ${req.name}</td>
        <td class="px-4 py-3 text-sm text-ink-600">${req.region || '-'}</td>
        <td class="px-4 py-3"><span class="${statusConfig.badge} text-xs font-bold px-2 py-1 rounded-full">${statusConfig.label}</span></td>
        <td class="px-4 py-3 text-sm text-ink-500">${created}</td>
        <td class="px-4 py-3 text-right">
          ${req.status === 'pending' ? `<button onclick="generateTrade('${req.id}')" class="text-brand-600 font-bold text-sm hover:underline">🚀 Generieren</button>` : ''}
          ${needsSalespage ? `<button onclick="requestSalespageBuild('${req.id}', '${req.name}', '${req.slug}')" class="text-amber-600 font-bold text-sm hover:underline ml-2">🏗️ Salespage</button>` : ''}
          <button onclick="deleteTradeRequest('${req.id}')" class="text-red-600 font-bold text-sm hover:underline ml-3">Löschen</button>
        </td>
      </tr>
    `;
  }).join('');
}

// Trade Request an API senden
async function submitTradeRequest(form) {
  const name = document.getElementById('ngName').value.trim();
  if (!name) {
    showToast('❌ Bitte Gewerk-Name eingeben');
    return;
  }

  // Alle Inputs im Formular finden
  const inputs = form.querySelectorAll('input[type="text"]');
  const region = inputs[1] ? inputs[1].value.trim() : ''; // Zweites Text-Input = Region
  const selects = form.querySelectorAll('select');
  const priority = selects[0] ? selects[0].value : 'Normal (nach Plan)';
  const cityCount = selects[1] ? selects[1].value : '10 Städte';
  const textarea = form.querySelector('textarea');
  const notes = textarea ? textarea.value.trim() : '';

  showToast('⏳ Sende Anfrage...');

  try {
    const res = await fetch(`${API_BASE}/admin/trade-requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: name,
        region: region,
        priority: priority.toLowerCase().includes('hoch') ? 'high' : priority.toLowerCase().includes('sofort') ? 'urgent' : 'normal',
        city_count: parseInt(cityCount) || 10,
        notes: notes
      })
    });

    const data = await res.json();

    if (data.success) {
      showToast(`✅ Gewerk "${name}" angefordert!`);
      closeModal('modalGewerk');
      form.reset();
      
      console.log('Trade request erfolgreich, lade Daten neu...');
      
      // Neu laden
      await loadTradeRequests();
      console.log('Trade requests geladen:', allTradeRequests.length, 'Einträge');
      
      await loadTrades();
      console.log('Trades geladen');
      
      // Zur Gewerke-Ansicht wechseln
      console.log('Wechsle zu Gewerke-Ansicht...');
      showView('gewerke');
      
      // Explizit den Gewerke-Tab aktivieren
      const gewerkeTab = document.querySelector('[data-tab="gewerke"]');
      if (gewerkeTab) {
        gewerkeTab.click();
        console.log('Gewerke-Tab aktiviert');
      }
      
      showToast(`📋 ${allTradeRequests.length} Anfrage(n) in der Liste`);
    } else {
      showToast(`❌ Fehler: ${data.error || 'Unbekannter Fehler'}`);
    }

  } catch (err) {
    console.error('Submit trade request error:', err);
    showToast('❌ Netzwerkfehler – bitte erneut versuchen');
  }
}

// Trade auto-generieren
async function generateTrade(requestId) {
  if (!confirm('🚀 Auto-Generierung starten?\n\nDies erstellt:\n• Salespage HTML\n• Stadtseiten in der DB\n• Blog-Artikel\n• FAQ & Services\n\nDauer: ca. 2-5 Minuten.')) {
    return;
  }

  showToast('🚀 Starte Auto-Generierung...');

  try {
    // Status auf "generating" setzen
    await fetch(`${API_BASE}/admin/trade-requests`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        id: requestId,
        status: 'generating'
      })
    });

    // UI aktualisieren
    await loadTradeRequests();

    // Generator-API aufrufen
    const res = await fetch(`${API_BASE}/admin/generate-trade`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ request_id: requestId })
    });

    const data = await res.json();

    if (data.success) {
      showToast(`✅ Gewerk "${data.trade_name}" erfolgreich generiert!`);
      await loadTradeRequests();
      await loadTrades();
      await loadPages(1, 500); // Pages neu laden damit neue Seiten sichtbar sind
    } else {
      showToast(`❌ Fehler bei Generierung: ${data.error}`);
    }

  } catch (err) {
    console.error('Generate trade error:', err);
    showToast('❌ Fehler bei der Generierung');
  }
}

// Salespage bauen anfordern (Benachrichtigt Finn)
async function requestSalespageBuild(requestId, tradeName, tradeSlug) {
  if (!confirm(`🏗️ Salespage für "${tradeName}" bauen?\n\nDies benachrichtigt Finn (den AI-Assistenten), dass er:\n• Die HTML-Salespage basierend auf dem Template der bestehenden 5 Gewerke bauen soll\n• Alle Stadt-Links, Farben und Gewerk-Spezifika einbauen soll\n\nDu wirst benachrichtigt, sobald die Salespage fertig ist.`)) {
    return;
  }

  showToast('🏗️ Sende Anfrage an Finn...');

  try {
    // Status in DB aktualisieren
    const res = await fetch(`${API_BASE}/admin/trade-requests`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        id: requestId,
        salespage_build_requested: true,
        salespage_requested_at: new Date().toISOString()
      })
    });

    if (res.ok) {
      showToast(`✅ Finn wurde benachrichtigt! Er baut jetzt die Salespage für "${tradeName}".`);
      
      // Lokalen Hinweis speichern (damit wir als Finn sehen dass eine Anfrage offen ist)
      const pendingBuilds = JSON.parse(localStorage.getItem('pendingSalespageBuilds') || '[]');
      pendingBuilds.push({
        requestId: requestId,
        tradeName: tradeName,
        tradeSlug: tradeSlug,
        requestedAt: new Date().toISOString(),
        status: 'pending'
      });
      localStorage.setItem('pendingSalespageBuilds', JSON.stringify(pendingBuilds));
      
      // UI aktualisieren
      await loadTradeRequests();
      
      // Hinweis anzeigen
      setTimeout(() => {
        showToast('💡 Hinweis: Die Landing Pages (/schwerte, /dortmund etc.) funktionieren bereits! Die Salespage ist nur für den Kunden-Check-in.');
      }, 3000);
    } else {
      showToast('❌ Fehler beim Senden der Anfrage');
    }

  } catch (err) {
    console.error('Request salespage build error:', err);
    showToast('❌ Netzwerkfehler – bitte erneut versuchen');
  }
}

// Trade Request löschen
async function deleteTradeRequest(requestId) {
  if (!confirm('Anfrage wirklich löschen?')) return;

  try {
    const res = await fetch(`${API_BASE}/admin/trade-requests?id=${requestId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (res.ok) {
      showToast('✅ Anfrage gelöscht');
      await loadTradeRequests();
      await loadTrades();
    } else {
      showToast('❌ Fehler beim Löschen');
    }
  } catch (err) {
    showToast('❌ Netzwerkfehler');
  }
}

function renderTradeCards(trades) {
  const grid = document.getElementById('gewerkGrid');
  if (!grid) return;

  const salesPages = {
    'dachdecker': '/sales-dachdecker.html',
    'elektriker': '/sales-elektriker.html',
    'klempner': '/sales-klempner.html',
    'zimmerer': '/sales-zimmerer.html',
    'maler': '/sales-maler.html',
  };

  const samplePages = {
    'dachdecker': '/muster/dachdecker',
    'elektriker': '/muster/elektriker',
    'klempner': '/muster/klempner',
    'zimmerer': '/muster/zimmerer',
    'maler': '/muster/maler',
  };

  grid.innerHTML = trades.map((trade) => {
    const isLive = trade.total_pages > 0;
    const statusBadge = isLive
      ? `<span class="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">Live</span>`
      : `<span class="bg-ink-100 text-ink-500 text-xs font-bold px-2.5 py-1 rounded-full">Geplant</span>`;

    const salesUrl = salesPages[trade.slug] || `#`;
    const sampleUrl = samplePages[trade.slug] || `#`;

    return `
      <div class="border border-ink-200 rounded-2xl p-5">
        <div class="flex items-center justify-between">
          <p class="font-black text-ink-900 text-lg">${trade.emoji || '🏠'} ${trade.name}</p>
          ${statusBadge}
        </div>
        <ul class="mt-3 text-xs text-ink-500 space-y-1.5">
          <li>✓ ${trade.total_pages} Stadt-Websites (${trade.rented_pages} vermietet)</li>
          <li>✓ ${trade.available_pages} verfügbar zur Vermietung</li>
        </ul>
        <div class="mt-4 flex gap-2">
          <a href="${salesUrl}" class="flex-1 text-center text-xs font-bold text-brand-600 border border-brand-200 rounded-lg py-2 hover:bg-brand-50 transition">Salespage</a>
          <a href="${sampleUrl}" class="flex-1 text-center text-xs font-bold text-ink-600 border border-ink-200 rounded-lg py-2 hover:bg-ink-50 transition">Musterseite</a>
        </div>
      </div>
    `;
  }).join('') + `
    <button onclick="openModal('modalGewerk')" class="border-2 border-dashed border-brand-300 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-brand-600 hover:bg-brand-50 transition min-h-[190px]">
      <span class="text-3xl">+</span>
      <span class="font-bold">Neues Gewerk anfordern</span>
      <span class="text-xs text-ink-400 font-normal">Redaktion erstellt Texte, FAQ &amp; Blog-Paket</span>
    </button>
  `;

  // Requests-Table leeren
  const reqBody = document.getElementById('tradeRequestsBody');
  if (reqBody) {
    reqBody.innerHTML = `<tr><td colspan="5" class="px-4 py-8 text-center text-ink-400 text-sm">Noch keine Anfragen vorhanden.</td></tr>`;
  }
}

function renderCombinedTradeGrid(trades, pendingRequests) {
  const grid = document.getElementById('gewerkGrid');
  if (!grid) return;

  const salesPages = {
    'dachdecker': '/sales-dachdecker.html',
    'elektriker': '/sales-elektriker.html',
    'klempner': '/sales-klempner.html',
    'zimmerer': '/sales-zimmerer.html',
    'maler': '/sales-maler.html',
  };

  const samplePages = {
    'dachdecker': '/muster/dachdecker',
    'elektriker': '/muster/elektriker',
    'klempner': '/muster/klempner',
    'zimmerer': '/muster/zimmerer',
    'maler': '/muster/maler',
  };

  const statusConfig = {
    pending: { badge: 'bg-amber-100 text-amber-700', label: 'Ausstehend', border: 'border-amber-200', bg: 'bg-amber-50' },
    generating: { badge: 'bg-blue-100 text-blue-700', label: 'Generiere...', border: 'border-blue-200', bg: 'bg-blue-50' },
    ready: { badge: 'bg-green-100 text-green-700', label: 'Bereit', border: 'border-green-200', bg: 'bg-green-50' },
  };

  // Bestehende Trades rendern
  let html = trades.map((trade) => {
    const isLive = trade.total_pages > 0;
    const statusBadge = isLive
      ? `<span class="bg-green-100 text-green-700 text-xs font-bold px-2.5 py-1 rounded-full">Live</span>`
      : `<span class="bg-ink-100 text-ink-500 text-xs font-bold px-2.5 py-1 rounded-full">Geplant</span>`;

    const salesUrl = salesPages[trade.slug] || `#`;
    const sampleUrl = samplePages[trade.slug] || `#`;

    return `
      <div class="border border-ink-200 rounded-2xl p-5">
        <div class="flex items-center justify-between">
          <p class="font-black text-ink-900 text-lg">${trade.emoji || '🏠'} ${trade.name}</p>
          ${statusBadge}
        </div>
        <ul class="mt-3 text-xs text-ink-500 space-y-1.5">
          <li>✓ ${trade.total_pages} Stadt-Websites (${trade.rented_pages} vermietet)</li>
          <li>✓ ${trade.available_pages} verfügbar zur Vermietung</li>
        </ul>
        <div class="mt-4 flex gap-2">
          <a href="${salesUrl}" class="flex-1 text-center text-xs font-bold text-brand-600 border border-brand-200 rounded-lg py-2 hover:bg-brand-50 transition">Salespage</a>
          <a href="${sampleUrl}" class="flex-1 text-center text-xs font-bold text-ink-600 border border-ink-200 rounded-lg py-2 hover:bg-ink-50 transition">Musterseite</a>
        </div>
      </div>
    `;
  }).join('');

  // Pending Requests rendern
  if (pendingRequests && pendingRequests.length > 0) {
    html += pendingRequests.map(req => {
      const cfg = statusConfig[req.status] || statusConfig.pending;
      return `
        <div class="border ${cfg.border} ${cfg.bg} rounded-2xl p-5" data-request-id="${req.id}">
          <div class="flex items-center justify-between">
            <p class="font-black text-ink-900 text-lg">${req.emoji || '🆕'} ${req.name}</p>
            <span class="${cfg.badge} text-xs font-bold px-2.5 py-1 rounded-full">${cfg.label}</span>
          </div>
          <ul class="mt-3 text-xs text-ink-500 space-y-1.5">
            <li>◐ ${req.region || 'Region nicht angegeben'}</li>
            <li>○ ${req.city_count || 10} Start-Städte geplant</li>
            <li>○ Priorität: ${req.priority || 'normal'}</li>
          </ul>
          <div class="mt-4 flex gap-2">
            ${req.status === 'pending' ? `
              <button onclick="generateTrade('${req.id}')" class="flex-1 text-xs font-bold text-white bg-brand-600 rounded-lg py-2 hover:bg-brand-700 transition">🚀 Auto-Generieren</button>
            ` : req.status === 'generating' ? `
              <button disabled class="flex-1 text-xs font-bold text-ink-400 bg-ink-100 rounded-lg py-2 cursor-wait">⏳ Generiere...</button>
            ` : ''}
            <button onclick="deleteTradeRequest('${req.id}')" class="text-xs font-bold text-red-600 border border-red-200 rounded-lg py-2 px-3 hover:bg-red-50 transition">🗑</button>
          </div>
        </div>
      `;
    }).join('');
  }

  // "Neues Gewerk" Button
  html += `
    <button onclick="openModal('modalGewerk')" class="border-2 border-dashed border-brand-300 rounded-2xl p-5 flex flex-col items-center justify-center gap-2 text-brand-600 hover:bg-brand-50 transition min-h-[190px]">
      <span class="text-3xl">+</span>
      <span class="font-bold">Neues Gewerk anfordern</span>
      <span class="text-xs text-ink-400 font-normal">Redaktion erstellt Texte, FAQ &amp; Blog-Paket</span>
    </button>
  `;

  grid.innerHTML = html;
}

// ═══════════ BLOG / ARTIKEL ═══════════
let allArticles = [];
let currentArticleFilter = 'all';

async function loadArticles() {
  if (!adminToken) return;

  try {
    const res = await fetch(`${API_BASE}/articles/?status=all&limit=100`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });

    if (res.status === 401) {
      showLoginGate();
      return;
    }

    const data = await res.json();
    allArticles = data.articles || [];

    // Update KPIs
    const published = allArticles.filter(a => a.status === 'published').length;
    const drafts = allArticles.filter(a => a.status === 'draft').length;
    const aiGenerated = allArticles.filter(a => a.ai_generated).length;

    setText('blogStatPublished', published);
    setText('blogStatDrafts', drafts);
    setText('blogStatAi', aiGenerated);

    renderArticlesTable(allArticles);
    populateArticlePageFilter(allArticles);

  } catch (err) {
    console.error('Articles load error:', err);
    showToast('❌ Fehler beim Laden der Artikel');
  }
}

function renderArticlesTable(articles) {
  const tbody = document.getElementById('blogTbody');
  const emptyMsg = document.getElementById('blogEmpty');

  if (!tbody) return;

  if (articles.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="px-6 py-12 text-center">
          <div class="text-ink-400">
            <p class="text-4xl mb-3">📝</p>
            <p class="font-bold text-ink-600 text-lg">Noch keine Artikel</p>
            <p class="text-sm mt-1">Erstelle deinen ersten Artikel oder nutze die KI-Generierung.</p>
          </div>
        </td>
      </tr>
    `;
    if (emptyMsg) emptyMsg.classList.add('hidden');
    return;
  }

  if (emptyMsg) emptyMsg.classList.add('hidden');

  const statusColors = {
    'published': 'bg-green-100 text-green-700',
    'draft': 'bg-amber-100 text-amber-700',
    'archived': 'bg-ink-100 text-ink-500',
  };
  const statusLabels = {
    'published': 'Veröffentlicht',
    'draft': 'Entwurf',
    'archived': 'Archiviert',
  };

  tbody.innerHTML = articles.map(article => {
    const page = article.landing_page || {};
    const trade = page.trade || {};
    const city = page.city || {};
    const timeAgo = article.published_at ? timeSince(new Date(article.published_at)) : '-';

    const statusClass = statusColors[article.status] || 'bg-ink-100 text-ink-500';
    const statusLabel = statusLabels[article.status] || article.status;

    return `
      <tr class="hover:bg-ink-50 transition" data-status="${article.status}" data-page="${page.slug || ''}">
        <td class="px-6 py-4">
          <p class="font-bold text-ink-900">${article.title || 'Ohne Titel'}</p>
          <p class="text-xs text-ink-500">${article.slug || ''}</p>
        </td>
        <td class="px-6 py-4 text-sm text-ink-600">${trade.name || '-'}</td>
        <td class="px-6 py-4 text-sm text-ink-600">${city.name || '-'}</td>
        <td class="px-6 py-4 text-sm text-ink-600">${article.word_count || 0} Wörter</td>
        <td class="px-6 py-4 text-sm text-ink-600 whitespace-nowrap">${timeAgo}</td>
        <td class="px-6 py-4">
          <span class="text-xs font-bold px-2.5 py-1 rounded-full ${statusClass}">${statusLabel}</span>
          ${article.ai_generated ? '<span class="text-xs font-bold px-2 py-1 rounded-full bg-purple-100 text-purple-700 ml-1">KI</span>' : ''}
        </td>
        <td class="px-6 py-4 text-right">
          <button onclick="showArticleDetail('${article.id}')" class="text-brand-600 font-semibold hover:underline">Details</button>
        </td>
      </tr>
    `;
  }).join('');
}

function populateArticlePageFilter(articles) {
  const select = document.getElementById('articlePage');
  if (!select) return;

  const pages = [...new Set(articles.map(a => a.landing_page?.slug).filter(Boolean))];

  select.innerHTML = '<option value="">Alle Seiten</option>';
  pages.forEach(slug => {
    const option = document.createElement('option');
    option.value = slug;
    option.textContent = slug;
    select.appendChild(option);
  });
}

function filterArticles() {
  const statusFilter = document.getElementById('articleStatus')?.value || '';
  const pageFilter = document.getElementById('articlePage')?.value || '';

  let filtered = allArticles;

  if (statusFilter) {
    const statusMap = {
      'Entwurf': 'draft',
      'Veröffentlicht': 'published',
      'Archiviert': 'archived',
    };
    const code = statusMap[statusFilter] || statusFilter;
    filtered = filtered.filter(a => (a.status || 'draft') === code);
  }

  if (pageFilter) {
    filtered = filtered.filter(a => (a.landing_page?.slug || '') === pageFilter);
  }

  renderArticlesTable(filtered);
}

async function generateArticle() {
  const pageId = document.getElementById('genPageId')?.value;
  const customTitle = document.getElementById('genTitle')?.value;

  if (!pageId) {
    showToast('❌ Bitte wähle eine Seite aus');
    return;
  }

  const btn = document.getElementById('genBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Generiere...';
  }

  try {
    const res = await fetch(`${API_BASE}/articles/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        landing_page_id: pageId,
        custom_title: customTitle || undefined
      })
    });

    const data = await res.json();

    if (data.error) {
      showToast('❌ ' + (data.message || 'Generierung fehlgeschlagen'));
    } else {
      showToast(`✅ Artikel generiert: "${data.article?.title || 'Erfolg'}"`);
      loadArticles();
      // Reset form
      document.getElementById('genTitle').value = '';
    }
  } catch (err) {
    console.error('Generate error:', err);
    showToast('❌ Fehler bei der Generierung');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '🤖 Mit KI generieren';
    }
  }
}

async function runArticleSchedule() {
  const btn = document.getElementById('scheduleBtn');
  if (btn) {
    btn.disabled = true;
    btn.textContent = '⏳ Plane Artikel...';
  }

  try {
    const res = await fetch(`${API_BASE}/articles/schedule`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      }
    });

    const data = await res.json();

    if (data.error) {
      showToast('❌ ' + (data.message || 'Planung fehlgeschlagen'));
    } else {
      showToast(`✅ ${data.scheduled || 0} Artikel geplant`);
      loadArticles();
    }
  } catch (err) {
    console.error('Schedule error:', err);
    showToast('❌ Fehler bei der Planung');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = '📅 Automatisch planen (1-2-4)';
    }
  }
}

function showArticleDetail(articleId) {
  const article = allArticles.find(a => a.id === articleId);
  if (!article) {
    showToast('Artikel nicht gefunden');
    return;
  }

  const page = article.landing_page || {};
  const trade = page.trade || {};
  const city = page.city || {};

  const modalHTML = `
    <div class="fixed inset-0 z-[80] bg-ink-900/60 backdrop-blur flex items-center justify-center p-4" id="articleDetailModal">
      <div class="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-black text-ink-900">Artikel-Details</h3>
          <button onclick="document.getElementById('articleDetailModal').remove()" class="text-ink-400 hover:text-ink-600">✕</button>
        </div>
        <div class="space-y-4">
          <div>
            <p class="text-xs font-bold text-ink-400 uppercase">Titel</p>
            <p class="font-bold text-ink-900">${article.title || 'Ohne Titel'}</p>
          </div>
          <div>
            <p class="text-xs font-bold text-ink-400 uppercase">Slug</p>
            <p class="text-sm text-ink-600">${article.slug || '-'}</p>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs font-bold text-ink-400 uppercase">Gewerk</p>
              <p class="text-sm text-ink-900">${trade.name || '-'}</p>
            </div>
            <div>
              <p class="text-xs font-bold text-ink-400 uppercase">Stadt</p>
              <p class="text-sm text-ink-900">${city.name || '-'}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-xs font-bold text-ink-400 uppercase">Wörter</p>
              <p class="text-sm text-ink-900">${article.word_count || 0}</p>
            </div>
            <div>
              <p class="text-xs font-bold text-ink-400 uppercase">KI-generiert</p>
              <p class="text-sm text-ink-900">${article.ai_generated ? 'Ja ✅' : 'Nein'}</p>
            </div>
          </div>
          <div>
            <p class="text-xs font-bold text-ink-400 uppercase mb-2">Status ändern</p>
            <div class="flex gap-2">
              <button onclick="updateArticleStatus('${article.id}', 'draft')" class="text-xs font-bold px-3 py-2 rounded-lg border ${article.status === 'draft' ? 'bg-amber-100 text-amber-700 border-amber-300' : 'border-ink-200 text-ink-600'}">Entwurf</button>
              <button onclick="updateArticleStatus('${article.id}', 'published')" class="text-xs font-bold px-3 py-2 rounded-lg border ${article.status === 'published' ? 'bg-green-100 text-green-700 border-green-300' : 'border-ink-200 text-ink-600'}">Veröffentlichen</button>
              <button onclick="updateArticleStatus('${article.id}', 'archived')" class="text-xs font-bold px-3 py-2 rounded-lg border ${article.status === 'archived' ? 'bg-ink-100 text-ink-700 border-ink-300' : 'border-ink-200 text-ink-600'}">Archivieren</button>
            </div>
          </div>
          ${article.excerpt ? `
          <div>
            <p class="text-xs font-bold text-ink-400 uppercase">Auszug</p>
            <p class="text-sm text-ink-900 bg-ink-50 rounded-lg p-3">${article.excerpt}</p>
          </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  const existing = document.getElementById('articleDetailModal');
  if (existing) existing.remove();

  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function updateArticleStatus(articleId, status) {
  try {
    const res = await fetch(`${API_BASE}/articles/${articleId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status })
    });

    if (res.ok) {
      showToast('✅ Status aktualisiert');
      const article = allArticles.find(a => a.id === articleId);
      if (article) article.status = status;
      renderArticlesTable(allArticles);
      const modal = document.getElementById('articleDetailModal');
      if (modal) modal.remove();
    } else {
      showToast('❌ Status-Update fehlgeschlagen');
    }
  } catch (err) {
    console.error('Article update error:', err);
    showToast('❌ Fehler beim Aktualisieren');
  }
}

// ═══════════ MARKETING - ECHTE DATEN ═══════════
let marketingContacts = [];
let marketingCampaigns = [];
let selectedContactIds = new Set();

async function loadMarketingStats() {
  if (!adminToken) return;
  try {
    const res = await fetch(`${API_BASE}/admin/marketing/stats`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (data.success) {
      const s = data.stats;
      setText('kpiScraped', s.totalContacts);
      setText('kpiSent', s.totalSent);
      setText('kpiPrint', s.totalConversions);
      // Öffnungsrate anzeigen
      const orEl = document.querySelector('#view-marketing .grid > div:nth-child(3) p.text-3xl');
      if (orEl) orEl.textContent = s.openRate + ' %';
    }
  } catch (err) {
    console.error('Marketing stats error:', err);
  }
}

async function loadMarketingContacts() {
  if (!adminToken) return;
  try {
    const res = await fetch(`${API_BASE}/admin/marketing/contacts`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (data.success) {
      marketingContacts = data.contacts;
      renderProspectList(marketingContacts);
    }
  } catch (err) {
    console.error('Marketing contacts error:', err);
  }
}

function renderProspectList(contacts) {
  const tbody = document.getElementById('prospectList');
  if (!tbody) return;

  if (contacts.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-8 text-center text-ink-400">Noch keine Kontakte. Klicke "Scrape starten", um erste Betriebe zu erfassen.</td></tr>';
    return;
  }

  tbody.innerHTML = contacts.map(c => `
    <tr data-id="${c.id}">
      <td class="px-4 py-3"><input type="checkbox" class="prospect-check" onchange="toggleProspect('${c.id}')"></td>
      <td class="px-4 py-3 font-semibold text-ink-900">${c.company_name}</td>
      <td class="px-4 py-3 text-ink-600">${c.email || '-'}</td>
      <td class="px-4 py-3 text-ink-500">${c.source}</td>
      <td class="px-4 py-3"><span class="${getStatusBadge(c.status)}">${c.status}</span></td>
    </tr>
  `).join('');

  document.getElementById('scrapeResultMeta').innerHTML =
    `<strong>${contacts.length} Kontakte</strong> in der Datenbank`;
  document.getElementById('selCount').textContent = selectedContactIds.size;
}

function getStatusBadge(status) {
  const map = {
    'new': 'bg-ink-100 text-ink-600 text-xs font-bold px-2 py-1 rounded-full',
    'contacted': 'bg-amber-100 text-amber-700 text-xs font-bold px-2 py-1 rounded-full',
    'replied': 'bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full',
    'converted': 'bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full',
    'bounced': 'bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-full',
  };
  return map[status] || map['new'];
}

function toggleProspect(id) {
  if (selectedContactIds.has(id)) {
    selectedContactIds.delete(id);
  } else {
    selectedContactIds.add(id);
  }
  document.getElementById('selCount').textContent = selectedContactIds.size;
}

function toggleAllProspects() {
  const checkboxes = document.querySelectorAll('#prospectList .prospect-check');
  const allChecked = Array.from(checkboxes).every(cb => cb.checked);
  checkboxes.forEach((cb, i) => {
    cb.checked = !allChecked;
    const id = marketingContacts[i]?.id;
    if (id) {
      if (!allChecked) selectedContactIds.add(id);
      else selectedContactIds.delete(id);
    }
  });
  document.getElementById('selCount').textContent = selectedContactIds.size;
}

// Scrape → speichert Kontakte in DB
async function startScrape() {
  const gewerk = document.getElementById('scrapeGewerk').value;
  const stadt = document.getElementById('scrapeStadt').value;
  const btn = document.getElementById('scrapeBtn');
  const progress = document.getElementById('scrapeProgress');
  const bar = document.getElementById('scrapeBar');
  const pct = document.getElementById('scrapePct');
  const step = document.getElementById('scrapeStep');

  btn.disabled = true;
  progress.classList.remove('hidden');

  // Simulation: generiere 5-15 Demo-Kontakte und speichere sie
  const count = 5 + Math.floor(Math.random() * 11);
  const sources = ['Google Maps', 'Branchenverzeichnis', 'Innungsliste'];
  const newContacts = [];

  for (let i = 0; i < count; i++) {
    const pctVal = Math.round(((i + 1) / count) * 100);
    bar.style.width = pctVal + '%';
    pct.textContent = pctVal + ' %';
    step.textContent = `Betrieb ${i + 1} von ${count} ...`;
    await new Promise(r => setTimeout(r, 300));

    newContacts.push({
      company_name: `${stadt} ${gewerk.split(' ')[0]} ${String.fromCharCode(65 + i)}`,
      email: `info@${stadt.toLowerCase().replace(/[^a-z]/g,'')}-${gewerk.split(' ')[0].toLowerCase()}${i + 1}.de`,
      city: stadt,
      trade: gewerk.split(' ')[0],
      source: sources[Math.floor(Math.random() * sources.length)],
    });
  }

  // Speichere in DB
  for (const c of newContacts) {
    try {
      await fetch(`${API_BASE}/admin/marketing/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(c)
      });
    } catch (e) {
      console.error('Contact save error:', e);
    }
  }

  await loadMarketingContacts();
  await loadMarketingStats();

  btn.disabled = false;
  progress.classList.add('hidden');
  showToast(`✅ ${count} Kontakte für ${gewerk} ${stadt} erfasst`);
}

// KI-Mails → erstellt Kampagne in DB
async function generateMails(regenerate = false) {
  if (selectedContactIds.size === 0) {
    showToast('❌ Bitte mindestens einen Kontakt auswählen');
    return;
  }

  const mailSection = document.getElementById('mailSection');
  const drafts = document.getElementById('mailDrafts');
  const draftCount = document.querySelector('.draftCount');

  mailSection.classList.remove('hidden');
  drafts.innerHTML = '<p class="text-ink-400">⏳ Entwürfe werden generiert...</p>';

  await new Promise(r => setTimeout(r, 1500));

  const selected = marketingContacts.filter(c => selectedContactIds.has(c.id));
  const gewerk = document.getElementById('scrapeGewerk').value;
  const stadt = document.getElementById('scrapeStadt').value;

  drafts.innerHTML = selected.map((c, i) => `
    <div class="border border-ink-200 rounded-xl p-4">
      <div class="flex items-center justify-between mb-2">
        <span class="font-bold text-sm text-ink-900">${c.company_name}</span>
        <span class="text-xs text-ink-400">${c.email || 'Keine E-Mail'}</span>
      </div>
      <input type="text" value="Ihre ${gewerk.split(' ')[0]}-Website für ${stadt} - mieten statt bauen" class="w-full text-sm font-bold border border-ink-200 rounded-lg px-3 py-2 mb-2">
      <textarea rows="5" class="w-full text-sm border border-ink-200 rounded-lg px-3 py-2">Guten Tag ${c.company_name},

Ihre Konkurrenz in ${stadt} ist bereits online - mit einer professionellen Website, die Kunden anzieht.

Mieten Sie statt zu bauen: Eine fertige, suchmaschinenoptimierte ${gewerk.split(' ')[0]}-Website für ${stadt} - ab 189 €/Monat. Inklusive Leads, Dashboard und Support.

14 Tage kostenlos testen: https://fachschmiede.de

Freundliche Grüße
Das fachschmiede.de Team</textarea>
    </div>
  `).join('');

  if (draftCount) draftCount.textContent = selected.length;
}

async function sendCampaign(btn) {
  if (selectedContactIds.size === 0) {
    showToast('❌ Keine Kontakte ausgewählt');
    return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ Sende...';

  const gewerk = document.getElementById('scrapeGewerk').value;
  const stadt = document.getElementById('scrapeStadt').value;

  try {
    const res = await fetch(`${API_BASE}/admin/marketing/campaigns`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `${gewerk.split(' ')[0]} ${stadt}`,
        trade: gewerk.split(' ')[0],
        city: stadt,
        channel: 'email',
        contact_ids: Array.from(selectedContactIds)
      })
    });

    const data = await res.json();
    if (data.success) {
      showToast(`✅ Kampagne "${data.campaign.name}" angelegt - ${selectedContactIds.size} Kontakte`);
      await loadMarketingCampaigns();
      await loadMarketingStats();
      document.getElementById('mailSection').classList.add('hidden');
      selectedContactIds.clear();
      document.querySelectorAll('.prospect-check').forEach(cb => cb.checked = false);
      document.getElementById('selCount').textContent = '0';
    } else {
      showToast('❌ ' + (data.error || 'Fehler'));
    }
  } catch (err) {
    console.error('Campaign error:', err);
    showToast('❌ Fehler beim Anlegen der Kampagne');
  } finally {
    btn.disabled = false;
    btn.textContent = '📤 Alle senden (' + selectedContactIds.size + ')';
  }
}

async function loadMarketingCampaigns() {
  if (!adminToken) return;
  try {
    const res = await fetch(`${API_BASE}/admin/marketing/campaigns`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await res.json();
    if (data.success) {
      marketingCampaigns = data.campaigns;
      renderCampaignList(marketingCampaigns);
    }
  } catch (err) {
    console.error('Marketing campaigns error:', err);
  }
}

function renderCampaignList(campaigns) {
  const tbody = document.getElementById('campaignList');
  if (!tbody) return;

  if (campaigns.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" class="py-8 text-center text-ink-400">Noch keine Kampagnen gestartet.</td></tr>';
    return;
  }

  tbody.innerHTML = campaigns.map(c => {
    const openRate = c.contacts_sent > 0 ? Math.round((c.opens / c.contacts_sent) * 100) : 0;
    let resultBadge = '';
    if (c.conversions > 0) {
      resultBadge = `<span class="bg-green-100 text-green-700 text-xs font-bold px-2 py-1 rounded-full">${c.conversions} Conversion${c.conversions > 1 ? 's' : ''}</span>`;
    } else if (c.replies > 0) {
      resultBadge = `<span class="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">${c.replies} Antwort${c.replies > 1 ? 'en' : ''}</span>`;
    } else {
      resultBadge = `<span class="bg-ink-100 text-ink-500 text-xs font-bold px-2 py-1 rounded-full">Versendet</span>`;
    }

    return `<tr>
      <td class="py-3 font-bold text-ink-900">${c.name}</td>
      <td class="py-3 text-ink-500">${c.contacts_sent} · ${new Date(c.created_at).toLocaleDateString('de-DE')}</td>
      <td class="py-3 text-ink-600">${c.opens} (${openRate}%)</td>
      <td class="py-3 text-ink-600">${c.replies}</td>
      <td class="py-3">${resultBadge}</td>
    </tr>`;
  }).join('');
}

// ═══════════ INIT ═══════════
document.addEventListener('DOMContentLoaded', () => {
  // Überschreibe das originale doLogin und logout aus der HTML-Datei
  window.doLogin = doLogin;
  window.logout = showLoginGate;
  window.showLeadDetail = showLeadDetail;
  window.updateLeadStatus = updateLeadStatus;
  window.showArticleDetail = showArticleDetail;
  window.updateArticleStatus = updateArticleStatus;
  window.generateArticle = generateArticle;
  window.runArticleSchedule = runArticleSchedule;
  window.filterArticles = filterArticles;
  window.loadBillingData = loadBillingData;
  window.loadInvoiceData = loadInvoiceData;
  window.loadTrades = loadTrades;

  // Prüfe, ob Token existiert
  if (adminToken) {
    hideLoginGate();
    loadDashboard();
  } else {
    showLoginGate();
  }
});
// Trigger rebuild 1787308265
