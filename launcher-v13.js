// Tesla Delivery Hub v13 — 1-CLICK LAUNCHER
// Paste on DRO. Sets cookie + opens Intrepid + auto-loads dashboard.
(function(){
  var tk=(localStorage.getItem('delops_id_token')||'').replace(/^"|"$/g,'');
  var t2=(localStorage.getItem('delops_id_token_data')||'').replace(/^"|"$/g,'');
  var ui=(localStorage.getItem('UserId')||'').replace(/^"|"$/g,'');
  var at=tk&&tk.length>100?tk:t2&&t2.length>100?t2:null;
  if(!at||!ui){alert('Token DRO non trouve!');return}

  // Store token in .tesla.com cookie (readable from Intrepid!)
  document.cookie='tdh_tk='+encodeURIComponent(at)+';domain=.tesla.com;path=/;max-age=3600;SameSite=Lax';
  document.cookie='tdh_uid='+ui+';domain=.tesla.com;path=/;max-age=3600;SameSite=Lax';

  // Open Intrepid
  var d=new Date();
  var ds=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  window.open('https://intrepid.tesla.com/cogs/vehiclereadiness/customer?date='+ds,'_blank');
})();
