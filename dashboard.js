// Tesla Delivery Hub v17
(function(){
  var tk=(localStorage.getItem('delops_id_token')||'').replace(/^"|"$/g,'');
  var t2=(localStorage.getItem('delops_id_token_data')||'').replace(/^"|"$/g,'');
  var ui=(localStorage.getItem('UserId')||'').replace(/^"|"$/g,'');
  var at=tk&&tk.length>100?tk:t2&&t2.length>100?t2:null;
  if(!at||!ui){alert('Token not found!');return}

  // Server URL (always localhost - each CES runs their own server)
  var SERVER='http://localhost:3000';

  // Auto-send DRO token to server on every load
  fetch(SERVER+'/api/auth/tokens',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({droToken:at,userId:ui})}).catch(function(){});

  var CES=['Ben Daubin','Sacha Villa','Sophie MACE'];
  var fD=function(d){return d.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'})};
  var iD=function(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
  var dates=[];for(var di=0;di<10&&dates.length<7;di++){var dd=new Date(Date.now()+di*864e5);if(dd.getDay()===0)continue;var lbl=di===0?'Today':di===1?'Tomorrow':'D+'+di;dates.push('<option value="'+iD(dd)+'">'+lbl+' - '+fD(dd)+'</option>')}

  var w=window.open('','_blank');
  if(!w){alert('Popup blocked!');return}

  w.document.open();
  w.document.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>Tesla Delivery Hub</title>'
  +'<style>'
  +'*{box-sizing:border-box;margin:0;padding:0}'
  +'@font-face{font-family:UST;font-weight:400;font-display:swap;src:url(https://digitalassets.tesla.com/tesla-design-system/raw/upload/static/fonts/universal-sans-2/web/text/Universal-Sans-Text-Regular.woff2) format(woff2)}'
  +'@font-face{font-family:UST;font-weight:500;font-display:swap;src:url(https://digitalassets.tesla.com/tesla-design-system/raw/upload/static/fonts/universal-sans-2/web/text/Universal-Sans-Text-Medium.woff2) format(woff2)}'
  +'@font-face{font-family:UST;font-weight:700;font-display:swap;src:url(https://digitalassets.tesla.com/tesla-design-system/raw/upload/static/fonts/universal-sans-2/web/text/Universal-Sans-Text-Bold.woff2) format(woff2)}'
  +'body{font-family:UST,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#171a20;background:#fff;font-size:13px;line-height:1.4}'

  // TITLE â€” Intrepid exact: 40px, weight 500, padding 20px
  +'.title-row{padding:20px 32px 0}'
  +'.ttl{font-size:40px;font-weight:500;color:#171a20;line-height:48px;margin-top:10px}'
  +'.title-actions{margin-left:24px;display:flex;gap:8px}'
  +'.updated{font-size:12px;color:#999;text-align:right;padding:4px 32px 0}'

  // TABS â€” Intrepid exact: grey bg container, toggle style
  +'.tabs{display:inline-flex;margin:20px 32px;padding:4px;gap:4px;background:rgba(0,0,0,.05);border-radius:4px}'
  +'.tab{padding:4px 24px;font-size:14px;color:#5c5e62;cursor:pointer;font-weight:500;border-radius:2px;height:32px;display:flex;align-items:center;border:none;background:none;font-family:inherit;transition:all .1s}'
  +'.tab:hover{color:#171a20}'
  +'.tab.on{color:#171a20;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.1)}'

  // STATS
  +'.srow{display:flex;gap:16px;margin:24px 32px 24px;align-items:stretch}'
  +'.sb{display:inline-flex;border-radius:4px;box-shadow:rgba(0,0,0,.12) 0 8px 16px;background:#fff}'
  +'.si{display:flex;flex-direction:column;align-items:center;padding:20px 28px 14px;cursor:pointer;transition:background .1s;position:relative;min-width:115px;height:120px}'
  +'.si:not(:last-child)::after{content:"";position:absolute;right:0;top:16px;bottom:16px;width:1px;background:#e0e0e0}'
  +'.si:hover{background:#f8f8f8}'
  +'.si.on{background:#f0f4ff}'
  +'.sn{font-size:28px;font-weight:400;line-height:1;color:#3e6ae1;margin-top:8px}'
  +'.sn.g{color:#28a745}.sn.r{color:#dc3545}'
  +'.sl{font-size:14px;color:#5c5e62;margin-top:auto;text-align:center;line-height:1.3}'
  +'.sf{text-align:center;line-height:1;margin-top:4px}'
  +'.sf .top{font-size:22px;font-weight:700;color:#171a20}'
  +'.sf .div{font-size:20px;font-weight:400;color:#ccc;border-top:1px solid #e0e0e0;margin-top:3px;padding-top:3px}'

  // FILTERS
  +'.toolbar{padding:0 32px 16px;display:flex;align-items:flex-end;gap:12px;flex-wrap:wrap}'
  +'.fg{display:flex;flex-direction:column;gap:3px}'
  +'.fl{font-size:11px;color:#666;font-weight:600;text-transform:uppercase;letter-spacing:.5px}'
  +'.fi2{padding:8px 12px;border:1px solid #ddd;border-radius:4px;font-size:13px;font-family:inherit;color:#333;outline:none;background:#fff}'
  +'.fi2:focus{border-color:#3e6ae1}'

  // BUTTONS â€” Intrepid exact colors
  +'.bt{padding:8px 20px;border-radius:4px;font-size:13px;font-family:inherit;font-weight:600;cursor:pointer;border:1px solid #ddd;transition:all .1s;background:#fff;color:#393c41}'
  +'.bt:hover{background:#f5f5f5}'
  +'.bt-p{background:#3e6ae1;color:#fff;border-color:#3e6ae1}.bt-p:hover{background:#2d5bd0}'
  +'.bt-r{background:#e8523a;color:#fff;border-color:#e8523a}.bt-r:hover{background:#d44430}'
  +'.bt-q{background:#fff;color:#393c41;border:1px solid #ddd;padding:8px 16px;font-size:12px;border-radius:4px;cursor:pointer;font-family:inherit;font-weight:500;transition:all .1s}'
  +'.bt-q:hover{background:#f5f5f5}'
  +'.bt-q.on{background:#393c41;color:#fff;border-color:#393c41}'
  +'.bt-nav{background:#fff;color:#393c41;border:1px solid #ddd;padding:8px 10px;font-size:14px;border-radius:4px;cursor:pointer;font-family:inherit;line-height:1}'
  +'.bt-nav:hover{background:#f5f5f5}'

  // HOST PILLS â€” Intrepid outline style
  +'.hostbar{padding:0 32px 16px;display:flex;gap:8px}'
  +'.pill{padding:6px 16px;border-radius:20px;border:1px solid #ddd;background:#fff;cursor:pointer;font-size:12px;color:#666;font-family:inherit;font-weight:500;transition:all .1s}'
  +'.pill:hover{background:#f5f5f5;border-color:#aaa}'
  +'.pill.on{background:#393c41;color:#fff;border-color:#393c41}'

  // TABLE
  +'.tw{padding:0 32px 24px}'
  +'.tcard{background:#fff;border:1px solid #e0e0e0;overflow:hidden}'
  +'table{width:100%;border-collapse:collapse}'
  +'th{padding:10px 12px;text-align:left;font-size:12px;color:#393c41;font-weight:600;border-bottom:1px solid #e0e0e0;background:#fafafa;cursor:pointer;user-select:none;white-space:nowrap;position:sticky;top:0;z-index:10}'
  +'th:hover{color:#171a20}'
  +'td{padding:8px 12px;font-size:13px;border-bottom:1px solid #f0f0f0;vertical-align:middle;color:#393c41;height:44px;white-space:nowrap}'
  +'tr:hover td{background:#fafafa}'
  +'tr.w td{background:#fef8f8}'
  +'tr.w:hover td{background:#fef0f0}'

  // FILTER INPUTS
  +'.fi{width:100%;padding:4px 6px;margin-top:4px;border:1px solid #ddd;border-radius:4px;font-size:11px;font-family:inherit;color:#333;background:#fff;outline:none;box-sizing:border-box;font-weight:400}'
  +'.fi:focus{border-color:#3e6ae1}'

  // ELEMENTS
  +'.ck{width:16px;height:16px;cursor:pointer;-webkit-appearance:none;appearance:none;border:1.5px solid #ccc;border-radius:3px;background:#fff;position:relative;vertical-align:middle}'
  +'.ck:checked{background:#393c41;border-color:#393c41}'
  +'.ck:checked::after{content:"";position:absolute;left:4px;top:1px;width:5px;height:8px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg)}'
  +'.dt{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:6px;vertical-align:middle}'
  +'.dg{background:#28a745}.dr{background:#dc3545}.do{background:#f0ad4e}'
  +'.nm{font-weight:600;color:#171a20;font-size:13px}'
  +'.su{font-size:12px;color:#aaa}'
  +'.rl{color:#3e6ae1;text-decoration:none;font-size:12px;font-weight:500}'
  +'.rl:hover{text-decoration:underline}'

  // LOADING
  +'.spinner{width:44px;height:44px;border:3px solid #f0f0f0;border-top-color:#e8523a;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto}'
  +'@keyframes spin{to{transform:rotate(360deg)}}'
  +'.ft{padding:10px 12px;font-size:12px;color:#999}'
  +'.hid{display:none}'
  +'.dtc{display:none;font-size:12px;font-weight:600;color:#3e6ae1}'
  +'</style></head><body>'

  // TITLE
  +'<div class="title-row"><div class="ttl">Delivery Dashboard</div><div style="margin-left:auto;display:flex;flex-direction:column;align-items:flex-end;gap:4px"><button id="docgenBtn" onclick="LOGINDG()" class="tab" style="font-size:13px;display:flex;align-items:center;gap:8px;cursor:pointer"><span id="dotDro" style="width:8px;height:8px;border-radius:50%;background:#ccc;display:inline-block"></span>DRO<span id="dotDg" style="width:8px;height:8px;border-radius:50%;background:#ccc;display:inline-block"></span>DocGen</button><div class="updated" id="upd"></div></div></div>'
  +'<div class="tabs"><button class="tab on">Customer Delivery</button><button class="tab" onclick="DISPATCH()">Dispatch</button></div>'

  // STATS - Block 1: Overview | Block 2: Readiness | Block 3: CES
  +'<div class="srow">'
  +'<div class="sb">'
  +'<div class="si on" onclick="SF(\'all\',this)"><div class="sn" id="sT">-</div><div class="sl">Deliveries</div></div>'
  +'<div class="si" onclick="SF(\'ok\',this)"><div class="sn g" id="sO">-</div><div class="sl">Ready</div></div>'
  +'<div class="si" onclick="SF(\'al\',this)"><div class="sn r" id="sA">-</div><div class="sl">Alerts</div></div>'
  +'</div>'
  +'<div class="sb">'
  +'<div class="si" onclick="SFR(\'pay\',this)"><div id="sP" class="sf"><div class="top">0</div><div class="div">0</div></div><div class="sl">Payment</div></div>'
  +'<div class="si" onclick="SFR(\'otg\',this)"><div id="sOTG" class="sf"><div class="top">0</div><div class="div">0</div></div><div class="sl">Car On The<br>Ground</div></div>'
  +'<div class="si" onclick="SFR(\'reg\',this)"><div id="sPl" class="sf"><div class="top">0</div><div class="div">0</div></div><div class="sl">Registration</div></div>'
  +'<div class="si" onclick="SFR(\'ti\',this)"><div id="sTI" class="sf"><div class="top">0</div><div class="div">0</div></div><div class="sl">Approved<br>for Intake</div></div>'
  +'<div class="si" onclick="SFR(\'ins\',this)"><div id="sAs" class="sf"><div class="top">0</div><div class="div">0</div></div><div class="sl">Insurance</div></div>'
  +'</div>'
  +'<div class="sb" style="margin-left:auto">'
  +'<div class="si on" onclick="PF(\'all\',this)"><div class="sn" id="cAll">-</div><div class="sl">All</div></div>'
  +CES.map(function(c,i){return'<div class="si" onclick="PF(\''+c+'\',this)"><div class="sn" id="c'+i+'">-</div><div class="sl">'+c.split(' ')[0]+'</div></div>'}).join('')
  +'</div>'
  +'</div>'

  // TOOLBAR
  +'<div class="toolbar">'
  +'<div style="position:relative"><svg style="position:absolute;left:10px;top:9px;width:14px;height:14px;fill:none;stroke:#999;stroke-width:2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg><input type="text" id="srch" style="padding:8px 12px 8px 32px;border:1px solid #ddd;border-radius:4px;font-size:13px;width:180px;font-family:inherit;color:#333;outline:none" placeholder="Search"></div>'
  +'<div class="fg"><div class="fl">SCHEDULED DATE</div><select id="dt" class="fi2">'+dates.join('')+'</select></div>'
  +'<button class="bt-nav" onclick="ND(-1)" title="Previous day">&#8249;</button>'
  +'<button class="bt-nav" onclick="ND(1)" title="Next day">&#8250;</button>'
  +'<button class="bt-q" onclick="QW(0,this)">This Week</button>'
  +'<button class="bt-q" onclick="QW(1,this)">Next Week</button>'
  +'<button class="bt-q" onclick="QP(this)" style="border-color:#28a745;color:#28a745">Pull-Up</button>'
  +'<button class="bt bt-p" onclick="L()">Search</button>'
  +'<button class="bt" onclick="RST()">Reset</button>'
  +'<div style="flex:1"></div>'
  +'<button class="bt bt-r" onclick="G()">Print</button>'
  +'</div>'

  // TABLE
  +'<div class="tw"><div class="tcard"><div id="lg" style="display:none;text-align:center;padding:80px 0"><div class="spinner"></div><div style="font-size:13px;color:#999;margin-top:16px">Loading deliveries...</div></div>'
  +'<table id="tbl" style="display:none"><thead><tr>'
  +'<th style="width:32px"><input type="checkbox" class="ck" id="sa" onchange="SA(this)"/></th>'
  +'<th id="thDate" class="hid" onclick="SO(\'sdd\')">Scheduled Delivery Date<br><input class="fi" placeholder="..." oninput="CF();event.stopPropagation()" onclick="event.stopPropagation()"></th>'
  +'<th onclick="SO(\'t\')" style="width:50px">Time<br><input class="fi" placeholder="..." oninput="CF();event.stopPropagation()" onclick="event.stopPropagation()"></th>'
  +'<th onclick="SO(\'name\')" style="width:220px">Customer<br><input class="fi" placeholder="..." oninput="CF();event.stopPropagation()" onclick="event.stopPropagation()"></th>'
  +'<th style="width:110px">RN<br><input class="fi" placeholder="..." oninput="CF();event.stopPropagation()" onclick="event.stopPropagation()"></th>'
  +'<th onclick="SO(\'model\')" style="width:75px">Vehicle<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="Model 3">M3</option><option value="Model Y">MY</option></select></th>'
  +'<th style="width:90px">Registration<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="OK">OK</option><option value="Hold">Hold</option><option value="Pending">Pending</option></select></th>'
  +'<th style="width:75px">Payment<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="OK">OK</option><option value="No">No</option></select></th>'
  +'<th style="width:80px">Trade-In<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="Accepted">Yes</option><option value="No">No</option></select></th>'
  +'<th style="width:100px">Vehicle<br>Status<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="Finished">FG</option><option value="Transit">Transit</option></select></th>'
  +'<th style="width:55px">Hold<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="Hold">Hold</option><option value="OK">OK</option></select></th>'
  +'<th style="width:75px">Insurance<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="OK">OK</option><option value="No">No</option></select></th>'
  +'<th style="width:45px"></th>'
  +'</tr></thead><tbody id="tb"></tbody></table>'
  +'<div class="ft" id="trec"></div></div></div>'

  +'<script>'
  +'var AUTH={token:"Bearer '+at.replace(/"/g,'\\"')+'",userId:"'+ui+'"};'
  +'var BASE="https://mytdeliveryopsapi.tesla.com/api";'
  +'var CFG={trtId:28498,cc:"FR"};'
  +'var CES='+JSON.stringify(CES)+';'
  +'var DATA=[];'

  +'function PF(f,el){document.querySelectorAll(".sb:last-child .si").forEach(function(p){p.classList.remove("on")});el.classList.add("on");document.querySelectorAll("#tb tr").forEach(function(r){if(f==="all"){r.style.display="";return}r.style.display=(r.dataset.host||"").toLowerCase().indexOf(f.split(" ")[0].toLowerCase())>=0?"":"none"});US();TR()}'

  +'function QD(offset,el){var sel=document.getElementById("dt");var opts=sel.options;var d=new Date(Date.now()+offset*864e5);var y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),dd=String(d.getDate()).padStart(2,"0");var v=y+"-"+m+"-"+dd;for(var i=0;i<opts.length;i++){if(opts[i].value===v){sel.selectedIndex=i;break}}document.querySelectorAll(".bt-q").forEach(function(b){b.classList.remove("on")});el.classList.add("on");WKMODE=false;showDateCol(false);L()}'

  +'async function QW(wk,el){document.querySelectorAll(".bt-q").forEach(function(b){b.classList.remove("on")});el.classList.add("on");WKMODE=true;showDateCol(true);var lg=document.getElementById("lg"),tbl=document.getElementById("tbl");lg.style.display="block";tbl.style.display="none";var h={"Authorization":AUTH.token,"Content-Type":"application/json","userid":AUTH.userId};try{var rule={condition:"and",extraHeaders:null,Countries:[{Abbreviation:"FR",Region:"EU"}],TrtIds:[CFG.trtId],ReferenceNumbers:[],Vins:[],IsScheduled:true,OrderStatus:["ORDER_PLACED","BOOKED"],VehicleStages:null,DeliveryStatus:null,IsContainmentHold:null,IsAmountDueComplete:null,IsInsuranceComplete:null,IsTradeInComplete:null,IsRegistrationComplete:null,IsPaymentComplete:null,MatchStatus:null,DeliveryTypes:null,VehicleType:null,VehicleModels:null,HasOpenCommunication:null,IsEnterpriseOrder:null,VehicleTitles:null,VehicleContainmentHoldTitle:[],VesselNames:[],OpenCaseTypes:[]};var body={condition:"and",rules:[rule],Skip:0,Take:500,SortOrder:[],SelectedColumns:[]};var adv=await fetch(BASE+"/advisor/Dashboard?isSidePanelFullScreen=false",{method:"POST",headers:h,body:JSON.stringify(body)}).then(function(r){return r.json()});var allAdv=adv.Data.Dashboard||[];if(!allAdv.length){lg.innerHTML="<div style=padding:60px;text-align:center;color:#aaa>No scheduled deliveries found.</div>";return}var now=new Date();var dow=now.getDay();var monOff=dow===0?1:1-dow;var mon=new Date(now.getFullYear(),now.getMonth(),now.getDate()+monOff+wk*7);var sat=new Date(mon.getTime()+5*864e5);sat.setHours(23,59,59);var startDate=mon;allAdv=allAdv.filter(function(a){if(!a.ScheduledDeliveryDate)return false;var sd=new Date(a.ScheduledDeliveryDate);return sd>=startDate&&sd<=sat&&sd.getDay()!==0});if(!allAdv.length){lg.innerHTML="<div style=padding:60px;text-align:center;color:#aaa>No deliveries "+(wk===0?"this":"next")+" week.</div>";return}var tiR={};allAdv.forEach(function(a){if(a.TradeInActionStatus==="COMPLETE_TRADE_IN")tiR[a.ReferenceNumber]={ms:"Accepted"}});DATA=allAdv.map(function(a){var sddRaw=a.ScheduledDeliveryDate||"";var sddShort="";var sortKey="";if(sddRaw){var sp=new Date(sddRaw);if(!isNaN(sp)){var fmtSDD=function(sp){var mm=String(sp.getMonth()+1).padStart(2,"0");var dd=String(sp.getDate()).padStart(2,"0");var yy=sp.getFullYear();var hh=sp.getHours();var mi=String(sp.getMinutes()).padStart(2,"0");var ampm=hh>=12?"PM":"AM";var h12=hh%12||12;return mm+"-"+dd+"-"+yy+" "+h12+":"+mi+" "+ampm};sddShort=fmtSDD(sp);sortKey=sp.toISOString()}}var t="?";if(sddRaw){var sp2=new Date(sddRaw);if(!isNaN(sp2)){t=String(sp2.getHours()).padStart(2,"0")+":"+String(sp2.getMinutes()).padStart(2,"0")}}var hp=!!(a.LicensePlate&&a.LicensePlate.trim()&&a.LicensePlate.indexOf("-")>=0);var hold=!!a.HasHold;var io=a.InsuranceActionStatus==="COMPLETE";var otg=a.VehicleStage==="Finished Goods"||a.VehicleStage==="Arrived at VRL"||(a.VehicleStage&&a.VehicleStage.indexOf("Arrived")>=0);var amtOk=a.AmountDueActionStatus==="Yes"||a.PaymentMethodActionStatus==="COMPLETE";var al=[];if(!hp)al.push("P");if(!otg)al.push("O");if(!amtOk)al.push("$");if(hold)al.push("H");var r=tiR[a.ReferenceNumber];var tms=r?r.ms:"";;var clientName=a.CustomerName;var di=a.DriverInfo;if(a.IsEnterpriseOrder&&di&&di.first_name)clientName=di.first_name+" "+di.last_name+" ("+a.CustomerName+")";var vsShort=a.VehicleStage||"";if(vsShort==="Finished Goods")vsShort="Finished Goods";else if(vsShort.indexOf("Receiving")>=0)vsShort="Receiving Insp.";else if(vsShort.indexOf("Transit")>=0)vsShort="In Transit";else if(vsShort.indexOf("PDI")>=0)vsShort="PDI Pending";else if(vsShort.indexOf("Ready")>=0)vsShort="Ready for Prep";else if(vsShort.indexOf("Wash")>=0||vsShort.indexOf("Charge")>=0)vsShort="Wash/Charge";else if(vsShort.indexOf("Service")>=0)vsShort="In Service";else if(vsShort.indexOf("garage")>=0)vsShort="Delivered";return{rn:a.ReferenceNumber,name:clientName,t:t,date:sortKey,sdd:sddShort,sddRaw:sddRaw,model:a.VehicleModel,color:a.VehicleColor||"",plate:(a.LicensePlate||"").trim(),regTxt:hp?"OK":"Pending",regOk:hp,host:a.DeliverySpecialist||"?",b2b:a.IsEnterpriseOrder,hp:hp,hold:hold,io:io,otg:otg,vs:vsShort,al:al,used:a.VehicleTitleStatus==="USED",tims:tms,hasTI:!!(a.TradeInActionStatus&&a.TradeInActionStatus!=="NO_TRADE_IN"),amtOk:amtOk}}).sort(function(a,b){return(a.date+a.t).localeCompare(b.date+b.t)});RW();var ok=DATA.filter(function(d){return d.al.length===0}).length;var pOk=DATA.filter(function(d){return d.amtOk}).length;var oOk=DATA.filter(function(d){return d.otg}).length;var plOk=DATA.filter(function(d){return d.regOk}).length;var tiOk2=DATA.filter(function(d){return d.tims}).length;var asOk=DATA.filter(function(d){return d.io}).length;var N=DATA.length;document.getElementById("sT").textContent=N;document.getElementById("sT").className="sn b";document.getElementById("sO").textContent=ok;document.getElementById("sO").className="sn"+(ok>0?" g":" x");document.getElementById("sA").textContent=N-ok;document.getElementById("sA").className="sn"+((N-ok)>0?" r":" x");document.getElementById("sP").innerHTML="<div class=top>"+pOk+"</div><div class=div>"+N+"</div>";document.getElementById("sOTG").innerHTML="<div class=top>"+oOk+"</div><div class=div>"+N+"</div>";document.getElementById("sPl").innerHTML="<div class=top>"+plOk+"</div><div class=div>"+N+"</div>";document.getElementById("sTI").innerHTML="<div class=top>"+DATA.filter(function(d){return d.tims&&(d.tims.indexOf("Approved")>=0||d.tims.indexOf("Received")>=0)}).length+"</div><div class=div>"+DATA.filter(function(d){return d.tims}).length+"</div>";document.getElementById("sAs").innerHTML="<div class=top>"+asOk+"</div><div class=div>"+N+"</div>";lg.style.display="none";tbl.style.display="";TR();document.getElementById("sa").checked=true;UC()}catch(err){lg.innerHTML="<div style=padding:60px;text-align:center;color:#c00>Error: "+err.message+"</div>"}}'

  // QP - Pull-Up Potential (ready vehicles, no enterprise, future SDD)
  +'async function QP(el){document.querySelectorAll(".bt-q").forEach(function(b){b.classList.remove("on")});el.classList.add("on");WKMODE=true;showDateCol(true);var lg=document.getElementById("lg"),tbl=document.getElementById("tbl");lg.style.display="block";tbl.style.display="none";var h={"Authorization":AUTH.token,"Content-Type":"application/json","userid":AUTH.userId};try{var rule={condition:"and",extraHeaders:null,Countries:[{Abbreviation:"FR",Region:"EU"}],TrtIds:[CFG.trtId],ReferenceNumbers:[],Vins:[],IsScheduled:true,OrderStatus:["ORDER_PLACED","BOOKED"],VehicleStages:null,DeliveryStatus:null,IsContainmentHold:null,IsAmountDueComplete:null,IsInsuranceComplete:null,IsTradeInComplete:null,IsRegistrationComplete:null,IsPaymentComplete:null,MatchStatus:null,DeliveryTypes:null,VehicleType:null,VehicleModels:null,HasOpenCommunication:null,IsEnterpriseOrder:null,VehicleTitles:null,VehicleContainmentHoldTitle:[],VesselNames:[],OpenCaseTypes:[]};var body={condition:"and",rules:[rule],Skip:0,Take:500,SortOrder:[],SelectedColumns:[]};var adv=await fetch(BASE+"/advisor/Dashboard?isSidePanelFullScreen=false",{method:"POST",headers:h,body:JSON.stringify(body)}).then(function(r){return r.json()});var allAdv=adv.Data.Dashboard||[];var now=new Date();var today=new Date(now.getFullYear(),now.getMonth(),now.getDate());var tomorrow=new Date(today.getTime()+864e5);allAdv=allAdv.filter(function(a){if(!a.ScheduledDeliveryDate)return false;var sd=new Date(a.ScheduledDeliveryDate);if(sd<tomorrow||sd.getDay()===0)return false;if(a.IsEnterpriseOrder)return false;if(a.HasHold)return false;var otg=a.VehicleStage==="Finished Goods"||a.VehicleStage==="Arrived at VRL"||(a.VehicleStage&&a.VehicleStage.indexOf("Arrived")>=0);if(!otg)return false;var amtOk=a.AmountDueActionStatus==="Yes"||a.PaymentMethodActionStatus==="COMPLETE";if(!amtOk)return false;var hp=!!(a.LicensePlate&&a.LicensePlate.trim()&&a.LicensePlate.indexOf("-")>=0);if(!hp)return false;if(a.TradeInActionStatus==="COMPLETE_TRADE_IN"||a.TradeInActionStatus==="NO_TRADE_IN"||!a.TradeInActionStatus)return true;return false});if(!allAdv.length){lg.innerHTML="<div style=padding:60px;text-align:center;color:#aaa>No pull-up candidates found.</div>";return}var tiR={};allAdv.forEach(function(a){if(a.TradeInActionStatus==="COMPLETE_TRADE_IN")tiR[a.ReferenceNumber]={ms:"Accepted"}});DATA=allAdv.map(function(a){var sddRaw=a.ScheduledDeliveryDate||"";var sddShort="";var sortKey="";if(sddRaw){var sp=new Date(sddRaw);if(!isNaN(sp)){var fmtSDD=function(sp){var mm=String(sp.getMonth()+1).padStart(2,"0");var dd=String(sp.getDate()).padStart(2,"0");var yy=sp.getFullYear();var hh=sp.getHours();var mi=String(sp.getMinutes()).padStart(2,"0");var ampm=hh>=12?"PM":"AM";var h12=hh%12||12;return mm+"-"+dd+"-"+yy+" "+h12+":"+mi+" "+ampm};sddShort=fmtSDD(sp);sortKey=sp.toISOString()}}var t="?";if(sddRaw){var sp2=new Date(sddRaw);if(!isNaN(sp2)){t=String(sp2.getHours()).padStart(2,"0")+":"+String(sp2.getMinutes()).padStart(2,"0")}}var r=tiR[a.ReferenceNumber];var tms=r?r.ms:"";;var clientName=a.CustomerName;var di=a.DriverInfo;if(a.IsEnterpriseOrder&&di&&di.first_name)clientName=di.first_name+" "+di.last_name+" ("+a.CustomerName+")";var vsShort=a.VehicleStage||"";if(vsShort==="Finished Goods")vsShort="Finished Goods";else if(vsShort.indexOf("Arrived")>=0)vsShort="Arrived at VRL";return{rn:a.ReferenceNumber,name:clientName,t:t,date:sortKey,sdd:sddShort,sddRaw:sddRaw,model:a.VehicleModel,color:a.VehicleColor||"",plate:(a.LicensePlate||"").trim(),regTxt:"OK",regOk:true,host:a.DeliverySpecialist||"?",b2b:false,hp:true,hold:false,io:a.InsuranceActionStatus==="COMPLETE",otg:true,vs:vsShort,al:[],tims:tms,amtOk:true}}).sort(function(a,b){return(a.date+a.t).localeCompare(b.date+b.t)});RW();var N=DATA.length;var asOk=DATA.filter(function(d){return d.io}).length;document.getElementById("sT").textContent=N;document.getElementById("sT").className="sn b";document.getElementById("sO").textContent=N;document.getElementById("sO").className="sn g";document.getElementById("sA").textContent=0;document.getElementById("sA").className="sn x";document.getElementById("sP").innerHTML="<div class=top>"+N+"</div><div class=div>"+N+"</div>";document.getElementById("sOTG").innerHTML="<div class=top>"+N+"</div><div class=div>"+N+"</div>";document.getElementById("sPl").innerHTML="<div class=top>"+N+"</div><div class=div>"+N+"</div>";document.getElementById("sTI").innerHTML="<div class=top>"+DATA.filter(function(d){return d.tims}).length+"</div><div class=div>"+DATA.filter(function(d){return d.tims}).length+"</div>";document.getElementById("sAs").innerHTML="<div class=top>"+asOk+"</div><div class=div>"+N+"</div>";lg.style.display="none";tbl.style.display="";TR();document.getElementById("sa").checked=true;UC()}catch(err){lg.innerHTML="<div style=padding:60px;text-align:center;color:#c00>Error: "+err.message+"</div>"}}'

  +'function ND(dir){var sel=document.getElementById("dt");var ni=sel.selectedIndex+dir;if(ni>=0&&ni<sel.options.length){sel.selectedIndex=ni;document.querySelectorAll(".bt-q").forEach(function(b){b.classList.remove("on")});WKMODE=false;showDateCol(false);L()}}'
  +'function RST(){document.querySelectorAll(".fi").forEach(function(f){if(f.tagName==="SELECT")f.selectedIndex=0;else f.value=""});document.getElementById("srch").value="";document.querySelectorAll(".bt-q").forEach(function(b){b.classList.remove("on")});document.querySelectorAll(".pill").forEach(function(p){p.classList.remove("on")});document.querySelector(".pill").classList.add("on");document.getElementById("dt").selectedIndex=0;WKMODE=false;showDateCol(false);L()}'

  +'var WKMODE=false;'
  +'function showDateCol(show){document.getElementById("thDate").style.display=show?"table-cell":"none";document.querySelectorAll(".dtc").forEach(function(c){c.style.display=show?"table-cell":"none"})}'

  +'function SA(el){document.querySelectorAll(".rc").forEach(function(c){if(c.closest("tr").style.display!=="none")c.checked=el.checked})}'

  +'async function L(){'
  +'var lg=document.getElementById("lg"),tbl=document.getElementById("tbl"),tb=document.getElementById("tb");'
  +'lg.style.display="block";tbl.style.display="none";'
  +'var h={"Authorization":AUTH.token,"Content-Type":"application/json","userid":AUTH.userId};'
  +'var ds=document.getElementById("dt").value;'
  +'try{'
  +'var dash=await fetch(BASE+"/deliveryops/Customers/Dashboard",{method:"POST",headers:h,body:JSON.stringify({fromDeliveryDate:ds,trtId:CFG.trtId,customerHasNoHost:false,skip:0,take:200,fromTime:"00:00",toTime:"23:59",countryCode:CFG.cc,onlyMyLocation:true,sort:{},stage:[],status:[],deliveryType:[],paperwork:[],customerDeliveryStatus:[],inboundStatus:[],VehicleTypes:[],pdcFilter:[],dmvDocumentStages:[]})}).then(function(r){return r.json()});'
  +'var dm={};dash.Data.forEach(function(d){dm[d.ReferenceNumber]=d});var rns=Object.keys(dm);'
  +'if(!rns.length){lg.innerHTML="<div style=padding:60px;text-align:center;color:#aaa>No deliveries found.</div>";return}'
  +'var adv=await fetch(BASE+"/advisor/Dashboard?isSidePanelFullScreen=true",{method:"POST",headers:h,body:JSON.stringify({condition:"and",rules:[{condition:"and",ReferenceNumbers:rns,Countries:[]}],Skip:0,Take:200,SortOrder:[],SelectedColumns:[]})}).then(function(r){return r.json()});'
  +'var tiC=adv.Data.Dashboard.filter(function(a){return a.TradeInActionStatus==="COMPLETE_TRADE_IN"});'
  +'var tiR={};await Promise.all(tiC.map(function(a){return fetch(BASE+"/widget/GetTradeInWidgetInfo?referenceNumber="+a.ReferenceNumber+"&vehicleMapId="+a.VehicleMapId+"&deliveryState="+encodeURIComponent(a.DeliveryState||""),{headers:h}).then(function(r){return r.json()}).then(function(j){if(j.Data)tiR[a.ReferenceNumber]={ms:j.Data.AMPStatusFromC360||j.Data.AcquisitionMilestone||""}}).catch(function(){})}));'
  +'var regR={};var plated=adv.Data.Dashboard.filter(function(a){return a.LicensePlate&&a.LicensePlate.indexOf("-")>=0});await Promise.all(plated.map(function(a){return fetch(BASE+"/widget/GetGlobalRegistrationInfo?referenceNumber="+a.ReferenceNumber+"&vin="+(a.Vin||"")+"&countryCode=FR&registrationState="+encodeURIComponent(a.RegistrationState||""),{headers:h}).then(function(r){return r.json()}).then(function(j){if(j.Data)regR[a.ReferenceNumber]=j.Data.RegistrationStatusId}).catch(function(){})}));'
  +'DATA=adv.Data.Dashboard.map(function(a){var d=dm[a.ReferenceNumber]||{};var dt=d.ScheduledDeliveryStartDateString||"";var t="?",m=dt.match(/(\\d{1,2}):(\\d{2})\\s*(AM|PM)/i);if(m){var hr=parseInt(m[1]);if(m[3].toUpperCase()==="PM"&&hr<12)hr+=12;if(m[3].toUpperCase()==="AM"&&hr===12)hr=0;t=String(hr).padStart(2,"0")+":"+m[2]}var hp=!!(a.LicensePlate&&a.LicensePlate.trim()&&a.LicensePlate.indexOf("-")>=0);var regId=regR[a.ReferenceNumber];var regOk=hp&&regId===4;var regTxt="Pending";if(hp){if(regId===4)regTxt="OK";else if(regId===8)regTxt="RTS";else if(regId===-1)regTxt="On Hold";else if(regId===1||regId===2||regId===3)regTxt="In Progress"}var hold=!!a.HasHold;var io=a.InsuranceActionStatus==="COMPLETE";var otg=a.VehicleStage==="Finished Goods"||a.VehicleStage==="Arrived at VRL"||(a.VehicleStage&&a.VehicleStage.indexOf("Arrived")>=0);var amtOk=a.AmountDueActionStatus==="Yes"||a.PaymentMethodActionStatus==="COMPLETE";var al=[];if(!regOk)al.push("P");if(!otg)al.push("O");if(!amtOk)al.push("$");if(hold)al.push("H");var r=tiR[a.ReferenceNumber];var tms=r?r.ms:"";;var clientName=a.CustomerName;var di=a.DriverInfo;if(a.IsEnterpriseOrder&&di&&di.first_name)clientName=di.first_name+" "+di.last_name+" ("+a.CustomerName+")";var vsShort=a.VehicleStage||"";if(vsShort==="Finished Goods")vsShort="Finished Goods";else if(vsShort.indexOf("Receiving")>=0)vsShort="Receiving Insp.";else if(vsShort.indexOf("Transit")>=0)vsShort="In Transit";else if(vsShort.indexOf("PDI")>=0)vsShort="PDI Pending";else if(vsShort.indexOf("Ready")>=0)vsShort="Ready for Prep";else if(vsShort.indexOf("Wash")>=0||vsShort.indexOf("Charge")>=0)vsShort="Wash/Charge";else if(vsShort.indexOf("Service")>=0)vsShort="In Service";else if(vsShort.indexOf("garage")>=0)vsShort="Delivered";return{rn:a.ReferenceNumber,name:clientName,t:t,date:ds,sdd:"",model:a.VehicleModel,color:a.VehicleColor||"",plate:(a.LicensePlate||"").trim(),regTxt:regTxt,regOk:regOk,host:d.HostName||"?",hostId:d.HostId||null,b2b:a.IsEnterpriseOrder,hp:hp,hold:hold,io:io,otg:otg,vs:vsShort,al:al,used:a.VehicleTitleStatus==="USED",tims:tms,hasTI:!!(a.TradeInActionStatus&&a.TradeInActionStatus!=="NO_TRADE_IN"),amtOk:amtOk}}).sort(function(a,b){return a.t.localeCompare(b.t)});'
  +'RW();'
  +'var ok=DATA.filter(function(d){return d.al.length===0}).length;'
  +'var pOk=DATA.filter(function(d){return d.amtOk}).length;'
  +'var oOk=DATA.filter(function(d){return d.otg}).length;'
  +'var plOk=DATA.filter(function(d){return d.regOk}).length;'
  +'var tiOk=DATA.filter(function(d){return d.tims&&(d.tims.indexOf("Approved")>=0||d.tims.indexOf("Received")>=0)}).length;'
  +'var tiTotal=DATA.filter(function(d){return d.tims}).length;'
  +'var asOk=DATA.filter(function(d){return d.io}).length;'
  +'document.getElementById("sT").textContent=DATA.length;document.getElementById("sT").className="sn b";'
  +'document.getElementById("sO").textContent=ok;document.getElementById("sO").className="sn"+(ok>0?" g":" x");'
  +'document.getElementById("sA").textContent=DATA.length-ok;document.getElementById("sA").className="sn"+((DATA.length-ok)>0?" r":" x");'
  +'var N=DATA.length;'
  +'document.getElementById("sP").innerHTML="<div class=top>"+pOk+"</div><div class=div>"+N+"</div>";'
  +'document.getElementById("sOTG").innerHTML="<div class=top>"+oOk+"</div><div class=div>"+N+"</div>";'
  +'document.getElementById("sPl").innerHTML="<div class=top>"+plOk+"</div><div class=div>"+N+"</div>";'
  +'document.getElementById("sTI").innerHTML="<div class=top>"+tiOk+"</div><div class=div>"+tiTotal+"</div>";'
  +'document.getElementById("sAs").innerHTML="<div class=top>"+asOk+"</div><div class=div>"+N+"</div>";'
  +'lg.style.display="none";tbl.style.display="";TR();'
  +'document.getElementById("sa").checked=true;'
  +'document.getElementById("upd").textContent="Updated at: "+new Date().toLocaleString("en-US",{month:"2-digit",day:"2-digit",hour:"numeric",minute:"2-digit",hour12:true});'
  +'UC();'
  +'}catch(err){lg.innerHTML="<div style=padding:60px;text-align:center;color:#c00>Error: "+err.message+"</div>"}}'

  +'function RW(){var tb=document.getElementById("tb");var out="";for(var i=0;i<DATA.length;i++){var d=DATA[i];var vc=d.otg?"dg":(d.vs.indexOf("Transit")>=0?"do":"dr");var rc=d.regOk?"<span class=\\"dt dg\\"></span>OK":d.regTxt==="On Hold"?"<span class=\\"dt dr\\"></span><b style=color:#c00>On Hold</b>":d.regTxt==="RTS"?"<span class=\\"dt do\\"></span>RTS":d.regTxt==="Pending"?"<span class=\\"dt do\\"></span>Pending":"<span class=su>"+d.regTxt+"</span>";var tiOk=d.tims&&(d.tims.indexOf("Approved")>=0||d.tims.indexOf("Received")>=0);var tc=d.tims?(tiOk?"<span class=\\"dt dg\\"></span>"+d.tims:"<span class=\\"dt do\\"></span>"+d.tims):"<span class=su>No</span>";out+="<tr class=\\""+(d.al.length?"w":"")+"\\" data-host=\\""+d.host+"\\"><td><input type=checkbox class=\\"ck rc\\" data-i="+i+" "+(d.al.length===0?"checked":"")+"></td><td class=dtc>"+(d.sdd||"")+"</td><td>"+d.t+"</td><td><span class=nm>"+d.name+"</span></td><td><a class=rl href=\\"https://dro.tesla.com/advisor?sidepanel_fullscreen=yes&rn="+d.rn+"\\" target=_blank>"+d.rn+"</a></td><td>"+d.model+"</td><td>"+rc+"</td><td>"+(d.amtOk?"<span class=\\"dt dg\\"></span>OK":"<span class=\\"dt dr\\"></span>No")+"</td><td>"+tc+"</td><td><span class=\\"dt "+vc+"\\"></span>"+d.vs+"</td><td>"+(d.hold?"<span class=\\"dt dr\\"></span><b style=color:#c00>Hold</b>":"<span class=\\"dt dg\\"></span>OK")+"</td><td>"+(d.io?"<span class=\\"dt dg\\"></span>OK":"<span class=su>No</span>")+"</td><td><button onclick=\\"P1("+i+",this)\\" style=\\"padding:4px 10px;border:1px solid #ddd;border-radius:4px;cursor:pointer;background:#fff;font-size:11px;display:flex;align-items:center;gap:4px\\" title=\\"Print\\"><svg width=14 height=14 viewBox=\\"0 0 24 24\\" fill=none stroke=\\"#393c41\\" stroke-width=2><path d=\\"M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2\\"/><rect x=6 y=14 width=12 height=8 rx=1/></svg></button></td></tr>"}tb.innerHTML=out;if(WKMODE)showDateCol(true);fetch("http://localhost:3000/api/print/status").then(function(r){return r.json()}).then(function(ps){document.querySelectorAll("#tb tr").forEach(function(r){var ci=r.querySelector(".rc");if(!ci)return;var d=DATA[parseInt(ci.dataset.i)];if(d&&ps[d.rn]){var btn=r.querySelector("button");if(btn){btn.innerHTML="<svg width=14 height=14 viewBox=\\"0 0 24 24\\" fill=none stroke=\\"#28a745\\" stroke-width=2><path d=\\"M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2\\"/><rect x=6 y=14 width=12 height=8 rx=1/></svg>";btn.style.border="1px solid #28a745";btn.style.background="#f0fff0";btn.title="Reprint"}}})}).catch(function(){})}'

  +'function G(){var checks=[];document.querySelectorAll(".rc:checked").forEach(function(el){var tr=el.closest("tr");if(tr&&tr.style.display!=="none"){var i=parseInt(el.dataset.i);if(DATA[i])checks.push(i)}});if(!checks.length){alert("No deliveries selected!");return}if(!confirm("Print "+checks.length+" deliveries?"))return;var idx=0;function next(){if(idx>=checks.length)return;var i=checks[idx];var btn=document.querySelectorAll("#tb tr")[i]?.querySelector("button");if(btn){btn.scrollIntoView({block:"center"});P1(i,btn)}idx++;setTimeout(next,2000)}next()}'

  +'async function DISPATCH(){var allHosts=[{name:"Ben Daubin",id:"428058"},{name:"Sacha Villa",id:"399921"},{name:"Sophie MACE",id:"444287"}];if(!DATA.length){alert("No deliveries!");return}var modal=document.createElement("div");modal.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:100;display:flex;align-items:center;justify-content:center";var box=document.createElement("div");box.style.cssText="background:#fff;border-radius:8px;padding:32px;min-width:400px;box-shadow:0 8px 32px rgba(0,0,0,.2)";var dispDate=document.getElementById("dt");var dispLabel=dispDate.options[dispDate.selectedIndex].text;box.innerHTML="<h2 style=margin-bottom:20px;font-size:20px>Smart Dispatch</h2><p style=margin-bottom:4px;font-size:15px;font-weight:600;color:#3e6ae1>"+dispLabel+"</p><p style=margin-bottom:16px;color:#666>Who is on the floor?</p>"+allHosts.map(function(h,i){return"<label style=display:block;padding:8px;font-size:14px;cursor:pointer><input type=checkbox checked id=dh"+i+" style=margin-right:10px;width:16px;height:16px;accent-color:#3e6ae1> "+h.name+"</label>"}).join("")+"<p style=margin:16px 0 8px;color:#666>Admin:</p>"+allHosts.map(function(h,i){return"<label style=display:block;padding:4px;font-size:13px;color:#999;cursor:pointer><input type=radio name=adm value="+i+" id=da"+i+" style=margin-right:8px> "+h.name+"</label>"}).join("")+"<label style=display:block;padding:4px;font-size:13px;color:#999;cursor:pointer><input type=radio name=adm value=-1 checked style=margin-right:8px> No admin</label><div style=display:flex;gap:8px;margin-top:24px><button id=dgo style=flex:1;padding:10px;background:#3e6ae1;color:#fff;border:none;border-radius:4px;font-size:14px;font-weight:600;cursor:pointer>Preview Dispatch</button><button id=dno style=flex:1;padding:10px;background:#fff;color:#393c41;border:1px solid #ddd;border-radius:4px;font-size:14px;cursor:pointer>Cancel</button></div>";modal.appendChild(box);document.body.appendChild(modal);document.getElementById("dno").onclick=function(){modal.remove()};document.getElementById("dgo").onclick=function(){var floor=[];allHosts.forEach(function(h,i){var adm=document.querySelector("input[name=adm]:checked");if(adm&&parseInt(adm.value)===i)return;if(document.getElementById("dh"+i).checked)floor.push(h)});if(!floor.length){alert("Select at least 1 CES!");return}var ent=[],used=[],ti=[],reg=[];DATA.forEach(function(d){if(d.b2b)ent.push(d);else if(d.used)used.push(d);else if(d.tims)ti.push(d);else reg.push(d)});var assign={};floor.forEach(function(h){assign[h.id]={host:h,items:[],ent:0,used:0,ti:0}});var rr=function(arr,cat){arr.forEach(function(d){var best=null,min=999;floor.forEach(function(h){var c=assign[h.id];var v=cat?c[cat]:c.items.length;if(v<min){min=v;best=h}});assign[best.id].items.push(d);if(cat)assign[best.id][cat]++})};rr(ent,"ent");rr(used,"used");rr(ti,"ti");rr(reg,null);var preview="<h2 style=margin-bottom:16px;font-size:20px>Dispatch Preview</h2><table style=width:100%;border-collapse:collapse;font-size:13px><tr style=border-bottom:2px solid #e0e0e0><th style=padding:8px;text-align:left>CES</th><th>Total</th><th>Enterprise</th><th>Used</th><th>Trade-In</th><th>Regular</th></tr>";floor.forEach(function(h){var a=assign[h.id];var regC=a.items.length-a.ent-a.used-a.ti;preview+="<tr style=border-bottom:1px solid #f0f0f0><td style=padding:8px;font-weight:600>"+h.name+"</td><td style=text-align:center;font-weight:700>"+a.items.length+"</td><td style=text-align:center>"+a.ent+"</td><td style=text-align:center>"+a.used+"</td><td style=text-align:center>"+a.ti+"</td><td style=text-align:center>"+regC+"</td></tr>"});preview+="</table><div style=max-height:300px;overflow:auto;margin-top:16px;border:1px solid #e0e0e0;border-radius:4px><table style=width:100%;border-collapse:collapse;font-size:12px><tr style=background:#fafafa><th style=padding:6px;text-align:left>Time</th><th style=text-align:left>Customer</th><th style=text-align:left>RN</th><th style=text-align:left>Type</th><th style=text-align:left>Host</th></tr>";floor.forEach(function(h){assign[h.id].items.sort(function(a,b){return a.t.localeCompare(b.t)}).forEach(function(d){var tp=d.b2b?"Enterprise":(d.tims?"Trade-In":"Regular");preview+="<tr style=border-bottom:1px solid #f5f5f5><td style=padding:4px 6px>"+d.t+"</td><td>"+d.name+"</td><td style=color:#3e6ae1>"+d.rn+"</td><td>"+tp+"</td><td style=font-weight:600>"+h.name.split(" ")[0]+"</td></tr>"})});preview+="</table></div><div style=display:flex;gap:8px;margin-top:20px><button id=dex style=flex:1;padding:10px;background:#28a745;color:#fff;border:none;border-radius:4px;font-size:14px;font-weight:600;cursor:pointer>Execute Dispatch</button><button id=dca style=flex:1;padding:10px;background:#fff;color:#393c41;border:1px solid #ddd;border-radius:4px;font-size:14px;cursor:pointer>Cancel</button></div>";box.innerHTML=preview;document.getElementById("dca").onclick=function(){modal.remove()};document.getElementById("dex").onclick=async function(){document.getElementById("dex").textContent="Dispatching...";document.getElementById("dex").disabled=true;var ok=0,fail=0;for(var hi=0;hi<floor.length;hi++){var a=assign[floor[hi].id];for(var di=0;di<a.items.length;di++){try{if(a.items[di].hostId&&a.items[di].hostId==floor[hi].id){ok++;continue}var r=await fetch(BASE+"/deliveryops/Customers/UpdateHost?referenceNumber="+a.items[di].rn+"&value="+floor[hi].id,{method:"POST",headers:{"Authorization":AUTH.token,"Content-Type":"application/json","userid":AUTH.userId}});if(r.ok)ok++;else fail++}catch(e){fail++}}}modal.remove();alert("Dispatch complete!\\n"+ok+" OK / "+fail+" errors");L()}}}'

  +'function P1(i,btn){var d=DATA[i];if(!d)return;btn.innerHTML="<svg width=14 height=14 viewBox=\\"0 0 24 24\\" fill=none stroke=\\"#999\\" stroke-width=2 style=\\"animation:spin 1s linear infinite\\"><circle cx=12 cy=12 r=10 stroke-dasharray=31 stroke-dashoffset=10/></svg>";btn.disabled=true;var ds=document.getElementById("dt").value;var ti=d.tims?[d.rn]:[];var b2b=d.b2b?[d.rn]:[];var chain=Promise.resolve();if(ti.length||b2b.length){chain=fetch("http://localhost:3000/api/print/docgen",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tiRNs:ti,b2bRNs:b2b})}).then(function(r){return r.json()})}chain.then(function(docResult){return fetch("http://localhost:3000/api/print/send/"+d.rn,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({date:ds,b2b:!!d.b2b})})}).then(function(r){return r.json()}).then(function(j){if(j.ok){btn.innerHTML="<svg width=14 height=14 viewBox=\\"0 0 24 24\\" fill=none stroke=\\"#28a745\\" stroke-width=2><path d=\\"M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2\\"/><rect x=6 y=14 width=12 height=8 rx=1/></svg>";btn.style.border="1px solid #28a745";btn.style.background="#f0fff0";var t=j.printed+" docs sent";if(j.warnings&&j.warnings.length){t+=" | ! "+j.warnings.join(", ");btn.style.border="1px solid #e65100";btn.style.background="#fff3e0"}btn.title=t;btn.disabled=false}else{throw new Error(j.error)}}).catch(function(e){btn.innerHTML="ERR";btn.style.color="#c00";btn.title=e.message;btn.disabled=false})}'
  +'var sortDir={};function SO(k){sortDir[k]=!sortDir[k];DATA.sort(function(a,b){var v=sortDir[k]?1:-1;return(a[k]||"").toString().localeCompare((b[k]||"").toString())*v});RW()}'

  +'function CHKAUTH(){fetch("http://localhost:3000/api/auth/status").then(function(r){return r.json()}).then(function(j){var dd=document.getElementById("dotDro");var dg=document.getElementById("dotDg");if(dd)dd.style.background=j.hasDro?"#28a745":"#dc3545";if(dg)dg.style.background=j.hasDocgen?"#28a745":"#f0ad4e";var b=document.getElementById("docgenBtn");if(j.hasDocgen){b.style.border="1px solid #28a745";b.style.background="#f8fff8"}else{b.style.border="1px solid #f0ad4e";b.style.background="#fffdf5"}}).catch(function(){})}'
  +'function LOGINDG(){var b=document.getElementById("docgenBtn");var dg=document.getElementById("dotDg");if(dg)dg.style.background="#f0ad4e";b.style.opacity="0.6";fetch("http://localhost:3000/api/auth/login-docgen").then(function(r){return r.json()}).then(function(j){b.style.opacity="1";if(j.ok){if(dg)dg.style.background="#28a745";b.style.border="1px solid #28a745";b.style.background="#f8fff8"}else{if(dg)dg.style.background="#dc3545"}}).catch(function(){b.style.opacity="1";if(dg)dg.style.background="#dc3545"})}'
  +'setTimeout(CHKAUTH,2000);'

  +'document.getElementById("srch").oninput=function(){var q=this.value.toLowerCase();document.querySelectorAll("#tb tr").forEach(function(r){r.style.display=r.textContent.toLowerCase().indexOf(q)>=0?"":"none"});TR()};'

  +'function SF(t,el){document.querySelectorAll(".si").forEach(function(s){s.classList.remove("on")});el.classList.add("on");document.querySelectorAll("#tb tr").forEach(function(r){if(t==="all"){r.style.display=""}else if(t==="ok"){r.style.display=r.classList.contains("w")?"none":""}else{r.style.display=r.classList.contains("w")?"":"none"}});TR()}'

  +'var activeFilter=null;'
  +'function SFR(f,el){document.querySelectorAll(".si").forEach(function(s){s.classList.remove("on")});if(activeFilter===f){activeFilter=null;document.querySelectorAll("#tb tr").forEach(function(r){r.style.display=""});el.parentElement.parentElement.querySelector(".si").classList.add("on");TR();return}activeFilter=f;el.classList.add("on");document.querySelectorAll("#tb tr").forEach(function(r){var i=parseInt(r.querySelector(".rc")?.dataset.i);if(isNaN(i))return;var d=DATA[i];var show=false;if(f==="pay")show=!d.amtOk;else if(f==="otg")show=!d.otg;else if(f==="reg")show=!d.regOk;else if(f==="ti")show=d.tims&&!(d.tims.indexOf("Approved")>=0||d.tims.indexOf("Received")>=0);else if(f==="ins")show=!d.io;r.style.display=show?"":"none"});TR()}'

  +'function CF(){var fils=document.querySelectorAll(".fi");document.querySelectorAll("#tb tr").forEach(function(r){var cells=r.querySelectorAll("td");var show=true;fils.forEach(function(f,i){var v=f.value.toLowerCase();if(!v)return;var cell=cells[i+1];if(!cell)return;var txt=cell.textContent.toLowerCase();if(txt.indexOf(v)<0)show=false});r.style.display=show?"":"none"});TR()}'

  +'function TR(){var v=0;document.querySelectorAll("#tb tr").forEach(function(r){if(r.style.display!=="none")v++});document.getElementById("trec").textContent="Total Records: "+v}'
  +'function US(){var tot=0,ok=0,al=0;document.querySelectorAll("#tb tr").forEach(function(r){if(r.style.display==="none")return;tot++;if(r.classList.contains("w"))al++;else ok++});document.getElementById("sT").textContent=tot;document.getElementById("sO").textContent=ok;document.getElementById("sA").textContent=al}'
  +'function UC(){document.getElementById("cAll").textContent=DATA.length;CES.forEach(function(c,i){var n=DATA.filter(function(d){return(d.host||"").toLowerCase().indexOf(c.split(" ")[0].toLowerCase())>=0}).length;document.getElementById("c"+i).textContent=n})}'
  +'L();'

  +'</scr'+'ipt></body></html>');
  w.document.close();
})();
