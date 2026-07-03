/* DASH Columns: resize + show/hide + localStorage persistence */

var COL_CONFIG = {
  // col key → { label, default width, hideable, default visible }
  ck:       { label: 'Select',         width: 32,  hideable: false, visible: true },
  date:     { label: 'Date',           width: 90,  hideable: true,  visible: false },
  time:     { label: 'Time',           width: 65,  hideable: true,  visible: true },
  customer: { label: 'Customer',       width: 200, hideable: false, visible: true },
  rn:       { label: 'RN',             width: 120, hideable: false, visible: true },
  host:     { label: 'Host',           width: 90,  hideable: true,  visible: true },
  vehicle:  { label: 'Vehicle',        width: 80,  hideable: true,  visible: true },
  reg:      { label: 'Registration',   width: 95,  hideable: true,  visible: true },
  pay:      { label: 'Payment',        width: 80,  hideable: true,  visible: true },
  ti:       { label: 'Trade-In',       width: 85,  hideable: true,  visible: true },
  vs:       { label: 'Vehicle Status', width: 125, hideable: true,  visible: true },
  hold:     { label: 'Hold',           width: 60,  hideable: true,  visible: true },
  ins:      { label: 'Insurance',      width: 80,  hideable: true,  visible: true },
  print:    { label: 'Print',          width: 45,  hideable: false, visible: true }
};

var COL_KEYS = Object.keys(COL_CONFIG);

// ======================================
// LOAD / SAVE from localStorage
// ======================================
function colLoadPrefs() {
  try {
    var saved = JSON.parse(localStorage.getItem('dash_col_prefs'));
    if (saved) {
      COL_KEYS.forEach(function(k) {
        if (saved[k]) {
          if (typeof saved[k].visible === 'boolean' && COL_CONFIG[k].hideable) COL_CONFIG[k].visible = saved[k].visible;
          if (typeof saved[k].width === 'number' && saved[k].width > 20) COL_CONFIG[k].width = saved[k].width;
        }
      });
    }
  } catch(e) {}
}

function colSavePrefs() {
  var prefs = {};
  COL_KEYS.forEach(function(k) {
    prefs[k] = { visible: COL_CONFIG[k].visible, width: COL_CONFIG[k].width };
  });
  localStorage.setItem('dash_col_prefs', JSON.stringify(prefs));
}

// ======================================
// APPLY: show/hide columns + set widths
// ======================================
function colApply() {
  var isWeekMode = typeof WKMODE !== 'undefined' && WKMODE;
  COL_KEYS.forEach(function(k) {
    // In week mode: force show date, force hide time
    var vis;
    if (k === 'date') vis = isWeekMode ? true : COL_CONFIG[k].visible;
    else if (k === 'time') vis = isWeekMode ? false : COL_CONFIG[k].visible;
    else vis = COL_CONFIG[k].visible;
    var w = COL_CONFIG[k].width;
    // Header
    var th = document.querySelector('th[data-col="' + k + '"]');
    if (th) {
      th.style.display = vis ? 'table-cell' : 'none';
      if (vis) th.style.width = w + 'px';
    }
    // Body cells
    document.querySelectorAll('td[data-col="' + k + '"]').forEach(function(td) {
      td.style.display = vis ? 'table-cell' : 'none';
    });
  });
}

// ======================================
// COLUMN PICKER MENU
// ======================================
function COLPICKER() {
  var menu = document.getElementById('colPickerMenu');
  if (menu.style.display !== 'none') { menu.style.display = 'none'; return; }

  var html = '<div style="padding:6px 14px;font-size:11px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:.5px">Columns</div>';
  COL_KEYS.forEach(function(k) {
    var c = COL_CONFIG[k];
    if (!c.hideable) return;
    html += '<label style="display:flex;align-items:center;gap:8px;padding:5px 14px;cursor:pointer;font-size:13px;color:#d4d4d8;transition:background .15s" '
      + 'onmouseenter="this.style.background=\'rgba(255,255,255,.06)\'" onmouseleave="this.style.background=\'none\'">'
      + '<input type="checkbox" ' + (c.visible ? 'checked' : '') + ' onchange="colToggle(\'' + k + '\',this.checked)" '
      + 'style="accent-color:#3b82f6;width:14px;height:14px">'
      + c.label + '</label>';
  });
  html += '<div style="border-top:1px solid rgba(255,255,255,.08);margin:6px 0"></div>';
  html += '<div style="padding:4px 14px"><button onclick="colResetAll()" style="width:100%;padding:5px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:5px;color:#a1a1aa;font-size:12px;cursor:pointer;font-family:inherit">Reset to default</button></div>';
  menu.innerHTML = html;

  // Position fixed relative to the icon
  var btn = document.getElementById('colPickerBtn');
  var rect = btn.getBoundingClientRect();
  menu.style.top = (rect.bottom + 4) + 'px';
  menu.style.right = (window.innerWidth - rect.right) + 'px';
  menu.style.left = 'auto';
  menu.style.display = 'block';

  // Close on outside click
  setTimeout(function() {
    document.addEventListener('click', function closer(e) {
      if (!menu.contains(e.target) && !e.target.closest('#colPickerBtn')) {
        menu.style.display = 'none';
        document.removeEventListener('click', closer);
      }
    });
  }, 10);
}

function colToggle(key, visible) {
  COL_CONFIG[key].visible = visible;
  colApply();
  colSavePrefs();
}

function colResetAll() {
  var defaults = {
    ck: { w: 32, v: true }, date: { w: 90, v: false }, time: { w: 65, v: true },
    customer: { w: 200, v: true }, rn: { w: 120, v: true }, host: { w: 90, v: true },
    vehicle: { w: 80, v: true },
    reg: { w: 95, v: true }, pay: { w: 80, v: true }, ti: { w: 85, v: true },
    vs: { w: 125, v: true }, hold: { w: 60, v: true }, ins: { w: 80, v: true },
    print: { w: 45, v: true }
  };
  COL_KEYS.forEach(function(k) {
    if (defaults[k]) { COL_CONFIG[k].width = defaults[k].w; COL_CONFIG[k].visible = defaults[k].v; }
  });
  localStorage.removeItem('dash_col_prefs');
  colApply();
  COLPICKER(); // refresh menu checkboxes
}

// ======================================
// COLUMN RESIZE (drag handles)
// ======================================
function colInitResize() {
  var ths = document.querySelectorAll('#tbl thead th[data-col]');
  ths.forEach(function(th) {
    if (th.dataset.col === 'ck') return;
    if (th.querySelector('.col-resize-handle')) return; // already added
    var handle = document.createElement('div');
    handle.className = 'col-resize-handle';
    handle.addEventListener('mousedown', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var startX = e.clientX;
      var startW = th.offsetWidth;
      var col = th.dataset.col;

      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      function onMove(ev) {
        var newW = Math.max(30, startW + ev.clientX - startX);
        th.style.width = newW + 'px';
        COL_CONFIG[col].width = newW;
      }
      function onUp() {
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        colSavePrefs();
        document.removeEventListener('mousemove', onMove);
        document.removeEventListener('mouseup', onUp);
      }
      document.addEventListener('mousemove', onMove);
      document.addEventListener('mouseup', onUp);
    });
    th.style.position = 'relative';
    th.appendChild(handle);
  });
}

// Init on load
colLoadPrefs();
