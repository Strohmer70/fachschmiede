// ═══════════ ADMIN DASHBOARD — ECHTE DATEN ═══════════
const API_BASE = '/api';
let adminToken = localStorage.getItem('adminToken');
let dashboardData = null;

// ═══════════ LOGIN ═══════════
async function doLogin() {
  const password = document.querySelector('#loginGate input[type="password"]').value;
  
  if (!password) {
    showToast('Bitte Passwort eingeben');
    return;
  }
  
  try {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    
    const data = await res.json();
    
    if (data.success) {
      adminToken = data.token;
      localStorage.setItem('adminToken', adminToken);
      hideLoginGate();
      await loadDashboard();
      showToast('✅ Admin-Login erfolgreich');
    } else {
      showToast('❌ Falsches Passwort');
    }
  } catch (err) {
    console.error('Login error:', err);
    showToast('❌ Login fehlgeschlagen');
  }
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

// ═══════════ DASHBOARD LADEN ═══════════
async function loadDashboard() {
  if (!adminToken) {
    showLoginGate();
    return;
  }
  
  try {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    
    if (res.status === 401) {
      showToast('⚠️ Session abgelaufen — bitte neu einloggen');
      showLoginGate();
      return;
    }
    
    dashboardData = await res.json();
    renderDashboard(dashboardData);
    
  } catch (err) {
    console.error('Dashboard load error:', err);
    showToast('❌ Fehler beim Laden der Daten');
  }
}

// ═══════════ DASHBOARD RENDERN ═══════════
function renderDashboard(data) {
  const { stats, recentLeads, pages, tenants } = data;
  
  // ── KPI-Karten (per ID) ──
  setText('stat-rented', stats.rented || 0);
  setText('stat-rented-trend', stats.rented > 0 ? 'Aktive Mieter' : 'Noch keine Mieter', 'text-ink-400');
  
  setText('stat-mrr', (stats.mrr || 0) + ' €');
  setText('stat-mrr-trend', stats.mrr > 0 ? 'MRR' : 'Noch keine Einnahmen', 'text-ink-400');
  
  setText('stat-leads', stats.leads || 0);
  
  setText('stat-total', stats.total || 0);
  setText('stat-available', (stats.available || 0) + ' noch frei', 'text-brand-600');
  
  // ── Mieter-Tabelle ──
  renderMieterTable(tenants || []);
  
  // ── Leads-Liste ──
  renderLeadsList(recentLeads || []);
  
  // ── Seiten-Übersicht ──
  renderPagesOverview(pages || []);
  
  // ── Todo-Liste (wenn keine echten Daten, leer anzeigen) ──
  renderTodoList(tenants || [], pages || []);
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
        <td colspan="6" class="px-6 py-8 text-center">
          <p class="font-bold text-ink-600 text-lg">Noch keine Mieter</p>
          <p class="text-sm text-ink-400 mt-1">Mieter erscheinen hier, sobald sie sich über die Salespage anmelden.</p>
        </td>
      </tr>
    `;
    if (emptyMsg) emptyMsg.classList.add('hidden');
    return;
  }
  
  if (emptyMsg) emptyMsg.classList.add('hidden');
  
  tbody.innerHTML = tenants.map(t => {
    const page = t.landing_page || {};
    return `
      <tr class="hover:bg-ink-50 transition">
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
        <td class="px-6 py-4">
          <span class="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full">Aktiv</span>
        </td>
        <td class="px-6 py-4 text-sm text-ink-600">${page.title || page.slug || '-'}</td>
        <td class="px-6 py-4 text-sm text-ink-600">${formatDate(t.created_at)}</td>
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
      <tr class="hover:bg-ink-50 transition">
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
      text: `<strong>Marketing:</strong> ${freePages.length} Website${freePages.length > 1 ? 's' : ''} noch frei — Salespage bewerben`
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
      text: '<strong>Vertrieb:</strong> Noch keine Mieter — Social Media / Google Ads starten'
    });
  }
  
  if (todos.length === 0) {
    container.innerHTML = `
      <li class="text-ink-400 italic">Keine offenen Aufgaben – alles läuft!</li>
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
  showToast(`Mieter-Details für ID: ${id} — Funktion folgt`);
}

function showPageDetail(id) {
  showToast(`Seiten-Details für ID: ${id} — Funktion folgt`);
}

// ═══════════ LEADS FUNKTIONEN ═══════════
let allLeads = [];
let currentLeadFilter = { status: '', site: '' };

async function loadLeads() {
  if (!adminToken) return;
  
  try {
    const res = await fetch(`${API_BASE}/admin/leads?limit=100`, {
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
    const res = await fetch(`${API_BASE}/admin/leads`, {
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

// ═══════════ INIT ═══════════
document.addEventListener('DOMContentLoaded', () => {
  // Überschreibe das originale doLogin und logout aus der HTML-Datei
  window.doLogin = doLogin;
  window.logout = showLoginGate;
  window.showLeadDetail = showLeadDetail;
  window.updateLeadStatus = updateLeadStatus;
  
  // Prüfe, ob Token existiert
  if (adminToken) {
    hideLoginGate();
    loadDashboard();
  } else {
    showLoginGate();
  }
});
