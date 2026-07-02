// Arrivals chart + table logic
var _arrData = null;

function LOADARR() {
  fetch((typeof SERVER !== 'undefined' ? SERVER : '') + "/api/bi/arrivals").then(function(r) { return r.json(); }).then(function(j) {
    if (j.error) return;
    _arrData = j;
    renderArrivals();
  }).catch(function() {});
}

function renderArrivals() {
  var j = _arrData;
  if (!j) return;
  var s = j.summary;
  var d = j.data;
  var isDark = !document.getElementById("lightThemeCSS");

  // Find today's date in the data
  var today = new Date();
  var todayStr = String(today.getDate()).padStart(2,'0') + '/' + String(today.getMonth()+1).padStart(2,'0');
  var todayCount = 0;
  if (d.dates) {
    for (var ti = 0; ti < d.dates.length; ti++) {
      if (d.dates[ti] === todayStr) {
        todayCount = (d.arrived[ti] || 0) + (d.confident[ti] || 0) + (d.preliminary[ti] || 0);
        break;
      }
    }
  }

  // Calculate this week (Monday to Sunday)
  var weekTotal = 0;
  var mon = new Date(today); mon.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  var sun = new Date(mon); sun.setDate(mon.getDate() + 6);
  if (d.dates) {
    for (var wi = 0; wi < d.dates.length; wi++) {
      var parts = d.dates[wi].split('/');
      if (parts.length === 2) {
        var dateObj = new Date(today.getFullYear(), parseInt(parts[1])-1, parseInt(parts[0]));
        if (dateObj >= mon && dateObj <= sun) {
          weekTotal += (d.arrived[wi] || 0) + (d.confident[wi] || 0) + (d.preliminary[wi] || 0);
        }
      }
    }
  }

  // Update stat cards
  var el;
  el = document.getElementById("arrTransit"); if (el) el.textContent = s.inTransit;
  el = document.getElementById("arrToday"); if (el) el.textContent = todayCount;
  el = document.getElementById("arrWeek"); if (el) el.textContent = weekTotal;
  el = document.getElementById("arrTodayDetail"); if (el) el.textContent = todayCount > 0 ? todayCount + " expected today" : "No arrivals today";
  el = document.getElementById("arrWeekPct"); if (el) el.innerHTML = "Mon " + String(mon.getDate()).padStart(2,'0') + '/' + String(mon.getMonth()+1).padStart(2,'0') + " - Sun " + String(sun.getDate()).padStart(2,'0') + '/' + String(sun.getMonth()+1).padStart(2,'0');

  // Last update badge - put it at the bottom, not top
  if (j.lastUpdate) {
    var updEl = document.getElementById("arrLastUpdate");
    if (!updEl) {
      updEl = document.createElement("div");
      updEl.id = "arrLastUpdate";
      updEl.style.cssText = "font-size:12px;color:#71717a;text-align:right;padding:8px 0 0";
      var arrView = document.getElementById("arrView");
      if (arrView && arrView.firstChild) arrView.firstChild.appendChild(updEl);
    }
    var d2 = new Date(j.lastUpdate);
    updEl.textContent = "Data updated: " + d2.toLocaleDateString("en-US", {month:"short",day:"numeric"}) + " " + d2.toLocaleTimeString("en-US", {hour:"numeric",minute:"2-digit"});
  }

  // Chart
  var ch = document.getElementById("arrDailyChart");
  if (ch && d.dates && d.dates.length > 1) {
    var arrived = d.arrived || [];
    var confident = d.confident || [];
    var preliminary = d.preliminary || [];
    var maxVal = 0;
    d.dates.forEach(function(_, i) {
      var total = (arrived[i] || 0) + (confident[i] || 0) + (preliminary[i] || 0);
      if (total > maxVal) maxVal = total;
    });
    if (!maxVal) maxVal = 1;

    var html = '';
    d.dates.forEach(function(date, i) {
      var a = arrived[i] || 0;
      var c = confident[i] || 0;
      var p = preliminary[i] || 0;
      var total = a + c + p;
      if (total === 0) return;

      var pctA = Math.round(a / maxVal * 100);
      var pctC = Math.round(c / maxVal * 100);
      var pctP = Math.round(p / maxVal * 100);

      html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;cursor:pointer" onclick="filterArrByDate(\'' + date + '\')">';
      html += '<span style="font-size:12px;font-weight:700;color:' + (isDark ? '#e4e4e7' : '#333') + '">' + total + '</span>';
      html += '<div style="width:100%;flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:1px">';

      // Stacked bars: Preliminary (red) on top, Confident (orange) middle, Arrived (blue) bottom
      if (p > 0) html += '<div style="width:100%;height:' + pctP + '%;background:#ef4444;border-radius:4px 4px 0 0;min-height:3px" title="Preliminary: ' + p + '"></div>';
      if (c > 0) html += '<div style="width:100%;height:' + pctC + '%;background:#f59e0b;min-height:3px" title="Confident: ' + c + '"></div>';
      if (a > 0) html += '<div style="width:100%;height:' + pctA + '%;background:#3b82f6;border-radius:0 0 4px 4px;min-height:3px" title="Arrived: ' + a + '"></div>';

      html += '</div>';
      html += '<span style="font-size:11px;color:' + (isDark ? '#71717a' : '#999') + '">' + date + '</span>';
      html += '</div>';
    });

    ch.innerHTML = html;
  }

  // Legend
  var legend = document.getElementById("arrLegend");
  if (legend) {
    var lc = isDark ? '#71717a' : '#999';
    legend.innerHTML = '<div style="display:flex;gap:16px;justify-content:center;margin-top:12px;font-size:12px;color:' + lc + '">'
      + '<span><span style="display:inline-block;width:10px;height:10px;background:#3b82f6;border-radius:2px;margin-right:4px;vertical-align:middle"></span>Arrived</span>'
      + '<span><span style="display:inline-block;width:10px;height:10px;background:#f59e0b;border-radius:2px;margin-right:4px;vertical-align:middle"></span>Confident ETA</span>'
      + '<span><span style="display:inline-block;width:10px;height:10px;background:#ef4444;border-radius:2px;margin-right:4px;vertical-align:middle"></span>Preliminary ETA</span>'
      + '</div>';
  }

  // Detail table - show all dates by default
  renderArrDetail(null);
}

function filterArrByDate(date) {
  renderArrDetail(date);
  // Highlight active bar
  var bars = document.querySelectorAll("#arrDailyChart > div");
  bars.forEach(function(b) {
    b.style.opacity = b.querySelector("span").nextSibling ? "1" : "0.4";
    var label = b.querySelector("span:last-child");
    if (label && label.textContent === date) b.style.opacity = "1";
    else b.style.opacity = "0.4";
  });
}

function renderArrDetail(filterDate) {
  var tb = document.getElementById("arrVehicleBody");
  if (!tb || !_arrData) return;
  var d = _arrData.data;
  var isDark = !document.getElementById("lightThemeCSS");

  if (!d.dates || d.dates.length <= 1) {
    tb.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:30px;color:' + (isDark ? '#52525b' : '#ccc') + '">No detail data</td></tr>';
    return;
  }

  var rows = [];
  var arrived = d.arrived || [];
  var confident = d.confident || [];
  var preliminary = d.preliminary || [];

  d.dates.forEach(function(date, i) {
    if (filterDate && date !== filterDate) return;
    if (arrived[i] > 0) rows.push({ date: date, type: 'Arrived', count: arrived[i], color: '#3b82f6' });
    if (confident[i] > 0) rows.push({ date: date, type: 'Confident ETA', count: confident[i], color: '#f59e0b' });
    if (preliminary[i] > 0) rows.push({ date: date, type: 'Preliminary ETA', count: preliminary[i], color: '#ef4444' });
  });

  if (!rows.length) {
      tb.innerHTML = '<tr><td colspan="3" style="text-align:center;padding:30px;color:' + (isDark ? '#52525b' : '#ccc') + '">No data for this date</td></tr>';
    return;
  }

  var html = '';
  rows.forEach(function(r) {
    var typeBg = r.type === 'Arrived' ? 'rgba(59,130,246,.12)' : r.type === 'Confident ETA' ? 'rgba(245,158,11,.12)' : 'rgba(239,68,68,.12)';
    html += '<tr style="border-bottom:1px solid ' + (isDark ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)') + '">'
      + '<td style="padding:10px 14px;font-weight:600">' + r.date + '</td>'
      + '<td style="padding:10px 14px"><span style="background:' + typeBg + ';color:' + r.color + ';padding:3px 10px;border-radius:10px;font-size:12px;font-weight:600">' + r.type + '</span></td>'
      + '<td style="padding:10px 14px;font-size:16px;font-weight:700;color:' + r.color + '">' + r.count + '</td>'
      + '</tr>';
  });

  // Reset filter link
  if (filterDate) {
    html += '<tr><td colspan="3" style="text-align:center;padding:10px"><button onclick="renderArrDetail(null);renderArrivals()" style="background:none;border:1px solid ' + (isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.1)') + ';border-radius:6px;padding:6px 16px;color:' + (isDark ? '#60a5fa' : '#3b82f6') + ';font-size:12px;cursor:pointer;font-family:inherit">Show All</button></td></tr>';
  }

  tb.innerHTML = html;
}
