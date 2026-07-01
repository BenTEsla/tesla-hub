// Tesla Delivery Hub v12 — Single script on Intrepid
// Step 1: On DRO, run this in console to copy your token:
//   copy(localStorage.getItem('delops_id_token'))
// Step 2: On Intrepid, paste this entire script. It will ask for the token.

(function(){
  // Try to get token from prompt or from a previous session
  var savedToken = sessionStorage.getItem('tdh_dro_token');
  var savedUid = sessionStorage.getItem('tdh_dro_uid');
  
  if (!savedToken) {
    var input = prompt('Colle ton token DRO ici.\n\nPour le copier: sur DRO, console F12, tape:\ncopy(localStorage.getItem("delops_id_token"))');
    if (!input) { alert('Token requis!'); return; }
    savedToken = input.replace(/^"|"$/g, '');
    sessionStorage.setItem('tdh_dro_token', savedToken);
  }
  if (!savedUid) {
    savedUid = prompt('Tape ton UserId (ex: 428058)') || '428058';
    sessionStorage.setItem('tdh_dro_uid', savedUid);
  }

  var droToken = savedToken;
  var droUserId = savedUid;
