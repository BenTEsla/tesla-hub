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
  fetch(SERVER+'/api/auth/tokens',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({droToken:at,userId:ui})}).catch(function(){});setInterval(function(){var tk2=(localStorage.getItem('delops_id_token')||'').replace(/^"|"$/g,'');var t22=(localStorage.getItem('delops_id_token_data')||'').replace(/^"|"$/g,'');var at2=tk2&&tk2.length>100?tk2:t22&&t22.length>100?t22:null;if(at2)fetch(SERVER+'/api/auth/tokens',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({droToken:at2,userId:ui})}).catch(function(){})},45*60*1000);

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
  +'body{font-family:UST,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#e4e4e7;background:#0f0f13;font-size:13px;line-height:1.4}'

  // TITLE
  +'.title-row{padding:20px 32px 0;display:flex;align-items:center}'
  +'.ttl{font-size:36px;font-weight:500;color:#f4f4f5;line-height:44px;margin-top:10px}'

  // TABS
  +'.tabs{display:inline-flex;margin:20px 32px;padding:4px;gap:4px;background:rgba(255,255,255,.06);border-radius:8px;border:1px solid rgba(255,255,255,.08)}'
  +'.tab{padding:6px 22px;font-size:13px;color:#71717a;cursor:pointer;font-weight:500;border-radius:6px;height:34px;display:flex;align-items:center;border:none;background:none;font-family:inherit;transition:all .15s}'
  +'.tab:hover{color:#d4d4d8;background:rgba(255,255,255,.04)}'
  +'.tab.on{color:#fff;background:rgba(59,130,246,.15);box-shadow:0 0 12px rgba(59,130,246,.15);border:1px solid rgba(59,130,246,.25)}'

  // STATS
  +'.srow{display:flex;gap:12px;margin:20px 32px 20px;align-items:stretch}'
  +'.sb{display:inline-flex;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);backdrop-filter:blur(12px)}'
  +'.si{display:flex;flex-direction:column;align-items:center;padding:18px 24px 12px;cursor:pointer;transition:all .15s;position:relative;min-width:100px;height:110px}'
  +'.si:not(:last-child)::after{content:"";position:absolute;right:0;top:16px;bottom:16px;width:1px;background:rgba(255,255,255,.08)}'
  +'.si:hover{background:rgba(255,255,255,.04)}'
  +'.si.on{background:rgba(59,130,246,.08)}'
  +'.sn{font-size:26px;font-weight:600;line-height:1;color:#3b82f6;margin-top:8px}'
  +'.sn.g{color:#22c55e}.sn.r{color:#ef4444}.sn.b{color:#3b82f6}'
  +'.sl{font-size:12px;color:#71717a;margin-top:auto;text-align:center;line-height:1.3}'
  +'.sf{text-align:center;line-height:1;margin-top:4px}'
  +'.sf .top{font-size:20px;font-weight:700;color:#e4e4e7}'
  +'.sf .div{font-size:18px;font-weight:400;color:#3f3f46;border-top:1px solid rgba(255,255,255,.08);margin-top:3px;padding-top:3px}'

  // FILTERS
  +'.toolbar{padding:0 32px 16px;display:flex;align-items:flex-end;gap:10px;flex-wrap:wrap}'
  +'.fg{display:flex;flex-direction:column;gap:3px}'
  +'.fl{font-size:10px;color:#71717a;font-weight:600;text-transform:uppercase;letter-spacing:.5px}'
  +'.fi2{padding:7px 12px;border:1px solid rgba(255,255,255,.1);border-radius:8px;font-size:13px;font-family:inherit;color:#e4e4e7;outline:none;background:rgba(255,255,255,.04)}'
  +'.fi2:focus{border-color:#3b82f6}'

  // BUTTONS
  +'.bt{padding:7px 18px;border-radius:8px;font-size:12px;font-family:inherit;font-weight:600;cursor:pointer;border:1px solid rgba(255,255,255,.1);transition:all .15s;background:rgba(255,255,255,.05);color:#d4d4d8}'
  +'.bt:hover{background:rgba(255,255,255,.1);border-color:rgba(255,255,255,.15)}'
  +'.bt-p{background:rgba(59,130,246,.15);color:#60a5fa;border-color:rgba(59,130,246,.3)}.bt-p:hover{background:rgba(59,130,246,.25)}'
  +'.bt-r{background:rgba(239,68,68,.15);color:#f87171;border-color:rgba(239,68,68,.3)}.bt-r:hover{background:rgba(239,68,68,.25)}'
  +'.bt-q{background:rgba(255,255,255,.04);color:#a1a1aa;border:1px solid rgba(255,255,255,.08);padding:7px 14px;font-size:12px;border-radius:8px;cursor:pointer;font-family:inherit;font-weight:500;transition:all .15s}'
  +'.bt-q:hover{background:rgba(255,255,255,.08);color:#d4d4d8}'
  +'.bt-q.on{background:rgba(59,130,246,.15);color:#60a5fa;border-color:rgba(59,130,246,.3)}'
  +'.bt-nav{background:rgba(255,255,255,.04);color:#a1a1aa;border:1px solid rgba(255,255,255,.08);padding:7px 10px;font-size:14px;border-radius:8px;cursor:pointer;font-family:inherit;line-height:1}'
  +'.bt-nav:hover{background:rgba(255,255,255,.08)}'
  +'.bt-green{background:rgba(34,197,94,.15)!important;color:#22c55e!important;border-color:rgba(34,197,94,.3)!important}'
  +'.bt-blue{background:rgba(59,130,246,.15)!important;color:#60a5fa!important;border-color:rgba(59,130,246,.3)!important}'
  +'.bt-red{background:rgba(239,68,68,.15)!important;color:#f87171!important;border-color:rgba(239,68,68,.3)!important}'

  // TABLE
  +'.tw{padding:0 32px 24px}'
  +'.tcard{background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.06);border-radius:12px;overflow:hidden}'
  +'table{width:100%;border-collapse:collapse}'
  +'th{padding:10px 12px;text-align:left;font-size:11px;color:#71717a;font-weight:600;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02);cursor:pointer;user-select:none;white-space:nowrap;position:sticky;top:0;z-index:10;text-transform:uppercase;letter-spacing:.3px}'
  +'th:hover{color:#a1a1aa}'
  +'td{padding:8px 12px;font-size:13px;border-bottom:1px solid rgba(255,255,255,.04);vertical-align:middle;color:#d4d4d8;height:42px;white-space:nowrap}'
  +'tr:hover td{background:rgba(255,255,255,.03)}'
  +'tr.w td{background:rgba(239,68,68,.06)}'
  +'tr.w:hover td{background:rgba(239,68,68,.1)}'
  +'tr:nth-child(even) td{background:rgba(255,255,255,.015)}'

  // FILTER INPUTS
  +'.fi{width:100%;padding:4px 6px;margin-top:4px;border:1px solid rgba(255,255,255,.1);border-radius:6px;font-size:11px;font-family:inherit;color:#d4d4d8;background:rgba(255,255,255,.04);outline:none;box-sizing:border-box;font-weight:400}'
  +'.fi:focus{border-color:#3b82f6}'
  +'.fi option{background:#1c1c22;color:#d4d4d8}'

  // ELEMENTS
  +'.ck{width:16px;height:16px;cursor:pointer;-webkit-appearance:none;appearance:none;border:1.5px solid #3f3f46;border-radius:4px;background:transparent;position:relative;vertical-align:middle}'
  +'.ck:checked{background:#3b82f6;border-color:#3b82f6}'
  +'.ck:checked::after{content:"";position:absolute;left:4px;top:1px;width:5px;height:8px;border:solid #fff;border-width:0 2px 2px 0;transform:rotate(45deg)}'
  +'.dt{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:6px;vertical-align:middle}'
  +'.dg{background:#22c55e}.dr{background:#ef4444}.do{background:#f59e0b}'
  +'.nm{font-weight:600;color:#f4f4f5;font-size:13px}'
  +'.su{font-size:12px;color:#52525b}'
  +'.rl{color:#60a5fa;text-decoration:none;font-size:12px;font-weight:500}'
  +'.rl:hover{text-decoration:underline;color:#93bbfd}'

  // LOADING
  +'.spinner{width:44px;height:44px;border:3px solid rgba(255,255,255,.08);border-top-color:#3b82f6;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto}'
  +'@keyframes spin{to{transform:rotate(360deg)}}'
  +'.ft{padding:10px 12px;font-size:12px;color:#52525b}'
  +'.hid{display:none}'
  +'.dtc{display:none;font-size:12px;font-weight:600;color:#60a5fa}'
  +'::-webkit-scrollbar{width:8px;height:8px}'
  +'::-webkit-scrollbar-track{background:transparent}'
  +'::-webkit-scrollbar-thumb{background:rgba(255,255,255,.12);border-radius:4px}'
  +'::-webkit-scrollbar-thumb:hover{background:rgba(255,255,255,.2)}'
  +'</style></head><body>'

  // TITLE
  +'<div class="title-row"><div class="ttl">Delivery Dashboard</div><div style="margin-left:auto;display:flex;flex-direction:column;align-items:flex-end;gap:2px"><button id="docgenBtn" onclick="LOGINDG()" style="font-size:12px;display:inline-flex;align-items:center;gap:8px;cursor:pointer;padding:6px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.04);color:#a1a1aa;font-family:inherit;font-weight:500"><span id="dotDro" style="width:8px;height:8px;border-radius:50%;background:#3f3f46;display:inline-block"></span>DRO<span id="dotDg" style="width:8px;height:8px;border-radius:50%;background:#3f3f46;display:inline-block"></span>DocGen</button><div id="upd" style="font-size:11px;color:#52525b;margin-top:4px"></div></div></div>'
  +'<div class="tabs"><button class="tab on" onclick="STAB(0,this)">Customer Delivery</button><button class="tab" onclick="STAB(1,this)">Arrivals</button><button class="tab" onclick="STAB(2,this)">Stock</button><button class="tab" onclick="STAB(3,this)">Trade-In</button><button class="tab" onclick="STAB(4,this)">CSAT</button></div>'
  +'<div id="mainView">'

  // STATS - Block 1: Overview | Block 2: Readiness | Block 3: CES
  +'<div class="srow">'
  +'<div class="sb">'
  +'<div class="si on" onclick="SF(\'all\',this)"><div class="sn" id="sT">-</div><div class="sl">Deliveries</div></div>'
  +'<div class="si" onclick="SF(\'ok\',this)"><div class="sn g" id="sO">-</div><div class="sl">Ready</div></div>'
  +'<div class="si" onclick="SF(\'al\',this)"><div class="sn r" id="sA">-</div><div class="sl">Not Ready</div></div>'
  +'</div>'
  +'<div class="sb">'
  +'<div class="si" onclick="SFR(\'pay\',this)"><div id="sP" class="sf"><div class="top">0</div><div class="div">0</div></div><div class="sl">Payment</div></div>'

  +'<div class="si" onclick="SFR(\'reg\',this)"><div id="sPl" class="sf"><div class="top">0</div><div class="div">0</div></div><div class="sl">Registration</div></div>'
  +'<div class="si" onclick="SFR(\'ti\',this)"><div id="sTI" class="sf"><div class="top">0</div><div class="div">0</div></div><div class="sl">Approved<br>for Intake</div></div>'
  +'<div class="si" onclick="SFR(\'ins\',this)"><div id="sAs" class="sf"><div class="top">0</div><div class="div">0</div></div><div class="sl">Insurance</div></div>'
  +'</div>'
  +'<div class="sb">'
  +'<div class="si" onclick="SFV(\'transit\',this)"><div class="sn" id="sTr">-</div><div class="sl">In Transit</div></div>'
  +'<div class="si" onclick="SFV(\'cotg\',this)"><div class="sn" id="sCotg">-</div><div class="sl">COTG</div></div>'
  +'<div class="si" onclick="SFV(\'fg\',this)"><div class="sn" id="sFg">-</div><div class="sl">Finished<br>Goods</div></div>'
  +'<div class="si" onclick="SFV(\'del\',this)"><div class="sn" id="sDel">-</div><div class="sl">Delivered</div></div>'
  +'</div>'
  +'<div class="sb" style="margin-left:auto">'
  +'<div class="si on" onclick="PF(\'all\',this)"><div class="sn" id="cAll">-</div><div class="sl">All</div></div>'
  +CES.map(function(c,i){return'<div class="si" onclick="PF(\''+c+'\',this)"><div class="sn" id="c'+i+'">-</div><div class="sl">'+c.split(' ')[0]+'</div></div>'}).join('')
  +'</div>'
  +'</div>'

  // ACTION BUTTONS
  +'<div style="padding:0 32px 16px;display:flex;gap:10px">'
  +'<button onclick="DISPATCH()" style="padding:10px 28px;background:rgba(59,130,246,.12);color:#60a5fa;border:1px solid rgba(59,130,246,.25);border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s">Dispatch</button>'
  +'<button onclick="QP(this)" style="padding:10px 28px;background:rgba(34,197,94,.12);color:#22c55e;border:1px solid rgba(34,197,94,.25);border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s">Pull-Up</button>'
  +'</div>'

  // TOOLBAR
  +'<div class="toolbar">'
  +'<div style="position:relative"><svg style="position:absolute;left:10px;top:9px;width:14px;height:14px;fill:none;stroke:#71717a;stroke-width:2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="21" y2="21"/></svg><input type="text" id="srch" class="fi2" style="padding:8px 12px 8px 32px;width:180px" placeholder="Search"></div>'
  +'<div class="fg"><div class="fl">SCHEDULED DATE</div><select id="dt" class="fi2">'+dates.join('')+'</select></div>'
  +'<button class="bt-nav" onclick="ND(-1)" title="Previous day">&#8249;</button>'
  +'<button class="bt-nav" onclick="ND(1)" title="Next day">&#8250;</button>'
  +'<div style="width:1px;height:24px;background:rgba(255,255,255,.1);margin:0 4px"></div>'
  +'<button class="bt-q" onclick="QW(0,this)">This Week</button>'
  +'<button class="bt-q" onclick="QW(1,this)">Next Week</button>'
  +'<button class="bt bt-p" onclick="L()">Search</button>'
  +'<button class="bt" onclick="RST()">Reset</button>'
  +'<div style="flex:1"></div>'
  +'<button class="bt bt-green" style="background:rgba(34,197,94,.15);color:#22c55e;border-color:rgba(34,197,94,.3)" onclick="G()">Print</button><button class="bt bt-blue" style="background:rgba(59,130,246,.15);color:#60a5fa;border-color:rgba(59,130,246,.3);margin-left:4px" onclick="GPDG()">PDG</button>'
  +'<button class="bt bt-red" style="background:rgba(239,68,68,.15);color:#f87171;border-color:rgba(239,68,68,.3)" onclick="CANCELP()">Cancel</button>'
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

  +'async function QW(wk,el){document.querySelectorAll(".bt-q").forEach(function(b){b.classList.remove("on")});el.classList.add("on");WKMODE=true;showDateCol(true);var lg=document.getElementById("lg"),tbl=document.getElementById("tbl");lg.style.display="block";tbl.style.display="none";var h={"Authorization":AUTH.token,"Content-Type":"application/json","userid":AUTH.userId};try{var rule={condition:"and",extraHeaders:null,Countries:[{Abbreviation:"FR",Region:"EU"}],TrtIds:[CFG.trtId],ReferenceNumbers:[],Vins:[],IsScheduled:true,OrderStatus:["ORDER_PLACED","BOOKED"],VehicleStages:null,DeliveryStatus:null,IsContainmentHold:null,IsAmountDueComplete:null,IsInsuranceComplete:null,IsTradeInComplete:null,IsRegistrationComplete:null,IsPaymentComplete:null,MatchStatus:null,DeliveryTypes:null,VehicleType:null,VehicleModels:null,HasOpenCommunication:null,IsEnterpriseOrder:null,VehicleTitles:null,VehicleContainmentHoldTitle:[],VesselNames:[],OpenCaseTypes:[]};var body={condition:"and",rules:[rule],Skip:0,Take:500,SortOrder:[],SelectedColumns:[]};var adv=await fetch(BASE+"/advisor/Dashboard?isSidePanelFullScreen=false",{method:"POST",headers:h,body:JSON.stringify(body)}).then(function(r){return r.json()});var allAdv=adv.Data.Dashboard||[];if(!allAdv.length){lg.innerHTML="<div style=padding:60px;text-align:center;color:#aaa>No scheduled deliveries found.</div>";return}var now=new Date();var dow=now.getDay();var monOff=dow===0?1:1-dow;var mon=new Date(now.getFullYear(),now.getMonth(),now.getDate()+monOff+wk*7);var sat=new Date(mon.getTime()+5*864e5);sat.setHours(23,59,59);var startDate=mon;allAdv=allAdv.filter(function(a){if(!a.ScheduledDeliveryDate)return false;var sd=new Date(a.ScheduledDeliveryDate);return sd>=startDate&&sd<=sat&&sd.getDay()!==0});if(!allAdv.length){lg.innerHTML="<div style=padding:60px;text-align:center;color:#aaa>No deliveries "+(wk===0?"this":"next")+" week.</div>";return}var tiR={};allAdv.forEach(function(a){if(a.TradeInActionStatus==="COMPLETE_TRADE_IN")tiR[a.ReferenceNumber]={ms:"Accepted"}});DATA=allAdv.map(function(a){var sddRaw=a.ScheduledDeliveryDate||"";var sddShort="";var sortKey="";if(sddRaw){var sp=new Date(sddRaw);if(!isNaN(sp)){var fmtSDD=function(sp){var mm=String(sp.getMonth()+1).padStart(2,"0");var dd=String(sp.getDate()).padStart(2,"0");var yy=sp.getFullYear();var hh=sp.getHours();var mi=String(sp.getMinutes()).padStart(2,"0");var ampm=hh>=12?"PM":"AM";var h12=hh%12||12;return mm+"-"+dd+"-"+yy+" "+h12+":"+mi+" "+ampm};sddShort=fmtSDD(sp);sortKey=sp.toISOString()}}var t="?";if(sddRaw){var sp2=new Date(sddRaw);if(!isNaN(sp2)){t=String(sp2.getHours()).padStart(2,"0")+":"+String(sp2.getMinutes()).padStart(2,"0")}}var hp=!!(a.LicensePlate&&a.LicensePlate.trim()&&a.LicensePlate.indexOf("-")>=0);var hold=!!a.IsContainmentHold;var io=a.InsuranceActionStatus==="COMPLETE";var otg=a.VehicleStage==="Finished Goods"||a.VehicleStage==="Arrived at VRL"||(a.VehicleStage&&a.VehicleStage.indexOf("Arrived")>=0);var amtOk=a.AmountDueActionStatus==="Yes"||a.FinalPaymentGate==="Complete";var delivered=!!a.IsDelivered||!!(a.VehicleStage&&a.VehicleStage.toLowerCase().indexOf("delivered")>=0);var al=[];if(!delivered){if(!hp)al.push("P");if(!otg)al.push("O");if(!amtOk)al.push("$");if(hold)al.push("H")};var r=tiR[a.ReferenceNumber];var tms=r?r.ms:"";if(tms&&tms.indexOf("Approved")<0&&tms.indexOf("Received")<0)al.push("T");var clientName=a.CustomerName;var di=a.DriverInfo;if(a.IsEnterpriseOrder&&di&&di.first_name)clientName=di.first_name+" "+di.last_name+" ("+a.CustomerName+")";var vsShort=a.VehicleStage||"";if(vsShort==="Finished Goods")vsShort="Finished Goods";else if(vsShort.indexOf("Receiving")>=0)vsShort="Receiving Insp.";else if(vsShort.indexOf("Transit")>=0)vsShort="In Transit";else if(vsShort.indexOf("PDI")>=0)vsShort="PDI Pending";else if(vsShort.indexOf("Ready")>=0)vsShort="Ready for Prep";else if(vsShort.indexOf("Wash")>=0||vsShort.indexOf("Charge")>=0)vsShort="Wash/Charge";else if(vsShort.indexOf("Service")>=0)vsShort="In Service";else if(vsShort.indexOf("garage")>=0)vsShort="Delivered";return{rn:a.ReferenceNumber,name:clientName,t:t,date:sortKey,sdd:sddShort,sddRaw:sddRaw,model:a.VehicleModel,color:a.VehicleColor||"",plate:(a.LicensePlate||"").trim(),regTxt:hp?"OK":"Pending",regOk:hp,host:a.DeliverySpecialist||"?",b2b:a.IsEnterpriseOrder,hp:hp,hold:hold,io:io,otg:otg,vs:vsShort,al:al,used:a.VehicleTitleStatus==="USED",tims:tms,hasTI:!!(a.TradeInActionStatus&&a.TradeInActionStatus!=="NO_TRADE_IN"),amtOk:amtOk,delivered:delivered,inc:a.IncentivesGate==="Complete"&&!a.IsEnterpriseOrder,vin:a.Vin||"",uid:a.AccountUid||""}}).sort(function(a,b){return(a.date+a.t).localeCompare(b.date+b.t)});RW();var ok=DATA.filter(function(d){return d.al.length===0}).length;var pOk=DATA.filter(function(d){return d.amtOk}).length;var oOk=DATA.filter(function(d){return d.otg}).length;var plOk=DATA.filter(function(d){return d.regOk}).length;var tiOk2=DATA.filter(function(d){return d.tims}).length;var asOk=DATA.filter(function(d){return d.io}).length;var N=DATA.length;document.getElementById("sT").textContent=N;document.getElementById("sT").className="sn b";document.getElementById("sO").textContent=ok;document.getElementById("sO").className="sn"+(ok>0?" g":" x");document.getElementById("sA").textContent=N-ok;document.getElementById("sA").className="sn"+((N-ok)>0?" r":" x");document.getElementById("sP").innerHTML="<div class=top>"+pOk+"</div><div class=div>"+N+"</div>";var _otg=document.getElementById("sOTG");if(_otg)_otg.innerHTML="<div class=top>"+oOk+"</div><div class=div>"+N+"</div>";document.getElementById("sPl").innerHTML="<div class=top>"+plOk+"</div><div class=div>"+N+"</div>";document.getElementById("sTI").innerHTML="<div class=top>"+DATA.filter(function(d){return d.tims&&(d.tims.indexOf("Approved")>=0||d.tims.indexOf("Received")>=0)}).length+"</div><div class=div>"+DATA.filter(function(d){return d.tims}).length+"</div>";document.getElementById("sAs").innerHTML="<div class=top>"+asOk+"</div><div class=div>"+N+"</div>";lg.style.display="none";tbl.style.display="";TR();document.getElementById("sa").checked=true;UC();UV()}catch(err){lg.innerHTML="<div style=padding:60px;text-align:center;color:#c00>Error: "+err.message+"</div>"}}'

  // QP - Pull-Up Potential (ready vehicles, no enterprise, future SDD)
  +'async function QP(el){document.querySelectorAll(".bt-q").forEach(function(b){b.classList.remove("on")});el.classList.add("on");WKMODE=true;showDateCol(true);var lg=document.getElementById("lg"),tbl=document.getElementById("tbl");lg.style.display="block";tbl.style.display="none";var h={"Authorization":AUTH.token,"Content-Type":"application/json","userid":AUTH.userId};try{var rule={condition:"and",extraHeaders:null,Countries:[{Abbreviation:"FR",Region:"EU"}],TrtIds:[CFG.trtId],ReferenceNumbers:[],Vins:[],IsScheduled:true,OrderStatus:["ORDER_PLACED","BOOKED"],VehicleStages:null,DeliveryStatus:null,IsContainmentHold:null,IsAmountDueComplete:null,IsInsuranceComplete:null,IsTradeInComplete:null,IsRegistrationComplete:null,IsPaymentComplete:null,MatchStatus:null,DeliveryTypes:null,VehicleType:null,VehicleModels:null,HasOpenCommunication:null,IsEnterpriseOrder:null,VehicleTitles:null,VehicleContainmentHoldTitle:[],VesselNames:[],OpenCaseTypes:[]};var body={condition:"and",rules:[rule],Skip:0,Take:500,SortOrder:[],SelectedColumns:[]};var adv=await fetch(BASE+"/advisor/Dashboard?isSidePanelFullScreen=false",{method:"POST",headers:h,body:JSON.stringify(body)}).then(function(r){return r.json()});var allAdv=adv.Data.Dashboard||[];var now=new Date();var today=new Date(now.getFullYear(),now.getMonth(),now.getDate());var tomorrow=new Date(today.getTime()+864e5);allAdv=allAdv.filter(function(a){if(!a.ScheduledDeliveryDate)return false;var sd=new Date(a.ScheduledDeliveryDate);if(sd<tomorrow||sd.getDay()===0)return false;if(a.IsEnterpriseOrder)return false;if(a.HasHold)return false;var otg=a.VehicleStage==="Finished Goods"||a.VehicleStage==="Arrived at VRL"||(a.VehicleStage&&a.VehicleStage.indexOf("Arrived")>=0);if(!otg)return false;var amtOk=a.AmountDueActionStatus==="Yes"||a.FinalPaymentGate==="Complete";if(!amtOk)return false;var hp=!!(a.LicensePlate&&a.LicensePlate.trim()&&a.LicensePlate.indexOf("-")>=0);if(!hp)return false;if(a.TradeInActionStatus==="COMPLETE_TRADE_IN"||a.TradeInActionStatus==="NO_TRADE_IN"||!a.TradeInActionStatus)return true;return false});if(!allAdv.length){lg.innerHTML="<div style=padding:60px;text-align:center;color:#aaa>No pull-up candidates found.</div>";return}var tiR={};allAdv.forEach(function(a){if(a.TradeInActionStatus==="COMPLETE_TRADE_IN")tiR[a.ReferenceNumber]={ms:"Accepted"}});DATA=allAdv.map(function(a){var sddRaw=a.ScheduledDeliveryDate||"";var sddShort="";var sortKey="";if(sddRaw){var sp=new Date(sddRaw);if(!isNaN(sp)){var fmtSDD=function(sp){var mm=String(sp.getMonth()+1).padStart(2,"0");var dd=String(sp.getDate()).padStart(2,"0");var yy=sp.getFullYear();var hh=sp.getHours();var mi=String(sp.getMinutes()).padStart(2,"0");var ampm=hh>=12?"PM":"AM";var h12=hh%12||12;return mm+"-"+dd+"-"+yy+" "+h12+":"+mi+" "+ampm};sddShort=fmtSDD(sp);sortKey=sp.toISOString()}}var t="?";if(sddRaw){var sp2=new Date(sddRaw);if(!isNaN(sp2)){t=String(sp2.getHours()).padStart(2,"0")+":"+String(sp2.getMinutes()).padStart(2,"0")}}var r=tiR[a.ReferenceNumber];var tms=r?r.ms:"";if(tms&&tms.indexOf("Approved")<0&&tms.indexOf("Received")<0)al.push("T");var clientName=a.CustomerName;var di=a.DriverInfo;if(a.IsEnterpriseOrder&&di&&di.first_name)clientName=di.first_name+" "+di.last_name+" ("+a.CustomerName+")";var vsShort=a.VehicleStage||"";if(vsShort==="Finished Goods")vsShort="Finished Goods";else if(vsShort.indexOf("Arrived")>=0)vsShort="Arrived at VRL";return{rn:a.ReferenceNumber,name:clientName,t:t,date:sortKey,sdd:sddShort,sddRaw:sddRaw,model:a.VehicleModel,color:a.VehicleColor||"",plate:(a.LicensePlate||"").trim(),regTxt:"OK",regOk:true,host:a.DeliverySpecialist||"?",b2b:false,hp:true,hold:false,io:a.InsuranceActionStatus==="COMPLETE",otg:true,vs:vsShort,al:[],tims:tms,amtOk:true}}).sort(function(a,b){return(a.date+a.t).localeCompare(b.date+b.t)});RW();var N=DATA.length;var asOk=DATA.filter(function(d){return d.io}).length;document.getElementById("sT").textContent=N;document.getElementById("sT").className="sn b";document.getElementById("sO").textContent=N;document.getElementById("sO").className="sn g";document.getElementById("sA").textContent=0;document.getElementById("sA").className="sn x";document.getElementById("sP").innerHTML="<div class=top>"+N+"</div><div class=div>"+N+"</div>";var _otg=document.getElementById("sOTG");if(_otg)_otg.innerHTML="<div class=top>"+N+"</div><div class=div>"+N+"</div>";document.getElementById("sPl").innerHTML="<div class=top>"+N+"</div><div class=div>"+N+"</div>";document.getElementById("sTI").innerHTML="<div class=top>"+DATA.filter(function(d){return d.tims}).length+"</div><div class=div>"+DATA.filter(function(d){return d.tims}).length+"</div>";document.getElementById("sAs").innerHTML="<div class=top>"+asOk+"</div><div class=div>"+N+"</div>";lg.style.display="none";tbl.style.display="";TR();document.getElementById("sa").checked=true;UC();UV()}catch(err){lg.innerHTML="<div style=padding:60px;text-align:center;color:#c00>Error: "+err.message+"</div>"}}'

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
  +'DATA=adv.Data.Dashboard.map(function(a){var d=dm[a.ReferenceNumber]||{};var dt=d.ScheduledDeliveryStartDateString||"";var t="?",m=dt.match(/(\\d{1,2}):(\\d{2})\\s*(AM|PM)/i);if(m){var hr=parseInt(m[1]);if(m[3].toUpperCase()==="PM"&&hr<12)hr+=12;if(m[3].toUpperCase()==="AM"&&hr===12)hr=0;t=String(hr).padStart(2,"0")+":"+m[2]}var hp=!!(a.LicensePlate&&a.LicensePlate.trim()&&a.LicensePlate.indexOf("-")>=0);var regId=regR[a.ReferenceNumber];var regOk=hp&&regId===4;var regTxt="Pending";if(hp){if(regId===4)regTxt="OK";else if(regId===8)regTxt="RTS";else if(regId===-1)regTxt="On Hold";else if(regId===1||regId===2||regId===3)regTxt="In Progress"}var hold=!!a.IsContainmentHold;var io=a.InsuranceActionStatus==="COMPLETE";var otg=a.VehicleStage==="Finished Goods"||a.VehicleStage==="Arrived at VRL"||(a.VehicleStage&&a.VehicleStage.indexOf("Arrived")>=0);var amtOk=a.AmountDueActionStatus==="Yes"||a.FinalPaymentGate==="Complete";var delivered=!!a.IsDelivered||!!(a.VehicleStage&&a.VehicleStage.toLowerCase().indexOf("delivered")>=0);var al=[];if(!delivered){if(!regOk)al.push("P");if(!otg)al.push("O");if(!amtOk)al.push("$");if(hold)al.push("H")}var r=tiR[a.ReferenceNumber];var tms=r?r.ms:"";if(!delivered&&tms&&tms.indexOf("Approved")<0&&tms.indexOf("Received")<0)al.push("T");var clientName=a.CustomerName;var di=a.DriverInfo;if(a.IsEnterpriseOrder&&di&&di.first_name)clientName=di.first_name+" "+di.last_name+" ("+a.CustomerName+")";var vsShort=a.VehicleStage||"";if(vsShort==="Finished Goods")vsShort="Finished Goods";else if(vsShort.indexOf("Receiving")>=0)vsShort="Receiving Insp.";else if(vsShort.indexOf("Transit")>=0)vsShort="In Transit";else if(vsShort.indexOf("PDI")>=0)vsShort="PDI Pending";else if(vsShort.indexOf("Ready")>=0)vsShort="Ready for Prep";else if(vsShort.indexOf("Wash")>=0||vsShort.indexOf("Charge")>=0)vsShort="Wash/Charge";else if(vsShort.indexOf("Service")>=0)vsShort="In Service";else if(vsShort.indexOf("garage")>=0)vsShort="Delivered";return{rn:a.ReferenceNumber,name:clientName,t:t,date:ds,sdd:"",model:a.VehicleModel,color:a.VehicleColor||"",plate:(a.LicensePlate||"").trim(),regTxt:regTxt,regOk:regOk,host:d.HostName||"?",hostId:d.HostId||null,b2b:a.IsEnterpriseOrder,hp:hp,hold:hold,io:io,otg:otg,delivered:delivered,vs:vsShort,al:al,used:a.VehicleTitleStatus==="USED",tims:tms,hasTI:!!(a.TradeInActionStatus&&a.TradeInActionStatus!=="NO_TRADE_IN"),amtOk:amtOk,inc:a.IncentivesGate==="Complete"&&!a.IsEnterpriseOrder,vin:a.Vin||"",uid:a.AccountUid||""}}).sort(function(a,b){return a.t.localeCompare(b.t)});'
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
  +'var _otg=document.getElementById("sOTG");if(_otg)_otg.innerHTML="<div class=top>"+oOk+"</div><div class=div>"+N+"</div>";'
  +'document.getElementById("sPl").innerHTML="<div class=top>"+plOk+"</div><div class=div>"+N+"</div>";'
  +'document.getElementById("sTI").innerHTML="<div class=top>"+tiOk+"</div><div class=div>"+tiTotal+"</div>";'
  +'document.getElementById("sAs").innerHTML="<div class=top>"+asOk+"</div><div class=div>"+N+"</div>";'
  +'lg.style.display="none";tbl.style.display="";TR();'
  +'document.getElementById("sa").checked=true;'
  +'document.getElementById("upd").textContent="Updated at: "+new Date().toLocaleString("en-US",{month:"2-digit",day:"2-digit",hour:"numeric",minute:"2-digit",hour12:true});'
  +'UC();UV();'
  +'}catch(err){lg.innerHTML="<div style=padding:60px;text-align:center;color:#c00>Error: "+err.message+"</div>"}}'

  +'function RW(){var tb=document.getElementById("tb");var out="";for(var i=0;i<DATA.length;i++){var d=DATA[i];var vc=d.delivered?"dg":(d.otg?"dg":(d.vs.indexOf("Transit")>=0?"do":"dr"));var rc=d.regOk?"<span class=\\"dt dg\\"></span>OK":d.regTxt==="On Hold"?"<span class=\\"dt dr\\"></span><b style=color:#ef4444>On Hold</b>":d.regTxt==="RTS"?"<span class=\\"dt do\\"></span>RTS":d.regTxt==="Pending"?"<span class=\\"dt do\\"></span>Pending":"<span class=su>"+d.regTxt+"</span>";var tiOk=d.tims&&(d.tims.indexOf("Approved")>=0||d.tims.indexOf("Received")>=0);var tc=d.tims?(tiOk?"<span class=\\"dt dg\\"></span>"+d.tims:"<span class=\\"dt do\\"></span>"+d.tims):"<span class=su>No</span>";out+="<tr class=\\""+(d.al.length?"w":"")+"\\" data-host=\\""+d.host+"\\"><td><input type=checkbox class=\\"ck rc\\" data-i="+i+" "+(d.al.length===0?"checked":"")+"></td><td class=dtc>"+(d.sdd||"")+"</td><td>"+d.t+"</td><td><span class=nm>"+d.name+"</span></td><td><a class=rl href=\\"https://dro.tesla.com/advisor?sidepanel_fullscreen=yes&rn="+d.rn+"\\" target=_blank>"+d.rn+"</a>"+(d.b2b?"":"<a href=\\"https://tesla.cee.trustia.ai/admin/folder/folder/?q="+d.rn+"\\" target=_blank style=\\"margin-left:4px;font-size:10px;background:rgba(34,197,94,.12);color:#22c55e;padding:1px 6px;border-radius:10px;text-decoration:none;font-weight:600\\" title=\\"Verifier CEE sur Trustia\\">CEE</a>")+"</td><td>"+d.model+"</td><td>"+rc+"</td><td>"+(d.amtOk?"<span class=\\"dt dg\\"></span>OK":"<span class=\\"dt dr\\"></span>No")+"</td><td>"+tc+"</td><td><span class=\\"dt "+vc+"\\"></span>"+d.vs+"</td><td>"+(d.hold?"<span class=\\"dt dr\\"></span><a href=\\"https://dro.tesla.com/advisor?sidepanel_fullscreen=yes&rn="+d.rn+"\\" target=_blank style=\\"color:#ef4444;font-weight:700;text-decoration:none\\">Hold</a>":"<span class=\\"dt dg\\"></span>OK")+"</td><td>"+(d.io?"<span class=\\"dt dg\\"></span>OK":"<span class=su>No</span>")+"</td><td><button onclick=\\"P1("+i+",this)\\" style=\\"padding:4px 10px;border:1px solid rgba(255,255,255,.1);border-radius:6px;cursor:pointer;background:rgba(255,255,255,.04);color:#a1a1aa;font-family:inherit;font-size:12px\\"><svg width=14 height=14 viewBox=\\"0 0 24 24\\" fill=none stroke=\\"#71717a\\" stroke-width=2><path d=\\"M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2\\"/><rect x=6 y=14 width=12 height=8 rx=1/></svg></button></td></tr>"};tb.innerHTML=out;if(WKMODE)showDateCol(true);fetch("http://localhost:3000/api/print/status").then(function(r){return r.json()}).then(function(ps){document.querySelectorAll("#tb tr").forEach(function(r){var ci=r.querySelector(".rc");if(!ci)return;var d=DATA[parseInt(ci.dataset.i)];if(d&&ps[d.rn]){var btn=r.querySelector("button");if(btn){btn.innerHTML="<svg width=14 height=14 viewBox=\\"0 0 24 24\\" fill=none stroke=\\"#22c55e\\" stroke-width=2><path d=\\"M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2\\"/><rect x=6 y=14 width=12 height=8 rx=1/></svg>";btn.style.border="1px solid rgba(34,197,94,.3)";btn.style.background="rgba(34,197,94,.1)";btn.title="Reprint"}}})}).catch(function(){})}'

  +'function G(){var checks=[];document.querySelectorAll(".rc:checked").forEach(function(el){var tr=el.closest("tr");if(tr&&tr.style.display!=="none"){var i=parseInt(el.dataset.i);if(DATA[i])checks.push(i)}});if(!checks.length){alert("No deliveries selected!");return}if(!confirm("Print "+checks.length+" deliveries?"))return;var idx=0;var ok=0;var fail=0;document.title="Printing 0/"+checks.length;function next(){if(idx>=checks.length){document.title="Done: "+ok+" printed, "+fail+" errors";alert("Print complete!\\n"+ok+" OK, "+fail+" errors");return}var i=checks[idx];var rows=document.querySelectorAll("#tb tr");var btn=rows[i]?rows[i].querySelector("button"):null;if(btn){btn.scrollIntoView({block:"center"});document.title="Printing "+(idx+1)+"/"+checks.length+"...";P1(i,btn,function(success){if(success)ok++;else fail++;idx++;next()})}else{idx++;next()}}next()}'

  +'/* DISPATCH loaded from dispatch.js */'

  +'function P1(i,btn,onDone){var d=DATA[i];if(!d){if(onDone)onDone(false);return}btn.innerHTML="<svg width=14 height=14 viewBox=\\"0 0 24 24\\" fill=none stroke=\\"#71717a\\" stroke-width=2 style=\\"animation:spin 1s linear infinite\\"><circle cx=12 cy=12 r=10 stroke-dasharray=31 stroke-dashoffset=10/></svg>";btn.disabled=true;var ds=document.getElementById("dt").value;var ti=d.tims?[d.rn]:[];var b2b=d.b2b?[d.rn]:[];var chain=Promise.resolve();if(ti.length||b2b.length){chain=fetch("http://localhost:3000/api/print/docgen",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tiRNs:ti,b2bRNs:b2b})}).then(function(r){return r.json()})}chain.then(function(docResult){return fetch("http://localhost:3000/api/print/send/"+d.rn,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({date:ds,b2b:!!d.b2b})})}).then(function(r){return r.json()}).then(function(j){if(j.ok){btn.innerHTML="<svg width=14 height=14 viewBox=\\"0 0 24 24\\" fill=none stroke=\\"#22c55e\\" stroke-width=2><path d=\\"M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2\\"/><rect x=6 y=14 width=12 height=8 rx=1/></svg>";btn.style.border="1px solid rgba(34,197,94,.3)";btn.style.background="rgba(34,197,94,.1)";var t=j.printed+" docs sent";if(j.warnings&&j.warnings.length){t+=" | ! "+j.warnings.join(", ");btn.style.border="1px solid rgba(245,158,11,.3)";btn.style.background="rgba(245,158,11,.1)"}btn.title=t;btn.disabled=false;if(onDone)onDone(true)}else{throw new Error(j.error)}}).catch(function(e){btn.innerHTML="ERR";btn.style.color="#ef4444";btn.title=e.message;btn.disabled=false;if(onDone)onDone(false)})}'
  +'var sortDir={};function SO(k){sortDir[k]=!sortDir[k];DATA.sort(function(a,b){var v=sortDir[k]?1:-1;return(a[k]||"").toString().localeCompare((b[k]||"").toString())*v});RW()}'

  +'function CHKAUTH(){fetch("http://localhost:3000/api/auth/status").then(function(r){return r.json()}).then(function(j){var dd=document.getElementById("dotDro");var dg=document.getElementById("dotDg");if(dd)dd.style.background=j.hasDro?"#22c55e":"#ef4444";if(dg)dg.style.background=j.hasDocgen?"#22c55e":"#f59e0b";var b=document.getElementById("docgenBtn");if(j.hasDocgen){b.style.borderColor="rgba(34,197,94,.3)";b.style.background="rgba(34,197,94,.08)"}else{b.style.borderColor="rgba(245,158,11,.3)";b.style.background="rgba(245,158,11,.08)"}}).catch(function(){})}'
  +'function LOGINDG(){var b=document.getElementById("docgenBtn");var dg=document.getElementById("dotDg");if(dg)dg.style.background="#f59e0b";b.style.opacity="0.6";fetch("http://localhost:3000/api/auth/login-docgen").then(function(r){return r.json()}).then(function(j){b.style.opacity="1";if(j.ok){if(dg)dg.style.background="#22c55e";b.style.borderColor="rgba(34,197,94,.3)";b.style.background="rgba(34,197,94,.08)"}else{if(dg)dg.style.background="#ef4444"}}).catch(function(){b.style.opacity="1";if(dg)dg.style.background="#ef4444"})}'
  +'setTimeout(CHKAUTH,2000);'

  +'document.getElementById("srch").oninput=function(){var q=this.value.toLowerCase();document.querySelectorAll("#tb tr").forEach(function(r){r.style.display=r.textContent.toLowerCase().indexOf(q)>=0?"":"none"});TR()};'

  +'function SF(t,el){document.querySelectorAll(".si").forEach(function(s){s.classList.remove("on")});el.classList.add("on");document.querySelectorAll("#tb tr").forEach(function(r){if(t==="all"){r.style.display=""}else if(t==="ok"){r.style.display=r.classList.contains("w")?"none":""}else{r.style.display=r.classList.contains("w")?"":"none"}});TR()}'

  +'var activeFilter=null;'
  +'function SFR(f,el){document.querySelectorAll(".si").forEach(function(s){s.classList.remove("on")});if(activeFilter===f){activeFilter=null;document.querySelectorAll("#tb tr").forEach(function(r){r.style.display=""});el.parentElement.parentElement.querySelector(".si").classList.add("on");TR();return}activeFilter=f;el.classList.add("on");document.querySelectorAll("#tb tr").forEach(function(r){var i=parseInt(r.querySelector(".rc")?.dataset.i);if(isNaN(i))return;var d=DATA[i];var show=false;if(f==="pay")show=!d.amtOk;else if(f==="otg")show=!d.otg;else if(f==="reg")show=!d.regOk;else if(f==="ti")show=d.tims&&!(d.tims.indexOf("Approved")>=0||d.tims.indexOf("Received")>=0);else if(f==="ins")show=!d.io;r.style.display=show?"":"none"});TR()}'

  +'function CF(){if(typeof applyFilters==="function")applyFilters(DATA);else{var s=document.createElement("script");s.src="http://localhost:3000/filters.js";s.onload=function(){applyFilters(DATA)};document.head.appendChild(s)}}'

  +'function TR(){var v=0;document.querySelectorAll("#tb tr").forEach(function(r){if(r.style.display!=="none")v++});document.getElementById("trec").textContent="Total Records: "+v}'
  +'function US(){var tot=0,ok=0,al=0;document.querySelectorAll("#tb tr").forEach(function(r){if(r.style.display==="none")return;tot++;if(r.classList.contains("w"))al++;else ok++});document.getElementById("sT").textContent=tot;document.getElementById("sO").textContent=ok;document.getElementById("sA").textContent=al}'
    +'function SFV(f,el){document.querySelectorAll(".si").forEach(function(s){s.classList.remove("on")});el.classList.add("on");document.querySelectorAll("#tb tr").forEach(function(r){var ci=r.querySelector(".rc");if(!ci)return;var i=parseInt(ci.dataset.i);if(isNaN(i))return;var d=DATA[i];var show=false;if(f==="transit")show=d.vs.indexOf("Transit")>=0;else if(f==="cotg")show=d.vs==="Arrived at VRL";else if(f==="fg")show=d.vs==="Finished Goods"||d.vs==="Deliverable/PDI Complete";else if(f==="del")show=!!d.delivered;r.style.display=show?"":"none"});TR()}'
  +'function UV(){var tr=0,cotg=0,fg=0,del=0;DATA.forEach(function(d){if(d.vs.indexOf("Transit")>=0)tr++;if(d.otg&&!d.delivered)cotg++;if(d.vs==="Finished Goods")fg++;if(d.delivered)del++});document.getElementById("sTr").textContent=tr;document.getElementById("sCotg").textContent=cotg;document.getElementById("sFg").textContent=fg;document.getElementById("sDel").textContent=del}'
  +'function UC(){document.getElementById("cAll").textContent=DATA.length;CES.forEach(function(c,i){var n=DATA.filter(function(d){return(d.host||"").toLowerCase().indexOf(c.split(" ")[0].toLowerCase())>=0}).length;document.getElementById("c"+i).textContent=n})}'
  
  +'function STAB(idx,btn){document.querySelectorAll(".tab").forEach(function(t){t.classList.remove("on")});btn.classList.add("on");document.getElementById("mainView").style.display=idx===0?"":"none";document.getElementById("arrView").style.display=idx===1?"":"none";document.getElementById("stockView").style.display=idx===2?"":"none";document.getElementById("tiView").style.display=idx===3?"":"none";document.getElementById("csatView").style.display=idx===4?"":"none";if(idx===1&&!document.getElementById("arrView").innerHTML.trim()){fetch("http://localhost:3000/api/tab/arrivals").then(function(r){return r.text()}).then(function(h){document.getElementById("arrView").innerHTML=h;LOADARR()}).catch(function(e){document.getElementById("arrView").innerHTML="<div style=padding:60px;text-align:center;color:#c00>Error loading Arrivals: "+e.message+"</div>"})}if(idx===2&&!document.getElementById("stockView").innerHTML.trim()){fetch("http://localhost:3000/api/tab/stock").then(function(r){return r.text()}).then(function(h){document.getElementById("stockView").innerHTML=h;LOADSTOCK()}).catch(function(e){document.getElementById("stockView").innerHTML="<div style=padding:60px;text-align:center;color:#c00>Error loading Stock: "+e.message+"</div>"})}if(idx===3&&!document.getElementById("tiView").innerHTML.trim()){fetch("http://localhost:3000/api/tab/tradein").then(function(r){return r.text()}).then(function(h){document.getElementById("tiView").innerHTML=h;LOADTI()}).catch(function(){})}if(idx===4&&!document.getElementById("csatView").innerHTML.trim()){fetch("http://localhost:3000/api/tab/csat").then(function(r){return r.text()}).then(function(h){document.getElementById("csatView").innerHTML=h;LOADCSAT()}).catch(function(e){document.getElementById("csatView").innerHTML="<div style=padding:60px;text-align:center;color:#c00>Error loading CSAT: "+e.message+"</div>"})}}'

  +'function GPDG(){var checks=[];document.querySelectorAll(".rc:checked").forEach(function(el){var tr=el.closest("tr");if(tr&&tr.style.display!=="none"){var i=parseInt(el.dataset.i);if(DATA[i])checks.push(i)}});if(!checks.length){alert("No deliveries!");return}if(!confirm("Print "+checks.length+" pages de garde?"))return;var idx=0,ok=0,fail=0;document.title="PDG 0/"+checks.length;function next(){if(idx>=checks.length){document.title="PDG: "+ok+" OK";alert("PDG: "+ok+" OK, "+fail+" err");return}var d=DATA[checks[idx]];document.title="PDG "+(idx+1)+"/"+checks.length;var ds=document.getElementById("dt").value;fetch("http://localhost:3000/api/print/pdg/"+d.rn,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({date:ds})}).then(function(r){return r.json()}).then(function(j){if(j.ok)ok++;else fail++}).catch(function(){fail++}).finally(function(){idx++;next()})}next()}'
  +'/* LOADTI defined in tradein.js */'
  +'function CANCELP(){if(!confirm("Clear the print queue?"))return;fetch("http://localhost:3000/api/print/cancel",{method:"POST",headers:{"Content-Type":"application/json"},body:"{}"}).then(function(r){return r.json()}).then(function(){alert("Print queue cleared!")}).catch(function(e){alert("Error: "+e.message)})}'

  +'/* LOADARR defined in arrivals.js */'
  +'function LOADCSAT(){fetch("http://localhost:3000/api/bi/csat").then(function(r){return r.json()}).then(function(j){if(j.error)return;document.getElementById("csatScore").textContent=j.summary.avgScore.replace("%","");document.getElementById("csatSurveys").textContent=j.summary.totalSurveys;var adv=j.advisors;if(adv[0]){document.getElementById("csatScoreBen").textContent=adv[0].score;document.getElementById("csatSurveysBen").textContent=adv[0].count}if(adv[1]){document.getElementById("csatScoreSacha").textContent=adv[1].score;document.getElementById("csatSurveysSacha").textContent=adv[1].count}if(adv[2]){document.getElementById("csatScoreSophie").textContent=adv[2].score;document.getElementById("csatSurveysSophie").textContent=adv[2].count}var w=j.weekly;if(w&&w.weeks){var ch=document.getElementById("csatWeeklyChart");if(ch){var sc=w.scores||w.counts;var html="";for(var i=0;i<w.weeks.length;i++){if(!sc[i])continue;var pct=sc[i];var col=pct>=80?"#28a745":pct>=70?"#3e6ae1":"#f0ad4e";html+="<div style=flex:1;display:flex;flex-direction:column;align-items:center;gap:6px><div style=font-size:12px;font-weight:600>"+sc[i]+"%</div><div style=width:100%;height:"+pct+"%;border-radius:6px_6px_0_0;background:"+col+";min-height:8px></div><div style=font-size:11px;color:#5c5e62>"+w.weeks[i]+"</div></div>"}ch.innerHTML=html}}}).catch(function(){})}'
  +'var fs=document.createElement("script");fs.src="http://localhost:3000/filters.js";var ts=document.createElement("script");ts.src="http://localhost:3000/tradein.js";var ds=document.createElement("script");ds.src="http://localhost:3000/dispatch.js";var ss=document.createElement("script");ss.src="http://localhost:3000/stock.js";var ths=document.createElement("script");ths.src="http://localhost:3000/theme.js";var ars=document.createElement("script");ars.src="http://localhost:3000/arrivals.js";document.head.appendChild(ts);document.head.appendChild(fs);document.head.appendChild(ds);document.head.appendChild(ss);document.head.appendChild(ths);document.head.appendChild(ars);L();'

  +'</scr'+'ipt>'
  +'</div>' // close mainView
  +'<div id="csatView" style="display:none"></div>'
  +'<div id="arrView" style="display:none"></div>'
  +'<div id="tiView" style="display:none"></div>'
  +'<div id="stockView" style="display:none"></div>'
  +'</body></html>');
  w.document.close();
})();
