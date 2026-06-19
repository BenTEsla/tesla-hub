
// Helper: fetch wrapper that mimics GM_xmlhttpRequest interface
function fetch_amp(opts) {
  fetch(opts.url, {
    method: opts.method || 'POST',
    headers: opts.headers || {},
    body: opts.data || null,
    credentials: 'include'
  }).then(function(r) { return r.text(); })
    .then(function(text) { if (opts.onload) opts.onload({ responseText: text }); })
    .catch(function() { if (opts.onerror) opts.onerror(); });
}

// Add floating button to launch dashboard
(function() {
  var launchBtn = document.createElement('div');
  launchBtn.id = 'tdh-launch';
  launchBtn.innerHTML = 'DELIVERY HUB';
  launchBtn.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:99998;background:#171a20;color:#fff;padding:12px 24px;border-radius:30px;cursor:pointer;font-family:Segoe UI,sans-serif;font-size:13px;font-weight:600;letter-spacing:2px;box-shadow:0 4px 12px rgba(0,0,0,0.3);transition:transform 0.2s';
  launchBtn.onmouseover = function() { this.style.transform = 'scale(1.05)'; };
  launchBtn.onmouseout = function() { this.style.transform = 'scale(1)'; };
  launchBtn.onclick = function() { launchDashboard(); };
  document.body.appendChild(launchBtn);
})();

function launchDashboard() {
(function() {
  // === Tesla Delivery Hub Dashboard v1 ===
  // Injected into DRO page to bypass CORS

  // === AUTH: try multiple sources ===
  var AUTH = null;

  // Source 1: localStorage tokens
  var tokenKeys = ['delops_id_token', 'delops_id_token_data', 'delops_id_warp_token'];
  var userId = (localStorage.getItem('UserId')||'').replace(/^"|"$/g, '');
  for (var ki = 0; ki < tokenKeys.length; ki++) {
    var rawToken = (localStorage.getItem(tokenKeys[ki])||'').replace(/^"|"$/g, '');
    if (rawToken && rawToken.length > 100 && userId) {
      AUTH = { token: 'Bearer ' + rawToken, userId: userId };
      break;
    }
  }

  // Source 2: monkey-patch fetch to capture from DRO's API calls
  if (!AUTH) {
    var _origFetch = window.fetch;
    window.fetch = function() {
      var url = (typeof arguments[0] === 'string') ? arguments[0] : (arguments[0]?.url || '');
      var opts = arguments[1] || {};
      var hdrs = opts.headers || {};
      if (url.indexOf('mytdeliveryopsapi') >= 0 && (hdrs['Authorization'] || hdrs['authorization'])) {
        if (!AUTH) {
          AUTH = { token: hdrs['Authorization'] || hdrs['authorization'], userId: hdrs['userid'] || hdrs['UserId'] || userId || '' };
        }
      }
      return _origFetch.apply(this, arguments);
    };
  }

  // Remove existing
  document.getElementById('tdh-overlay')?.remove();

  // Config
  const HUB = { name: 'Rennes Saint-Jacques', trtId: 28498, countryCode: 'FR' };
  const CES = ['Ben Daubin', 'Sacha Villa', 'Sophie MACE'];
  const BASE = 'https://mytdeliveryopsapi.tesla.com/api';

  // FR translations
  const FR = {
    'Pearl White':'Blanc perle','Diamond Black':'Noir Diamant','Stealth Grey':'Gris Stealth',
    'Midnight Silver Metallic':'Gris Nuit Metallise','Red Multi-Coat':'Rouge Multi-Couches',
    'Ultra Red':'Rouge Ultra','Quicksilver':'Quicksilver','Glacier Blue':'Bleu Glacier',
    'Frost Blue':'Bleu Givre','Midnight Cherry Red':'Rouge Cerise',
  };
  const tr = s => FR[s] || s;
  const payText = t => ({CASH:'CASH',TESLA_LEASING:'LEASING',TESLA_LENDING:'CREDIT',THIRD_PARTY_LEASING:'LLD TIERS'})[t] || t;
  const payClass = t => ({CASH:'cash',TESLA_LEASING:'leasing',TESLA_LENDING:'credit',THIRD_PARTY_LEASING:'lld'})[t] || 'enterprise';

  // Dates
  const today = new Date();
  const tomorrow = new Date(Date.now() + 86400000);
  const fmtDate = d => d.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
  const isoDate = d => d.toISOString().split('T')[0];

  // === CREATE OVERLAY ===
  const ov = document.createElement('div');
  ov.id = 'tdh-overlay';
  ov.style.cssText = 'position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;background:#fff;overflow-y:auto;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#393c41;font-size:14px';

  ov.innerHTML = '<style>'
    + '#tdh-overlay *{box-sizing:border-box;margin:0;padding:0}'
    + '.t-header{height:48px;background:#fff;border-bottom:1px solid #e5e5e5;display:flex;align-items:center;padding:0 24px}'
    + '.t-header .logo{font-size:16px;font-weight:600;letter-spacing:3px;color:#171a20}'
    + '.t-header .sep{margin:0 12px;color:#ccc}'
    + '.t-header .app{font-size:14px;color:#5c5e62}'
    + '.t-header .right{margin-left:auto;font-size:14px;color:#5c5e62}'
    + '.t-title{padding:24px 24px 8px;font-size:26px;font-weight:600;color:#171a20}'
    + '.t-bar{padding:16px 24px;display:flex;align-items:center;gap:8px}'
    + '.pill{padding:7px 18px;border-radius:20px;border:1px solid #d0d0d0;background:#fff;cursor:pointer;font-size:14px;color:#5c5e62;font-family:inherit}'
    + '.pill:hover{background:#f5f5f5}'
    + '.pill.on{background:#171a20;color:#fff;border-color:#171a20}'
    + '.sep2{width:1px;height:24px;background:#e0e0e0;margin:0 8px}'
    + '.sel{padding:7px 14px;border:1px solid #d0d0d0;border-radius:8px;font-size:14px;font-family:inherit}'
    + '.btn{padding:7px 18px;border-radius:20px;border:none;font-size:14px;font-family:inherit;font-weight:500;cursor:pointer}'
    + '.btn-p{background:#3e6ae1;color:#fff}'
    + '.btn-g{background:#28a745;color:#fff}'
    + '.btn-l{background:#f0f0f0;color:#5c5e62}'
    + '.stats{margin-left:auto;display:flex;gap:32px}'
    + '.stat-n{font-size:26px;font-weight:300;text-align:center}'
    + '.stat-l{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#999;text-align:center}'
    + '.wrap{padding:8px 24px 24px}'
    + '.tbl{width:100%;border-collapse:collapse}'
    + '.tbl th{padding:12px 14px;text-align:left;font-size:12px;color:#888;font-weight:500;border-bottom:1px solid #e5e5e5}'
    + '.tbl td{padding:14px 14px;font-size:14px;border-bottom:1px solid #f0f0f0;vertical-align:middle}'
    + '.tbl tr:hover td{background:#fafbff}'
    + '.tbl tr.wn td{background:#fffdf5}'
    + '.tbl tr.bd td{background:#fef8f8}'
    + '.ck{width:17px;height:17px;accent-color:#3e6ae1;cursor:pointer}'
    + '.bg{display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:600}'
    + '.bg.cash{background:#e6f4ea;color:#1e7e34}.bg.leasing{background:#e3f2fd;color:#1565c0}'
    + '.bg.credit{background:#ede7f6;color:#6a1b9a}.bg.lld{background:#fff8e1;color:#f57f17}'
    + '.bg.enterprise{background:#eceff1;color:#37474f}'
    + '.dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}'
    + '.dot.g{background:#28a745}.dot.r{background:#dc3545}.dot.o{background:#f0ad4e}'
    + '.nm{font-weight:600;cursor:pointer;color:#171a20;font-size:14px}.nm:hover{color:#3e6ae1}'
    + '.tm{font-size:15px;font-weight:500;color:#171a20}'
    + '.pl{font-family:SFMono-Regular,Consolas,monospace;font-weight:600;font-size:13px}'
    + '.ld{text-align:center;padding:80px;font-size:15px;color:#999}'
    + '.sp{display:inline-block;width:22px;height:22px;border:2.5px solid #eee;border-top-color:#3e6ae1;border-radius:50%;animation:sp .7s linear infinite;margin-right:10px;vertical-align:middle}'
    + '@keyframes sp{to{transform:rotate(360deg)}}'
    + '.pv{position:fixed;top:0;right:0;width:45vw;height:100vh;background:#fff;box-shadow:-4px 0 24px rgba(0,0,0,.12);z-index:100000;overflow-y:auto;display:none;padding:28px}'
    + '.pv-close{position:absolute;top:14px;right:18px;font-size:22px;cursor:pointer;color:#999;background:none;border:none}'
    + '</style>'

    + '<div class="t-header"><span class="logo">TESLA</span><span class="sep">|</span><span class="app">Delivery Hub</span><span class="right">Ben Daubin</span></div>'
    + '<div class="t-title">Delivery Dashboard</div>'

    + '<div class="t-bar">'
    + '<button class="pill on" data-f="all">Tous</button>'
    + CES.map(c => '<button class="pill" data-f="' + c + '">' + c.split(' ')[0] + '</button>').join('')
    + '<div class="sep2"></div>'
    + '<select class="sel" id="tdh-date">'
    + '<option value="' + isoDate(today) + '">Aujourd\'hui - ' + fmtDate(today) + '</option>'
    + '<option value="' + isoDate(tomorrow) + '">Demain - ' + fmtDate(tomorrow) + '</option>'
    + '</select>'
    + '<button class="btn btn-p" id="tdh-load">Charger</button>'
    + '<button class="btn btn-g" id="tdh-gen" style="display:none">Generer PDFs</button>'
    + '<button class="btn btn-l" onclick="document.getElementById(\'tdh-overlay\').remove()">Fermer</button>'
    + '<div class="stats"><div><div class="stat-n" id="s-tot">-</div><div class="stat-l">Livraisons</div></div>'
    + '<div><div class="stat-n" id="s-ok">-</div><div class="stat-l">Pretes</div></div>'
    + '<div><div class="stat-n" id="s-al">-</div><div class="stat-l">Alertes</div></div></div>'
    + '</div>'

    + '<div class="wrap">'
    + '<div class="ld" id="tdh-ld" style="display:none"><span class="sp"></span> Chargement...</div>'
    + '<table class="tbl" id="tdh-tbl" style="display:none"><thead><tr>'
    + '<th style="width:40px"><input type="checkbox" class="ck" id="tdh-sa" checked/></th>'
    + '<th>Heure</th><th>Client</th><th>Vehicule</th><th>Plaque</th><th>Paiement</th><th>Trade-In</th><th>OTG</th><th>Assurance</th>'
    + '</tr></thead><tbody id="tdh-tb"></tbody></table></div>'

    + '<div class="pv" id="tdh-pv"><button class="pv-close" onclick="document.getElementById(\'tdh-pv\').style.display=\'none\'">&times;</button><div id="tdh-pc"></div></div>';

  document.body.appendChild(ov);

  // === FILTER LOGIC ===
  ov.querySelectorAll('.pill[data-f]').forEach(btn => {
    btn.addEventListener('click', () => {
      ov.querySelectorAll('.pill[data-f]').forEach(b => b.classList.remove('on'));
      btn.classList.add('on');
      const f = btn.dataset.f;
      ov.querySelectorAll('#tdh-tb tr').forEach(r => {
        if (f === 'all') { r.style.display = ''; return; }
        var host = (r.dataset.host || '').toLowerCase();
        var filter = f.toLowerCase();
        r.style.display = host.includes(filter.split(' ')[0].toLowerCase()) ? '' : 'none';
      });
    });
  });

  // === LOAD ===
  document.getElementById('tdh-load').addEventListener('click', async () => {
    const ld = document.getElementById('tdh-ld');
    const tbl = document.getElementById('tdh-tbl');
    const tb = document.getElementById('tdh-tb');
    ld.style.display = ''; tbl.style.display = 'none';

    ld.innerHTML = '<span class="sp"></span> Chargement des livraisons...';
    if (!AUTH) {
      ld.innerHTML = 'Token non trouve.<br><br><button onclick="location.reload()" style="padding:10px 24px;background:#3e6ae1;color:#fff;border:none;border-radius:20px;font-size:14px;cursor:pointer">Rafraichir DRO et reessayer</button>';
      return;
    }
    const h = { 'Authorization': AUTH.token, 'Content-Type': 'application/json', 'userid': AUTH.userId };
    const dateStr = document.getElementById('tdh-date').value;

    try {
      // API 1: DRO Dashboard
      const dash = await fetch(BASE + '/deliveryops/Customers/Dashboard', {
        method:'POST', headers:h,
        body:JSON.stringify({ fromDeliveryDate:dateStr, trtId:HUB.trtId, customerHasNoHost:false, skip:0, take:200, fromTime:'00:00', toTime:'23:59', countryCode:HUB.countryCode, onlyMyLocation:true, sort:{}, stage:[], status:[], deliveryType:[], paperwork:[], customerDeliveryStatus:[], inboundStatus:[], VehicleTypes:[], pdcFilter:[], dmvDocumentStages:[] })
      }).then(r => r.json());

      const droMap = {};
      dash.Data.forEach(d => { droMap[d.ReferenceNumber] = d; });
      const allRNs = Object.keys(droMap);

      if (allRNs.length === 0) {
        ld.innerHTML = 'Aucune livraison trouvee pour cette date.';
        return;
      }

      // API 2: Advisor Dashboard
      const advisor = await fetch(BASE + '/advisor/Dashboard?isSidePanelFullScreen=true', {
        method:'POST', headers:h,
        body:JSON.stringify({ condition:'and', rules:[{ condition:'and', ReferenceNumbers:allRNs, Countries:[] }], Skip:0, Take:200, SortOrder:[], SelectedColumns:[] })
      }).then(r => r.json());

      // Build items
      var tiClients = advisor.Data.Dashboard.filter(function(a) { return a.TradeInActionStatus === 'COMPLETE_TRADE_IN'; });
      var tiResults = {};
      await Promise.all(tiClients.map(function(a) {
        return fetch(BASE + '/widget/GetTradeInWidgetInfo?referenceNumber=' + a.ReferenceNumber + '&vehicleMapId=' + a.VehicleMapId + '&deliveryState=' + encodeURIComponent(a.DeliveryState||''), { headers:h })
          .then(function(r) { return r.json(); })
          .then(function(j) {
            if (j.Data) {
              tiResults[a.ReferenceNumber] = { make: (j.Data.Make||'').replace(/_/g,' '), model: j.Data.Model||'', plate: '', vin: j.Data.VIN||'', acqId: j.Data.AcquisitionId||'' };
            } else {
              tiResults[a.ReferenceNumber] = { make: '', model: '', plate: '', vin: '', acqId: '' };
            }
          })
          .catch(function() { tiResults[a.ReferenceNumber] = { make: '', model: '', plate: '', vin: '', acqId: '' }; });
      }));

      const items = advisor.Data.Dashboard.map(a => {
        const dro = droMap[a.ReferenceNumber] || {};
        const droTime = dro.ScheduledDeliveryStartDateString || '';
        var time24 = '?';
        var tMatch = droTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (tMatch) {
          var hr = parseInt(tMatch[1]);
          if (tMatch[3].toUpperCase() === 'PM' && hr < 12) hr += 12;
          if (tMatch[3].toUpperCase() === 'AM' && hr === 12) hr = 0;
          time24 = String(hr).padStart(2, '0') + ':' + tMatch[2];
        }
        var hasTI = a.TradeInActionStatus === 'COMPLETE_TRADE_IN';
        var hasPlate = !!(a.LicensePlate && a.LicensePlate.trim());
        var insurOK = a.InsuranceActionStatus === 'COMPLETE';
        var otg = a.VehicleStage === 'Finished Goods' || a.VehicleStage === 'Arrived at VRL' || (a.DetailedVehicleStatus && a.DetailedVehicleStatus.includes('Arrived'));
        var vehicleStage = a.VehicleStage || dro.MOSStage || '';
        var alerts = [];
        if (!hasPlate) alerts.push('Plaque manquante');
        if (!otg) alerts.push('Vehicule pas sur site');

        return {
          rn:a.ReferenceNumber, vin:a.Vin, name:a.CustomerName,
          time24:time24, model:a.VehicleModel, color:tr(a.VehicleColor||''),
          colorCode:a.VehicleColorCode, plate:(a.LicensePlate||'').trim(),
          payType:a.OrderType, host:dro.HostName||'???',
          da:a.DeliverySpecialistName||'???', sa:a.SalesAdvisorName||'???',
          hasTI:hasTI, insurOK:insurOK, hasPlate:hasPlate, alerts:alerts,
          isB2B:a.IsEnterpriseOrder, referral:!!a.ReferralCode,
          otg:otg, vehicleStage:vehicleStage,
          trim:a.VehicleTrim, interior:a.VehicleInterior, wheel:a.VehicleWheel,
          phone:a.CustomerPhone, email:a.CustomerEmail,
          regAddr:(a.RegistrationAddress||'')+', '+(a.RegistrationCity||''),
          config:a.ConfigurationString, vehicleMapId:a.VehicleMapId,
          battery:dro.VehicleCharge, insurance:a.InsuranceActionStatus,
          optionCodes:a.OptionCodes||'',
          tradeInMake: tiResults[a.ReferenceNumber] ? tiResults[a.ReferenceNumber].make : null,
          tradeInModel: tiResults[a.ReferenceNumber] ? tiResults[a.ReferenceNumber].model : null,
          tradeInPlate: tiResults[a.ReferenceNumber] ? tiResults[a.ReferenceNumber].plate : null,
          tradeInVin: tiResults[a.ReferenceNumber] ? tiResults[a.ReferenceNumber].vin : null
        };
      }).sort(function(a, b) { return a.time24.localeCompare(b.time24); });

      window._tdhData = items;

      // Render
      var html = '';
      for (var i = 0; i < items.length; i++) {
        var d = items[i];
        var rowClass = d.alerts.length > 0 ? (d.hasPlate ? 'wn' : 'bd') : '';
        html += '<tr data-host="' + d.host + '" data-idx="' + i + '" class="' + rowClass + '">'
          + '<td><input type="checkbox" class="ck rc" data-idx="' + i + '" ' + (d.alerts.length === 0 ? 'checked' : '') + '/></td>'
          + '<td><span class="tm">' + d.time24 + '</span></td>'
          + '<td><span class="nm" data-idx="' + i + '">' + d.name + '</span><br><span style="font-size:10px;color:#999">' + d.rn + '</span></td>'
          + '<td><strong>' + d.model + '</strong><br><span style="font-size:11px;color:#666">' + d.color + '</span></td>'
          + '<td>' + (d.hasPlate ? '<span class="pl">' + d.plate + '</span>' : '<span class="dot r"></span><span style="color:#ef4444;font-size:11px">Manquante</span>') + '</td>'
          + '<td><span class="bg ' + payClass(d.payType) + '">' + (d.isB2B ? 'ENTERPRISE' : payText(d.payType)) + '</span></td>'
          + '<td>' + (d.hasTI ? '<span class="dot g"></span>' + (d.tradeInMake ? d.tradeInMake + ' ' + (d.tradeInModel||'') : 'Oui') : '<span style="color:#ccc">Non</span>') + '</td>'
          + '<td>' + (d.otg ? '<span class="dot g"></span>Oui' : '<span class="dot o"></span><span style="font-size:11px;color:#d97706">' + (d.vehicleStage || 'Non') + '</span>') + '</td>'
          + '<td>' + (d.insurOK ? '<span class="dot g"></span>OK' : '<span style="color:#999;font-size:11px">Non</span>') + '</td>'
          + '</tr>';
      }
      tb.innerHTML = html;

      // Stats
      var ok = items.filter(function(d) { return d.alerts.length === 0; }).length;
      document.getElementById('s-tot').textContent = items.length;
      document.getElementById('s-ok').textContent = ok;
      document.getElementById('s-al').textContent = items.length - ok;

      ld.style.display = 'none';
      tbl.style.display = '';
      document.getElementById('tdh-gen').style.display = '';

      // Select all
      document.getElementById('tdh-sa').addEventListener('change', function(e) {
        ov.querySelectorAll('.rc').forEach(function(c) {
          if (c.closest('tr').style.display !== 'none') c.checked = e.target.checked;
        });
      });

      // Preview click
      ov.querySelectorAll('.nm').forEach(function(el) {
        el.addEventListener('click', function() {
          var idx = parseInt(el.dataset.idx);
          var d = window._tdhData[idx];
          var pv = document.getElementById('tdh-pv');
          var pc = document.getElementById('tdh-pc');
          pv.style.display = 'block';
          pc.innerHTML = '<div style="padding:4px">'
            + '<h2 style="font-weight:300;font-size:28px;margin-bottom:4px">' + d.name + '</h2>'
            + '<p style="color:#999;font-size:14px">' + d.rn + ' - ' + d.time24 + '</p>'
            + '<hr style="margin:16px 0;border:none;border-top:1px solid #eee">'
            + '<div style="display:flex;gap:16px;margin-bottom:16px">'
            + '<div style="flex:1;border:1.5px solid #e5e5e5;border-radius:12px;padding:14px"><h4 style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#aaa;margin:0 0 8px">Vehicule</h4><p style="font-size:16px;font-weight:600;margin:0">' + d.model + '</p><p style="font-size:12px;color:#666;margin:4px 0">' + d.color + ' - ' + (d.interior||'') + '</p><p style="font-size:12px;color:#666;margin:0">' + (d.wheel||'') + '</p></div>'
            + '<div style="flex:1;border:1.5px solid #e5e5e5;border-radius:12px;padding:14px"><h4 style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#aaa;margin:0 0 8px">Identification</h4><p style="font-size:28px;font-weight:700;letter-spacing:3px;margin:0;font-family:monospace">' + (d.plate||'-') + '</p><p style="font-size:12px;color:#999;margin:8px 0 0;font-family:monospace">' + d.vin + '</p></div>'
            + '</div>'
            + '<div style="display:flex;gap:16px;margin-bottom:16px">'
            + '<div style="flex:1;border:1.5px solid #e5e5e5;border-radius:12px;padding:14px"><h4 style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#aaa;margin:0 0 8px">Contact</h4><p style="font-size:15px;font-weight:600;margin:0">' + (d.phone||'-') + '</p><p style="font-size:11px;color:#777;margin:4px 0">' + (d.email||'') + '</p><p style="font-size:11px;color:#555;margin:4px 0">' + d.regAddr + '</p></div>'
            + '<div style="flex:1;border:1.5px solid ' + (d.hasTI ? '#fde68a' : '#fecaca') + ';border-radius:12px;padding:14px;background:' + (d.hasTI ? '#fffbeb' : '#fef2f2') + '"><h4 style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#aaa;margin:0 0 8px">Trade-In</h4><p style="font-size:14px;font-weight:600;margin:0;color:' + (d.hasTI ? '#92400e' : '#dc2626') + '">' + (d.hasTI ? 'Reprise confirmee' : 'Aucune reprise') + '</p></div>'
            + '<div style="flex:1;border:1.5px solid #c8e6c9;border-radius:12px;padding:14px;background:#f0faf0;display:flex;align-items:center;justify-content:center"><span style="font-size:24px;font-weight:700;color:#2e7d32">' + (d.isB2B ? 'ENTERPRISE' : payText(d.payType)) + '</span></div>'
            + '</div>'
            + '<div style="display:flex;gap:16px">'
            + '<div style="flex:1;border:1.5px solid #e5e5e5;border-radius:12px;padding:14px"><h4 style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#aaa;margin:0 0 8px">Equipe</h4><p style="font-size:8px;color:#aaa;letter-spacing:1px;margin:0">DELIVERY ADVISOR</p><p style="font-size:14px;font-weight:600;margin:2px 0 10px">' + d.da + '</p><p style="font-size:8px;color:#aaa;letter-spacing:1px;margin:0">SALES ADVISOR</p><p style="font-size:14px;font-weight:600;margin:2px 0 0">' + d.sa + '</p></div>'
            + '<div style="flex:1;border:1.5px solid #e5e5e5;border-radius:12px;padding:14px"><h4 style="font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#aaa;margin:0 0 8px">Status</h4>'
            + '<p style="margin:6px 0"><span class="dot ' + (d.referral?'g':'r') + '"></span><span style="font-size:11px">Parrainage: <strong>' + (d.referral?'Oui':'Non') + '</strong></span></p>'
            + '<p style="margin:6px 0"><span class="dot ' + (d.insurOK?'g':'r') + '"></span><span style="font-size:11px">Assurance: <strong>' + (d.insurOK?'Validee':'Non validee') + '</strong></span></p>'
            + '<p style="margin:6px 0"><span class="dot ' + (d.hasPlate?'g':'r') + '"></span><span style="font-size:11px">Plaque: <strong>' + (d.hasPlate?'Attribuee':'Manquante') + '</strong></span></p>'
            + '</div></div>'
            + (d.alerts.length > 0 
              ? '<div style="margin-top:16px;padding:14px;background:#fef2f2;border-radius:10px;border:1px solid #fecaca;color:#dc2626"><strong>Alertes:</strong> ' + d.alerts.join(', ') + '</div>'
              : '<div style="margin-top:16px;padding:14px;background:#f0fdf4;border-radius:10px;border:1px solid #bbf7d0;color:#16a34a">Pret pour la livraison</div>')
            + '</div>';
        });
      });

    } catch(err) {
      ld.innerHTML = 'Erreur: ' + err.message;
    }
  });

  // === GENERATE PDFs BUTTON (outside load handler) ===
  document.getElementById('tdh-gen').addEventListener('click', function() {
    try {
    var data = window._tdhData || [];
    var checked = [];
    // Get checked items from VISIBLE rows only
    var overlay = document.getElementById('tdh-overlay');
    if (overlay) {
      overlay.querySelectorAll('.rc:checked').forEach(function(c) {
        var tr = c.closest('tr');
        if (tr && tr.style.display !== 'none') {
          var idx = parseInt(c.dataset.idx);
          if (data[idx]) checked.push(data[idx]);
        }
      });
    }
    if (checked.length === 0) { alert('Aucune livraison selectionnee !'); return; }

    var trimFR = function(t) {
      if (!t) return '';
      var m = t.indexOf('Model 3') >= 0 ? 'MODEL 3' : 'MODEL Y';
      if (t.indexOf('Long Range') >= 0 && t.indexOf('AWD') >= 0) return m + ' GRANDE AUTONOMIE';
      if (t.indexOf('Long Range') >= 0) return m + ' GRANDE AUTONOMIE';
      return m;
    };
    var motorFR = function(t) {
      if (!t) return '';
      if (t.indexOf('AWD') >= 0) return 'TRANSMISSION INTEGRALE';
      return 'PROPULSION';
    };
    var wheelFR = function(w) { return w ? 'Jantes ' + w.replace(/ Wheels/g,'').replace(/ Refresh/g,'') : ''; };
    var insurLabel = function(s) { return s === 'COMPLETE' ? 'Validee' : 'Non validee'; };
    var colorFR = function(c) {
      var map = {'Pearl White':'Blanc perle','Diamond Black':'Noir Diamant','Stealth Grey':'Gris Stealth','Marine Blue':'Bleu Marine','Midnight Silver Metallic':'Gris Nuit','Red Multi-Coat':'Rouge','Ultra Red':'Rouge Ultra','Quicksilver':'Quicksilver','Glacier Blue':'Bleu Glacier','Frost Blue':'Bleu Givre','Midnight Cherry Red':'Rouge Cerise'};
      return map[c] || c || '';
    };
    var interiorFR = function(i) {
      var map = {'All Black Premium Interior':'Interieur noir Premium','All Black Interior':'Interieur noir','Black and White Premium Interior':'Interieur noir & blanc Premium','Cream Premium Interior':'Interieur creme Premium'};
      return map[i] || i || '';
    };

    // Date for header
    var dateStr = document.getElementById('tdh-date')?.value || '';
    var dateObj = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
    var dateFR = dateObj.toLocaleDateString('fr-FR', {day:'numeric', month:'long', year:'numeric'});

    var badColors = ['$PMTG','$PN01','$PR01','$PBSB','$PPSB','$PMNG'];

    var pages = '';
    for (var i = 0; i < checked.length; i++) {
      var d = checked[i];
      var hasTI = d.hasTI;
      var mdl = d.model === 'Model 3' ? 'm3' : 'my';
      var cc = d.colorCode || '$PPSW';
      var isBadColor = badColors.indexOf(cc) >= 0;
      var imgUrl = 'https://static-assets.tesla.com/configurator/compositor?options=' + cc + '&model=' + mdl + '&view=STUD_3QTR&size=800';
      var trimLabel = trimFR(d.trim);
      var motorLabel = motorFR(d.trim);
      var modelLine = trimLabel + (motorLabel ? ',  ' + motorLabel : '');
      var imgUrl = 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&model=' + mdl + '&view=STUD_3QTR&bkba_opt=1&options=' + (d.optionCodes||cc) + '&size=1820';
      var carSection = '<div class="car-wrap"><div class="model-label">' + modelLine + '</div><img src="' + imgUrl + '" style="max-width:100%;width:500px;height:auto;margin:12px auto;display:block" onerror="this.outerHTML=\'<div style=padding:20px;font-size:28px;font-weight:200;color:#999;letter-spacing:4px>' + colorFR(d.color) + '</div>\'"/></div>';

      // Trade-in content
      var tiContent;
      if (hasTI && d.tradeInMake) {
        tiContent = '<div class="val" style="font-size:14px">' + d.tradeInMake + ' ' + (d.tradeInModel||'') + '</div>';
        if (d.tradeInPlate) {
          tiContent += '<div style="margin-top:8px"><span class="lbl">IMMATRICULATION</span><br><span style="font-size:16px;font-weight:700;letter-spacing:2px">' + d.tradeInPlate + '</span></div>';
        }
        if (d.tradeInVin) {
          tiContent += '<div style="margin-top:6px"><span class="lbl">VIN</span><br><span style="font-size:10px;font-family:monospace">' + d.tradeInVin + '</span></div>';
        }
      } else {
        tiContent = '<div style="text-align:center;flex:1;display:flex;align-items:center;justify-content:center"><span style="font-size:14px;font-weight:600;color:#dc2626">Aucune reprise</span></div>';
      }

      // Client type (new/existing) based on referral
      var isNewClient = d.referral ? 'Nouveau' : 'Existant';

      pages += '<div class="page">'
        + '<div class="hero"><div class="hero-top"><div><h1>' + d.name + '</h1><div class="rn">' + d.rn + '</div></div><div style="text-align:right"><div class="time">' + d.time24 + '</div><div class="date">' + dateFR + '</div></div></div></div>'
        + carSection
        + '<div class="divider"></div>'
        + '<div class="body">'
        // Row 1: Vehicule (with battery, NO motorisation) + Identification (plaque first, vin second)
        + '<div class="row"><div class="card" style="position:relative"><h4>Vehicule - Neuf</h4>' + (d.battery ? '<div style="position:absolute;top:10px;right:14px;font-size:12px;font-weight:600;color:#2e7d32">&#x1f50b; ' + d.battery + '%</div>' : '') + '<div class="val">' + d.model + '</div><div style="margin-top:4px"><div class="ci">- ' + colorFR(d.color) + '</div><div class="ci">- ' + interiorFR(d.interior) + '</div><div class="ci">- ' + wheelFR(d.wheel) + '</div></div></div>'
        + '<div class="card"><h4>Identification</h4><div style="margin-top:2px"><span class="lbl">IMMATRICULATION</span><br><span style="font-size:26px;font-weight:700;letter-spacing:3px">' + (d.plate||'?') + '</span></div><div style="margin-top:12px"><span class="lbl">VIN</span><br><span style="font-size:22px;font-weight:700;font-family:monospace;letter-spacing:1.5px">' + (d.vin||'-') + '</span></div></div></div>'
        // Row 2: Contact + Trade-In (make/model/plaque) + Paiement (always payment type, never ENTERPRISE)
        + '<div class="row"><div class="card"><h4>Contact</h4><div class="val" style="font-size:14px">' + (d.phone||'-') + '</div><div class="sub">' + (d.email||'') + '</div><div class="sub" style="margin-top:8px;font-size:9.5px;color:#555">' + (d.regAddr||'') + '</div></div>'
        + '<div class="card ' + (hasTI ? 'ti' : 'ti-no') + '"><h4>Trade-In</h4>' + tiContent + '</div>'
        + '<div class="card pay"><h4>Paiement</h4><div class="pc"><span style="font-size:28px;font-weight:700;color:#2e7d32">' + payText(d.payType) + '</span></div></div></div>'
        // Row 3: Options & Accessoires + Equipe + Status (client/parrainage/assurance)
        + '<div class="row"><div class="card"><h4>Options & Accessoires</h4><div style="margin-top:2px"><span class="lbl">ACCESSOIRES</span><br><span class="sub">Aucun</span></div><div style="margin-top:8px"><span class="lbl">FSD (FULL SELF-DRIVING)</span><br><span style="display:inline-block;padding:2px 10px;border-radius:10px;font-size:9px;font-weight:600;background:#999;color:white">Non souscrit</span></div></div>'
        + '<div class="card"><h4>Equipe</h4><div><span class="lbl">DELIVERY ADVISOR</span><br><span style="font-size:14px;font-weight:600">' + d.da + '</span></div><div style="margin-top:8px"><span class="lbl">SALES ADVISOR</span><br><span style="font-size:14px;font-weight:600">' + d.sa + '</span></div></div>'
        + '<div class="card"><h4>Status</h4><div class="sr"><span class="sd ' + (d.referral?'b':'g') + '"></span><span class="sl">Client</span><span class="sv">' + isNewClient + '</span></div><div class="sr"><span class="sd ' + (d.referral?'p':'r') + '"></span><span class="sl">Parrainage</span><span class="sv">' + (d.referral?'Oui':'Non') + '</span></div><div class="sr"><span class="sd ' + (d.insurOK?'g':'r') + '"></span><span class="sl">Assurance</span><span class="sv">' + insurLabel(d.insurance) + '</span></div></div></div>'
        + '</div>'
        // Notes
        + '<div class="nf"><h4>Notes</h4><div class="nb"></div></div>'
        // Parcours client
        + '<div style="padding:0 42px;margin:6px 0"><span style="font-size:7px;text-transform:uppercase;letter-spacing:2px;color:#ccc;font-weight:600">PARCOURS CLIENT</span><p style="font-size:9px;color:#aaa;line-height:1.5;font-style:italic;margin-top:3px">Parcours client en cours de collecte. Commande passee, paiement finalise. Taches completees dans les delais.</p></div>'
        // Footer
        + '<div class="footer"><span>' + d.host + '</span><span class="tesla">T E S L A</span></div>'
        + '</div>';
    }

    // Show pages directly in the overlay (no popup needed)
    var overlay = document.getElementById('tdh-overlay');
    overlay.innerHTML = '<style>'
      + '@page{size:A4 portrait;margin:0}*{box-sizing:border-box;margin:0;padding:0}'
      + '#tdh-overlay{font-family:Segoe UI,Helvetica Neue,Arial,sans-serif;color:#171a20;background:#fff}'
      + '.page{width:210mm;min-height:297mm;overflow:hidden;display:flex;flex-direction:column;page-break-after:always;margin:0 auto;box-shadow:0 2px 12px rgba(0,0,0,0.1);margin-bottom:20px}'
      + '.hero{padding:26px 42px 0}.hero-top{display:flex;justify-content:space-between;align-items:flex-start}'
      + '.hero h1{font-size:36px;font-weight:300}.rn{font-size:16px;color:#555;margin-top:5px;font-weight:600;letter-spacing:1px}'
      + '.time{font-size:52px;font-weight:100;letter-spacing:-3px;line-height:1;color:#393c41}.date{font-size:14px;color:#999;margin-top:5px}'
      + '.car-wrap{text-align:center;margin:22px 0 4px;padding:10px 0}'
      + '.car-noimg{margin:10px 50px;padding:30px 0;background:linear-gradient(135deg,#f8f8f8,#eee,#f8f8f8);border-radius:20px}'
      + '.car-color{font-size:28px;font-weight:200;color:#999;letter-spacing:4px;padding:20px 0}'
      + '.model-label{font-size:11px;font-weight:500;letter-spacing:8px;text-transform:uppercase;color:#aaa}'
      + '.divider{height:1px;background:linear-gradient(90deg,transparent,#ddd 15%,#ddd 85%,transparent);margin:14px 42px}'
      + '.body{padding:0 38px;display:flex;flex-direction:column;gap:12px}.row{display:flex;gap:12px}'
      + '.card{flex:1;border:1.5px solid #e5e5e5;border-radius:12px;padding:12px 16px}'
      + '.card h4{font-size:8px;text-transform:uppercase;letter-spacing:2.5px;color:#aaa;margin-bottom:6px;font-weight:700}'
      + '.val{font-size:15px;font-weight:600}.sub{font-size:10px;color:#777;margin-top:2px}'
      + '.ci{font-size:10.5px;color:#555;padding:2px 0}.lbl{font-size:7.5px;color:#aaa;letter-spacing:1.5px}'
      + '.pay{background:#f0faf0;border-color:#c8e6c9;display:flex;flex-direction:column}'
      + '.pc{flex:1;display:flex;align-items:center;justify-content:center}'
      + '.ti{background:#fffbeb;border-color:#fde68a}.ti-no{background:#fef2f2;border-color:#fecaca}'
      + '.sr{display:flex;align-items:center;gap:7px;padding:4px 0;border-bottom:1px solid #f0f0f0}.sr:last-child{border-bottom:none}'
      + '.sd{display:inline-block;width:7px;height:7px;border-radius:50%}.sd.g{background:#22c55e}.sd.r{background:#ef4444}.sd.b{background:#3b82f6}.sd.p{background:#a855f7}'
      + '.sl{font-size:8.5px;color:#999;letter-spacing:1px;text-transform:uppercase;flex:1}.sv{font-size:11px;font-weight:600;color:#333}'
      + '.nf{flex:1;border:1.5px solid #e5e5e5;border-radius:12px;padding:10px 16px;margin:10px 38px 0;display:flex;flex-direction:column}'
      + '.nf h4{font-size:8px;text-transform:uppercase;letter-spacing:2.5px;color:#aaa;margin-bottom:4px;font-weight:700}'
      + '.nb{flex:1;border:1.5px dashed #ddd;border-radius:8px;padding:4px}'
      + '.footer{border-top:1px solid #f0f0f0;padding:5px 42px;display:flex;justify-content:space-between;color:#ccc;font-size:9px;margin-top:auto}'
      + '.tesla{font-weight:600;letter-spacing:8px;font-size:12px;color:#ddd}'
      + '.topbar{background:#171a20;color:#fff;padding:16px 32px;display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:10}'
      + '.topbar button{padding:10px 24px;border:none;border-radius:20px;font-size:14px;cursor:pointer;font-family:inherit;margin-left:12px}'
      + '@media print{.topbar{display:none!important}.page{box-shadow:none;margin-bottom:0}}'
      + '</style>'
      + '<div class="topbar">'
      + '<span style="font-size:16px;letter-spacing:2px">T E S L A <strong>Delivery Hub</strong> - ' + checked.length + ' pages de garde</span>'
      + '<div>'
      + '<button onclick="window.print()" style="background:#22c55e;color:#fff">Imprimer (Ctrl+P)</button>'
      + '<button onclick="location.reload()" style="background:#3e6ae1;color:#fff">Retour au dashboard</button>'
      + '</div></div>'
      + '<div style="padding:20px;background:#f5f5f5">' + pages + '</div>';
    } catch(e) { alert('Erreur generate: ' + e.message); }
  });

})();
}
