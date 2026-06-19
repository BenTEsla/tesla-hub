// Tesla Delivery Hub v6 - Full rewrite with iframe CSS isolation
// Helper for AMP calls (unused for now but kept for future)
function fetch_amp(opts) {
  fetch(opts.url, { method:opts.method||'POST', headers:opts.headers||{}, body:opts.data||null, credentials:'include' })
    .then(function(r){return r.text()}).then(function(t){if(opts.onload)opts.onload({responseText:t})})
    .catch(function(){if(opts.onerror)opts.onerror()});
}

// Floating launch button
(function(){
  if(document.getElementById('tdh-launch'))return;
  var b=document.createElement('div');b.id='tdh-launch';b.textContent='DELIVERY HUB';
  b.style.cssText='position:fixed;bottom:20px;right:20px;z-index:99998;background:#171a20;color:#fff;padding:12px 24px;border-radius:30px;cursor:pointer;font-family:sans-serif;font-size:13px;font-weight:600;letter-spacing:2px;box-shadow:0 4px 12px rgba(0,0,0,.3)';
  b.onclick=function(){startDashboard()};
  document.body.appendChild(b);
})();

function startDashboard(){
  // Auth
  var token=(localStorage.getItem('delops_id_token')||'').replace(/^"|"$/g,'');
  var token2=(localStorage.getItem('delops_id_token_data')||'').replace(/^"|"$/g,'');
  var userId=(localStorage.getItem('UserId')||'').replace(/^"|"$/g,'');
  var authToken=token&&token.length>100?token:token2&&token2.length>100?token2:null;
  var AUTH=authToken&&userId?{token:'Bearer '+authToken,userId:userId}:null;

  // Monkey-patch fallback
  if(!AUTH){
    var _f=window.fetch;
    window.fetch=function(){
      var u=typeof arguments[0]==='string'?arguments[0]:'';
      var o=arguments[1]||{};var h=o.headers||{};
      if(u.indexOf('mytdeliveryopsapi')>=0&&(h.Authorization||h.authorization)){
        AUTH={token:h.Authorization||h.authorization,userId:h.userid||h.UserId||userId||''};
      }
      return _f.apply(this,arguments);
    };
  }

  // Config
  var HUB={trtId:28498,cc:'FR'};
  var CES=['Ben Daubin','Sacha Villa','Sophie MACE'];
  var BASE='https://mytdeliveryopsapi.tesla.com/api';
  var FR={'Pearl White':'Blanc perle','Diamond Black':'Noir Diamant','Stealth Grey':'Gris Stealth','Midnight Silver Metallic':'Gris Nuit','Red Multi-Coat':'Rouge','Ultra Red':'Rouge Ultra','Quicksilver':'Quicksilver','Glacier Blue':'Bleu Glacier','Frost Blue':'Bleu Givre','Midnight Cherry Red':'Rouge Cerise','Marine Blue':'Bleu Marine'};
  var tr=function(s){return FR[s]||s};
  var payT=function(t){return{CASH:'CASH',TESLA_LEASING:'LEASING',TESLA_LENDING:'CREDIT',THIRD_PARTY_LEASING:'LLD TIERS'}[t]||t};
  var payC=function(t){return{CASH:'cash',TESLA_LEASING:'leasing',TESLA_LENDING:'credit',THIRD_PARTY_LEASING:'lld'}[t]||'enterprise'};
  var today=new Date(),tmrw=new Date(Date.now()+864e5);
  var fmtD=function(d){return d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})};
  var isoD=function(d){return d.toISOString().split('T')[0]};

  // Remove old
  var old=document.getElementById('tdh-overlay');if(old)old.remove();

  // Create iframe
  var ifr=document.createElement('iframe');
  ifr.id='tdh-overlay';
  ifr.style.cssText='position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;border:none';
  document.body.appendChild(ifr);

  var D=ifr.contentDocument;
  D.open();
  D.write([
    '<!DOCTYPE html><html><head><meta charset="utf-8"><style>',
    '*{box-sizing:border-box;margin:0;padding:0}',
    'body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#393c41;background:#fff;font-size:14px}',
    '.hdr{height:48px;background:#fff;border-bottom:1px solid #e5e5e5;display:flex;align-items:center;padding:0 24px}',
    '.hdr .logo{font-size:16px;font-weight:600;letter-spacing:3px;color:#171a20}',
    '.hdr .sep{margin:0 12px;color:#ccc} .hdr .app{font-size:14px;color:#5c5e62}',
    '.hdr .right{margin-left:auto;font-size:14px;color:#5c5e62}',
    '.ttl{padding:24px 24px 8px;font-size:26px;font-weight:600;color:#171a20}',
    '.bar{padding:16px 24px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}',
    '.pill{padding:7px 18px;border-radius:20px;border:1px solid #d0d0d0;background:#fff;cursor:pointer;font-size:14px;color:#5c5e62;font-family:inherit}',
    '.pill:hover{background:#f5f5f5} .pill.on{background:#171a20;color:#fff;border-color:#171a20}',
    '.sp2{width:1px;height:24px;background:#e0e0e0;margin:0 8px}',
    'select{padding:7px 14px;border:1px solid #d0d0d0;border-radius:8px;font-size:14px;font-family:inherit}',
    '.btn{padding:7px 18px;border-radius:20px;border:none;font-size:14px;font-family:inherit;font-weight:500;cursor:pointer}',
    '.bp{background:#3e6ae1;color:#fff} .bg{background:#28a745;color:#fff} .bl{background:#f0f0f0;color:#5c5e62}',
    '.sts{margin-left:auto;display:flex;gap:32px}',
    '.sn{font-size:26px;font-weight:300;text-align:center} .sl{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#999;text-align:center}',
    '.wrp{padding:8px 24px 24px}',
    'table{width:100%;border-collapse:collapse}',
    'th{padding:12px 14px;text-align:left;font-size:12px;color:#888;font-weight:500;border-bottom:1px solid #e5e5e5}',
    'td{padding:14px 14px;font-size:14px;border-bottom:1px solid #f0f0f0;vertical-align:middle}',
    'tr:hover td{background:#fafbff} tr.w td{background:#fffdf5} tr.b td{background:#fef8f8}',
    '.ck{width:17px;height:17px;accent-color:#3e6ae1;cursor:pointer}',
    '.badge{display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:600}',
    '.badge.cash{background:#e6f4ea;color:#1e7e34} .badge.leasing{background:#e3f2fd;color:#1565c0}',
    '.badge.credit{background:#ede7f6;color:#6a1b9a} .badge.lld{background:#fff8e1;color:#f57f17}',
    '.badge.enterprise{background:#eceff1;color:#37474f}',
    '.dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}',
    '.dg{background:#28a745} .dr{background:#dc3545} .do{background:#f0ad4e}',
    '.nm{font-weight:600;cursor:pointer;color:#171a20} .nm:hover{color:#3e6ae1}',
    '.tm{font-size:15px;font-weight:500;color:#171a20}',
    '.pl{font-family:SFMono-Regular,Consolas,monospace;font-weight:600;font-size:13px}',
    '.ld{text-align:center;padding:80px;font-size:15px;color:#999}',
    '.spin{display:inline-block;width:22px;height:22px;border:2.5px solid #eee;border-top-color:#3e6ae1;border-radius:50%;animation:s .7s linear infinite;margin-right:10px;vertical-align:middle}',
    '@keyframes s{to{transform:rotate(360deg)}}',
    '</style></head><body>',
    '<div class="hdr"><span class="logo">TESLA</span><span class="sep">|</span><span class="app">Delivery Hub</span><span class="right">Ben Daubin</span></div>',
    '<div class="ttl">Delivery Dashboard</div>',
    '<div class="bar">',
    '<button class="pill on" id="f-all">Tous</button>',
    CES.map(function(c,i){return'<button class="pill" id="f-'+i+'">'+c.split(' ')[0]+'</button>'}).join(''),
    '<div class="sp2"></div>',
    '<select id="dt"><option value="'+isoD(today)+'">Aujourd\'hui - '+fmtD(today)+'</option><option value="'+isoD(tmrw)+'">Demain - '+fmtD(tmrw)+'</option></select>',
    '<button class="btn bp" id="loadBtn">Charger</button>',
    '<button class="btn bg" id="genBtn" style="display:none">Generer PDFs</button>',
    '<button class="btn bl" id="closeBtn">Fermer</button>',
    '<div class="sts"><div><div class="sn" id="sT">-</div><div class="sl">Livraisons</div></div>',
    '<div><div class="sn" id="sO">-</div><div class="sl">Pretes</div></div>',
    '<div><div class="sn" id="sA">-</div><div class="sl">Alertes</div></div></div>',
    '</div>',
    '<div class="wrp"><div class="ld" id="ldg" style="display:none"><span class="spin"></span> Chargement...</div>',
    '<table id="tbl" style="display:none"><thead><tr><th style="width:40px"><input type="checkbox" class="ck" id="sa" checked/></th>',
    '<th>Heure</th><th>Client</th><th>Vehicule</th><th>Plaque</th><th>Paiement</th><th>Trade-In</th><th>OTG</th><th>Assurance</th>',
    '</tr></thead><tbody id="tb"></tbody></table></div>',
    '</body></html>'
  ].join(''));
  D.close();

  // Shortcuts
  var $=function(id){return D.getElementById(id)};

  // Close
  $('closeBtn').onclick=function(){document.getElementById('tdh-overlay').remove()};

  // Filters
  var filters=['all'].concat(CES);
  filters.forEach(function(f,i){
    var btn=$(i===0?'f-all':'f-'+(i-1));
    if(!btn)return;
    btn.onclick=function(){
      D.querySelectorAll('.pill').forEach(function(p){p.classList.remove('on')});
      btn.classList.add('on');
      D.querySelectorAll('#tb tr').forEach(function(r){
        if(f==='all'){r.style.display='';return}
        var h=(r.dataset.host||'').toLowerCase();
        r.style.display=h.indexOf(f.split(' ')[0].toLowerCase())>=0?'':'none';
      });
    };
  });

  // Load
  $('loadBtn').onclick=async function(){
    var ld=$('ldg'),tbl=$('tbl'),tb=$('tb');
    ld.style.display='';tbl.style.display='none';
    ld.innerHTML='<span class="spin"></span> Chargement...';

    if(!AUTH){ld.innerHTML='Token non trouve. <button onclick="parent.location.reload()" style="padding:8px 16px;background:#3e6ae1;color:#fff;border:none;border-radius:16px;cursor:pointer;margin-top:8px">Rafraichir</button>';return}

    var h={'Authorization':AUTH.token,'Content-Type':'application/json','userid':AUTH.userId};
    var dateStr=$('dt').value;

    try{
      var dash=await fetch(BASE+'/deliveryops/Customers/Dashboard',{method:'POST',headers:h,body:JSON.stringify({fromDeliveryDate:dateStr,trtId:HUB.trtId,customerHasNoHost:false,skip:0,take:200,fromTime:'00:00',toTime:'23:59',countryCode:HUB.cc,onlyMyLocation:true,sort:{},stage:[],status:[],deliveryType:[],paperwork:[],customerDeliveryStatus:[],inboundStatus:[],VehicleTypes:[],pdcFilter:[],dmvDocumentStages:[]})}).then(function(r){return r.json()});
      var droMap={};dash.Data.forEach(function(d){droMap[d.ReferenceNumber]=d});
      var rns=Object.keys(droMap);
      if(!rns.length){ld.innerHTML='Aucune livraison pour cette date.';return}

      var adv=await fetch(BASE+'/advisor/Dashboard?isSidePanelFullScreen=true',{method:'POST',headers:h,body:JSON.stringify({condition:'and',rules:[{condition:'and',ReferenceNumbers:rns,Countries:[]}],Skip:0,Take:200,SortOrder:[],SelectedColumns:[]})}).then(function(r){return r.json()});

      var tiC=adv.Data.Dashboard.filter(function(a){return a.TradeInActionStatus==='COMPLETE_TRADE_IN'});
      var tiR={};
      await Promise.all(tiC.map(function(a){
        return fetch(BASE+'/widget/GetTradeInWidgetInfo?referenceNumber='+a.ReferenceNumber+'&vehicleMapId='+a.VehicleMapId+'&deliveryState='+encodeURIComponent(a.DeliveryState||''),{headers:h})
          .then(function(r){return r.json()}).then(function(j){if(j.Data)tiR[a.ReferenceNumber]={make:(j.Data.Make||'').replace(/_/g,' '),model:j.Data.Model||'',vin:j.Data.VIN||''}}).catch(function(){});
      }));

      var items=adv.Data.Dashboard.map(function(a){
        var d=droMap[a.ReferenceNumber]||{};
        var dt=d.ScheduledDeliveryStartDateString||'';
        var t24='?',m=dt.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if(m){var hr=parseInt(m[1]);if(m[3].toUpperCase()==='PM'&&hr<12)hr+=12;if(m[3].toUpperCase()==='AM'&&hr===12)hr=0;t24=String(hr).padStart(2,'0')+':'+m[2]}
        var hasTI=a.TradeInActionStatus==='COMPLETE_TRADE_IN';
        var hasP=!!(a.LicensePlate&&a.LicensePlate.trim());
        var insOK=a.InsuranceActionStatus==='COMPLETE';
        var otg=a.VehicleStage==='Finished Goods'||a.VehicleStage==='Arrived at VRL';
        var alerts=[];if(!hasP)alerts.push('Plaque');if(!otg)alerts.push('OTG');
        var ti=tiR[a.ReferenceNumber];
        return{rn:a.ReferenceNumber,vin:a.Vin,name:a.CustomerName,t:t24,model:a.VehicleModel,color:tr(a.VehicleColor||''),plate:(a.LicensePlate||'').trim(),pay:a.OrderType,host:d.HostName||'?',da:a.DeliverySpecialistName||'?',sa:a.SalesAdvisorName||'?',hasTI:hasTI,insOK:insOK,hasP:hasP,alerts:alerts,b2b:a.IsEnterpriseOrder,ref:!!a.ReferralCode,otg:otg,vs:a.VehicleStage||'',trim:a.VehicleTrim,interior:a.VehicleInterior,wheel:a.VehicleWheel,phone:a.CustomerPhone,email:a.CustomerEmail,addr:(a.RegistrationAddress||'')+', '+(a.RegistrationCity||''),bat:d.VehicleCharge,ins:a.InsuranceActionStatus,opts:a.OptionCodes||'',cc:a.VehicleColorCode,tiMk:ti?ti.make:null,tiMd:ti?ti.model:null,tiVn:ti?ti.vin:null};
      }).sort(function(a,b){return a.t.localeCompare(b.t)});

      window._tdhData=items;

      var html='';
      for(var i=0;i<items.length;i++){
        var d=items[i];
        var rc=d.alerts.length>0?(d.hasP?'w':'b'):'';
        html+='<tr class="'+rc+'" data-host="'+d.host+'" data-i="'+i+'">'
          +'<td><input type="checkbox" class="ck rc" data-i="'+i+'" '+(d.alerts.length===0?'checked':'')+'/></td>'
          +'<td><span class="tm">'+d.t+'</span></td>'
          +'<td><span class="nm" data-i="'+i+'">'+d.name+'</span><br><span style="font-size:11px;color:#aaa">'+d.rn+'</span></td>'
          +'<td><strong>'+d.model+'</strong><br><span style="font-size:12px;color:#888">'+d.color+'</span></td>'
          +'<td>'+(d.hasP?'<span class="pl">'+d.plate+'</span>':'<span class="dot dr"></span><span style="color:#dc3545;font-size:12px">Manquante</span>')+'</td>'
          +'<td><span class="badge '+payC(d.pay)+'">'+(d.b2b?'ENTERPRISE':payT(d.pay))+'</span></td>'
          +'<td>'+(d.hasTI?'<span class="dot dg"></span>'+(d.tiMk?d.tiMk+' '+(d.tiMd||''):'Oui'):'<span style="color:#ccc">Non</span>')+'</td>'
          +'<td>'+(d.otg?'<span class="dot dg"></span>Oui':'<span class="dot do"></span><span style="font-size:11px;color:#d97706">'+(d.vs||'Non')+'</span>')+'</td>'
          +'<td>'+(d.insOK?'<span class="dot dg"></span>OK':'<span style="color:#999">Non</span>')+'</td>'
          +'</tr>';
      }
      tb.innerHTML=html;

      var ok=items.filter(function(d){return d.alerts.length===0}).length;
      $('sT').textContent=items.length;
      $('sO').textContent=ok;
      $('sA').textContent=items.length-ok;

      ld.style.display='none';tbl.style.display='';
      $('genBtn').style.display='';

      // Select all
      $('sa').onchange=function(e){D.querySelectorAll('.rc').forEach(function(c){if(c.closest('tr').style.display!=='none')c.checked=e.target.checked})};

    }catch(err){ld.innerHTML='Erreur: '+err.message}
  };

  // Generate PDFs
  $('genBtn').onclick=function(){
    var data=window._tdhData||[];
    var checked=[];
    D.querySelectorAll('.rc:checked').forEach(function(c){
      var tr=c.closest('tr');
      if(tr&&tr.style.display!=='none'){var i=parseInt(c.dataset.i);if(data[i])checked.push(data[i])}
    });
    if(!checked.length){alert('Aucune livraison selectionnee!');return}
    alert('Generation de '+checked.length+' pages de garde... (fonctionnalite en cours)');
  };
}
