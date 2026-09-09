/**
 * Fachschmiede Portal Navigator
 * Einheitliche Navigation & Verlinkung für ALLE Seiten
 */

(function() {
  'use strict';

  // ═══ KONFIGURATION (wird von /api/system/config geladen) ═══
  const PORTAL = {
    trades: [],
    cities: [],
    nav: {
      portal: { url: '/start.html', label: '💼 Portal', emoji: '💼' },
      admin: { url: '/admin.html', label: '⚙️ Admin', emoji: '⚙️' },
      mieter: { url: '/mieter.html', label: '👤 Mieter', emoji: '👤' }
    }
  };

  // ═══ SYSTEM CONFIG LADEN ═══
  async function loadConfig() {
    try {
      const res = await fetch('/api/system/config');
      const data = await res.json();
      if (data.success) {
        PORTAL.trades = data.trades || [];
        PORTAL.cities = data.cities || [];
        return true;
      }
    } catch(e) {
      console.warn('[Portal] Config load failed, using fallback:', e);
    }
    // Fallback
    PORTAL.trades = [
      { slug: 'dachdecker', name: 'Dachdecker', emoji: '🏠', color: 'orange' },
      { slug: 'elektriker', name: 'Elektriker', emoji: '⚡', color: 'yellow' },
      { slug: 'klempner', name: 'Klempner / SHK', emoji: '🔥', color: 'red' },
      { slug: 'zimmerer', name: 'Zimmerer', emoji: '🔨', color: 'amber' },
      { slug: 'maler', name: 'Maler', emoji: '🖌️', color: 'blue' },
      { slug: 'garten-und-landschaftsbau', name: 'Garten & Landschaftsbau', emoji: '🌳', color: 'green' }
    ];
    return false;
  }

  // ═══ NAVIGATION RENDERN ═══
  function renderPortalNav(containerId = 'portal-nav') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const tradeLinks = PORTAL.trades.map(t => 
      `<a href="/sales-${t.slug}.html" class="hover:text-white transition whitespace-nowrap">${t.emoji} ${t.name}</a>`
    ).join('');

    container.innerHTML = `
      <div class="bg-ink-900 text-ink-300 text-xs sm:text-sm py-2.5 px-4">
        <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
          <span class="font-bold text-white uppercase tracking-widest text-[10px] sm:text-xs">Portal:</span>
          <a href="/start.html" class="hover:text-white transition font-semibold">💼 Start</a>
          ${tradeLinks}
          <a href="/admin.html" class="hover:text-white transition">⚙️ Admin</a>
          <a href="/mieter.html" class="hover:text-white transition">👤 Mieter</a>
        </div>
      </div>
    `;
  }

  // ═══ GEWERK-NAVIGATION (für Salespages) ═══
  function renderTradeNav(containerId = 'trade-nav', currentTrade) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const links = PORTAL.trades.map(t => {
      const isActive = t.slug === currentTrade;
      return `<a href="/sales-${t.slug}.html" 
        class="${isActive ? 'text-white font-semibold' : 'hover:text-white'} transition whitespace-nowrap">
        ${t.emoji} ${t.name}${isActive ? ' ✓' : ''}
      </a>`;
    }).join('');

    container.innerHTML = `
      <div class="bg-ink-950 text-ink-300 text-xs py-2 px-4 border-b border-ink-800">
        <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span class="font-bold text-ink-500 uppercase text-[10px]">Gewerke:</span>
          ${links}
        </div>
      </div>
    `;
  }

  // ═══ STÄDTE-LISTE (für Salespages) ═══
  function renderCityList(containerId = 'city-list', tradeSlug) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const trade = PORTAL.trades.find(t => t.slug === tradeSlug);
    if (!trade) return;

    const cities = PORTAL.cities;
    if (!cities.length) {
      container.innerHTML = '<p class="text-ink-400">Städte werden geladen...</p>';
      return;
    }

    container.innerHTML = cities.map(city => `
      <a href="/${tradeSlug}/${city.slug}.html" 
        class="block bg-white rounded-xl border border-ink-200 p-4 hover:shadow-lg hover:-translate-y-0.5 transition group">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="font-bold text-ink-900">${trade.emoji} ${trade.name} ${city.name}</h3>
            <p class="text-sm text-ink-500 mt-1">Miet-Website verfügbar</p>
          </div>
          <span class="text-brand-600 font-bold text-sm group-hover:translate-x-1 transition">→</span>
        </div>
      </a>
    `).join('');
  }

  // ═══ FOOTER RENDERN ═══
  function renderPortalFooter(containerId = 'portal-footer') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const tradeLinks = PORTAL.trades.map(t => 
      `<a href="/sales-${t.slug}.html" class="hover:text-white transition">${t.name}</a>`
    ).join(' · ');

    container.innerHTML = `
      <footer class="bg-ink-900 text-ink-400 text-sm py-10 px-4">
        <div class="max-w-7xl mx-auto grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <h4 class="font-bold text-white mb-3">fachschmiede.de</h4>
            <p class="text-xs leading-relaxed">Professionelle Handwerker-Websites zur Miete. Sofort online, individuell anpassbar.</p>
          </div>
          <div>
            <h4 class="font-bold text-white mb-3">Gewerke</h4>
            <div class="text-xs space-y-1">
              ${tradeLinks}
            </div>
          </div>
          <div>
            <h4 class="font-bold text-white mb-3">Portal</h4>
            <div class="text-xs space-y-1">
              <a href="/start.html" class="hover:text-white transition block">Startseite</a>
              <a href="/admin.html" class="hover:text-white transition block">Admin-Bereich</a>
              <a href="/mieter.html" class="hover:text-white transition block">Mieter-Login</a>
            </div>
          </div>
          <div>
            <h4 class="font-bold text-white mb-3">Rechtliches</h4>
            <div class="text-xs space-y-1">
              <a href="/impressum.html" class="hover:text-white transition block">Impressum</a>
              <a href="/datenschutz.html" class="hover:text-white transition block">Datenschutz</a>
            </div>
          </div>
        </div>
        <div class="max-w-7xl mx-auto mt-8 pt-6 border-t border-ink-800 text-xs text-center">
          © 2026 fachschmiede.de – Alle Rechte vorbehalten
        </div>
      </footer>
    `;
  }

  // ═══ INIT ═══
  async function init() {
    await loadConfig();
    
    // Auto-render wenn Container existieren
    renderPortalNav();
    renderPortalFooter();
    
    // Data attribute für aktives Gewerk
    const bodyTrade = document.body.dataset.trade;
    if (bodyTrade) {
      renderTradeNav('trade-nav', bodyTrade);
      renderCityList('city-list', bodyTrade);
    }
  }

  // Starten wenn DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Global verfügbar machen
  window.PortalNav = {
    render: renderPortalNav,
    renderTradeNav,
    renderCityList,
    renderFooter: renderPortalFooter,
    config: PORTAL
  };
})();
