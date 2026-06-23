const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const config = require('./config.json');
const { execFile } = require('child_process');

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// CORS - allow DRO and warpbilling to send tokens
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ============================================================
// Token storage (in-memory, per session)
// ============================================================
let tokens = { dro: null, docgen: null, docgenAuth: null, userId: null };

// Print tracking (persisted to file)
const printTrackFile = path.join(__dirname, 'print-status.json');
let printStatus = {};
try { printStatus = JSON.parse(require('fs').readFileSync(printTrackFile, 'utf8')); } catch(e) {}

function savePrintStatus() {
  require('fs').writeFileSync(printTrackFile, JSON.stringify(printStatus, null, 2));
}

app.get('/api/print/status', (req, res) => {
  res.json(printStatus);
});

app.post('/api/print/status/:rn', (req, res) => {
  const rn = req.params.rn;
  printStatus[rn] = { printed: true, date: new Date().toISOString(), docs: req.body.docs || 0 };
  savePrintStatus();
  res.json({ ok: true });
});

app.delete('/api/print/status', (req, res) => {
  printStatus = {};
  savePrintStatus();
  res.json({ ok: true, message: 'Print status cleared' });
});

// ============================================================
// AUTH: SSO via DRO redirect
// ============================================================
app.post('/api/auth/tokens', (req, res) => {
  if (req.body.droToken) tokens.dro = req.body.droToken.replace(/^"|"$/g, '');
  if (req.body.docgenToken) tokens.docgen = req.body.docgenToken;
  if (req.body.docgenAuth) tokens.docgenAuth = req.body.docgenAuth;
  if (req.body.userId) tokens.userId = req.body.userId.replace(/^"|"$/g, '');
  res.json({ ok: true });
});

app.get('/api/auth/status', (req, res) => {
  res.json({ hasDro: !!tokens.dro, hasDocgen: !!tokens.docgen, userId: tokens.userId });
});

// SSO login route
app.get('/auth/callback', (req, res) => {
  if (req.query.token) {
    tokens.dro = req.query.token.replace(/^"|"$/g, '');
    tokens.userId = (req.query.userId || '').replace(/^"|"$/g, '');
    res.redirect('/dashboard.html');
  } else {
    res.redirect('/');
  }
});

// ============================================================
// PRINT: Generate + Download DocGen documents
// ============================================================
app.post('/api/print/docgen', async (req, res) => {
  try {
    if (!tokens.docgen || !tokens.docgenAuth) {
      return res.status(401).json({ error: 'DocGen tokens not set. Send them via POST /api/auth/tokens {docgenToken, docgenAuth}' });
    }
    
    const { tiRNs, pvlRNs } = req.body;
    const API = config.apis.docgen;
    const h = { 'authorization': tokens.docgenAuth, 'token': tokens.docgen, 'Content-Type': 'application/json', 'accept': 'application/json' };
    
    const results = { generated: 0, downloaded: 0, files: [], errors: [] };
    
    // Generate Trade-In Annex
    for (const rn of (tiRNs || [])) {
      try {
        await fetch(API + '/DocumentAutomation/GeneratePacket', {
          method: 'POST', headers: h,
          body: JSON.stringify({ documentCodes: [{ documentCode: "TRADE_IN_ANNEX", defaultSignType: "N/A" }], referenceNumber: rn, triggerRelatedDocumentsCall: true, forceGenerate: true })
        });
        results.generated++;
      } catch (e) { results.errors.push(rn + ':gen:' + e.message); }
    }
    
    // Generate PVL
    for (const rn of (pvlRNs || [])) {
      try {
        await fetch(API + '/DocumentAutomation/GeneratePacket', {
          method: 'POST', headers: h,
          body: JSON.stringify({ documentCodes: [{ documentCode: "DELIVERY_ACCEPTANCE", defaultSignType: "N/A" }], referenceNumber: rn, triggerRelatedDocumentsCall: true, forceGenerate: true })
        });
        results.generated++;
      } catch (e) { results.errors.push(rn + ':gen:' + e.message); }
    }
    
    // Wait for generation
    await new Promise(r => setTimeout(r, 5000));
    
    // Download all documents
    const allRNs = [...new Set([...(tiRNs || []), ...(pvlRNs || [])])];
    for (const rn of allRNs) {
      try {
        const listResp = await fetch(API + '/Invoices/' + rn + '/Document/list', { headers: h });
        const list = await listResp.json();
        const docs = (list.responseObject?.documentList || []).filter(d => {
          const n = d.name || '';
          return n.includes('CERFA') || n.includes('Trade-In Annex FR') || n.includes('Confirmation de livraison');
        });
        
        for (const d of docs) {
          const id = d.cgsContentId || d.dmsContentId;
          if (!id) continue;
          const dlResp = await fetch(API + '/Invoices/Automation/' + rn + '/Document/Download?documentName=' + id + '&vin=null&version=1&countryCode=FR', { headers: h });
          if (dlResp.ok) {
            const buffer = await dlResp.buffer();
            const fileName = rn + '_' + d.name.replace(/[^a-zA-Z0-9-]/g, '_') + '.pdf';
            const filePath = path.join(__dirname, 'downloads', fileName);
            
            // Ensure downloads directory exists
            const fs = require('fs');
            if (!fs.existsSync(path.join(__dirname, 'downloads'))) fs.mkdirSync(path.join(__dirname, 'downloads'));
            
            fs.writeFileSync(filePath, buffer);
            results.downloaded++;
            results.files.push({ rn, name: d.name, path: filePath, fileName });
          }
        }
      } catch (e) { results.errors.push(rn + ':dl:' + e.message); }
    }
    
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Serve downloaded files
app.get('/api/print/download/:fileName', (req, res) => {
  const filePath = path.join(__dirname, 'downloads', req.params.fileName);
  res.download(filePath);
});

// ============================================================
// PAGE DE GARDE: Generate beautiful cover page for a delivery
// ============================================================
app.get('/api/print/page-de-garde/:rn', async (req, res) => {
  try {
    const rn = req.params.rn;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    
    // Get advisor data
    const advResp = await fetch(config.apis.dro + '/advisor/Dashboard?isSidePanelFullScreen=true', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + tokens.dro, 'Content-Type': 'application/json', 'userid': tokens.userId },
      body: JSON.stringify({ condition: 'and', rules: [{ condition: 'and', ReferenceNumbers: [rn], Countries: [] }], Skip: 0, Take: 1, SortOrder: [], SelectedColumns: [] })
    });
    const adv = await advResp.json();
    const a = adv.Data?.Dashboard?.[0] || {};
    
    // Get customer dashboard for time
    const dashResp = await fetch(config.apis.dro + '/deliveryops/Customers/Dashboard', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + tokens.dro, 'Content-Type': 'application/json', 'userid': tokens.userId },
      body: JSON.stringify({ fromDeliveryDate: date, trtId: config.hubs[config.defaultHub].trtId, customerHasNoHost: false, skip: 0, take: 200, fromTime: '00:00', toTime: '23:59', countryCode: 'FR', onlyMyLocation: true, sort: {}, stage: [], status: [], deliveryType: [], paperwork: [], customerDeliveryStatus: [], inboundStatus: [], VehicleTypes: [], pdcFilter: [], dmvDocumentStages: [] })
    });
    const dash = await dashResp.json();
    const c = dash.Data?.find(d => d.ReferenceNumber === rn) || {};
    
    // Parse time
    const dt = c.ScheduledDeliveryStartDateString || '';
    let time = '?';
    const m = dt.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (m) { let hr = parseInt(m[1]); if (m[3].toUpperCase() === 'PM' && hr < 12) hr += 12; if (m[3].toUpperCase() === 'AM' && hr === 12) hr = 0; time = String(hr).padStart(2, '0') + ':' + m[2]; }
    
    // Get trade-in info
    let ti = null;
    if (a.TradeInActionStatus === 'COMPLETE_TRADE_IN') {
      try {
        const tiResp = await fetch(config.apis.dro + '/widget/GetTradeInWidgetInfo?referenceNumber=' + rn + '&vehicleMapId=' + (a.VehicleMapId || '') + '&deliveryState=' + encodeURIComponent(a.DeliveryState || ''), {
          headers: { 'Authorization': 'Bearer ' + tokens.dro, 'Content-Type': 'application/json', 'userid': tokens.userId }
        });
        const tiData = await tiResp.json();
        if (tiData.Data) ti = { make: tiData.Data.Make, model: tiData.Data.Model, plate: tiData.Data.LicensePlate, status: tiData.Data.AMPStatusFromC360 };
      } catch (e) {}
    }
    
    // Get battery
    let battery = '';
    try {
      const batResp = await fetch(config.apis.dro + '/widget/overview/' + rn + '/info?vin=' + (a.Vin || ''), {
        headers: { 'Authorization': 'Bearer ' + tokens.dro, 'Content-Type': 'application/json', 'userid': tokens.userId }
      });
      const batData = await batResp.json();
      if (batData.Data?.VinCharge) battery = batData.Data.VinCharge + '%';
    } catch (e) {}
    
    // Color mapping
    const FC = { 'Pearl White': 'Blanc Perle', 'Diamond Black': 'Noir Diamant', 'Stealth Grey': 'Gris Stealth', 'Ultra Red': 'Rouge Ultra', 'Quicksilver': 'Quicksilver', 'Solid Black': 'Noir', 'Glacier Blue': 'Bleu Glacier', 'Marine Blue': 'Bleu Marine' };
    const color = FC[a.VehicleColor] || a.VehicleColor || '';
    
    // Payment
    const FP = { 'CASH': 'CASH', 'TESLA_LEASING': 'LEASING', 'TESLA_LENDING': 'CR\u00c9DIT', 'THIRD_PARTY_LEASING': 'LLD TIERS' };
    const FPC = { 'CASH': '#28a745', 'TESLA_LEASING': '#1565c0', 'TESLA_LENDING': '#6a1b9a', 'THIRD_PARTY_LEASING': '#e65100' };
    const pay = FP[a.OrderType] || a.OrderType || '';
    const payColor = FPC[a.OrderType] || '#999';
    
    // Vehicle image
    const imgModel = (a.VehicleModel || '').indexOf('3') >= 0 ? 'm3' : 'my';
    const imgUrl = 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&model=' + imgModel + '&view=STUD_3QTR&bkba_opt=1&options=' + (a.OptionCodes || '') + '&size=1820';
    
    const addr = a.DeliveryAddress || {};
    const isNew = a.VehicleTitleStatus === 'NEW' ? 'NEUF' : 'OCCASION';
    const name = a.CustomerName || '';
    const ins = a.InsuranceActionStatus === 'COMPLETE' ? 'Valid\u00e9e' : 'En attente';
    
    // Enterprise driver name
    let clientName = name;
    if (a.IsEnterpriseOrder && a.DriverInfo?.first_name) {
      clientName = a.DriverInfo.first_name + ' ' + a.DriverInfo.last_name + ' (' + name + ')';
    }

    const templatePath = path.join(__dirname, 'templates', 'page-de-garde.html');
    let html = require('fs').readFileSync(templatePath, 'utf8');
    
    // Config string for model title
    const configParts = (a.ConfigurationString || '').split(',');
    const configTitle = configParts[0] || a.VehicleModel || '';
    const trimShort = configTitle.replace(/Model [3Y] Premium /,'').replace(/ Rear-Wheel Drive/,' Propulsion').replace(/ All-Wheel Drive/,' AWD');
    const modelShort = (a.VehicleModel || '') + ' \u2014 Propulsion';
    
    // Date FR format
    const months = ['janvier','f\u00e9vrier','mars','avril','mai','juin','juillet','ao\u00fbt','septembre','octobre','novembre','d\u00e9cembre'];
    const dateParts = date.split('-');
    const dateFR = parseInt(dateParts[2]) + ' ' + months[parseInt(dateParts[1])-1] + ' ' + dateParts[0];
    
    // Payment class
    const payClasses = { 'CASH': 'pay-cash', 'TESLA_LEASING': 'pay-leasing', 'TESLA_LENDING': 'pay-credit', 'THIRD_PARTY_LEASING': 'pay-lld' };
    
    // Trade-in block
    let tiBlock = '<div class="box"><div class="bt">Trade-In</div><div style="display:flex;align-items:center;justify-content:center;height:50px"><div class="pay-bg" style="background:#fce4ec"><div class="pay-label" style="color:#c62828">NON</div></div></div></div>';
    if (ti && (ti.make || ti.model)) {
      tiBlock = `<div class="box ti-box"><div class="bt">Trade-In</div><div class="ti-car">${ti.make || ''} ${ti.model || ''}</div>${ti.plate ? '<div class="lb">IMMATRICULATION</div><div class="ti-plate">' + ti.plate + '</div>' : ''}${ti.status ? '<div class="ti-status">' + ti.status + '</div>' : ''}</div>`;
    }
    
    // Referral
    const referral = a.ReferralCode ? 'Oui' : 'Non';
    
    // FSD detection from OptionCodes
    const opts = a.OptionCodes || '';
    const hasFSD = opts.includes('$APF2') || opts.includes('$APF1');
    const fsdTag = hasFSD ? '<span class="fsd-tag fsd-yes">Souscrit</span>' : '<span class="fsd-tag fsd-no">Non souscrit</span>';
    
    // Accessories (from OptionCodes - tow hitch, etc)
    const hasTowHitch = opts.includes('$CPF0') || opts.includes('$CPF1');
    let accessories = '';
    if (hasTowHitch) accessories += '<span class="opt-tag">Crochet d\'attelage</span>';
    if (!accessories) accessories = '<span style="color:#ccc;font-size:12px">Aucun</span>';
    
    // Parcours client - detailed
    const orderDate = a.OrderPlacedDate ? new Date(a.OrderPlacedDate).toLocaleDateString('fr-FR', {day:'numeric', month:'long'}) : '';
    const payMethod = pay || 'N/A';
    const hasPlate = (a.LicensePlate || '').trim();
    let parcours = '';
    if (orderDate) {
      parcours = `Parcours client ${a.InsuranceActionStatus === 'COMPLETE' ? 'fluide' : 'en cours'}. Commande pass\u00e9e le ${orderDate}`;
      parcours += `, paiement ${payMethod}. `;
      if (ti && (ti.make || ti.model)) parcours += `Trade-in ${(ti.make||'')} ${(ti.model||'')} ${ti.status ? '- ' + ti.status : 'valid\u00e9e'}. `;
      parcours += hasPlate ? 'Plaque attribu\u00e9e. ' : 'Plaque en attente. ';
      parcours += a.InsuranceActionStatus === 'COMPLETE' ? 'Assurance valid\u00e9e. ' : 'Assurance en attente. ';
      if (a.HasHold) parcours += 'V\u00e9hicule en HOLD - r\u00e9paration n\u00e9cessaire avant livraison. ';
      parcours += a.IsEnterpriseOrder ? 'Commande entreprise.' : 'Client particulier.';
    }
    
    // Replace all placeholders
    const replacements = {
      '{{NAME}}': clientName,
      '{{RN}}': rn,
      '{{TIME}}': time,
      '{{DATE}}': date,
      '{{DATE_FR}}': dateFR,
      '{{CONFIG_TITLE}}': configTitle.toUpperCase().replace(/,/g, ' \u00b7 '),
      '{{IMG_URL}}': imgUrl,
      '{{IS_NEW}}': isNew,
      '{{BATTERY}}': battery ? '<div class="battery">\ud83d\udd0b ' + battery + '</div>' : '',
      '{{MODEL_SHORT}}': modelShort,
      '{{MODEL}}': a.VehicleModel || '',
      '{{TRIM_SHORT}}': trimShort,
      '{{COLOR}}': color,
      '{{INTERIOR}}': a.VehicleInterior || '',
      '{{WHEEL}}': a.VehicleWheel || '',
      '{{PLATE}}': (a.LicensePlate || '').trim() || 'En attente',
      '{{VIN}}': a.Vin || '',
      '{{PHONE}}': a.CustomerPhone || '',
      '{{EMAIL}}': a.CustomerEmail || '',
      '{{ADDRESS}}': `${addr.Street1 || ''}, ${addr.PostalCode || ''} ${addr.City || ''}, ${addr.State || a.RegistrationState || ''}`,
      '{{TRADE_IN_BLOCK}}': tiBlock,
      '{{PAY}}': pay,
      '{{PAY_CLASS}}': payClasses[a.OrderType] || '',
      '{{ACCESSORIES}}': accessories,
      '{{FSD_TAG}}': fsdTag,
      '{{DA}}': a.DeliverySpecialistName || '',
      '{{SA}}': a.SalesAdvisorName || '',
      '{{CLIENT_TYPE}}': a.IsEnterpriseOrder ? 'Entreprise' : (a.VehicleTitleStatus === 'NEW' ? 'Nouveau' : 'Occasion'),
      '{{REFERRAL}}': referral,
      '{{INS_DOT}}': a.InsuranceActionStatus === 'COMPLETE' ? 'green' : 'orange',
      '{{INSURANCE}}': ins,
      '{{PARCOURS}}': parcours,
      '{{CES_NAME}}': c.HostName || ''
    };
    
    for (const [key, value] of Object.entries(replacements)) {
      html = html.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'), value || '');
    }

    res.set('Content-Type', 'text/html');
    res.send(html);
  } catch (e) {
    res.status(500).send('Error: ' + e.message);
  }
});

// ============================================================
// CONFIG: Hub configuration
// ============================================================
app.get('/api/config', (req, res) => {
  const hubId = req.query.hub || config.defaultHub;
  const hub = config.hubs[hubId];
  if (!hub) return res.status(404).json({ error: 'Hub not found' });
  res.json({ hub, hubId, allHubs: Object.keys(config.hubs) });
});

// ============================================================
// PROXY: DRO API (no CORS!)
// ============================================================
app.all('/api/dro/*', async (req, res) => {
  try {
    const droPath = req.params[0];
    const qs = req.originalUrl.includes('?') ? '?' + req.originalUrl.split('?')[1] : '';
    const url = `${config.apis.dro}/${droPath}${qs}`;
    const headers = {
      'Authorization': `Bearer ${tokens.dro}`,
      'Content-Type': 'application/json',
      'userid': tokens.userId
    };
    const opts = { method: req.method, headers };
    if (req.method !== 'GET' && req.body) {
      opts.body = JSON.stringify(req.body);
    }
    const r = await fetch(url, opts);
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// PROXY: DocGen API (no CORS!)
// ============================================================
app.all('/api/docgen/*', async (req, res) => {
  try {
    const docPath = req.params[0];
    const qs = req.originalUrl.includes('?') ? '?' + req.originalUrl.split('?').slice(1).join('?') : '';
    const url = `${config.apis.docgen}/${docPath}${qs}`;
    const headers = {
      'authorization': `Bearer ${tokens.docgen}`,
      'token': tokens.docgen,
      'Content-Type': 'application/json',
      'accept': 'application/json'
    };
    const opts = { method: req.method, headers };
    if (req.method !== 'GET' && req.body) {
      opts.body = JSON.stringify(req.body);
    }
    const r = await fetch(url, opts);
    
    // Handle PDF downloads
    const ct = r.headers.get('content-type') || '';
    if (ct.includes('pdf') || ct.includes('octet-stream')) {
      const buffer = await r.buffer();
      res.set('Content-Type', ct);
      res.set('Content-Disposition', r.headers.get('content-disposition') || '');
      return res.send(buffer);
    }
    
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// PROXY: Intrepid API
// ============================================================
app.all('/api/intrepid/*', async (req, res) => {
  try {
    const intPath = req.params[0];
    const qs = req.originalUrl.includes('?') ? '?' + req.originalUrl.split('?')[1] : '';
    const url = `${config.apis.intrepid}/${intPath}${qs}`;
    const r = await fetch(url, {
      headers: { 'Authorization': `Bearer ${tokens.dro}` }
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// PRINT: Send PDF to printer
// ============================================================
app.post('/api/print', (req, res) => {
  const { filePath, printer } = req.body;
  const hubId = req.body.hub || config.defaultHub;
  const hub = config.hubs[hubId];
  const printerName = printer || hub?.printer || '';
  
  if (!filePath) return res.status(400).json({ error: 'filePath required' });
  
  const acrobat = 'C:\\Program Files\\Adobe\\Acrobat DC\\Acrobat\\Acrobat.exe';
  execFile(acrobat, ['/t', filePath, printerName], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ ok: true, printed: filePath, printer: printerName });
  });
});

// ============================================================
// START
// ============================================================
app.listen(PORT, () => {
  const hubId = config.defaultHub;
  const hub = config.hubs[hubId];
  console.log('');
  console.log('  ========================================');
  console.log('  TESLA DELIVERY HUB');
  console.log(`  ${hub.name}`);
  console.log('  ========================================');
  console.log(`  Dashboard:  http://localhost:${PORT}`);
  console.log(`  Hub:        ${hubId} (trtId: ${hub.trtId})`);
  console.log(`  CES:        ${hub.ces.map(c => c.name).join(', ')}`);
  console.log(`  Printer:    ${hub.printer}`);
  console.log('  ========================================');
  console.log('');
});
