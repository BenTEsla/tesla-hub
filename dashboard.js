// Tesla Delivery Hub v14.14 â€” v14 stable + Intrepid visual polish
(function(){
  var tk=(localStorage.getItem('delops_id_token')||'').replace(/^"|"$/g,'');
  var t2=(localStorage.getItem('delops_id_token_data')||'').replace(/^"|"$/g,'');
  var ui=(localStorage.getItem('UserId')||'').replace(/^"|"$/g,'');
  var at=tk&&tk.length>100?tk:t2&&t2.length>100?t2:null;
  if(!at||!ui){alert('Token non trouve!');return}

  var CES=['Ben Daubin','Sacha Villa','Sophie MACE'];
  var FR={'Pearl White':'Blanc perle','Diamond Black':'Noir Diamant','Stealth Grey':'Gris Stealth','Midnight Silver Metallic':'Gris Nuit','Red Multi-Coat':'Rouge','Ultra Red':'Rouge Ultra','Quicksilver':'Quicksilver','Glacier Blue':'Bleu Glacier','Frost Blue':'Bleu Givre','Midnight Cherry Red':'Rouge Cerise','Marine Blue':'Bleu Marine'};
  var now=new Date(),tmr=new Date(Date.now()+864e5);
  var fD=function(d){return d.toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})};
  var iD=function(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};

  var dates=[];for(var di=0;di<10&&dates.length<7;di++){var dd=new Date(Date.now()+di*864e5);if(dd.getDay()===0)continue;var lbl=di===0?'Aujourd\'hui':di===1?'Demain':'J+'+di;dates.push('<option value="'+iD(dd)+'">'+lbl+' - '+fD(dd)+'</option>')}

  var w=window.open('','_blank');
  if(!w){alert('Popup bloque!');return}

  w.document.open();
  w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Tesla Delivery Hub</title>'
  +'<style>'
  +'*{box-sizing:border-box;margin:0;padding:0}'
  +'@font-face{font-family:UST;font-weight:400;font-display:swap;src:url(https://digitalassets.tesla.com/tesla-design-system/raw/upload/static/fonts/universal-sans-2/web/text/Universal-Sans-Text-Regular.woff2) format(woff2)}'
  +'@font-face{font-family:UST;font-weight:500;font-display:swap;src:url(https://digitalassets.tesla.com/tesla-design-system/raw/upload/static/fonts/universal-sans-2/web/text/Universal-Sans-Text-Medium.woff2) format(woff2)}'
  +'@font-face{font-family:UST;font-weight:700;font-display:swap;src:url(https://digitalassets.tesla.com/tesla-design-system/raw/upload/static/fonts/universal-sans-2/web/text/Universal-Sans-Text-Bold.woff2) format(woff2)}'
  +'@font-face{font-family:USD;font-weight:500;font-display:swap;src:url(https://digitalassets.tesla.com/tesla-design-system/raw/upload/static/fonts/universal-sans-2/web/display/Universal-Sans-Display-Medium.woff2) format(woff2)}'
  +'body{font-family:UST,-apple-system,BlinkMacSystemFont,sans-serif;color:#393c41;background:#fff;font-size:14px;line-height:1.5}'

  // Header
  +'.hdr{height:52px;border-bottom:1px solid #e5e5e5;display:flex;align-items:center;padding:0 16px;justify-content:space-between}'
  +'.topfix{position:sticky;top:0;background:#fff;z-index:10;border-bottom:1px solid #e5e5e5}'
  +'.hdr .sep{margin:0 14px;color:#ccc}'
  +'.hdr .app{font-size:15px;color:#5c5e62}'
  +'.hdr .ri{margin-left:auto;font-size:14px;color:#5c5e62}'

  // Stats bar (Intrepid rounded box)
  +'.sbar{display:flex;align-items:stretch;margin:16px 24px 0;border:1px solid #e0e0e0;border-radius:12px;background:#fff;overflow:hidden}'
  +'.sitem{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 20px;cursor:pointer;border-right:1px solid #e0e0e0;transition:background .15s;min-width:80px;flex:1}'
  +'.sitem:last-child{border-right:none}'
  +'.sitem:hover{background:#f5f5f5}'
  +'.sitem.on{background:#f8f9ff}'
  +'.snum{font-size:22px;font-weight:700;color:#3e6ae1;line-height:1.2}'
  +'.snum.green{color:#28a745}'
  +'.snum.red{color:#dc3545}'
  +'.snum.z{color:#bbb}'
  +'.snum.brown{color:#8d6e27}'
  +'.slbl{font-size:10px;color:#666;white-space:nowrap;margin-top:3px;text-align:center}'

  // Toolbar
  +'.bar{padding:10px 16px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}'
  +'.pill{padding:5px 14px;border-radius:20px;border:1px solid #d0d0d0;background:#fff;cursor:pointer;font-size:12px;color:#666;font-family:inherit;font-weight:500}'
  +'.pill:hover{background:#f0f0f0}'
  +'.pill.on{background:#171a20;color:#fff;border-color:#171a20}'
  +'.s2{width:1px;height:24px;background:#e0e0e0;margin:0 6px;display:inline-block}'
  +'select{padding:6px 10px;border:1px solid #d0d0d0;border-radius:4px;font-size:13px;font-family:inherit;color:#333}'
  +'.btn{padding:6px 14px;border-radius:4px;border:1px solid #d0d0d0;font-size:13px;font-family:inherit;font-weight:500;cursor:pointer;background:#f5f5f5;color:#393c41}'
  +'.btn:hover{background:#e8e8e8}'
  +'.btn.blue{background:#3e6ae1;color:#fff;border:none}'
  +'.btn.blue:hover{background:#2d5bd0}'
  +'.btn.dark{background:#171a20;color:#fff;border:none}'
  +'.btn.dark:hover{background:#2c2f36}'

  // Table
  +'.wrp{padding:0 16px 24px}'
  +'table{width:100%;border-collapse:collapse}'
  +'thead{position:sticky;top:0;z-index:5}'
  +'th{padding:8px 10px;text-align:left;font-size:11px;color:#888;font-weight:600;text-transform:uppercase;letter-spacing:.3px;border-bottom:2px solid #e0e0e0;background:#fafafa;cursor:pointer;user-select:none;white-space:nowrap}'
  +'th:hover{color:#171a20;background:#f0f0f0}'
  +'td{padding:7px 10px;font-size:13px;border-bottom:1px solid #f0f0f0;vertical-align:middle;color:#393c41;height:44px}'
  +'tr:hover td{background:#f8f9ff}'
  +'tr.w td{background:#fff5f5}'
  +'tr.w:hover td{background:#ffeded}'

  // Filter inputs in headers
  +'.fi{width:100%;padding:3px 5px;margin-top:3px;border:1px solid #ddd;border-radius:3px;font-size:10px;font-family:inherit;color:#333;background:#fff;outline:none;box-sizing:border-box;font-weight:400;text-transform:none;letter-spacing:0}'
  +'.fi:focus{border-color:#3e6ae1;box-shadow:0 0 0 2px rgba(62,106,225,.12)}'

  // Elements
  +'.ck{width:15px;height:15px;cursor:pointer;-webkit-appearance:none;appearance:none;border:1.5px solid #ccc;border-radius:3px;background:#fff;position:relative;vertical-align:middle}'
  +'.ck:checked{background:#3e6ae1;border-color:#3e6ae1}'
  +'.ck:checked::after{content:"";position:absolute;left:4px;top:1px;width:4px;height:8px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg)}'
  +'.dot{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px}'
  +'.dg{background:#28a745}.dr{background:#dc3545}.do{background:#f0ad4e}'
  +'.nm{font-weight:600;color:#171a20;font-size:13px;white-space:nowrap}'
  +'.tm{font-size:14px;font-weight:600;color:#171a20}'
  +'.pl{font-family:SFMono-Regular,Consolas,monospace;font-weight:600;font-size:13px}'
  +'.sub{font-size:12px;color:#999}'
  +'.ld{text-align:center;padding:100px;font-size:16px;color:#999}'
  +'.ldbar{width:200px;height:3px;background:#eee;border-radius:2px;margin:20px auto;overflow:hidden}'
  +'.ldbar::after{content:"";display:block;width:60px;height:3px;background:#3e6ae1;border-radius:2px;animation:ldb 1s ease-in-out infinite}'
  +'@keyframes ldb{0%{transform:translateX(-60px)}100%{transform:translateX(200px)}}'
  +'</style></head><body>'

  // === HEADER ===
  +'<div class="topfix">'
  +'<div class="hdr"><div style="display:flex;align-items:center;gap:14px;flex-shrink:0"><svg width="32" height="32" viewBox="0 0 160 160" fill="#171a20"><path d="m80 129.8 14-78.7c13.3 0 17.5 1.5 18.1 7.4 0 0 8.9-3.3 13.5-10.1-17.6-8.1-35.3-8.5-35.3-8.5L80 52.5 69.7 39.9s-17.7.4-35.3 8.5c4.5 6.8 13.5 10.1 13.5 10.1.6-6 4.8-7.4 18.1-7.4z"/><path d="M80 36.3c14.2-.1 30.5 2.2 47.2 9.5 2.2-4 2.8-5.8 2.8-5.8-18.2-7.3-35.3-9.7-50-9.8-14.7.1-31.8 2.5-50 9.8 0 0 .8 2.2 2.8 5.8 16.7-7.3 33-9.6 47.2-9.5"/></svg><span class="sep">|</span><span class="app">Delivery Hub</span></div><div style="flex:1;display:flex;justify-content:center"><input type="text" id="srch" placeholder="Search by VIN, RN, LP or Name" style="width:100%;max-width:400px;padding:8px 14px;border:1px solid #d0d0d0;border-radius:6px;font-size:13px;font-family:inherit;color:#333;outline:none"></div><span class="ri">Ben Daubin</span></div>'

  // === STATS BAR (Intrepid rounded box) ===
  +'<div class="sbar">'
  +'<div class="sitem on" onclick="SF(\'all\',this)"><div class="snum" id="sT">-</div><div class="slbl">Delivery<br>Today</div></div>'
  +'<div class="sitem" onclick="SF(\'ok\',this)"><div class="snum green" id="sO">-</div><div class="slbl">Pretes</div></div>'
  +'<div class="sitem" onclick="SF(\'al\',this)"><div class="snum red" id="sA">-</div><div class="slbl">Alertes</div></div>'
  +'<div class="sitem"><div class="snum z" id="sP">0</div><div class="slbl">Paiement<br>OK</div></div>'
  +'<div class="sitem"><div class="snum z" id="sOTG">0</div><div class="slbl">OTG</div></div>'
  +'<div class="sitem"><div class="snum z" id="sPl">0</div><div class="slbl">Plaques<br>OK</div></div>'
  +'<div class="sitem"><div class="snum brown z" id="sTI">0</div><div class="slbl">Trade-In</div></div>'
  +'<div class="sitem"><div class="snum z" id="sAs">0</div><div class="slbl">Assurance<br>OK</div></div>'
  +'</div>'

  // === TOOLBAR ===
  +'<div class="bar">'
  +'<button class="pill on" onclick="F(\'all\')">Tous</button>'
  +CES.map(function(c){return'<button class="pill" onclick="F(\''+c+'\')">'+c.split(' ')[0]+'</button>'}).join('')
  +'<span class="s2"></span>'
  +'<select id="dt">'+dates.join('')+'</select>'
  +'<button class="btn blue" onclick="L()">Charger</button>'
  +'<div style="flex:1"></div>'
  +'<button class="btn" id="gn" style="display:none" onclick="G()">Generer PDFs</button>'
  +'<button class="btn dark" id="disp" style="display:none" onclick="DISPATCH()">Dispatcher</button>'
  +'</div>'
  +'</div>'

  // === TABLE ===
  +'<div class="wrp"><div class="ld" id="lg" style="display:none"><div class="ldbar"></div><div style="font-size:13px;color:#999;margin-top:16px">Chargement...</div></div>'
  +'<table id="tbl" style="display:none"><thead><tr>'
  +'<th style="width:36px"><input type="checkbox" class="ck" id="sa" onchange="SA(this)"/></th>'
  +'<th style="width:60px" onclick="S(\'t\')">Heure<br><input class="fi" placeholder="..." oninput="CF();event.stopPropagation()" onclick="event.stopPropagation()"></th>'
  +'<th style="width:18%" onclick="S(\'name\')">Client<br><input class="fi" placeholder="..." oninput="CF();event.stopPropagation()" onclick="event.stopPropagation()"></th>'
  +'<th style="width:10%">RN<br><input class="fi" placeholder="..." oninput="CF();event.stopPropagation()" onclick="event.stopPropagation()"></th>'
  +'<th style="width:8%" onclick="S(\'model\')">Vehicule<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="Model 3">M3</option><option value="Model Y">MY</option></select></th>'
  +'<th style="width:10%" onclick="S(\'plate\')">Plaque<br><input class="fi" placeholder="..." oninput="CF();event.stopPropagation()" onclick="event.stopPropagation()"></th>'
  +'<th style="width:8%">Paiement<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="OK">OK</option><option value="Non">Non</option></select></th>'
  +'<th style="width:9%">Trade-In<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="Accepted">Oui</option><option value="Non">Non</option></select></th>'
  +'<th style="width:8%">OTG<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="Oui">Oui</option><option value="Non">Non</option></select></th>'
  +'<th style="width:8%">Assurance<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="OK">OK</option><option value="Non">Non</option></select></th>'
  +'</tr></thead><tbody id="tb"></tbody></table>'
  +'<div id="trec" style="padding:10px 12px;font-size:12px;color:#999;font-weight:500"></div></div>'

  +'<script>'
  +'var AUTH={token:"Bearer '+at.replace(/"/g,'\\"')+'",userId:"'+ui+'"};'
  +'var BASE="https://mytdeliveryopsapi.tesla.com/api";'
  +'var CFG={trtId:28498,cc:"FR"};'
  +'var CES='+JSON.stringify(CES)+';'
  +'var FR='+JSON.stringify(FR)+';'
  +'var tr=function(s){return FR[s]||s};'
  +'var DATA=[];'

  // F - CES pill filter
  +'function F(f){document.querySelectorAll(".pill").forEach(function(p){p.classList.remove("on")});event.target.classList.add("on");document.querySelectorAll("#tb tr").forEach(function(r){if(f==="all"){r.style.display="";return}r.style.display=(r.dataset.host||"").toLowerCase().indexOf(f.split(" ")[0].toLowerCase())>=0?"":"none"});US();TR()}'

  // SA - select all
  +'function SA(el){document.querySelectorAll(".rc").forEach(function(c){if(c.closest("tr").style.display!=="none")c.checked=el.checked})}'

  // L - Load data
  +'async function L(){'
  +'var lg=document.getElementById("lg"),tbl=document.getElementById("tbl"),tb=document.getElementById("tb");'
  +'lg.style.display="";tbl.style.display="none";'
  +'var h={"Authorization":AUTH.token,"Content-Type":"application/json","userid":AUTH.userId};'
  +'var ds=document.getElementById("dt").value;'
  +'try{'
  +'var dash=await fetch(BASE+"/deliveryops/Customers/Dashboard",{method:"POST",headers:h,body:JSON.stringify({fromDeliveryDate:ds,trtId:CFG.trtId,customerHasNoHost:false,skip:0,take:200,fromTime:"00:00",toTime:"23:59",countryCode:CFG.cc,onlyMyLocation:true,sort:{},stage:[],status:[],deliveryType:[],paperwork:[],customerDeliveryStatus:[],inboundStatus:[],VehicleTypes:[],pdcFilter:[],dmvDocumentStages:[]})}).then(function(r){return r.json()});'
  +'var dm={};dash.Data.forEach(function(d){dm[d.ReferenceNumber]=d});var rns=Object.keys(dm);'
  +'if(!rns.length){lg.innerHTML="<div style=padding:60px;text-align:center;color:#999>Aucune livraison.</div>";return}'
  +'var adv=await fetch(BASE+"/advisor/Dashboard?isSidePanelFullScreen=true",{method:"POST",headers:h,body:JSON.stringify({condition:"and",rules:[{condition:"and",ReferenceNumbers:rns,Countries:[]}],Skip:0,Take:200,SortOrder:[],SelectedColumns:[]})}).then(function(r){return r.json()});'
  +'var tiC=adv.Data.Dashboard.filter(function(a){return a.TradeInActionStatus==="COMPLETE_TRADE_IN"});'
  +'var tiR={};await Promise.all(tiC.map(function(a){return fetch(BASE+"/widget/GetTradeInWidgetInfo?referenceNumber="+a.ReferenceNumber+"&vehicleMapId="+a.VehicleMapId+"&deliveryState="+encodeURIComponent(a.DeliveryState||""),{headers:h}).then(function(r){return r.json()}).then(function(j){if(j.Data)tiR[a.ReferenceNumber]={ms:j.Data.AcquisitionMilestone||""}}).catch(function(){})}));'
  +'DATA=adv.Data.Dashboard.map(function(a){var d=dm[a.ReferenceNumber]||{};var dt=d.ScheduledDeliveryStartDateString||"";var t="?",m=dt.match(/(\\d{1,2}):(\\d{2})\\s*(AM|PM)/i);if(m){var hr=parseInt(m[1]);if(m[3].toUpperCase()==="PM"&&hr<12)hr+=12;if(m[3].toUpperCase()==="AM"&&hr===12)hr=0;t=String(hr).padStart(2,"0")+":"+m[2]}var hp=!!(a.LicensePlate&&a.LicensePlate.trim()&&a.LicensePlate.indexOf("-")>=0);var io=a.InsuranceActionStatus==="COMPLETE";var otg=a.VehicleStage==="Finished Goods"||a.VehicleStage==="Arrived at VRL"||(a.VehicleStage&&a.VehicleStage.indexOf("Arrived")>=0);var amtOk=a.AmountDueActionStatus==="Yes"||a.PaymentMethodActionStatus==="COMPLETE";var al=[];if(!hp)al.push("P");if(!otg)al.push("O");if(!amtOk)al.push("$");var r=tiR[a.ReferenceNumber];var tms=r?r.ms:"";if(tms.indexOf(" - ")>=0)tms=tms.split(" - ")[0];var clientName=a.CustomerName;var di=a.DriverInfo;if(a.IsEnterpriseOrder&&di&&di.first_name)clientName=di.first_name+" "+di.last_name+" ("+a.CustomerName+")";return{rn:a.ReferenceNumber,name:clientName,t:t,model:a.VehicleModel,color:tr(a.VehicleColor||""),plate:(a.LicensePlate||"").trim(),host:d.HostName||"?",b2b:a.IsEnterpriseOrder,hp:hp,io:io,otg:otg,vs:a.VehicleStage||"",al:al,tims:tms,amtOk:amtOk}}).sort(function(a,b){return a.t.localeCompare(b.t)});'
  +'RW();'
  +'var ok=DATA.filter(function(d){return d.al.length===0}).length;'
  +'var pOk=DATA.filter(function(d){return d.amtOk}).length;'
  +'var oOk=DATA.filter(function(d){return d.otg}).length;'
  +'var plOk=DATA.filter(function(d){return d.hp}).length;'
  +'var tiOk=DATA.filter(function(d){return d.tims}).length;'
  +'var asOk=DATA.filter(function(d){return d.io}).length;'
  +'document.getElementById("sT").textContent=DATA.length;'
  +'document.getElementById("sO").textContent=ok;document.getElementById("sO").className="snum green";'
  +'document.getElementById("sA").textContent=DATA.length-ok;document.getElementById("sA").className="snum"+((DATA.length-ok)>0?" red":" z");'
  +'document.getElementById("sP").textContent=pOk;document.getElementById("sP").className="snum"+(pOk===0?" z":"");'
  +'document.getElementById("sOTG").textContent=oOk;document.getElementById("sOTG").className="snum"+(oOk===0?" z":"");'
  +'document.getElementById("sPl").textContent=plOk;document.getElementById("sPl").className="snum"+(plOk===0?" z":"");'
  +'document.getElementById("sTI").textContent=tiOk;document.getElementById("sTI").className="snum brown"+(tiOk===0?" z":"");'
  +'document.getElementById("sAs").textContent=asOk;document.getElementById("sAs").className="snum"+(asOk===0?" z":"");'
  +'lg.style.display="none";tbl.style.display="";document.getElementById("gn").style.display="";document.getElementById("disp").style.display="";TR();'
  +'document.getElementById("sa").checked=true;'
  +'}catch(err){lg.innerHTML="<div style=padding:60px;text-align:center;color:#c00>Erreur: "+err.message+"</div>"}}'

  // RW - render rows
  +'function RW(){var tb=document.getElementById("tb");var out="";for(var i=0;i<DATA.length;i++){var d=DATA[i];out+="<tr class=\\""+(d.al.length?"w":"")+"\\" data-host=\\""+d.host+"\\"><td><input type=checkbox class=\\"ck rc\\" data-i="+i+" "+(d.al.length===0?"checked":"")+"></td><td><span class=tm>"+d.t+"</span></td><td><span class=nm>"+d.name+"</span></td><td><a href=\\"https://dro.tesla.com/advisor?sidepanel_fullscreen=yes&rn="+d.rn+"\\" target=_blank style=\\"color:#3e6ae1;text-decoration:none;font-size:12px\\">"+d.rn+"</a></td><td style=font-size:12px>"+d.model+"</td><td>"+(d.hp?"<span class=pl>"+d.plate+"</span>":"<span class=sub>En attente</span>")+"</td><td>"+(d.amtOk?"<span class=\\"dot dg\\"></span>OK":"<span class=\\"dot dr\\"></span>Non")+"</td><td>"+(d.tims?"<span class=\\"dot dg\\"></span>"+d.tims:"<span style=color:#ccc>Non</span>")+"</td><td>"+(d.otg?"<span class=\\"dot dg\\"></span>Oui":"<span class=\\"dot do\\"></span><span class=sub>"+(d.vs||"Non")+"</span>")+"</td><td>"+(d.io?"<span class=\\"dot dg\\"></span>OK":"<span style=color:#ccc>Non</span>")+"</td></tr>"}tb.innerHTML=out}'

  // G - Generate PDFs
  +'function G(){var c=[];document.querySelectorAll(".rc:checked").forEach(function(el){var tr=el.closest("tr");if(tr&&tr.style.display!=="none"){var i=parseInt(el.dataset.i);if(DATA[i])c.push(DATA[i])}});if(!c.length){alert("Aucune livraison!");return}alert("Generation de "+c.length+" pages de garde...")}'

  // DISPATCH
  +'async function DISPATCH(){var hosts=[{name:"Ben Daubin",id:"428058"},{name:"Sacha Villa",id:"399921"},{name:"Sophie MACE",id:"444287"}];var items=DATA;if(!items.length){alert("Aucune livraison!");return}var conf=confirm("Dispatcher "+items.length+" livraisons entre "+hosts.map(function(h){return h.name}).join(", ")+"?");if(!conf)return;var btn=document.getElementById("disp");btn.textContent="Dispatch...";btn.disabled=true;var ok=0,fail=0;for(var i=0;i<items.length;i++){var d=items[i];var host=hosts[i%hosts.length];try{var r=await fetch(BASE+"/deliveryops/Customers/UpdateHost?referenceNumber="+d.rn+"&value="+host.id,{method:"POST",headers:{"Authorization":AUTH.token,"Content-Type":"application/json","userid":AUTH.userId}});if(r.ok)ok++;else fail++}catch(e){fail++}}btn.textContent="Dispatcher";btn.disabled=false;alert("Dispatch termine!\\n"+ok+" OK / "+fail+" erreurs")}'

  // S - Sort
  +'var sortDir={};function S(k){sortDir[k]=!sortDir[k];DATA.sort(function(a,b){var v=sortDir[k]?1:-1;return(a[k]||"").toString().localeCompare((b[k]||"").toString())*v});RW()}'

  // Search
  +'document.getElementById("srch").oninput=function(){var q=this.value.toLowerCase();document.querySelectorAll("#tb tr").forEach(function(r){r.style.display=r.textContent.toLowerCase().indexOf(q)>=0?"":"none"});TR()};'

  // SF - Stats filter
  +'function SF(t,el){document.querySelectorAll(".sitem").forEach(function(s){s.classList.remove("on")});el.classList.add("on");document.querySelectorAll("#tb tr").forEach(function(r){if(t==="all"){r.style.display=""}else if(t==="ok"){r.style.display=r.classList.contains("w")?"none":""}else{r.style.display=r.classList.contains("w")?"":"none"}});TR()}'

  // CF - Column filter
  +'function CF(){var fils=document.querySelectorAll(".fi");document.querySelectorAll("#tb tr").forEach(function(r){var cells=r.querySelectorAll("td");var show=true;fils.forEach(function(f,i){var v=f.value.toLowerCase();if(!v)return;var cell=cells[i+1];if(!cell)return;var txt=cell.textContent.toLowerCase();if(txt.indexOf(v)<0)show=false});r.style.display=show?"":"none"});TR()}'

  // TR - Total records / US - Update stats
  +'function TR(){var v=0;document.querySelectorAll("#tb tr").forEach(function(r){if(r.style.display!=="none")v++});document.getElementById("trec").textContent="Total Records: "+v}'
  +'function US(){var tot=0,ok=0,al=0;document.querySelectorAll("#tb tr").forEach(function(r){if(r.style.display==="none")return;tot++;if(r.classList.contains("w"))al++;else ok++});document.getElementById("sT").textContent=tot;document.getElementById("sO").textContent=ok;document.getElementById("sA").textContent=al}'

  +'</scr'+'ipt></body></html>');
  w.document.close();
})();
