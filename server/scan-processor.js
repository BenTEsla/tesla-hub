// scan-processor.js - Watches scans/ folder, reads QR/text, uploads to DocGen
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const jsQR = require('jsqr');

const SCAN_DIR = path.join(__dirname, 'scans');
const PROCESSED_DIR = path.join(SCAN_DIR, 'processed');
const TRACKING_FILE = path.join(__dirname, 'data', 'tradein-tracking.json');

// Load tracking data
let tracking = [];
try { tracking = JSON.parse(fs.readFileSync(TRACKING_FILE, 'utf8')); } catch(e) {}
function saveTracking() { fs.writeFileSync(TRACKING_FILE, JSON.stringify(tracking, null, 2)); }

// Extract RN from PDF text content using pdf-parse
async function extractRNFromPDFText(pdfPath) {
  try {
    const { PDFParse } = require('pdf-parse');
    const dataBuffer = new Uint8Array(fs.readFileSync(pdfPath));
    const parser = new PDFParse(dataBuffer);
    const result = await parser.getText();
    const text = result.text || '';
    await parser.destroy();
    console.log('  PDF text extracted:', text.length, 'chars');

    // Look for RN pattern (RN followed by 9+ digits)
    const rnMatch = text.match(/RN\d{9,}/i);
    if (rnMatch) {
      console.log('  RN found in PDF text:', rnMatch[0].toUpperCase());
      return { rn: rnMatch[0].toUpperCase() };
    }

    // Look for VIN pattern (17 alphanumeric, common vehicle VIN)
    const vinMatch = text.match(/[A-HJ-NPR-Z0-9]{17}/);
    if (vinMatch) {
      console.log('  VIN found in PDF text:', vinMatch[0]);
      return { vin: vinMatch[0] };
    }

    console.log('  No RN or VIN found in PDF text');
  } catch(e) {
    console.log('  PDF text extraction error:', e.message);
  }
  return null;
}

// Extract QR code from first page of PDF using Puppeteer screenshot
async function extractQRFromPDF(pdfPath, getPdfBrowser, PORT) {
  if (!getPdfBrowser || typeof getPdfBrowser !== 'function') {
    console.log('  No browser available for QR extraction');
    return null;
  }
  
  try {
    const browser = await getPdfBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600 });
    
    // Serve the PDF via HTTP (file:// doesn't render PDFs in headless Chrome)
    const fileName = path.basename(pdfPath);
    const url = 'http://localhost:' + PORT + '/scan-file/' + encodeURIComponent(fileName);
    
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000)); // Wait for PDF to render
    
    const screenshot = await page.screenshot({ type: 'png', fullPage: false });
    await page.close();
    
    // Read QR from screenshot
    const { data, info } = await sharp(screenshot).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    const code = jsQR(new Uint8ClampedArray(data), info.width, info.height);
    if (code) {
      console.log('  QR code found:', code.data);
      return code.data;
    }
    console.log('  No QR code detected in screenshot');
  } catch(e) {
    console.log('  QR extraction failed:', e.message);
  }
  
  return null;
}

// Upload scanned document to DocGen
async function uploadToDocGen(filePath, rn, tokens) {
  const fetch = require('node-fetch');
  const FormData = require('form-data');
  
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath), { filename: 'TRADEIN ' + rn + '.pdf', contentType: 'application/pdf' });
  form.append('referenceNumber', rn);
  form.append('documentCode', 'EXECUTED_TRADEIN_ANNEX');
  form.append('documentType', 'ExecutedTradeinAnnex');
  form.append('countryCode', 'FR');
  form.append('metadata', JSON.stringify({ ReferenceNumber: rn, Status: 'Executed' }));
  form.append('customerVisiblitySync', 'false');
  
  const resp = await fetch('https://documentautomation-processapi.tesla.com/DocumentAutomation/UploadDocument', {
    method: 'POST',
    headers: {
      'authorization': tokens.docgenAuth,
      'token': tokens.docgen
    },
    body: form
  });
  
  return { ok: resp.ok, status: resp.status };
}

// Process a single scan file
async function processScan(filePath, tokens, getPdfBrowser, PORT, vinToRN) {
  const fileName = path.basename(filePath);
  console.log('Processing scan:', fileName);
  
  let vin = null;
  let rn = null;

  // Method 1: Extract RN/VIN from PDF text (fastest, most reliable)
  const textResult = await extractRNFromPDFText(filePath);
  if (textResult) {
    if (textResult.rn) rn = textResult.rn;
    if (textResult.vin) vin = textResult.vin;
  }

  // Method 2: Try QR code extraction (fallback)
  if (!rn && !vin) {
    vin = await extractQRFromPDF(filePath, getPdfBrowser, PORT);
  }

  // Method 3: Check filename for RN pattern
  if (!rn) {
    const match = fileName.match(/RN\d{9}/i);
    if (match) { rn = match[0].toUpperCase(); console.log('  RN from filename:', rn); }
  }
  
  // If we have VIN but no RN, look up RN from VIN
  if (vin && !rn) {
    console.log('  Looking up RN for VIN:', vin);
    rn = (vinToRN && vinToRN[vin]) || null;
    
    if (!rn && tokens && tokens.dro) {
      try {
        const fetch = require('node-fetch');
        const advResp = await fetch('https://mytdeliveryopsapi.tesla.com/api/advisor/Dashboard?isSidePanelFullScreen=true', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + tokens.dro, 'Content-Type': 'application/json', 'userid': tokens.userId },
          body: JSON.stringify({ condition: 'and', rules: [{ condition: 'and', Vins: [vin], Countries: [] }], Skip: 0, Take: 1, SortOrder: [], SelectedColumns: [] })
        });
        const adv = await advResp.json();
        const a = adv.Data && adv.Data.Dashboard && adv.Data.Dashboard[0];
        if (a) { rn = a.ReferenceNumber; console.log('  RN found via DRO VIN search:', rn); }
      } catch(e) { console.log('  DRO VIN lookup failed:', e.message); }
    }
  }
  
  if (!rn) {
    console.log('  ERROR: Could not identify RN for', fileName);
    return { ok: false, error: 'RN not found' };
  }
  
  console.log('  RN:', rn);
  
  // Fetch trade-in details from DRO
  let plate = '', make = '', model = '', tiVin = vin || '', acquisitionId = '';
  try {
    const fetch = require('node-fetch');
    const advResp = await fetch('https://mytdeliveryopsapi.tesla.com/api/advisor/Dashboard?isSidePanelFullScreen=true', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + tokens.dro, 'Content-Type': 'application/json', 'userid': tokens.userId },
      body: JSON.stringify({ condition: 'and', rules: [{ condition: 'and', ReferenceNumbers: [rn], Countries: [] }], Skip: 0, Take: 1, SortOrder: [], SelectedColumns: [] })
    });
    const adv = await advResp.json();
    const a = adv.Data && adv.Data.Dashboard && adv.Data.Dashboard[0];
    if (a) {
      tiVin = tiVin || a.Vin || '';
      // Get trade-in info
      if (a.TradeInActionStatus === 'COMPLETE_TRADE_IN' && a.VehicleMapId) {
        const tiResp = await fetch('https://mytdeliveryopsapi.tesla.com/api/widget/GetTradeInWidgetInfo?referenceNumber=' + rn + '&vehicleMapId=' + a.VehicleMapId + '&deliveryState=' + encodeURIComponent(a.DeliveryState || ''), {
          headers: { 'Authorization': 'Bearer ' + tokens.dro, 'Content-Type': 'application/json', 'userid': tokens.userId }
        });
        const tiData = await tiResp.json();
        if (tiData.Data) {
          make = tiData.Data.Make || '';
          model = tiData.Data.Model || '';
          plate = tiData.Data.LicensePlate || tiData.Data.Registration?.LicensePlate || '';
          tiVin = tiData.Data.VIN || tiVin;
          acquisitionId = tiData.Data.AcquisitionId || '';
          
          // Scrape plate from AMP if not found
          if (!plate && tiData.Data.AcquisitionId) {
            try {
              const ampBrowser = await getPdfBrowser();
              const ampPage = await ampBrowser.newPage();
              await ampPage.goto('https://amp.tesla.com/acquisition/' + tiData.Data.AcquisitionId, { waitUntil: 'networkidle2', timeout: 15000 });
              await new Promise(r => setTimeout(r, 3000));
              plate = await ampPage.evaluate(() => {
                const inputs = document.querySelectorAll('input');
                for (const input of inputs) {
                  if ((input.value || '').match(/^[A-Z]{2}[-]?[0-9]{3}[-]?[A-Z]{2,3}$/)) return input.value;
                }
                return '';
              });
              await ampPage.close();
              if (plate) console.log('  Plate from AMP:', plate);
            } catch(e) { console.log('  AMP scrape error:', e.message); }
          }
          
          console.log('  Trade-In:', make, model, tiVin, plate);
        }
      }
    }
  } catch(e) { console.log('  DRO fetch error:', e.message); }
  
  // Upload to DocGen
  try {
    const result = await uploadToDocGen(filePath, rn, tokens);
    console.log('  Upload:', result.ok ? 'OK' : 'FAIL (' + result.status + ')');
    
    // Track
    tracking.push({
      rn,
      vin: tiVin || '',
      teslaVin: vin || '',
      plate: plate || '',
      make: make || '',
      model: model || '',
      acquisitionId: acquisitionId || '',
      fileName,
      uploadDate: new Date().toISOString(),
      uploadOk: result.ok,
      status: 'On Site'
    });
    saveTracking();
    
    // Move to processed
    const destPath = path.join(PROCESSED_DIR, fileName);
    fs.renameSync(filePath, destPath);
    console.log('  Moved to processed/');
    
    return { ok: result.ok, rn, vin };
  } catch(e) {
    console.log('  Upload error:', e.message);
    return { ok: false, error: e.message };
  }
}

// Watch the scans folder
function startWatching(tokens, getPdfBrowser, PORT, vinToRN) {
  console.log('Watching scans/ folder for new PDFs...');
  
  fs.watch(SCAN_DIR, (eventType, filename) => {
    if (!filename || !filename.endsWith('.pdf')) return;
    const filePath = path.join(SCAN_DIR, filename);
    
    // Wait a bit for the file to be fully written
    setTimeout(async () => {
      if (!fs.existsSync(filePath)) return;
      try {
        await processScan(filePath, tokens, getPdfBrowser, PORT, vinToRN);
      } catch(e) {
        console.log('Scan processing error:', e.message);
      }
    }, 3000);
  });
}

module.exports = { startWatching, processScan, tracking, saveTracking };
