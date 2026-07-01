// Stock tab logic — loaded externally
var _stockData = null;
var _stockFilter = 'rennes'; // rennes or all
var _stockTypeFilter = '';
var _stockModelFilter = '';

function LOADSTOCK() {
  var container = document.getElementById("stockContent");
  if (!container) return;
  container.innerHTML = '<div style="text-align:center;padding:60px;color:#999"><div class="spinner" style="width:32px;height:32px;border:3px solid rgba(255,255,255,.06);border-top-color:#60a5fa;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto"></div><div style="margin-top:12px">Loading stock data...</div></div>';

  fetch("http://localhost:3000/api/bi/stock").then(function(r) { return r.json(); }).then(function(j) {
    if (j.error) { container.innerHTML = '<div style="text-align:center;padding:60px;color:#c00">' + j.error + '</div>'; return; }
    _stockData = j;
    renderStock();
  }).catch(function(e) { container.innerHTML = '<div style="text-align:center;padding:60px;color:#c00">Error: ' + e.message + '</div>'; });
}

function renderStock() {
  if (!_stockData) return;
  var j = _stockData;
  var s = j.stats;
  var container = document.getElementById("stockContent");
  var lastUpd = j.lastUpdate ? new Date(j.lastUpdate).toLocaleDateString("fr-FR", {day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}) : "?";

  // Filter vehicles
  var vehicles = j.vehicles.filter(function(v) {
    if (_stockFilter === 'rennes' && v.trtId !== '28498') return false;
    if (_stockTypeFilter && v.typeRaw !== _stockTypeFilter) return false;
    if (_stockModelFilter && v.modelRaw !== _stockModelFilter) return false;
    return true;
  });

  // Stats cards
  var html = '';

  // Row 1: Key metrics
  html += '<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:20px">';
  html += statCard("Total Rennes", j.rennes, "#60a5fa");
  html += statCard("Customer", s.customerCount, "#22c55e");
  html += statCard("Inventory", s.inventoryCount, "#f59e0b");
  html += statCard("Matched", s.matchedCount, "#22c55e");
  html += statCard("Unmatched", s.unmatchedCount, "#ef4444");
  html += statCard("On Site", s.onSiteCount, "#60a5fa");
  html += '</div>';


    // Filters row
  html += '<div style="display:flex;gap:12px;margin-bottom:16px;align-items:center">';
  html += '<select id="stockLocFilter" onchange="STOCKFILTER()" style="padding:6px 12px;border:1px solid rgba(255,255,255,.08);border-radius:6px;font-size:13px;background:rgba(255,255,255,.04);color:#d4d4d8">';
  html += '<option value="rennes" style="background:#1c1c22"' + (_stockFilter === 'rennes' ? ' selected' : '') + '>Rennes (28498)</option>';
  html += '<option value="all" style="background:#1c1c22"' + (_stockFilter === 'all' ? ' selected' : '') + '>All Locations</option>';
  html += '</select>';
  html += '<select id="stockTypeFilter" onchange="STOCKFILTER()" style="padding:6px 12px;border:1px solid rgba(255,255,255,.08);border-radius:6px;font-size:13px;background:rgba(255,255,255,.04);color:#d4d4d8">';
  html += '<option value="" style="background:#1c1c22">All Types</option>';
  html += '<option value="customer-vehicle" style="background:#1c1c22"' + (_stockTypeFilter === 'customer-vehicle' ? ' selected' : '') + '>Customer</option>';
  html += '<option value="inventory-vehicle" style="background:#1c1c22"' + (_stockTypeFilter === 'inventory-vehicle' ? ' selected' : '') + '>Inventory</option>';
  html += '<option value="marketing-vehicle" style="background:#1c1c22"' + (_stockTypeFilter === 'marketing-vehicle' ? ' selected' : '') + '>Marketing</option>';
  html += '<option value="service-loaner" style="background:#1c1c22"' + (_stockTypeFilter === 'service-loaner' ? ' selected' : '') + '>Service Loaner</option>';
  html += '</select>';
  html += '<select id="stockModelFilter" onchange="STOCKFILTER()" style="padding:6px 12px;border:1px solid rgba(255,255,255,.08);border-radius:6px;font-size:13px;background:rgba(255,255,255,.04);color:#d4d4d8">';
  html += '<option value="" style="background:#1c1c22">All Models</option>';
  html += '<option value="3" style="background:#1c1c22"' + (_stockModelFilter === '3' ? ' selected' : '') + '>Model 3</option>';
  html += '<option value="y" style="background:#1c1c22"' + (_stockModelFilter === 'y' ? ' selected' : '') + '>Model Y</option>';
  html += '</select>';
  html += '<div style="flex:1"></div>';
  html += '<span style="font-size:12px;color:#999">Updated: ' + lastUpd + '</span>';
  html += '<span style="font-size:13px;font-weight:700;color:#60a5fa">' + vehicles.length + ' vehicles</span>';
  html += '</div>';

  // Table
  html += '<div style="background:rgba(255,255,255,.04);border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.06);overflow:auto;max-height:500px">';
  html += '<table style="width:100%;border-collapse:collapse;font-size:12px">';
  html += '<thead><tr style="position:sticky;top:0;background:rgba(255,255,255,.03);z-index:1;border-bottom:2px solid rgba(255,255,255,.08)">';
  html += '<th style="padding:8px;text-align:left;font-size:11px;color:#71717a;text-transform:uppercase">VIN</th>';
  html += '<th style="padding:8px;text-align:left;font-size:11px;color:#71717a;text-transform:uppercase">Type</th>';
  html += '<th style="padding:8px;text-align:left;font-size:11px;color:#71717a;text-transform:uppercase">Model</th>';
  html += '<th style="padding:8px;text-align:left;font-size:11px;color:#71717a;text-transform:uppercase">Version</th>';
  html += '<th style="padding:8px;text-align:left;font-size:11px;color:#71717a;text-transform:uppercase">Couleur</th>';
  html += '<th style="padding:8px;text-align:left;font-size:11px;color:#71717a;text-transform:uppercase">Jantes</th>';
  html += '<th style="padding:8px;text-align:center;font-size:11px;color:#71717a;text-transform:uppercase">Attelage</th>';
  html += '<th style="padding:8px;text-align:right;font-size:11px;color:#71717a;text-transform:uppercase">Km</th>';
  html += '<th style="padding:8px;text-align:center;font-size:11px;color:#71717a;text-transform:uppercase">ETA SC</th>';
  html += '<th style="padding:8px;text-align:center;font-size:11px;color:#71717a;text-transform:uppercase">SDD</th>';
  html += '<th style="padding:8px;text-align:center;font-size:11px;color:#71717a;text-transform:uppercase">Dwell</th>';
  html += '<th style="padding:8px;text-align:center;font-size:11px;color:#71717a;text-transform:uppercase">Hold</th>';
  html += '</tr></thead><tbody>';

  // Sort by type priority then dwell
  vehicles.sort(function(a, b) {
    var typePrio = { 'customer-vehicle': 0, 'inventory-vehicle': 1, 'marketing-vehicle': 2, 'service-loaner': 3 };
    var pa = typePrio[a.typeRaw] !== undefined ? typePrio[a.typeRaw] : 9;
    var pb = typePrio[b.typeRaw] !== undefined ? typePrio[b.typeRaw] : 9;
    if (pa !== pb) return pa - pb;
    return (b.dwellDays || 0) - (a.dwellDays || 0);
  });

  vehicles.forEach(function(v) {
    var typeCol = v.typeRaw === 'customer-vehicle' ? '#22c55e' : v.typeRaw === 'inventory-vehicle' ? '#f59e0b' : v.typeRaw === 'marketing-vehicle' ? '#c084fc' : '#71717a';
    var typeBg = v.typeRaw === 'customer-vehicle' ? 'rgba(34,197,94,.12)' : v.typeRaw === 'inventory-vehicle' ? 'rgba(245,158,11,.1)' : v.typeRaw === 'marketing-vehicle' ? 'rgba(192,132,252,.1)' : 'rgba(255,255,255,.02)';
    var etaFmt = v.eta ? v.eta.substring(5, 10) : '-';
    var sddFmt = v.sdd ? v.sdd.substring(5, 10) : '-';
    var dwellTxt = v.dwellDays !== null && v.dwellDays >= 0 ? v.dwellDays + 'j' : '-';
    var dwellCol = v.dwellDays > 30 ? '#ef4444' : v.dwellDays > 14 ? '#f97316' : v.dwellDays > 7 ? '#f59e0b' : '#22c55e';
    var matchBorder = v.matched ? '' : 'border-left:3px solid #ef4444';
    var holdBadge = v.hold ? '<span style="background:rgba(239,68,68,.2);color:#ef4444;padding:1px 6px;border-radius:10px;font-size:10px;font-weight:600">HOLD</span>' : '-';
    var towBadge = v.tow ? '<span style="font-size:10px;background:rgba(96,165,250,.12);color:#60a5fa;padding:1px 5px;border-radius:8px">CPF</span>' : '';

    html += '<tr style="border-bottom:1px solid rgba(255,255,255,.04);' + matchBorder + '">';
    html += '<td style="padding:6px 8px;font-family:monospace;font-size:11px;color:#60a5fa">' + v.vin + '</td>';
    html += '<td style="padding:6px 8px"><span style="background:' + typeBg + ';color:' + typeCol + ';padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600">' + v.type + '</span></td>';
    html += '<td style="padding:6px 8px;font-weight:600">' + v.model.replace('Model ', 'M') + '</td>';
    html += '<td style="padding:6px 8px">' + v.trim + '</td>';
    html += '<td style="padding:6px 8px">' + v.color + '</td>';
    html += '<td style="padding:6px 8px;font-size:11px">' + v.wheels + '</td>';
    html += '<td style="padding:6px 8px;text-align:center">' + towBadge + '</td>';
    html += '<td style="padding:6px 8px;text-align:right;color:#71717a">' + Math.round(v.odo).toLocaleString() + '</td>';
    html += '<td style="padding:6px 8px;text-align:center;font-size:11px">' + etaFmt + '</td>';
    html += '<td style="padding:6px 8px;text-align:center;font-size:11px;font-weight:' + (v.matched ? '600' : '400') + ';color:' + (v.matched ? '#22c55e' : '#52525b') + '">' + sddFmt + '</td>';
    html += '<td style="padding:6px 8px;text-align:center;font-weight:700;color:' + dwellCol + '">' + dwellTxt + '</td>';
    html += '<td style="padding:6px 8px;text-align:center">' + holdBadge + '</td>';
    html += '</tr>';
  });

  html += '</tbody></table></div>';

  container.innerHTML = html;
}

function statCard(label, value, color) {
  return '<div style="background:rgba(255,255,255,.04);border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.06);padding:16px;text-align:center">'
    + '<div style="font-size:28px;font-weight:700;color:' + color + '">' + value + '</div>'
    + '<div style="font-size:12px;color:#71717a;margin-top:4px">' + label + '</div>'
    + '</div>';
}

function STOCKFILTER() {
  _stockFilter = document.getElementById("stockLocFilter").value;
  _stockTypeFilter = document.getElementById("stockTypeFilter").value;
  _stockModelFilter = document.getElementById("stockModelFilter").value;
  renderStock();
}
