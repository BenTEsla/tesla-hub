// Tesla Delivery Hub v10 â€” New tab approach
(function(){
  // Get auth
  var tk=(localStorage.getItem('delops_id_token')||'').replace(/^"|"$/g,'');
  var t2=(localStorage.getItem('delops_id_token_data')||'').replace(/^"|"$/g,'');
  var ui=(localStorage.getItem('UserId')||'').replace(/^"|"$/g,'');
  var at=tk&&tk.length>100?tk:t2&&t2.length>100?t2:null;
  if(!at||!ui){alert('Token non trouve!');return}

  // Config
  var CES=['Ben Daubin','Sacha Villa','Sophie MACE'];
  var FR={'Pearl White':'Blanc perle','Diamond Black':'Noir Diamant','Stealth Grey':'Gris Stealth','Midnight Silver Metallic':'Gris Nuit','Red Multi-Coat':'Rouge','Ultra Red':'Rouge Ultra','Quicksilver':'Quicksilver','Glacier Blue':'Bleu Glacier','Frost Blue':'Bleu Givre','Midnight Cherry Red':'Rouge Cerise','Marine Blue':'Bleu Marine'};
  var now=new Date(),tmr=new Date(Date.now()+864e5);
  var fD=function(d){return d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})};
  var iD=function(d){return d.toISOString().split('T')[0]};

  var dates=[];for(var di=0;di<7;di++){var dd=new Date(Date.now()+di*864e5);var lbl=di===0?'Aujourd\'hui':di===1?'Demain':'J+'+di;dates.push('<option value="'+iD(dd)+'">'+lbl+' - '+fD(dd)+'</option>')}

  // Open new tab and write clean HTML
  var w=window.open('','_blank');
  if(!w){alert('Popup bloque!');return}

  w.document.open();
  w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Tesla Delivery Hub</title>'
  +'<style>'
  +'*{box-sizing:border-box;margin:0;padding:0}'
  +'body{font-family:Universal Sans Display,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#393c41;background:#fff;font-size:15px;line-height:1.5}'
  +'.hdr{height:56px;border-bottom:1px solid #e5e5e5;display:flex;align-items:center;padding:0 32px;justify-content:space-between;position:sticky;top:0;background:#fff;z-index:10}'
  +'.hdr .logo{font-size:18px;font-weight:600;letter-spacing:3px;color:#171a20}'
  +'.hdr .sep{margin:0 14px;color:#ccc}'
  +'.hdr .app{font-size:15px;color:#5c5e62}'
  +'.hdr .ri{margin-left:auto;font-size:14px;color:#5c5e62}'
  +'.ttl{padding:32px 32px 12px;font-size:36px;font-weight:700;color:#171a20}'
  +'.bar{padding:20px 32px;display:flex;align-items:center;gap:10px;flex-wrap:wrap}'
  +'.pill{padding:10px 24px;border-radius:6px;border:1px solid #d0d0d0;background:#fff;cursor:pointer;font-size:15px;color:#5c5e62;font-family:inherit}'
  +'.pill:hover{background:#f5f5f5}'
  +'.pill.on{background:#171a20;color:#fff;border-color:#171a20}'
  +'.s2{width:1px;height:28px;background:#e0e0e0;margin:0 10px;display:inline-block}'
  +'select{padding:10px 16px;border:1px solid #d0d0d0;border-radius:8px;font-size:15px;font-family:inherit;color:#333}'
  +'.btn{padding:10px 24px;border-radius:6px;border:none;font-size:15px;font-family:inherit;font-weight:500;cursor:pointer}'
  +'.bp{background:#f5f5f5;color:#393c41;border:1px solid #d0d0d0}.bp:hover,.bk:hover{background:#e8e8e8}'
  +'.bk{background:#f5f5f5;color:#393c41;border:1px solid #d0d0d0}'
  +'.sts{margin-left:auto;display:flex;gap:36px}'
  +'.sn{font-size:32px;font-weight:300;text-align:center;color:#171a20}'
  +'.sl{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#999;text-align:center}'
  +'.wrp{padding:8px 32px 40px}'
  +'table{width:100%;border-collapse:collapse}'
  +'th{padding:16px 20px;text-align:left;font-size:13px;color:#888;font-weight:500;border-bottom:2px solid #eee}'
  +'td{padding:20px 20px;font-size:15px;border-bottom:1px solid #f0f0f0;vertical-align:middle}'
  +'tr:hover td{background:#fafbff}'
  +'.ck{width:16px;height:16px;cursor:pointer;-webkit-appearance:none;appearance:none;border:1.5px solid #bbb;border-radius:2px;background:#fff;position:relative;vertical-align:middle}'
  +'.ck:checked{background:#5c5e62;border-color:#5c5e62}'
  +'.ck:checked::after{content:"";position:absolute;left:4px;top:1px;width:4px;height:8px;border:solid #fff;border-width:0 1.5px 1.5px 0;transform:rotate(45deg)}'
  +'.badge{display:inline-block;padding:5px 14px;border-radius:4px;font-size:13px;font-weight:600}'
  +'.badge.cash{background:#e6f4ea;color:#1e7e34}'
  +'.badge.leasing{background:#e3f2fd;color:#1565c0}'
  +'.badge.credit{background:#ede7f6;color:#6a1b9a}'
  +'.badge.lld{background:#fff8e1;color:#f57f17}'
  +'.badge.ent{background:#eceff1;color:#37474f}'
  +'.dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:7px}'
  +'.dg{background:#28a745}.dr{background:#dc3545}.do{background:#f0ad4e}'
  +'.nm{font-weight:600;color:#171a20;font-size:15px;white-space:nowrap}'
  +'.tm{font-size:17px;font-weight:500;color:#171a20}'
  +'.pl{font-family:SFMono-Regular,Consolas,monospace;font-weight:600;font-size:15px}'
  +'.rn{font-size:12px;color:#aaa;margin-top:3px}'
  +'.sub{font-size:13px;color:#888}'
  +'.ld{text-align:center;padding:100px;font-size:16px;color:#999}'
  +'.spin{display:inline-block;width:24px;height:24px;border:3px solid #eee;border-top-color:#3e6ae1;border-radius:50%;animation:s .7s linear infinite;margin-right:12px;vertical-align:middle}'
  +'@keyframes s{to{transform:rotate(360deg)}}'
  +'</style></head><body>'
  +'<div class="hdr"><div style="display:flex;align-items:center;gap:14px;flex-shrink:0"><span class="logo">TESLA</span><span class="sep">|</span><span class="app">Delivery Hub</span></div><div style="flex:1;display:flex;justify-content:center"><input type="text" id="srch" placeholder="Search by VIN, RN, LP or Name" style="width:100%;max-width:500px;padding:10px 16px;border:1px solid #d0d0d0;border-radius:8px;font-size:14px;font-family:inherit;color:#333;outline:none"></div><span class="ri">Ben Daubin</span></div>'
  +'<div class="ttl">Delivery Dashboard</div>'
  +'<div class="bar">'
  +'<button class="pill on" onclick="F(\'all\')">Tous</button>'
  +CES.map(function(c){return'<button class="pill" onclick="F(\''+c+'\')">'+c.split(' ')[0]+'</button>'}).join('')
  +'<span class="s2"></span>'
  +'<select id="dt">'+dates.join('')+'</select>'
  +'<button class="btn bp" onclick="L()">Charger</button>'
  +'<button class="btn bk" id="gn" style="display:none" onclick="G()">Generer PDFs</button>'
  +'<div class="sts"><div><div class="sn" id="sT">-</div><div class="sl">Livraisons</div></div>'
  +'<div><div class="sn" id="sO">-</div><div class="sl">Pretes</div></div>'
  +'<div><div class="sn" id="sA">-</div><div class="sl">Alertes</div></div></div>'
  +'</div>'
  +'<div class="wrp"><div class="ld" id="lg" style="display:none"><span class="spin"></span> Chargement...</div>'
  +'<table id="tbl" style="display:none"><thead><tr><th style="width:44px"><input type="checkbox" class="ck" id="sa" onchange="SA(this)"/></th>'
  +'<th style="cursor:pointer" onclick="S(\'t\')">Heure</th><th style="cursor:pointer" onclick="S(\'name\')">Client</th><th style="cursor:pointer" onclick="S(\'model\')">Vehicule</th><th style="cursor:pointer" onclick="S(\'plate\')">Plaque</th><th>Amount Due</th><th>Trade-In</th><th>OTG</th><th>Assurance</th>'
  +'</tr></thead><tbody id="tb"></tbody></table></div>'
  +'<script>'
  +'var AUTH={token:"Bearer '+at.replace(/"/g,'\\"')+'",userId:"'+ui+'"};'
  +'var BASE="https://mytdeliveryopsapi.tesla.com/api";'
  +'var CFG={trtId:28498,cc:"FR"};'
  +'var CES='+JSON.stringify(CES)+';'
  +'var FR='+JSON.stringify(FR)+';'
  +'var tr=function(s){return FR[s]||s};'
  +'var pT=function(t){return{CASH:"CASH",TESLA_LEASING:"LEASING",TESLA_LENDING:"CREDIT",THIRD_PARTY_LEASING:"LLD TIERS"}[t]||t};'
  +'var pC=function(t){return{CASH:"cash",TESLA_LEASING:"leasing",TESLA_LENDING:"credit",THIRD_PARTY_LEASING:"lld"}[t]||"ent"};'
  +'var DATA=[];'
  +'function F(f){document.querySelectorAll(".pill").forEach(function(p){p.classList.remove("on")});event.target.classList.add("on");document.querySelectorAll("#tb tr").forEach(function(r){if(f==="all"){r.style.display="";return}r.style.display=(r.dataset.host||"").toLowerCase().indexOf(f.split(" ")[0].toLowerCase())>=0?"":"none"})}'
  +'function SA(el){document.querySelectorAll(".rc").forEach(function(c){if(c.closest("tr").style.display!=="none")c.checked=el.checked})}'
  +'async function L(){'
  +'var lg=document.getElementById("lg"),tbl=document.getElementById("tbl"),tb=document.getElementById("tb");'
  +'lg.style.display="";tbl.style.display="none";lg.innerHTML=\'<span class="spin"></span> Chargement...\';'
  +'var h={"Authorization":AUTH.token,"Content-Type":"application/json","userid":AUTH.userId};'
  +'var ds=document.getElementById("dt").value;'
  +'try{'
  +'var dash=await fetch(BASE+"/deliveryops/Customers/Dashboard",{method:"POST",headers:h,body:JSON.stringify({fromDeliveryDate:ds,trtId:CFG.trtId,customerHasNoHost:false,skip:0,take:200,fromTime:"00:00",toTime:"23:59",countryCode:CFG.cc,onlyMyLocation:true,sort:{},stage:[],status:[],deliveryType:[],paperwork:[],customerDeliveryStatus:[],inboundStatus:[],VehicleTypes:[],pdcFilter:[],dmvDocumentStages:[]})}).then(function(r){return r.json()});'
  +'var dm={};dash.Data.forEach(function(d){dm[d.ReferenceNumber]=d});var rns=Object.keys(dm);'
  +'if(!rns.length){lg.innerHTML="Aucune livraison.";return}'
  +'var adv=await fetch(BASE+"/advisor/Dashboard?isSidePanelFullScreen=true",{method:"POST",headers:h,body:JSON.stringify({condition:"and",rules:[{condition:"and",ReferenceNumbers:rns,Countries:[]}],Skip:0,Take:200,SortOrder:[],SelectedColumns:[]})}).then(function(r){return r.json()});'
  +'var tiC=adv.Data.Dashboard.filter(function(a){return a.TradeInActionStatus==="COMPLETE_TRADE_IN"});'
  +'var tiR={};await Promise.all(tiC.map(function(a){return fetch(BASE+"/widget/GetTradeInWidgetInfo?referenceNumber="+a.ReferenceNumber+"&vehicleMapId="+a.VehicleMapId+"&deliveryState="+encodeURIComponent(a.DeliveryState||""),{headers:h}).then(function(r){return r.json()}).then(function(j){if(j.Data)tiR[a.ReferenceNumber]={ms:j.Data.AcquisitionMilestone||""}}).catch(function(){})}));'
  +'DATA=adv.Data.Dashboard.map(function(a){var d=dm[a.ReferenceNumber]||{};var dt=d.ScheduledDeliveryStartDateString||"";var t="?",m=dt.match(/(\\d{1,2}):(\\d{2})\\s*(AM|PM)/i);if(m){var hr=parseInt(m[1]);if(m[3].toUpperCase()==="PM"&&hr<12)hr+=12;if(m[3].toUpperCase()==="AM"&&hr===12)hr=0;t=String(hr).padStart(2,"0")+":"+m[2]}var hp=!!(a.LicensePlate&&a.LicensePlate.trim());var io=a.InsuranceActionStatus==="COMPLETE";var otg=a.VehicleStage==="Finished Goods"||a.VehicleStage==="Arrived at VRL"||(a.VehicleStage&&a.VehicleStage.indexOf("Arrived")>=0);var al=[];if(!hp)al.push("P");if(!otg)al.push("O");var r=tiR[a.ReferenceNumber];var tms=r?r.ms:"";if(tms.indexOf(" - ")>=0)tms=tms.split(" - ")[0];return{rn:a.ReferenceNumber,name:a.CustomerName,t:t,model:a.VehicleModel,color:tr(a.VehicleColor||""),plate:(a.LicensePlate||"").trim(),host:d.HostName||"?",b2b:a.IsEnterpriseOrder,hp:hp,io:io,otg:otg,vs:a.VehicleStage||"",al:al,tims:tms,amtOk:a.AmountDueActionStatus==="Yes"||a.PaymentMethodActionStatus==="COMPLETE"}}).sort(function(a,b){return a.t.localeCompare(b.t)});'
  +'var out="";for(var i=0;i<DATA.length;i++){var d=DATA[i];out+="<tr data-host=\\""+d.host+"\\"><td><input type=checkbox class=\\"ck rc\\" data-i="+i+" "+(d.al.length===0?"checked":"")+"></td><td><span class=tm>"+d.t+"</span></td><td><span class=nm>"+d.name+"</span><div class=rn><a href=\\"https://dro.tesla.com/advisor?sidepanel_fullscreen=yes&rn="+d.rn+"\\" target=_blank style=\\"color:#3e6ae1;text-decoration:none;font-size:13px\\">"+d.rn+"</a></div></td><td><strong>"+d.model+"</strong><br><span class=sub>"+d.color+"</span></td><td>"+(d.hp?"<span class=pl>"+d.plate+"</span>":"<span class=\\"dot dr\\"></span><span style=color:#dc3545>Manquante</span>")+"</td><td>"+(d.amtOk?"<span class=\\"dot dg\\"></span>OK":"<span class=\\"dot dr\\"></span>Non")+"</td><td>"+(d.tims?"<span class=\\"dot dg\\"></span>"+d.tims:"<span style=color:#ccc>Non</span>")+"</td><td>"+(d.otg?"<span class=\\"dot dg\\"></span>Oui":"<span class=\\"dot do\\"></span><span class=sub>"+(d.vs||"Non")+"</span>")+"</td><td>"+(d.io?"<span class=\\"dot dg\\"></span>OK":"<span style=color:#999>Non</span>")+"</td></tr>"}'
  +'tb.innerHTML=out;'
  +'var ok=DATA.filter(function(d){return d.al.length===0}).length;'
  +'document.getElementById("sT").textContent=DATA.length;'
  +'document.getElementById("sO").textContent=ok;'
  +'document.getElementById("sA").textContent=DATA.length-ok;'
  +'lg.style.display="none";tbl.style.display="";document.getElementById("gn").style.display="";'
  +'document.getElementById("sa").checked=true;'
  +'}catch(err){lg.innerHTML="Erreur: "+err.message}}'
  +'function G(){var c=[];document.querySelectorAll(".rc:checked").forEach(function(el){var tr=el.closest("tr");if(tr&&tr.style.display!=="none"){var i=parseInt(el.dataset.i);if(DATA[i])c.push(DATA[i])}});if(!c.length){alert("Aucune livraison!");return}alert("Generation de "+c.length+" pages de garde...")}'
  +'var sortDir={};function S(k){sortDir[k]=!sortDir[k];DATA.sort(function(a,b){var v=sortDir[k]?1:-1;return(a[k]||"").toString().localeCompare((b[k]||"").toString())*v});R()}'
  +'function R(){var tb=document.getElementById("tb");var out="";for(var i=0;i<DATA.length;i++){var d=DATA[i];out+="<tr data-host=\\""+d.host+"\\"><td><input type=checkbox class=\\"ck rc\\" data-i="+i+" "+(d.al.length===0?"checked":"")+"></td><td><span class=tm>"+d.t+"</span></td><td><span class=nm>"+d.name+"</span><div class=rn><a href=\\"https://dro.tesla.com/advisor?sidepanel_fullscreen=yes&rn="+d.rn+"\\" target=_blank style=\\"color:#3e6ae1;text-decoration:none;font-size:13px\\">"+d.rn+"</a></div></td><td><strong>"+d.model+"</strong><br><span class=sub>"+d.color+"</span></td><td>"+(d.hp?"<span class=pl>"+d.plate+"</span>":"<span class=\\"dot dr\\"></span><span style=color:#dc3545>Manquante</span>")+"</td><td>"+(d.amtOk?"<span class=\\"dot dg\\"></span>OK":"<span class=\\"dot dr\\"></span>Non")+"</td><td>"+(d.tims?"<span class=\\"dot dg\\"></span>"+d.tims:"<span style=color:#ccc>Non</span>")+"</td><td>"+(d.otg?"<span class=\\"dot dg\\"></span>Oui":"<span class=\\"dot do\\"></span><span class=sub>"+(d.vs||"Non")+"</span>")+"</td><td>"+(d.io?"<span class=\\"dot dg\\"></span>OK":"<span style=color:#999>Non</span>")+"</td></tr>"}tb.innerHTML=out}'
  +'document.getElementById("srch").oninput=function(){var q=this.value.toLowerCase();document.querySelectorAll("#tb tr").forEach(function(r){r.style.display=r.textContent.toLowerCase().indexOf(q)>=0?"":"none"})}'
  +'</scr'+'ipt></body></html>');
  w.document.close();
})();
