// Tesla Delivery Hub v7 - Overlay with prefixed CSS (no iframe, no shadow DOM)
(function(){
  var _old=document.getElementById('tdh-launch');if(_old)_old.remove();
  var b=document.createElement('div');b.id='tdh-launch';b.textContent='DELIVERY HUB';
  b.style.cssText='position:fixed;bottom:20px;right:20px;z-index:99998;background:#171a20;color:#fff;padding:12px 24px;border-radius:30px;cursor:pointer;font-family:sans-serif;font-size:13px;font-weight:600;letter-spacing:2px;box-shadow:0 4px 12px rgba(0,0,0,.3)';
  b.onclick=function(){startDashboard()};document.body.appendChild(b);
})();

function startDashboard(){
  var token=(localStorage.getItem('delops_id_token')||'').replace(/^"|"$/g,'');
  var token2=(localStorage.getItem('delops_id_token_data')||'').replace(/^"|"$/g,'');
  var userId=(localStorage.getItem('UserId')||'').replace(/^"|"$/g,'');
  var at=token&&token.length>100?token:token2&&token2.length>100?token2:null;
  var AUTH=at&&userId?{token:'Bearer '+at,userId:userId}:null;
  if(!AUTH){var _f=window.fetch;window.fetch=function(){var u=typeof arguments[0]==='string'?arguments[0]:'';var o=arguments[1]||{};var h=o.headers||{};if(u.indexOf('mytdeliveryopsapi')>=0&&(h.Authorization||h.authorization))AUTH={token:h.Authorization||h.authorization,userId:h.userid||h.UserId||userId||''};return _f.apply(this,arguments)};}

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

  var old=document.getElementById('tdh-overlay');if(old)old.remove();
  var O=document.createElement('div');O.id='tdh-overlay';
  O.style.cssText='position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:99999;overflow-y:auto';

  // ALL CSS prefixed with #tdh-overlay to beat DRO specificity
  var css='#tdh-overlay{background:#fff !important;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif !important;color:#393c41 !important;font-size:14px !important;line-height:1.5 !important}'
  +'#tdh-overlay *{box-sizing:border-box !important}'
  +'#tdh-overlay .tdh-hdr{height:48px !important;background:#fff !important;border-bottom:1px solid #e5e5e5 !important;display:flex !important;align-items:center !important;padding:0 24px !important}'
  +'#tdh-overlay .tdh-hdr .lo{font-size:16px !important;font-weight:600 !important;letter-spacing:3px !important;color:#171a20 !important}'
  +'#tdh-overlay .tdh-hdr .se{margin:0 12px !important;color:#ccc !important}'
  +'#tdh-overlay .tdh-hdr .ap{font-size:14px !important;color:#5c5e62 !important}'
  +'#tdh-overlay .tdh-hdr .ri{margin-left:auto !important;font-size:14px !important;color:#5c5e62 !important}'
  +'#tdh-overlay .tdh-title{padding:24px 24px 8px !important;font-size:26px !important;font-weight:600 !important;color:#171a20 !important;display:block !important;visibility:visible !important}'
  +'#tdh-overlay .tdh-bar{padding:16px 24px !important;display:flex !important;align-items:center !important;gap:8px !important;flex-wrap:wrap !important}'
  +'#tdh-overlay .pi{padding:7px 18px !important;border-radius:20px !important;border:1px solid #d0d0d0 !important;background:#fff !important;cursor:pointer !important;font-size:14px !important;color:#5c5e62 !important;font-family:inherit !important;font-weight:400 !important}'
  +'#tdh-overlay .pi:hover{background:#f5f5f5 !important}'
  +'#tdh-overlay .pi.on{background:#171a20 !important;color:#fff !important;border-color:#171a20 !important}'
  +'#tdh-overlay .s2{width:1px !important;height:24px !important;background:#e0e0e0 !important;margin:0 8px !important;display:inline-block !important}'
  +'#tdh-overlay select{padding:7px 14px !important;border:1px solid #d0d0d0 !important;border-radius:8px !important;font-size:14px !important;font-family:inherit !important;background:#fff !important;color:#393c41 !important}'
  +'#tdh-overlay .bt{padding:7px 18px !important;border-radius:20px !important;border:none !important;font-size:14px !important;font-family:inherit !important;font-weight:500 !important;cursor:pointer !important}'
  +'#tdh-overlay .bp{background:#3e6ae1 !important;color:#fff !important}'
  +'#tdh-overlay .bk{background:#28a745 !important;color:#fff !important}'
  +'#tdh-overlay .bx{background:#f0f0f0 !important;color:#5c5e62 !important}'
  +'#tdh-overlay .tdh-stats{margin-left:auto !important;display:flex !important;gap:32px !important}'
  +'#tdh-overlay .tdh-sn{font-size:26px !important;font-weight:300 !important;text-align:center !important;color:#171a20 !important}'
  +'#tdh-overlay .tdh-sl{font-size:10px !important;text-transform:uppercase !important;letter-spacing:1.5px !important;color:#999 !important;text-align:center !important}'
  +'#tdh-overlay .tdh-wrap{padding:8px 24px 24px !important}'
  +'#tdh-overlay table{width:100% !important;border-collapse:collapse !important}'
  +'#tdh-overlay th{padding:12px 14px !important;text-align:left !important;font-size:12px !important;color:#888 !important;font-weight:500 !important;border-bottom:1px solid #e5e5e5 !important;background:transparent !important}'
  +'#tdh-overlay td{padding:14px 14px !important;font-size:14px !important;border-bottom:1px solid #f0f0f0 !important;vertical-align:middle !important;background:transparent !important;color:#393c41 !important}'
  +'#tdh-overlay tr:hover td{background:#fafbff !important}'
  +'#tdh-overlay tr.w td{background:#fffdf5 !important}'
  +'#tdh-overlay tr.b td{background:#fef8f8 !important}'
  +'#tdh-overlay .ck{width:17px !important;height:17px !important;accent-color:#3e6ae1 !important;cursor:pointer !important}'
  +'#tdh-overlay .bg{display:inline-block !important;padding:3px 10px !important;border-radius:4px !important;font-size:11px !important;font-weight:600 !important}'
  +'#tdh-overlay .bg.cash{background:#e6f4ea !important;color:#1e7e34 !important}'
  +'#tdh-overlay .bg.leasing{background:#e3f2fd !important;color:#1565c0 !important}'
  +'#tdh-overlay .bg.credit{background:#ede7f6 !important;color:#6a1b9a !important}'
  +'#tdh-overlay .bg.lld{background:#fff8e1 !important;color:#f57f17 !important}'
  +'#tdh-overlay .bg.enterprise{background:#eceff1 !important;color:#37474f !important}'
  +'#tdh-overlay .dt{display:inline-block !important;width:8px !important;height:8px !important;border-radius:50% !important;margin-right:6px !important}'
  +'#tdh-overlay .dg{background:#28a745 !important}'
  +'#tdh-overlay .dr{background:#dc3545 !important}'
  +'#tdh-overlay .do{background:#f0ad4e !important}'
  +'#tdh-overlay .nm{font-weight:600 !important;cursor:pointer !important;color:#171a20 !important;font-size:14px !important}'
  +'#tdh-overlay .nm:hover{color:#3e6ae1 !important}'
  +'#tdh-overlay .tm{font-size:15px !important;font-weight:500 !important;color:#171a20 !important}'
  +'#tdh-overlay .pl{font-family:SFMono-Regular,Consolas,monospace !important;font-weight:600 !important;font-size:13px !important}'
  +'#tdh-overlay .ld{text-align:center !important;padding:80px !important;font-size:15px !important;color:#999 !important}'
  +'#tdh-overlay .spin{display:inline-block !important;width:22px !important;height:22px !important;border:2.5px solid #eee !important;border-top-color:#3e6ae1 !important;border-radius:50% !important;animation:tdhspin .7s linear infinite !important;margin-right:10px !important;vertical-align:middle !important}'
  +'@keyframes tdhspin{to{transform:rotate(360deg)}}';

  var style=document.createElement('style');style.textContent=css;O.appendChild(style);

  O.innerHTML+=
    '<div class="tdh-hdr"><span class="lo">TESLA</span><span class="se">|</span><span class="ap">Delivery Hub</span><span class="ri">Ben Daubin</span></div>'
  + '<div class="tdh-title">Delivery Dashboard</div>'
  + '<div class="tdh-bar">'
  + '<button class="pi on" data-f="all">Tous</button>'
  + CES.map(function(c){return'<button class="pi" data-f="'+c+'">'+c.split(' ')[0]+'</button>'}).join('')
  + '<div class="s2"></div>'
  + '<select id="tdh-dt"><option value="'+isoD(today)+'">Aujourd\'hui - '+fmtD(today)+'</option><option value="'+isoD(tmrw)+'">Demain - '+fmtD(tmrw)+'</option></select>'
  + '<button class="bt bp" id="tdh-load">Charger</button>'
  + '<button class="bt bk" id="tdh-gen" style="display:none">Generer PDFs</button>'
  + '<button class="bt bx" id="tdh-close">Fermer</button>'
  + '<div class="tdh-stats"><div><div class="tdh-sn" id="tdh-sT">-</div><div class="tdh-sl">Livraisons</div></div>'
  + '<div><div class="tdh-sn" id="tdh-sO">-</div><div class="tdh-sl">Pretes</div></div>'
  + '<div><div class="tdh-sn" id="tdh-sA">-</div><div class="tdh-sl">Alertes</div></div></div>'
  + '</div>'
  + '<div class="tdh-wrap"><div class="ld" id="tdh-ld" style="display:none"><span class="spin"></span> Chargement...</div>'
  + '<table id="tdh-tbl" style="display:none"><thead><tr><th style="width:40px"><input type="checkbox" class="ck" id="tdh-sa" checked/></th>'
  + '<th>Heure</th><th>Client</th><th>Vehicule</th><th>Plaque</th><th>Paiement</th><th>Trade-In</th><th>OTG</th><th>Assurance</th>'
  + '</tr></thead><tbody id="tdh-tb"></tbody></table></div>';

  document.body.appendChild(O);

  // Events
  document.getElementById('tdh-close').onclick=function(){O.remove()};

  O.querySelectorAll('.pi[data-f]').forEach(function(btn){
    btn.onclick=function(){
      O.querySelectorAll('.pi[data-f]').forEach(function(p){p.classList.remove('on')});
      btn.classList.add('on');
      var f=btn.dataset.f;
      O.querySelectorAll('#tdh-tb tr').forEach(function(r){
        if(f==='all'){r.style.display='';return}
        r.style.display=(r.dataset.host||'').toLowerCase().indexOf(f.split(' ')[0].toLowerCase())>=0?'':'none';
      });
    };
  });

  document.getElementById('tdh-load').onclick=async function(){
    var ld=document.getElementById('tdh-ld'),tbl=document.getElementById('tdh-tbl'),tb=document.getElementById('tdh-tb');
    ld.style.display='';tbl.style.display='none';
    ld.innerHTML='<span class="spin"></span> Chargement...';
    if(!AUTH){ld.innerHTML='Token non trouve. Rafraichis DRO (F5) puis relance.';return}
    var h={'Authorization':AUTH.token,'Content-Type':'application/json','userid':AUTH.userId};
    var ds=document.getElementById('tdh-dt').value;
    try{
      var dash=await fetch(BASE+'/deliveryops/Customers/Dashboard',{method:'POST',headers:h,body:JSON.stringify({fromDeliveryDate:ds,trtId:HUB.trtId,customerHasNoHost:false,skip:0,take:200,fromTime:'00:00',toTime:'23:59',countryCode:HUB.cc,onlyMyLocation:true,sort:{},stage:[],status:[],deliveryType:[],paperwork:[],customerDeliveryStatus:[],inboundStatus:[],VehicleTypes:[],pdcFilter:[],dmvDocumentStages:[]})}).then(function(r){return r.json()});
      var dm={};dash.Data.forEach(function(d){dm[d.ReferenceNumber]=d});var rns=Object.keys(dm);
      if(!rns.length){ld.innerHTML='Aucune livraison pour cette date.';return}
      var adv=await fetch(BASE+'/advisor/Dashboard?isSidePanelFullScreen=true',{method:'POST',headers:h,body:JSON.stringify({condition:'and',rules:[{condition:'and',ReferenceNumbers:rns,Countries:[]}],Skip:0,Take:200,SortOrder:[],SelectedColumns:[]})}).then(function(r){return r.json()});
      var tiC=adv.Data.Dashboard.filter(function(a){return a.TradeInActionStatus==='COMPLETE_TRADE_IN'});
      var tiR={};await Promise.all(tiC.map(function(a){return fetch(BASE+'/widget/GetTradeInWidgetInfo?referenceNumber='+a.ReferenceNumber+'&vehicleMapId='+a.VehicleMapId+'&deliveryState='+encodeURIComponent(a.DeliveryState||''),{headers:h}).then(function(r){return r.json()}).then(function(j){if(j.Data&&j.Data.Make)tiR[a.ReferenceNumber]={mk:(j.Data.Make||'').replace(/_/g,' '),md:j.Data.Model||'',vn:j.Data.VIN||''}}).catch(function(){})}));
      var items=adv.Data.Dashboard.map(function(a){var d=dm[a.ReferenceNumber]||{};var dt=d.ScheduledDeliveryStartDateString||'';var t='?',m=dt.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);if(m){var hr=parseInt(m[1]);if(m[3].toUpperCase()==='PM'&&hr<12)hr+=12;if(m[3].toUpperCase()==='AM'&&hr===12)hr=0;t=String(hr).padStart(2,'0')+':'+m[2]}var ti=a.TradeInActionStatus==='COMPLETE_TRADE_IN';var hp=!!(a.LicensePlate&&a.LicensePlate.trim());var io=a.InsuranceActionStatus==='COMPLETE';var otg=a.VehicleStage==='Finished Goods'||a.VehicleStage==='Arrived at VRL'||(a.VehicleStage&&a.VehicleStage.indexOf('Arrived')>=0)||(a.VehicleStage&&a.VehicleStage.indexOf('delivered')>=0);var al=[];if(!hp)al.push('P');if(!otg)al.push('O');var r=tiR[a.ReferenceNumber];return{rn:a.ReferenceNumber,name:a.CustomerName,t:t,model:a.VehicleModel,color:tr(a.VehicleColor||''),plate:(a.LicensePlate||'').trim(),pay:a.OrderType,host:d.HostName||'?',ti:ti,io:io,hp:hp,al:al,b2b:a.IsEnterpriseOrder,otg:otg,vs:a.VehicleStage||'',mk:r?r.mk:null,md:r?r.md:null}}).sort(function(a,b){return a.t.localeCompare(b.t)});
      window._tdhData=items;
      var html='';for(var i=0;i<items.length;i++){var d=items[i];html+='<tr class="'+(d.al.length?d.hp?'w':'b':'')+'" data-host="'+d.host+'" data-i="'+i+'"><td><input type="checkbox" class="ck rc" data-i="'+i+'" '+(d.al.length===0?'checked':'')+'/></td><td><span class="tm">'+d.t+'</span></td><td><span class="nm">'+d.name+'</span><br><span style="font-size:11px;color:#aaa">'+d.rn+'</span></td><td><strong>'+d.model+'</strong><br><span style="font-size:12px;color:#888">'+d.color+'</span></td><td>'+(d.hp?'<span class="pl">'+d.plate+'</span>':'<span class="dt dr"></span><span style="color:#dc3545;font-size:12px">Manquante</span>')+'</td><td><span class="bg '+payC(d.pay)+'">'+(d.b2b?'ENTERPRISE':payT(d.pay))+'</span></td><td>'+(d.ti?'<span class="dt dg"></span>'+(d.mk?d.mk+' '+(d.md||''):'Oui'):'<span style="color:#ccc">Non</span>')+'</td><td>'+(d.otg?'<span class="dt dg"></span>Oui':'<span class="dt do"></span><span style="font-size:11px;color:#d97706">'+(d.vs||'Non')+'</span>')+'</td><td>'+(d.io?'<span class="dt dg"></span>OK':'<span style="color:#999">Non</span>')+'</td></tr>'}
      tb.innerHTML=html;
      var ok=items.filter(function(d){return d.al.length===0}).length;
      document.getElementById('tdh-sT').textContent=items.length;
      document.getElementById('tdh-sO').textContent=ok;
      document.getElementById('tdh-sA').textContent=items.length-ok;
      ld.style.display='none';tbl.style.display='';document.getElementById('tdh-gen').style.display='';
      document.getElementById('tdh-sa').onchange=function(e){O.querySelectorAll('.rc').forEach(function(c){if(c.closest('tr').style.display!=='none')c.checked=e.target.checked})};
    }catch(err){ld.innerHTML='Erreur: '+err.message}
  };

  document.getElementById('tdh-gen').onclick=function(){
    var data=window._tdhData||[];var checked=[];
    O.querySelectorAll('.rc:checked').forEach(function(c){var tr=c.closest('tr');if(tr&&tr.style.display!=='none'){var i=parseInt(c.dataset.i);if(data[i])checked.push(data[i])}});
    if(!checked.length){alert('Aucune livraison!');return}
    alert('Generation de '+checked.length+' pages de garde...');
  };
}
