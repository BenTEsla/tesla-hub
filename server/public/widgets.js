/* DASH Widget Board - Drag & Drop Dashboard */

var WIDGETS = {
  deliveriesToday:  { label: 'Deliveries Today', size: 'wide', group: 'today' },
  onSite:           { label: 'On Site', size: 'small', group: 'today' },
  inTransit:        { label: 'In Transit', size: 'small', group: 'today' },
  inWash:           { label: 'In Wash', size: 'small', group: 'today' },
  finishedGoods:    { label: 'Finished Goods', size: 'small', group: 'today' },
  deliveriesTomorrow: { label: 'Deliveries Tomorrow', size: 'wide', group: 'tomorrow' },
  tmrwOnSite:       { label: 'On Site (Tmrw)', size: 'small', group: 'tomorrow' },
  tmrwInTransit:    { label: 'In Transit (Tmrw)', size: 'small', group: 'tomorrow' },
  tmrwInWash:       { label: 'In Wash (Tmrw)', size: 'small', group: 'tomorrow' },
  tmrwFG:           { label: 'Finished Goods (Tmrw)', size: 'small', group: 'tomorrow' },
  weeklyTarget:     { label: 'Weekly Target', size: 'small', group: 'week' },
  notReady:         { label: 'Not Ready', size: 'small', group: 'week' },
  arrivals:         { label: 'Arrivals This Week', size: 'large', group: 'week' },
  stock:            { label: 'Stock', size: 'small', group: 'ops' },
  tradeIn:          { label: 'Trade-In', size: 'small', group: 'ops' },
  csat:             { label: 'CSAT', size: 'small', group: 'ops' },
  svs:              { label: 'SVs', size: 'small', group: 'ops' },
  holds:            { label: 'Holds', size: 'small', group: 'ops' },
  dueBills:         { label: 'Due Bills', size: 'small', group: 'ops' }
};

var DEFAULT_LAYOUT = [
  'deliveriesToday', 'onSite', 'inTransit', 'inWash', 'finishedGoods',
  'deliveriesTomorrow', 'tmrwOnSite', 'tmrwInTransit', 'tmrwInWash', 'tmrwFG',
  'weeklyTarget', 'notReady', 'arrivals',
  'stock', 'tradeIn', 'csat', 'svs', 'holds', 'dueBills'
];

// Load saved layout
function loadDashLayout() {
  try {
    var saved = JSON.parse(localStorage.getItem('dash_widget_layout'));
    if (saved && saved.length) return saved;
  } catch(e) {}
  return DEFAULT_LAYOUT.slice();
}

function saveDashLayout(layout) {
  localStorage.setItem('dash_widget_layout', JSON.stringify(layout));
}

// Widget ID → HTML element ID mapping
var WIDGET_ELEMENTS = {
  deliveriesToday: 'dashDeliveries',
  onSite: 'dashOnSite',
  inTransit: 'dashInTransit',
  inWash: 'dashInWash',
  finishedGoods: 'dashReady',
  deliveriesTomorrow: 'dashTmrwDeliveries',
  tmrwOnSite: 'dashTmrwOnSite',
  tmrwInTransit: 'dashTmrwInTransit',
  tmrwInWash: 'dashTmrwInWash',
  tmrwFG: 'dashTmrwFG',
  weeklyTarget: 'dashWeeklyTarget',
  notReady: 'dashNotReady',
  arrivals: 'dashArrChart',
  stock: 'dashStock',
  tradeIn: 'dashTradeIn',
  csat: 'dashCsat',
  svs: 'dashSV',
  holds: 'dashCH',
  dueBills: 'dashDueBills'
};

// Drag & drop state
var _dragWidget = null;

function initWidgetBoard() {
  var board = document.getElementById('widgetBoard');
  if (!board) return;
  
  var layout = loadDashLayout();
  renderWidgetBoard(board, layout);
}

function renderWidgetBoard(board, layout) {
  var isDark = !document.getElementById('lightThemeCSS');
  var html = '';
  var colors = {
    deliveriesToday: '', onSite: 'dash-green', inTransit: 'dash-yellow', inWash: 'dash-blue', finishedGoods: 'dash-green',
    deliveriesTomorrow: '', tmrwOnSite: 'dash-green', tmrwInTransit: 'dash-yellow', tmrwInWash: 'dash-blue', tmrwFG: 'dash-green',
    weeklyTarget: '', notReady: 'dash-red', stock: 'dash-blue', tradeIn: 'dash-purple', csat: '',
    svs: 'dash-yellow', holds: 'dash-red', dueBills: 'dash-red'
  };
  var subs = { deliveriesToday: 'dashDeliveriesSub', notReady: 'dashNotReadySub', stock: 'dashStockSub',
    tradeIn: 'dashTradeInSub', csat: 'dashCsatSub', svs: 'dashSVSub', holds: 'dashCHSub', dueBills: 'dashDueBillsSub',
    deliveriesTomorrow: 'dashTmrwSub' };
  var clicks = {
    deliveriesToday: "NAV(1,document.querySelector('[data-tooltip=\"Customer Delivery\"]'))",
    deliveriesTomorrow: "NAV(6,document.querySelector('[data-tooltip=\"Dispatch\"]'))",
    stock: "NAV(3,document.querySelector('[data-tooltip=\"Stock\"]'))",
    tradeIn: "NAV(4,document.querySelector('[data-tooltip=\"Trade-In\"]'))",
    csat: "NAV(5,document.querySelector('[data-tooltip=\"CSAT\"]'))",
    svs: "NAV(10,document.querySelector('[data-tooltip=\"SV & Holds\"]'))",
    holds: "NAV(10,document.querySelector('[data-tooltip=\"SV & Holds\"]'))",
    dueBills: "NAV(11,document.querySelector('[data-tooltip=\"Due Bills\"]'))",
    arrivals: "NAV(2,document.querySelector('[data-tooltip=\"Arrivals\"]'))"
  };

  layout.forEach(function(wid) {
    var w = WIDGETS[wid];
    if (!w) return;
    var span = w.size === 'wide' ? 'grid-column:span 2' : w.size === 'large' ? 'grid-column:span 3' : '';
    var elId = WIDGET_ELEMENTS[wid] || '';
    var col = colors[wid] || '';
    var click = clicks[wid] ? ' onclick="' + clicks[wid] + '" style="cursor:pointer;' + span + '"' : ' style="' + span + '"';
    var subId = subs[wid] || '';

    if (wid === 'arrivals') {
      html += '<div class="dash-widget" draggable="true" data-wid="' + wid + '"' + click + '>';
      html += '<div class="dash-widget-header"><span class="dash-widget-grip">⋮⋮</span> <span style="font-size:10px;color:#71717a;text-transform:uppercase;letter-spacing:.5px;font-weight:600">' + w.label + '</span></div>';
      html += '<div class="dash-bar-chart" id="dashArrChart"></div>';
      html += '</div>';
    } else if (wid === 'weeklyTarget') {
      html += '<div class="dash-widget" draggable="true" data-wid="' + wid + '" style="' + span + '">';
      html += '<div class="dash-widget-header"><span class="dash-widget-grip">⋮⋮</span> <span style="font-size:10px;color:#71717a;text-transform:uppercase;letter-spacing:.5px;font-weight:600">' + w.label + '</span></div>';
      html += '<div class="dash-widget-body"><div class="dash-card-value" id="dashWeeklyTarget" style="cursor:pointer" onclick="event.stopPropagation();var v=prompt(\'Weekly target:\',this.textContent);if(v){this.textContent=v;localStorage.setItem(\'dashWeeklyTarget\',v)}">-</div></div>';
      html += '</div>';
    } else {
      html += '<div class="dash-widget" draggable="true" data-wid="' + wid + '"' + click + '>';
      html += '<div class="dash-widget-header"><span class="dash-widget-grip">⋮⋮</span> <span style="font-size:10px;color:#71717a;text-transform:uppercase;letter-spacing:.5px;font-weight:600">' + w.label + '</span></div>';
      html += '<div class="dash-widget-body"><div class="dash-card-value ' + col + '" id="' + elId + '">-</div>';
      if (subId) html += '<div class="dash-card-sub" id="' + subId + '"></div>';
      html += '</div></div>';
    }
  });

  board.innerHTML = html;
  
  // Attach drag events
  board.querySelectorAll('.dash-widget').forEach(function(el) {
    el.addEventListener('dragstart', widgetDragStart);
    el.addEventListener('dragover', widgetDragOver);
    el.addEventListener('drop', widgetDrop);
    el.addEventListener('dragend', widgetDragEnd);
  });
}

function widgetDragStart(e) {
  _dragWidget = e.currentTarget;
  e.currentTarget.style.opacity = '0.4';
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', e.currentTarget.dataset.wid);
}

function widgetDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  var target = e.currentTarget;
  if (target !== _dragWidget && target.classList.contains('dash-widget')) {
    target.style.borderColor = '#3b82f6';
  }
}

function widgetDrop(e) {
  e.preventDefault();
  var target = e.currentTarget;
  target.style.borderColor = '';
  
  if (_dragWidget && target !== _dragWidget && target.classList.contains('dash-widget')) {
    var board = target.parentElement;
    var widgets = Array.from(board.querySelectorAll('.dash-widget'));
    var fromIdx = widgets.indexOf(_dragWidget);
    var toIdx = widgets.indexOf(target);
    
    if (fromIdx < toIdx) {
      board.insertBefore(_dragWidget, target.nextSibling);
    } else {
      board.insertBefore(_dragWidget, target);
    }
    
    // Save new order
    var newLayout = Array.from(board.querySelectorAll('.dash-widget')).map(function(el) { return el.dataset.wid; });
    saveDashLayout(newLayout);
  }
}

function widgetDragEnd(e) {
  e.currentTarget.style.opacity = '1';
  document.querySelectorAll('.dash-widget').forEach(function(w) { w.style.borderColor = ''; });
  _dragWidget = null;
}

// Toggle customize mode
function TOGGLECUSTOMIZE() {
  var board = document.getElementById('widgetBoard');
  if (!board) return;
  var isEdit = board.classList.toggle('editing');
  var btn = document.getElementById('customizeBtn');
  if (btn) {
    btn.textContent = isEdit ? 'Done' : 'Customize';
    btn.style.background = isEdit ? 'rgba(59,130,246,.15)' : 'transparent';
    btn.style.color = isEdit ? '#3b82f6' : '#71717a';
  }
}
