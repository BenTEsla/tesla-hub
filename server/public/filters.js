// Filters logic - served as separate JS to avoid quote issues in bookmarklet
function initFilters(DATA) {
  var fils = document.querySelectorAll('.fi');
  fils.forEach(function(f) { f.onchange = function() { applyFilters(DATA); }; });
}

function applyFilters(DATA) {
  var fils = document.querySelectorAll('.fi');
  var v = [];
  fils.forEach(function(f) { v.push(f.value); });
  
  document.querySelectorAll('#tb tr').forEach(function(r) {
    var ci = r.querySelector('.rc');
    if (!ci) return;
    var idx = parseInt(ci.dataset.i);
    if (isNaN(idx)) return;
    var d = DATA[idx];
    if (!d) { r.style.display = 'none'; return; }
    
    var ok = true;
    
    // Filter 0: Vehicle Model
    if (v[0] && d.model.indexOf(v[0]) < 0) ok = false;
    
    // Filter 1: Registration
    if (v[1]) {
      if (v[1] === 'OK' && !d.regOk) ok = false;
      if (v[1] === 'Pending' && d.regOk) ok = false;
      if (v[1] === 'Hold' && d.regTxt !== 'On Hold') ok = false;
    }
    
    // Filter 2: Payment
    if (v[2]) {
      if (v[2] === 'OK' && !d.amtOk) ok = false;
      if (v[2] === 'No' && d.amtOk) ok = false;
    }
    
    // Filter 3: Trade-In
    if (v[3]) {
      if (v[3] === 'Yes' && !d.tims) ok = false;
      if (v[3] === 'No' && d.tims) ok = false;
      if (v[3] === 'Approved' && (!d.tims || d.tims.indexOf('Approved') < 0)) ok = false;
      if (v[3] === 'Received' && (!d.tims || d.tims.indexOf('Received') < 0)) ok = false;
    }
    
    // Filter 4: Vehicle Status
    if (v[4]) {
      if (v[4] === 'OTG' && (!d.otg || d.delivered)) ok = false;
      if (v[4] === 'Delivered' && !d.delivered) ok = false;
      if (v[4] === 'Transit' && (d.otg || d.delivered)) ok = false;
    }
    
    // Filter 5: Hold
    if (v[5]) {
      if (v[5] === 'Hold' && !d.hold) ok = false;
      if (v[5] === 'OK' && d.hold) ok = false;
    }
    
    // Filter 6: Insurance
    if (v[6]) {
      if (v[6] === 'OK' && !d.io) ok = false;
      if (v[6] === 'No' && d.io) ok = false;
    }
    
    r.style.display = ok ? '' : 'none';
  });
  
  // Update record count
  if (typeof TR === 'function') TR();
}
