/* DASH Block Selector - Show/hide dashboard sections */

var DASH_BLOCKS = {
  readiness: { label: 'Readiness Pulse', icon: '🟠', default: true },
  today:    { label: 'Today', icon: '🔵', default: true },
  tomorrow: { label: 'Tomorrow', icon: '🟣', default: true },
  week:     { label: 'This Week', icon: '🟢', default: true },
  quality:  { label: 'Quality & Ops', icon: '🟡', default: true }
};

function loadBlockPrefs() {
  try {
    var saved = JSON.parse(localStorage.getItem('dash_blocks'));
    if (saved) return saved;
  } catch(e) {}
  var defaults = {};
  Object.keys(DASH_BLOCKS).forEach(function(k) { defaults[k] = DASH_BLOCKS[k].default; });
  return defaults;
}

function saveBlockPrefs(prefs) {
  localStorage.setItem('dash_blocks', JSON.stringify(prefs));
}

function applyBlockPrefs() {
  var prefs = loadBlockPrefs();
  Object.keys(DASH_BLOCKS).forEach(function(k) {
    var el = document.getElementById('dashBlock_' + k);
    if (el) el.style.display = prefs[k] ? '' : 'none';
  });
}

function TOGGLEBLOCKPICKER() {
  var menu = document.getElementById('blockPickerMenu');
  if (menu.style.display !== 'none') { menu.style.display = 'none'; return; }

  var prefs = loadBlockPrefs();
  var html = '<div style="padding:8px 14px;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:.5px">Dashboard Sections</div>';
  Object.keys(DASH_BLOCKS).forEach(function(k) {
    var b = DASH_BLOCKS[k];
    html += '<label style="display:flex;align-items:center;gap:8px;padding:6px 14px;cursor:pointer;font-size:13px;color:#d4d4d8;transition:background .15s" '
      + 'onmouseenter="this.style.background=\'rgba(255,255,255,.06)\'" onmouseleave="this.style.background=\'none\'">'
      + '<input type="checkbox" ' + (prefs[k] ? 'checked' : '') + ' onchange="toggleBlock(\'' + k + '\',this.checked)" style="accent-color:#3b82f6;width:14px;height:14px">'
      + b.icon + ' ' + b.label + '</label>';
  });
  menu.innerHTML = html;
  menu.style.display = 'block';

  setTimeout(function() {
    document.addEventListener('click', function closer(e) {
      if (!menu.contains(e.target) && !e.target.closest('#blockPickerBtn')) {
        menu.style.display = 'none';
        document.removeEventListener('click', closer);
      }
    });
  }, 10);
}

function toggleBlock(key, visible) {
  var prefs = loadBlockPrefs();
  prefs[key] = visible;
  saveBlockPrefs(prefs);
  applyBlockPrefs();
}

// Init on load
document.addEventListener('DOMContentLoaded', function() { applyBlockPrefs(); });
