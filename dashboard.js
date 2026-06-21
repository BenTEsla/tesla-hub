// Tesla Delivery Hub v17 â€” Full English + Intrepid style
(function(){
  var tk=(localStorage.getItem('delops_id_token')||'').replace(/^"|"$/g,'');
  var t2=(localStorage.getItem('delops_id_token_data')||'').replace(/^"|"$/g,'');
  var ui=(localStorage.getItem('UserId')||'').replace(/^"|"$/g,'');
  var at=tk&&tk.length>100?tk:t2&&t2.length>100?t2:null;
  if(!at||!ui){alert('Token not found!');return}

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
  +'body{font-family:UST,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#171a20;background:#f5f5f5;font-size:13px;line-height:1.4}'

  // HEADER
  +'.hd{height:48px;background:#fff;border-bottom:1px solid #e0e0e0;display:flex;align-items:center;padding:0 24px;font-size:13px;box-shadow:0 1px 3px rgba(0,0,0,.04)}'
  +'.hd-logo{display:flex;align-items:center;gap:12px}'
  +'.hd-logo svg{width:22px;height:22px}'
  +'.hd-site{font-weight:600;color:#171a20;font-size:14px;letter-spacing:-.2px}'
  +'.hd-r{margin-left:auto;display:flex;align-items:center;gap:16px}'
  +'.hd-search{padding:7px 14px;border:1px solid #e0e0e0;border-radius:6px;font-size:12px;width:260px;font-family:inherit;color:#333;outline:none;background:#f9f9f9;transition:all .15s}'
  +'.hd-search:focus{border-color:#3e6ae1;background:#fff;box-shadow:0 0 0 3px rgba(62,106,225,.1)}'
  +'.hd-user{font-size:12px;color:#666;font-weight:500}'

  // CONTENT CARD
  +'.card{background:#fff;margin:20px 24px 0;border-radius:8px;border:1px solid #e8e8e8;box-shadow:0 1px 4px rgba(0,0,0,.06)}'
  +'.ttl{font-size:22px;font-weight:700;color:#171a20;padding:20px 24px 16px}'

  // STATS - Two separate Intrepid-style boxes
  +'.srow{display:flex;justify-content:space-between;gap:20px;margin:0 24px 20px}'
  +'.sb{display:flex;border:1px solid #e0e0e0;border-radius:10px;box-shadow:0 1px 4px rgba(0,0,0,.05);overflow:hidden;background:#fff}'
  +'.si{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:18px 32px;border-right:1px solid #ebebeb;cursor:pointer;transition:all .12s}'
  +'.si:last-child{border-right:none}'
  +'.si:hover{background:#fafafa}'
  +'.si.on{background:#f0f4ff}'
  +'.sn{font-size:28px;font-weight:700;line-height:1}'
  +'.sn.b{color:#3e6ae1}.sn.g{color:#28a745}.sn.r{color:#dc3545}.sn.x{color:#bbb}'
  +'.sl{font-size:11px;color:#999;margin-top:8px;text-align:center;line-height:1.3}'
  +'.sf{text-align:center;font-weight:700;line-height:1}'
  +'.sf .top{font-size:24px;color:#171a20}'
  +'.sf .div{border-top:1px solid #e8e8e8;font-size:24px;color:#ccc;margin-top:4px;padding-top:4px}'

  // TOOLBAR
  +'.toolbar{padding:16px 24px 12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}'
  +'.fg{display:flex;flex-direction:column;gap:3px}'
  +'.fl{font-size:10px;color:#999;font-weight:600;text-transform:uppercase;letter-spacing:.5px}'
  +'.fi2{padding:7px 12px;border:1px solid #e0e0e0;border-radius:6px;font-size:12px;font-family:inherit;color:#333;outline:none;background:#fff;transition:border .15s}'
  +'.fi2:focus{border-color:#3e6ae1}'

  // BUTTONS
  +'.bt{padding:7px 18px;border-radius:6px;font-size:12px;font-family:inherit;font-weight:600;cursor:pointer;border:none;transition:all .12s}'
  +'.bt-p{background:#e8523a;color:#fff}.bt-p:hover{background:#d44430}'
  +'.bt-s{background:#fff;color:#393c41;border:1px solid #e0e0e0}.bt-s:hover{background:#f5f5f5}'
  +'.bt-d{background:#171a20;color:#fff}.bt-d:hover{background:#333}'
  +'.bt-q{background:#fff;color:#393c41;border:1px solid #e0e0e0;padding:7px 14px;font-size:11px;border-radius:6px;cursor:pointer;font-family:inherit;font-weight:600;transition:all .12s}'
  +'.bt-q:hover{background:#f5f5f5;border-color:#ccc}'
  +'.bt-q.on{background:#171a20;color:#fff;border-color:#171a20}'
  +'.bt-nav{background:#fff;color:#393c41;border:1px solid #e0e0e0;padding:7px 10px;font-size:14px;border-radius:6px;cursor:pointer;font-family:inherit;line-height:1;transition:all .12s}'
  +'.bt-nav:hover{background:#f5f5f5}'

  // HOST FILTER
  +'.hostbar{padding:0 24px 14px;display:flex;gap:6px}'

  // TABLE
  +'.tw{padding:0 24px 20px}'
  +'.tcard{background:#fff;border-radius:6px;border:1px solid #e8e8e8;box-shadow:0 1px 4px rgba(0,0,0,.06);overflow:hidden}'
  +'table{width:100%;border-collapse:collapse;table-layout:fixed}'
  +'th{padding:8px 10px;text-align:left;font-size:11px;color:#666;font-weight:600;border-bottom:2px solid #f0f0f0;background:#fafafa;cursor:pointer;user-select:none;white-space:nowrap;overflow:hidden;position:sticky;top:0;z-index:5;text-transform:uppercase;letter-spacing:.3px}'
  +'th:hover{color:#171a20;background:#f5f5f5}'
  +'td{padding:8px 10px;font-size:12px;border-bottom:1px solid #f5f5f5;vertical-align:middle;color:#393c41;height:42px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
  +'tr:hover td{background:#f8f9ff}'
  +'tr.w td{background:#fef8f8}'
  +'tr.w:hover td{background:#fef0f0}'

  // FILTER INPUTS
  +'.fi{width:100%;padding:3px 6px;margin-top:3px;border:1px solid #e0e0e0;border-radius:4px;font-size:10px;font-family:inherit;color:#333;background:#fff;outline:none;box-sizing:border-box;font-weight:400}'
  +'.fi:focus{border-color:#3e6ae1}'

  // ELEMENTS
  +'.ck{width:15px;height:15px;cursor:pointer;-webkit-appearance:none;appearance:none;border:1.5px solid #d0d0d0;border-radius:3px;background:#fff;position:relative;vertical-align:middle;transition:all .1s}'
  +'.ck:checked{background:#3e6ae1;border-color:#3e6ae1}'
  +'.ck:checked::after{content:"";position:absolute;left:4px;top:1px;width:4px;height:7px;border:solid #fff;border-width:0 1.5px 1.5px 0;transform:rotate(45deg)}'
  +'.dt{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px}'
  +'.dg{background:#28a745}.dr{background:#dc3545}.do{background:#f0ad4e}'
  +'.nm{font-weight:600;color:#171a20;font-size:12px}'
  +'.su{font-size:11px;color:#bbb}'
  +'.rl{color:#3e6ae1;text-decoration:none;font-size:11px;font-weight:500}'
  +'.rl:hover{text-decoration:underline}'

  // LOADING + FOOTER
  +'.spinner{width:44px;height:44px;border:3px solid #f0f0f0;border-top-color:#e8523a;border-radius:50%;animation:spin .7s linear infinite;margin:0 auto}'
  +'@keyframes spin{to{transform:rotate(360deg)}}'
  +'.ft{padding:10px 16px;font-size:11px;color:#aaa;border-top:1px solid #f0f0f0}'
  +'.hid{display:none}'
  +'.dtc{display:none;font-size:11px;font-weight:600;color:#3e6ae1}'
  +'</style></head><body>'

  // HEADER
  +'<div class="hd"><div class="hd-logo"><svg viewBox="0 0 160 160" fill="#171a20"><path d="m80 129.8 14-78.7c13.3 0 17.5 1.5 18.1 7.4 0 0 8.9-3.3 13.5-10.1-17.6-8.1-35.3-8.5-35.3-8.5L80 52.5 69.7 39.9s-17.7.4-35.3 8.5c4.5 6.8 13.5 10.1 13.5 10.1.6-6 4.8-7.4 18.1-7.4z"/><path d="M80 36.3c14.2-.1 30.5 2.2 47.2 9.5 2.2-4 2.8-5.8 2.8-5.8-18.2-7.3-35.3-9.7-50-9.8-14.7.1-31.8 2.5-50 9.8 0 0 .8 2.2 2.8 5.8 16.7-7.3 33-9.6 47.2-9.5"/></svg><span class="hd-site">Tesla Delivery Hub &mdash; Rennes</span></div><div class="hd-r"><input type="text" id="srch" class="hd-search" placeholder="Search by VIN, RN, LP or Name"><span class="hd-user">Ben Daubin</span></div></div>'

  // TITLE
  +'<div class="ttl">Delivery Dashboard</div>'

  // STATS - Block 1: Overview | Block 2: Readiness
  +'<div class="srow">'
  +'<div class="sb">'
  +'<div class="si on" onclick="SF(\'all\',this)"><div class="sn b" id="sT">-</div><div class="sl">Deliveries</div></div>'
  +'<div class="si" onclick="SF(\'ok\',this)"><div class="sn g" id="sO">-</div><div class="sl">Ready</div></div>'
  +'<div class="si" onclick="SF(\'al\',this)"><div class="sn r" id="sA">-</div><div class="sl">Alerts</div></div>'
  +'</div>'
  +'<div class="sb">'
  +'<div class="si"><div id="sP" class="sf"><div class="top">0</div><div class="div">0</div></div><div class="sl">Payment</div></div>'
  +'<div class="si"><div id="sOTG" class="sf"><div class="top">0</div><div class="div">0</div></div><div class="sl">Car On The<br>Ground</div></div>'
  +'<div class="si"><div id="sPl" class="sf"><div class="top">0</div><div class="div">0</div></div><div class="sl">Registration</div></div>'
  +'<div class="si"><div id="sTI" class="sf"><div class="top">0</div><div class="div">0</div></div><div class="sl">Trade-In</div></div>'
  +'<div class="si"><div id="sAs" class="sf"><div class="top">0</div><div class="div">0</div></div><div class="sl">Insurance</div></div>'
  +'</div>'
  +'</div>'

  // TOOLBAR
  +'<div class="toolbar">'
  +'<div class="fg"><div class="fl">Scheduled Date</div><select id="dt" class="fi2">'+dates.join('')+'</select></div>'
  +'<button class="bt-nav" onclick="ND(-1)" title="Previous day">&#8249;</button>'
  +'<button class="bt-nav" onclick="ND(1)" title="Next day">&#8250;</button>'
  +'<button class="bt-q on" onclick="QD(0,this)">Today</button>'
  +'<button class="bt-q" onclick="QW(0,this)">This Week</button>'
  +'<button class="bt-q" onclick="QW(1,this)">Next Week</button>'
  +'<button class="bt-q" onclick="QP(this)" style="border-color:#28a745;color:#28a745">Pull-Up</button>'
  +'<button class="bt bt-p" onclick="L()">Search</button>'
  +'<div style="flex:1"></div>'
  +'<button class="bt bt-s" id="gn" style="display:none" onclick="G()">Generate PDFs</button>'
  +'<button class="bt bt-d" id="disp" style="display:none" onclick="DISPATCH()">Dispatch</button>'
  +'</div>'

  // HOST FILTER
  +'<div class="hostbar">'
  +'<span class="bt-q on" onclick="PF(\'all\',this)">All</span>'
  +CES.map(function(c){return'<span class="bt-q" onclick="PF(\''+c+'\',this)">'+c.split(' ')[0]+'</span>'}).join('')
  +'</div>'

  // TABLE
  +'<div class="tw"><div class="tcard"><div id="lg" style="display:none;text-align:center;padding:80px 0"><div class="spinner"></div><div style="font-size:13px;color:#999;margin-top:16px">Loading deliveries...</div></div>'
  +'<table id="tbl" style="display:none"><thead><tr>'
  +'<th style="width:30px"><input type="checkbox" class="ck" id="sa" onchange="SA(this)"/></th>'
  +'<th style="width:130px" id="thDate" class="hid" onclick="SO(\'sdd\')">Scheduled Delivery Date<br><input class="fi" placeholder="..." oninput="CF();event.stopPropagation()" onclick="event.stopPropagation()"></th>'
  +'<th style="width:50px" onclick="SO(\'t\')">Time<br><input class="fi" placeholder="..." oninput="CF();event.stopPropagation()" onclick="event.stopPropagation()"></th>'
  +'<th style="width:170px" onclick="SO(\'name\')">Customer<br><input class="fi" placeholder="..." oninput="CF();event.stopPropagation()" onclick="event.stopPropagation()"></th>'
  +'<th style="width:100px">RN<br><input class="fi" placeholder="..." oninput="CF();event.stopPropagation()" onclick="event.stopPropagation()"></th>'
  +'<th style="width:70px" onclick="SO(\'model\')">Vehicle<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="Model 3">M3</option><option value="Model Y">MY</option></select></th>'
  +'<th style="width:85px">Registration<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="OK">OK</option><option value="Hold">Hold</option><option value="Pending">Pending</option></select></th>'
  +'<th style="width:65px">Payment<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="OK">OK</option><option value="No">No</option></select></th>'
  +'<th style="width:70px">Trade-In<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="Accepted">Yes</option><option value="No">No</option></select></th>'
  +'<th style="width:80px">Vehicle<br>Status<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="Finished">FG</option><option value="Transit">Transit</option></select></th>'
  +'<th style="width:55px">Hold<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="Hold">Hold</option><option value="OK">OK</option></select></th>'
  +'<th style="width:65px">Insurance<br><select class="fi" onchange="CF()" onclick="event.stopPropagation()"><option value="">All</option><option value="OK">OK</option><option value="No">No</option></select></th>'
  +'</tr></thead><tbody id="tb"></tbody></table>'
  +'<div class="ft" id="trec"></div></div></div>'

  +'<script>'
  +'var AUTH={token:"Bearer '+at.replace(/"/g,'\\"')+'",userId:"'+ui+'"};'
  +'var BASE="https://mytdeliveryopsapi.tesla.com/api";'
  +'var CFG={trtId:28498,cc:"FR"};'
  +'var CES='+JSON.stringify(CES)+';'
  +'var DATA=[];'

  +'function PF(f,el){document.querySelectorAll(".hostbar .bt-q").forEach(function(p){p.classList.remove("on")});el.classList.add("on");document.querySelectorAll("#tb tr").forEach(function(r){if(f==="all"){r.style.display="";return}r.style.display=(r.dataset.host||"").toLowerCase().indexOf(f.split(" ")[0].toLowerCase())>=0?"":"none"});US();TR()}'

  +'function QD(offset,el){var sel=document.getElementById("dt");var opts=sel.options;var d=new Date(Date.now()+offset*864e5);var y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),dd=String(d.getDate()).padStart(2,"0");var v=y+"-"+m+"-"+dd;for(var i=0;i<opts.length;i++){if(opts[i].value===v){sel.selectedIndex=i;break}}document.querySelectorAll(".bt-q").forEach(function(b){b.classList.remove("on")});el.classList.add("on");WKMODE=false;showDateCol(false);L()}'

  +'async function QW(wk,el){document.querySelectorAll(".bt-q").forEach(function(b){b.classList.remove("on")});el.classList.add("on");WKMODE=true;showDateCol(true);var lg=document.getElementById("lg"),tbl=document.getElementById("tbl");lg.style.display="block";tbl.style.display="none";var h={"Authorization":AUTH.token,"Content-Type":"application/json","userid":AUTH.userId};try{var rule={condition:"and",extraHeaders:null,Countries:[{Abbreviation:"FR",Region:"EU"}],TrtIds:[CFG.trtId],ReferenceNumbers:[],Vins:[],IsScheduled:true,OrderStatus:["ORDER_PLACED","BOOKED"],VehicleStages:null,DeliveryStatus:null,IsContainmentHold:null,IsAmountDueComplete:null,IsInsuranceComplete:null,IsTradeInComplete:null,IsRegistrationComplete:null,IsPaymentComplete:null,MatchStatus:null,DeliveryTypes:null,VehicleType:null,VehicleModels:null,HasOpenCommunication:null,IsEnterpriseOrder:null,VehicleTitles:null,VehicleContainmentHoldTitle:[],VesselNames:[],OpenCaseTypes:[]};var body={condition:"and",rules:[rule],Skip:0,Take:500,SortOrder:[],SelectedColumns:[]};var adv=await fetch(BASE+"/advisor/Dashboard?isSidePanelFullScreen=false",{method:"POST",headers:h,body:JSON.stringify(body)}).then(function(r){return r.json()});var allAdv=adv.Data.Dashboard||[];if(!allAdv.length){lg.innerHTML="<div style=padding:60px;text-align:center;color:#aaa>No scheduled deliveries found.</div>";return}var now=new Date();var dow=now.getDay();var monOff=dow===0?1:1-dow;var mon=new Date(now.getFullYear(),now.getMonth(),now.getDate()+monOff+wk*7);var sat=new Date(mon.getTime()+5*864e5);sat.setHours(23,59,59);var startDate=mon;allAdv=allAdv.filter(function(a){if(!a.ScheduledDeliveryDate)return false;var sd=new Date(a.ScheduledDeliveryDate);return sd>=startDate&&sd<=sat&&sd.getDay()!==0});if(!allAdv.length){lg.innerHTML="<div style=padding:60px;text-align:center;color:#aaa>No deliveries "+(wk===0?"this":"next")+" week.</div>";return}var tiR={};allAdv.forEach(function(a){if(a.TradeInActionStatus==="COMPLETE_TRADE_IN")tiR[a.ReferenceNumber]={ms:"Accepted"}});DATA=allAdv.map(function(a){var sddRaw=a.ScheduledDeliveryDate||"";var sddShort="";var sortKey="";if(sddRaw){var sp=new Date(sddRaw);if(!isNaN(sp)){var fmtSDD=function(sp){var mm=String(sp.getMonth()+1).padStart(2,"0");var dd=String(sp.getDate()).padStart(2,"0");var yy=sp.getFullYear();var hh=sp.getHours();var mi=String(sp.getMinutes()).padStart(2,"0");var ampm=hh>=12?"PM":"AM";var h12=hh%12||12;return mm+"-"+dd+"-"+yy+" "+h12+":"+mi+" "+ampm};sddShort=fmtSDD(sp);sortKey=sp.toISOString()}}var t="?";if(sddRaw){var sp2=new Date(sddRaw);if(!isNaN(sp2)){t=String(sp2.getHours()).padStart(2,"0")+":"+String(sp2.getMinutes()).padStart(2,"0")}}var hp=!!(a.LicensePlate&&a.LicensePlate.trim()&&a.LicensePlate.indexOf("-")>=0);var hold=!!a.HasHold;var io=a.InsuranceActionStatus==="COMPLETE";var otg=a.VehicleStage==="Finished Goods"||a.VehicleStage==="Arrived at VRL"||(a.VehicleStage&&a.VehicleStage.indexOf("Arrived")>=0);var amtOk=a.AmountDueActionStatus==="Yes"||a.PaymentMethodActionStatus==="COMPLETE";var al=[];if(!hp)al.push("P");if(!otg)al.push("O");if(!amtOk)al.push("$");if(hold)al.push("H");var r=tiR[a.ReferenceNumber];var tms=r?r.ms:"";if(tms.indexOf(" - ")>=0)tms=tms.split(" - ")[0];var clientName=a.CustomerName;var di=a.DriverInfo;if(a.IsEnterpriseOrder&&di&&di.first_name)clientName=di.first_name+" "+di.last_name+" ("+a.CustomerName+")";var vsShort=a.VehicleStage||"";if(vsShort==="Finished Goods")vsShort="Finished Goods";else if(vsShort.indexOf("Receiving")>=0)vsShort="Receiving Insp.";else if(vsShort.indexOf("Transit")>=0)vsShort="In Transit";else if(vsShort.indexOf("PDI")>=0)vsShort="PDI Pending";else if(vsShort.indexOf("Ready")>=0)vsShort="Ready for Prep";else if(vsShort.indexOf("Wash")>=0||vsShort.indexOf("Charge")>=0)vsShort="Wash/Charge";else if(vsShort.indexOf("Service")>=0)vsShort="In Service";return{rn:a.ReferenceNumber,name:clientName,t:t,date:sortKey,sdd:sddShort,sddRaw:sddRaw,model:a.VehicleModel,color:a.VehicleColor||"",plate:(a.LicensePlate||"").trim(),regTxt:hp?"OK":"Pending",regOk:hp,host:a.DeliverySpecialist||"?",b2b:a.IsEnterpriseOrder,hp:hp,hold:hold,io:io,otg:otg,vs:vsShort,al:al,tims:tms,amtOk:amtOk}}).sort(function(a,b){return(a.date+a.t).localeCompare(b.date+b.t)});RW();var ok=DATA.filter(function(d){return d.al.length===0}).length;var pOk=DATA.filter(function(d){return d.amtOk}).length;var oOk=DATA.filter(function(d){return d.otg}).length;var plOk=DATA.filter(function(d){return d.regOk}).length;var tiOk2=DATA.filter(function(d){return d.tims}).length;var asOk=DATA.filter(function(d){return d.io}).length;var N=DATA.length;document.getElementById("sT").textContent=N;document.getElementById("sT").className="sn b";document.getElementById("sO").textContent=ok;document.getElementById("sO").className="sn"+(ok>0?" g":" x");document.getElementById("sA").textContent=N-ok;document.getElementById("sA").className="sn"+((N-ok)>0?" r":" x");document.getElementById("sP").innerHTML="<div class=top>"+pOk+"</div><div class=div>"+N+"</div>";document.getElementById("sOTG").innerHTML="<div class=top>"+oOk+"</div><div class=div>"+N+"</div>";document.getElementById("sPl").innerHTML="<div class=top>"+plOk+"</div><div class=div>"+N+"</div>";document.getElementById("sTI").innerHTML="<div class=top>"+tiOk2+"</div><div class=div>"+N+"</div>";document.getElementById("sAs").innerHTML="<div class=top>"+asOk+"</div><div class=div>"+N+"</div>";lg.style.display="none";tbl.style.display="";document.getElementById("gn").style.display="";document.getElementById("disp").style.display="";TR();document.getElementById("sa").checked=true}catch(err){lg.innerHTML="<div style=padding:60px;text-align:center;color:#c00>Error: "+err.message+"</div>"}}'

  // QP - Pull-Up Potential (ready vehicles, no enterprise, future SDD)
  +'async function QP(el){document.querySelectorAll(".bt-q").forEach(function(b){b.classList.remove("on")});el.classList.add("on");WKMODE=true;showDateCol(true);var lg=document.getElementById("lg"),tbl=document.getElementById("tbl");lg.style.display="block";tbl.style.display="none";var h={"Authorization":AUTH.token,"Content-Type":"application/json","userid":AUTH.userId};try{var rule={condition:"and",extraHeaders:null,Countries:[{Abbreviation:"FR",Region:"EU"}],TrtIds:[CFG.trtId],ReferenceNumbers:[],Vins:[],IsScheduled:true,OrderStatus:["ORDER_PLACED","BOOKED"],VehicleStages:null,DeliveryStatus:null,IsContainmentHold:null,IsAmountDueComplete:null,IsInsuranceComplete:null,IsTradeInComplete:null,IsRegistrationComplete:null,IsPaymentComplete:null,MatchStatus:null,DeliveryTypes:null,VehicleType:null,VehicleModels:null,HasOpenCommunication:null,IsEnterpriseOrder:null,VehicleTitles:null,VehicleContainmentHoldTitle:[],VesselNames:[],OpenCaseTypes:[]};var body={condition:"and",rules:[rule],Skip:0,Take:500,SortOrder:[],SelectedColumns:[]};var adv=await fetch(BASE+"/advisor/Dashboard?isSidePanelFullScreen=false",{method:"POST",headers:h,body:JSON.stringify(body)}).then(function(r){return r.json()});var allAdv=adv.Data.Dashboard||[];var now=new Date();var today=new Date(now.getFullYear(),now.getMonth(),now.getDate());var tomorrow=new Date(today.getTime()+864e5);allAdv=allAdv.filter(function(a){if(!a.ScheduledDeliveryDate)return false;var sd=new Date(a.ScheduledDeliveryDate);if(sd<tomorrow||sd.getDay()===0)return false;if(a.IsEnterpriseOrder)return false;if(a.HasHold)return false;var otg=a.VehicleStage==="Finished Goods"||a.VehicleStage==="Arrived at VRL"||(a.VehicleStage&&a.VehicleStage.indexOf("Arrived")>=0);if(!otg)return false;var amtOk=a.AmountDueActionStatus==="Yes"||a.PaymentMethodActionStatus==="COMPLETE";if(!amtOk)return false;var hp=!!(a.LicensePlate&&a.LicensePlate.trim()&&a.LicensePlate.indexOf("-")>=0);if(!hp)return false;if(a.TradeInActionStatus==="COMPLETE_TRADE_IN"||a.TradeInActionStatus==="NO_TRADE_IN"||!a.TradeInActionStatus)return true;return false});if(!allAdv.length){lg.innerHTML="<div style=padding:60px;text-align:center;color:#aaa>No pull-up candidates found.</div>";return}var tiR={};allAdv.forEach(function(a){if(a.TradeInActionStatus==="COMPLETE_TRADE_IN")tiR[a.ReferenceNumber]={ms:"Accepted"}});DATA=allAdv.map(function(a){var sddRaw=a.ScheduledDeliveryDate||"";var sddShort="";var sortKey="";if(sddRaw){var sp=new Date(sddRaw);if(!isNaN(sp)){var fmtSDD=function(sp){var mm=String(sp.getMonth()+1).padStart(2,"0");var dd=String(sp.getDate()).padStart(2,"0");var yy=sp.getFullYear();var hh=sp.getHours();var mi=String(sp.getMinutes()).padStart(2,"0");var ampm=hh>=12?"PM":"AM";var h12=hh%12||12;return mm+"-"+dd+"-"+yy+" "+h12+":"+mi+" "+ampm};sddShort=fmtSDD(sp);sortKey=sp.toISOString()}}var t="?";if(sddRaw){var sp2=new Date(sddRaw);if(!isNaN(sp2)){t=String(sp2.getHours()).padStart(2,"0")+":"+String(sp2.getMinutes()).padStart(2,"0")}}var r=tiR[a.ReferenceNumber];var tms=r?r.ms:"";if(tms.indexOf(" - ")>=0)tms=tms.split(" - ")[0];var clientName=a.CustomerName;var di=a.DriverInfo;if(a.IsEnterpriseOrder&&di&&di.first_name)clientName=di.first_name+" "+di.last_name+" ("+a.CustomerName+")";var vsShort=a.VehicleStage||"";if(vsShort==="Finished Goods")vsShort="Finished Goods";else if(vsShort.indexOf("Arrived")>=0)vsShort="Arrived at VRL";return{rn:a.ReferenceNumber,name:clientName,t:t,date:sortKey,sdd:sddShort,sddRaw:sddRaw,model:a.VehicleModel,color:a.VehicleColor||"",plate:(a.LicensePlate||"").trim(),regTxt:"OK",regOk:true,host:a.DeliverySpecialist||"?",b2b:false,hp:true,hold:false,io:a.InsuranceActionStatus==="COMPLETE",otg:true,vs:vsShort,al:[],tims:tms,amtOk:true}}).sort(function(a,b){return(a.date+a.t).localeCompare(b.date+b.t)});RW();var N=DATA.length;var asOk=DATA.filter(function(d){return d.io}).length;document.getElementById("sT").textContent=N;document.getElementById("sT").className="sn b";document.getElementById("sO").textContent=N;document.getElementById("sO").className="sn g";document.getElementById("sA").textContent=0;document.getElementById("sA").className="sn x";document.getElementById("sP").innerHTML="<div class=top>"+N+"</div><div class=div>"+N+"</div>";document.getElementById("sOTG").innerHTML="<div class=top>"+N+"</div><div class=div>"+N+"</div>";document.getElementById("sPl").innerHTML="<div class=top>"+N+"</div><div class=div>"+N+"</div>";document.getElementById("sTI").innerHTML="<div class=top>"+DATA.filter(function(d){return d.tims}).length+"</div><div class=div>"+N+"</div>";document.getElementById("sAs").innerHTML="<div class=top>"+asOk+"</div><div class=div>"+N+"</div>";lg.style.display="none";tbl.style.display="";document.getElementById("gn").style.display="";document.getElementById("disp").style.display="";TR();document.getElementById("sa").checked=true}catch(err){lg.innerHTML="<div style=padding:60px;text-align:center;color:#c00>Error: "+err.message+"</div>"}}'

  +'function ND(dir){var sel=document.getElementById("dt");var ni=sel.selectedIndex+dir;if(ni>=0&&ni<sel.options.length){sel.selectedIndex=ni;document.querySelectorAll(".bt-q").forEach(function(b){b.classList.remove("on")});WKMODE=false;showDateCol(false);L()}}'

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
  +'var tiR={};await Promise.all(tiC.map(function(a){return fetch(BASE+"/widget/GetTradeInWidgetInfo?referenceNumber="+a.ReferenceNumber+"&vehicleMapId="+a.VehicleMapId+"&deliveryState="+encodeURIComponent(a.DeliveryState||""),{headers:h}).then(function(r){return r.json()}).then(function(j){if(j.Data)tiR[a.ReferenceNumber]={ms:j.Data.AcquisitionMilestone||""}}).catch(function(){})}));'
  +'var regR={};var plated=adv.Data.Dashboard.filter(function(a){return a.LicensePlate&&a.LicensePlate.indexOf("-")>=0});await Promise.all(plated.map(function(a){return fetch(BASE+"/widget/GetGlobalRegistrationInfo?referenceNumber="+a.ReferenceNumber+"&vin="+(a.Vin||"")+"&countryCode=FR&registrationState="+encodeURIComponent(a.RegistrationState||""),{headers:h}).then(function(r){return r.json()}).then(function(j){if(j.Data)regR[a.ReferenceNumber]=j.Data.RegistrationStatusId}).catch(function(){})}));'
  +'DATA=adv.Data.Dashboard.map(function(a){var d=dm[a.ReferenceNumber]||{};var dt=d.ScheduledDeliveryStartDateString||"";var t="?",m=dt.match(/(\\d{1,2}):(\\d{2})\\s*(AM|PM)/i);if(m){var hr=parseInt(m[1]);if(m[3].toUpperCase()==="PM"&&hr<12)hr+=12;if(m[3].toUpperCase()==="AM"&&hr===12)hr=0;t=String(hr).padStart(2,"0")+":"+m[2]}var hp=!!(a.LicensePlate&&a.LicensePlate.trim()&&a.LicensePlate.indexOf("-")>=0);var regId=regR[a.ReferenceNumber];var regOk=hp&&regId===4;var regTxt=hp?(regId===4?"OK":regId===-1?"On Hold":regId===0?"Pending":"ID:"+regId):"Pending";var hold=!!a.HasHold;var io=a.InsuranceActionStatus==="COMPLETE";var otg=a.VehicleStage==="Finished Goods"||a.VehicleStage==="Arrived at VRL"||(a.VehicleStage&&a.VehicleStage.indexOf("Arrived")>=0);var amtOk=a.AmountDueActionStatus==="Yes"||a.PaymentMethodActionStatus==="COMPLETE";var al=[];if(!regOk)al.push("P");if(!otg)al.push("O");if(!amtOk)al.push("$");if(hold)al.push("H");var r=tiR[a.ReferenceNumber];var tms=r?r.ms:"";if(tms.indexOf(" - ")>=0)tms=tms.split(" - ")[0];var clientName=a.CustomerName;var di=a.DriverInfo;if(a.IsEnterpriseOrder&&di&&di.first_name)clientName=di.first_name+" "+di.last_name+" ("+a.CustomerName+")";var vsShort=a.VehicleStage||"";if(vsShort==="Finished Goods")vsShort="Finished Goods";else if(vsShort.indexOf("Receiving")>=0)vsShort="Receiving Insp.";else if(vsShort.indexOf("Transit")>=0)vsShort="In Transit";else if(vsShort.indexOf("PDI")>=0)vsShort="PDI Pending";else if(vsShort.indexOf("Ready")>=0)vsShort="Ready for Prep";else if(vsShort.indexOf("Wash")>=0||vsShort.indexOf("Charge")>=0)vsShort="Wash/Charge";else if(vsShort.indexOf("Service")>=0)vsShort="In Service";return{rn:a.ReferenceNumber,name:clientName,t:t,date:ds,sdd:"",model:a.VehicleModel,color:a.VehicleColor||"",plate:(a.LicensePlate||"").trim(),regTxt:regTxt,regOk:regOk,host:d.HostName||"?",b2b:a.IsEnterpriseOrder,hp:hp,hold:hold,io:io,otg:otg,vs:vsShort,al:al,tims:tms,amtOk:amtOk}}).sort(function(a,b){return a.t.localeCompare(b.t)});'
  +'RW();'
  +'var ok=DATA.filter(function(d){return d.al.length===0}).length;'
  +'var pOk=DATA.filter(function(d){return d.amtOk}).length;'
  +'var oOk=DATA.filter(function(d){return d.otg}).length;'
  +'var plOk=DATA.filter(function(d){return d.regOk}).length;'
  +'var tiOk=DATA.filter(function(d){return d.tims}).length;'
  +'var asOk=DATA.filter(function(d){return d.io}).length;'
  +'document.getElementById("sT").textContent=DATA.length;document.getElementById("sT").className="sn b";'
  +'document.getElementById("sO").textContent=ok;document.getElementById("sO").className="sn"+(ok>0?" g":" x");'
  +'document.getElementById("sA").textContent=DATA.length-ok;document.getElementById("sA").className="sn"+((DATA.length-ok)>0?" r":" x");'
  +'var N=DATA.length;'
  +'document.getElementById("sP").innerHTML="<div class=top>"+pOk+"</div><div class=div>"+N+"</div>";'
  +'document.getElementById("sOTG").innerHTML="<div class=top>"+oOk+"</div><div class=div>"+N+"</div>";'
  +'document.getElementById("sPl").innerHTML="<div class=top>"+plOk+"</div><div class=div>"+N+"</div>";'
  +'document.getElementById("sTI").innerHTML="<div class=top>"+tiOk+"</div><div class=div>"+N+"</div>";'
  +'document.getElementById("sAs").innerHTML="<div class=top>"+asOk+"</div><div class=div>"+N+"</div>";'
  +'lg.style.display="none";tbl.style.display="";document.getElementById("gn").style.display="";document.getElementById("disp").style.display="";TR();'
  +'document.getElementById("sa").checked=true;'
  +'}catch(err){lg.innerHTML="<div style=padding:60px;text-align:center;color:#c00>Error: "+err.message+"</div>"}}'

  +'function RW(){var tb=document.getElementById("tb");var out="";for(var i=0;i<DATA.length;i++){var d=DATA[i];var vc=d.otg?"dg":(d.vs.indexOf("Transit")>=0?"do":"dr");var rc=d.regOk?"<span class=\\"dt dg\\"></span>OK":d.regTxt==="On Hold"?"<span class=\\"dt dr\\"></span><b style=color:#c00>On Hold</b>":d.regTxt==="Pending"?"<span class=\\"dt do\\"></span>Pending":"<span class=su>"+d.regTxt+"</span>";out+="<tr class=\\""+(d.al.length?"w":"")+"\\" data-host=\\""+d.host+"\\"><td><input type=checkbox class=\\"ck rc\\" data-i="+i+" "+(d.al.length===0?"checked":"")+"></td><td class=dtc>"+(d.sdd||"")+"</td><td>"+d.t+"</td><td><span class=nm>"+d.name+"</span></td><td><a class=rl href=\\"https://dro.tesla.com/advisor?sidepanel_fullscreen=yes&rn="+d.rn+"\\" target=_blank>"+d.rn+"</a></td><td>"+d.model+"</td><td>"+rc+"</td><td>"+(d.amtOk?"<span class=\\"dt dg\\"></span>OK":"<span class=\\"dt dr\\"></span>No")+"</td><td>"+(d.tims?"<span class=\\"dt dg\\"></span>"+d.tims:"<span class=su>No</span>")+"</td><td><span class=\\"dt "+vc+"\\"></span>"+d.vs+"</td><td>"+(d.hold?"<span class=\\"dt dr\\"></span><b style=color:#c00>Hold</b>":"<span class=\\"dt dg\\"></span>OK")+"</td><td>"+(d.io?"<span class=\\"dt dg\\"></span>OK":"<span class=su>No</span>")+"</td></tr>"}tb.innerHTML=out;if(WKMODE)showDateCol(true)}'

  +'function G(){var c=[];document.querySelectorAll(".rc:checked").forEach(function(el){var tr=el.closest("tr");if(tr&&tr.style.display!=="none"){var i=parseInt(el.dataset.i);if(DATA[i])c.push(DATA[i])}});if(!c.length){alert("No deliveries selected!");return}alert("Generating "+c.length+" cover pages...")}'

  +'async function DISPATCH(){var hosts=[{name:"Ben Daubin",id:"428058"},{name:"Sacha Villa",id:"399921"},{name:"Sophie MACE",id:"444287"}];var items=DATA;if(!items.length){alert("No deliveries!");return}if(!confirm("Dispatch "+items.length+" deliveries between "+hosts.map(function(h){return h.name}).join(", ")+"?"))return;var btn=document.getElementById("disp");btn.textContent="...";btn.disabled=true;var ok=0,fail=0;for(var i=0;i<items.length;i++){var d=items[i];var host=hosts[i%hosts.length];try{var r=await fetch(BASE+"/deliveryops/Customers/UpdateHost?referenceNumber="+d.rn+"&value="+host.id,{method:"POST",headers:{"Authorization":AUTH.token,"Content-Type":"application/json","userid":AUTH.userId}});if(r.ok)ok++;else fail++}catch(e){fail++}}btn.textContent="Dispatch";btn.disabled=false;alert("Dispatch complete!\\n"+ok+" OK / "+fail+" errors")}'

  +'var sortDir={};function SO(k){sortDir[k]=!sortDir[k];DATA.sort(function(a,b){var v=sortDir[k]?1:-1;return(a[k]||"").toString().localeCompare((b[k]||"").toString())*v});RW()}'

  +'document.getElementById("srch").oninput=function(){var q=this.value.toLowerCase();document.querySelectorAll("#tb tr").forEach(function(r){r.style.display=r.textContent.toLowerCase().indexOf(q)>=0?"":"none"});TR()};'

  +'function SF(t,el){document.querySelectorAll(".si").forEach(function(s){s.classList.remove("on")});el.classList.add("on");document.querySelectorAll("#tb tr").forEach(function(r){if(t==="all"){r.style.display=""}else if(t==="ok"){r.style.display=r.classList.contains("w")?"none":""}else{r.style.display=r.classList.contains("w")?"":"none"}});TR()}'

  +'function CF(){var fils=document.querySelectorAll(".fi");document.querySelectorAll("#tb tr").forEach(function(r){var cells=r.querySelectorAll("td");var show=true;fils.forEach(function(f,i){var v=f.value.toLowerCase();if(!v)return;var cell=cells[i+1];if(!cell)return;var txt=cell.textContent.toLowerCase();if(txt.indexOf(v)<0)show=false});r.style.display=show?"":"none"});TR()}'

  +'function TR(){var v=0;document.querySelectorAll("#tb tr").forEach(function(r){if(r.style.display!=="none")v++});document.getElementById("trec").textContent="Total Records: "+v}'
  +'function US(){var tot=0,ok=0,al=0;document.querySelectorAll("#tb tr").forEach(function(r){if(r.style.display==="none")return;tot++;if(r.classList.contains("w"))al++;else ok++});document.getElementById("sT").textContent=tot;document.getElementById("sO").textContent=ok;document.getElementById("sA").textContent=al}'

  +'</scr'+'ipt></body></html>');
  w.document.close();
})();
