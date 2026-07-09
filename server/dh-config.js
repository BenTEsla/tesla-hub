var fetch = require('node-fetch');
var https = require('https');
var tokens = JSON.parse(require('fs').readFileSync('tokens.json','utf8'));
var q = '{ dataset(urn: "urn:li:dataset:(urn:li:dataPlatform:caspian,EU.population.config_union,PROD)") { name properties { description } schemaMetadata { fields { fieldPath nativeDataType } } } }';
fetch('https://datahub.fa.tesla.services/api/graphql', {
  method: 'POST',
  headers: { 'Authorization': 'Bearer ' + tokens.datahubToken, 'Content-Type': 'application/json' },
  agent: new https.Agent({ rejectUnauthorized: false }),
  body: JSON.stringify({ query: q })
}).then(function(r) { return r.json(); }).then(function(j) {
  if (j.data && j.data.dataset) {
    var ds = j.data.dataset;
    console.log('Dataset:', ds.name);
    if (ds.properties) console.log('Desc:', (ds.properties.description || '').substring(0, 300));
    if (ds.schemaMetadata && ds.schemaMetadata.fields) {
      console.log('\nFields (' + ds.schemaMetadata.fields.length + '):');
      ds.schemaMetadata.fields.slice(0, 50).forEach(function(f) {
        console.log('  ' + f.fieldPath + ' (' + (f.nativeDataType || '') + ')');
      });
      if (ds.schemaMetadata.fields.length > 50) console.log('  ... and ' + (ds.schemaMetadata.fields.length - 50) + ' more');
    }
  } else {
    console.log(JSON.stringify(j, null, 2).substring(0, 1000));
  }
}).catch(function(e) { console.error(e.message); });
