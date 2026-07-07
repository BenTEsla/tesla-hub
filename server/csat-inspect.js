const fetch = require('node-fetch');
const fs = require('fs');
const tokens = JSON.parse(fs.readFileSync('C:/Users/bdaubin/AppData/Local/Temp/opencode/tesla-delivery-hub/server/tokens.json', 'utf8'));

async function getTableauToken() {
  const r = await fetch('https://bi.teslamotors.com/api/3.25/auth/signin', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ credentials: { personalAccessTokenName: tokens.tableauPatName, personalAccessTokenSecret: tokens.tableauPatSecret, site: { contentUrl: '' } } }) });
  const j = await r.json();
  return { token: j.credentials.token, siteId: j.credentials.site.id };
}

async function main() {
  const { token, siteId } = await getTableauToken();
  const viewId = '9737677d-fe72-4ce0-b941-c7f92d705b1d';
  const filter = 'vf_Delivery+Location=EU-FR-Saint-Jacques+de+la+Lande-Rue+de+la+Pitardi%C3%A8re';
  const r = await fetch('https://bi.teslamotors.com/api/3.25/sites/' + siteId + '/views/' + viewId + '/crosstab/excel?' + filter, { headers: { 'X-Tableau-Auth': token } });
  const buffer = await r.buffer();
  fs.writeFileSync('C:/Users/bdaubin/AppData/Local/Temp/opencode/csat-raw.xlsx', buffer);
  console.log('Saved', buffer.length, 'bytes');
  
  const XLSX = require('xlsx');
  const wb = XLSX.read(buffer);
  console.log('Sheets:', wb.SheetNames);
  wb.SheetNames.forEach(function(name, i) {
    const data = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1 });
    console.log('\\n=== Sheet ' + i + ': ' + name + ' (' + data.length + ' rows) ===');
    data.forEach(function(row, ri) {
      console.log('Row ' + ri + ':', JSON.stringify(row));
    });
  });
}
main().catch(console.error);
