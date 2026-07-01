const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

(async () => {
  const outDir = path.join(process.env.USERPROFILE, 'Desktop', 'Print_Jun24', 'grouped');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, {recursive:true});
  
  // Get data from server
  const dash = await (await fetch('http://localhost:3000/api/dro/deliveryops/Customers/Dashboard', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({fromDeliveryDate:'2026-06-24',trtId:28498,customerHasNoHost:false,skip:0,take:200,fromTime:"00:00",toTime:"23:59",countryCode:"FR",onlyMyLocation:true,sort:{},stage:[],status:[],deliveryType:[],paperwork:[],customerDeliveryStatus:[],inboundStatus:[],VehicleTypes:[],pdcFilter:[],dmvDocumentStages:[]})
  })).json();
  
  const rns = dash.Data.map(d=>d.ReferenceNumber);
  const cm = {}; dash.Data.forEach(d=>{cm[d.ReferenceNumber]=d});
  
  const adv = await (await fetch('http://localhost:3000/api/dro/advisor/Dashboard?isSidePanelFullScreen=true', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({condition:"and",rules:[{condition:"and",ReferenceNumbers:rns,Countries:[]}],Skip:0,Take:200,SortOrder:[],SelectedColumns:[]})
  })).json();
  
  const am = {}; adv.Data.Dashboard.forEach(a=>{am[a.ReferenceNumber]=a});
  
  // Sort by time
  const sorted = rns.map(rn => {
    const c=cm[rn]||{};const dt=c.ScheduledDeliveryStartDateString||'';let t='?';
    const m=dt.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if(m){let hr=parseInt(m[1]);if(m[3].toUpperCase()==='PM'&&hr<12)hr+=12;if(m[3].toUpperCase()==='AM'&&hr===12)hr=0;t=String(hr).padStart(2,'0')+':'+m[2]}
    return {rn,t};
  }).sort((a,b)=>a.t.localeCompare(b.t));
  
  // Generate page de garde PDFs using headless Chrome
  const browser = await puppeteer.launch({executablePath:'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless:true});
  let count = 0;
  
  for (const {rn} of sorted) {
    const a=am[rn]||{}, c=cm[rn]||{};
    const dt=c.ScheduledDeliveryStartDateString||'';let time='?';
    const m=dt.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if(m){let hr=parseInt(m[1]);if(m[3].toUpperCase()==='PM'&&hr<12)hr+=12;if(m[3].toUpperCase()==='AM'&&hr===12)hr=0;time=String(hr).padStart(2,'0')+':'+m[2]}
    const pay={CASH:'CASH',TESLA_LEASING:'LEASING',TESLA_LENDING:'CREDIT',THIRD_PARTY_LEASING:'LLD TIERS'}[a.OrderType]||a.OrderType||'';
    
    count++;
    const seq = String(count).padStart(3,'0');
    
    const pg = await browser.newPage();
    await pg.setContent(`<html><head><style>@page{size:A4;margin:12mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif;color:#171a20;font-size:13px}.bx{border:1px solid #e0e0e0;border-radius:6px;padding:12px 14px;flex:1}.bt{font-size:10px;letter-spacing:2px;color:#888;margin-bottom:8px}.lb{font-size:9px;letter-spacing:2px;color:#aaa;margin-top:8px;margin-bottom:2px}.rw{display:flex;gap:10px;margin-bottom:10px}</style></head><body><div style="display:flex;justify-content:space-between"><div><div style="font-size:28px;font-weight:700">${a.CustomerName||''}</div><div style="font-size:13px;color:#888">${rn}</div></div><div style="text-align:right"><div style="font-size:42px;font-weight:700;line-height:1">${time}</div><div style="font-size:13px;color:#888">24 juin 2026</div></div></div><div class="rw" style="margin-top:16px"><div class="bx"><div class="bt">VEHICULE</div><div style="font-size:16px;font-weight:700">${a.VehicleModel||''}</div><div>${a.VehicleColor||''}</div></div><div class="bx"><div class="bt">IDENTIFICATION</div><div class="lb">IMMATRICULATION</div><div style="font-size:26px;font-weight:700;font-family:monospace">${(a.LicensePlate||'').trim()||'Pending'}</div><div class="lb">VIN</div><div style="font-size:14px;font-weight:600;font-family:monospace">${a.Vin||''}</div></div></div><div class="rw"><div class="bx"><div class="bt">PAIEMENT</div><div style="font-size:24px;font-weight:700">${pay}</div></div><div class="bx" style="border-style:dashed"><div class="bt">NOTES</div><div style="height:80px"></div></div></div><div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid #e0e0e0;margin-top:200px"><span style="font-size:11px;color:#888">${c.HostName||''}</span><span style="font-size:11px;letter-spacing:6px;color:#ccc">T E S L A</span></div></body></html>`);
    await pg.pdf({path:path.join(outDir, `${seq}_${rn}_00_PAGE_DE_GARDE.pdf`), format:'A4', printBackground:true});
    await pg.close();
    
    // Copy DocGen docs
    const docDir = path.join(process.env.USERPROFILE, 'Desktop', 'Print_Jun24');
    const docs = fs.readdirSync(docDir).filter(f=>f.startsWith(rn)&&f.endsWith('.pdf'));
    let di=1;
    for(const doc of docs){
      fs.copyFileSync(path.join(docDir,doc), path.join(outDir, `${seq}_${rn}_${String(di).padStart(2,'0')}_${doc.replace(rn+'_','')}`));
      di++;
    }
    console.log(`[${seq}] ${rn} - ${a.CustomerName} - ${time} - ${docs.length} docs`);
  }
  
  await browser.close();
  const total = fs.readdirSync(outDir).filter(f=>f.endsWith('.pdf')).length;
  console.log(`\nDONE! ${count} deliveries, ${total} PDFs in grouped/`);
})();
