// Theme toggle — Dark (default) / Light
var THEME_KEY = 'tesla-hub-theme';

function initTheme() {
  var saved = localStorage.getItem(THEME_KEY) || 'dark';
  if (saved === 'light') applyLight();
  renderToggle(saved);
}

function toggleTheme() {
  var current = localStorage.getItem(THEME_KEY) || 'dark';
  var next = current === 'dark' ? 'light' : 'dark';
  localStorage.setItem(THEME_KEY, next);
  if (next === 'light') applyLight();
  else removeLight();
  renderToggle(next);
}

function renderToggle(theme) {
  var btn = document.getElementById('themeToggle');
  if (!btn) {
    btn = document.createElement('div');
    btn.id = 'themeToggle';
    btn.onclick = toggleTheme;
    btn.style.cssText = 'width:52px;height:28px;border-radius:14px;cursor:pointer;position:relative;transition:background .2s;display:flex;align-items:center;flex-shrink:0';
    var knob = document.createElement('div');
    knob.id = 'themeKnob';
    knob.style.cssText = 'width:22px;height:22px;border-radius:50%;position:absolute;top:3px;transition:left .2s,background .2s;box-shadow:0 1px 3px rgba(0,0,0,.3);display:flex;align-items:center;justify-content:center';
    btn.appendChild(knob);
    // Try themeAnchor first (title-row), fallback to docgenBtn
    var anchor = document.getElementById('themeAnchor');
    if (anchor) {
      anchor.appendChild(btn);
    } else {
      var docgenBtn = document.getElementById('docgenBtn');
      if (docgenBtn) {
        docgenBtn.parentNode.appendChild(btn);
      }
    }
  }
  var knob = document.getElementById('themeKnob');
  var sunSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  var moonSVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  if (theme === 'dark') {
    btn.style.background = 'rgba(59,130,246,.3)';
    btn.title = 'Switch to Light';
    knob.style.left = '27px';
    knob.style.background = '#1e293b';
    knob.innerHTML = moonSVG;
  } else {
    btn.style.background = 'rgba(245,158,11,.2)';
    btn.title = 'Switch to Dark';
    knob.style.left = '3px';
    knob.style.background = '#fff';
    knob.innerHTML = sunSVG;
  }
}

// Dark overrides for server-rendered tabs (they come with light inline styles)
function applyDarkTabs() {
  var id = 'darkTabsCSS';
  if (document.getElementById(id)) return;
  var s = document.createElement('style');
  s.id = id;
  s.textContent = ''
    + '#csatView [style*="background:#fff"],#arrView [style*="background:#fff"]'
    + '{background:rgba(255,255,255,.04)!important;box-shadow:0 2px 8px rgba(0,0,0,.3)!important;border:1px solid rgba(255,255,255,.06)!important}'
    + '#csatView [style*="color:#171a20"],#arrView [style*="color:#171a20"]'
    + '{color:#e4e4e7!important}'
    + '#csatView [style*="color:#5c5e62"],#arrView [style*="color:#5c5e62"]'
    + '{color:#71717a!important}'
    + '#csatView [style*="color:#999"],#arrView [style*="color:#999"]'
    + '{color:#52525b!important}'
    + '#csatView [style*="border-bottom:2px solid #e9ecef"],#arrView [style*="border-bottom:2px solid #e9ecef"]'
    + '{border-bottom-color:rgba(255,255,255,.08)!important}'
    + '#csatView [style*="border-bottom:1px solid #f0f0f0"],#arrView [style*="border-bottom:1px solid #f0f0f0"]'
    + '{border-bottom-color:rgba(255,255,255,.04)!important}'
    + '#csatView tr[style*="background:#fafafa"],#arrView tr[style*="background:#fafafa"]'
    + '{background:rgba(255,255,255,.02)!important}'
    + '#csatView tr[style*="background:#fff"],#arrView tr[style*="background:#fff"]'
    + '{background:transparent!important}'
    + '#csatView [style*="background:#e9ecef"],#arrView [style*="background:#e9ecef"]'
    + '{background:rgba(255,255,255,.08)!important}'
    + '#csatView [style*="color:#3e6ae1"],#arrView [style*="color:#3e6ae1"]'
    + '{color:#60a5fa!important}'
    + '#arrView [style*="background:#3e6ae1"]'
    + '{background:#60a5fa!important}'
    + '#csatView [style*="color:#28a745"],#arrView [style*="color:#28a745"]'
    + '{color:#22c55e!important}'
    + '#csatView [style*="background:#28a745"],#arrView [style*="background:#28a745"]'
    + '{background:#22c55e!important}'
    + '#csatView [style*="background:#ccc"]'
    + '{background:#52525b!important}'
    + '#stockView [style*="color:#171a20"],#tiView [style*="color:#171a20"]'
    + '{color:#e4e4e7!important}'
    + '#tiView [style*="background:#fff"]'
    + '{background:rgba(255,255,255,.04)!important;box-shadow:0 2px 8px rgba(0,0,0,.3)!important;border:1px solid rgba(255,255,255,.06)!important}'
    + '#tiView [style*="border-bottom:2px solid #eee"]'
    + '{border-bottom-color:rgba(255,255,255,.08)!important}'
    + '#tiView [style*="color:#888"]'
    + '{color:#71717a!important}'
    + '#tiView [style*="color:#ccc"]'
    + '{color:#52525b!important}'
    + '#tiView [style*="color:#666"]'
    + '{color:#71717a!important}'
    + '#tiView [style*="background:#e0e0e0"]'
    + '{background:rgba(255,255,255,.06)!important;border:1px solid rgba(255,255,255,.08)!important}'
    + '#tiView [style*="background:#3e6ae1"]'
    + '{background:rgba(59,130,246,.2)!important;border:1px solid rgba(59,130,246,.3)!important}'
  ;
  document.head.appendChild(s);
}

function removeDarkTabs() {
  var s = document.getElementById('darkTabsCSS');
  if (s) s.remove();
}

function applyLight() {
  removeDarkTabs();
  var id = 'lightThemeCSS';
  if (document.getElementById(id)) return;
  var s = document.createElement('style');
  s.id = id;
  s.textContent = ''
    + 'body{background:#f5f5f7!important;color:#171a20!important}'
    + '.ttl{color:#171a20!important}'
    + '.tabs{background:rgba(0,0,0,.05)!important;border-color:rgba(0,0,0,.08)!important}'
    + '.tab{color:#71717a!important}'
    + '.tab:hover{color:#171a20!important;background:rgba(0,0,0,.03)!important}'
    + '.tab.on{color:#171a20!important;background:#fff!important;box-shadow:0 1px 4px rgba(0,0,0,.1)!important;border-color:transparent!important}'
    + '.sb{background:#fff!important;border-color:rgba(0,0,0,.08)!important;box-shadow:0 2px 8px rgba(0,0,0,.06)!important}'
    + '.si:not(:last-child)::after{background:rgba(0,0,0,.08)!important}'
    + '.si:hover{background:#f8f8fa!important}'
    + '.si.on{background:#eef2ff!important}'
    + '.sn{color:#3b82f6!important}'
    + '.sn.g{color:#16a34a!important}.sn.r{color:#dc2626!important}.sn.b{color:#3b82f6!important}'
    + '.sl{color:#6b7280!important}'
    + '.sf .top{color:#171a20!important}'
    + '.sf .div{color:#d1d5db!important;border-top-color:rgba(0,0,0,.08)!important}'
    + '.fl{color:#6b7280!important}'
    + '.fi2{border-color:rgba(0,0,0,.12)!important;color:#333!important;background:#fff!important}'
    + '.bt{border-color:rgba(0,0,0,.12)!important;background:#fff!important;color:#393c41!important}'
    + '.bt:hover{background:#f5f5f5!important}'
    + '.bt-q{background:#fff!important;color:#393c41!important;border-color:rgba(0,0,0,.12)!important}'
    + '.bt-q:hover{background:#f5f5f5!important;color:#171a20!important}'
    + '.bt-q.on{background:#3b82f6!important;color:#fff!important;border-color:#3b82f6!important}'
    + '.bt-nav{background:#fff!important;color:#393c41!important;border-color:rgba(0,0,0,.12)!important}'
    + '.bt-nav:hover{background:#f5f5f5!important}'
    + '.tcard{background:#fff!important;border-color:rgba(0,0,0,.08)!important;border-radius:12px!important}'
    + 'th{color:#6b7280!important;background:#fafafa!important;border-bottom-color:rgba(0,0,0,.08)!important}'
    + 'th:hover{color:#171a20!important}'
    + 'td{color:#393c41!important;border-bottom-color:rgba(0,0,0,.05)!important}'
    + 'tr:hover td{background:#f8f8fa!important}'
    + 'tr.w td{background:#fef2f2!important}'
    + 'tr.w:hover td{background:#fee2e2!important}'
    + 'tr:nth-child(even) td{background:#fafafa!important}'
    + '.fi{border-color:rgba(0,0,0,.12)!important;color:#333!important;background:#fff!important}'
    + '.fi option{background:#fff!important;color:#333!important}'
    + '.ck{border-color:#d1d5db!important;background:#fff!important}'
    + '.ck:checked{background:#3b82f6!important;border-color:#3b82f6!important}'
    + '.nm{color:#171a20!important}'
    + '.su{color:#9ca3af!important}'
    + '.rl{color:#3b82f6!important}'
    + '.rl:hover{color:#2563eb!important}'
    + '.ft{color:#9ca3af!important}'
    + '.dtc{color:#3b82f6!important}'
    + '.spinner{border-color:rgba(0,0,0,.08)!important;border-top-color:#3b82f6!important}'
    + '#docgenBtn{border-color:rgba(0,0,0,.12)!important;background:#fff!important;color:#6b7280!important}'
    + '#upd{color:#9ca3af!important}'
    + '#themeToggle{border-color:rgba(0,0,0,.15)!important}'
    + '.bt-green{background:rgba(34,197,94,.1)!important;color:#16a34a!important;border-color:rgba(34,197,94,.3)!important}'
    + '.bt-blue{background:rgba(59,130,246,.1)!important;color:#2563eb!important;border-color:rgba(59,130,246,.3)!important}'
    + '.bt-red{background:rgba(239,68,68,.1)!important;color:#dc2626!important;border-color:rgba(239,68,68,.3)!important}'
    + '::-webkit-scrollbar-thumb{background:rgba(0,0,0,.15)!important}'
    + '::-webkit-scrollbar-thumb:hover{background:rgba(0,0,0,.25)!important}'
    + '.sidebar{background:#f8f8fa!important;border-right-color:rgba(0,0,0,.08)!important}'
    + '.sidebar-logo span{color:#171a20!important}'
    + '.sidebar-logo{border-bottom-color:rgba(0,0,0,.08)!important}'
    + '.sidebar-footer{color:#9ca3af!important}'
    + '.nav-section{color:#9ca3af!important}'
    + '.nav-item{color:#6b7280!important}'
    + '.nav-item:hover{color:#171a20!important;background:rgba(0,0,0,.04)!important}'
    + '.nav-item{border:none!important;outline:none!important}'
    + '.nav-item.on{color:#171a20!important;background:rgba(0,0,0,.05)!important;font-weight:600!important}'
    + '.sidebar-hbg{color:#9ca3af!important}'
    + '.sidebar-hbg:hover{color:#171a20!important}'
  ;
  document.head.appendChild(s);
}

function removeLight() {
  var s = document.getElementById('lightThemeCSS');
  if (s) s.remove();
  applyDarkTabs();
}

// Auto-init
applyDarkTabs();
initTheme();
