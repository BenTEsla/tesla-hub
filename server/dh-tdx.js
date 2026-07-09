var fetch = require('node-fetch');
var https = require('https');
var tokens = JSON.parse(require('fs').readFileSync('tokens.json','utf8'));
var q = '{ searchAcrossEntities(input: { types: [DATASET], query: "tesladex", count: 10 }) { total searchResults { entity { urn ... on Dataset { name platform { name } properties { description } } } } } }';
fetch('https://datahub.fa.tesla.services/api/graphql', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + tokens.datahubToken, 'Content-Type': 'application/json' },
  agent: new https.Agent({ rejectUnauthorized: false }),
  body: JSON.stringify({ query: q })
}).then(function(r) { return r.json(); }).then(function(j) {
  var results = j.data && j.data.searchAcrossEntities;
  console.log('Tesladex datasets:', results ? results.total : 0);
  if (results && results.searchResults) results.searchResults.forEach(function(s) {
    console.log('  ' + s.entity.name + ' [' + (s.entity.platform ? s.entity.platform.name : '?') + ']');
  });
}).catch(function(e) { console.error(e.message); });
