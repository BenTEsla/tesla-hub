var fetch = require('node-fetch');
var https = require('https');
var tokens = JSON.parse(require('fs').readFileSync('tokens.json','utf8'));

// Search for Caspian connection in DNA
var queries = [
  "tesladex", "population", "vehicle inventory", "caspian EU"
];

async function searchTools() {
  try {
    var credsPath = require('path').join(require('os').homedir(), '.claude', 'tesla-sso-credentials.json');
    if (!require('fs').existsSync(credsPath)) { console.log('No SSO creds'); return; }
    var creds = JSON.parse(require('fs').readFileSync(credsPath, 'utf8'));
    
    var r = await fetch('https://workbook-api.tesla.com/api/agentic/tools/search', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + creds.access_token, 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'tesladex vehicle inventory' })
    });
    var j = await r.json();
    console.log('DNA tools search:', JSON.stringify(j).substring(0, 1000));
  } catch(e) { console.error('DNA error:', e.message); }
}

searchTools();
