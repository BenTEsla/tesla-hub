// Tesla Delivery Hub v16.1 â€” Intrepid pixel-perfect
(function(){
  var tk=(localStorage.getItem('delops_id_token')||'').replace(/^"|"$/g,'');
  var t2=(localStorage.getItem('delops_id_token_data')||'').replace(/^"|"$/g,'');
  var ui=(localStorage.getItem('UserId')||'').replace(/^"|"$/g,'');
  var at=tk&&tk.length>100?tk:t2&&t2.length>100?t2:null;
  if(!at||!ui){alert('Token non trouve!');return}

  var CES=['Ben Daubin','Sacha Villa','Sophie MACE'];
  var FR={'Pearl White':'Blanc perle','Diamond Black':'Noir Diamant','Stealth Grey':'Gris Stealth','Midnight Silver Metallic':'Gris Nuit','Red Multi-Coat':'Rouge','Ultra Red':'Rouge Ultra','Quicksilver':'Quicksilver','Glacier Blue':'Bleu Glacier','Frost Blue':'Bleu Givre','Midnight Cherry Red':'Rouge Cerise','Marine Blue':'Bleu Marine'};
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
  +'body{font-family:UST,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#171a20;background:#fff;font-size:13px;line-height:1.4}'

  // HEADER â€” compact like Intrepid
  +'.hd{height:44px;background:#fff;border-bottom:1px solid #ddd;display:flex;align-items:center;padding:0 20px;font-size:13px}'
  +'.hd-logo{display:flex;align-items:center;gap:10px;color:#393c41}'
  +'.hd-logo svg{width:20px;height:20px}'
  +'.hd-site{font-weight:500;color:#171a20;font-size:13px}'
  +'.hd-r{margin-left:auto;display:flex;align-items:center;gap:14px}'
  +'.hd-search{padding:6px 12px;border:1px solid #ddd;border-radius:4px;font-size:12px;width:240px;font-family:inherit;color:#333;outline:none}'
  +'.hd-search:focus{border-color:#3e6ae1}'
  +'.hd-user{font-size:12px;color:#888}'

  // TITLE
  +'.ttl{font-size:24px;font-weight:700;color:#171a20;padding:20px 24px 14px}'

  // STATS BOXES â€” 2 blocs carrÃ©s avec ombre + sÃ©parateur visible
  +'.srow{display:flex;align-items:stretch;margin:0 24px 16px;border:1px solid #e0e0e0;box-shadow:0 2px 8px rgba(0,0,0,.08);overflow:hidden}'
  +'.sb{display:flex}'
  +'.ssep{width:3px;background:#e0e0e0;align-self:stretch;margin:8px 0}'
  +'.si{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:12px 20px;border-right:1px solid #f0f0f0;cursor:pointer;transition:background .1s;min-width:70px}'
  +'.si:last-child{border-right:none}'
  +'.si:hover{background:#f8f8f8}'
  +'.si.on{background:#f0f4ff}'
  +'.sn{font-size:20px;font-weight:700;line-height:1.2}'
  +'.sn.b{color:#3e6ae1}.sn.g{color:#28a745}.sn.r{color:#dc3545}.sn.x{color:#bbb}.sn.k{color:#171a20}'
  +'.sl{font-size:9px;color:#888;margin-top:3px;text-align:center;line-height:1.2}'

  // FILTERS + ACTIONS
  +'.fb{padding:0 24px 10px;display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap}'
  +'.fg{display:flex;flex-direction:column;gap:2px}'
  +'.fl{font-size:10px;color:#aaa;font-weight:500}'
  +'.fi2{padding:6px 10px;border:1px solid #ddd;border-radius:4px;font-size:12px;font-family:inherit;color:#333;outline:none}'
  +'.fi2:focus{border-color:#3e6ae1}'
  +'.bt{padding:6px 16px;border-radius:4px;font-size:12px;font-family:inherit;font-weight:600;cursor:pointer;border:none}'
  +'.bt-p{background:#e8523a;color:#fff}.bt-p:hover{background:#d44430}'
  +'.bt-s{background:#fff;color:#393c41;border:1px solid #ddd}.bt-s:hover{background:#f5f5f5}'
  +'.bt-d{background:#171a20;color:#fff}.bt-d:hover{background:#333}'
  +'.bt-q{background:#fff;color:#393c41;border:1px solid #ddd;padding:6px 10px;font-size:11px;border-radius:4px;cursor:pointer;font-family:inherit;font-weight:500}'
  +'.bt-q:hover{background:#f0f0f0}'
  +'.bt-q.on{background:#171a20;color:#fff;border-color:#171a20}'
  +'.bt-nav{background:#fff;color:#393c41;border:1px solid #ddd;padding:6px 8px;font-size:14px;border-radius:4px;cursor:pointer;font-family:inherit;line-height:1}'
  +'.bt-nav:hover{background:#f0f0f0}'

  // PILLS
  +'.pb{padding:0 24px 12px;display:flex;gap:6px}'
  +'.pi{padding:4px 12px;border-radius:16px;border:1px solid #d0d0d0;background:#fff;cursor:pointer;font-size:11px;color:#666;font-family:inherit;font-weight:500}'
  +'.pi:hover{background:#f0f0f0}'
  +'.pi.on{background:#171a20;color:#fff;border-color:#171a20}'

  // TABLE â€” Intrepid compact
  +'.tw{padding:0 24px 16px}'
  +'table{width:100%;border-collapse:collapse;table-layout:fixed}'
  +'th{padding:6px 8px;text-align:left;font-size:11px;color:#393c41;font-weight:600;border-bottom:1px solid #ddd;background:#fff;cursor:pointer;user-select:none;white-space:nowrap;overflow:hidden;position:sticky;top:0;z-index:5}'
  +'th:hover{color:#000}'
  +'td{padding:6px 8px;font-size:12px;border-bottom:1px solid #f2f2f2;vertical-align:middle;color:#393c41;height:40px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
  +'tr:hover td{background:#f8f8ff}'
  +'tr.w td{background:#fff8f8}'
  +'tr.w:hover td{background:#fff0f0}'

  // COLUMN FILTERS
  +'.fi{width:100%;padding:2px 4px;margin-top:2px;border:1px solid #ddd;border-radius:3px;font-size:10px;font-family:inherit;color:#333;background:#fff;outline:none;box-sizing:border-box;font-weight:400}'
  +'.fi:focus{border-color:#3e6ae1}'

  // ELEMENTS
  +'.ck{width:14px;height:14px;cursor:pointer;-webkit-appearance:none;appearance:none;border:1.5px solid #ccc;border-radius:2px;background:#fff;position:relative;vertical-align:middle}'
  +'.ck:checked{background:#3e6ae1;border-color:#3e6ae1}'
  +'.ck:checked::after{content:"";position:absolute;left:3.5px;top:0.5px;width:4px;height:7px;border:solid #fff;border-width:0 1.5px 1.5px 0;transform:rotate(45deg)}'
  +'.dt{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px}'
  +'.dg{background:#28a745}.dr{background:#dc3545}.do{background:#f0ad4e}'
  +'.nm{font-weight:600;color:#171a20;font-size:12px}'
  +'.pl{font-family:SFMono-Regular,Consolas,monospace;font-weight:600;font-size:12px;color:#171a20}'
  +'.su{font-size:11px;color:#aaa}'
  +'.rl{color:#3e6ae1;text-decoration:none;font-size:11px}'
  +'.rl:hover{text-decoration:underline}'

  // LOADING + FOOTER
  +'.ld{text-align:center;padding:60px}'
  +'.ldbar{width:180px;height:2px;background:#eee;border-radius:1px;margin:12px auto;overflow:hidden}'
  +'.ldbar::after{content:"";display:block;width:50px;height:2px;background:#3e6ae1;border-radius:1px;animation:ldb .8s ease-in-out infinite}'
  +'@keyframes ldb{0%{transform:translateX(-50px)}100%{transform:translateX(180px)}}'
  +'.ft{padding:8px 24px;font-size:11px;color:#aaa}'
  +'.hid{display:none}'
  +'.dtc{display:none;font-size:11px;font-weight:600;color:#3e6ae1}'
  +'</style></head><body>'

  // HEADER
  +'<div class="hd"><div class="hd-logo"><svg viewBox="0 0 160 160" fill="#171a20"><path d="m80 129.8 14-78.7c13.3 0 17.5 1.5 18.1 7.4 0 0 8.9-3.3 13.5-10.1-17.6-8.1-35.3-8.5-35.3-8.5L80 52.5 69.7 39.9s-17.7.4-35.3 8.5c4.5 6.8 13.5 10.1 13.5 10.1.6-6 4.8-7.4 18.1-7.4z"/><path d="M80 36.3c14.2-.1 30.5 2.2 47.2 9.5 2.2-4 2.8-5.8 2.8-5.8-18.2-7.3-35.3-9.7-50-9.8-14.7.1-31.8 2.5-50 9.8 0 0 .8 2.2 2.8 5.8 16.7-7.3 33-9.6 47.2-9.5"/></svg><span class="hd-site">Tesla Delivery Hub &mdash; Rennes</span></div><div class="hd-r"><input type="text" id="srch" class="hd-search" placeholder="Search by VIN, RN, LP or Name"><span class="hd-user">Ben Daubin</span></div></div>'

  // TITLE
  +'<div class="ttl">Delivery Dashboard</div>'

  // STATS BOXES
  +'<div class="srow">'
  +'<div class="sb">'
  +'<div class="si on" onclick="SF(\'all\',this)"><div class="sn b" id="sT">-</div><div class="sl">Delivery<br>Today</div></div>'
  +'<div class="si" onclick="SF(\'ok\',this)"><div class="sn g" id="sO">-</div><div class="sl">Pretes</div></div>'
  +'<div class="si" onclick="SF(\'al\',this)"><div class="sn r" id="sA">-</div><div class="sl">Alertes</div></div>'
  +'</div>'
  +'<div class="ssep"></div>'
  +'<div class="sb">'
  +'<div class="si"><div class="sn k" id="sP">0</div><div class="sl">Paiement<br>OK</div></div>'
  +'<div class="si"><div class="sn k" id="sOTG">0</div><div class="sl">OTG</div></div>'
  +'<div class="si"><div class="sn k" id="sPl">0</div><div class="sl">Plaques<br>OK</div></div>'
  +'<div class="si"><div class="sn k" id="sTI">0</div><div class="sl">Trade-In</div></div>'
  +'<div class="si"><div class="sn k" id="sAs">0</div><div class="sl">Assurance<br>OK</div></div>'
  +'</div>'
  +'</div>'

  // FILTERS
  +'<div class="fb">'
  +'<div class="fg"><div class="fl">Scheduled Date</div><select id="dt" class="fi2">'+dates.join('')+'</select></div>'
  +'<button class="bt-nav" onclick="ND(-1)" title="Jour precedent">&#8249;</button>'
  +'<button class="bt-nav" onclick="ND(1)" title="Jour suivant">&#8250;</button>'
  +'<button class="bt-q on" onclick="QD(0,this)">Today</button>'
  +'<button class="bt-q" onclick="QW(this)">This Week</button>'
  +'<button class="bt bt-p" onclick="L()">Search</button>'
  +'<div style="flex:1"></div>'
  +'<button class="bt bt-s" id="gn" style="display:none" onclick="G()">Generer PDFs</button>'
  +'<button class="bt bt-d" id="disp" style="display:none" onclick="DISPATCH()">Dispatcher</button>'
  +'</div>'

  // PILLS
  +'<div class="pb">'
  +'<span class="pi on" onclick="PF(\'all\',this)">Tous</span>'
  +CES.map(function(c){return'<span class="pi" onclick="PF(\''+c+'\',this)">'+c.split(' ')[0]+'</span>'}).join('')
  +'</div>'

  // TABLE
  +'<div class="tw"><div class="ld" id="lg" style="display:none"><div class="ldbar"></div><div style="font-size:12px;color:#aaa;margin-top:8px">Chargement...</div></div>'
  +'<table id="tbl" style="display:none"><thead><tr>'
  +'<th style="width:30px"><input type="checkbox" class="ck" id="sa" onchange="SA(this)"/></th>'
  +'<th style="width:90px" id="thDate" class="hid" onclick="SO(\'sdd\')">SDD<br><input class="fi" placeholder="..." oninput="CF();event.stopPropagation()" onclick="event.stopPropagation()"></th>'
  +'<th style="width:50px" onclick="SO(\'t\')">Heure<br><input class="fi" placeholder="..." oninput="CF();event.stopPropagation()" onclick="event.stopPropagation()"></th>'
  +'<th style="width:170px" onclick="SO(\'name\')">Client<br><input class="fi" placeholder="..." oninput="CF();event.stopPropagation()" onclick="event.stopPropagation()"></th>'
  +'<th style="width:100px">RN<br><input class="fi" placeholder="..." oninput="CF();event.stopPropagation()" onclick="event.stopPropagation()"></th>'
  +'<th style="width:70px" onclick="SO(\'model\')">Vehicule<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="Model 3">M3</option><option value="Model Y">MY</option></select></th>'
  +'<th style="width:80px">Plaque<br><input class="fi" placeholder="..." oninput="CF();event.stopPropagation()" onclick="event.stopPropagation()"></th>'
  +'<th style="width:65px">Paiement<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="OK">OK</option><option value="Non">Non</option></select></th>'
  +'<th style="width:70px">Trade-In<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="Accepted">Oui</option><option value="Non">Non</option></select></th>'
  +'<th style="width:80px">Vehicle<br>Status<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="Finished">FG</option><option value="Transit">Transit</option></select></th>'
  +'<th style="width:65px">Assurance<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="OK">OK</option><option value="Non">Non</option></select></th>'
  +'</tr></thead><tbody id="tb"></tbody></table>'
  +'<div class="ft" id="trec"></div></div>'

  +'<script>'
  +'var AUTH={token:"Bearer '+at.replace(/"/g,'\\"')+'",userId:"'+ui+'"};'
  +'var BASE="https://mytdeliveryopsapi.tesla.com/api";'
  +'var CFG={trtId:28498,cc:"FR"};'
  +'var CES='+JSON.stringify(CES)+';'
  +'var FR='+JSON.stringify(FR)+';'
  +'var tr=function(s){return FR[s]||s};'
  +'var DATA=[];'

  +'function PF(f,el){document.querySelectorAll(".pi").forEach(function(p){p.classList.remove("on")});el.classList.add("on");document.querySelectorAll("#tb tr").forEach(function(r){if(f==="all"){r.style.display="";return}r.style.display=(r.dataset.host||"").toLowerCase().indexOf(f.split(" ")[0].toLowerCase())>=0?"":"none"});US();TR()}'

  // QD - Quick date (0=today)
  +'function QD(offset,el){var sel=document.getElementById("dt");var opts=sel.options;var d=new Date(Date.now()+offset*864e5);var y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),dd=String(d.getDate()).padStart(2,"0");var v=y+"-"+m+"-"+dd;for(var i=0;i<opts.length;i++){if(opts[i].value===v){sel.selectedIndex=i;break}}document.querySelectorAll(".bt-q").forEach(function(b){b.classList.remove("on")});el.classList.add("on");WKMODE=false;showDateCol(false);L()}'

  // QW - This Week (7 prochains jours hors dimanche)
  +'async function QW(el){document.querySelectorAll(".bt-q").forEach(function(b){b.classList.remove("on")});el.classList.add("on");WKMODE=true;showDateCol(true);var days=[];for(var i=0;i<7;i++){var d=new Date(Date.now()+i*864e5);if(d.getDay()===0)continue;var y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),dd=String(d.getDate()).padStart(2,"0");days.push(y+"-"+m+"-"+dd)}var lg=document.getElementById("lg"),tbl=document.getElementById("tbl");lg.style.display="";tbl.style.display="none";var h={"Authorization":AUTH.token,"Content-Type":"application/json","userid":AUTH.userId};try{var allDm={};var dashResults=await Promise.all(days.map(function(ds){return fetch(BASE+"/deliveryops/Customers/Dashboard",{method:"POST",headers:h,body:JSON.stringify({fromDeliveryDate:ds,trtId:CFG.trtId,customerHasNoHost:false,skip:0,take:200,fromTime:"00:00",toTime:"23:59",countryCode:CFG.cc,onlyMyLocation:true,sort:{},stage:[],status:[],deliveryType:[],paperwork:[],customerDeliveryStatus:[],inboundStatus:[],VehicleTypes:[],pdcFilter:[],dmvDocumentStages:[]})}).then(function(r){return r.json()}).then(function(j){return{date:ds,data:j.Data||[]}})}));dashResults.forEach(function(dr){dr.data.forEach(function(d){allDm[d.ReferenceNumber]=d;allDm[d.ReferenceNumber]._date=dr.date})});var rns=Object.keys(allDm);if(!rns.length){lg.innerHTML="<div style=padding:60px;text-align:center;color:#aaa>Aucune livraison cette semaine.</div>";return}var batches=[];for(var b=0;b<rns.length;b+=200)batches.push(rns.slice(b,b+200));var advResults=await Promise.all(batches.map(function(batch){return fetch(BASE+"/advisor/Dashboard?isSidePanelFullScreen=true",{method:"POST",headers:h,body:JSON.stringify({condition:"and",rules:[{condition:"and",ReferenceNumbers:batch,Countries:[]}],Skip:0,Take:200,SortOrder:[],SelectedColumns:[]})}).then(function(r){return r.json()})}));var allAdv=[];advResults.forEach(function(r){allAdv=allAdv.concat(r.Data.Dashboard)});var tiC=allAdv.filter(function(a){return a.TradeInActionStatus==="COMPLETE_TRADE_IN"});var tiR={};await Promise.all(tiC.map(function(a){return fetch(BASE+"/widget/GetTradeInWidgetInfo?referenceNumber="+a.ReferenceNumber+"&vehicleMapId="+a.VehicleMapId+"&deliveryState="+encodeURIComponent(a.DeliveryState||""),{headers:h}).then(function(r){return r.json()}).then(function(j){if(j.Data)tiR[a.ReferenceNumber]={ms:j.Data.AcquisitionMilestone||""}}).catch(function(){})}));DATA=allAdv.map(function(a){var d=allDm[a.ReferenceNumber]||{};var dt=d.ScheduledDeliveryStartDateString||"";var t="?",mx=dt.match(/(\\d{1,2}):(\\d{2})\\s*(AM|PM)/i);if(mx){var hr=parseInt(mx[1]);if(mx[3].toUpperCase()==="PM"&&hr<12)hr+=12;if(mx[3].toUpperCase()==="AM"&&hr===12)hr=0;t=String(hr).padStart(2,"0")+":"+mx[2]}var hp=!!(a.LicensePlate&&a.LicensePlate.trim()&&a.LicensePlate.indexOf("-")>=0);var io=a.InsuranceActionStatus==="COMPLETE";var otg=a.VehicleStage==="Finished Goods"||a.VehicleStage==="Arrived at VRL"||(a.VehicleStage&&a.VehicleStage.indexOf("Arrived")>=0);var amtOk=a.AmountDueActionStatus==="Yes"||a.PaymentMethodActionStatus==="COMPLETE";var al=[];if(!hp)al.push("P");if(!otg)al.push("O");if(!amtOk)al.push("$");var r=tiR[a.ReferenceNumber];var tms=r?r.ms:"";if(tms.indexOf(" - ")>=0)tms=tms.split(" - ")[0];var clientName=a.CustomerName;var di=a.DriverInfo;if(a.IsEnterpriseOrder&&di&&di.first_name)clientName=di.first_name+" "+di.last_name+" ("+a.CustomerName+")";var vsShort=a.VehicleStage||"";if(vsShort==="Finished Goods")vsShort="Finished Goods";else if(vsShort.indexOf("Receiving")>=0)vsShort="Receiving Insp.";else if(vsShort.indexOf("Transit")>=0)vsShort="In Transit";else if(vsShort.indexOf("PDI")>=0)vsShort="PDI Pending";else if(vsShort.indexOf("Ready")>=0)vsShort="Ready for Prep";else if(vsShort.indexOf("Wash")>=0||vsShort.indexOf("Charge")>=0)vsShort="Wash/Charge";else if(vsShort.indexOf("Service")>=0)vsShort="In Service";var dd2=d._date||"";var sddRaw=d.ScheduledDeliveryStartDateString||"";var sddShort="";if(sddRaw){var sp=new Date(sddRaw);if(!isNaN(sp)){sddShort=sp.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"})}}else if(dd2){var dp=new Date(dd2+"T00:00:00");sddShort=dp.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"})}return{rn:a.ReferenceNumber,name:clientName,t:t,date:dd2,sdd:sddShort,sddRaw:sddRaw,model:a.VehicleModel,color:tr(a.VehicleColor||""),plate:(a.LicensePlate||"").trim(),host:d.HostName||"?",b2b:a.IsEnterpriseOrder,hp:hp,io:io,otg:otg,vs:vsShort,al:al,tims:tms,amtOk:amtOk}}).sort(function(a,b){return(a.date+a.t).localeCompare(b.date+b.t)});RW();var ok=DATA.filter(function(d){return d.al.length===0}).length;var pOk=DATA.filter(function(d){return d.amtOk}).length;var oOk=DATA.filter(function(d){return d.otg}).length;var plOk=DATA.filter(function(d){return d.hp}).length;var tiOk2=DATA.filter(function(d){return d.tims}).length;var asOk=DATA.filter(function(d){return d.io}).length;document.getElementById("sT").textContent=DATA.length;document.getElementById("sT").className="sn b";document.getElementById("sO").textContent=ok;document.getElementById("sO").className="sn"+(ok>0?" g":" x");document.getElementById("sA").textContent=DATA.length-ok;document.getElementById("sA").className="sn"+((DATA.length-ok)>0?" r":" x");var N=DATA.length;document.getElementById("sP").textContent=pOk+"/"+N;document.getElementById("sP").className="sn k";document.getElementById("sOTG").textContent=oOk+"/"+N;document.getElementById("sOTG").className="sn k";document.getElementById("sPl").textContent=plOk+"/"+N;document.getElementById("sPl").className="sn k";document.getElementById("sTI").textContent=tiOk2+"/"+N;document.getElementById("sTI").className="sn k";document.getElementById("sAs").textContent=asOk+"/"+N;document.getElementById("sAs").className="sn k";lg.style.display="none";tbl.style.display="";document.getElementById("gn").style.display="";document.getElementById("disp").style.display="";TR();document.getElementById("sa").checked=true}catch(err){lg.innerHTML="<div style=padding:60px;text-align:center;color:#c00>Erreur: "+err.message+"</div>"}}'

  // ND - Navigate date
  +'function ND(dir){var sel=document.getElementById("dt");var ni=sel.selectedIndex+dir;if(ni>=0&&ni<sel.options.length){sel.selectedIndex=ni;document.querySelectorAll(".bt-q").forEach(function(b){b.classList.remove("on")});WKMODE=false;showDateCol(false);L()}}'

  +'var WKMODE=false;'
  +'function showDateCol(show){document.getElementById("thDate").style.display=show?"":"none";document.querySelectorAll(".dtc").forEach(function(c){c.style.display=show?"":"none"})}'

  +'function SA(el){document.querySelectorAll(".rc").forEach(function(c){if(c.closest("tr").style.display!=="none")c.checked=el.checked})}'

  +'async function L(){'
  +'var lg=document.getElementById("lg"),tbl=document.getElementById("tbl"),tb=document.getElementById("tb");'
  +'lg.style.display="";tbl.style.display="none";'
  +'var h={"Authorization":AUTH.token,"Content-Type":"application/json","userid":AUTH.userId};'
  +'var ds=document.getElementById("dt").value;'
  +'try{'
  +'var dash=await fetch(BASE+"/deliveryops/Customers/Dashboard",{method:"POST",headers:h,body:JSON.stringify({fromDeliveryDate:ds,trtId:CFG.trtId,customerHasNoHost:false,skip:0,take:200,fromTime:"00:00",toTime:"23:59",countryCode:CFG.cc,onlyMyLocation:true,sort:{},stage:[],status:[],deliveryType:[],paperwork:[],customerDeliveryStatus:[],inboundStatus:[],VehicleTypes:[],pdcFilter:[],dmvDocumentStages:[]})}).then(function(r){return r.json()});'
  +'var dm={};dash.Data.forEach(function(d){dm[d.ReferenceNumber]=d});var rns=Object.keys(dm);'
  +'if(!rns.length){lg.innerHTML="<div style=padding:60px;text-align:center;color:#aaa>Aucune livraison.</div>";return}'
  +'var adv=await fetch(BASE+"/advisor/Dashboard?isSidePanelFullScreen=true",{method:"POST",headers:h,body:JSON.stringify({condition:"and",rules:[{condition:"and",ReferenceNumbers:rns,Countries:[]}],Skip:0,Take:200,SortOrder:[],SelectedColumns:[]})}).then(function(r){return r.json()});'
  +'var tiC=adv.Data.Dashboard.filter(function(a){return a.TradeInActionStatus==="COMPLETE_TRADE_IN"});'
  +'var tiR={};await Promise.all(tiC.map(function(a){return fetch(BASE+"/widget/GetTradeInWidgetInfo?referenceNumber="+a.ReferenceNumber+"&vehicleMapId="+a.VehicleMapId+"&deliveryState="+encodeURIComponent(a.DeliveryState||""),{headers:h}).then(function(r){return r.json()}).then(function(j){if(j.Data)tiR[a.ReferenceNumber]={ms:j.Data.AcquisitionMilestone||""}}).catch(function(){})}));'
  +'DATA=adv.Data.Dashboard.map(function(a){var d=dm[a.ReferenceNumber]||{};var dt=d.ScheduledDeliveryStartDateString||"";var t="?",m=dt.match(/(\\d{1,2}):(\\d{2})\\s*(AM|PM)/i);if(m){var hr=parseInt(m[1]);if(m[3].toUpperCase()==="PM"&&hr<12)hr+=12;if(m[3].toUpperCase()==="AM"&&hr===12)hr=0;t=String(hr).padStart(2,"0")+":"+m[2]}var hp=!!(a.LicensePlate&&a.LicensePlate.trim()&&a.LicensePlate.indexOf("-")>=0);var io=a.InsuranceActionStatus==="COMPLETE";var otg=a.VehicleStage==="Finished Goods"||a.VehicleStage==="Arrived at VRL"||(a.VehicleStage&&a.VehicleStage.indexOf("Arrived")>=0);var amtOk=a.AmountDueActionStatus==="Yes"||a.PaymentMethodActionStatus==="COMPLETE";var al=[];if(!hp)al.push("P");if(!otg)al.push("O");if(!amtOk)al.push("$");var r=tiR[a.ReferenceNumber];var tms=r?r.ms:"";if(tms.indexOf(" - ")>=0)tms=tms.split(" - ")[0];var clientName=a.CustomerName;var di=a.DriverInfo;if(a.IsEnterpriseOrder&&di&&di.first_name)clientName=di.first_name+" "+di.last_name+" ("+a.CustomerName+")";var vsShort=a.VehicleStage||"";if(vsShort==="Finished Goods")vsShort="Finished Goods";else if(vsShort.indexOf("Receiving")>=0)vsShort="Receiving Insp.";else if(vsShort.indexOf("Transit")>=0)vsShort="In Transit";else if(vsShort.indexOf("PDI")>=0)vsShort="PDI Pending";else if(vsShort.indexOf("Ready")>=0)vsShort="Ready for Prep";else if(vsShort.indexOf("Wash")>=0||vsShort.indexOf("Charge")>=0)vsShort="Wash/Charge";else if(vsShort.indexOf("Service")>=0)vsShort="In Service";return{rn:a.ReferenceNumber,name:clientName,t:t,date:ds,sdd:"",model:a.VehicleModel,color:tr(a.VehicleColor||""),plate:(a.LicensePlate||"").trim(),host:d.HostName||"?",b2b:a.IsEnterpriseOrder,hp:hp,io:io,otg:otg,vs:vsShort,al:al,tims:tms,amtOk:amtOk}}).sort(function(a,b){return a.t.localeCompare(b.t)});'
  +'RW();'
  +'var ok=DATA.filter(function(d){return d.al.length===0}).length;'
  +'var pOk=DATA.filter(function(d){return d.amtOk}).length;'
  +'var oOk=DATA.filter(function(d){return d.otg}).length;'
  +'var plOk=DATA.filter(function(d){return d.hp}).length;'
  +'var tiOk=DATA.filter(function(d){return d.tims}).length;'
  +'var asOk=DATA.filter(function(d){return d.io}).length;'
  +'document.getElementById("sT").textContent=DATA.length;document.getElementById("sT").className="sn b";'
  +'document.getElementById("sO").textContent=ok;document.getElementById("sO").className="sn"+(ok>0?" g":" x");'
  +'document.getElementById("sA").textContent=DATA.length-ok;document.getElementById("sA").className="sn"+((DATA.length-ok)>0?" r":" x");'
  +'var N=DATA.length;'
  +'document.getElementById("sP").textContent=pOk+"/"+N;document.getElementById("sP").className="sn k";'
  +'document.getElementById("sOTG").textContent=oOk+"/"+N;document.getElementById("sOTG").className="sn k";'
  +'document.getElementById("sPl").textContent=plOk+"/"+N;document.getElementById("sPl").className="sn k";'
  +'document.getElementById("sTI").textContent=tiOk+"/"+N;document.getElementById("sTI").className="sn k";'
  +'document.getElementById("sAs").textContent=asOk+"/"+N;document.getElementById("sAs").className="sn k";'
  +'lg.style.display="none";tbl.style.display="";document.getElementById("gn").style.display="";document.getElementById("disp").style.display="";TR();'
  +'document.getElementById("sa").checked=true;'
  +'}catch(err){lg.innerHTML="<div style=padding:60px;text-align:center;color:#c00>Erreur: "+err.message+"</div>"}}'

  +'function RW(){var tb=document.getElementById("tb");var out="";for(var i=0;i<DATA.length;i++){var d=DATA[i];var vc=d.otg?"dg":(d.vs.indexOf("Transit")>=0?"do":"dr");out+="<tr class=\\""+(d.al.length?"w":"")+"\\" data-host=\\""+d.host+"\\"><td><input type=checkbox class=\\"ck rc\\" data-i="+i+" "+(d.al.length===0?"checked":"")+"></td><td class=dtc>"+(d.sdd||"")+"</td><td>"+d.t+"</td><td><span class=nm>"+d.name+"</span></td><td><a class=rl href=\\"https://dro.tesla.com/advisor?sidepanel_fullscreen=yes&rn="+d.rn+"\\" target=_blank>"+d.rn+"</a></td><td>"+d.model+"</td><td>"+(d.hp?"<span class=pl>"+d.plate+"</span>":"<span class=su>En attente</span>")+"</td><td>"+(d.amtOk?"<span class=\\"dt dg\\"></span>OK":"<span class=\\"dt dr\\"></span>Non")+"</td><td>"+(d.tims?"<span class=\\"dt dg\\"></span>"+d.tims:"<span class=su>Non</span>")+"</td><td><span class=\\"dt "+vc+"\\"></span>"+d.vs+"</td><td>"+(d.io?"<span class=\\"dt dg\\"></span>OK":"<span class=su>Non</span>")+"</td></tr>"}tb.innerHTML=out;if(WKMODE)showDateCol(true)}'

  +'function G(){var c=[];document.querySelectorAll(".rc:checked").forEach(function(el){var tr=el.closest("tr");if(tr&&tr.style.display!=="none"){var i=parseInt(el.dataset.i);if(DATA[i])c.push(DATA[i])}});if(!c.length){alert("Aucune livraison!");return}alert("Generation de "+c.length+" pages de garde...")}'

  +'async function DISPATCH(){var hosts=[{name:"Ben Daubin",id:"428058"},{name:"Sacha Villa",id:"399921"},{name:"Sophie MACE",id:"444287"}];var items=DATA;if(!items.length){alert("Aucune livraison!");return}if(!confirm("Dispatcher "+items.length+" livraisons entre "+hosts.map(function(h){return h.name}).join(", ")+"?"))return;var btn=document.getElementById("disp");btn.textContent="...";btn.disabled=true;var ok=0,fail=0;for(var i=0;i<items.length;i++){var d=items[i];var host=hosts[i%hosts.length];try{var r=await fetch(BASE+"/deliveryops/Customers/UpdateHost?referenceNumber="+d.rn+"&value="+host.id,{method:"POST",headers:{"Authorization":AUTH.token,"Content-Type":"application/json","userid":AUTH.userId}});if(r.ok)ok++;else fail++}catch(e){fail++}}btn.textContent="Dispatcher";btn.disabled=false;alert(ok+" OK / "+fail+" erreurs")}'

  +'var sortDir={};function SO(k){sortDir[k]=!sortDir[k];DATA.sort(function(a,b){var v=sortDir[k]?1:-1;return(a[k]||"").toString().localeCompare((b[k]||"").toString())*v});RW()}'

  +'document.getElementById("srch").oninput=function(){var q=this.value.toLowerCase();document.querySelectorAll("#tb tr").forEach(function(r){r.style.display=r.textContent.toLowerCase().indexOf(q)>=0?"":"none"});TR()};'

  +'function SF(t,el){document.querySelectorAll(".si").forEach(function(s){s.classList.remove("on")});el.classList.add("on");document.querySelectorAll("#tb tr").forEach(function(r){if(t==="all"){r.style.display=""}else if(t==="ok"){r.style.display=r.classList.contains("w")?"none":""}else{r.style.display=r.classList.contains("w")?"":"none"}});TR()}'

  +'function CF(){var fils=document.querySelectorAll(".fi");document.querySelectorAll("#tb tr").forEach(function(r){var cells=r.querySelectorAll("td");var show=true;fils.forEach(function(f,i){var v=f.value.toLowerCase();if(!v)return;var cell=cells[i+1];if(!cell)return;var txt=cell.textContent.toLowerCase();if(txt.indexOf(v)<0)show=false});r.style.display=show?"":"none"});TR()}'

  +'function TR(){var v=0;document.querySelectorAll("#tb tr").forEach(function(r){if(r.style.display!=="none")v++});document.getElementById("trec").textContent="Total Records: "+v}'
  +'function US(){var tot=0,ok=0,al=0;document.querySelectorAll("#tb tr").forEach(function(r){if(r.style.display==="none")return;tot++;if(r.classList.contains("w"))al++;else ok++});document.getElementById("sT").textContent=tot;document.getElementById("sO").textContent=ok;document.getElementById("sA").textContent=al}'

  +'</scr'+'ipt></body></html>');
  w.document.close();
})();
