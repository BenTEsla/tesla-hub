// Tesla Delivery Hub v11 — Runs from Intrepid (battery + OTG) + DRO token
(function(){
  // Step 1: Get DRO token from localStorage
  var tk=(localStorage.getItem('delops_id_token')||'').replace(/^"|"$/g,'');
  var t2=(localStorage.getItem('delops_id_token_data')||'').replace(/^"|"$/g,'');
  var ui=(localStorage.getItem('UserId')||'').replace(/^"|"$/g,'');
  var at=tk&&tk.length>100?tk:t2&&t2.length>100?t2:null;
  if(!at||!ui){alert('Token DRO non trouve. Connecte-toi a DRO d\'abord.');return}

  // Step 2: Store token in sessionStorage for cross-tab access
  sessionStorage.setItem('tdh_token', at);
  sessionStorage.setItem('tdh_userid', ui);

  // Step 3: Navigate to Intrepid (same user session, cookies will work)
  // We'll inject our dashboard code there
  var w = window.open('https://intrepid.tesla.com/cogs/vehiclereadiness/customer?date=' + new Date().toISOString().split('T')[0], '_blank');
  if(!w){alert('Popup bloque!');return}

  // Step 4: Wait for Intrepid to load, then inject our dashboard
  var checkInterval = setInterval(function(){
    try {
      if(w.document && w.document.readyState === 'complete') {
        clearInterval(checkInterval);
        // Inject our code after Intrepid loads
        w.sessionStorage.setItem('tdh_token', at);
        w.sessionStorage.setItem('tdh_userid', ui);
        // Now we can call both Intrepid API (same domain) and DRO API (via token)
        alert('Intrepid charge. Colle le code dashboard dans la console de cet onglet.');
      }
    } catch(e) {
      // Cross-origin, can't access yet
    }
  }, 1000);
})();
