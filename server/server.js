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
const PDFMerger = require('pdf-merger-js').default;
const QRCode = require('qrcode');
const config = require('./config.json');

const app = express();
const PORT = process.env.PORT || 3000;
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DL_DIR = path.join(__dirname, 'downloads');
if (!fs.existsSync(DL_DIR)) fs.mkdirSync(DL_DIR);

// TDS v9 CDN assets
const TDS_CSS = 'https://digitalassets.tesla.com/tesla-design-system/raw/upload/design-system/9.x/index.css';
const TDS_FONT_TEXT_REG = 'https://digitalassets.tesla.com/tesla-design-system/raw/upload/static/fonts/universal-sans-2/web/text/Universal-Sans-Text-Regular.woff2';
const TDS_FONT_TEXT_MED = 'https://digitalassets.tesla.com/tesla-design-system/raw/upload/static/fonts/universal-sans-2/web/text/Universal-Sans-Text-Medium.woff2';
const TDS_FONT_DISP_MED = 'https://digitalassets.tesla.com/tesla-design-system/raw/upload/static/fonts/universal-sans-2/web/display/Universal-Sans-Display-Medium.woff2';
const TDS_HEAD = `<link rel="stylesheet" href="${TDS_CSS}" /><link rel="preload" href="${TDS_FONT_TEXT_REG}" as="font" type="font/woff2" crossorigin /><link rel="preload" href="${TDS_FONT_TEXT_MED}" as="font" type="font/woff2" crossorigin /><link rel="preload" href="${TDS_FONT_DISP_MED}" as="font" type="font/woff2" crossorigin />`;

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
app.use(express.static(path.join(__dirname, 'public'), { etag: false, maxAge: 0, setHeaders: (res) => { res.set('Cache-Control', 'no-store, no-cache'); } }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
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
  let docgenMinLeft = 0;
  if (tokens.docgenAuth) {
    try {
      const jwt = tokens.docgenAuth.replace('Bearer ', '');
      const payload = jwt.split('.')[1];
      let padded = payload; while (padded.length % 4) padded += '=';
      const json = JSON.parse(Buffer.from(padded, 'base64').toString());
      docgenMinLeft = Math.round((json.exp * 1000 - Date.now()) / 60000);
    } catch(e) {}
  }
  let droMinLeft = 0;
  let droValid = false;
  if (tokens.dro) {
    try {
      const payload = tokens.dro.split('.')[1];
      let padded = payload; while (padded.length % 4) padded += '=';
      const json = JSON.parse(Buffer.from(padded, 'base64').toString());
      droMinLeft = Math.round((json.exp * 1000 - Date.now()) / 60000);
      droValid = droMinLeft > 0;
    } catch(e) { droValid = !!tokens.dro; }
  }
  res.json({ hasDro: droValid, hasDocgen: !!tokens.docgen && docgenMinLeft > 0, docgenMinLeft, droMinLeft, userId: tokens.userId });
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
    
    // Go directly to a documents page to trigger DocGen API call
    console.log('DocGen login: navigating to WarpBilling...');
    await page.goto('https://warpbilling.tesla.com', { waitUntil: 'networkidle2', timeout: 60000 });
    
    // Wait for SSO if needed (user may need to log in manually)
    try {
      await page.waitForFunction(() => 
        window.location.hostname === 'warpbilling.tesla.com' && 
        !window.location.href.includes('sso.tesla.com'), 
        { timeout: 120000 }
      );
    } catch(e) { console.log('DocGen login: SSO wait timeout'); }
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Try to navigate to documents page to trigger DocGen API
    if (!captured && page.url().includes('warpbilling.tesla.com')) {
      console.log('DocGen login: searching for invoice...');
      
      // Try multiple approaches to trigger a DocGen API call
      const testRNs = ['RN127990689', 'RN127612649', 'RN128188598'];
      for (const rn of testRNs) {
        if (captured) break;
        try {
          await page.goto('https://warpbilling.tesla.com/invoice/' + rn + '/documents', { waitUntil: 'networkidle2', timeout: 20000 });
          console.log('DocGen login: tried ' + rn + ', captured=' + captured);
          if (!captured) await new Promise(r => setTimeout(r, 3000));
        } catch(e) { console.log('DocGen login: navigation error for ' + rn); }
      }
      
      // Final wait
      if (!captured) {
        await new Promise(r => {
          const c = setInterval(() => { if (captured) { clearInterval(c); r(); } }, 500);
          setTimeout(() => { clearInterval(c); r(); }, 10000);
        });
      }
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
  printStatus[req.params.rn] = { printed: true, date: new Date().toISOString(), docs: req.body.docs || 0, sdd: req.body.sdd || '' };
  savePrintStatus();
  res.json({ ok: true });
});

app.delete('/api/print/status', (req, res) => {
  printStatus = {};
  savePrintStatus();
  res.json({ ok: true });
});

app.delete('/api/print/status/:rn', (req, res) => {
  delete printStatus[req.params.rn];
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
    
    if ((tiRNs || []).length) await new Promise(r => setTimeout(r, 5000));
    
    // Download Trade-In docs (FR only) - 2 rounds with verification
    for (const rn of (tiRNs || [])) {
      try {
        // Clean old files
        fs.readdirSync(DL_DIR).filter(f => f.startsWith(rn) && !f.includes('PAGE_DE_GARDE') && !f.includes('ThirdParty') && !f.includes('SC_DELIVERY')).forEach(f => fs.unlinkSync(path.join(DL_DIR, f)));
        
        let hasAnnex = false, cerfaCount = 0;
        
        for (let round = 1; round <= 2; round++) {
          if (round > 1) {
            console.log('  Round 2 retry for', rn, '- waiting 3s...');
            await new Promise(r => setTimeout(r, 3000));
          }
          
          const listResp = await fetch(API + '/Invoices/' + rn + '/Document/list', { headers: h });
          const list = await listResp.json();
          const allDocs = list.responseObject?.documentList || [];
          
          const tiDocs = allDocs.filter(d => {
            const nl = (d.name || '').toLowerCase();
            if ((nl.includes('trade-in annex') || nl.includes('trade_in_annex')) && nl.includes('fr')) return true;
            if (nl.includes('cerfa') && (nl.includes('13751') || nl.includes('15776'))) return true;
            return false;
          });
          
          console.log('Trade-In docs for ' + rn + ' (round ' + round + '):', tiDocs.map(d => d.name).join(', '));
          
          for (const d of tiDocs) {
            const id = d.cgsContentId || d.dmsContentId;
            if (!id) continue;
            const fileName = rn + '_' + d.name.replace(/[^a-zA-Z0-9-]/g, '_') + '.pdf';
            const filePath = path.join(DL_DIR, fileName);
            if (fs.existsSync(filePath) && fs.statSync(filePath).size > 100) {
              console.log('  Already downloaded:', fileName);
              continue;
            }
            if (await downloadDoc(API, h, rn, id, fileName)) {
              results.downloaded++;
              results.files.push({ rn, name: d.name, fileName });
            }
          }
          
          // Verify: check Annex FR + 2 CERFAs
          const dlFiles = fs.readdirSync(DL_DIR).filter(f => f.startsWith(rn) && !f.includes('PAGE_DE_GARDE') && !f.includes('ThirdParty') && !f.includes('SC_DELIVERY') && f.endsWith('.pdf'));
          hasAnnex = dlFiles.some(f => f.toLowerCase().includes('annex'));
          cerfaCount = dlFiles.filter(f => f.toLowerCase().includes('cerfa')).length;
          
          if (hasAnnex && cerfaCount >= 2) {
            console.log('  All trade-in docs verified for', rn);
            break;
          }
          console.log('  Missing docs for', rn, '- annex:', hasAnnex, 'cerfas:', cerfaCount);
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


app.post('/api/print/pdg/:rn', async (req, res) => {
  try {
    const rn = req.params.rn;
    const date = req.body.date || new Date(Date.now() + 864e5).toISOString().split('T')[0];
    const printer = req.body.printer || config.hubs[config.defaultHub]?.printer || '';
    const browser = await getPdfBrowser();
    const page = await browser.newPage();
    await page.goto('http://localhost:' + PORT + '/api/print/page-de-garde/' + rn + '?date=' + date, { waitUntil: 'networkidle0', timeout: 15000 });
    const pdgPath = path.join(DL_DIR, rn + '_PAGE_DE_GARDE.pdf');
    await page.pdf({ path: pdgPath, format: 'A4', printBackground: true });
    await page.close();
    await ptp.print(pdgPath, { printer });
    res.json({ ok: true, printed: 1 });
  } catch(e) { res.status(500).json({ error: e.message }); }
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
    
    // Step 0: Clean old files for this RN
    fs.readdirSync(DL_DIR).filter(f => f.startsWith(rn + '_PAGE_DE_GARDE') || f.startsWith(rn + '_MERGED')).forEach(f => fs.unlinkSync(path.join(DL_DIR, f)));

    // Step 1: Generate page de garde PDF
    const browser = await getPdfBrowser();
    const page = await browser.newPage();
    await page.goto('http://localhost:' + PORT + '/api/print/page-de-garde/' + rn + '?date=' + date + (missPVL ? '&missPVL=1' : ''), { waitUntil: 'networkidle0', timeout: 15000 });
    const pdgPath = path.join(DL_DIR, rn + '_PAGE_DE_GARDE.pdf');
    await page.pdf({ path: pdgPath, format: 'A4', printBackground: true });
    await page.close();
    
    // Step 2: Collect all PDF paths in order
    const pdfPaths = [];
    pdfPaths.push(pdgPath); // Page de garde first
    
    // Trade-In docs (Annex FR first, then CERFAs)
    const tiFiles = fs.readdirSync(DL_DIR).filter(f => f.startsWith(rn) && !f.includes('PAGE_DE_GARDE') && !f.includes('SC_DELIVERY') && !f.includes('ThirdParty') && f.endsWith('.pdf'));
    tiFiles.sort((a, b) => (a.toLowerCase().includes('annex') ? 0 : 1) - (b.toLowerCase().includes('annex') ? 0 : 1));
    for (const doc of tiFiles) pdfPaths.push(path.join(DL_DIR, doc));
    
    // S&C for B2B
    const scFile = fs.readdirSync(DL_DIR).find(f => f.startsWith(rn) && f.includes('SC_DELIVERY_ACCEPTANCE'));
    if (scFile) pdfPaths.push(path.join(DL_DIR, scFile));
    
    // ThirdPartyDeliveryDeclaration for B2B
    const pvlFile = fs.readdirSync(DL_DIR).find(f => f.startsWith(rn) && f.includes('ThirdParty'));
    if (pvlFile) pdfPaths.push(path.join(DL_DIR, pvlFile));
    
    // Step 3: Merge all PDFs into one
    const merger = new PDFMerger();
    for (const p of pdfPaths) await merger.add(p);
    const mergedPath = path.join(DL_DIR, rn + '_MERGED.pdf');
    await merger.save(mergedPath);
    console.log('Merged', pdfPaths.length, 'PDFs into', mergedPath);
    
    // Step 4: Print single merged file
    try { await ptp.print(mergedPath, { printer }); results.printed = pdfPaths.length; results.files = pdfPaths.map(p => path.basename(p)); console.log('Printed merged PDF:', rn); }
    catch(e) { console.error('Print error:', e.message); }
    
    // Mark as printed (store SDD for pushback detection)
    printStatus[rn] = { printed: true, date: new Date().toISOString(), docs: results.printed, sdd: date };
    savePrintStatus();
    
    // Update DRO paperwork status
    try { await fetch(config.apis.dro + '/deliveryops/Customers/UpdatePaperwork?referenceNumber=' + rn + '&value=3', { method: 'POST', headers: { 'Authorization': 'Bearer ' + tokens.dro, 'Content-Type': 'application/json', 'userid': tokens.userId }, body: '{}' }); } catch(e) {}
    
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
    let tiBlock = '<div class="box" style="display:flex;flex-direction:column;background:#fce4ec;border-color:#f8bbd0"><div class="bt">Trade-In</div><div style="display:flex;align-items:center;justify-content:center;flex:1"><div class="pay-label" style="color:#c62828;font-size:22px;font-weight:700">NON</div></div></div>';
    if (ti && (ti.make || ti.model)) {
      tiBlock = `<div class="box ti-box"><div class="bt">Trade-In</div><div class="ti-car">${ti.make || ''} ${ti.model || ''}</div>${ti.plate ? '<div class="lb">IMMATRICULATION</div><div class="ti-plate">' + ti.plate + '</div>' : ''}${ti.status ? '<div class="ti-status">' + ti.status + '</div>' : ''}</div>`;
    }
    
    // FSD + Accessories
    const hasFSD = opts.includes('$APF2') || opts.includes('$APF1');
    const fsdTag = hasFSD ? '<span class="fsd-tag fsd-yes">Souscrit</span>' : '<span class="fsd-tag fsd-no">Non souscrit</span>';
    let accessories = '';
    if (opts.includes('$CPF0') || opts.includes('$CPF1')) accessories += '<span class="opt-tag">Crochet d\'attelage</span>';
    if (opts.includes('$TW01') || opts.includes('$TW00') || opts.includes('$IBW')) accessories += '<span class="opt-tag">Pack Hiver</span>';
    if (a.MobileConnectorDeliveryMethod) accessories += '<span class="opt-tag">UMC</span>';
    if (!accessories) accessories = '<span style="color:#ccc;font-size:12px">Aucun</span>';
    
    // Satisfaction gauge
    let score = 1;
    if ((a.LicensePlate || '').trim()) score++;
    if (a.AmountDueActionStatus === 'Yes' || a.PaymentMethodActionStatus === 'COMPLETE') score++;
    if (a.InsuranceActionStatus === 'COMPLETE') score++;
    if (a.VehicleStage === 'Finished Goods' || a.VehicleStage === 'Arrived at VRL') score++;
    if (a.HasHold) score = Math.max(1, score - 2);
    const gauge = '<div style="position:relative;width:100%;height:6px;background:linear-gradient(90deg,#ef9a9a,#ffcc80,#fff59d,#a5d6a7,#81c784);border-radius:3px"><div style="position:absolute;left:' + (score * 20) + '%;top:-4px;width:2px;height:14px;background:#171a20;border-radius:1px;transform:translateX(-1px)"></div></div>';
    
    // Vehicle status
    const vs = a.VehicleStage || '';
    let vsLabel = vs, vsClass = '';
    if (vs === 'Finished Goods' || vs === 'Arrived at VRL') { vsLabel = 'OTG'; vsClass = 'pay-cash'; }
    else if (vs === 'In Transit' || vs.includes('Transit')) { vsLabel = 'In Transit'; vsClass = 'pay-leasing'; }
    else if (vs === 'Staging' || vs.includes('Staging')) { vsLabel = 'Staging'; vsClass = 'pay-lld'; }
    else if (vs === 'Production' || vs.includes('Production')) { vsLabel = 'Production'; vsClass = 'pay-credit'; }
    else { vsLabel = vs || '?'; vsClass = ''; }
    
    // SV info
    let svInfo = '';
    if (a.IsRepairOrderHold || a.ServiceVisitGate === 'Incomplete') {
      svInfo = '<div style="margin-top:6px;font-size:12px;font-weight:700;color:#e65100"><span class="dot orange"></span>SV en cours</div>';
    } else if (a.ServiceVisitGate === 'Complete') {
      svInfo = '<div style="margin-top:6px;font-size:12px;font-weight:700;color:#28a745"><span class="dot green"></span>SV OK</div>';
    }
    
    // Miss PVL alert
    let missPVLAlert = '';
    if (missPVL) missPVLAlert = '<div style="background:#fce4ec;border:1px solid #e57373;border-radius:6px;padding:6px 10px;margin-bottom:4px;font-size:12px;font-weight:700;color:#c62828">! Miss PVL Tiers</div>';
    
    // Incentive card (always show for non-enterprise, 3 checkboxes)
    let incentiveCard = '';
    if (!a.IsEnterpriseOrder) {
      incentiveCard = '<div class="notes" style="flex:1;border-color:#90caf9;background:#f5f9ff"><div class="bt" style="color:#1565c0">INCENTIVE / CEE</div><div style="margin-top:8px"><label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:8px"><input type="checkbox" style="width:16px;height:16px;accent-color:#28a745"> <span style="color:#28a745;font-weight:600">To Sign</span></label><label style="display:flex;align-items:center;gap:8px;font-size:13px;margin-bottom:8px"><input type="checkbox" style="width:16px;height:16px;accent-color:#28a745"> <span style="color:#28a745;font-weight:600">OK</span></label><label style="display:flex;align-items:center;gap:8px;font-size:13px"><input type="checkbox" style="width:16px;height:16px;accent-color:#c62828"> <span style="color:#c62828;font-weight:600">NO CEE</span></label></div></div>';
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
    let qrDataUrl = '';
    try { qrDataUrl = await QRCode.toDataURL(a.Vin || rn, { width: 120, margin: 1 }); } catch(e) {}
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
      '{{QR_CODE}}': qrDataUrl,
      '{{MISS_PVL_ALERT}}': missPVLAlert,
      '{{INCENTIVE_CARD}}': incentiveCard,
      '{{VS_LABEL}}': vsLabel,
      '{{VS_CLASS}}': vsClass,
      '{{SV_INFO}}': svInfo
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
// PRINT CANCEL: Clear the print spooler queue
// ============================================================
app.post('/api/print/cancel', (req, res) => {
  try {
    require('child_process').execSync('net stop spooler & del /Q /F %SystemRoot%\\System32\\spool\\PRINTERS\\* & net start spooler', { shell: 'cmd.exe', timeout: 15000 });
    res.json({ ok: true });
  } catch(e) {
    try { require('child_process').execSync('net start spooler', { shell: 'cmd.exe' }); } catch(e2) {}
    res.json({ ok: true, warning: e.message });
  }
});

// ============================================================
// BI DATA: Parse Arrivals + CSAT CSVs
// ============================================================
app.get('/api/bi/arrivals', (req, res) => {
  try {
    const csvPath = path.join(__dirname, 'data', 'arrivals.csv');
    
    // Auto-detect new file in Downloads
    const dlDir = path.join(os.homedir(), 'Downloads');
    const dlFiles = fs.readdirSync(dlDir)
      .filter(f => (f.toLowerCase() === 'viz.csv' || f.toLowerCase() === 'eta buckets.csv' || f.toLowerCase().startsWith('vehicle arrival')) && f.endsWith('.csv'))
      .map(f => ({ name: f, path: path.join(dlDir, f), mtime: fs.statSync(path.join(dlDir, f)).mtime }))
      .sort((a, b) => b.mtime - a.mtime);
    
    if (dlFiles.length && dlFiles[0].mtime > (fs.existsSync(csvPath) ? fs.statSync(csvPath).mtime : new Date(0))) {
      // New file found in Downloads - convert and install
      const raw = fs.readFileSync(dlFiles[0].path);
      let text;
      if (raw[0] === 0xFF && raw[1] === 0xFE) {
        text = raw.toString('utf16le'); // UTF-16 LE
      } else {
        text = raw.toString('utf8');
      }
      fs.writeFileSync(csvPath, text, 'utf8');
      console.log('Arrivals auto-imported from:', dlFiles[0].name);
    }
    
    if (!fs.existsSync(csvPath)) return res.json({ error: 'No data' });
    const raw = fs.readFileSync(csvPath, 'utf8');
    const lines = raw.split('\n').filter(l => l.trim());
    
    // Detect format: ETA Buckets (aggregated) vs Daily (dates as columns)
    const isAggregated = lines[0] && (lines[0].includes('On-Site') || lines[0].includes('Off-Site'));
    
    if (isAggregated) {
      // ETA Buckets format: Arrived | Arriving Next 2 Days | Preliminary
      let arrived = 0, arriving = 0, preliminary = 0;
      for (const line of lines) {
        const cols = line.split('\t');
        const geo = (cols[0] || '').trim();
        if (geo === 'France' || geo.includes('Total')) {
          const trim = (cols[1] || '').trim();
          if (trim === '*' || trim === 'Total') {
            arrived += parseInt(cols[2]) || 0;
            arriving += parseInt(cols[3]) || 0;
          }
          if (trim !== '*' && trim !== 'Total') {
            preliminary += parseInt(cols[4]) || 0;
          }
        }
      }
      // Find total row
      const totalLine = lines.find(l => l.includes('Total'));
      if (totalLine) {
        const tc = totalLine.split('\t');
        arrived = parseInt(tc[2]) || arrived;
        arriving = parseInt(tc[3]) || arriving;
        preliminary = parseInt(tc[4]) || preliminary;
      }
      const inTransit = arriving + preliminary;
      const thisWeek = arrived + arriving + preliminary;
      res.json({ 
        summary: { arrivedTotal: arrived, inTransit, thisWeek },
        data: { dates: ['Arrived', 'Next 2 Days', 'Preliminary'], arrived: [arrived], confident: [arriving], preliminary: [preliminary], total: [thisWeek] },
        lastUpdate: fs.statSync(csvPath).mtime
      });
    } else {
      // Daily format with dates as columns
      const headers = lines[1].split('\t');
      // Find first date column - look for date pattern (dd/mm or similar)
      let dateStart = -1;
      for (let i = 2; i < headers.length; i++) {
        const h = headers[i].trim();
        if (h.match(/^\d{2}[\/-]\d{2}/)) { dateStart = i; break; }
      }
      if (dateStart === -1) {
        dateStart = 4;
        if (headers[4] && headers[4].trim().toLowerCase().startsWith('total')) dateStart = 5;
      }
      const dates = headers.slice(dateStart).map(d => d.trim()).filter(d => d);
      const data = { dates: [], arrived: [], confident: [], preliminary: [], total: [] };
      const totals = new Array(dates.length).fill(0);
      for (let i = 2; i < lines.length; i++) {
        const cols = lines[i].split('\t');
        // Find breakdown column (could be col 1, 2 or 3)
        let breakdown = '';
        for (let c = 0; c < Math.min(cols.length, 4); c++) {
          const v = (cols[c] || '').trim();
          if (v === 'Arrived' || v === 'Confident ETA' || v.includes('Preliminary') || v.includes('Total')) { breakdown = v; break; }
        }
        const values = cols.slice(dateStart).map(v => parseInt(v.trim()) || 0);
        if (i === 2) data.dates = dates;
        // Only use aggregate rows (marked with * or first occurrence)
        const isAgg = cols.some(c => (c||'').trim() === '*') || (cols[0]||'').trim() === 'France' || (cols[0]||'').trim().includes('Total');
        if (breakdown === 'Arrived' && isAgg) data.arrived = values;
        else if (breakdown === 'Confident ETA' && isAgg) data.confident = values;
        else if (breakdown.includes('Preliminary') && isAgg) data.preliminary = values;
        else if (breakdown.includes('Total')) data.total = values;
      }
      // Build totals if not found
      if (!data.total.length) {
        data.total = dates.map(function(_, i) {
          return (data.arrived[i] || 0) + (data.confident[i] || 0) + (data.preliminary[i] || 0);
        });
      }
    const arrivedTotal = data.arrived.reduce((a, b) => a + b, 0);
    const inTransit = data.confident.reduce((a, b) => a + b, 0) + data.preliminary.reduce((a, b) => a + b, 0);
    const thisWeek = data.total.slice(0, 7).reduce((a, b) => a + b, 0);
    res.json({ summary: { arrivedTotal, inTransit, thisWeek }, data, lastUpdate: fs.statSync(csvPath).mtime });
    }
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/bi/csat', (req, res) => {
  try {
    const advPath = path.join(__dirname, 'data', 'csat-advisors.csv');
    if (!fs.existsSync(advPath)) return res.json({ error: 'No data' });
    const advLines = fs.readFileSync(advPath, 'utf8').split('\n').filter(l => l.trim());
    const advisors = {};
    for (const line of advLines.slice(1)) {
      const cols = line.split('\t');
      const name = (cols[0] || '').trim();
      if (!name || advisors[name]) continue;
      advisors[name] = { name, score: (cols[2] || '').trim(), scoreRaw: parseFloat((cols[3] || '0').replace(',', '.')) || 0, count: parseInt(cols[4]) || 0 };
    }
    const ddPath = path.join(__dirname, 'data', 'csat-deliveryday.csv');
    let weeks = [], scores = [];
    if (fs.existsSync(ddPath)) {
      const ddLines = fs.readFileSync(ddPath, 'utf8').split('\n').filter(l => l.trim());
      if (ddLines.length >= 6) {
        const hCols = ddLines[0].split('\t');
        const sCols = ddLines[5].split('\t');
        for (let i = Math.max(2, hCols.length - 8); i < hCols.length; i++) {
          const w = (hCols[i] || '').trim();
          if (!w) continue;
          weeks.push(w);
          scores.push(Math.round(parseFloat((sCols[i] || '0').replace('%', '').replace(',', '.')) * 10) / 10 || 0);
        }
      }
    }
    const ces = ['Ben Daubin', 'SACHA VILLA', 'Sophie MAC'];
    const cesData = Object.values(advisors).filter(a => ces.some(c => a.name.toUpperCase().includes(c.toUpperCase().substring(0, 5))));
    const totalSurveys = cesData.reduce((a, c) => a + c.count, 0);
    const avgScore = cesData.length ? Math.round(cesData.reduce((a, c) => a + c.scoreRaw, 0) / cesData.length) : 0;
    res.json({ summary: { avgScore: avgScore + '%', totalSurveys }, advisors: cesData, weekly: { weeks, scores }, lastUpdate: fs.statSync(advPath).mtime });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// STOCK API — Tesladex CSV import
// ============================================================
app.get('/api/bi/stock', (req, res) => {
  try {
    const csvPath = path.join(__dirname, 'data', 'stock.csv');
    if (!fs.existsSync(csvPath)) return res.json({ error: 'No stock data. Export from Tesladex and save as server/data/stock.csv' });
    const raw = fs.readFileSync(csvPath, 'utf8');
    const lines = raw.split('\n').filter(l => l.trim());
    const headers = lines[0].split(',');

    const vehicles = [];
    for (let i = 1; i < lines.length; i++) {
      // Handle CSV with possible commas in fields
      const cols = lines[i].split(',');
      const v = {};
      headers.forEach((h, idx) => { v[h.trim()] = (cols[idx] || '').trim(); });

      // Parse bday to age in days
      let ageDays = 0;
      if (v.bday) {
        try { ageDays = Math.floor((Date.now() - new Date(v.bday).getTime()) / 86400000); } catch(e) {}
      }

      // Friendly color name
      const colorMap = {
        'PEARL_WHITE': 'Blanc', 'SOLID_BLACK': 'Noir', 'DEEP_BLUE': 'Bleu',
        'MIDNIGHT_SILVER': 'Gris', 'RED_MULTICOAT': 'Rouge', 'ULTRA_RED': 'Rouge',
        'STEALTH_GREY': 'Gris', 'QUICKSILVER': 'Argent', 'DIAMOND_BLACK': 'Noir Diam.',
        'MARINE_BLUE': 'Bleu Marine'
      };

      // Friendly trim
      const trimMap = { '50': 'SR+', '74': 'LR', '74D': 'LR AWD', 'P74D': 'Performance' };

      // Wheel short name
      const wheelMap = {
        'PINWHEEL_REFRESH_18': 'Photon 18"', 'PINWHEEL_18': 'Photon 18"',
        'STILETTO_REFRESH_19': 'Nova 19"', 'STILETTO_19': 'Nova 19"',
        'GLIDER_18': 'Glider 18"', 'HELIX_19': 'Helix 19"',
        'GEMINI_19': 'Gemini 19"', 'INDUCTION_20': 'Induction 20"',
        'UBERTURB_22': 'Uberturbine 22"'
      };

      // Model name
      const modelName = v.model === '3' ? 'Model 3' : v.model === 'y' ? 'Model Y' : 'Model ' + v.model;

      // Type short
      const typeMap = {
        'customer-vehicle': 'Customer', 'inventory-vehicle': 'Inventory',
        'marketing-vehicle': 'Marketing', 'service-loaner': 'Service Loaner',
        'internal-vehicle': 'Internal', 'mobileservice': 'Mobile Service',
        'engineering-vehicle': 'Engineering'
      };

      // Dwell: days since eta2sc_date (arrival at SC)
      let dwellDays = null;
      const eta = v['delivery_details.eta2sc_date'];
      if (eta) {
        try { dwellDays = Math.floor((Date.now() - new Date(eta).getTime()) / 86400000); } catch(e) {}
      }

      // SDD
      const sdd = v['delivery_details.scheduled_delivery_date'] || '';
      const matched = sdd ? true : false;

      vehicles.push({
        vin: v.vin || '',
        type: typeMap[v.vehicle_type] || v.vehicle_type || '',
        typeRaw: v.vehicle_type || '',
        model: modelName,
        modelRaw: v.model || '',
        trim: trimMap[v.cfg_trim] || v.cfg_trim || '',
        trimRaw: v.cfg_trim || '',
        color: colorMap[v.cfg_exteriorcolor] || v.cfg_exteriorcolor || '',
        colorRaw: v.cfg_exteriorcolor || '',
        interior: v.cfg_interiortrimtype || '',
        wheels: wheelMap[v.cfg_wheeltype] || v.cfg_wheeltype || '',
        tow: v.cfg_towpackage !== 'NONE' ? v.cfg_towpackage : '',
        odo: parseFloat(v.odo) || 0,
        steering: v.cfg_steeringwheelcontrollertype || '',
        bday: v.bday || '',
        ageDays: ageDays,
        location: v.vehicle_routing_location || '',
        trtId: v.trt_id || '',
        eta: eta || '',
        sdd: sdd,
        matched: matched,
        hold: v.containment_hold || '',
        dwellDays: dwellDays
      });
    }

    // Stats
    const rennes = vehicles.filter(v => v.trtId === '28498');
    const byType = {};
    rennes.forEach(v => { byType[v.type] = (byType[v.type] || 0) + 1; });
    const byModel = {};
    rennes.forEach(v => { byModel[v.model] = (byModel[v.model] || 0) + 1; });
    const byColor = {};
    rennes.forEach(v => { byColor[v.color] = (byColor[v.color] || 0) + 1; });
    const byTrim = {};
    rennes.forEach(v => { byTrim[v.trim] = (byTrim[v.trim] || 0) + 1; });
    const matchedCount = rennes.filter(v => v.matched).length;
    const unmatchedCount = rennes.filter(v => !v.matched).length;
    const withHold = rennes.filter(v => v.hold).length;
    const withTow = rennes.filter(v => v.tow).length;
    const customerCount = rennes.filter(v => v.typeRaw === 'customer-vehicle').length;
    const inventoryCount = rennes.filter(v => v.typeRaw === 'inventory-vehicle').length;
    const otherCount = rennes.length - customerCount - inventoryCount;

    // Dwell aging buckets for Rennes (vehicles with eta date in past = on site)
    const onSite = rennes.filter(v => v.dwellDays !== null && v.dwellDays >= 0);
    const aging = { '0-7': 0, '8-14': 0, '15-30': 0, '31-60': 0, '60+': 0 };
    onSite.forEach(v => {
      if (v.dwellDays <= 7) aging['0-7']++;
      else if (v.dwellDays <= 14) aging['8-14']++;
      else if (v.dwellDays <= 30) aging['15-30']++;
      else if (v.dwellDays <= 60) aging['31-60']++;
      else aging['60+']++;
    });

    res.json({
      total: vehicles.length,
      rennes: rennes.length,
      vehicles: vehicles,
      stats: { byType, byModel, byColor, byTrim, matchedCount, unmatchedCount, withHold, withTow, customerCount, inventoryCount, otherCount, aging, onSiteCount: onSite.length },
      lastUpdate: fs.statSync(csvPath).mtime
    });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Upload new stock CSV
app.post('/api/bi/stock/upload', express.text({ type: '*/*', limit: '5mb' }), (req, res) => {
  try {
    const csvPath = path.join(__dirname, 'data', 'stock.csv');
    fs.writeFileSync(csvPath, req.body);
    res.json({ ok: true });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// ============================================================
// TAB FRAGMENTS: CSAT + Arrivals + Stock HTML served dynamically
// ============================================================
app.get('/api/tab/tradein', (req, res) => {
  res.send('<div style="padding:0 32px 24px;font-family:var(--tds-font-family-latin-text, \'Universal Sans Text\', -apple-system, Arial, sans-serif);color:var(--tds-color--foreground-high-contrast, #171a20)">'
    + '<div id="tiCharts"><div style="text-align:center;padding:20px;color:#ccc">Loading charts...</div></div>'
    + '<div style="display:flex;gap:8px;margin-bottom:16px;align-items:center">'
    + '<button id="tiBtnOnsite" style="padding:8px 20px;background:#3e6ae1;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer">On Site (0)</button>'
    + '<button id="tiBtnHistory" style="padding:8px 20px;background:#e0e0e0;color:#666;border:none;border-radius:6px;font-size:13px;font-weight:600;cursor:pointer">History (0)</button>'
    + '<div style="flex:1"></div>'
    + '<input type="text" id="tiSearch" placeholder="Rechercher..." oninput="SEARCHTI(this.value)" style="padding:8px 14px;border:1px solid rgba(128,128,128,.3);border-radius:8px;font-size:13px;font-family:inherit;color:inherit;background:rgba(128,128,128,.08);outline:none;width:220px">'
    + '<button onclick="TRIGGERSCAN(this)" style="padding:8px 20px;background:rgba(139,92,246,.15);color:#8b5cf6;border:1px solid rgba(139,92,246,.3);border-radius:6px;font-size:13px;font-weight:600;cursor:pointer;margin-left:8px">Scan</button>'
    + '<button onclick="ENRICHTI(this)" style="padding:8px 14px;background:rgba(59,130,246,.1);color:#60a5fa;border:1px solid rgba(59,130,246,.2);border-radius:6px;font-size:12px;cursor:pointer;margin-left:4px;font-family:inherit">Enrich</button>'
    + '</div>'
    + '<div style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);overflow-x:auto">'
    + '<table style="width:100%;border-collapse:collapse;font-size:13px">'
    + '<thead><tr style="border-bottom:2px solid #eee">'
    + '<th style="text-align:left;padding:10px;color:#888;font-size:11px;text-transform:uppercase">In</th>'
    + '<th style="text-align:left;padding:10px;color:#888;font-size:11px;text-transform:uppercase">VIN</th>'
    + '<th style="text-align:left;padding:10px;color:#888;font-size:11px;text-transform:uppercase">Immat.</th>'
    + '<th style="text-align:left;padding:10px;color:#888;font-size:11px;text-transform:uppercase">Marque</th>'
    + '<th style="text-align:left;padding:10px;color:#888;font-size:11px;text-transform:uppercase">Model</th>'
    + '<th style="text-align:left;padding:10px;color:#888;font-size:11px;text-transform:uppercase">RN</th>'
    + '<th id="tiOutHeader" style="text-align:center;padding:10px;color:#888;font-size:11px;text-transform:uppercase">Status</th>'
    + '<th style="text-align:center;padding:10px;color:#888;font-size:11px;text-transform:uppercase">Dwell</th>'
    + '<th style="text-align:center;padding:10px;color:#888;font-size:11px;text-transform:uppercase">Action</th>'
    + '</tr></thead>'
    + '<tbody id="tiTrackBody"><tr><td colspan="9" style="text-align:center;color:#ccc;padding:40px">Loading...</td></tr></tbody>'
    + '</table></div></div>');
});

app.get('/api/tab/csat', (req, res) => {
  var html = ''
    + '<div style="padding:0 32px 24px;font-family:var(--tds-font-family-latin-text, \'Universal Sans Text\', -apple-system, Arial, sans-serif);color:var(--tds-color--foreground-high-contrast, #171a20);">'
    + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:24px;">'
    // Score Moyen card
    + '<div style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:20px;">'
    + '<div style="font-size:13px;color:#5c5e62;font-weight:500;text-transform:uppercase;letter-spacing:.5px;">Score Moyen</div>'
    + '<div style="display:flex;align-items:baseline;gap:6px;margin-top:8px;">'
    + '<span id="csatScore" style="font-size:36px;font-weight:700;color:#171a20;">--</span>'
    + '<span style="font-size:16px;color:#5c5e62;font-weight:500;">/5</span>'
    + '</div>'
    + '<div style="margin-top:12px;height:6px;border-radius:3px;background:#e9ecef;overflow:hidden;">'
    + '<div id="csatScoreBar" style="width:0%;height:100%;border-radius:3px;background:#28a745;transition:width .5s;"></div>'
    + '</div>'
    + '</div>'
    // NPS card
    + '<div style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:20px;">'
    + '<div style="font-size:13px;color:#5c5e62;font-weight:500;text-transform:uppercase;letter-spacing:.5px;">NPS</div>'
    + '<div style="display:flex;align-items:baseline;gap:8px;margin-top:8px;">'
    + '<span id="csatNps" style="font-size:36px;font-weight:700;color:#3e6ae1;">--</span>'
    + '</div>'
    + '<div style="margin-top:10px;font-size:12px;color:#28a745;font-weight:600;">'
    + '<span id="csatNpsTrend">--</span>'
    + '</div>'
    + '</div>'
    // Surveys card
    + '<div style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:20px;">'
    + '<div style="font-size:13px;color:#5c5e62;font-weight:500;text-transform:uppercase;letter-spacing:.5px;">Surveys</div>'
    + '<div style="margin-top:8px;">'
    + '<span id="csatSurveys" style="font-size:36px;font-weight:700;color:#171a20;">--</span>'
    + '</div>'
    + '<div style="margin-top:10px;font-size:12px;color:#5c5e62;">'
    + '<span id="csatResponseRate">Taux de r\u00e9ponse: --</span>'
    + '</div>'
    + '</div>'
    // Tendance card
    + '<div style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:20px;">'
    + '<div style="font-size:13px;color:#5c5e62;font-weight:500;text-transform:uppercase;letter-spacing:.5px;">Tendance</div>'
    + '<div style="display:flex;align-items:center;gap:8px;margin-top:8px;">'
    + '<span id="csatTrendArrow" style="font-size:28px;color:#999;">--</span>'
    + '<span id="csatTrendPct" style="font-size:36px;font-weight:700;color:#999;">--%</span>'
    + '</div>'
    + '<div style="margin-top:10px;font-size:12px;color:#5c5e62;">vs. mois pr\u00e9c\u00e9dent</div>'
    + '</div>'
    + '</div>'
    // Score par CES table
    + '<div style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:20px;margin-bottom:24px;">'
    + '<div style="font-size:15px;font-weight:700;color:#171a20;margin-bottom:16px;">Score par CES</div>'
    + '<table style="width:100%;border-collapse:collapse;font-size:14px;">'
    + '<thead>'
    + '<tr style="border-bottom:2px solid #e9ecef;">'
    + '<th style="text-align:left;padding:10px 12px;color:#5c5e62;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">CES</th>'
    + '<th style="text-align:center;padding:10px 12px;color:#5c5e62;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Score</th>'
    + '<th style="text-align:center;padding:10px 12px;color:#5c5e62;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Surveys</th>'
    + '<th style="text-align:center;padding:10px 12px;color:#5c5e62;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Tendance</th>'
    + '</tr>'
    + '</thead>'
    + '<tbody>'
    + '<tr style="border-bottom:1px solid #f0f0f0;background:#fff;">'
    + '<td style="padding:12px;font-weight:500;">Ben Daubin</td>'
    + '<td style="text-align:center;padding:12px;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ccc;margin-right:8px;vertical-align:middle;"></span><span id="csatScoreBen" style="font-weight:600;">--</span></td>'
    + '<td id="csatSurveysBen" style="text-align:center;padding:12px;color:#5c5e62;">--</td>'
    + '<td style="text-align:center;padding:12px;color:#999;font-weight:600;"><span id="csatTrendBen">--</span></td>'
    + '</tr>'
    + '<tr style="border-bottom:1px solid #f0f0f0;background:#fafafa;">'
    + '<td style="padding:12px;font-weight:500;">Sacha Villa</td>'
    + '<td style="text-align:center;padding:12px;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ccc;margin-right:8px;vertical-align:middle;"></span><span id="csatScoreSacha" style="font-weight:600;">--</span></td>'
    + '<td id="csatSurveysSacha" style="text-align:center;padding:12px;color:#5c5e62;">--</td>'
    + '<td style="text-align:center;padding:12px;color:#999;font-weight:600;"><span id="csatTrendSacha">--</span></td>'
    + '</tr>'
    + '<tr style="border-bottom:1px solid #f0f0f0;background:#fff;">'
    + '<td style="padding:12px;font-weight:500;">Sophie MACE</td>'
    + '<td style="text-align:center;padding:12px;"><span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#ccc;margin-right:8px;vertical-align:middle;"></span><span id="csatScoreSophie" style="font-weight:600;">--</span></td>'
    + '<td id="csatSurveysSophie" style="text-align:center;padding:12px;color:#5c5e62;">--</td>'
    + '<td style="text-align:center;padding:12px;color:#999;font-weight:600;"><span id="csatTrendSophie">--</span></td>'
    + '</tr>'
    + '</tbody>'
    + '</table>'
    + '</div>'
    // Delivery Day Score chart
    + '<div style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:20px;">'
    + '<div style="font-size:15px;font-weight:700;color:#171a20;margin-bottom:16px;">Delivery Day Score</div>'
    + '<div id="csatWeeklyChart" style="display:flex;align-items:flex-end;gap:12px;height:140px;padding:0 8px;">'
    + '<div style="text-align:center;color:#999;width:100%;padding-top:50px;">Loading...</div>'
    + '</div>'
    + '</div>'
    + '</div>';
  res.set('Content-Type', 'text/html');
  res.send(html);
});

app.get('/api/tab/arrivals', (req, res) => {
  var html = ''
    + '<div style="padding:0 32px 24px;font-family:var(--tds-font-family-latin-text, \'Universal Sans Text\', -apple-system, Arial, sans-serif);color:var(--tds-color--foreground-high-contrast, #171a20);">'
    + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px;">'
    // Today card
    + '<div style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:20px;">'
    + '<div style="font-size:13px;color:#5c5e62;font-weight:500;text-transform:uppercase;letter-spacing:.5px;">Today</div>'
    + '<div style="display:flex;align-items:baseline;gap:8px;margin-top:8px;">'
    + '<span id="arrToday" style="font-size:36px;font-weight:700;color:#28a745;">--</span>'
    + '<span style="font-size:14px;color:#5c5e62;">scheduled</span>'
    + '</div>'
    + '<div style="margin-top:10px;font-size:12px;color:#5c5e62;">'
    + '<span id="arrTodayDetail">--</span>'
    + '</div>'
    + '</div>'
    // This Week card
    + '<div style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:20px;">'
    + '<div style="font-size:13px;color:#5c5e62;font-weight:500;text-transform:uppercase;letter-spacing:.5px;">This Week</div>'
    + '<div style="display:flex;align-items:baseline;gap:8px;margin-top:8px;">'
    + '<span id="arrWeek" style="font-size:36px;font-weight:700;color:#171a20;">--</span>'
    + '<span style="font-size:14px;color:#5c5e62;">expected</span>'
    + '</div>'
    + '<div style="margin-top:10px;font-size:12px;color:#28a745;font-weight:600;">'
    + '<span id="arrWeekPct">--</span>'
    + '</div>'
    + '</div>'
    // In Transit card
    + '<div style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:20px;">'
    + '<div style="font-size:13px;color:#5c5e62;font-weight:500;text-transform:uppercase;letter-spacing:.5px;">In Transit</div>'
    + '<div style="display:flex;align-items:baseline;gap:8px;margin-top:8px;">'
    + '<span id="arrTransit" style="font-size:36px;font-weight:700;color:#3e6ae1;">--</span>'
    + '<span style="font-size:14px;color:#5c5e62;">vehicles</span>'
    + '</div>'
    + '<div style="margin-top:12px;height:6px;border-radius:3px;background:#e9ecef;overflow:hidden;">'
    + '<div id="arrTransitBar" style="width:0%;height:100%;border-radius:3px;background:#3e6ae1;transition:width .5s;"></div>'
    + '</div>'
    + '</div>'
    + '</div>'
    // Daily arrivals chart
    + '<div style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:20px;margin-bottom:24px;">'
    + '<div style="font-size:15px;font-weight:700;color:#171a20;margin-bottom:16px;">Arriv\u00e9es de la Semaine</div>'
    + '<div id="arrDailyChart" style="display:flex;align-items:flex-end;gap:8px;height:180px;padding:0 4px;">'
    + '<div style="text-align:center;color:#999;width:100%;padding-top:50px;">Loading...</div>'
    + '</div>'
    + '<div id="arrLegend"></div>'
    + '</div>'
    // Vehicle detail table
    + '<div style="background:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(0,0,0,.06);padding:20px;">'
    + '<div style="font-size:16px;font-weight:600;margin-bottom:16px;">D\u00e9tail par Date</div>'
    + '<table style="width:100%;border-collapse:collapse;">'
    + '<thead>'
    + '<tr>'
    + '<th style="text-align:left;padding:10px 14px;width:120px">Date</th>'
    + '<th style="text-align:left;padding:10px 14px;width:140px">Type</th>'
    + '<th style="text-align:left;padding:10px 14px;width:80px">Count</th>'
    + '</tr>'
    + '</thead>'
    + '<tbody id="arrVehicleBody">'
    + '<tr><td colspan="3" style="padding:40px;text-align:center;color:#999;">Loading...</td></tr>'
    + '</tbody>'
    + '</table>'
    + '</div>'
    + '</div>';
  res.set('Content-Type', 'text/html');
  res.send(html);
});

app.get('/api/tab/stock', (req, res) => {
  res.send('<div style="padding:0 32px 24px;font-family:var(--tds-font-family-latin-text, \'Universal Sans Text\', -apple-system, Arial, sans-serif);color:var(--tds-color--foreground-high-contrast, #171a20)">'
    + '<div id="stockContent"><div style="text-align:center;padding:60px;color:#999">Loading...</div></div>'
    + '</div>');
});

// ============================================================
// CONFIG
// ============================================================
// Serve the local bookmarklet script
app.get('/api/bookmarklet.js', (req, res) => {
  const scriptPath = path.join(__dirname, '..', 'content-v10.js');
  if (fs.existsSync(scriptPath)) {
    res.set('Content-Type', 'application/javascript');
    res.set('Cache-Control', 'no-store, no-cache');
    res.send(fs.readFileSync(scriptPath, 'utf8'));
  } else {
    res.status(404).send('// bookmarklet not found');
  }
});

app.get('/api/config', (req, res) => {
  const hubId = req.query.hub || config.defaultHub;
  const hub = config.hubs[hubId];
  if (!hub) return res.status(404).json({ error: 'Hub not found' });
  res.json({ hub, hubId, allHubs: Object.keys(config.hubs) });
});

// ============================================================
// DELIVERY NOTES API
// ============================================================
const notesFile = path.join(__dirname, 'data', 'delivery-notes.json');
let deliveryNotes = {};
try { deliveryNotes = JSON.parse(fs.readFileSync(notesFile, 'utf8')); } catch(e) {}
function saveNotes() { fs.writeFileSync(notesFile, JSON.stringify(deliveryNotes, null, 2)); }

app.get('/api/notes', (req, res) => { res.json(deliveryNotes); });
app.get('/api/notes/:rn', (req, res) => { res.json({ rn: req.params.rn, note: deliveryNotes[req.params.rn] || '' }); });
app.post('/api/notes/:rn', (req, res) => {
  deliveryNotes[req.params.rn] = req.body.note || '';
  saveNotes();
  res.json({ ok: true });
});

// ============================================================
// DUE BILLS API
// ============================================================
const dueBillsFile = path.join(__dirname, 'data', 'due-bills.json');
let dueBills = [];
try { dueBills = JSON.parse(fs.readFileSync(dueBillsFile, 'utf8')); } catch(e) {}
function saveDueBills() { fs.writeFileSync(dueBillsFile, JSON.stringify(dueBills, null, 2)); }

app.get('/api/duebills', (req, res) => { res.json(dueBills); });

app.post('/api/duebills', (req, res) => {
  const bill = {
    id: Date.now(),
    rn: req.body.rn || '',
    vin: req.body.vin || '',
    customer: req.body.customer || '',
    deliveryDate: req.body.deliveryDate || new Date().toISOString().split('T')[0],
    issue: req.body.issue || '',
    type: req.body.type || 'Cosmetic',
    status: req.body.status || 'Open',
    createdDate: new Date().toISOString().split('T')[0],
    notes: req.body.notes || '',
    ces: req.body.ces || ''
  };
  dueBills.push(bill);
  saveDueBills();
  res.json({ ok: true, bill });
});

app.put('/api/duebills/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const idx = dueBills.findIndex(b => b.id === id);
  if (idx >= 0) {
    Object.assign(dueBills[idx], req.body);
    saveDueBills();
    res.json({ ok: true, bill: dueBills[idx] });
  } else {
    res.status(404).json({ error: 'Not found' });
  }
});

app.delete('/api/duebills/:id', (req, res) => {
  const id = parseInt(req.params.id);
  dueBills = dueBills.filter(b => b.id !== id);
  saveDueBills();
  res.json({ ok: true });
});

// ============================================================
// DASHBOARD LIVE: Pre-generate the full dashboard HTML
// ============================================================
app.get('/dashboard-live', (req, res) => {
  try {
    const scriptPath = path.join(__dirname, '..', 'content-v10.js');
    let script = fs.readFileSync(scriptPath, 'utf8');
    
    const hub = config.hubs[config.defaultHub];
    const userId = tokens.userId || '428058';
    
    // Patch 1: Replace token check
    script = script.replace(
      /var tk=\(localStorage[\s\S]*?if\(!at\|\|!ui\)\{alert\('Token not found!'\);return\}/,
      'var at="proxy";var ui="' + userId + '"'
    );
    
    // Patch 2: Replace server detect with direct call
    script = script.replace(
      /\/\/ Server URL[\s\S]*?\(async function\(\)\{[\s\S]*?startHub\(\);\s*\}\)\(\);/,
      'var SERVER="";startHub();'
    );
    
    // Patch 3: Replace window.open with capture
    script = script.replace(
      /var w=window\.open\('','_blank'\);\s*if\(!w\)\{alert\('Popup blocked!'\);return\}\s*w\.document\.open\(\);\s*w\.document\.write\(/,
      'var _html=('
    );
    script = script.replace(/w\.document\.close\(\)/, 'window.__dashHTML=_html');
    
    // Patch 4: Replace DRO API
    script = script.replace(/https:\/\/mytdeliveryopsapi\.tesla\.com\/api/g, '/api/dro');
    
    // Patch 5: trtId
    script = script.replace(/trtId:28498/g, 'trtId:' + hub.trtId);
    
    // Patch 6: CES
    if (hub.ces) {
      const cesNames = JSON.stringify(hub.ces.map(c => c.name));
      script = script.replace(
        /var CES=\['Ben Daubin','Sacha Villa','Sophie MACE'\];/,
        'var CES=' + cesNames + ';'
      );
    }
    
    // Execute to capture HTML
    const vm = require('vm');
    const sandbox = {
      window: { __dashHTML: '' },
      document: { addEventListener: function(){} },
      localStorage: { getItem: function(){ return ''; }, setItem: function(){} },
      alert: function(){},
      setInterval: function(){},
      setTimeout: function(){},
      fetch: function(){ return Promise.resolve({ json: function(){ return {}; }, text: function(){ return ''; } }); }
    };
    
    try {
      vm.runInNewContext(script, sandbox, { timeout: 5000 });
    } catch(e) {
      // Expected - async code won't fully resolve
    }
    
    let html = sandbox.window.__dashHTML || '';
    
    if (!html) {
      // Fallback: extract HTML directly from the script string
      const writeStart = script.indexOf("var _html=('") + 12;
      const writeEnd = script.indexOf("window.__dashHTML=_html");
      if (writeStart > 12 && writeEnd > writeStart) {
        const htmlExpr = script.substring(writeStart, writeEnd - 3);
        try {
          // Create a function context with the needed variables
          const at = 'proxy', ui = userId, SERVER = '';
          const CES = hub.ces ? hub.ces.map(c => c.name) : ['Ben Daubin','Sacha Villa','Sophie MACE'];
          const CFG = { trtId: hub.trtId, cc: 'FR' };
          const dates = [];
          for (let di = 0; di < 10 && dates.length < 7; di++) {
            const dd = new Date(Date.now() + di * 864e5);
            if (dd.getDay() === 0) continue;
            const lbl = di === 0 ? 'Today' : di === 1 ? 'Tomorrow' : 'D+' + di;
            const fD = dd.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
            const iD = dd.getFullYear() + '-' + String(dd.getMonth() + 1).padStart(2, '0') + '-' + String(dd.getDate()).padStart(2, '0');
            dates.push('<option value="' + iD + '">' + lbl + ' - ' + fD + '</option>');
          }
          html = eval(htmlExpr);
        } catch(e) {
          console.log('Dashboard HTML eval error:', e.message);
        }
      }
    }
    
    if (html) {
      // Add favicon
      html = html.replace('<head>', '<head><link rel="icon" type="image/svg+xml" href="/favicon.svg" />');
      res.set('Content-Type', 'text/html');
      res.send(html);
    } else {
      res.redirect('/dashboard.html');
    }
  } catch(e) {
    console.log('Dashboard live error:', e.message);
    res.redirect('/dashboard.html');
  }
});

// ============================================================
// PROXY: DRO API
// ============================================================
app.all('/api/dro/*', async (req, res) => {
  try {
    if (!tokens.dro) return res.status(401).json({ error: 'DRO token not set. Refresh from DRO tab.' });
    const qs = req.originalUrl.includes('?') ? '?' + req.originalUrl.split('?')[1] : '';
    const url = config.apis.dro + '/' + req.params[0] + qs;
    const opts = { method: req.method, headers: { 'Authorization': 'Bearer ' + tokens.dro, 'Content-Type': 'application/json', 'userid': tokens.userId } };
    if (req.method !== 'GET' && req.body) opts.body = JSON.stringify(req.body);
    const r = await fetch(url, opts);
    const text = await r.text();
    console.log('[DRO]', req.method, req.params[0], 'status:', r.status, 'body:', text.substring(0, 200));
    if (r.status === 401 || r.status === 403) {
      tokens.dro = '';
      return res.status(401).json({ error: 'DRO token expired. Refresh from DRO tab.' });
    }
    try { res.status(r.status).json(JSON.parse(text)); }
    catch(e) { res.status(502).json({ error: 'Invalid response from DRO API', status: r.status, preview: text.substring(0, 200) }); }
  } catch (e) { console.error('[DRO] Proxy error:', e.message); res.status(500).json({ error: e.message }); }
});

// ============================================================
// PROXY: DocGen API
// ============================================================
app.all('/api/docgen/*', async (req, res) => {
  try {
    const qs = req.originalUrl.includes('?') ? '?' + req.originalUrl.split('?').slice(1).join('?') : '';
    const url = config.apis.docgen + '/' + req.params[0] + qs;
    const opts = { method: req.method, headers: { 'authorization': tokens.docgenAuth, 'token': tokens.docgen, 'Content-Type': 'application/json', 'accept': 'application/json' } };
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
// SCAN PROCESSOR
const multer = require('multer');
const scanUpload = multer({ dest: path.join(__dirname, 'scans') });
const scanProcessor = require('./scan-processor');
app.get('/api/scan/status', (req, res) => { res.json({ tracking: scanProcessor.tracking }); });

// Serve scanned PDFs for Puppeteer QR reading
app.get('/scan-file/:name', (req, res) => {
  const filePath = path.join(__dirname, 'scans', req.params.name);
  if (fs.existsSync(filePath)) res.sendFile(filePath);
  else res.status(404).send('Not found');
});
app.post('/api/scan/upload', scanUpload.single('file'), async (req, res) => { try { if (!req.file) return res.json({ ok: false, error: 'No file' }); const filePath = req.file.path; const origName = req.file.originalname || ''; const newPath = path.join(path.dirname(filePath), origName.endsWith('.pdf') ? origName : path.basename(filePath) + '.pdf'); fs.renameSync(filePath, newPath); const r = await scanProcessor.processScan(newPath, tokens, getPdfBrowser, PORT, {}); res.json(r); } catch(e) { res.status(500).json({ ok: false, error: e.message }); } });

app.post('/api/scan/out/:rn', (req, res) => {
  const rn = req.params.rn;
  const entry = scanProcessor.tracking.find(t => t.rn === rn && !t.outDate);
  if (entry) {
    entry.outDate = new Date().toISOString();
    entry.status = 'Picked Up';
    scanProcessor.saveTracking();
    res.json({ ok: true, rn });
  } else {
    res.json({ ok: false, error: 'Not found or already out' });
  }
});

app.post('/api/scan/enrich', async (req, res) => {
  try {
    const fetch = require('node-fetch');
    const h = { 'Authorization': 'Bearer ' + tokens.dro, 'Content-Type': 'application/json', 'userid': tokens.userId };
    let enriched = 0;
    for (const t of scanProcessor.tracking) {
      if (t.acquisitionId && t.make && t.model) continue; // already enriched
      try {
        const advResp = await fetch('https://mytdeliveryopsapi.tesla.com/api/advisor/Dashboard?isSidePanelFullScreen=true', {
          method: 'POST', headers: h,
          body: JSON.stringify({ condition: 'and', rules: [{ condition: 'and', ReferenceNumbers: [t.rn], Countries: [] }], Skip: 0, Take: 1, SortOrder: [], SelectedColumns: [] })
        });
        const adv = await advResp.json();
        const a = adv.Data && adv.Data.Dashboard && adv.Data.Dashboard[0];
        if (a && a.TradeInActionStatus === 'COMPLETE_TRADE_IN' && a.VehicleMapId) {
          const tiResp = await fetch('https://mytdeliveryopsapi.tesla.com/api/widget/GetTradeInWidgetInfo?referenceNumber=' + t.rn + '&vehicleMapId=' + a.VehicleMapId + '&deliveryState=' + encodeURIComponent(a.DeliveryState || ''), { headers: h });
          const tiData = await tiResp.json();
          if (tiData.Data) {
            t.make = tiData.Data.Make || t.make || '';
            t.model = tiData.Data.Model || t.model || '';
            t.plate = tiData.Data.LicensePlate || tiData.Data.Registration?.LicensePlate || t.plate || '';
            if (tiData.Data.VIN && !tiData.Data.VIN.startsWith('XP7') && !tiData.Data.VIN.startsWith('LRW') && !tiData.Data.VIN.startsWith('5YJ')) {
              t.vin = tiData.Data.VIN;
            }
            t.acquisitionId = tiData.Data.AcquisitionId || t.acquisitionId || '';
            enriched++;
          }
        }
      } catch(e) {}
    }
    scanProcessor.saveTracking();
    res.json({ ok: true, enriched });
  } catch(e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/scan/assign', async (req, res) => {
  try {
    const { filename, rn } = req.body;
    if (!filename || !rn) return res.json({ ok: false, error: 'Missing filename or rn' });
    const oldPath = path.join(__dirname, 'scans', filename);
    if (!fs.existsSync(oldPath)) return res.json({ ok: false, error: 'File not found' });
    const newFilename = 'TRADEIN_' + rn + '.pdf';
    const newPath = path.join(__dirname, 'scans', newFilename);
    fs.renameSync(oldPath, newPath);
    console.log('Scan assigned:', filename, '->', newFilename);
    // Process it (with full enrichment)
    try {
      await scanProcessor.processScan(newPath, tokens, getPdfBrowser, PORT, null);
    } catch(e) { console.log('Process error:', e.message); }
    res.json({ ok: true, filename: newFilename });
  } catch(e) { res.json({ ok: false, error: e.message }); }
});

app.post('/api/scan/process', async (req, res) => { try { const files = fs.readdirSync(path.join(__dirname, 'scans')).filter(f => f.endsWith('.pdf')); const results = []; for (const file of files) { const r = await scanProcessor.processScan(path.join(__dirname, 'scans', file), tokens, getPdfBrowser, PORT, {}); results.push({ file, ...r }); } res.json({ processed: results.length, results }); } catch(e) { res.status(500).json({ error: e.message }); } });

// ============================================================
// SCAN TRIGGER — eSCL protocol to HP scanner
// ============================================================
const SCANNER_IP = '10.86.16.32';
const http2 = require('http');

app.post('/api/scan/trigger', async (req, res) => {
  try {
    const source = (req.body && req.body.source) || 'Platen'; // Platen or Feeder
    const scanXml = `<?xml version="1.0" encoding="UTF-8"?>
<scan:ScanSettings xmlns:scan="http://schemas.hp.com/imaging/escl/2011/05/03" xmlns:pwg="http://www.pwg.org/schemas/2010/12/sm">
  <pwg:Version>2.5</pwg:Version>
  <scan:Intent>Document</scan:Intent>
  <pwg:ScanRegions><pwg:ScanRegion>
    <pwg:ContentRegionUnits>escl:ThreeHundredthsOfInches</pwg:ContentRegionUnits>
    <pwg:Height>3507</pwg:Height><pwg:Width>2481</pwg:Width>
    <pwg:XOffset>0</pwg:XOffset><pwg:YOffset>0</pwg:YOffset>
  </pwg:ScanRegion></pwg:ScanRegions>
  <pwg:InputSource>${source}</pwg:InputSource>
  <scan:DocumentFormatExt>application/pdf</scan:DocumentFormatExt>
  <scan:XResolution>300</scan:XResolution>
  <scan:YResolution>300</scan:YResolution>
  <scan:ColorMode>Grayscale8</scan:ColorMode>
  <scan:Duplex>false</scan:Duplex>
</scan:ScanSettings>`;

    // Step 1: Create scan job
    const jobRes = await new Promise((resolve, reject) => {
      const postReq = http2.request({
        hostname: SCANNER_IP, port: 80, path: '/eSCL/ScanJobs',
        method: 'POST', headers: { 'Content-Type': 'text/xml', 'Content-Length': Buffer.byteLength(scanXml) }
      }, (resp) => {
        let body = '';
        resp.on('data', c => body += c);
        resp.on('end', () => resolve({ status: resp.statusCode, location: resp.headers.location, body }));
      });
      postReq.on('error', reject);
      postReq.setTimeout(15000, () => { postReq.destroy(); reject(new Error('Scanner timeout')); });
      postReq.write(scanXml);
      postReq.end();
    });

    if (jobRes.status !== 201) {
      return res.json({ ok: false, error: 'Scanner returned ' + jobRes.status });
    }

    const jobUrl = jobRes.location;
    console.log('Scan job created:', jobUrl);
    res.json({ ok: true, status: 'scanning', jobUrl });

  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

app.get('/api/scan/download/:jobId', async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const docUrl = `http://${SCANNER_IP}/eSCL/ScanJobs/${jobId}/NextDocument`;

    const pdfRes = await new Promise((resolve, reject) => {
      http2.get(docUrl, (resp) => {
        if (resp.statusCode !== 200) {
          let body = '';
          resp.on('data', c => body += c);
          resp.on('end', () => resolve({ status: resp.statusCode, body }));
          return;
        }
        const chunks = [];
        resp.on('data', c => chunks.push(c));
        resp.on('end', () => resolve({ status: 200, data: Buffer.concat(chunks) }));
      }).on('error', reject);
    });

    if (pdfRes.status !== 200) {
      return res.json({ ok: false, error: 'Not ready: ' + pdfRes.status });
    }

    // Save to scans folder
    const rn = req.query.rn || '';
    const filename = rn ? 'TRADEIN_' + rn + '.pdf' : 'SCAN_' + Date.now() + '.pdf';
    const filePath = path.join(__dirname, 'scans', filename);
    fs.writeFileSync(filePath, pdfRes.data);
    console.log('Scan saved:', filename, pdfRes.data.length, 'bytes');

    // Auto-process: try QR code extraction to find RN
    let processResult = { ok: false };
    try {
      // Build VIN->RN map from recent tracking + any cached data
      const vinToRN = {};
      scanProcessor.tracking.forEach(t => { if (t.vin) vinToRN[t.vin] = t.rn; });
      processResult = await scanProcessor.processScan(filePath, tokens, getPdfBrowser, PORT, vinToRN);
      console.log('Scan auto-processed:', processResult);
    } catch(e) {
      console.log('Scan auto-process error:', e.message);
    }

    res.json({ ok: true, filename, size: pdfRes.data.length, processed: processResult.ok, rn: processResult.rn || '' });
  } catch (e) {
    res.json({ ok: false, error: e.message });
  }
});

// ============================================================
// FTP SERVER — Scanner drops PDFs here
// ============================================================
const FtpSrv = require('ftp-srv');
const FTP_PORT = 2121;

function startFtp() {
  const scanDir = path.join(__dirname, 'scans');
  const ips = Object.values(os.networkInterfaces()).flat().filter(n => n.family === 'IPv4' && !n.internal).map(n => n.address);
  const lanIp = ips.find(ip => ip.startsWith('10.86.17')) || ips[0] || '0.0.0.0';

  const ftpServer = new FtpSrv({
    url: `ftp://0.0.0.0:${FTP_PORT}`,
    pasv_url: lanIp,
    pasv_min: 2122,
    pasv_max: 2130,
    anonymous: true
  });

  ftpServer.on('login', ({ connection, username }, resolve) => {
    console.log(`FTP login: ${username}`);
    resolve({ root: scanDir });
  });

  ftpServer.on('client-error', ({ connection, context, error }) => {
    console.log('FTP client error:', error.message);
  });

  ftpServer.listen().then(() => {
    console.log(`  FTP:        ftp://${lanIp}:${FTP_PORT} (anonymous)`);
    console.log(`              Scans folder: ${scanDir}`);
  }).catch(err => {
    console.log('FTP server error:', err.message);
  });
}

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
  startFtp();
});
