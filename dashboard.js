// Tesla Delivery Hub v9 â€” Full page replacement (standalone on DRO domain)
(function(){
  var _o=document.getElementById('tdh-launch');if(_o)_o.remove();
  var b=document.createElement('div');b.id='tdh-launch';b.textContent='DELIVERY HUB';
  b.style.cssText='position:fixed;bottom:20px;right:20px;z-index:99998;background:#171a20;color:#fff;padding:12px 24px;border-radius:30px;cursor:pointer;font-family:sans-serif;font-size:13px;font-weight:600;letter-spacing:2px;box-shadow:0 4px 12px rgba(0,0,0,.3)';
  b.onclick=function(){launchHub()};document.body.appendChild(b);
})();

function launchHub(){
  // Auth
  var tk=(localStorage.getItem('delops_id_token')||'').replace(/^"|"$/g,'');
  var t2=(localStorage.getItem('delops_id_token_data')||'').replace(/^"|"$/g,'');
  var ui=(localStorage.getItem('UserId')||'').replace(/^"|"$/g,'');
  var at=tk&&tk.length>100?tk:t2&&t2.length>100?t2:null;
  var AUTH=at&&ui?{token:'Bearer '+at,userId:ui}:null;

  var CFG={trtId:28498,cc:'FR'};
  var CES=['Ben Daubin','Sacha Villa','Sophie MACE'];
  var BASE='https://mytdeliveryopsapi.tesla.com/api';
  var FR={'Pearl White':'Blanc perle','Diamond Black':'Noir Diamant','Stealth Grey':'Gris Stealth','Midnight Silver Metallic':'Gris Nuit','Red Multi-Coat':'Rouge','Ultra Red':'Rouge Ultra','Quicksilver':'Quicksilver','Glacier Blue':'Bleu Glacier','Frost Blue':'Bleu Givre','Midnight Cherry Red':'Rouge Cerise','Marine Blue':'Bleu Marine'};
  var tr=function(s){return FR[s]||s};
  var pT=function(t){return{CASH:'CASH',TESLA_LEASING:'LEASING',TESLA_LENDING:'CREDIT',THIRD_PARTY_LEASING:'LLD TIERS'}[t]||t};
  var pC=function(t){return{CASH:'cash',TESLA_LEASING:'leasing',TESLA_LENDING:'credit',THIRD_PARTY_LEASING:'lld'}[t]||'ent'};
  var now=new Date(),tmr=new Date(Date.now()+864e5);
  var fD=function(d){return d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})};
  var iD=function(d){return d.toISOString().split('T')[0]};

  // NUKE the page â€” remove ALL DRO content and styles
  document.querySelectorAll('link[rel="stylesheet"],style').forEach(function(s){s.remove()});
  document.body.className='';
  document.body.removeAttribute('style');

  // Write clean page
  document.head.innerHTML='<meta charset="utf-8"><title>Tesla Delivery Hub</title><style>'
  +'*{box-sizing:border-box;margin:0;padding:0}'
  +'body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#393c41;background:#fff;font-size:15px;line-height:1.5}'
  +'.hdr{height:56px;border-bottom:1px solid #e5e5e5;display:flex;align-items:center;padding:0 32px}'
  +'.hdr .logo{font-size:18px;font-weight:600;letter-spacing:3px;color:#171a20}'
  +'.hdr .sep{margin:0 14px;color:#ccc}'
  +'.hdr .app{font-size:15px;color:#5c5e62}'
  +'.hdr .ri{margin-left:auto;font-size:14px;color:#5c5e62}'
  +'.ttl{padding:32px 32px 12px;font-size:36px;font-weight:700;color:#171a20}'
  +'.bar{padding:20px 32px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}'
  +'.pill{padding:10px 24px;border-radius:24px;border:1px solid #d0d0d0;background:#fff;cursor:pointer;font-size:15px;color:#5c5e62;font-family:inherit}'
  +'.pill:hover{background:#f5f5f5}'
  +'.pill.on{background:#171a20;color:#fff;border-color:#171a20}'
  +'.s2{width:1px;height:28px;background:#e0e0e0;margin:0 10px}'
  +'select{padding:10px 16px;border:1px solid #d0d0d0;border-radius:8px;font-size:15px;font-family:inherit;color:#333}'
  +'.btn{padding:10px 24px;border-radius:24px;border:none;font-size:15px;font-family:inherit;font-weight:500;cursor:pointer}'
  +'.bp{background:#3e6ae1;color:#fff}.bk{background:#28a745;color:#fff}.bl{background:#f0f0f0;color:#5c5e62}'
  +'.sts{margin-left:auto;display:flex;gap:36px}'
  +'.sn{font-size:32px;font-weight:300;text-align:center;color:#171a20}'
  +'.sl{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#999;text-align:center}'
  +'.wrp{padding:8px 32px 40px}'
  +'table{width:100%;border-collapse:collapse}'
  +'th{padding:16px 20px;text-align:left;font-size:13px;color:#888;font-weight:500;border-bottom:2px solid #eee}'
  +'td{padding:20px 20px;font-size:15px;border-bottom:1px solid #f0f0f0;vertical-align:middle}'
  +'tr:hover td{background:#fafbff}'
  +'tr.w td{background:#fffdf5}tr.b td{background:#fef8f8}'
  +'.ck{width:18px;height:18px;accent-color:#3e6ae1;cursor:pointer}'
  +'.badge{display:inline-block;padding:5px 14px;border-radius:4px;font-size:13px;font-weight:600}'
  +'.badge.cash{background:#e6f4ea;color:#1e7e34}'
  +'.badge.leasing{background:#e3f2fd;color:#1565c0}'
  +'.badge.credit{background:#ede7f6;color:#6a1b9a}'
  +'.badge.lld{background:#fff8e1;color:#f57f17}'
  +'.badge.ent{background:#eceff1;color:#37474f}'
  +'.dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px}'
  +'.dg{background:#28a745}.dr{background:#dc3545}.do{background:#f0ad4e}'
  +'.nm{font-weight:600;cursor:pointer;color:#171a20;font-size:16px}.nm:hover{color:#3e6ae1}'
  +'.tm{font-size:17px;font-weight:500;color:#171a20}'
  +'.pl{font-family:SFMono-Regular,Consolas,monospace;font-weight:600;font-size:15px}'
  +'.rn{font-size:12px;color:#aaa;margin-top:3px}'
  +'.sub{font-size:13px;color:#888}'
  +'.ld{text-align:center;padding:100px;font-size:16px;color:#999}'
  +'.spin{display:inline-block;width:24px;height:24px;border:3px solid #eee;border-top-color:#3e6ae1;border-radius:50%;animation:s .7s linear infinite;margin-right:12px;vertical-align:middle}'
  +'@keyframes s{to{transform:rotate(360deg)}}'
  +'</style>';

  document.body.innerHTML=
    '<div class="hdr"><span class="logo">TESLA</span><span class="sep">|</span><span class="app">Delivery Hub</span><span class="ri">Ben Daubin</span></div>'
  + '<div class="ttl">Delivery Dashboard</div>'
  + '<div class="bar">'
  + '<button class="pill on" id="fa">Tous</button>'
  + CES.map(function(c,i){return'<button class="pill" id="f'+i+'">'+c.split(' ')[0]+'</button>'}).join('')
  + '<div class="s2"></div>'
  + '<select id="dt"><option value="'+iD(now)+'">Aujourd\'hui - '+fD(now)+'</option><option value="'+iD(tmr)+'">Demain - '+fD(tmr)+'</option></select>'
  + '<button class="btn bp" id="ld">Charger</button>'
  + '<button class="btn bk" id="gn" style="display:none">Generer PDFs</button>'
  + '<button class="btn bl" onclick="location.reload()">Fermer</button>'
  + '<div class="sts"><div><div class="sn" id="sT">-</div><div class="sl">Livraisons</div></div>'
  + '<div><div class="sn" id="sO">-</div><div class="sl">Pretes</div></div>'
  + '<div><div class="sn" id="sA">-</div><div class="sl">Alertes</div></div></div>'
  + '</div>'
  + '<div class="wrp"><div class="ld" id="lg" style="display:none"><span class="spin"></span> Chargement...</div>'
  + '<table id="tbl" style="display:none"><thead><tr><th style="width:44px"><input type="checkbox" class="ck" id="sa" checked/></th>'
  + '<th>Heure</th><th>Client</th><th>Vehicule</th><th>Plaque</th><th>Paiement</th><th>Trade-In</th><th>OTG</th><th>Assurance</th>'
  + '</tr></thead><tbody id="tb"></tbody></table></div>';

  // Filters
  var fils=['all'].concat(CES);
  fils.forEach(function(f,i){
    var btn=document.getElementById(i===0?'fa':'f'+(i-1));
    if(!btn)return;
    btn.onclick=function(){
      document.querySelectorAll('.pill').forEach(function(p){p.classList.remove('on')});
      btn.classList.add('on');
      document.querySelectorAll('#tb tr').forEach(function(r){
        if(f==='all'){r.style.display='';return}
        r.style.display=(r.dataset.host||'').toLowerCase().indexOf(f.split(' ')[0].toLowerCase())>=0?'':'none';
      });
    };
  });

  // Load
  document.getElementById('ld').onclick=async function(){
    var lg=document.getElementById('lg'),tbl=document.getElementById('tbl'),tb=document.getElementById('tb');
    lg.style.display='';tbl.style.display='none';
    lg.innerHTML='<span class="spin"></span> Chargement...';
    if(!AUTH){lg.innerHTML='Token non trouve. Recharge DRO (F5).';return}
    var h={'Authorization':AUTH.token,'Content-Type':'application/json','userid':AUTH.userId};
    var ds=document.getElementById('dt').value;
    try{
      var dash=await fetch(BASE+'/deliveryops/Customers/Dashboard',{method:'POST',headers:h,body:JSON.stringify({fromDeliveryDate:ds,trtId:CFG.trtId,customerHasNoHost:false,skip:0,take:200,fromTime:'00:00',toTime:'23:59',countryCode:CFG.cc,onlyMyLocation:true,sort:{},stage:[],status:[],deliveryType:[],paperwork:[],customerDeliveryStatus:[],inboundStatus:[],VehicleTypes:[],pdcFilter:[],dmvDocumentStages:[]})}).then(function(r){return r.json()});
      var dm={};dash.Data.forEach(function(d){dm[d.ReferenceNumber]=d});var rns=Object.keys(dm);
      if(!rns.length){lg.innerHTML='Aucune livraison.';return}
      var adv=await fetch(BASE+'/advisor/Dashboard?isSidePanelFullScreen=true',{method:'POST',headers:h,body:JSON.stringify({condition:'and',rules:[{condition:'and',ReferenceNumbers:rns,Countries:[]}],Skip:0,Take:200,SortOrder:[],SelectedColumns:[]})}).then(function(r){return r.json()});
      var tiC=adv.Data.Dashboard.filter(function(a){return a.TradeInActionStatus==='COMPLETE_TRADE_IN'});
      var tiR={};await Promise.all(tiC.map(function(a){return fetch(BASE+'/widget/GetTradeInWidgetInfo?referenceNumber='+a.ReferenceNumber+'&vehicleMapId='+a.VehicleMapId+'&deliveryState='+encodeURIComponent(a.DeliveryState||''),{headers:h}).then(function(r){return r.json()}).then(function(j){if(j.Data)tiR[a.ReferenceNumber]={ms:j.Data.AcquisitionMilestone||''}}).catch(function(){})}));
      var items=adv.Data.Dashboard.map(function(a){var d=dm[a.ReferenceNumber]||{};var dt=d.ScheduledDeliveryStartDateString||'';var t='?',m=dt.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);if(m){var hr=parseInt(m[1]);if(m[3].toUpperCase()==='PM'&&hr<12)hr+=12;if(m[3].toUpperCase()==='AM'&&hr===12)hr=0;t=String(hr).padStart(2,'0')+':'+m[2]}var hp=!!(a.LicensePlate&&a.LicensePlate.trim());var io=a.InsuranceActionStatus==='COMPLETE';var otg=a.VehicleStage==='Finished Goods'||a.VehicleStage==='Arrived at VRL'||(a.VehicleStage&&a.VehicleStage.indexOf('Arrived')>=0)||(a.VehicleStage&&a.VehicleStage.indexOf('delivered')>=0);var al=[];if(!hp)al.push('P');if(!otg)al.push('O');var r=tiR[a.ReferenceNumber];return{rn:a.ReferenceNumber,name:a.CustomerName,t:t,model:a.VehicleModel,color:tr(a.VehicleColor||''),plate:(a.LicensePlate||'').trim(),pay:a.OrderType,host:d.HostName||'?',b2b:a.IsEnterpriseOrder,hp:hp,io:io,otg:otg,vs:a.VehicleStage||'',al:al,tims:r?r.ms:null}}).sort(function(a,b){return a.t.localeCompare(b.t)});
      window._tdhData=items;
      var out='';for(var i=0;i<items.length;i++){var d=items[i];out+='<tr class="'+(d.al.length?d.hp?'w':'b':'')+'" data-host="'+d.host+'"><td><input type="checkbox" class="ck rc" data-i="'+i+'" '+(d.al.length===0?'checked':'')+'/></td><td><span class="tm">'+d.t+'</span></td><td><span class="nm">'+d.name+'</span><div class="rn">'+d.rn+'</div></td><td><strong>'+d.model+'</strong><br><span class="sub">'+d.color+'</span></td><td>'+(d.hp?'<span class="pl">'+d.plate+'</span>':'<span class="dot dr"></span><span style="color:#dc3545">Manquante</span>')+'</td><td><span class="badge '+pC(d.pay)+'">'+(d.b2b?'ENTERPRISE':pT(d.pay))+'</span></td><td>'+(d.tims?'<span class="dot dg"></span>'+d.tims:'<span style="color:#ccc">Non</span>')+'</td><td>'+(d.otg?'<span class="dot dg"></span>Oui':'<span class="dot do"></span><span class="sub">'+(d.vs||'Non')+'</span>')+'</td><td>'+(d.io?'<span class="dot dg"></span>OK':'<span style="color:#999">Non</span>')+'</td></tr>'}
      tb.innerHTML=out;
      var ok=items.filter(function(d){return d.al.length===0}).length;
      document.getElementById('sT').textContent=items.length;
      document.getElementById('sO').textContent=ok;
      document.getElementById('sA').textContent=items.length-ok;
      lg.style.display='none';tbl.style.display='';
      document.getElementById('gn').style.display='';
      document.getElementById('sa').onchange=function(e){document.querySelectorAll('.rc').forEach(function(c){if(c.closest('tr').style.display!=='none')c.checked=e.target.checked})};
    }catch(err){lg.innerHTML='Erreur: '+err.message}
  };

  // Generate
  document.getElementById('gn').onclick=function(){
    var data=window._tdhData||[];var checked=[];
    document.querySelectorAll('.rc:checked').forEach(function(c){var tr=c.closest('tr');if(tr&&tr.style.display!=='none'){var i=parseInt(c.dataset.i);if(data[i])checked.push(data[i])}});
    if(!checked.length){alert('Aucune livraison!');return}
    alert('Generation de '+checked.length+' pages de garde...');
  };
}
