// Tesla Delivery Hub v10 — Navigate to clean page, then build UI
// Step 1: Save auth token
var _tk=(localStorage.getItem('delops_id_token')||'').replace(/^"|"$/g,'');
var _t2=(localStorage.getItem('delops_id_token_data')||'').replace(/^"|"$/g,'');
var _ui=(localStorage.getItem('UserId')||'').replace(/^"|"$/g,'');
var _at=_tk&&_tk.length>100?_tk:_t2&&_t2.length>100?_t2:null;

if(!_at||!_ui){alert('Token non trouve. Connecte-toi a DRO d\'abord.');throw'no token'}

// Step 2: Save token in sessionStorage (survives navigation)
sessionStorage.setItem('tdh_token',_at);
sessionStorage.setItem('tdh_userid',_ui);

// Step 3: Navigate to a static asset on dro.tesla.com (no Angular!)
location.href='https://dro.tesla.com/assets/icons/dashboard/vehicle.svg';
