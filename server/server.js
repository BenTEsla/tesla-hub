// ============================================================
// TESLA DELIVERY HUB - Server
// Rennes Saint-Jacques
// ============================================================

const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');
const os = require('os');
const puppeteer = require('puppeteer-core');
const ptp = require('pdf-to-printer');
const config = require('./config.json');

const app = express();
const PORT = 3000;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DL_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DL_DIR)) fs.mkdirSync(DL_DIR);

// ============================================================
// PUPPETEER: Warm browser for fast PDF generation
// ============================================================
let pdfBrowser = null;
async function getPdfBrowser() {
  try { if (pdfBrowser && pdfBrowser.connected) return pdfBrowser; } catch(e) {}
  pdfBrowser = await puppeteer.launch({ executablePath: CHROME, headless: true });
  console.log('Puppeteer browser warmed up');
  return pdfBrowser;
}

// ============================================================
// MIDDLEWARE
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

// ============================================================
// PERSISTENCE: Tokens + Print status
// ============================================================
const tokenFile = path.join(__dirname, 'tokens.json');
let tokens = { dro: null, docgen: null, docgenAuth: null, userId: null };
try { tokens = { ...tokens, ...JSON.parse(fs.readFileSync(tokenFile, 'utf8')) }; } catch(e) {}
function saveTokens() { fs.writeFileSync(tokenFile, JSON.stringify(tokens, null, 2)); }

const printTrackFile = path.join(__dirname, 'print-status.json');
let printStatus = {};
try { printStatus = JSON.parse(fs.readFileSync(printTrackFile, 'utf8')); } catch(e) {}
function savePrintStatus() { fs.writeFileSync(printTrackFile, JSON.stringify(printStatus, null, 2)); }

// ============================================================
// AUTH
// ============================================================
app.post('/api/auth/tokens', (req, res) => {
  if (req.body.droToken) tokens.dro = req.body.droToken.replace(/^"|"$/g, '');
  if (req.body.docgenToken) tokens.docgen = req.body.docgenToken;
  if (req.body.docgenAuth) tokens.docgenAuth = req.body.docgenAuth;
  if (req.body.userId) tokens.userId = req.body.userId.replace(/^"|"$/g, '');
  saveTokens();
  res.json({ ok: true });
});

app.get('/api/auth/status', (req, res) => {
  res.json({ hasDro: !!tokens.dro, hasDocgen: !!tokens.docgen, userId: tokens.userId });
});

app.get('/auth/callback', (req, res) => {
  if (req.query.token) {
    tokens.dro = req.query.token.replace(/^"|"$/g, '');
    tokens.userId = (req.query.userId || '').replace(/^"|"$/g, '');
    saveTokens();
    res.redirect('/dashboard.html');
  } else {
    res.redirect('/');
  }
});

// ============================================================
// AUTH: DocGen login via Puppeteer
// ============================================================
app.get('/api/auth/login-docgen', async (req, res) => {
  try {
    const profileDir = path.join(__dirname, 'chrome-profile');
    if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir);
    
    const browser = await puppeteer.launch({
      executablePath: CHROME, headless: false, userDataDir: profileDir,
      args: ['--window-size=500,700', '--no-first-run', '--no-default-browser-check']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 480, height: 650 });
    
    let captured = false;
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      const headers = request.headers();
      if (request.url().includes('documentautomation-processapi.tesla.com') && headers.authorization && headers.token) {
        tokens.docgenAuth = headers.authorization;
        tokens.docgen = headers.token;
        saveTokens();
        captured = true;
        console.log('DocGen tokens captured!');
      }
      request.continue();
    });
    
    await page.goto('https://warpbilling.tesla.com', { waitUntil: 'networkidle2', timeout: 60000 });
    try {
      const ssoBtn = await page.$('a[href*="Tesla"], div[class*="idp"] a');
      if (ssoBtn) await ssoBtn.click();
    } catch(e) {}
    
    try {
      await page.waitForFunction(() => window.location.hostname === 'warpbilling.tesla.com' && !window.location.href.includes('sso.tesla.com'), { timeout: 180000 });
    } catch(e) {}
    
    await new Promise(r => setTimeout(r, 3000));
    
    if (page.url().includes('warpbilling.tesla.com')) {
      try {
        await page.waitForSelector('input[placeholder*="Search"]', { timeout: 10000 });
        await page.type('input[placeholder*="Search"]', 'RN128188598');
        await page.keyboard.press('Enter');
        await new Promise(r => setTimeout(r, 4000));
        const row = await page.$('tr.mat-row, tr[class*="row"], a[href*="invoice"]');
        if (row) { await row.click(); await new Promise(r => setTimeout(r, 3000)); }
      } catch(e) {}
      
      if (!captured) {
        try { await page.goto('https://warpbilling.tesla.com/invoice/RN128188598/documents', { waitUntil: 'networkidle2', timeout: 15000 }); } catch(e) {}
      }
      
      await new Promise(r => {
        const c = setInterval(() => { if (captured) { clearInterval(c); r(); } }, 500);
        setTimeout(() => { clearInterval(c); r(); }, 15000);
      });
    }
    
    await browser.close();
    res.json({ ok: captured, message: captured ? 'DocGen tokens captured!' : 'Tokens not captured. Try again.' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// PRINT STATUS
// ============================================================
app.get('/api/print/status', (req, res) => { res.json(printStatus); });

app.post('/api/print/status/:rn', (req, res) => {
  printStatus[req.params.rn] = { printed: true, date: new Date().toISOString(), docs: req.body.docs || 0 };
  savePrintStatus();
  res.json({ ok: true });
});

app.delete('/api/print/status', (req, res) => {
  printStatus = {};
  savePrintStatus();
  res.json({ ok: true });
});

// ============================================================
// DOCGEN: Generate + Download documents
// ============================================================
function docgenHeaders() {
  return { 'authorization': tokens.docgenAuth, 'token': tokens.docgen, 'Content-Type': 'application/json', 'accept': 'application/json' };
}

async function downloadDoc(API, h, rn, docId, fileName, maxRetries) {
  for (let attempt = 0; attempt < (maxRetries || 2); attempt++) {
    try {
      const resp = await fetch(API + '/Invoices/Automation/' + rn + '/Document/Download?documentName=' + docId + '&vin=null&version=1&countryCode=FR', { headers: h });
      if (resp.ok) {
        const buffer = await resp.buffer();
        if (buffer.length > 100) {
          fs.writeFileSync(path.join(DL_DIR, fileName), buffer);
          console.log('  Downloaded:', fileName, buffer.length, 'bytes');
          return true;
        }
      }
      console.log('  Retry', attempt + 1, ':', fileName);
      await new Promise(r => setTimeout(r, 2000));
    } catch(e) {
      console.log('  Error:', fileName, e.message);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  return false;
}

app.post('/api/print/docgen', async (req, res) => {
  try {
    if (!tokens.docgen || !tokens.docgenAuth) {
      return res.status(401).json({ error: 'DocGen tokens not set.' });
    }
    
    const { tiRNs, b2bRNs } = req.body;
    const API = config.apis.docgen;
    const h = docgenHeaders();
    const results = { generated: 0, downloaded: 0, files: [], errors: [], missingThirdPartyPVL: [] };
    
    // Generate Trade-In Annex
    for (const rn of (tiRNs || [])) {
      try {
        await fetch(API + '/DocumentAutomation/GeneratePacket', {
          method: 'POST', headers: h,
          body: JSON.stringify({ documentCodes: [{ documentCode: "TRADE_IN_ANNEX", defaultSignType: "N/A" }], referenceNumber: rn, triggerRelatedDocumentsCall: true, forceGenerate: true })
        });
        results.generated++;
        console.log('Generated TRADE_IN_ANNEX for', rn);
      } catch (e) { results.errors.push(rn + ':gen:' + e.message); }
    }
    
    if ((tiRNs || []).length) await new Promise(r => setTimeout(r, 3000));
    
    // Download Trade-In docs (FR only)
    for (const rn of (tiRNs || [])) {
      try {
        // Clean old files
        fs.readdirSync(DL_DIR).filter(f => f.startsWith(rn) && !f.includes('PAGE_DE_GARDE') && !f.includes('ThirdParty') && !f.includes('SC_DELIVERY')).forEach(f => fs.unlinkSync(path.join(DL_DIR, f)));
        
        const listResp = await fetch(API + '/Invoices/' + rn + '/Document/list', { headers: h });
        const list = await listResp.json();
        const allDocs = list.responseObject?.documentList || [];
        
        const tiDocs = allDocs.filter(d => {
          const nl = (d.name || '').toLowerCase();
          if ((nl.includes('trade-in annex') || nl.includes('trade_in_annex')) && nl.includes('fr')) return true;
          if ((d.name || '').includes('13751') || (d.name || '').includes('15776')) return true;
          return false;
        });
        
        console.log('Trade-In docs for ' + rn + ':', tiDocs.map(d => d.name).join(', '));
        
        for (const d of tiDocs) {
          const id = d.cgsContentId || d.dmsContentId;
          if (!id) continue;
          const fileName = rn + '_' + d.name.replace(/[^a-zA-Z0-9-]/g, '_') + '.pdf';
          if (await downloadDoc(API, h, rn, id, fileName)) {
            results.downloaded++;
            results.files.push({ rn, name: d.name, fileName });
          }
        }
      } catch (e) { results.errors.push(rn + ':ti:' + e.message); }
    }
    
    // B2B: download S&C + ThirdPartyDeliveryDeclaration
    for (const rn of (b2bRNs || [])) {
      try {
        const listResp = await fetch(API + '/Invoices/' + rn + '/Document/list', { headers: h });
        const list = await listResp.json();
        const allDocs = list.responseObject?.documentList || [];
        
        // S&C
        const scDoc = allDocs.find(d => (d.name || '').toLowerCase().includes('confirmation de livraison'));
        if (scDoc) {
          const scId = scDoc.cgsContentId || scDoc.dmsContentId;
          if (scId && await downloadDoc(API, h, rn, scId, rn + '_SC_DELIVERY_ACCEPTANCE.pdf')) {
            results.downloaded++;
            results.files.push({ rn, name: 'S&C', fileName: rn + '_SC_DELIVERY_ACCEPTANCE.pdf' });
          }
        }
        
        // ThirdPartyDeliveryDeclaration (multiple name patterns)
        const pvlDoc = allDocs.find(d => {
          const n = (d.name || '').toLowerCase();
          return n.includes('thirdpartydeliverydeclaration') || n.includes('tesladeliverydeclaration') || n.includes('pv livraison') || n.includes('pv_livraison') || n.match(/^pvl\s/);
        });
        if (pvlDoc) {
          const id = pvlDoc.cgsContentId || pvlDoc.dmsContentId;
          if (id && await downloadDoc(API, h, rn, id, rn + '_ThirdPartyDeliveryDeclaration.pdf')) {
            results.downloaded++;
            results.files.push({ rn, name: 'ThirdPartyDeliveryDeclaration', fileName: rn + '_ThirdPartyDeliveryDeclaration.pdf' });
          }
        } else {
          results.missingThirdPartyPVL.push(rn);
          console.log('MISSING ThirdPartyDeliveryDeclaration for B2B:', rn);
        }
      } catch (e) { results.errors.push(rn + ':b2b:' + e.message); }
    }
    
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// PRINT: Generate PDF + send to printer
// ============================================================
app.get('/api/print/download/:fileName', (req, res) => {
  res.download(path.join(DL_DIR, req.params.fileName));
});

app.post('/api/print/send/:rn', async (req, res) => {
  try {
    const rn = req.params.rn;
    const date = req.body.date || new Date(Date.now() + 864e5).toISOString().split('T')[0];
    const isB2B = req.body.b2b || false;
    const printer = req.body.printer || config.hubs[config.defaultHub]?.printer || '';
    const results = { printed: 0, files: [], warnings: [] };
    
    // Check B2B PVL
    let missPVL = false;
    if (isB2B && !fs.readdirSync(DL_DIR).some(f => f.startsWith(rn) && f.toLowerCase().includes('thirdparty'))) {
      missPVL = true;
      results.warnings.push('ThirdPartyDeliveryDeclaration missing');
    }
    
    // Step 1: Generate page de garde PDF
    const browser = await getPdfBrowser();
    const page = await browser.newPage();
    await page.goto('http://localhost:' + PORT + '/api/print/page-de-garde/' + rn + '?date=' + date + (missPVL ? '&missPVL=1' : ''), { waitUntil: 'networkidle0', timeout: 15000 });
    const pdgPath = path.join(DL_DIR, rn + '_PAGE_DE_GARDE.pdf');
    await page.pdf({ path: pdgPath, format: 'A4', printBackground: true });
    await page.close();
    
    // Step 2: Print page de garde
    try { await ptp.print(pdgPath, { printer }); results.printed++; results.files.push(pdgPath); }
    catch(e) { console.error('Print error:', e.message); }
    
    // Step 3: Trade-In docs (Annex FR first)
    const tiFiles = fs.readdirSync(DL_DIR).filter(f => f.startsWith(rn) && !f.includes('PAGE_DE_GARDE') && !f.includes('SC_DELIVERY') && !f.includes('ThirdParty') && f.endsWith('.pdf'));
    tiFiles.sort((a, b) => (a.toLowerCase().includes('annex') ? 0 : 1) - (b.toLowerCase().includes('annex') ? 0 : 1));
    for (const doc of tiFiles) {
      try { await ptp.print(path.join(DL_DIR, doc), { printer }); results.printed++; results.files.push(doc); console.log('Printed:', doc); }
      catch(e) { console.error('Print error:', e.message); }
    }
    
    // Step 4: S&C for B2B
    const scFile = fs.readdirSync(DL_DIR).find(f => f.startsWith(rn) && f.includes('SC_DELIVERY_ACCEPTANCE'));
    if (scFile) {
      try { await ptp.print(path.join(DL_DIR, scFile), { printer }); results.printed++; results.files.push(scFile); console.log('Printed S&C:', scFile); }
      catch(e) { console.error('S&C error:', e.message); }
    }
    
    // Step 5: ThirdPartyDeliveryDeclaration for B2B
    const pvlFile = fs.readdirSync(DL_DIR).find(f => f.startsWith(rn) && f.includes('ThirdParty'));
    if (pvlFile) {
      try { await ptp.print(path.join(DL_DIR, pvlFile), { printer }); results.printed++; results.files.push(pvlFile); console.log('Printed PVL:', pvlFile); }
      catch(e) {}
    }
    
    // Mark as printed
    printStatus[rn] = { printed: true, date: new Date().toISOString(), docs: results.printed };
    savePrintStatus();
    
    res.json({ ok: true, printed: results.printed, files: results.files.length, warnings: results.warnings });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
});

// ============================================================
// PAGE DE GARDE: Generate cover page HTML
// ============================================================
app.get('/api/print/page-de-garde/:rn', async (req, res) => {
  try {
    const rn = req.params.rn;
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const missPVL = req.query.missPVL === '1';
    const droHeaders = { 'Authorization': 'Bearer ' + tokens.dro, 'Content-Type': 'application/json', 'userid': tokens.userId };
    
    // Fetch advisor + customer data in parallel
    const [advResp, dashResp] = await Promise.all([
      fetch(config.apis.dro + '/advisor/Dashboard?isSidePanelFullScreen=true', {
        method: 'POST', headers: droHeaders,
        body: JSON.stringify({ condition: 'and', rules: [{ condition: 'and', ReferenceNumbers: [rn], Countries: [] }], Skip: 0, Take: 1, SortOrder: [], SelectedColumns: [] })
      }),
      fetch(config.apis.dro + '/deliveryops/Customers/Dashboard', {
        method: 'POST', headers: droHeaders,
        body: JSON.stringify({ fromDeliveryDate: date, trtId: config.hubs[config.defaultHub].trtId, customerHasNoHost: false, skip: 0, take: 200, fromTime: '00:00', toTime: '23:59', countryCode: 'FR', onlyMyLocation: true, sort: {}, stage: [], status: [], deliveryType: [], paperwork: [], customerDeliveryStatus: [], inboundStatus: [], VehicleTypes: [], pdcFilter: [], dmvDocumentStages: [] })
      })
    ]);
    
    const adv = await advResp.json();
    const dash = await dashResp.json();
    const a = adv.Data?.Dashboard?.[0] || {};
    const c = dash.Data?.find(d => d.ReferenceNumber === rn) || {};
    
    // Parse time
    let time = '?';
    const tm = (c.ScheduledDeliveryStartDateString || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (tm) { let hr = parseInt(tm[1]); if (tm[3].toUpperCase() === 'PM' && hr < 12) hr += 12; if (tm[3].toUpperCase() === 'AM' && hr === 12) hr = 0; time = String(hr).padStart(2, '0') + ':' + tm[2]; }
    
    // Trade-in + Battery in parallel
    let ti = null, battery = '';
    const promises = [];
    if (a.TradeInActionStatus === 'COMPLETE_TRADE_IN') {
      promises.push(fetch(config.apis.dro + '/widget/GetTradeInWidgetInfo?referenceNumber=' + rn + '&vehicleMapId=' + (a.VehicleMapId || '') + '&deliveryState=' + encodeURIComponent(a.DeliveryState || ''), { headers: droHeaders }).then(r => r.json()).then(d => { if (d.Data) ti = { make: d.Data.Make, model: d.Data.Model, plate: d.Data.LicensePlate, status: d.Data.AMPStatusFromC360 }; }).catch(() => {}));
    }
    promises.push(fetch(config.apis.dro + '/widget/overview/' + rn + '/info?vin=' + (a.Vin || ''), { headers: droHeaders }).then(r => r.json()).then(d => { if (d.Data?.VinCharge) battery = d.Data.VinCharge + '%'; }).catch(() => {}));
    await Promise.all(promises);
    
    // Mappings
    const FC = { 'Pearl White': 'Blanc Perle', 'Diamond Black': 'Noir Diamant', 'Stealth Grey': 'Gris Stealth', 'Ultra Red': 'Rouge Ultra', 'Quicksilver': 'Quicksilver', 'Solid Black': 'Noir', 'Glacier Blue': 'Bleu Glacier', 'Marine Blue': 'Bleu Marine' };
    const FP = { 'CASH': 'CASH', 'TESLA_LEASING': 'LEASING', 'TESLA_LENDING': 'CR\u00c9DIT', 'THIRD_PARTY_LEASING': 'LLD TIERS' };
    const payClasses = { 'CASH': 'pay-cash', 'TESLA_LEASING': 'pay-leasing', 'TESLA_LENDING': 'pay-credit', 'THIRD_PARTY_LEASING': 'pay-lld' };
    
    const color = FC[a.VehicleColor] || a.VehicleColor || '';
    const pay = FP[a.OrderType] || a.OrderType || '';
    const imgModel = (a.VehicleModel || '').indexOf('3') >= 0 ? 'm3' : 'my';
    const addr = a.DeliveryAddress || {};
    const opts = a.OptionCodes || '';
    
    // Enterprise driver
    let clientName = a.CustomerName || '';
    if (a.IsEnterpriseOrder && a.DriverInfo?.first_name) {
      clientName = a.DriverInfo.first_name + ' ' + a.DriverInfo.last_name + ' (' + clientName + ')';
    }
    
    // Config title
    const configTitle = (a.ConfigurationString || '').split(',')[0] || a.VehicleModel || '';
    
    // Date FR
    const months = ['janvier','f\u00e9vrier','mars','avril','mai','juin','juillet','ao\u00fbt','septembre','octobre','novembre','d\u00e9cembre'];
    const dp = date.split('-');
    const dateFR = parseInt(dp[2]) + ' ' + months[parseInt(dp[1]) - 1] + ' ' + dp[0];
    
    // Trade-in block
    let tiBlock = '<div class="box" style="display:flex;flex-direction:column"><div class="bt">Trade-In</div><div style="display:flex;align-items:center;justify-content:center;flex:1"><div class="pay-bg" style="background:#fce4ec"><div class="pay-label" style="color:#c62828">NON</div></div></div></div>';
    if (ti && (ti.make || ti.model)) {
      tiBlock = `<div class="box ti-box"><div class="bt">Trade-In</div><div class="ti-car">${ti.make || ''} ${ti.model || ''}</div>${ti.plate ? '<div class="lb">IMMATRICULATION</div><div class="ti-plate">' + ti.plate + '</div>' : ''}${ti.status ? '<div class="ti-status">' + ti.status + '</div>' : ''}</div>`;
    }
    
    // FSD + Accessories
    const hasFSD = opts.includes('$APF2') || opts.includes('$APF1');
    const fsdTag = hasFSD ? '<span class="fsd-tag fsd-yes">Souscrit</span>' : '<span class="fsd-tag fsd-no">Non souscrit</span>';
    let accessories = '';
    if (opts.includes('$CPF0') || opts.includes('$CPF1')) accessories += '<span class="opt-tag">Crochet d\'attelage</span>';
    if (!accessories) accessories = '<span style="color:#ccc;font-size:12px">Aucun</span>';
    
    // Satisfaction gauge
    let score = 1;
    if ((a.LicensePlate || '').trim()) score++;
    if (a.AmountDueActionStatus === 'Yes' || a.PaymentMethodActionStatus === 'COMPLETE') score++;
    if (a.InsuranceActionStatus === 'COMPLETE') score++;
    if (a.VehicleStage === 'Finished Goods' || a.VehicleStage === 'Arrived at VRL') score++;
    if (a.HasHold) score = Math.max(1, score - 2);
    const gauge = '<div style="position:relative;width:100%;height:6px;background:linear-gradient(90deg,#ef9a9a,#ffcc80,#fff59d,#a5d6a7,#81c784);border-radius:3px"><div style="position:absolute;left:' + (score * 20) + '%;top:-4px;width:2px;height:14px;background:#171a20;border-radius:1px;transform:translateX(-1px)"></div></div>';
    
    // Miss PVL alert
    let missPVLAlert = '';
    if (missPVL) missPVLAlert = '<div style="background:#fce4ec;border:1px solid #e57373;border-radius:6px;padding:6px 10px;margin-bottom:4px;font-size:12px;font-weight:700;color:#c62828">! Miss PVL Tiers</div>';
    
    // Incentive card (only if Complete + not enterprise)
    let incentiveCard = '';
    if (a.IncentivesGate === 'Complete' && !a.IsEnterpriseOrder) {
      incentiveCard = '<div class="notes" style="flex:1"><div class="bt">Incentive</div><div style="display:flex;align-items:center;gap:8px;margin-bottom:4px"><span style="width:9px;height:9px;border-radius:50%;background:#28a745;display:inline-block"></span><span style="font-size:14px;font-weight:700;color:#28a745">Oui</span></div><div style="margin-top:10px"><label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:8px"><input type="checkbox" style="width:16px;height:16px;accent-color:#393c41"> To Sign</label><label style="display:flex;align-items:center;gap:8px;font-size:13px"><input type="checkbox" style="width:16px;height:16px;accent-color:#393c41"> OK</label></div></div>';
    }
    
    // Parcours
    const orderDate = a.OrderPlacedDate ? new Date(a.OrderPlacedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) : '';
    let parcours = '';
    if (orderDate) {
      parcours = `Parcours client ${a.InsuranceActionStatus === 'COMPLETE' ? 'fluide' : 'en cours'}. Commande pass\u00e9e le ${orderDate}, paiement ${pay}. `;
      if (ti) parcours += `Trade-in ${ti.make || ''} ${ti.model || ''} ${ti.status ? '- ' + ti.status : ''}. `;
      parcours += (a.LicensePlate || '').trim() ? 'Plaque attribu\u00e9e. ' : 'Plaque en attente. ';
      parcours += a.InsuranceActionStatus === 'COMPLETE' ? 'Assurance valid\u00e9e. ' : 'Assurance en attente. ';
      if (a.HasHold) parcours += 'HOLD. ';
      parcours += a.IsEnterpriseOrder ? 'Entreprise.' : 'Particulier.';
    }
    
    // Template
    let html = fs.readFileSync(path.join(__dirname, 'templates', 'page-de-garde.html'), 'utf8');
    const replacements = {
      '{{NAME}}': clientName,
      '{{RN}}': rn,
      '{{TIME}}': time,
      '{{DATE}}': date,
      '{{DATE_FR}}': dateFR,
      '{{CONFIG_TITLE}}': configTitle.toUpperCase().replace(/,/g, ' \u00b7 '),
      '{{IMG_URL}}': 'https://static-assets.tesla.com/configurator/compositor?context=design_studio_2&model=' + imgModel + '&view=STUD_3QTR&bkba_opt=1&options=' + opts + '&size=1820',
      '{{IS_NEW}}': a.VehicleTitleStatus === 'NEW' ? 'NEUF' : 'OCCASION',
      '{{BATTERY}}': battery ? '<div class="battery">\ud83d\udd0b ' + battery + '</div>' : '',
      '{{MODEL_SHORT}}': (a.VehicleModel || '') + ' \u2014 Propulsion',
      '{{MODEL}}': a.VehicleModel || '',
      '{{TRIM_SHORT}}': configTitle.replace(/Model [3Y] Premium /, '').replace(/ Rear-Wheel Drive/, ' Propulsion').replace(/ All-Wheel Drive/, ' AWD'),
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
      '{{REFERRAL}}': a.ReferralCode ? 'Oui' : 'Non',
      '{{INS_DOT}}': a.InsuranceActionStatus === 'COMPLETE' ? 'green' : 'orange',
      '{{INSURANCE}}': a.InsuranceActionStatus === 'COMPLETE' ? 'Valid\u00e9e' : 'En attente',
      '{{PARCOURS}}': parcours,
      '{{PARCOURS_SHORT}}': orderDate ? 'Cmd ' + orderDate : '',
      '{{GAUGE}}': gauge,
      '{{CES_NAME}}': c.HostName || '',
      '{{MISS_PVL_ALERT}}': missPVLAlert,
      '{{INCENTIVE_CARD}}': incentiveCard
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
// CONFIG
// ============================================================
app.get('/api/config', (req, res) => {
  const hubId = req.query.hub || config.defaultHub;
  const hub = config.hubs[hubId];
  if (!hub) return res.status(404).json({ error: 'Hub not found' });
  res.json({ hub, hubId, allHubs: Object.keys(config.hubs) });
});

// ============================================================
// PROXY: DRO API
// ============================================================
app.all('/api/dro/*', async (req, res) => {
  try {
    const qs = req.originalUrl.includes('?') ? '?' + req.originalUrl.split('?')[1] : '';
    const url = config.apis.dro + '/' + req.params[0] + qs;
    const opts = { method: req.method, headers: { 'Authorization': 'Bearer ' + tokens.dro, 'Content-Type': 'application/json', 'userid': tokens.userId } };
    if (req.method !== 'GET' && req.body) opts.body = JSON.stringify(req.body);
    const r = await fetch(url, opts);
    res.status(r.status).json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// PROXY: DocGen API
// ============================================================
app.all('/api/docgen/*', async (req, res) => {
  try {
    const qs = req.originalUrl.includes('?') ? '?' + req.originalUrl.split('?').slice(1).join('?') : '';
    const url = config.apis.docgen + '/' + req.params[0] + qs;
    const opts = { method: req.method, headers: { 'authorization': 'Bearer ' + tokens.docgen, 'token': tokens.docgen, 'Content-Type': 'application/json', 'accept': 'application/json' } };
    if (req.method !== 'GET' && req.body) opts.body = JSON.stringify(req.body);
    const r = await fetch(url, opts);
    const ct = r.headers.get('content-type') || '';
    if (ct.includes('pdf') || ct.includes('octet-stream')) {
      const buffer = await r.buffer();
      res.set('Content-Type', ct);
      res.set('Content-Disposition', r.headers.get('content-disposition') || '');
      return res.send(buffer);
    }
    res.status(r.status).json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// PROXY: Intrepid API
// ============================================================
app.all('/api/intrepid/*', async (req, res) => {
  try {
    const qs = req.originalUrl.includes('?') ? '?' + req.originalUrl.split('?')[1] : '';
    const r = await fetch(config.apis.intrepid + '/' + req.params[0] + qs, { headers: { 'Authorization': 'Bearer ' + tokens.dro } });
    res.status(r.status).json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// START
// ============================================================
app.listen(PORT, '0.0.0.0', () => {
  const hub = config.hubs[config.defaultHub];
  const ips = Object.values(os.networkInterfaces()).flat().filter(n => n.family === 'IPv4' && !n.internal).map(n => n.address);
  console.log(`
  ========================================
  TESLA DELIVERY HUB
  ${hub.name}
  ========================================
  Local:      http://localhost:${PORT}
  Network:    ${ips.map(ip => 'http://' + ip + ':' + PORT).join('\n              ')}
  Hub:        ${config.defaultHub} (trtId: ${hub.trtId})
  CES:        ${hub.ces.map(c => c.name).join(', ')}
  Printer:    ${hub.printer}
  ========================================
`);
});
