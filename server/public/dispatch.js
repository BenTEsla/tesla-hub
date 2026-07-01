// Smart Dispatch v3 — AM/PM per CES + Weight-based balancing
var DISPATCH_WEIGHTS = { enterprise: 1.5, tradein: 1.3, regular: 1.0 };
var DISPATCH_SPLIT_HOUR = 13;

function isLightTheme() { return !!document.getElementById('lightThemeCSS'); }
function DT(dark, light) { return isLightTheme() ? light : dark; }

function _btn(label, type) {
  var bg, col, bdr;
  if (type === 'primary') { bg = DT("rgba(59,130,246,.15)","rgba(59,130,246,.1)"); col = DT("#60a5fa","#2563eb"); bdr = "rgba(59,130,246,.3)"; }
  else if (type === 'success') { bg = DT("rgba(34,197,94,.15)","rgba(34,197,94,.1)"); col = "#22c55e"; bdr = "rgba(34,197,94,.3)"; }
  else if (type === 'danger') { bg = DT("rgba(239,68,68,.1)","rgba(239,68,68,.08)"); col = DT("#ef4444","#dc2626"); bdr = "rgba(239,68,68,.2)"; }
  else { bg = DT("rgba(255,255,255,.05)","#f5f5f5"); col = DT("#a1a1aa","#666"); bdr = DT("rgba(255,255,255,.08)","rgba(0,0,0,.12)"); }
  return 'padding:10px 24px;background:' + bg + ';color:' + col + ';border:1px solid ' + bdr + ';border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s';
}

function _box() {
  return "background:" + DT("#16161c","#fff") + ";border-radius:16px;border:1px solid " + DT("rgba(255,255,255,.08)","rgba(0,0,0,.08)") + ";padding:28px 32px;min-width:700px;max-width:900px;width:80vw;max-height:90vh;overflow:auto;box-shadow:0 12px 40px " + DT("rgba(0,0,0,.5)","rgba(0,0,0,.15)") + ";font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;color:" + DT("#d4d4d8","#333");
}

function _th() { return "padding:10px 12px;font-size:11px;color:" + DT("#71717a","#888") + ";font-weight:600;text-transform:uppercase;letter-spacing:.3px;border-bottom:2px solid " + DT("rgba(255,255,255,.06)","rgba(0,0,0,.08)"); }
function _td() { return "padding:10px 12px;border-bottom:1px solid " + DT("rgba(255,255,255,.04)","rgba(0,0,0,.05)"); }
function _sep() { return "border-bottom:1px solid " + DT("rgba(255,255,255,.04)","rgba(0,0,0,.05)"); }

function DISPATCH() {
  var allHosts = [
    { name: "Ben Daubin", id: "428058" },
    { name: "Sacha Villa", id: "399921" },
    { name: "Sophie MACE", id: "444287" }
  ];

  if (!DATA.length) { alert("No deliveries loaded! Search first."); return; }

  var modal = document.createElement("div");
  modal.style.cssText = "position:fixed;top:0;left:0;right:0;bottom:0;background:" + DT("rgba(0,0,0,.7)","rgba(0,0,0,.35)") + ";z-index:100;display:flex;align-items:center;justify-content:center";
  var box = document.createElement("div");
  box.style.cssText = _box();

  var dispDate = document.getElementById("dt");
  var dispLabel = dispDate.options[dispDate.selectedIndex].text;

  var amTotal = 0, pmTotal = 0;
  DATA.forEach(function(d) {
    if (d.delivered) return;
    var hour = 12;
    if (d.t && d.t !== "?") { hour = parseInt(d.t.split(":")[0]) || 12; }
    if (hour < DISPATCH_SPLIT_HOUR) amTotal++; else pmTotal++;
  });

  box.innerHTML = '<h2 style="margin:0 0 20px;font-size:22px;font-weight:700">Smart Dispatch</h2>'
    + '<p style="margin:0 0 24px;font-size:14px;font-weight:600;color:#60a5fa">' + dispLabel + '</p>'

    + '<table style="width:100%;border-collapse:collapse;margin-bottom:24px">'
    + '<tr>'
    + '<th style="' + _th() + 'text-align:left">CES</th>'
    + '<th style="' + _th() + 'text-align:center;color:#60a5fa">Matin <span style="font-weight:400;color:' + DT("#52525b","#aaa") + '">(' + amTotal + ')</span></th>'
    + '<th style="' + _th() + 'text-align:center;color:#f97316">Aprem <span style="font-weight:400;color:' + DT("#52525b","#aaa") + '">(' + pmTotal + ')</span></th>'
    + '<th style="' + _th() + 'text-align:center">Admin</th>'
    + '</tr>'
    + allHosts.map(function(h, i) {
      return '<tr style="' + _sep() + '">'
        + '<td style="' + _td() + 'font-size:14px;font-weight:500">' + h.name + '</td>'
        + '<td style="' + _td() + 'text-align:center"><input type="checkbox" checked id="dam' + i + '" style="width:18px;height:18px;accent-color:#60a5fa;cursor:pointer"></td>'
        + '<td style="' + _td() + 'text-align:center"><input type="checkbox" checked id="dpm' + i + '" style="width:18px;height:18px;accent-color:#f97316;cursor:pointer"></td>'
        + '<td style="' + _td() + 'text-align:center"><input type="radio" name="adm" value="' + i + '" style="width:16px;height:16px;accent-color:#60a5fa;cursor:pointer"></td>'
        + '</tr>';
    }).join("")
    + '<tr style="' + _sep() + '"><td colspan="3"></td>'
    + '<td style="' + _td() + 'text-align:center;font-size:12px;color:' + DT("#71717a","#888") + '">'
    + '<label style="cursor:pointer"><input type="radio" name="adm" value="-1" checked style="width:16px;height:16px;accent-color:#60a5fa;cursor:pointer"> Aucun</label></td></tr>'
    + '</table>'

    + '<div style="display:flex;gap:10px">'
    + '<button id="dgo" style="flex:1;' + _btn("", "primary") + '">Preview</button>'
    + '<button id="dno" style="flex:1;' + _btn("", "default") + '">Cancel</button>'
    + '</div>';

  modal.appendChild(box);
  document.body.appendChild(modal);
  document.getElementById("dno").onclick = function() { modal.remove(); };

  document.getElementById("dgo").onclick = function() {
    var admRadio = document.querySelector("input[name=adm]:checked");
    var admIdx = admRadio ? parseInt(admRadio.value) : -1;

    var floorAM = [], floorPM = [], allFloor = {};
    allHosts.forEach(function(h, i) {
      var am = document.getElementById("dam" + i).checked;
      var pm = document.getElementById("dpm" + i).checked;
      if (!am && !pm) return;
      h.isAdmin = (admIdx === i);
      allFloor[h.id] = h;
      if (am) floorAM.push(h);
      if (pm) floorPM.push(h);
    });

    if (!floorAM.length && !floorPM.length) { alert("Coche au moins 1 CES !"); return; }

    var itemsAM = [], itemsPM = [];
    DATA.forEach(function(d) {
      if (d.delivered) return;
      var type = "regular", weight = DISPATCH_WEIGHTS.regular;
      if (d.b2b) { type = "enterprise"; weight = DISPATCH_WEIGHTS.enterprise; }
      else if (d.tims) { type = "tradein"; weight = DISPATCH_WEIGHTS.tradein; }
      var hour = 12;
      if (d.t && d.t !== "?") { hour = parseInt(d.t.split(":")[0]) || 12; }
      var half = hour < DISPATCH_SPLIT_HOUR ? "AM" : "PM";
      var item = { d: d, type: type, weight: weight, half: half, hour: hour };
      if (half === "AM") itemsAM.push(item); else itemsPM.push(item);
    });

    var assign = {};
    Object.keys(allFloor).forEach(function(id) {
      var h = allFloor[id];
      assign[id] = { host: h, isAdmin: h.isAdmin, items: [], weightAM: 0, weightPM: 0, totalWeight: 0, counts: { enterprise: 0, tradein: 0, regular: 0 } };
    });

    function assignGroup(items, eligible) {
      items.slice().sort(function(a, b) { return b.weight - a.weight; }).forEach(function(item) {
        var best = null, bestScore = Infinity;
        eligible.forEach(function(h) {
          var bucket = assign[h.id];
          var adminPenalty = bucket.isAdmin ? 1.5 : 1.0;
          var halfWeight = item.half === "AM" ? bucket.weightAM : bucket.weightPM;
          var score = (bucket.totalWeight * adminPenalty) + (halfWeight * 0.3);
          if (score < bestScore) { bestScore = score; best = h; }
        });
        if (!best) return;
        var bucket = assign[best.id];
        bucket.items.push(item);
        bucket.totalWeight += item.weight;
        if (item.half === "AM") bucket.weightAM += item.weight;
        else bucket.weightPM += item.weight;
        bucket.counts[item.type]++;
      });
    }

    assignGroup(itemsAM, floorAM);
    assignGroup(itemsPM, floorPM);

    var usedHosts = Object.keys(assign).filter(function(id) { return assign[id].items.length > 0; });
    if (!usedHosts.length) { alert("Aucune livraison !"); return; }

    // --- PREVIEW ---
    var preview = '<h2 style="margin:0 0 20px;font-size:22px;font-weight:700">Dispatch Preview</h2>';

    // Summary
    preview += '<table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px">'
      + '<tr><th style="' + _th() + 'text-align:left">CES</th>'
      + '<th style="' + _th() + 'text-align:center">Total</th>'
      + '<th style="' + _th() + 'text-align:center;color:#60a5fa">AM</th>'
      + '<th style="' + _th() + 'text-align:center;color:#f97316">PM</th>'
      + '<th style="' + _th() + 'text-align:center">Ent.</th>'
      + '<th style="' + _th() + 'text-align:center">T-I</th>'
      + '<th style="' + _th() + 'text-align:center">Reg.</th></tr>';

    usedHosts.forEach(function(id) {
      var a = assign[id];
      var amC = a.items.filter(function(it) { return it.half === "AM"; }).length;
      var pmC = a.items.filter(function(it) { return it.half === "PM"; }).length;
      var adminTag = a.isAdmin ? ' <span style="font-size:10px;background:rgba(245,158,11,.15);color:' + DT("#f59e0b","#d97706") + ';padding:2px 8px;border-radius:10px">Admin</span>' : '';
      preview += '<tr style="' + _sep() + '">'
        + '<td style="' + _td() + 'font-weight:600">' + a.host.name + adminTag + '</td>'
        + '<td style="' + _td() + 'text-align:center;font-weight:700;font-size:18px">' + a.items.length + '</td>'
        + '<td style="' + _td() + 'text-align:center;color:#60a5fa;font-weight:600">' + amC + '</td>'
        + '<td style="' + _td() + 'text-align:center;color:#f97316;font-weight:600">' + pmC + '</td>'
        + '<td style="' + _td() + 'text-align:center">' + a.counts.enterprise + '</td>'
        + '<td style="' + _td() + 'text-align:center">' + a.counts.tradein + '</td>'
        + '<td style="' + _td() + 'text-align:center">' + a.counts.regular + '</td></tr>';
    });
    preview += '</table>';

    // Detail
    preview += '<div style="max-height:340px;overflow:auto;border:1px solid ' + DT("rgba(255,255,255,.06)","rgba(0,0,0,.08)") + ';border-radius:10px;margin-bottom:20px">'
      + '<table style="width:100%;border-collapse:collapse;font-size:12px">'
      + '<tr style="background:' + DT("rgba(255,255,255,.03)","#fafafa") + ';position:sticky;top:0;z-index:1">'
      + '<th style="' + _th() + 'text-align:left">Heure</th>'
      + '<th style="' + _th() + 'text-align:left">Client</th>'
      + '<th style="' + _th() + 'text-align:left">RN</th>'
      + '<th style="' + _th() + 'text-align:left">Type</th>'
      + '<th style="' + _th() + 'text-align:left">Host</th></tr>';

    var allItems = [];
    usedHosts.forEach(function(id) {
      assign[id].items.forEach(function(item) { allItems.push({ item: item, host: assign[id].host }); });
    });
    allItems.sort(function(a, b) {
      if (a.item.half !== b.item.half) return a.item.half === "AM" ? -1 : 1;
      return a.item.hour - b.item.hour;
    });

    var lastHalf = "";
    allItems.forEach(function(entry, idx) {
      var item = entry.item;
      if (item.half !== lastHalf) {
        lastHalf = item.half;
        var halfLabel = item.half === "AM" ? "MATIN" : "APRES-MIDI";
        var halfBg = item.half === "AM" ? "rgba(96,165,250,.08)" : "rgba(249,115,22,.08)";
        var halfCol = item.half === "AM" ? "#60a5fa" : "#f97316";
        preview += '<tr><td colspan="5" style="padding:8px 12px;background:' + halfBg + ';color:' + halfCol + ';font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.5px">' + halfLabel + '</td></tr>';
      }
      var rowBg = idx % 2 === 0 ? "transparent" : DT("rgba(255,255,255,.02)","#fafafa");
      var typeLabel = item.type === "enterprise" ? '<span style="color:#c084fc;font-weight:600">Ent.</span>'
        : item.type === "tradein" ? '<span style="color:#f97316;font-weight:600">T-I</span>'
        : '<span style="color:' + DT("#71717a","#999") + '">Reg.</span>';

      preview += '<tr style="' + _sep() + 'background:' + rowBg + '">'
        + '<td style="' + _td() + 'font-weight:500">' + item.d.t + ' <span style="font-size:10px;color:' + (item.half === "AM" ? "#60a5fa" : "#f97316") + '">' + item.half + '</span></td>'
        + '<td style="' + _td() + '">' + item.d.name + '</td>'
        + '<td style="' + _td() + 'color:#60a5fa">' + item.d.rn + '</td>'
        + '<td style="' + _td() + '">' + typeLabel + '</td>'
        + '<td style="' + _td() + 'font-weight:600">' + entry.host.name.split(" ")[0] + '</td></tr>';
    });
    preview += '</table></div>';

    // Buttons
    preview += '<div style="display:flex;gap:10px">'
      + '<button id="dex" style="flex:2;' + _btn("", "success") + '">Execute Dispatch</button>'
      + '<button id="dbk" style="flex:1;' + _btn("", "default") + '">Back</button>'
      + '<button id="dca" style="flex:1;' + _btn("", "danger") + '">Cancel</button>'
      + '</div>';

    box.innerHTML = preview;
    document.getElementById("dca").onclick = function() { modal.remove(); };
    document.getElementById("dbk").onclick = function() { modal.remove(); DISPATCH(); };

    document.getElementById("dex").onclick = async function() {
      document.getElementById("dex").textContent = "Dispatching...";
      document.getElementById("dex").disabled = true;
      var ok = 0, fail = 0, skip = 0;
      for (var k = 0; k < usedHosts.length; k++) {
        var a = assign[usedHosts[k]];
        for (var di = 0; di < a.items.length; di++) {
          try {
            if (a.items[di].d.hostId && a.items[di].d.hostId == a.host.id) { skip++; ok++; continue; }
            var r = await fetch(BASE + "/deliveryops/Customers/UpdateHost?referenceNumber=" + a.items[di].d.rn + "&value=" + a.host.id, {
              method: "POST", headers: { "Authorization": AUTH.token, "Content-Type": "application/json", "userid": AUTH.userId }
            });
            if (r.ok) ok++; else fail++;
          } catch (e) { fail++; }
        }
      }
      modal.remove();
      alert("Dispatch terminé !\n" + ok + " assignés (" + skip + " inchangés) / " + fail + " erreurs");
      L();
    };
  };
}
