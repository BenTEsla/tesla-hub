// Tesla Delivery Hub v13 â€” Dashboard on Intrepid (reads DRO token from cookie)
// Launch from DRO with the launcher, then paste this on Intrepid.
(function(){
  // Read DRO token from .tesla.com cookie (set by launcher on DRO)
  var cookies=document.cookie;
  var droToken='';var droUserId='';
  cookies.split(';').forEach(function(c){
    var kv=c.trim().split('=');
    if(kv[0]==='tdh_tk')droToken=decodeURIComponent(kv[1]);
    if(kv[0]==='tdh_uid')droUserId=kv[1];
  });
  if(!droToken){
    droToken=prompt('Token DRO non trouve dans le cookie.\nColle-le ici (sur DRO: copy(localStorage.getItem("delops_id_token")))');
    if(!droToken){alert('Token requis!');return}
    droToken=droToken.replace(/^"|"$/g,'');
  }
  if(!droUserId)droUserId=prompt('UserId?')||'428058';

  var CFG={trtId:28498,cc:'FR'};
  var CES=['Ben Daubin','Sacha Villa','Sophie MACE'];
  var BASE='https://mytdeliveryopsapi.tesla.com/api';
  var INTREPID='https://intrepidapi.tesla.com/cogs/api/cogs';
  var FR={'Pearl White':'Blanc perle','Diamond Black':'Noir Diamant','Stealth Grey':'Gris Stealth','Midnight Silver Metallic':'Gris Nuit','Red Multi-Coat':'Rouge','Ultra Red':'Rouge Ultra','Quicksilver':'Quicksilver','Glacier Blue':'Bleu Glacier','Frost Blue':'Bleu Givre','Midnight Cherry Red':'Rouge Cerise','Marine Blue':'Bleu Marine'};
  var tr=function(s){return FR[s]||s};
  var pT=function(t){return{CASH:'CASH',TESLA_LEASING:'LEASING',TESLA_LENDING:'CREDIT',THIRD_PARTY_LEASING:'LLD TIERS'}[t]||t};
  var pC=function(t){return{CASH:'cash',TESLA_LEASING:'leasing',TESLA_LENDING:'credit',THIRD_PARTY_LEASING:'lld'}[t]||'ent'};
  var now=new Date(),iD=function(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
  var fD=function(d){return d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})};

  // Build dates (skip sundays)
  var dates=[];for(var di=0;di<10&&dates.length<7;di++){var dd=new Date(Date.now()+di*864e5);if(dd.getDay()===0)continue;dates.push('<option value="'+iD(dd)+'">'+(di===0?'Aujourd\'hui':di===1?'Demain':'J+'+di)+' - '+fD(dd)+'</option>')}

  // NUKE Intrepid page, write our dashboard
  document.head.innerHTML='<meta charset="utf-8"><title>Tesla Delivery Hub</title><style>'
  +'*{box-sizing:border-box;margin:0;padding:0}'
  +'body{font-family:Universal Sans Display,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#393c41;background:#fff;font-size:15px;line-height:1.5}'
  +'.hdr{height:56px;border-bottom:1px solid #e5e5e5;display:flex;align-items:center;padding:0 32px;position:sticky;top:0;background:#fff;z-index:10}'
  +'.hdr .logo svg{vertical-align:middle}'
  +'.hdr .sep{margin:0 14px;color:#ccc}'
  +'.hdr .app{font-size:15px;color:#5c5e62}'
  +'.hdr .ri{margin-left:auto;font-size:14px;color:#5c5e62}'
  +'.ttl{padding:32px 32px 12px;font-size:36px;font-weight:700;color:#171a20}'
  +'.bar{padding:20px 32px;display:flex;align-items:center;gap:10px;flex-wrap:wrap;position:sticky;top:56px;background:#fff;z-index:9;border-bottom:1px solid #f0f0f0}'
  +'.pill{padding:10px 24px;border-radius:6px;border:1px solid #d0d0d0;background:#fff;cursor:pointer;font-size:15px;color:#5c5e62;font-family:inherit}'
  +'.pill:hover{background:#f5f5f5}'
  +'.pill.on{background:#171a20;color:#fff;border-color:#171a20}'
  +'.s2{width:1px;height:28px;background:#e0e0e0;margin:0 10px;display:inline-block}'
  +'select{padding:10px 16px;border:1px solid #d0d0d0;border-radius:8px;font-size:15px;font-family:inherit;color:#333}'
  +'.btn{padding:10px 24px;border-radius:6px;border:1px solid #d0d0d0;font-size:15px;font-family:inherit;font-weight:500;cursor:pointer;background:#f5f5f5;color:#393c41}'
  +'.btn:hover{background:#e8e8e8}'
  +'.sts{margin-left:auto;display:flex;gap:36px}'
  +'.sn{font-size:44px;font-weight:300;text-align:center;color:#171a20}'
  +'.sn.green{color:#28a745}.sn.red{color:#dc3545}'
  +'.sl{font-size:11px;text-transform:uppercase;letter-spacing:2px;color:#999;text-align:center}'
  +'.stat-click{cursor:pointer}.stat-click:hover .sn{color:#3e6ae1}'
  +'.wrp{padding:8px 32px 40px}'
  +'table{width:100%;border-collapse:collapse;table-layout:fixed}'
  +'th{padding:16px 16px;text-align:left;font-size:14px;color:#393c41;font-weight:600;border-bottom:2px solid #eee;cursor:pointer;user-select:none}'
  +'th:hover{color:#171a20}'
  +'td{padding:20px 16px;font-size:15px;border-bottom:1px solid #f0f0f0;vertical-align:middle}'
  +'tr:hover td{background:#fafbff}'
  +'tr.w td{background:#fef5f5}'
  +'.ck{width:16px;height:16px;cursor:pointer;-webkit-appearance:none;appearance:none;border:1.5px solid #bbb;border-radius:2px;background:#fff;position:relative;vertical-align:middle}'
  +'.ck:checked{background:#fff;border-color:#393c41}'
  +'.ck:checked::after{content:"";position:absolute;left:4px;top:1px;width:4px;height:8px;border:solid #393c41;border-width:0 2px 2px 0;transform:rotate(45deg)}'
  +'.nm{font-weight:600;color:#171a20;font-size:15px;white-space:nowrap}'
  +'.tm{font-size:17px;font-weight:500;color:#171a20}'
  +'.pl{font-family:SFMono-Regular,Consolas,monospace;font-weight:600;font-size:15px}'
  +'.dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px}'
  +'.dg{background:#28a745}.dr{background:#dc3545}.do{background:#f0ad4e}'
  +'.badge{display:inline-block;padding:5px 14px;border-radius:4px;font-size:13px;font-weight:600}'
  +'.badge.cash{background:#e6f4ea;color:#1e7e34}.badge.leasing{background:#e3f2fd;color:#1565c0}'
  +'.badge.credit{background:#ede7f6;color:#6a1b9a}.badge.lld{background:#fff8e1;color:#f57f17}'
  +'.badge.ent{background:#eceff1;color:#37474f}'
  +'.bat{font-size:13px;font-weight:600;padding:3px 8px;border-radius:4px}'
  +'.bat.hi{background:#e6f4ea;color:#1e7e34}.bat.mid{background:#fff8e1;color:#f57f17}.bat.lo{background:#fef2f2;color:#dc3545}'
  +'.ld{text-align:center;padding:80px;font-size:15px;color:#999}'
  +'.ldbar{width:200px;height:4px;background:#eee;border-radius:2px;margin:20px auto;overflow:hidden}'
  +'.ldbar::after{content:"";display:block;width:60px;height:4px;background:#171a20;border-radius:2px;animation:ldb 1s ease-in-out infinite}'
  +'@keyframes ldb{0%{transform:translateX(-60px)}100%{transform:translateX(200px)}}'
  +'</style>';

  document.body.innerHTML=
    '<div class="hdr"><svg width="32" height="32" viewBox="0 0 160 160" fill="#171a20"><path d="m80 129.8 14-78.7c13.3 0 17.5 1.5 18.1 7.4 0 0 8.9-3.3 13.5-10.1-17.6-8.1-35.3-8.5-35.3-8.5L80 52.5 69.7 39.9s-17.7.4-35.3 8.5c4.5 6.8 13.5 10.1 13.5 10.1.6-6 4.8-7.4 18.1-7.4z"/><path d="M80 36.3c14.2-.1 30.5 2.2 47.2 9.5 2.2-4 2.8-5.8 2.8-5.8-18.2-7.3-35.3-9.7-50-9.8-14.7.1-31.8 2.5-50 9.8 0 0 .8 2.2 2.8 5.8 16.7-7.3 33-9.6 47.2-9.5"/></svg>'
  + '<span class="sep">|</span><span class="app">Delivery Hub</span>'
  + '<div style="flex:1;display:flex;justify-content:center"><input type="text" id="srch" placeholder="Search by VIN, RN, LP or Name" style="width:100%;max-width:500px;padding:10px 16px;border:1px solid #d0d0d0;border-radius:8px;font-size:14px;font-family:inherit;color:#333;outline:none"></div>'
  + '<span class="ri">Ben Daubin</span></div>'
  + '<div class="ttl">Delivery Dashboard</div>'
  + '<div class="bar">'
  + '<button class="pill on" id="fa">Tous</button>'
  + CES.map(function(c,i){return'<button class="pill" id="f'+i+'">'+c.split(' ')[0]+'</button>'}).join('')
  + '<span class="s2"></span>'
  + '<select id="dt">'+dates.join('')+'</select>'
  + '<button class="btn" id="ld">Charger</button>'
  + '<button class="btn" id="gn" style="display:none">Generer PDFs</button>'
  + '<div class="sts">'
  + '<div class="stat-click" id="sf-all"><div class="sn" id="sT">-</div><div class="sl">Livraisons</div></div>'
  + '<div class="stat-click" id="sf-ok"><div class="sn green" id="sO">-</div><div class="sl" style="color:#28a745">Pretes</div></div>'
  + '<div class="stat-click" id="sf-al"><div class="sn red" id="sA">-</div><div class="sl" style="color:#dc3545">Alertes</div></div>'
  + '</div></div>'
  + '<div class="wrp"><div class="ld" id="lg" style="display:none"><div style="text-align:center;padding:80px"><div class="ldbar"></div><div style="margin-top:16px;color:#999">Chargement...</div></div></div>'
  + '<table id="tbl" style="display:none"><thead><tr>'
  + '<th style="width:40px"><input type="checkbox" class="ck" id="sa"/></th>'
  + '<th style="width:70px">Heure</th><th style="width:16%">Client</th><th style="width:10%">RN</th><th style="width:9%">Vehicule</th><th style="width:10%">Plaque</th><th style="width:7%">Batterie</th><th style="width:8%">Paiement</th><th style="width:10%">Trade-In</th><th style="width:8%">OTG</th><th style="width:8%">Assurance</th>'
  + '</tr></thead><tbody id="tb"></tbody></table>'
  + '<div id="trec" style="padding:20px 16px;font-size:16px;color:#393c41;font-weight:600"></div></div>';

  // Data
  var DATA=[];

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
      US();TR();
    };
  });

  function US(){var tot=0,ok=0,al=0;document.querySelectorAll('#tb tr').forEach(function(r){if(r.style.display==='none')return;tot++;if(r.classList.contains('w'))al++;else ok++});document.getElementById('sT').textContent=tot;document.getElementById('sO').textContent=ok;document.getElementById('sA').textContent=al}
  function TR(){var v=0;document.querySelectorAll('#tb tr').forEach(function(r){if(r.style.display!=='none')v++});document.getElementById('trec').textContent='Total Records: '+v}

  // Stat clicks
  document.getElementById('sf-all').onclick=function(){SF('all')};
  document.getElementById('sf-ok').onclick=function(){SF('ok')};
  document.getElementById('sf-al').onclick=function(){SF('al')};
  function SF(t){var ah='';document.querySelectorAll('.pill').forEach(function(p){if(p.classList.contains('on'))ah=p.textContent});document.querySelectorAll('#tb tr').forEach(function(r){var hm=ah==='Tous'||!ah||(r.dataset.host||'').toLowerCase().indexOf(ah.toLowerCase())>=0;if(!hm){r.style.display='none';return}if(t==='all')r.style.display='';else if(t==='ok')r.style.display=r.classList.contains('w')?'none':'';else r.style.display=r.classList.contains('w')?'':'none'});TR()}

  // Search
  document.getElementById('srch').oninput=function(){var q=this.value.toLowerCase();document.querySelectorAll('#tb tr').forEach(function(r){r.style.display=r.textContent.toLowerCase().indexOf(q)>=0?'':'none'});TR()};

  // Select all
  document.getElementById('sa').onchange=function(e){document.querySelectorAll('.rc').forEach(function(c){if(c.closest('tr').style.display!=='none')c.checked=e.target.checked})};

  // Sort
  var sortDir={};
  window.S=function(k){sortDir[k]=!sortDir[k];DATA.sort(function(a,b){var v=sortDir[k]?1:-1;return((a[k]||'').toString().localeCompare((b[k]||'').toString()))*v});render()};

  // Load
  document.getElementById('ld').onclick=async function(){
    var lg=document.getElementById('lg'),tbl=document.getElementById('tbl'),tb=document.getElementById('tb');
    lg.style.display='';tbl.style.display='none';
    var ds=document.getElementById('dt').value;
    var droH={'Authorization':'Bearer '+droToken,'Content-Type':'application/json','userid':droUserId};

    try{
      // API 1: Intrepid â€” appointments + battery + OTG (same domain, works!)
      var intData=await fetch(INTREPID+'/getTssAppointmentsByDate?trtId='+CFG.trtId+'&date='+ds+'&searchQuery=',{credentials:'include'}).then(function(r){return r.json()});
      var intMap={};intData.forEach(function(d){intMap[d.referenceNumber]=d});

      // API 2: DRO Advisor Dashboard â€” client details
      var rns=intData.map(function(d){return d.referenceNumber});
      if(!rns.length){lg.innerHTML='<div style="text-align:center;padding:80px;color:#999">Aucune livraison.</div>';return}

      var adv=await fetch(BASE+'/advisor/Dashboard?isSidePanelFullScreen=true',{method:'POST',headers:droH,body:JSON.stringify({condition:'and',rules:[{condition:'and',ReferenceNumbers:rns,Countries:[]}],Skip:0,Take:200,SortOrder:[],SelectedColumns:[]})}).then(function(r){return r.json()});

      // API 3: Trade-In widget
      var tiC=adv.Data.Dashboard.filter(function(a){return a.TradeInActionStatus==='COMPLETE_TRADE_IN'});
      var tiR={};await Promise.all(tiC.map(function(a){return fetch(BASE+'/widget/GetTradeInWidgetInfo?referenceNumber='+a.ReferenceNumber+'&vehicleMapId='+a.VehicleMapId+'&deliveryState='+encodeURIComponent(a.DeliveryState||''),{headers:droH}).then(function(r){return r.json()}).then(function(j){if(j.Data)tiR[a.ReferenceNumber]={ms:j.Data.AcquisitionMilestone||''}}).catch(function(){})}));

      // Build merged data
      DATA=adv.Data.Dashboard.map(function(a){
        var int=intMap[a.ReferenceNumber]||{};
        var cog=int.cogInfo||{};
        var t='?';
        if(int.startDateTime){var sd=new Date(int.startDateTime);t=String(sd.getHours()).padStart(2,'0')+':'+String(sd.getMinutes()).padStart(2,'0')}
        var hp=!!(a.LicensePlate&&a.LicensePlate.trim()&&a.LicensePlate.indexOf('-')>=0);
        var io=a.InsuranceActionStatus==='COMPLETE';
        var otgName=cog.vehicleCogStatusName||a.VehicleStage||'';
        var otg=otgName==='Finished Goods'||otgName.indexOf('Arrived')>=0;
        var bat=cog.additionalAttributes?parseInt(cog.additionalAttributes.chargingLevel||'0'):null;
        var amtOk=a.AmountDueActionStatus==='Yes'||a.PaymentMethodActionStatus==='COMPLETE';
        var al=[];if(!hp)al.push('P');if(!otg)al.push('O');if(!amtOk)al.push('$');
        var r=tiR[a.ReferenceNumber];var tms=r?r.ms:'';if(tms.indexOf(' - ')>=0)tms=tms.split(' - ')[0];
        return{
          rn:a.ReferenceNumber,name:a.CustomerName,t:t,
          model:a.VehicleModel,color:tr(a.VehicleColor||''),
          plate:(a.LicensePlate||'').trim(),
          host:int.cogInfo?int.cogInfo.createdBy||'?':'?',
          b2b:a.IsEnterpriseOrder||int.isB2b,
          hp:hp,io:io,otg:otg,otgName:otgName,
          bat:bat,al:al,tims:tms,amtOk:amtOk,
          regSt:'En attente'
        };
      }).sort(function(a,b){return a.t.localeCompare(b.t)});

      render();
      lg.style.display='none';tbl.style.display='';
      document.getElementById('gn').style.display='';
      document.getElementById('sa').checked=true;
      US();TR();
    }catch(err){lg.innerHTML='<div style="text-align:center;padding:80px;color:#dc3545">Erreur: '+err.message+'</div>'}
  };

  function render(){
    var tb=document.getElementById('tb');
    var out='';
    for(var i=0;i<DATA.length;i++){
      var d=DATA[i];
      var batClass=d.bat>=80?'hi':d.bat>=50?'mid':'lo';
      out+='<tr class="'+(d.al.length?'w':'')+'" data-host="'+d.host+'">'
        +'<td><input type="checkbox" class="ck rc" data-i="'+i+'" '+(d.al.length===0?'checked':'')+'/></td>'
        +'<td><span class="tm">'+d.t+'</span></td>'
        +'<td><span class="nm">'+d.name+'</span></td>'
        +'<td><a href="https://dro.tesla.com/advisor?sidepanel_fullscreen=yes&rn='+d.rn+'" target="_blank" style="color:#3e6ae1;text-decoration:none;font-size:13px">'+d.rn+'</a></td>'
        +'<td>'+d.model+'</td>'
        +'<td>'+(d.hp?'<span class="pl">'+d.plate+'</span>':'<span style="color:#888;font-size:13px">'+d.regSt+'</span>')+'</td>'
        +'<td>'+(d.bat!==null?'<span class="bat '+batClass+'">'+d.bat+'%</span>':'â€”')+'</td>'
        +'<td>'+(d.amtOk?'<span class="dot dg"></span>OK':'<span class="dot dr"></span>Non')+'</td>'
        +'<td>'+(d.tims?'<span class="dot dg"></span>'+d.tims:'<span style="color:#ccc">Non</span>')+'</td>'
        +'<td>'+(d.otg?'<span class="dot dg"></span>Oui':'<span class="dot do"></span><span style="font-size:13px;color:#d97706">'+(d.otgName||'Non')+'</span>')+'</td>'
        +'<td>'+(d.io?'<span class="dot dg"></span>OK':'<span style="color:#999">Non</span>')+'</td>'
        +'</tr>';
    }
    tb.innerHTML=out;
  }

  // Generate
  document.getElementById('gn').onclick=function(){
    var checked=[];
    document.querySelectorAll('.rc:checked').forEach(function(c){var tr=c.closest('tr');if(tr&&tr.style.display!=='none'){var i=parseInt(c.dataset.i);if(DATA[i])checked.push(DATA[i])}});
    if(!checked.length){alert('Aucune livraison!');return}
    alert('Generation de '+checked.length+' pages de garde...');
  };
})();
