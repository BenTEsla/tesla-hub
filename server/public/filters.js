// Dynamic filters - populated from actual DATA values after each load
// Each select.fi with an id (fVehicle, fReg, fPay, fTI, fVS, fHold, fIns)
// gets its options built from the real data values.

function populateFilters(DATA) {
  var filters = {
    fVehicle: function(d) { return d.model || ''; },
    fReg:     function(d) { return d.regOk ? 'OK' : (d.regTxt || 'Pending'); },
    fPay:     function(d) { return d.amtOk ? 'OK' : 'No'; },
    fTI:      function(d) {
      if (!d.hasTI) return '';
      if (d.tims && d.tims.indexOf('Approved') >= 0) return 'Approved';
      if (d.tims && d.tims.indexOf('Received') >= 0) return 'Received';
      return 'Pending';
    },
    fVS:      function(d) { return d.vs || ''; },
    fHold:    function(d) { return d.hold ? 'Hold' : 'OK'; },
    fIns:     function(d) { return d.io ? 'OK' : 'No'; }
  };

  Object.keys(filters).forEach(function(id) {
    var sel = document.getElementById(id);
    if (!sel) return;
    var prev = sel.value; // preserve selection
    var vals = {};
    DATA.forEach(function(d) {
      var v = filters[id](d);
      if (v) vals[v] = (vals[v] || 0) + 1;
    });
    // Sort keys alphabetically
    var keys = Object.keys(vals).sort();
    // Build options
    var html = '<option value="">All</option>';
    keys.forEach(function(k) {
      html += '<option value="' + k + '">' + k + ' (' + vals[k] + ')</option>';
    });
    sel.innerHTML = html;
    // Restore previous selection if still valid
    if (prev) {
      for (var i = 0; i < sel.options.length; i++) {
        if (sel.options[i].value === prev) { sel.selectedIndex = i; break; }
      }
    }
  });
}

function initFilters(DATA) {
  populateFilters(DATA);
  document.querySelectorAll('.fi').forEach(function(f) {
    f.onchange = function() { applyFilters(DATA); };
  });
}

function applyFilters(DATA) {
  // Gather filter values by id
  var fVehicle = (document.getElementById('fVehicle') || {}).value || '';
  var fReg     = (document.getElementById('fReg') || {}).value || '';
  var fPay     = (document.getElementById('fPay') || {}).value || '';
  var fTI      = (document.getElementById('fTI') || {}).value || '';
  var fVS      = (document.getElementById('fVS') || {}).value || '';
  var fHold    = (document.getElementById('fHold') || {}).value || '';
  var fIns     = (document.getElementById('fIns') || {}).value || '';

  document.querySelectorAll('#tb tr').forEach(function(r) {
    var ci = r.querySelector('.rc');
    if (!ci) return;
    var idx = parseInt(ci.dataset.i);
    if (isNaN(idx)) return;
    var d = DATA[idx];
    if (!d) { r.style.display = 'none'; return; }

    var ok = true;

    // Vehicle Model
    if (fVehicle && d.model !== fVehicle) ok = false;

    // Registration
    if (fReg) {
      var regVal = d.regOk ? 'OK' : (d.regTxt || 'Pending');
      if (regVal !== fReg) ok = false;
    }

    // Payment
    if (fPay) {
      var payVal = d.amtOk ? 'OK' : 'No';
      if (payVal !== fPay) ok = false;
    }

    // Trade-In
    if (fTI) {
      var tiVal = '';
      if (d.hasTI) {
        if (d.tims && d.tims.indexOf('Approved') >= 0) tiVal = 'Approved';
        else if (d.tims && d.tims.indexOf('Received') >= 0) tiVal = 'Received';
        else tiVal = 'Pending';
      }
      if (tiVal !== fTI) ok = false;
    }

    // Vehicle Status
    if (fVS && d.vs !== fVS) ok = false;

    // Hold
    if (fHold) {
      var holdVal = d.hold ? 'Hold' : 'OK';
      if (holdVal !== fHold) ok = false;
    }

    // Insurance
    if (fIns) {
      var insVal = d.io ? 'OK' : 'No';
      if (insVal !== fIns) ok = false;
    }

    r.style.display = ok ? '' : 'none';
  });

  if (typeof TR === 'function') TR();
}
