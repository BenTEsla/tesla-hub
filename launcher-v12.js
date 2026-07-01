// Tesla Delivery Hub v12 — Single-click launcher
// Paste on DRO. Opens Intrepid and auto-loads dashboard from GitHub.
(function(){
  var tk=(localStorage.getItem('delops_id_token')||'').replace(/^"|"$/g,'');
  var t2=(localStorage.getItem('delops_id_token_data')||'').replace(/^"|"$/g,'');
  var ui=(localStorage.getItem('UserId')||'').replace(/^"|"$/g,'');
  var at=tk&&tk.length>100?tk:t2&&t2.length>100?t2:null;
  if(!at||!ui){alert('Token DRO non trouve!');return}

  var d=new Date();
  var ds=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');

  // Open Intrepid with token in hash + auto-load script
  var hash='#tdh='+encodeURIComponent(at)+'&uid='+ui;
  var url='https://intrepid.tesla.com/cogs/vehiclereadiness/customer?date='+ds+hash;
  var w=window.open(url,'_blank');
  if(!w){alert('Popup bloque! Autorise les popups pour dro.tesla.com');return}

  // Poll until Intrepid loads, then inject dashboard script from GitHub
  var attempts=0;
  var timer=setInterval(function(){
    attempts++;
    if(attempts>30){clearInterval(timer);return} // timeout after 30s
    try{
      // Check if Intrepid page is loaded
      if(w.document&&w.document.readyState==='complete'){
        clearInterval(timer);
        // Inject script tag that loads dashboard from GitHub
        var s=w.document.createElement('script');
        s.src='https://raw.githubusercontent.com/BenTEsla/tesla-hub/main/dashboard.js?v='+Date.now();
        w.document.body.appendChild(s);
      }
    }catch(e){
      // Cross-origin - can't access yet, keep trying
    }
  },1000);
})();
