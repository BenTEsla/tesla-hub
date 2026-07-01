// Tesla Delivery Hub v11 — Launch from DRO, open Intrepid with token in hash
(function(){
  var tk=(localStorage.getItem('delops_id_token')||'').replace(/^"|"$/g,'');
  var t2=(localStorage.getItem('delops_id_token_data')||'').replace(/^"|"$/g,'');
  var ui=(localStorage.getItem('UserId')||'').replace(/^"|"$/g,'');
  var at=tk&&tk.length>100?tk:t2&&t2.length>100?t2:null;
  if(!at||!ui){alert('Token DRO non trouve!');return}

  // Pass token via URL hash (not sent to server, stays in browser)
  var d=new Date();var ds=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  var url='https://intrepid.tesla.com/cogs/vehiclereadiness/customer?date='+ds+'#tdh='+encodeURIComponent(at)+'&uid='+ui;
  window.open(url,'_blank');
})();
