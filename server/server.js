const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
const config = require('./config.json');
const { execFile } = require('child_process');

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ============================================================
// Token storage (in-memory, per session)
// ============================================================
let tokens = { dro: null, docgen: null, userId: null };

// ============================================================
// AUTH: Store tokens from SSO login
// ============================================================
app.post('/api/auth/tokens', (req, res) => {
  tokens.dro = req.body.droToken;
  tokens.docgen = req.body.docgenToken;
  tokens.userId = req.body.userId;
  res.json({ ok: true, message: 'Tokens stored' });
});

app.get('/api/auth/status', (req, res) => {
  res.json({ 
    hasDro: !!tokens.dro, 
    hasDocgen: !!tokens.docgen,
    userId: tokens.userId 
  });
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
    const url = `${config.apis.dro}/${droPath}`;
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
    const url = `${config.apis.docgen}/${docPath}`;
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
    const url = `${config.apis.intrepid}/${intPath}`;
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
