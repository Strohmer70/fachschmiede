// ═══════════ ADMIN DASHBOARD — ECHTE DATEN ═══════════
const API_BASE = '/api';
let adminToken = localStorage.getItem('adminToken');
let dashboardData = null;

// ═══════════ LOGIN ═══════════
async function doLogin() {
  const email = document.querySelector('#loginGate input[type="email"]').value;
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
  gate.style.opacity = '0';
  setTimeout(() => {
    gate.style.display = 'none';
    document.body.style.overflow = '';
  }, 500);
}

function showLoginGate() {
  const gate = document.getElementById('loginGate');
  gate.style.display = 'flex';
  setTimeout(() => gate.style.opacity = '1', 10);
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
  
  // ── Stats-Karten (Übersicht) ──
  updateStatCard('Gesamt-Websites', stats.total, 'text-ink-900');
  updateStatCard('Vermietet', stats.rented, 'text-green-600');
  updateStatCard('Noch frei', stats.available, 'text-brand-600');
  updateStatCard('MRR (€/Monat)', stats.mrr + ' €', 'text-ink-900');
  updateStatCard('ARR (€/Jahr)', stats.arr + ' €', 'text-ink-900');
  updateStatCard('Leads (30 T.)', stats.leads, 'text-orange-600');
  
  // ── Mieter-Tabelle ──
  renderMieterTable(tenants || []);
  
  // ── Leads-Liste ──
  renderLeadsList(recentLeads || []);
  
  // ── Seiten-Übersicht ──
  renderPagesOverview(pages || []);
}

function updateStatCard(label, value, colorClass) {
  // Suche nach Stat-Karten anhand des Labels
  const cards = document.querySelectorAll('#view-uebersicht .grid > div');
  cards.forEach(card => {
    const labelEl = card.querySelector('p:first-child');
    if (labelEl && labelEl.textContent.includes(label)) {
      const valueEl = card.querySelector('p:nth-child(2)');
      if (valueEl) {
        valueEl.textContent = value;
        valueEl.className = `mt-2 text-3xl font-black ${colorClass}`;
      }
    }
  });
}

// ═══════════ MIETER TABELLE ═══════════
function renderMieterTable(tenants) {
  const tbody = document.getElementById('mieterTbody');
  const emptyMsg = document.getElementById('mieterEmpty');
  
  if (!tbody) return;
  
  if (tenants.length === 0) {
    tbody.innerHTML = '';
    emptyMsg.classList.remove('hidden');
    return;
  }
  
  emptyMsg.classList.add('hidden');
  
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
  const leadsContainer = document.querySelector('#view-uebersicht ul');
  if (!leadsContainer) return;
  
  if (leads.length === 0) {
    leadsContainer.innerHTML = `
      <li class="py-3 text-center text-sm text-ink-400 italic">
        Keine Leads in den letzten 30 Tagen
      </li>
    `;
    return;
  }
  
  leadsContainer.innerHTML = leads.map(lead => {
    const page = lead.landing_page || {};
    const timeAgo = timeSince(new Date(lead.created_at));
    return `
      <li class="py-3 flex items-center justify-between gap-3 border-b border-ink-100 last:border-0">
        <div>
          <p class="font-bold text-ink-900">${lead.name || 'Anonym'} · ${lead.service || 'Anfrage'}</p>
          <p class="text-ink-500 text-xs">${page.title || page.slug || '-'} · ${timeAgo}</p>
        </div>
        <span class="bg-ink-100 text-ink-500 text-xs font-bold px-2.5 py-1 rounded-full shrink-0">
          ${lead.status || 'Neu'}
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
  // Prüfe, ob showToast bereits existiert (aus der HTML-Datei)
  if (typeof window.originalShowToast === 'function') {
    window.originalShowToast(msg);
    return;
  }
  
  // Eigene Toast-Implementierung
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

// ═══════════ INIT ═══════════
document.addEventListener('DOMContentLoaded', () => {
  // Überschreibe das originale doLogin und logout aus der HTML-Datei
  window.doLogin = doLogin;
  window.logout = showLoginGate;
  
  // Prüfe, ob Token existiert
  if (adminToken) {
    hideLoginGate();
    loadDashboard();
  } else {
    showLoginGate();
  }
});
