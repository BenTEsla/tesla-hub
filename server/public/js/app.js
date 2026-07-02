/* DASH v4.0 - Delivery Automation Smart Hub - Application Logic */

/* ============================================
   GLOBAL STATE
   ============================================ */
var WKMODE = false;
var sortDir = {};
var activeFilter = null;

/* ============================================
   CES BLOCK INIT - Build CES stat cards
   ============================================ */
(function initCESBlock() {
  var block = document.getElementById('cesBlock');
  if (!block) return;
  var html = '';
  for (var i = 0; i < CES.length; i++) {
    html += '<div class="si' + (i === 0 ? ' on' : '') + '" onclick="PF(\'' + CES[i] + '\',this)">'
          + '<div class="sn" id="c' + i + '">-</div>'
          + '<div class="sl">' + CES[i].split(' ')[0] + '</div></div>';
  }
  block.innerHTML = html;
})();

/* ============================================
   FILTER: by CES (person)
   ============================================ */
function PF(f, el) {
  document.querySelectorAll(".sb:last-child .si").forEach(function(p) {
    p.classList.remove("on");
  });
  el.classList.add("on");
  document.querySelectorAll("#tb tr").forEach(function(r) {
    if (f === "all") {
      r.style.display = "";
      return;
    }
    r.style.display = (r.dataset.host || "").toLowerCase().indexOf(f.split(" ")[0].toLowerCase()) >= 0 ? "" : "none";
  });
  US();
  TR();
}

/* ============================================
   FILTER: by status (all / ok / alert)
   ============================================ */
function SF(t, el) {
  document.querySelectorAll(".si").forEach(function(s) {
    s.classList.remove("on");
  });
  el.classList.add("on");
  document.querySelectorAll("#tb tr").forEach(function(r) {
    if (t === "all") {
      r.style.display = "";
    } else if (t === "ok") {
      r.style.display = r.classList.contains("w") ? "none" : "";
    } else {
      r.style.display = r.classList.contains("w") ? "" : "none";
    }
  });
  TR();
}

/* ============================================
   FILTER: by readiness dimension
   ============================================ */
function SFR(f, el) {
  document.querySelectorAll(".si").forEach(function(s) {
    s.classList.remove("on");
  });
  if (activeFilter === f) {
    activeFilter = null;
    document.querySelectorAll("#tb tr").forEach(function(r) {
      r.style.display = "";
    });
    el.parentElement.parentElement.querySelector(".si").classList.add("on");
    TR();
    return;
  }
  activeFilter = f;
  el.classList.add("on");
  document.querySelectorAll("#tb tr").forEach(function(r) {
    var i = parseInt(r.querySelector(".rc")?.dataset.i);
    if (isNaN(i)) return;
    var d = DATA[i];
    var show = false;
    if (f === "pay") show = !d.amtOk;
    else if (f === "otg") show = !d.otg;
    else if (f === "reg") show = !d.regOk;
    else if (f === "ti") show = d.tims && !(d.tims.indexOf("Approved") >= 0 || d.tims.indexOf("Received") >= 0);
    else if (f === "ins") show = !d.io;
    r.style.display = show ? "" : "none";
  });
  TR();
}

/* ============================================
   FILTER: by vehicle status
   ============================================ */
function SFV(f, el) {
  document.querySelectorAll(".si").forEach(function(s) {
    s.classList.remove("on");
  });
  el.classList.add("on");
  document.querySelectorAll("#tb tr").forEach(function(r) {
    var ci = r.querySelector(".rc");
    if (!ci) return;
    var i = parseInt(ci.dataset.i);
    if (isNaN(i)) return;
    var d = DATA[i];
    var show = false;
    if (f === "transit") show = d.vs.indexOf("Transit") >= 0;
    else if (f === "cotg") show = d.vs === "Arrived at VRL";
    else if (f === "fg") show = d.vs === "Finished Goods" || d.vs === "Deliverable/PDI Complete";
    else if (f === "del") show = !!d.delivered;
    r.style.display = show ? "" : "none";
  });
  TR();
}

/* ============================================
   QUICK DATE: specific day offset
   ============================================ */
function QD(offset, el) {
  var sel = document.getElementById("dt");
  var opts = sel.options;
  var d = new Date(Date.now() + offset * 864e5);
  var y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), dd = String(d.getDate()).padStart(2, "0");
  var v = y + "-" + m + "-" + dd;
  for (var i = 0; i < opts.length; i++) {
    if (opts[i].value === v) {
      sel.selectedIndex = i;
      break;
    }
  }
  document.querySelectorAll(".bt-q").forEach(function(b) {
    b.classList.remove("on");
  });
  el.classList.add("on");
  WKMODE = false;
  showDateCol(false);
  L();
}

/* ============================================
   QUICK WEEK: load full week
   ============================================ */
async function QW(wk, el) {
  document.querySelectorAll(".bt-q").forEach(function(b) {
    b.classList.remove("on");
  });
  el.classList.add("on");
  WKMODE = true;
  showDateCol(true);

  var lg = document.getElementById("lg"), tbl = document.getElementById("tbl");
  lg.style.display = "block";
  tbl.style.display = "none";

  var h = {
    "Authorization": AUTH.token,
    "Content-Type": "application/json",
    "userid": AUTH.userId
  };

  try {
    var rule = {
      condition: "and",
      extraHeaders: null,
      Countries: [{ Abbreviation: "FR", Region: "EU" }],
      TrtIds: [CFG.trtId],
      ReferenceNumbers: [],
      Vins: [],
      IsScheduled: true,
      OrderStatus: ["ORDER_PLACED", "BOOKED"],
      VehicleStages: null,
      DeliveryStatus: null,
      IsContainmentHold: null,
      IsAmountDueComplete: null,
      IsInsuranceComplete: null,
      IsTradeInComplete: null,
      IsRegistrationComplete: null,
      IsPaymentComplete: null,
      MatchStatus: null,
      DeliveryTypes: null,
      VehicleType: null,
      VehicleModels: null,
      HasOpenCommunication: null,
      IsEnterpriseOrder: null,
      VehicleTitles: null,
      VehicleContainmentHoldTitle: [],
      VesselNames: [],
      OpenCaseTypes: []
    };

    var body = {
      condition: "and",
      rules: [rule],
      Skip: 0,
      Take: 500,
      SortOrder: [],
      SelectedColumns: []
    };

    var adv = await fetch(BASE + "/advisor/Dashboard?isSidePanelFullScreen=false", {
      method: "POST",
      headers: h,
      body: JSON.stringify(body)
    }).then(function(r) { return r.json(); });

    var allAdv = adv.Data.Dashboard || [];
    if (!allAdv.length) {
      lg.innerHTML = '<div style="padding:60px;text-align:center;color:#aaa">No scheduled deliveries found.</div>';
      return;
    }

    var now = new Date();
    var dow = now.getDay();
    var monOff = dow === 0 ? 1 : 1 - dow;
    var mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + monOff + wk * 7);
    var sat = new Date(mon.getTime() + 5 * 864e5);
    sat.setHours(23, 59, 59);
    var startDate = mon;

    allAdv = allAdv.filter(function(a) {
      if (!a.ScheduledDeliveryDate) return false;
      var sd = new Date(a.ScheduledDeliveryDate);
      return sd >= startDate && sd <= sat && sd.getDay() !== 0;
    });

    if (!allAdv.length) {
      lg.innerHTML = '<div style="padding:60px;text-align:center;color:#aaa">No deliveries ' + (wk === 0 ? "this" : "next") + ' week.</div>';
      return;
    }

    var tiR = {};
    allAdv.forEach(function(a) {
      if (a.TradeInActionStatus === "COMPLETE_TRADE_IN") tiR[a.ReferenceNumber] = { ms: "Accepted" };
    });

    DATA = allAdv.map(function(a) {
      var sddRaw = a.ScheduledDeliveryDate || "";
      var sddShort = "";
      var sortKey = "";
      if (sddRaw) {
        var sp = new Date(sddRaw);
        if (!isNaN(sp)) {
          var fmtSDD = function(sp) {
            var mm = String(sp.getMonth() + 1).padStart(2, "0");
            var dd = String(sp.getDate()).padStart(2, "0");
            var yy = sp.getFullYear();
            var hh = sp.getHours();
            var mi = String(sp.getMinutes()).padStart(2, "0");
            var ampm = hh >= 12 ? "PM" : "AM";
            var h12 = hh % 12 || 12;
            return mm + "-" + dd + "-" + yy + " " + h12 + ":" + mi + " " + ampm;
          };
          sddShort = fmtSDD(sp);
          sortKey = sp.toISOString();
        }
      }

      var t = "?";
      if (sddRaw) {
        var sp2 = new Date(sddRaw);
        if (!isNaN(sp2)) {
          t = String(sp2.getHours()).padStart(2, "0") + ":" + String(sp2.getMinutes()).padStart(2, "0");
        }
      }

      var hp = !!(a.LicensePlate && a.LicensePlate.trim() && a.LicensePlate.indexOf("-") >= 0);
      var hold = !!a.IsContainmentHold;
      var io = a.InsuranceActionStatus === "COMPLETE";
      var otg = a.VehicleStage === "Finished Goods" || a.VehicleStage === "Arrived at VRL" || (a.VehicleStage && a.VehicleStage.indexOf("Arrived") >= 0);
      var amtOk = a.AmountDueActionStatus === "Yes" || a.FinalPaymentGate === "Complete";
      var delivered = !!a.IsDelivered || !!(a.VehicleStage && a.VehicleStage.toLowerCase().indexOf("delivered") >= 0);

      var al = [];
      if (!delivered) {
        if (!hp) al.push("P");
        if (!otg) al.push("O");
        if (!amtOk) al.push("$");
        if (hold) al.push("H");
      }

      var r = tiR[a.ReferenceNumber];
      var tms = r ? r.ms : "";
      if (tms && tms.indexOf("Approved") < 0 && tms.indexOf("Received") < 0) al.push("T");

      var clientName = a.CustomerName;
      var di = a.DriverInfo;
      if (a.IsEnterpriseOrder && di && di.first_name) clientName = di.first_name + " " + di.last_name + " (" + a.CustomerName + ")";

      var vsShort = a.VehicleStage || "";
      if (vsShort === "Finished Goods") vsShort = "Finished Goods";
      else if (vsShort.indexOf("Receiving") >= 0) vsShort = "Receiving Insp.";
      else if (vsShort.indexOf("Transit") >= 0) vsShort = "In Transit";
      else if (vsShort.indexOf("PDI") >= 0) vsShort = "PDI Pending";
      else if (vsShort.indexOf("Ready") >= 0) vsShort = "Ready for Prep";
      else if (vsShort.indexOf("Wash") >= 0 || vsShort.indexOf("Charge") >= 0) vsShort = "Wash/Charge";
      else if (vsShort.indexOf("Service") >= 0) vsShort = "In Service";
      else if (vsShort.indexOf("garage") >= 0) vsShort = "Delivered";

      return {
        rn: a.ReferenceNumber,
        name: clientName,
        t: t,
        date: sortKey,
        sdd: sddShort,
        sddRaw: sddRaw,
        model: a.VehicleModel,
        color: a.VehicleColor || "",
        plate: (a.LicensePlate || "").trim(),
        regTxt: hp ? "OK" : "Pending",
        regOk: hp,
        host: a.DeliverySpecialist || "?",
        b2b: a.IsEnterpriseOrder,
        hp: hp,
        hold: hold,
        io: io,
        otg: otg,
        vs: vsShort,
        al: al,
        used: a.VehicleTitleStatus === "USED",
        tims: tms,
        hasTI: !!(a.TradeInActionStatus && a.TradeInActionStatus !== "NO_TRADE_IN"),
        amtOk: amtOk,
        delivered: delivered,
        inc: a.IncentivesGate === "Complete" && !a.IsEnterpriseOrder,
        vin: a.Vin || "",
        uid: a.AccountUid || ""
      };
    }).sort(function(a, b) {
      return (a.date + a.t).localeCompare(b.date + b.t);
    });

    RW();

    var ok = DATA.filter(function(d) { return d.al.length === 0; }).length;
    var pOk = DATA.filter(function(d) { return d.amtOk; }).length;
    var oOk = DATA.filter(function(d) { return d.otg; }).length;
    var plOk = DATA.filter(function(d) { return d.regOk; }).length;
    var tiOk2 = DATA.filter(function(d) { return d.tims; }).length;
    var asOk = DATA.filter(function(d) { return d.io; }).length;
    var N = DATA.length;

    document.getElementById("sT").textContent = N;
    document.getElementById("sT").className = "sn b";
    document.getElementById("sO").textContent = ok;
    document.getElementById("sO").className = "sn" + (ok > 0 ? " g" : " x");
    document.getElementById("sA").textContent = N - ok;
    document.getElementById("sA").className = "sn" + ((N - ok) > 0 ? " r" : " x");
    document.getElementById("sP").innerHTML = '<div class="top">' + pOk + '</div><div class="div">' + N + '</div>';
    var _otg = document.getElementById("sOTG");
    if (_otg) _otg.innerHTML = '<div class="top">' + oOk + '</div><div class="div">' + N + '</div>';
    document.getElementById("sPl").innerHTML = '<div class="top">' + plOk + '</div><div class="div">' + N + '</div>';
    document.getElementById("sTI").innerHTML = '<div class="top">' + DATA.filter(function(d) { return d.tims && (d.tims.indexOf("Approved") >= 0 || d.tims.indexOf("Received") >= 0); }).length + '</div><div class="div">' + DATA.filter(function(d) { return d.tims; }).length + '</div>';
    document.getElementById("sAs").innerHTML = '<div class="top">' + asOk + '</div><div class="div">' + N + '</div>';

    lg.style.display = "none";
    tbl.style.display = "";
    TR();
    document.getElementById("sa").checked = true;
    UC();
    UV();
  } catch (err) {
    lg.innerHTML = '<div style="padding:60px;text-align:center;color:#c00">Error: ' + err.message + '</div>';
  }
}

/* ============================================
   PULL-UP: Ready vehicles with future SDD
   ============================================ */
async function QP(el) {
  document.querySelectorAll(".bt-q").forEach(function(b) {
    b.classList.remove("on");
  });
  el.classList.add("on");
  WKMODE = true;
  showDateCol(true);

  var lg = document.getElementById("lg"), tbl = document.getElementById("tbl");
  lg.style.display = "block";
  tbl.style.display = "none";

  var h = {
    "Authorization": AUTH.token,
    "Content-Type": "application/json",
    "userid": AUTH.userId
  };

  try {
    var rule = {
      condition: "and",
      extraHeaders: null,
      Countries: [{ Abbreviation: "FR", Region: "EU" }],
      TrtIds: [CFG.trtId],
      ReferenceNumbers: [],
      Vins: [],
      IsScheduled: true,
      OrderStatus: ["ORDER_PLACED", "BOOKED"],
      VehicleStages: null,
      DeliveryStatus: null,
      IsContainmentHold: null,
      IsAmountDueComplete: null,
      IsInsuranceComplete: null,
      IsTradeInComplete: null,
      IsRegistrationComplete: null,
      IsPaymentComplete: null,
      MatchStatus: null,
      DeliveryTypes: null,
      VehicleType: null,
      VehicleModels: null,
      HasOpenCommunication: null,
      IsEnterpriseOrder: null,
      VehicleTitles: null,
      VehicleContainmentHoldTitle: [],
      VesselNames: [],
      OpenCaseTypes: []
    };

    var body = {
      condition: "and",
      rules: [rule],
      Skip: 0,
      Take: 500,
      SortOrder: [],
      SelectedColumns: []
    };

    var adv = await fetch(BASE + "/advisor/Dashboard?isSidePanelFullScreen=false", {
      method: "POST",
      headers: h,
      body: JSON.stringify(body)
    }).then(function(r) { return r.json(); });

    var allAdv = adv.Data.Dashboard || [];
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var tomorrow = new Date(today.getTime() + 864e5);

    allAdv = allAdv.filter(function(a) {
      if (!a.ScheduledDeliveryDate) return false;
      var sd = new Date(a.ScheduledDeliveryDate);
      if (sd < tomorrow || sd.getDay() === 0) return false;
      if (a.IsEnterpriseOrder) return false;
      if (a.HasHold) return false;
      var otg = a.VehicleStage === "Finished Goods" || a.VehicleStage === "Arrived at VRL" || (a.VehicleStage && a.VehicleStage.indexOf("Arrived") >= 0);
      if (!otg) return false;
      var amtOk = a.AmountDueActionStatus === "Yes" || a.FinalPaymentGate === "Complete";
      if (!amtOk) return false;
      var hp = !!(a.LicensePlate && a.LicensePlate.trim() && a.LicensePlate.indexOf("-") >= 0);
      if (!hp) return false;
      if (a.TradeInActionStatus === "COMPLETE_TRADE_IN" || a.TradeInActionStatus === "NO_TRADE_IN" || !a.TradeInActionStatus) return true;
      return false;
    });

    if (!allAdv.length) {
      lg.innerHTML = '<div style="padding:60px;text-align:center;color:#aaa">No pull-up candidates found.</div>';
      return;
    }

    var tiR = {};
    allAdv.forEach(function(a) {
      if (a.TradeInActionStatus === "COMPLETE_TRADE_IN") tiR[a.ReferenceNumber] = { ms: "Accepted" };
    });

    DATA = allAdv.map(function(a) {
      var sddRaw = a.ScheduledDeliveryDate || "";
      var sddShort = "";
      var sortKey = "";
      if (sddRaw) {
        var sp = new Date(sddRaw);
        if (!isNaN(sp)) {
          var fmtSDD = function(sp) {
            var mm = String(sp.getMonth() + 1).padStart(2, "0");
            var dd = String(sp.getDate()).padStart(2, "0");
            var yy = sp.getFullYear();
            var hh = sp.getHours();
            var mi = String(sp.getMinutes()).padStart(2, "0");
            var ampm = hh >= 12 ? "PM" : "AM";
            var h12 = hh % 12 || 12;
            return mm + "-" + dd + "-" + yy + " " + h12 + ":" + mi + " " + ampm;
          };
          sddShort = fmtSDD(sp);
          sortKey = sp.toISOString();
        }
      }

      var t = "?";
      if (sddRaw) {
        var sp2 = new Date(sddRaw);
        if (!isNaN(sp2)) {
          t = String(sp2.getHours()).padStart(2, "0") + ":" + String(sp2.getMinutes()).padStart(2, "0");
        }
      }

      var r = tiR[a.ReferenceNumber];
      var tms = r ? r.ms : "";

      var clientName = a.CustomerName;
      var di = a.DriverInfo;
      if (a.IsEnterpriseOrder && di && di.first_name) clientName = di.first_name + " " + di.last_name + " (" + a.CustomerName + ")";

      var vsShort = a.VehicleStage || "";
      if (vsShort === "Finished Goods") vsShort = "Finished Goods";
      else if (vsShort.indexOf("Arrived") >= 0) vsShort = "Arrived at VRL";

      return {
        rn: a.ReferenceNumber,
        name: clientName,
        t: t,
        date: sortKey,
        sdd: sddShort,
        sddRaw: sddRaw,
        model: a.VehicleModel,
        color: a.VehicleColor || "",
        plate: (a.LicensePlate || "").trim(),
        regTxt: "OK",
        regOk: true,
        host: a.DeliverySpecialist || "?",
        b2b: false,
        hp: true,
        hold: false,
        io: a.InsuranceActionStatus === "COMPLETE",
        otg: true,
        vs: vsShort,
        al: [],
        tims: tms,
        amtOk: true
      };
    }).sort(function(a, b) {
      return (a.date + a.t).localeCompare(b.date + b.t);
    });

    RW();

    var N = DATA.length;
    var asOk = DATA.filter(function(d) { return d.io; }).length;

    document.getElementById("sT").textContent = N;
    document.getElementById("sT").className = "sn b";
    document.getElementById("sO").textContent = N;
    document.getElementById("sO").className = "sn g";
    document.getElementById("sA").textContent = 0;
    document.getElementById("sA").className = "sn x";
    document.getElementById("sP").innerHTML = '<div class="top">' + N + '</div><div class="div">' + N + '</div>';
    var _otg = document.getElementById("sOTG");
    if (_otg) _otg.innerHTML = '<div class="top">' + N + '</div><div class="div">' + N + '</div>';
    document.getElementById("sPl").innerHTML = '<div class="top">' + N + '</div><div class="div">' + N + '</div>';
    document.getElementById("sTI").innerHTML = '<div class="top">' + DATA.filter(function(d) { return d.tims; }).length + '</div><div class="div">' + DATA.filter(function(d) { return d.tims; }).length + '</div>';
    document.getElementById("sAs").innerHTML = '<div class="top">' + asOk + '</div><div class="div">' + N + '</div>';

    lg.style.display = "none";
    tbl.style.display = "";
    TR();
    document.getElementById("sa").checked = true;
    UC();
    UV();
  } catch (err) {
    lg.innerHTML = '<div style="padding:60px;text-align:center;color:#c00">Error: ' + err.message + '</div>';
  }
}

/* ============================================
   NAVIGATE DATE: prev/next day
   ============================================ */
function ND(dir) {
  var sel = document.getElementById("dt");
  var ni = sel.selectedIndex + dir;
  if (ni >= 0 && ni < sel.options.length) {
    sel.selectedIndex = ni;
    document.querySelectorAll(".bt-q").forEach(function(b) {
      b.classList.remove("on");
    });
    WKMODE = false;
    showDateCol(false);
    L();
  }
}

/* ============================================
   RESET: clear all filters
   ============================================ */
function RST() {
  document.querySelectorAll(".fi").forEach(function(f) {
    if (f.tagName === "SELECT") f.selectedIndex = 0;
    else f.value = "";
  });
  document.getElementById("srch").value = "";
  document.querySelectorAll(".bt-q").forEach(function(b) {
    b.classList.remove("on");
  });
  document.querySelectorAll(".pill").forEach(function(p) {
    p.classList.remove("on");
  });
  var firstPill = document.querySelector(".pill");
  if (firstPill) firstPill.classList.add("on");
  document.getElementById("dt").selectedIndex = 0;
  WKMODE = false;
  showDateCol(false);
  L();
}

/* ============================================
   SHOW/HIDE DATE COLUMN (week mode)
   ============================================ */
function showDateCol(show) {
  document.getElementById("thDate").style.display = show ? "table-cell" : "none";
  document.querySelectorAll(".dtc").forEach(function(c) {
    c.style.display = show ? "table-cell" : "none";
  });
}

/* ============================================
   SELECT ALL checkboxes
   ============================================ */
function SA(el) {
  document.querySelectorAll(".rc").forEach(function(c) {
    if (c.closest("tr").style.display !== "none") c.checked = el.checked;
  });
}

/* ============================================
   LOAD: main data loading function
   ============================================ */
async function L() {
  var lg = document.getElementById("lg"), tbl = document.getElementById("tbl"), tb = document.getElementById("tb");
  var loadBar = document.getElementById("loadingBar");
  if (loadBar) loadBar.classList.add("active");
  lg.style.display = "block";
  lg.innerHTML = '<div style="padding:60px;text-align:center;color:#71717a;font-size:14px">Loading deliveries...</div>';
  tbl.style.display = "none";

  var h = {
    "Authorization": AUTH.token,
    "Content-Type": "application/json",
    "userid": AUTH.userId
  };
  var ds = document.getElementById("dt").value;

  try {
    var dash = await fetch(BASE + "/deliveryops/Customers/Dashboard", {
      method: "POST",
      headers: h,
      body: JSON.stringify({
        fromDeliveryDate: ds,
        trtId: CFG.trtId,
        customerHasNoHost: false,
        skip: 0,
        take: 200,
        fromTime: "00:00",
        toTime: "23:59",
        countryCode: CFG.cc,
        onlyMyLocation: true,
        sort: {},
        stage: [],
        status: [],
        deliveryType: [],
        paperwork: [],
        customerDeliveryStatus: [],
        inboundStatus: [],
        VehicleTypes: [],
        pdcFilter: [],
        dmvDocumentStages: []
      })
    }).then(function(r) { return r.json(); });

    var dm = {};
    (dash.Data || []).forEach(function(d) { dm[d.ReferenceNumber] = d; });
    var rns = Object.keys(dm);

    if (!rns.length) {
      if (loadBar) loadBar.classList.remove("active");
      lg.innerHTML = '<div style="padding:60px;text-align:center"><div style="font-size:18px;font-weight:500;margin-bottom:8px">No deliveries</div><div style="color:#71717a;font-size:14px">No deliveries scheduled for this date.</div></div>';
      return;
    }

    var adv = await fetch(BASE + "/advisor/Dashboard?isSidePanelFullScreen=true", {
      method: "POST",
      headers: h,
      body: JSON.stringify({
        condition: "and",
        rules: [{ condition: "and", ReferenceNumbers: rns, Countries: [] }],
        Skip: 0,
        Take: 200,
        SortOrder: [],
        SelectedColumns: []
      })
    }).then(function(r) { return r.json(); });

    var tiC = (adv.Data && adv.Data.Dashboard || []).filter(function(a) {
      return a.TradeInActionStatus === "COMPLETE_TRADE_IN";
    });

    var tiR = {};
    await Promise.all(tiC.map(function(a) {
      return fetch(BASE + "/widget/GetTradeInWidgetInfo?referenceNumber=" + a.ReferenceNumber + "&vehicleMapId=" + a.VehicleMapId + "&deliveryState=" + encodeURIComponent(a.DeliveryState || ""), { headers: h })
        .then(function(r) { return r.json(); })
        .then(function(j) {
          if (j.Data) tiR[a.ReferenceNumber] = { ms: j.Data.AMPStatusFromC360 || j.Data.AcquisitionMilestone || "" };
        })
        .catch(function() {});
    }));

    var regR = {};
    var plated = (adv.Data && adv.Data.Dashboard || []).filter(function(a) {
      return a.LicensePlate && a.LicensePlate.indexOf("-") >= 0;
    });
    await Promise.all(plated.map(function(a) {
      return fetch(BASE + "/widget/GetGlobalRegistrationInfo?referenceNumber=" + a.ReferenceNumber + "&vin=" + (a.Vin || "") + "&countryCode=FR&registrationState=" + encodeURIComponent(a.RegistrationState || ""), { headers: h })
        .then(function(r) { return r.json(); })
        .then(function(j) {
          if (j.Data) regR[a.ReferenceNumber] = j.Data.RegistrationStatusId;
        })
        .catch(function() {});
    }));

    DATA = (adv.Data && adv.Data.Dashboard || []).map(function(a) {
      var d = dm[a.ReferenceNumber] || {};
      var dt = d.ScheduledDeliveryStartDateString || "";
      var t = "?", m = dt.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (m) {
        var hr = parseInt(m[1]);
        if (m[3].toUpperCase() === "PM" && hr < 12) hr += 12;
        if (m[3].toUpperCase() === "AM" && hr === 12) hr = 0;
        t = String(hr).padStart(2, "0") + ":" + m[2];
      }

      var hp = !!(a.LicensePlate && a.LicensePlate.trim() && a.LicensePlate.indexOf("-") >= 0);
      var regId = regR[a.ReferenceNumber];
      var regOk = hp && regId === 4;
      var regTxt = "Pending";
      if (hp) {
        if (regId === 4) regTxt = "OK";
        else if (regId === 8) regTxt = "RTS";
        else if (regId === -1) regTxt = "On Hold";
        else if (regId === 1 || regId === 2 || regId === 3) regTxt = "In Progress";
      }

      var hold = !!a.IsContainmentHold;
      var io = a.InsuranceActionStatus === "COMPLETE";
      var otg = a.VehicleStage === "Finished Goods" || a.VehicleStage === "Arrived at VRL" || (a.VehicleStage && a.VehicleStage.indexOf("Arrived") >= 0);
      var amtOk = a.AmountDueActionStatus === "Yes" || a.FinalPaymentGate === "Complete";
      var delivered = !!a.IsDelivered || !!(a.VehicleStage && a.VehicleStage.toLowerCase().indexOf("delivered") >= 0);

      var al = [];
      if (!delivered) {
        if (!regOk) al.push("P");
        if (!otg) al.push("O");
        if (!amtOk) al.push("$");
        if (hold) al.push("H");
      }

      var r = tiR[a.ReferenceNumber];
      var tms = r ? r.ms : "";
      if (!delivered && tms && tms.indexOf("Approved") < 0 && tms.indexOf("Received") < 0) al.push("T");

      var clientName = a.CustomerName;
      var di = a.DriverInfo;
      if (a.IsEnterpriseOrder && di && di.first_name) clientName = di.first_name + " " + di.last_name + " (" + a.CustomerName + ")";

      var vsShort = a.VehicleStage || "";
      if (vsShort === "Finished Goods") vsShort = "Finished Goods";
      else if (vsShort.indexOf("Receiving") >= 0) vsShort = "Receiving Insp.";
      else if (vsShort.indexOf("Transit") >= 0) vsShort = "In Transit";
      else if (vsShort.indexOf("PDI") >= 0) vsShort = "PDI Pending";
      else if (vsShort.indexOf("Ready") >= 0) vsShort = "Ready for Prep";
      else if (vsShort.indexOf("Wash") >= 0 || vsShort.indexOf("Charge") >= 0) vsShort = "Wash/Charge";
      else if (vsShort.indexOf("Service") >= 0) vsShort = "In Service";
      else if (vsShort.indexOf("garage") >= 0) vsShort = "Delivered";

      return {
        rn: a.ReferenceNumber,
        name: clientName,
        t: t,
        date: ds,
        sdd: "",
        model: a.VehicleModel,
        color: a.VehicleColor || "",
        plate: (a.LicensePlate || "").trim(),
        regTxt: regTxt,
        regOk: regOk,
        host: d.HostName || "?",
        hostId: d.HostId || null,
        b2b: a.IsEnterpriseOrder,
        hp: hp,
        hold: hold,
        io: io,
        otg: otg,
        delivered: delivered,
        vs: vsShort,
        al: al,
        used: a.VehicleTitleStatus === "USED",
        tims: tms,
        hasTI: !!(a.TradeInActionStatus && a.TradeInActionStatus !== "NO_TRADE_IN"),
        amtOk: amtOk,
        inc: a.IncentivesGate === "Complete" && !a.IsEnterpriseOrder,
        vin: a.Vin || "",
        uid: a.AccountUid || ""
      };
    }).sort(function(a, b) {
      return a.t.localeCompare(b.t);
    });

    RW();

    var ok = DATA.filter(function(d) { return d.al.length === 0; }).length;
    var pOk = DATA.filter(function(d) { return d.amtOk; }).length;
    var oOk = DATA.filter(function(d) { return d.otg; }).length;
    var plOk = DATA.filter(function(d) { return d.regOk; }).length;
    var tiOk = DATA.filter(function(d) { return d.tims && (d.tims.indexOf("Approved") >= 0 || d.tims.indexOf("Received") >= 0); }).length;
    var tiTotal = DATA.filter(function(d) { return d.tims; }).length;
    var asOk = DATA.filter(function(d) { return d.io; }).length;

    document.getElementById("sT").textContent = DATA.length;
    document.getElementById("sT").className = "sn b";
    document.getElementById("sO").textContent = ok;
    document.getElementById("sO").className = "sn" + (ok > 0 ? " g" : " x");
    document.getElementById("sA").textContent = DATA.length - ok;
    document.getElementById("sA").className = "sn" + ((DATA.length - ok) > 0 ? " r" : " x");

    var N = DATA.length;
    document.getElementById("sP").innerHTML = '<div class="top">' + pOk + '</div><div class="div">' + N + '</div>';
    var _otg = document.getElementById("sOTG");
    if (_otg) _otg.innerHTML = '<div class="top">' + oOk + '</div><div class="div">' + N + '</div>';
    document.getElementById("sPl").innerHTML = '<div class="top">' + plOk + '</div><div class="div">' + N + '</div>';
    document.getElementById("sTI").innerHTML = '<div class="top">' + tiOk + '</div><div class="div">' + tiTotal + '</div>';
    document.getElementById("sAs").innerHTML = '<div class="top">' + asOk + '</div><div class="div">' + N + '</div>';

    lg.style.display = "none";
    tbl.style.display = "";
    if (loadBar) loadBar.classList.remove("active");
    TR();
    document.getElementById("sa").checked = true;
    document.getElementById("upd").textContent = "Updated at: " + new Date().toLocaleString("en-US", { month: "2-digit", day: "2-digit", hour: "numeric", minute: "2-digit", hour12: true });
    UC();
    UV();
  } catch (err) {
    if (loadBar) loadBar.classList.remove("active");
    lg.innerHTML = '<div style="padding:60px;text-align:center;color:#c00">Error: ' + err.message + '</div>';
  }
}

/* ============================================
   RENDER: build table rows
   ============================================ */
function RW() {
  var tb = document.getElementById("tb");
  var out = "";

  for (var i = 0; i < DATA.length; i++) {
    var d = DATA[i];
    var vc = d.delivered ? "dg" : (d.otg ? "dg" : (d.vs.indexOf("Transit") >= 0 ? "do" : "dr"));

    var rc = d.regOk
      ? '<span class="dt dg"></span>OK'
      : d.regTxt === "On Hold"
        ? '<span class="dt dr"></span><b style="color:#ef4444">On Hold</b>'
        : d.regTxt === "RTS"
          ? '<span class="dt do"></span>RTS'
          : d.regTxt === "Pending"
            ? '<span class="dt do"></span>Pending'
            : '<span class="su">' + d.regTxt + '</span>';

    var tiOk = d.tims && (d.tims.indexOf("Approved") >= 0 || d.tims.indexOf("Received") >= 0);
    var tc = d.tims
      ? (tiOk ? '<span class="dt dg"></span>' + d.tims : '<span class="dt do"></span>' + d.tims)
      : '<span class="su">No</span>';

    out += '<tr class="' + (d.al.length ? "w" : "") + '" data-host="' + d.host + '">'
      + '<td><input type="checkbox" class="ck rc" data-i="' + i + '" ' + (d.al.length === 0 ? 'checked' : '') + '></td>'
      + '<td class="dtc">' + (d.sdd || '') + '</td>'
      + '<td>' + d.t + '</td>'
      + '<td><span class="nm">' + d.name + '</span></td>'
      + '<td><a class="rl" href="https://dro.tesla.com/advisor?sidepanel_fullscreen=yes&rn=' + d.rn + '" target="_blank">' + d.rn + '</a>'
      + (d.b2b ? '' : '<a href="https://tesla.cee.trustia.ai/admin/folder/folder/?q=' + d.rn + '" target="_blank" style="margin-left:4px;font-size:10px;background:rgba(34,197,94,.12);color:#22c55e;padding:1px 6px;border-radius:10px;text-decoration:none;font-weight:600" title="Verifier CEE sur Trustia">CEE</a>')
      + '</td>'
      + '<td>' + d.model + '</td>'
      + '<td>' + rc + '</td>'
      + '<td>' + (d.amtOk ? '<span class="dt dg"></span>OK' : '<span class="dt dr"></span>No') + '</td>'
      + '<td>' + tc + '</td>'
      + '<td><span class="dt ' + vc + '"></span>' + d.vs + '</td>'
      + '<td>' + (d.hold ? '<span class="dt dr"></span><a href="https://dro.tesla.com/advisor?sidepanel_fullscreen=yes&rn=' + d.rn + '" target="_blank" style="color:#ef4444;font-weight:700;text-decoration:none">Hold</a>' : '<span class="dt dg"></span>OK') + '</td>'
      + '<td>' + (d.io ? '<span class="dt dg"></span>OK' : '<span class="su">No</span>') + '</td>'
      + '<td><button onclick="P1(' + i + ',this)" style="padding:4px 10px;border:1px solid rgba(255,255,255,.1);border-radius:6px;cursor:pointer;background:rgba(255,255,255,.04);color:#a1a1aa;font-family:inherit;font-size:12px">'
      + '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>'
      + '</button></td></tr>';
  }

  tb.innerHTML = out;

  if (WKMODE) showDateCol(true);

  // Check print status
  fetch(SERVER + "/api/print/status").then(function(r) { return r.json(); }).then(function(ps) {
    document.querySelectorAll("#tb tr").forEach(function(r) {
      var ci = r.querySelector(".rc");
      if (!ci) return;
      var d = DATA[parseInt(ci.dataset.i)];
      if (d && ps[d.rn]) {
        var btn = r.querySelector("button");
        if (btn) {
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>';
          btn.style.border = "1px solid rgba(34,197,94,.3)";
          btn.style.background = "rgba(34,197,94,.1)";
          btn.title = "Reprint";
        }
      }
    });
  }).catch(function() {});
}

/* ============================================
   PRINT: single delivery
   ============================================ */
function P1(i, btn, onDone) {
  var d = DATA[i];
  if (!d) { if (onDone) onDone(false); return; }

  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" style="animation:spin 1s linear infinite"><circle cx="12" cy="12" r="10" stroke-dasharray="31" stroke-dashoffset="10"/></svg>';
  btn.disabled = true;

  var ds = document.getElementById("dt").value;
  var ti = d.tims ? [d.rn] : [];
  var b2b = d.b2b ? [d.rn] : [];

  var chain = Promise.resolve();
  if (ti.length || b2b.length) {
    chain = fetch(SERVER + "/api/print/docgen", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tiRNs: ti, b2bRNs: b2b })
    }).then(function(r) { return r.json(); });
  }

  chain.then(function(docResult) {
    return fetch(SERVER + "/api/print/send/" + d.rn, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: ds, b2b: !!d.b2b })
    });
  }).then(function(r) { return r.json(); }).then(function(j) {
    if (j.ok) {
      btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>';
      btn.style.border = "1px solid rgba(34,197,94,.3)";
      btn.style.background = "rgba(34,197,94,.1)";
      var t = j.printed + " docs sent";
      if (j.warnings && j.warnings.length) {
        t += " | ! " + j.warnings.join(", ");
        btn.style.border = "1px solid rgba(245,158,11,.3)";
        btn.style.background = "rgba(245,158,11,.1)";
      }
      btn.title = t;
      btn.disabled = false;
      if (onDone) onDone(true);
    } else {
      throw new Error(j.error);
    }
  }).catch(function(e) {
    btn.innerHTML = "ERR";
    btn.style.color = "#ef4444";
    btn.title = e.message;
    btn.disabled = false;
    if (onDone) onDone(false);
  });
}

/* ============================================
   PRINT: batch print selected
   ============================================ */
function G() {
  var checks = [];
  document.querySelectorAll(".rc:checked").forEach(function(el) {
    var tr = el.closest("tr");
    if (tr && tr.style.display !== "none") {
      var i = parseInt(el.dataset.i);
      if (DATA[i]) checks.push(i);
    }
  });

  if (!checks.length) { alert("No deliveries selected!"); return; }
  if (!confirm("Print " + checks.length + " deliveries?")) return;

  var idx = 0;
  var ok = 0;
  var fail = 0;
  document.title = "Printing 0/" + checks.length;

  function next() {
    if (idx >= checks.length) {
      document.title = "Done: " + ok + " printed, " + fail + " errors";
      alert("Print complete!\n" + ok + " OK, " + fail + " errors");
      return;
    }
    var i = checks[idx];
    var rows = document.querySelectorAll("#tb tr");
    var btn = rows[i] ? rows[i].querySelector("button") : null;
    if (btn) {
      btn.scrollIntoView({ block: "center" });
      document.title = "Printing " + (idx + 1) + "/" + checks.length + "...";
      P1(i, btn, function(success) {
        if (success) ok++;
        else fail++;
        idx++;
        next();
      });
    } else {
      idx++;
      next();
    }
  }
  next();
}

/* ============================================
   PRINT: batch PDG (page de garde)
   ============================================ */
function GPDG() {
  var checks = [];
  document.querySelectorAll(".rc:checked").forEach(function(el) {
    var tr = el.closest("tr");
    if (tr && tr.style.display !== "none") {
      var i = parseInt(el.dataset.i);
      if (DATA[i]) checks.push(i);
    }
  });

  if (!checks.length) { alert("No deliveries!"); return; }
  if (!confirm("Print " + checks.length + " pages de garde?")) return;

  var idx = 0, ok = 0, fail = 0;
  document.title = "PDG 0/" + checks.length;

  function next() {
    if (idx >= checks.length) {
      document.title = "PDG: " + ok + " OK";
      alert("PDG: " + ok + " OK, " + fail + " err");
      return;
    }
    var d = DATA[checks[idx]];
    document.title = "PDG " + (idx + 1) + "/" + checks.length;
    var ds = document.getElementById("dt").value;
    fetch(SERVER + "/api/print/pdg/" + d.rn, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: ds })
    }).then(function(r) { return r.json(); }).then(function(j) {
      if (j.ok) ok++;
      else fail++;
    }).catch(function() {
      fail++;
    }).finally(function() {
      idx++;
      next();
    });
  }
  next();
}

/* ============================================
   CANCEL PRINT QUEUE
   ============================================ */
function CANCELP() {
  if (!confirm("Clear the print queue?")) return;
  fetch(SERVER + "/api/print/cancel", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}"
  }).then(function(r) { return r.json(); }).then(function() {
    alert("Print queue cleared!");
  }).catch(function(e) {
    alert("Error: " + e.message);
  });
}

/* ============================================
   SORT: column sort
   ============================================ */
function SO(k) {
  sortDir[k] = !sortDir[k];
  DATA.sort(function(a, b) {
    var v = sortDir[k] ? 1 : -1;
    return (a[k] || "").toString().localeCompare((b[k] || "").toString()) * v;
  });
  RW();
}

/* ============================================
   COLUMN FILTERS
   ============================================ */
function CF() {
  if (typeof applyFilters === "function") {
    applyFilters(DATA);
  } else {
    var s = document.createElement("script");
    s.src = SERVER + "/filters.js?v=" + Date.now();
    s.onload = function() { applyFilters(DATA); };
    document.head.appendChild(s);
  }
}

/* ============================================
   AUTH: check auth status
   ============================================ */
function CHKAUTH() {
  fetch(SERVER + "/api/auth/status").then(function(r) { return r.json(); }).then(function(j) {
    var dd = document.getElementById("dotDro");
    var dg = document.getElementById("dotDg");
    if (dd) dd.style.background = j.hasDro ? "#22c55e" : "#ef4444";
    if (dg) dg.style.background = j.hasDocgen ? "#22c55e" : "#f59e0b";
    var b = document.getElementById("docgenBtn");
    if (b) {
      if (j.hasDocgen) {
        b.style.borderColor = "rgba(34,197,94,.3)";
        b.style.background = "rgba(34,197,94,.1)";
        b.style.color = "#22c55e";
        b.textContent = "DocGen OK";
      } else {
        b.style.borderColor = "rgba(245,158,11,.3)";
        b.style.background = "rgba(245,158,11,.08)";
      }
    }
    var u = document.getElementById("upd");
    if (u) u.textContent = "Updated at: " + new Date().toLocaleString("en-US", { month: "2-digit", day: "2-digit", hour: "numeric", minute: "2-digit" });
  }).catch(function() {});
}

/* ============================================
   LOGIN DOCGEN
   ============================================ */
function LOGINDG() {
  var b = document.getElementById("docgenBtn");
  var dg = document.getElementById("dotDg");
  if (!b) return;

  if (dg) dg.style.background = "#f59e0b";
  b.style.opacity = "0.6";
  b.textContent = "Connexion...";

  fetch(SERVER + "/api/auth/login-docgen").then(function(r) { return r.json(); }).then(function(j) {
    b.style.opacity = "1";
    if (j.ok) {
      if (dg) dg.style.background = "#22c55e";
      b.style.borderColor = "rgba(34,197,94,.3)";
      b.style.background = "rgba(34,197,94,.1)";
      b.style.color = "#22c55e";
      b.textContent = "DocGen OK";
    } else {
      if (dg) dg.style.background = "#ef4444";
      b.textContent = "Echec";
      b.style.color = "#f87171";
      setTimeout(function() {
        b.textContent = "Login DocGen";
        b.style.color = "#a1a1aa";
        b.style.borderColor = "rgba(255,255,255,.1)";
        b.style.background = "rgba(255,255,255,.05)";
      }, 3000);
    }
  }).catch(function() {
    b.style.opacity = "1";
    if (dg) dg.style.background = "#ef4444";
    b.textContent = "Erreur";
    b.style.color = "#f87171";
    setTimeout(function() {
      b.textContent = "Login DocGen";
      b.style.color = "#a1a1aa";
    }, 3000);
  });
}

/* ============================================
   NAVIGATION: sidebar nav
   ============================================ */
function NAV(idx, el) {
  document.querySelectorAll(".nav-item").forEach(function(n) {
    n.classList.remove("on");
  });
  if (el && el.classList.contains('nav-item')) el.classList.add("on");
  var titles = ["Dashboard", "Customer Delivery", "Arrivals", "Stock", "Trade-In", "CSAT", "Dispatch", "Pull-Up", "Calendar"];
  var subtitles = [
    "Overview of today's delivery operations.",
    "Manage and track scheduled deliveries.",
    "Track vehicle arrivals and transit status.",
    "Rennes fleet inventory and vehicle tracking.",
    "Track trade-in vehicles on site.",
    "Customer satisfaction scores and CES performance.",
    "Assign deliveries to CES team members with balanced workload distribution.",
    "Find deliveries from upcoming days that can be pulled forward.",
    "Weekly delivery schedule overview."
  ];
  var pt = document.getElementById("pageTitle");
  if (pt) pt.textContent = titles[idx] || "";
  var ps = document.getElementById("pageSubtitle");
  if (ps) ps.textContent = subtitles[idx] || "";
  var ta = document.getElementById("tabActions");
  if (ta) ta.innerHTML = "";
  STAB(idx, null);
}

/* ============================================
   SWITCH TAB: show/hide views
   ============================================ */
function STAB(idx, btn) {
  document.querySelectorAll(".tab").forEach(function(t) {
    t.classList.remove("on");
  });
  if (btn) btn.classList.add("on");

  document.getElementById("dashView").style.display = idx === 0 ? "" : "none";
  document.getElementById("mainView").style.display = idx === 1 ? "" : "none";
  document.getElementById("arrView").style.display = idx === 2 ? "" : "none";
  document.getElementById("stockView").style.display = idx === 3 ? "" : "none";
  document.getElementById("tiView").style.display = idx === 4 ? "" : "none";
  document.getElementById("csatView").style.display = idx === 5 ? "" : "none";
  document.getElementById("dispatchView").style.display = idx === 6 ? "" : "none";
  document.getElementById("pullupView").style.display = idx === 7 ? "" : "none";
  var calView = document.getElementById("calendarView");
  if (calView) calView.style.display = idx === 8 ? "" : "none";

  if (idx === 0 && typeof LOADDASH === 'function') {
    LOADDASH();
  }

  // Populate dispatch date picker and CES team toggles
  if (idx === 6) {
    var dp = document.getElementById('dispatchDate');
    if (dp && !dp.options.length) {
      for (var ddi = 0; ddi < 10 && dp.options.length < 7; ddi++) {
        var ddd = new Date(Date.now() + ddi * 864e5);
        if (ddd.getDay() === 0) continue;
        var dlbl = ddi === 0 ? 'Today' : ddi === 1 ? 'Tomorrow' : 'D+' + ddi;
        var dfD = ddd.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        var diD = ddd.getFullYear() + '-' + String(ddd.getMonth() + 1).padStart(2, '0') + '-' + String(ddd.getDate()).padStart(2, '0');
        dp.add(new Option(dlbl + ' - ' + dfD, diD));
      }
    }
    // CES team toggles
    var teamBlock = document.getElementById('cesTeam');
    if (teamBlock && !teamBlock.innerHTML.trim()) {
      var teamHtml = '';
      CES.forEach(function(c, i) {
        var first = c.split(' ')[0];
        teamHtml += '<button id="cesToggle' + i + '" data-active="1" onclick="this.dataset.active=this.dataset.active===\'1\'?\'0\':\'1\';this.style.opacity=this.dataset.active===\'1\'?\'1\':\'0.35\'" style="padding:6px 16px;border-radius:20px;border:1px solid rgba(128,128,128,.2);font-size:13px;font-weight:600;font-family:inherit;cursor:pointer;color:inherit;background:transparent">' + first + '</button>';
        teamHtml += '<button id="cesAdminToggle' + i + '" data-active="0" onclick="this.dataset.active=this.dataset.active===\'1\'?\'0\':\'1\';this.textContent=this.dataset.active===\'1\'?\'Admin\':\'A\';this.style.background=this.dataset.active===\'1\'?\'rgba(245,158,11,.12)\':\'transparent\';this.style.color=this.dataset.active===\'1\'?\'#f59e0b\':\'inherit\';this.style.borderColor=this.dataset.active===\'1\'?\'rgba(245,158,11,.3)\':\'rgba(128,128,128,.2)\'" style="padding:4px 8px;border-radius:20px;border:1px solid rgba(128,128,128,.2);font-size:11px;font-family:inherit;cursor:pointer;color:inherit;background:transparent;margin-right:8px" title="Toggle admin duty">A</button>';
      });
      teamBlock.innerHTML = teamHtml;
    }
    // Auto-load for current date
    LOADDISPATCHDATE();
  }

  if (idx === 8 && typeof LOADCALENDAR === 'function') {
    LOADCALENDAR();
  }

  if (idx === 1 && !document.getElementById("mainView").dataset.loaded) {
    document.getElementById("mainView").dataset.loaded = "1";
    L();
  }

  if (idx === 2 && !document.getElementById("arrView").innerHTML.trim()) {
    fetch(SERVER + "/api/tab/arrivals").then(function(r) { return r.text(); }).then(function(h) {
      document.getElementById("arrView").innerHTML = h;
      LOADARR();
    }).catch(function(e) {
      document.getElementById("arrView").innerHTML = '<div style="padding:60px;text-align:center;color:#c00">Error loading Arrivals: ' + e.message + '</div>';
    });
  }

  if (idx === 3 && !document.getElementById("stockView").innerHTML.trim()) {
    fetch(SERVER + "/api/tab/stock").then(function(r) { return r.text(); }).then(function(h) {
      document.getElementById("stockView").innerHTML = h;
      LOADSTOCK();
    }).catch(function(e) {
      document.getElementById("stockView").innerHTML = '<div style="padding:60px;text-align:center;color:#c00">Error loading Stock: ' + e.message + '</div>';
    });
  }

  if (idx === 4 && !document.getElementById("tiView").innerHTML.trim()) {
    fetch(SERVER + "/api/tab/tradein").then(function(r) { return r.text(); }).then(function(h) {
      document.getElementById("tiView").innerHTML = h;
      LOADTI();
  }).catch(function() {});
}

/* ============================================
   CALENDAR: Weekly schedule grid
   ============================================ */
function LOADCALENDAR() {
  var container = document.getElementById('calendarContent');
  container.innerHTML = '<div style="text-align:center;padding:30px;color:#71717a">Loading week...</div>';
  var h = {"Authorization": AUTH.token, "Content-Type": "application/json", "userid": AUTH.userId};

  // Get Monday of current week
  var now = new Date();
  var mon = new Date(now);
  mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));

  // Fetch 6 days (Mon-Sat)
  var days = [];
  var promises = [];
  for (var i = 0; i < 6; i++) {
    var d = new Date(mon);
    d.setDate(mon.getDate() + i);
    var ds = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    var label = d.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'});
    days.push({date: ds, label: label, slots: {}});

    (function(idx, dateStr) {
      promises.push(
        fetch(BASE + "/deliveryops/Customers/Dashboard", {
          method: "POST", headers: h,
          body: JSON.stringify({fromDeliveryDate: dateStr, trtId: CFG.trtId, customerHasNoHost: false, skip: 0, take: 200, fromTime: "00:00", toTime: "23:59", countryCode: CFG.cc, onlyMyLocation: true, sort: {}, stage: [], status: [], deliveryType: [], paperwork: [], customerDeliveryStatus: [], inboundStatus: [], VehicleTypes: [], pdcFilter: [], dmvDocumentStages: []})
        }).then(function(r) { return r.json(); }).then(function(j) {
          (j.Data || []).forEach(function(c) {
            var tm = (c.ScheduledDeliveryStartDateString || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
            if (tm) {
              var hr = parseInt(tm[1]);
              var ampm = tm[3].toUpperCase();
              if (ampm === 'PM' && hr < 12) hr += 12;
              if (ampm === 'AM' && hr === 12) hr = 0;
              var slot = String(hr).padStart(2,'0') + ':' + tm[2];
              if (!days[idx].slots[slot]) days[idx].slots[slot] = [];
              days[idx].slots[slot].push(c.CustomerName || '?');
            }
          });
        }).catch(function() {})
      );
    })(i, ds);
  }

  Promise.all(promises).then(function() {
    // Collect all time slots
    var allSlots = {};
    days.forEach(function(d) { Object.keys(d.slots).forEach(function(s) { allSlots[s] = true; }); });
    var times = Object.keys(allSlots).sort();

    // If no slots, show default range
    if (!times.length) times = ['09:00','09:30','10:00','10:30','11:00','11:30','14:00','14:30','15:00','15:30','16:00','16:30'];

    // Build grid
    var html = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">';
    html += '<thead><tr><th style="padding:10px 12px;text-align:left;font-size:12px;color:#71717a;font-weight:600;border-bottom:2px solid rgba(128,128,128,.15);width:70px">TIME</th>';
    days.forEach(function(d) {
      var isToday = d.date === (now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0'));
      html += '<th style="padding:10px 12px;text-align:center;font-size:12px;font-weight:600;border-bottom:2px solid rgba(128,128,128,.15);' + (isToday ? 'color:#3b82f6' : 'color:#71717a') + '">' + d.label + '</th>';
    });
    html += '</tr></thead><tbody>';

    times.forEach(function(t) {
      html += '<tr>';
      html += '<td style="padding:8px 12px;font-weight:600;border-bottom:1px solid rgba(128,128,128,.06);color:#71717a;font-size:12px">' + t + '</td>';
      days.forEach(function(d) {
        var count = d.slots[t] ? d.slots[t].length : 0;
        var bg = count === 0 ? 'transparent' : count <= 2 ? 'rgba(34,197,94,.1)' : count <= 4 ? 'rgba(59,130,246,.1)' : 'rgba(245,158,11,.15)';
        var color = count === 0 ? '#71717a' : count <= 2 ? '#22c55e' : count <= 4 ? '#3b82f6' : '#f59e0b';
        var title = d.slots[t] ? d.slots[t].join(', ') : '';
        html += '<td style="padding:8px 12px;text-align:center;border-bottom:1px solid rgba(128,128,128,.06);background:' + bg + ';cursor:' + (count > 0 ? 'pointer' : 'default') + '" title="' + title + '">';
        html += count > 0 ? '<span style="font-weight:700;color:' + color + '">' + count + '</span>' : '<span style="color:#d4d4d8">-</span>';
        html += '</td>';
      });
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
  });
}

  if (idx === 5 && !document.getElementById("csatView").innerHTML.trim()) {
    fetch(SERVER + "/api/tab/csat").then(function(r) { return r.text(); }).then(function(h) {
      document.getElementById("csatView").innerHTML = h;
      LOADCSAT();
    }).catch(function(e) {
      document.getElementById("csatView").innerHTML = '<div style="padding:60px;text-align:center;color:#c00">Error loading CSAT: ' + e.message + '</div>';
    });
  }

}

/* ============================================
   DISPATCH PAGE: Auto-assign deliveries to CES
   ============================================ */
var _dispatchData = null;

function LOADDISPATCHDATE() {
  var container = document.getElementById('dispatchSummary');
  var contentEl = document.getElementById('dispatchContent');
  var previewBtn = document.getElementById('dispatchPreviewBtn');
  contentEl.innerHTML = '';
  if (previewBtn) previewBtn.disabled = true;

  var dp = document.getElementById('dispatchDate');
  if (!dp || !dp.value) return;
  var ds = dp.value;

  container.innerHTML = '<div style="text-align:center;padding:20px;color:#71717a;font-size:13px">Loading...</div>';

  var h = {"Authorization": AUTH.token, "Content-Type": "application/json", "userid": AUTH.userId};

  // Step 1: Get delivery list
  fetch(BASE + "/deliveryops/Customers/Dashboard", {
    method: "POST", headers: h,
    body: JSON.stringify({fromDeliveryDate: ds, trtId: CFG.trtId, customerHasNoHost: false, skip: 0, take: 200, fromTime: "00:00", toTime: "23:59", countryCode: CFG.cc, onlyMyLocation: true, sort: {}, stage: [], status: [], deliveryType: [], paperwork: [], customerDeliveryStatus: [], inboundStatus: [], VehicleTypes: [], pdcFilter: [], dmvDocumentStages: []})
  }).then(function(r) { return r.json(); }).then(function(dash) {
    var data = (dash.Data || []);

    if (!data.length) {
      _dispatchData = [];
      container.innerHTML = '<div style="text-align:center;padding:30px;color:#71717a">No deliveries for this date.</div>';
      return;
    }

    // Step 2: Enrich with Advisor API (has Trade-In, Enterprise details)
    var rns = data.map(function(d) { return d.ReferenceNumber; });
    return fetch(BASE + "/advisor/Dashboard?isSidePanelFullScreen=true", {
      method: "POST", headers: h,
      body: JSON.stringify({condition:"and",rules:[{condition:"and",ReferenceNumbers:rns,Countries:[]}],Skip:0,Take:200,SortOrder:[],SelectedColumns:[]})
    }).then(function(r) { return r.json(); }).then(function(adv) {
      // Merge: use advisor data (richer) with customer data (has schedule)
      var advMap = {};
      ((adv.Data && adv.Data.Dashboard) || []).forEach(function(a) { advMap[a.ReferenceNumber] = a; });
      data.forEach(function(d) {
        var a = advMap[d.ReferenceNumber];
        if (a) {
          d.TradeInActionStatus = a.TradeInActionStatus;
          d.IsEnterpriseOrder = a.IsEnterpriseOrder;
          d.VehicleModel = a.VehicleModel || d.VehicleModel;
          d.CustomerName = a.CustomerName || d.CustomerName;
        }
      });
      _dispatchData = data;

    if (!data.length) {
      container.innerHTML = '<div style="text-align:center;padding:30px;color:#71717a">No deliveries for this date.</div>';
      return;
    }

    // Count types
    var total = data.length;
    var enterprise = data.filter(function(d) { return d.IsEnterpriseOrder; }).length;
    var tradein = data.filter(function(d) { return d.TradeInActionStatus === 'COMPLETE_TRADE_IN'; }).length;
    var regular = total - enterprise;
    var delivered = data.filter(function(d) { return d.CustomerDeliveryStatus === 'Delivered' || d.CustomerDeliveryStatus === 'Complete'; }).length;
    var pending = total - delivered;

    // Summary cards
    var cardStyle = 'text-align:center;padding:16px 20px;border-radius:10px;border:1px solid rgba(128,128,128,.12);min-width:100px';
    var numStyle = 'font-size:28px;font-weight:700;line-height:1;margin-bottom:4px';
    var lblStyle = 'font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:.5px;font-weight:600';

    var html = '<div style="display:flex;gap:12px;flex-wrap:wrap">';
    html += '<div style="' + cardStyle + '"><div style="' + numStyle + '">' + total + '</div><div style="' + lblStyle + '">Total</div></div>';
    html += '<div style="' + cardStyle + '"><div style="' + numStyle + ';color:#22c55e">' + pending + '</div><div style="' + lblStyle + '">To Deliver</div></div>';
    html += '<div style="' + cardStyle + '"><div style="' + numStyle + ';color:#3b82f6">' + delivered + '</div><div style="' + lblStyle + '">Delivered</div></div>';
    html += '<div style="' + cardStyle + '"><div style="' + numStyle + ';color:#a855f7">' + tradein + '</div><div style="' + lblStyle + '">Trade-In</div></div>';
    html += '<div style="' + cardStyle + '"><div style="' + numStyle + ';color:#f59e0b">' + enterprise + '</div><div style="' + lblStyle + '">Enterprise</div></div>';
    html += '<div style="' + cardStyle + '"><div style="' + numStyle + '">' + regular + '</div><div style="' + lblStyle + '">Regular</div></div>';
    html += '</div>';

    container.innerHTML = html;
    if (previewBtn) previewBtn.disabled = false;
    }); // close advisor .then
  }).catch(function(e) {
    container.innerHTML = '<div style="text-align:center;padding:20px;color:#ef4444">Error: ' + e.message + '</div>';
  });
}

function RUNDISPATCH(mode) {
  var container = document.getElementById('dispatchContent');
  var isPreview = mode === 'preview';

  if (!_dispatchData || !_dispatchData.length) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:#71717a">No delivery data. Select a date first.</div>';
    return;
  }

  // Get active CES
  var activeCES = [];
  var adminPenalty = {};
  CES.forEach(function(c, i) {
    var btn = document.getElementById('cesToggle' + i);
    var adminBtn = document.getElementById('cesAdminToggle' + i);
    if (!btn || btn.dataset.active === '1') {
      activeCES.push(c);
      adminPenalty[c] = (adminBtn && adminBtn.dataset.active === '1') ? 0.5 : 0;
    }
  });

  if (!activeCES.length) {
    container.innerHTML = '<div style="text-align:center;padding:30px;color:#ef4444">No CES selected.</div>';
    return;
  }

  // Parse deliveries
  var deliveries = _dispatchData.map(function(d) {
    var t = '?';
    var tm = (d.ScheduledDeliveryStartDateString || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (tm) { var hr = parseInt(tm[1]); if (tm[3].toUpperCase() === 'PM' && hr < 12) hr += 12; if (tm[3].toUpperCase() === 'AM' && hr === 12) hr = 0; t = String(hr).padStart(2, '0') + ':' + tm[2]; }
    var isEnt = !!d.IsEnterpriseOrder;
    var hasTI = d.TradeInActionStatus === 'COMPLETE_TRADE_IN';
    var weight = isEnt ? 1.5 : hasTI ? 1.3 : 1.0;
    var isPM = parseInt(t) >= 13;
    return { name: d.CustomerName || '?', rn: d.ReferenceNumber, time: t, model: d.VehicleModel || '', host: d.HostName || '', isPM: isPM, weight: weight, isEnt: isEnt, hasTI: hasTI };
  }).sort(function(a, b) { return a.time.localeCompare(b.time); });

  // Auto-assign by weight balancing
  var cesLoad = {};
  activeCES.forEach(function(c) { cesLoad[c] = { am: 0, pm: 0, total: adminPenalty[c] || 0, items: [] }; });

  deliveries.forEach(function(d) {
    var slot = d.isPM ? 'pm' : 'am';
    var minCES = activeCES[0], minLoad = Infinity;
    activeCES.forEach(function(c) {
      if (cesLoad[c][slot] < minLoad) { minLoad = cesLoad[c][slot]; minCES = c; }
    });
    d.assignedTo = minCES;
    cesLoad[minCES][slot] += d.weight;
    cesLoad[minCES].total += d.weight;
    cesLoad[minCES].items.push(d);
  });

  // Render grid
  var html = '<div style="display:grid;grid-template-columns:repeat(' + activeCES.length + ',1fr);gap:16px">';
  activeCES.forEach(function(c) {
    var load = cesLoad[c];
    var firstName = c.split(' ')[0];
    var isAdmin = adminPenalty[c] > 0;
    html += '<div style="border:1px solid rgba(128,128,128,.12);border-radius:12px;padding:16px">';
    html += '<div style="font-size:16px;font-weight:600;margin-bottom:4px">' + firstName + (isAdmin ? ' <span style="font-size:11px;color:#f59e0b;font-weight:600">ADMIN</span>' : '') + '</div>';
    html += '<div style="font-size:12px;color:#71717a;margin-bottom:12px">Load: ' + load.total.toFixed(1) + ' (' + load.items.length + ' deliveries)</div>';

    var amItems = load.items.filter(function(d) { return !d.isPM; });
    html += '<div style="font-size:11px;color:#3b82f6;font-weight:600;text-transform:uppercase;margin-bottom:6px">AM (' + amItems.length + ')</div>';
    amItems.forEach(function(d) {
      html += '<div style="padding:6px 8px;margin-bottom:4px;border-radius:6px;background:rgba(59,130,246,.06);font-size:13px">';
      html += '<div style="font-weight:600">' + d.time + ' — ' + d.name + '</div>';
      html += '<div style="font-size:11px;color:#71717a">' + d.model + (d.isEnt ? ' (Enterprise)' : '') + (d.hasTI ? ' + TI' : '') + '</div>';
      html += '</div>';
    });

    var pmItems = load.items.filter(function(d) { return d.isPM; });
    html += '<div style="font-size:11px;color:#f59e0b;font-weight:600;text-transform:uppercase;margin:12px 0 6px">PM (' + pmItems.length + ')</div>';
    pmItems.forEach(function(d) {
      html += '<div style="padding:6px 8px;margin-bottom:4px;border-radius:6px;background:rgba(245,158,11,.06);font-size:13px">';
      html += '<div style="font-weight:600">' + d.time + ' — ' + d.name + '</div>';
      html += '<div style="font-size:11px;color:#71717a">' + d.model + (d.isEnt ? ' (Enterprise)' : '') + (d.hasTI ? ' + TI' : '') + '</div>';
      html += '</div>';
    });

    html += '</div>';
  });
  html += '</div>';

  if (isPreview) {
    html += '<div style="text-align:center;margin-top:24px"><button class="bt" style="padding:10px 32px;font-size:15px;background:rgba(34,197,94,.12);color:#22c55e;border-color:rgba(34,197,94,.3)" onclick="SAVEDISPATCH()">Save to DRO</button></div>';
  }

  container.innerHTML = html;
}

function SAVEDISPATCH() {
  var btn = document.querySelector('#dispatchContent button');
  if (!btn) return;
  btn.textContent = 'Saving...';
  btn.disabled = true;
  btn.style.opacity = '0.6';
  // Simulate save (TODO: real DRO API call)
  setTimeout(function() {
    btn.textContent = '✓ Dispatch Saved!';
    btn.style.background = 'rgba(34,197,94,.2)';
    btn.style.color = '#22c55e';
    btn.style.borderColor = 'rgba(34,197,94,.3)';
    btn.style.opacity = '1';
  }, 1000);
}

/* ============================================
   PULL-UP PAGE: Find candidates to pull forward
   ============================================ */
function LOADPULLUP() {
  var container = document.getElementById('pullupContent');
  var range = parseInt(document.getElementById('pullupRange').value) || 7;
  container.innerHTML = '<div style="text-align:center;padding:40px;color:#71717a">Searching next ' + range + ' days...</div>';

  var h = {"Authorization": AUTH.token, "Content-Type": "application/json", "userid": AUTH.userId};
  var ds = new Date();
  var allCandidates = [];
  var promises = [];

  for (var i = 1; i <= range; i++) {
    var d = new Date(Date.now() + i * 864e5);
    if (d.getDay() === 0) continue;
    var dateStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    var dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    (function(ds, label) {
      promises.push(
        fetch(BASE + "/deliveryops/Customers/Dashboard", {
          method: "POST", headers: h,
          body: JSON.stringify({fromDeliveryDate: ds, trtId: CFG.trtId, customerHasNoHost: false, skip: 0, take: 200, fromTime: "00:00", toTime: "23:59", countryCode: CFG.cc, onlyMyLocation: true, sort: {}, stage: [], status: [], deliveryType: [], paperwork: [], customerDeliveryStatus: [], inboundStatus: [], VehicleTypes: [], pdcFilter: [], dmvDocumentStages: []})
        }).then(function(r) { return r.json(); }).then(function(j) {
          (j.Data || []).forEach(function(c) {
            var hasPlate = !!(c.LicensePlate && c.LicensePlate.indexOf('-') >= 0);
            var regStatus = c.RegistrationState || '';
            var plateOrRTS = hasPlate || regStatus === 'RTS';
            var hasInsurance = c.InsuranceActionStatus === 'COMPLETE';
            var hasPay = c.AmountDueActionStatus === 'Yes' || c.FinalPaymentGate === 'Complete';
            var otg = c.VehicleStage === 'Finished Goods' || (c.VehicleStage && c.VehicleStage.indexOf('Arrived') >= 0);
            // Ready = plate (or RTS) + payment + OTG. Insurance is NOT a blocker.
            var ready = plateOrRTS && hasPay && otg;
            allCandidates.push({ date: ds, dateLabel: label, name: c.CustomerName, rn: c.ReferenceNumber, model: c.VehicleModel, plate: plateOrRTS, insurance: hasInsurance, payment: hasPay, otg: otg, ready: ready });
          });
        }).catch(function() {})
      );
    })(dateStr, dayLabel);
  }

  Promise.all(promises).then(function() {
    if (!allCandidates.length) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:#71717a">No candidates found.</div>';
      return;
    }

    // Sort: ready first, then by date
    allCandidates.sort(function(a, b) { return (b.ready ? 1 : 0) - (a.ready ? 1 : 0) || a.date.localeCompare(b.date); });
    var readyCount = allCandidates.filter(function(c) { return c.ready; }).length;

    var html = '<div style="margin-bottom:16px;font-size:14px"><span style="color:#22c55e;font-weight:600">' + readyCount + ' ready</span> out of ' + allCandidates.length + ' candidates</div>';
    html += '<table style="width:100%;border-collapse:collapse"><thead><tr>';
    html += '<th style="text-align:left;padding:10px 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">Date</th>';
    html += '<th style="text-align:left;padding:10px 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">Customer</th>';
    html += '<th style="text-align:left;padding:10px 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">RN</th>';
    html += '<th style="text-align:left;padding:10px 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">Vehicle</th>';
    html += '<th style="text-align:center;padding:10px 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">Plate</th>';
    html += '<th style="text-align:center;padding:10px 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">Payment</th>';
    html += '<th style="text-align:center;padding:10px 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">OTG</th>';
    html += '<th style="text-align:center;padding:10px 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">Insurance</th>';
    html += '<th style="text-align:center;padding:10px 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">Status</th>';
    html += '</tr></thead><tbody>';

    allCandidates.forEach(function(c) {
      var dot = function(ok) { return '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + (ok ? '#22c55e' : '#ef4444') + '"></span>'; };
      var rowBg = c.ready ? 'rgba(34,197,94,.04)' : 'transparent';
      html += '<tr style="background:' + rowBg + '">';
      html += '<td style="padding:10px 12px;font-size:13px;border-bottom:1px solid rgba(128,128,128,.08)">' + c.dateLabel + '</td>';
      html += '<td style="padding:10px 12px;font-size:14px;font-weight:600;border-bottom:1px solid rgba(128,128,128,.08)">' + c.name + '</td>';
      html += '<td style="padding:10px 12px;border-bottom:1px solid rgba(128,128,128,.08)"><a href="https://dro.tesla.com/advisor?sidepanel_fullscreen=yes&rn=' + c.rn + '" target="_blank" style="color:#60a5fa;text-decoration:none;font-size:13px">' + c.rn + '</a></td>';
      html += '<td style="padding:10px 12px;font-size:13px;border-bottom:1px solid rgba(128,128,128,.08)">' + (c.model || '') + '</td>';
      html += '<td style="padding:10px 12px;text-align:center;border-bottom:1px solid rgba(128,128,128,.08)">' + dot(c.plate) + '</td>';
      html += '<td style="padding:10px 12px;text-align:center;border-bottom:1px solid rgba(128,128,128,.08)">' + dot(c.payment) + '</td>';
      html += '<td style="padding:10px 12px;text-align:center;border-bottom:1px solid rgba(128,128,128,.08)">' + dot(c.otg) + '</td>';
      html += '<td style="padding:10px 12px;text-align:center;border-bottom:1px solid rgba(128,128,128,.08)">' + dot(c.insurance) + '</td>';
      html += '<td style="padding:10px 12px;text-align:center;font-size:12px;font-weight:600;border-bottom:1px solid rgba(128,128,128,.08);color:' + (c.ready ? '#22c55e' : '#71717a') + '">' + (c.ready ? 'READY' : 'Not ready') + '</td>';
      html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  });
}

/* ============================================
   UPDATE COUNTS: total/ok/alert in stats row
   ============================================ */
function US() {
  var tot = 0, ok = 0, al = 0;
  document.querySelectorAll("#tb tr").forEach(function(r) {
    if (r.style.display === "none") return;
    tot++;
    if (r.classList.contains("w")) al++;
    else ok++;
  });
  document.getElementById("sT").textContent = tot;
  document.getElementById("sO").textContent = ok;
  document.getElementById("sA").textContent = al;
}

/* ============================================
   UPDATE VEHICLE STATUS COUNTS
   ============================================ */
function UV() {
  var tr = 0, cotg = 0, fg = 0, del = 0;
  DATA.forEach(function(d) {
    if (d.vs.indexOf("Transit") >= 0) tr++;
    if (d.otg && !d.delivered) cotg++;
    if (d.vs === "Finished Goods") fg++;
    if (d.delivered) del++;
  });
  document.getElementById("sTr").textContent = tr;
  document.getElementById("sCotg").textContent = cotg;
  document.getElementById("sFg").textContent = fg;
  document.getElementById("sDel").textContent = del;
}

/* ============================================
   UPDATE CES COUNTS
   ============================================ */
function UC() {
  CES.forEach(function(c, i) {
    var n = DATA.filter(function(d) {
      return (d.host || "").toLowerCase().indexOf(c.split(" ")[0].toLowerCase()) >= 0;
    }).length;
    document.getElementById("c" + i).textContent = n;
  });
}

/* ============================================
   TOTAL RECORDS counter
   ============================================ */
function TR() {
  var v = 0;
  document.querySelectorAll("#tb tr").forEach(function(r) {
    if (r.style.display !== "none") v++;
  });
  document.getElementById("trec").textContent = "Total Records: " + v;
}

/* ============================================
   LOAD CSAT tab
   ============================================ */
function LOADCSAT() {
  fetch(SERVER + "/api/bi/csat").then(function(r) { return r.json(); }).then(function(j) {
    if (j.error) return;
    document.getElementById("csatScore").textContent = j.summary.avgScore.replace("%", "");
    document.getElementById("csatSurveys").textContent = j.summary.totalSurveys;

    var adv = j.advisors;
    if (adv[0]) {
      document.getElementById("csatScoreBen").textContent = adv[0].score;
      document.getElementById("csatSurveysBen").textContent = adv[0].count;
    }
    if (adv[1]) {
      document.getElementById("csatScoreSacha").textContent = adv[1].score;
      document.getElementById("csatSurveysSacha").textContent = adv[1].count;
    }
    if (adv[2]) {
      document.getElementById("csatScoreSophie").textContent = adv[2].score;
      document.getElementById("csatSurveysSophie").textContent = adv[2].count;
    }

    var w = j.weekly;
    if (w && w.weeks) {
      var ch = document.getElementById("csatWeeklyChart");
      if (ch) {
        var sc = w.scores || w.counts;
        var html = "";
        for (var i = 0; i < w.weeks.length; i++) {
          if (!sc[i]) continue;
          var pct = sc[i];
          var col = pct >= 80 ? "#28a745" : pct >= 70 ? "#3e6ae1" : "#f0ad4e";
          html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px">'
            + '<div style="font-size:12px;font-weight:600">' + sc[i] + '%</div>'
            + '<div style="width:100%;height:' + pct + '%;border-radius:6px 6px 0 0;background:' + col + ';min-height:8px"></div>'
            + '<div style="font-size:11px;color:#5c5e62">' + w.weeks[i] + '</div></div>';
        }
        ch.innerHTML = html;
      }
    }

    // Last update badge for CSAT
    if (j.lastUpdate) {
      var csatUpd = document.getElementById("csatLastUpdate");
      if (!csatUpd) {
        csatUpd = document.createElement("div");
        csatUpd.id = "csatLastUpdate";
        csatUpd.style.cssText = "font-size:12px;color:#71717a;text-align:right;padding:8px 20px";
        var csatView = document.getElementById("csatView");
        if (csatView && csatView.firstChild) csatView.firstChild.insertBefore(csatUpd, csatView.firstChild.firstChild);
      }
      var ud = new Date(j.lastUpdate);
      csatUpd.textContent = "Data updated: " + ud.toLocaleDateString("en-US", {month:"short",day:"numeric"}) + " " + ud.toLocaleTimeString("en-US", {hour:"numeric",minute:"2-digit"});
    }
  }).catch(function() {});
}

/* ============================================
   EVENT LISTENERS
   ============================================ */

// Search input
var _srch = document.getElementById("srch");
if (_srch) _srch.oninput = function() {
  var q = this.value.toLowerCase();
  document.querySelectorAll("#tb tr").forEach(function(r) {
    r.style.display = r.textContent.toLowerCase().indexOf(q) >= 0 ? "" : "none";
  });
  TR();
};

// Hamburger menu toggle
var _hbg = document.getElementById("hbg");
if (_hbg) _hbg.onclick = function() {
  document.getElementById("sidebar").classList.toggle("collapsed");
};

// Check auth status after 2 seconds
setTimeout(CHKAUTH, 2000);

// Close any menus on click
document.addEventListener("click", function() {});

/* ============================================
   DASHBOARD HOME: Load summary data
   ============================================ */
function LOADDASH() {
  var h = {"Authorization": AUTH.token, "Content-Type": "application/json", "userid": AUTH.userId};
  var ds = new Date();
  var today = ds.getFullYear() + '-' + String(ds.getMonth()+1).padStart(2,'0') + '-' + String(ds.getDate()).padStart(2,'0');

  // 1. Load today's deliveries
  fetch(BASE + "/deliveryops/Customers/Dashboard", {
    method: "POST", headers: h,
    body: JSON.stringify({fromDeliveryDate: today, trtId: CFG.trtId, customerHasNoHost: false, skip: 0, take: 200, fromTime: "00:00", toTime: "23:59", countryCode: CFG.cc, onlyMyLocation: true, sort: {}, stage: [], status: [], deliveryType: [], paperwork: [], customerDeliveryStatus: [], inboundStatus: [], VehicleTypes: [], pdcFilter: [], dmvDocumentStages: []})
  }).then(function(r) { return r.json(); }).then(function(dash) {
    var data = dash.Data || [];
    var total = data.length;
    var delivered = data.filter(function(d) { return d.CustomerDeliveryStatus === 'Delivered' || d.CustomerDeliveryStatus === 'Complete'; }).length;
    var fg = data.filter(function(d) { return d.VehicleStage === 'Finished Goods' || (d.VehicleStage && d.VehicleStage.indexOf('Arrived') >= 0); }).length;
    var notReady = data.filter(function(d) { return d.CustomerDeliveryStatus !== 'Delivered' && d.CustomerDeliveryStatus !== 'Complete' && d.VehicleStage !== 'Finished Goods'; }).length;

    document.getElementById("dashDeliveries").textContent = total;
    document.getElementById("dashDeliveriesSub").textContent = delivered + " delivered";
    document.getElementById("dashReady").textContent = fg;
    document.getElementById("dashReadySub").textContent = "on the ground";
    document.getElementById("dashNotReady").textContent = notReady;
    document.getElementById("dashNotReadySub").textContent = "not ready";

    // Schedule
    var scheduleHtml = '';
    data.sort(function(a, b) { return (a.ScheduledDeliveryStartDateString || '').localeCompare(b.ScheduledDeliveryStartDateString || ''); });
    data.forEach(function(d) {
      var t = '?';
      var tm = (d.ScheduledDeliveryStartDateString || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (tm) { var hr = parseInt(tm[1]); if (tm[3].toUpperCase() === 'PM' && hr < 12) hr += 12; if (tm[3].toUpperCase() === 'AM' && hr === 12) hr = 0; t = String(hr).padStart(2, '0') + ':' + tm[2]; }
      var isDelivered = d.CustomerDeliveryStatus === 'Delivered' || d.CustomerDeliveryStatus === 'Complete';
      scheduleHtml += '<div class="dash-schedule-row">'
        + '<div class="dash-schedule-time">' + t + '</div>'
        + '<div class="dash-schedule-name">' + (d.CustomerName || '') + '</div>'
        + '<div class="dash-schedule-model">' + (d.VehicleModel || '') + '</div>'
        + '<div class="dash-schedule-status">'
        + '<div class="dash-schedule-dot" style="background:' + (isDelivered ? '#22c55e' : '#3b82f6') + '"></div>'
        + '</div>'
        + '</div>';
    });
    document.getElementById("dashSchedule").innerHTML = scheduleHtml || '<div style="color:#52525b;padding:20px;text-align:center">No deliveries today</div>';
  }).catch(function(e) {
    document.getElementById("dashDeliveries").textContent = '!';
    document.getElementById("dashDeliveriesSub").textContent = e.message;
  });

  // 2. Load arrivals
  fetch(SERVER + "/api/bi/arrivals").then(function(r) { return r.json(); }).then(function(j) {
    if (j.error) return;
    var chart = document.getElementById("dashArrChart");
    var dates = j.data ? j.data.dates : [];
    var arrived = j.data ? j.data.arrived : [];
    var confident = j.data ? j.data.confident : [];
    var preliminary = j.data ? j.data.preliminary : [];
    var maxVal = 1;
    dates.forEach(function(_, i) {
      var total = (arrived[i] || 0) + (confident[i] || 0) + (preliminary[i] || 0);
      if (total > maxVal) maxVal = total;
    });
    var html = '';
    // Show only next 7 calendar days
    dates.slice(0, 7).forEach(function(d, i) {
      var a = arrived[i] || 0, c = confident[i] || 0, p = preliminary[i] || 0;
      var total = a + c + p;
      var aH = Math.max(Math.round((a / maxVal) * 140), a > 0 ? 4 : 0);
      var cH = Math.max(Math.round((c / maxVal) * 140), c > 0 ? 4 : 0);
      var pH = Math.max(Math.round((p / maxVal) * 140), p > 0 ? 4 : 0);
      var label = d;
      html += '<div class="dash-bar-group">'
        + '<div class="dash-bar-value">' + total + '</div>'
        + '<div style="display:flex;flex-direction:column-reverse;width:100%;align-items:center">'
        + '<div class="dash-bar" style="height:' + aH + 'px;background:#22c55e"></div>'
        + '<div class="dash-bar" style="height:' + cH + 'px;background:#3b82f6"></div>'
        + '<div class="dash-bar" style="height:' + pH + 'px;background:#f59e0b"></div>'
        + '</div>'
        + '<div class="dash-bar-label">' + label + '</div>'
        + '</div>';
    });
    chart.innerHTML = html;
  }).catch(function() {});

  // 3. Load stock
  fetch(SERVER + "/api/bi/stock").then(function(r) { return r.json(); }).then(function(j) {
    if (j.error) return;
    document.getElementById("dashStock").textContent = j.rennes || 0;
    var s = j.stats || {};
    document.getElementById("dashStockSub").textContent = (s.customerCount || 0) + ' customer, ' + (s.inventoryCount || 0) + ' inventory';
  }).catch(function() {});

  // 4. Load CSAT
  fetch(SERVER + "/api/bi/csat").then(function(r) { return r.json(); }).then(function(j) {
    if (j.error) return;
    document.getElementById("dashCsat").textContent = (j.summary ? j.summary.avgScore : '-');
    document.getElementById("dashCsatSub").textContent = (j.summary ? j.summary.totalSurveys + ' surveys' : '');
    // CES chart
    var cesChart = document.getElementById("dashCesChart");
    if (j.advisors && j.advisors.length) {
      var maxScore = 100;
      var html = '';
      j.advisors.forEach(function(a) {
        var score = a.scoreRaw || 0;
        var color = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
        html += '<div class="dash-ces-row">'
          + '<div class="dash-ces-name">' + a.name.split(' ')[0] + '</div>'
          + '<div class="dash-ces-bar-bg"><div class="dash-ces-bar" style="width:' + score + '%;background:' + color + '">' + Math.round(score) + '%</div></div>'
          + '</div>';
      });
      cesChart.innerHTML = html;
    } else {
      cesChart.innerHTML = '<div style="color:#52525b;padding:20px;text-align:center">No CSAT data</div>';
    }
  }).catch(function() {});

  // 5. Load trade-in
  fetch(SERVER + "/api/scan/status").then(function(r) { return r.json(); }).then(function(j) {
    var onSite = (j.tracking || []).filter(function(t) { return !t.outDate; }).length;
    document.getElementById("dashTradeIn").textContent = onSite;
    document.getElementById("dashTradeInSub").textContent = 'vehicles on site';
  }).catch(function() {});
}
