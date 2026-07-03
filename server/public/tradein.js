var _tiFilter = 'onsite';
var _tiData = null;

function DTC(dark, light) {
  return document.getElementById('lightThemeCSS') ? light : dark;
}

function LOADTI() {
  fetch((typeof SERVER !== 'undefined' ? SERVER : '') + "/api/scan/status").then(function(r) { return r.json(); }).then(function(j) {
    if (!j.tracking) return;
    _tiData = j.tracking;
    renderTI();
    bindTIButtons();
  }).catch(function() {});
}

function renderTI() {
  if (!_tiData) return;
  var all = _tiData;

  // Filter based on selected sub-tab
  var filtered = all.filter(function(t) {
    if (_tiFilter === 'onsite') return !t.outDate;
    if (_tiFilter === 'history') return !!t.outDate;
    return true;
  });

  // Update counters
  var onSiteCount = all.filter(function(t) { return !t.outDate; }).length;
  var pickedUpCount = all.filter(function(t) { return !!t.outDate; }).length;
  var btnOnsite = document.getElementById("tiBtnOnsite");
  var btnHistory = document.getElementById("tiBtnHistory");
  if (btnOnsite) btnOnsite.textContent = "On Site (" + onSiteCount + ")";
  if (btnHistory) btnHistory.textContent = "History (" + pickedUpCount + ")";

  // --- Charts ---
  var charts = document.getElementById("tiCharts");
  if (charts) {
    var onSite = all.filter(function(t) { return !t.outDate; });

    // Stats cards
    var enriched = all.filter(function(t) { return t.make; }).length;
    var withPlate = all.filter(function(t) { return t.plate; }).length;
    var uploaded = all.filter(function(t) { return t.uploadOk; }).length;

    var ch = '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px">';

    // Row 1: Today, On Site, Max Capacity
    var today = all.filter(function(t) {
      var d = new Date(t.uploadDate);
      var now = new Date();
      return d.toDateString() === now.toDateString();
    }).length;

    ch += tiStatCard("Today", today, "#60a5fa");
    ch += tiStatCard("On Site", onSiteCount, "#f59e0b");
    ch += tiStatCard("Max Capacity", "100", DTC("#3f3f46","#ccc"));
    ch += '</div>';

    // Row 2: Oldest, Max Dwell, Average Dwell
    var dwells = onSite.map(function(t) { return Math.floor((Date.now() - new Date(t.uploadDate).getTime()) / 86400000); });
    var maxDwell = dwells.length ? Math.max.apply(null, dwells) : 0;
    var avgDwell = dwells.length ? Math.round(dwells.reduce(function(a, b) { return a + b; }, 0) / dwells.length) : 0;
    var oldestDate = "--";
    if (onSite.length) {
      var oldest = onSite.reduce(function(a, b) { return new Date(a.uploadDate) < new Date(b.uploadDate) ? a : b; });
      var od = new Date(oldest.uploadDate);
      oldestDate = od.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    ch += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:20px">';
    ch += tiStatCard("Oldest", oldestDate, "#f97316");
    ch += tiStatCard("Max Dwell", maxDwell + "j", maxDwell > 14 ? "#ef4444" : maxDwell > 7 ? "#f97316" : "#22c55e");
    ch += tiStatCard("Avg Dwell", avgDwell + "j", avgDwell > 7 ? "#f97316" : "#22c55e");
    ch += '</div>';
    charts.innerHTML = ch;
  }

  // --- Table ---
  var tb = document.getElementById("tiTrackBody");
  if (!tb) return;

  if (!filtered.length) {
    tb.innerHTML = '<tr><td colspan="9" style="text-align:center;color:#3f3f46;padding:40px">Aucun trade-in</td></tr>';
    bindTIButtons();
    return;
  }

  var searchVal = (document.getElementById("tiSearch") || {}).value || "";
  var searchLower = searchVal.toLowerCase();

  var h = "";
  filtered.slice().reverse().forEach(function(t) {
    // Search filter
    if (searchLower) {
      var searchStr = [t.rn, t.vin, t.plate, t.make, t.model].join(" ").toLowerCase();
      if (searchStr.indexOf(searchLower) < 0) return;
    }

    var dt = new Date(t.uploadDate);
    var inDate = dt.toLocaleDateString("fr-FR", {day:"2-digit",month:"2-digit",year:"numeric"});
    var dwell = Math.floor((Date.now() - dt.getTime()) / 86400000);
    var outText = t.outDate ? new Date(t.outDate).toLocaleDateString("fr-FR", {day:"2-digit",month:"2-digit"}) : "On Site";
    var outCol = t.outDate ? "#22c55e" : "#f59e0b";
    if (t.outDate) dwell = Math.floor((new Date(t.outDate) - dt) / 86400000);
    var dwellCol = dwell > 14 ? "#ef4444" : dwell > 7 ? "#f97316" : dwell > 3 ? "#f59e0b" : "#22c55e";
    var btn = t.outDate ? '<span style="color:#22c55e;font-weight:600">Done</span>' : '<button onclick="MARKOUT(this,\'' + t.rn + '\')" style="padding:4px 10px;background:rgba(239,68,68,.2);color:#ef4444;border:1px solid rgba(239,68,68,.3);border-radius:4px;font-size:11px;cursor:pointer">OUT</button>';
    var rnLink = '<a href="https://dro.tesla.com/advisor?sidepanel_fullscreen=yes&rn=' + t.rn + '" target="_blank" style="color:#60a5fa;text-decoration:none;font-weight:600">' + t.rn + '</a>';
    if (t.acquisitionId) {
      rnLink += ' <a href="https://amp.tesla.com/acquisition/' + t.acquisitionId + '" target="_blank" style="margin-left:4px;font-size:10px;background:rgba(192,132,252,.12);color:#c084fc;padding:1px 6px;border-radius:10px;text-decoration:none;font-weight:600" title="Ouvrir dans AMP">AMP</a>';
    }
    h += '<tr style="border-bottom:1px solid rgba(255,255,255,.04)">'
      + '<td style="padding:10px">' + inDate + '</td>'
      + '<td style="padding:10px;font-family:monospace;font-size:11px;color:#60a5fa">' + (t.vin || "-") + '</td>'
      + '<td style="padding:10px;font-weight:600">' + (t.plate || "-") + '</td>'
      + '<td style="padding:10px">' + (t.make || "-") + '</td>'
      + '<td style="padding:10px">' + (t.model || "-") + '</td>'
      + '<td style="padding:10px">' + rnLink + '</td>'
      + '<td style="padding:10px;text-align:center;color:' + outCol + ';font-weight:600">' + outText + '</td>'
      + '<td style="padding:10px;text-align:center;font-weight:700;color:' + dwellCol + '">' + dwell + 'j</td>'
      + '<td style="padding:10px;text-align:center">' + btn + '</td>'
      + '</tr>';
  });
  tb.innerHTML = h;
  bindTIButtons();
}

function bindTIButtons() {
  var bo = document.getElementById("tiBtnOnsite");
  var bh = document.getElementById("tiBtnHistory");
  if (bo) bo.onclick = function() { SWITCHTITAB("onsite"); };
  if (bh) bh.onclick = function() { SWITCHTITAB("history"); };
  styleTIButtons();
}

function styleTIButtons() {
  var bo = document.getElementById("tiBtnOnsite");
  var bh = document.getElementById("tiBtnHistory");
  if (!bo || !bh) return;
  var isDark = !document.getElementById("lightThemeCSS");
  var base = "padding:8px 24px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s;";
  var activeStyle = base + (isDark ? "background:rgba(59,130,246,.2);color:#60a5fa;border:1px solid rgba(59,130,246,.3)" : "background:#3b82f6;color:#fff;border:1px solid #3b82f6");
  var inactiveStyle = base + (isDark ? "background:rgba(255,255,255,.04);color:#71717a;border:1px solid rgba(255,255,255,.08)" : "background:#f5f5f5;color:#666;border:1px solid rgba(0,0,0,.1)");
  bo.style.cssText = _tiFilter === "onsite" ? activeStyle : inactiveStyle;
  bh.style.cssText = _tiFilter === "history" ? activeStyle : inactiveStyle;
  // Update column header
  var outHeader = document.getElementById("tiOutHeader");
  if (outHeader) outHeader.textContent = _tiFilter === "onsite" ? "Status" : "Out";
}

function tiStatCard(label, value, color) {
  var bg = DTC("rgba(255,255,255,.04)", "#fff");
  var bdr = DTC("rgba(255,255,255,.06)", "rgba(0,0,0,.08)");
  var shadow = DTC("0 2px 8px rgba(0,0,0,.3)", "0 2px 8px rgba(0,0,0,.06)");
  var lblCol = DTC("#71717a", "#888");
  return '<div style="background:' + bg + ';border-radius:12px;border:1px solid ' + bdr + ';box-shadow:' + shadow + ';padding:18px 20px">'
    + '<div style="font-size:12px;color:' + lblCol + ';font-weight:500;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">' + label + '</div>'
    + '<div style="font-size:28px;font-weight:700;color:' + color + ';line-height:1">' + value + '</div>'
    + '</div>';
}

function SWITCHTITAB(tab) {
  _tiFilter = tab;
  styleTIButtons();
  renderTI();
}

function SEARCHTI(val) {
  renderTI();
}

function MARKOUT(btn, rn) {
  if (!confirm("Mark " + rn + " as picked up?")) return;
  btn.textContent = "...";
  fetch((typeof SERVER !== 'undefined' ? SERVER : '') + "/api/scan/out/" + rn, { method: "POST" }).then(function(r) { return r.json(); }).then(function() { LOADTI(); }).catch(function() { btn.textContent = "ERR"; });
}

function ENRICHTI() {
  if (!confirm("Enrich all entries with DRO data?")) return;
  fetch((typeof SERVER !== 'undefined' ? SERVER : '') + "/api/scan/enrich", { method: "POST" }).then(function(r) { return r.json(); }).then(function(j) { alert("Enriched: " + j.enriched + " entries"); LOADTI(); }).catch(function(e) { alert("Error: " + e.message); });
}

function ENRICHTI(btn) {
  btn.textContent = "Enriching...";
  btn.disabled = true;
  fetch((typeof SERVER !== 'undefined' ? SERVER : '') + "/api/scan/enrich", { method: "POST" })
    .then(function(r) { return r.json(); })
    .then(function(j) {
      btn.textContent = j.enriched ? j.enriched + " enriched" : "Up to date";
      btn.style.color = "#22c55e";
      setTimeout(function() {
        btn.textContent = "Enrich";
        btn.style.color = "#60a5fa";
        btn.disabled = false;
      }, 3000);
      if (j.enriched) LOADTI();
    })
    .catch(function() {
      btn.textContent = "Error";
      btn.style.color = "#ef4444";
      setTimeout(function() { btn.textContent = "Enrich"; btn.style.color = "#60a5fa"; btn.disabled = false; }, 3000);
    });
}

function TRIGGERSCAN(btn) {
  btn.textContent = "Scanning...";
  btn.disabled = true;
  btn.style.opacity = "0.7";

  function tryScan(source) {
    return fetch((typeof SERVER !== 'undefined' ? SERVER : '') + "/api/scan/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source: source })
    }).then(function(r) { return r.json(); });
  }

  tryScan("Feeder").then(function(j) {
    if (!j.ok) {
      btn.textContent = "Vitre...";
      return tryScan("Platen");
    }
    return j;
  }).then(function(j) {
    if (!j.ok) { alert("Erreur scanner: " + j.error); resetBtn(btn); return; }
    var jobId = j.jobUrl ? j.jobUrl.split("/").pop() : "";
    btn.textContent = "Retrieving...";

    var attempts = 0;
    function poll() {
      attempts++;
      if (attempts > 30) { alert("Timeout"); resetBtn(btn); return; }
      fetch((typeof SERVER !== 'undefined' ? SERVER : '') + "/api/scan/download/" + jobId)
        .then(function(r) { return r.json(); })
        .then(function(d) {
          if (d.ok) {
            if (d.processed && d.rn) {
              // QR code found, auto-assigned!
              btn.textContent = d.rn;
              btn.style.opacity = "1";
              btn.style.background = "rgba(34,197,94,.3)";
              btn.style.color = "#22c55e";
              setTimeout(function() { resetBtn(btn); LOADTI(); }, 3000);
            } else {
              // No QR code — show RN picker
              resetBtn(btn);
              showRNPicker(d.filename);
            }
          } else {
            setTimeout(poll, 2000);
          }
        }).catch(function() { setTimeout(poll, 2000); });
    }
    setTimeout(poll, 4000);
  }).catch(function(e) { alert("Erreur: " + e.message); resetBtn(btn); });
}

function showRNPicker(filename) {
  // Get today's deliveries with trade-in from DATA (if available) or from tracking
  var tiList = [];
  if (typeof DATA !== "undefined" && DATA.length) {
    DATA.forEach(function(d) {
      if (d.tims || d.hasTI) tiList.push({ rn: d.rn, name: d.name, model: d.model });
    });
  }

  var modal = document.createElement("div");
  modal.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.6);z-index:200;display:flex;align-items:center;justify-content:center";
  var box = document.createElement("div");
  var isDark = !document.getElementById("lightThemeCSS");
  box.style.cssText = "background:" + (isDark ? "#16161c" : "#fff") + ";border-radius:16px;border:1px solid " + (isDark ? "rgba(255,255,255,.08)" : "rgba(0,0,0,.08)") + ";padding:28px;min-width:400px;max-width:500px;box-shadow:0 12px 40px rgba(0,0,0,.4);font-family:inherit;color:" + (isDark ? "#d4d4d8" : "#333");

  var html = '<h3 style="margin:0 0 8px;font-size:18px">Scan OK!</h3>'
    + '<p style="margin:0 0 20px;font-size:12px;color:' + (isDark ? '#71717a' : '#999') + '">' + filename + '</p>'
    + '<p style="margin:0 0 12px;font-size:14px;font-weight:600">Associer à quel RN ?</p>';

  if (tiList.length) {
    html += '<div style="max-height:250px;overflow:auto;margin-bottom:16px">';
    tiList.forEach(function(t) {
      var btnBg = isDark ? "rgba(255,255,255,.04)" : "#f5f5f5";
      var btnBdr = isDark ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.08)";
      html += '<button class="rn-pick" data-rn="' + t.rn + '" style="display:flex;align-items:center;gap:12px;width:100%;padding:10px 14px;margin-bottom:6px;background:' + btnBg + ';border:1px solid ' + btnBdr + ';border-radius:8px;cursor:pointer;text-align:left;font-family:inherit;color:inherit;font-size:13px;transition:all .1s">'
        + '<span style="color:#60a5fa;font-weight:700;font-size:12px;min-width:110px">' + t.rn + '</span>'
        + '<span style="flex:1">' + t.name + '</span>'
        + '<span style="color:' + (isDark ? '#71717a' : '#999') + ';font-size:12px">' + t.model + '</span>'
        + '</button>';
    });
    html += '</div>';
  }

  html += '<div style="display:flex;gap:8px;align-items:center">'
    + '<input type="text" id="rnManual" placeholder="Ou saisir un RN..." style="flex:1;padding:10px 14px;border:1px solid ' + (isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.12)') + ';border-radius:8px;font-size:13px;font-family:inherit;background:' + (isDark ? 'rgba(255,255,255,.04)' : '#fff') + ';color:inherit;outline:none">'
    + '<button id="rnOk" style="padding:10px 20px;background:rgba(34,197,94,.15);color:#22c55e;border:1px solid rgba(34,197,94,.3);border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit">OK</button>'
    + '</div>'
    + '<button id="rnCancel" style="margin-top:12px;width:100%;padding:8px;background:none;border:1px solid ' + (isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.08)') + ';border-radius:8px;font-size:12px;color:' + (isDark ? '#71717a' : '#999') + ';cursor:pointer;font-family:inherit">Annuler</button>';

  box.innerHTML = html;
  modal.appendChild(box);
  document.body.appendChild(modal);

  // Bind RN pick buttons
  box.querySelectorAll(".rn-pick").forEach(function(b) {
    b.onclick = function() { assignScan(filename, b.dataset.rn, modal); };
  });

  document.getElementById("rnOk").onclick = function() {
    var rn = document.getElementById("rnManual").value.trim().toUpperCase();
    if (!rn.match(/^RN\d{6,}/)) { alert("RN invalide"); return; }
    assignScan(filename, rn, modal);
  };

  document.getElementById("rnCancel").onclick = function() { modal.remove(); };
}

function assignScan(filename, rn, modal) {
  // Rename file to include RN and process
  fetch((typeof SERVER !== 'undefined' ? SERVER : '') + "/api/scan/assign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: filename, rn: rn })
  }).then(function(r) { return r.json(); }).then(function(j) {
    modal.remove();
    if (j.ok) {
      alert("Scan associé à " + rn + " !");
      LOADTI();
    } else {
      alert("Erreur: " + (j.error || "unknown"));
    }
  }).catch(function(e) { modal.remove(); alert("Erreur: " + e.message); });
}

function resetBtn(btn) {
  btn.textContent = "Scan";
  btn.disabled = false;
  btn.style.opacity = "1";
  btn.style.background = "";
  btn.style.color = "";
}
