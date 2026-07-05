/* DASH v4.0 - Delivery Automation Smart Hub - Application Logic */

function fmtSDD(sp) {
  var mm = String(sp.getMonth() + 1).padStart(2, '0');
  var dd = String(sp.getDate()).padStart(2, '0');
  var yy = sp.getFullYear();
  return mm + '-' + dd + '-' + yy;
}

function ERRMSG(msg) {
  if (msg && (msg.indexOf('token') >= 0 || msg.indexOf('expired') >= 0 || msg.indexOf('401') >= 0 || msg.indexOf('Dashboard') >= 0 || msg.indexOf('undefined') >= 0)) {
    return '<div style="padding:60px;text-align:center"><div style="color:#f59e0b;font-size:16px;font-weight:600;margin-bottom:12px">DRO Token Expired</div><div style="color:#71717a;font-size:14px">Open the <a href="https://dro.tesla.com" target="_blank" style="color:#3b82f6">DRO tab</a> to refresh your session, then reload.</div></div>';
  }
  return '<div style="padding:60px;text-align:center;color:#ef4444">Error: ' + (msg || 'Unknown') + '</div>';
}

/* ============================================
   GLOBAL STATE
   ============================================ */
var WKMODE = false;
var sortDir = {};
var activeFilter = null;
var _calWeekOffset = 0;
var _calView = 'week';

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

     var allAdv = (adv.Data && adv.Data.Dashboard) || [];
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
    lg.innerHTML = ERRMSG(err.message); if (typeof loadBar !== 'undefined' && loadBar) loadBar.classList.remove("active");
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

    var allAdv = (adv.Data && adv.Data.Dashboard) || [];
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
    lg.innerHTML = ERRMSG(err.message); if (typeof loadBar !== 'undefined' && loadBar) loadBar.classList.remove("active");
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
  // Now handled by colApply() which checks WKMODE
  if (typeof colApply === 'function') colApply();
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
    lg.innerHTML = ERRMSG(err.message); if (typeof loadBar !== 'undefined' && loadBar) loadBar.classList.remove("active");
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
      + '<td data-col="ck"><input type="checkbox" class="ck rc" data-i="' + i + '" ' + (d.al.length === 0 ? 'checked' : '') + '></td>'
      + '<td data-col="date" class="dtc">' + (d.sdd || '') + '</td>'
      + '<td data-col="time">' + d.t + '</td>'
      + '<td data-col="customer"><span class="nm">' + d.name + '</span></td>'
      + '<td data-col="rn"><a class="rl" href="https://dro.tesla.com/advisor?sidepanel_fullscreen=yes&rn=' + d.rn + '" target="_blank">' + d.rn + '</a>'
      + (d.b2b ? '' : '<a href="https://tesla.cee.trustia.ai/admin/folder/folder/?q=' + d.rn + '" target="_blank" style="margin-left:4px;font-size:10px;background:rgba(34,197,94,.12);color:#22c55e;padding:1px 6px;border-radius:10px;text-decoration:none;font-weight:600" title="Verifier CEE sur Trustia">CEE</a>')
      + '</td>'
      + '<td data-col="host" style="font-size:12px;color:#a1a1aa">' + d.host + '</td>'
      + '<td data-col="vehicle">' + d.model + '</td>'
      + '<td data-col="reg">' + rc + '</td>'
      + '<td data-col="pay">' + (d.amtOk ? '<span class="dt dg"></span>OK' : '<span class="dt dr"></span>No') + '</td>'
      + '<td data-col="ti">' + tc + '</td>'
      + '<td data-col="vs"><span class="dt ' + vc + '"></span>' + d.vs + '</td>'
      + '<td data-col="hold">' + (d.hold ? '<span class="dt dr"></span><a href="https://dro.tesla.com/advisor?sidepanel_fullscreen=yes&rn=' + d.rn + '" target="_blank" style="color:#ef4444;font-weight:700;text-decoration:none">Hold</a>' : '<span class="dt dg"></span>OK') + '</td>'
      + '<td data-col="ins">' + (d.io ? '<span class="dt dg"></span>OK' : '<span class="su">No</span>') + '</td>'
      + '<td data-col="print" style="text-align:center"><button onclick="P1(' + i + ',this)" style="padding:5px 7px;border:1px solid rgba(255,255,255,.1);border-radius:5px;cursor:pointer;background:none;color:#a1a1aa;font-family:inherit;font-size:12px;line-height:1">'
      + '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#71717a" stroke-width="2" style="display:block"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>'
      + '</button></td></tr>';
  }

  tb.innerHTML = out;

  if (WKMODE) showDateCol(true);

  // Apply column visibility/widths + init resize handles
  if (typeof colApply === 'function') colApply();
  if (typeof colInitResize === 'function') colInitResize();

  // Populate dynamic filter dropdowns
  if (typeof populateFilters === 'function') populateFilters(DATA);

  // Check print status (reset if SDD changed = pushback)
  fetch(SERVER + "/api/print/status").then(function(r) { return r.json(); }).then(function(ps) {
    document.querySelectorAll("#tb tr").forEach(function(r) {
      var ci = r.querySelector(".rc");
      if (!ci) return;
      var d = DATA[parseInt(ci.dataset.i)];
      if (!d) return;
      var entry = ps[d.rn];
      if (entry) {
        // Check if SDD changed (pushback) → reset print status
        if (entry.sdd && d.sddRaw && entry.sdd !== d.sddRaw) {
          // SDD changed — delete print status for this RN
          fetch(SERVER + "/api/print/status/" + d.rn, { method: "DELETE" }).catch(function() {});
          return; // leave button in default (unprinted) state
        }
        var btn = r.querySelector("button");
        if (btn) {
          btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8" rx="1"/></svg>';
          btn.style.border = "1px solid rgba(34,197,94,.3)";
          btn.style.background = "rgba(34,197,94,.1)";
          btn.title = "Printed " + new Date(entry.date).toLocaleString("fr-FR", {day:"2-digit",month:"2-digit",hour:"2-digit",minute:"2-digit"}) + " — Reprint";
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
  var titles = ["Dashboard", "Customer Delivery", "Arrivals", "Stock", "Trade-In", "CSAT", "Dispatch", "Pull-Up", "Calendar", "Vehicle Readiness", "SV & Holds", "Due Bills"];
  var subtitles = [
    "Overview of today's delivery operations.",
    "Manage and track scheduled deliveries.",
    "Track vehicle arrivals and transit status.",
    "Rennes fleet inventory and vehicle tracking.",
    "Track trade-in vehicles on site.",
    "Customer satisfaction scores and CES performance.",
    "Assign deliveries to CES team members with balanced workload distribution.",
    "Find deliveries from upcoming days that can be pulled forward.",
    "Weekly delivery schedule overview.",
    "Vehicle preparation pipeline and readiness tracking.",
    "Service visits and containment holds monitoring.",
    "Track post-delivery defects and resolutions."
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
  var vrsEl = document.getElementById("vrsView");
  if (vrsEl) vrsEl.style.display = idx === 9 ? "" : "none";
  var svholdsEl = document.getElementById("svholdsView");
  if (svholdsEl) svholdsEl.style.display = idx === 10 ? "" : "none";
  var duebillsEl = document.getElementById("duebillsView");
  if (duebillsEl) duebillsEl.style.display = idx === 11 ? "" : "none";

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

  if (idx === 8 && typeof LOADCALENDAR === 'function') {
    LOADCALENDAR();
  }

  if (idx === 9 && typeof LOADVRS === 'function') {
    LOADVRS();
  }

  if (idx === 10 && typeof LOADSVHOLDS === 'function') {
    LOADSVHOLDS();
  }

  if (idx === 11 && typeof LOADDUEBILLS === 'function') {
    LOADDUEBILLS();
  }
} // END OF STAB

/* ============================================
   CALENDAR: Week navigation
   ============================================ */
function NAVCALWEEK(dir) {
  _calWeekOffset += dir;
  LOADCALENDAR();
}

function SETCALVIEW(view) {
  _calView = view;
  document.getElementById('calViewWeek').style.fontWeight = view === 'week' ? '700' : '400';
  document.getElementById('calViewDay').style.fontWeight = view === 'day' ? '700' : '400';
  LOADCALENDAR();
}

function SHOWCALTODAY() {
  var now = new Date();
  var todayLabel = now.toLocaleDateString('en-US', {weekday:'long', month:'short', day:'numeric'});
  // Find today's day index in _calAllDays
  var todayStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
  var dayIdx = -1;
  for (var i = 0; i < _calAllDays.length; i++) {
    if (_calAllDays[i].date === todayStr) { dayIdx = i; break; }
  }
  if (dayIdx === -1) {
    // Today not in current week - reset to this week first
    _calWeekOffset = 0;
    LOADCALENDAR();
    setTimeout(SHOWCALTODAY, 2000);
    return;
  }
  var day = _calAllDays[dayIdx];
  var allItems = [];
  Object.keys(day.slots).sort().forEach(function(t) {
    day.slots[t].forEach(function(item) {
      allItems.push({time: t, name: item.name, rn: item.rn, vin6: item.vin6, model: item.model, host: item.host, status: item.status});
    });
  });

  var panel = document.getElementById('calDetailOverlay');
  var title = document.getElementById('calDetailTitle');
  var body = document.getElementById('calDetailBody');
  title.textContent = 'Today — ' + todayLabel + ' (' + allItems.length + ' appointments)';
  panel.style.display = 'flex';

  fetch(SERVER + '/api/notes').then(function(r) { return r.json(); }).then(function(notes) {
    var html = '<table>';
    html += '<thead><tr>';
    html += '<th>Time</th><th>Customer</th><th>RN</th><th>VIN</th><th>Model</th><th>Host</th><th>Status</th><th style="min-width:200px">Notes</th>';
    html += '</tr></thead><tbody>';
    if (!allItems.length) {
      html += '<tr><td colspan="8" style="text-align:center;padding:30px;color:#71717a">No appointments today</td></tr>';
    }
    allItems.forEach(function(it) {
      var dotColor = it.status === 'Confirmed' || it.status === 'Complete' ? '#22c55e' : it.status === 'Scheduled' ? '#3b82f6' : it.status === 'Delivered' ? '#71717a' : '#ef4444';
      var note = notes[it.rn] || '';
      html += '<tr>';
      html += '<td style="font-weight:600;font-size:15px">' + it.time + '</td>';
      html += '<td style="font-weight:600">' + it.name + '</td>';
      html += '<td><a href="https://dro.tesla.com/advisor?sidepanel_fullscreen=yes&rn=' + it.rn + '" target="_blank" style="color:#60a5fa;text-decoration:none">' + it.rn + '</a></td>';
      html += '<td style="font-family:monospace;font-size:13px;color:#71717a">' + (it.vin || '-') + '</td>';
      html += '<td>' + it.model + '</td>';
      html += '<td>' + (it.host || '-') + '</td>';
      html += '<td><span class="cal-dot" style="background:' + dotColor + '"></span>' + it.status + '</td>';
      html += '<td><input type="text" value="' + note.replace(/"/g, '&quot;') + '" placeholder="Add note..." onblur="SAVENOTE(\'' + it.rn + '\',this.value)" onfocus="this.style.borderColor=\'#3b82f6\'" /></td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    body.innerHTML = html;
  }).catch(function() {
    body.innerHTML = '<div style="color:#ef4444">Error loading</div>';
  });
}

/* ============================================
   CALENDAR: Weekly schedule grid
   ============================================ */
function LOADCALENDAR() {
  var container = document.getElementById('calendarContent');
  var calBar = document.getElementById('calLoadingBar');
  if (calBar) calBar.classList.add('active');
  container.innerHTML = '<div style="text-align:center;padding:30px;color:#71717a">Loading week...</div>';
  var h = {"Authorization": AUTH.token, "Content-Type": "application/json", "userid": AUTH.userId};

  // Get Monday of current week, offset by _calWeekOffset
  var now = new Date();
  var mon = new Date(now);
  if (_calView === 'day') {
    mon.setDate(now.getDate() + (_calWeekOffset * 1));
  } else {
    mon.setDate(now.getDate() - ((now.getDay() + 6) % 7) + (_calWeekOffset * 7));
  }

  // Fetch days
  var numDays = _calView === 'day' ? 1 : 6;
  var days = [];
  var promises = [];
  for (var i = 0; i < numDays; i++) {
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
          var data = j.Data || [];
          if (!data.length) return;
          // Enrich with Advisor API for appointment status
          var rns = data.map(function(c) { return c.ReferenceNumber; });
          return fetch(BASE + "/advisor/Dashboard?isSidePanelFullScreen=true", {
            method: "POST", headers: h,
            body: JSON.stringify({condition:"and",rules:[{condition:"and",ReferenceNumbers:rns,Countries:[]}],Skip:0,Take:200,SortOrder:[],SelectedColumns:[]})
          }).then(function(r2) { return r2.json(); }).then(function(adv) {
            var advMap = {};
            ((adv.Data && adv.Data.Dashboard) || []).forEach(function(a) { advMap[a.ReferenceNumber] = a; });
            data.forEach(function(c) {
              var a = advMap[c.ReferenceNumber] || {};
              var tm = (c.ScheduledDeliveryStartDateString || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
              if (tm) {
                var hr = parseInt(tm[1]);
                var ampm = tm[3].toUpperCase();
                if (ampm === 'PM' && hr < 12) hr += 12;
                if (ampm === 'AM' && hr === 12) hr = 0;
                var slot = String(hr).padStart(2,'0') + ':' + tm[2];
                if (!days[idx].slots[slot]) days[idx].slots[slot] = [];
                days[idx].slots[slot].push({
                  name: a.CustomerName || c.CustomerName || '?',
                  rn: c.ReferenceNumber || '',
                  vin: a.Vin || '',
                  model: a.VehicleModel || c.VehicleModel || '',
                  host: c.HostName || a.DeliverySpecialistName || '',
                  status: a.AppointmentStatus || a.AppointmentSystemStatus || 'Scheduled'
                });
              }
            });
          });
        }).catch(function() {})
      );
    })(i, ds);
  }

  // Update week label
  var sat = new Date(mon);
  sat.setDate(mon.getDate() + (numDays - 1));
  var weekLabel = document.getElementById('calWeekLabel');
  if (weekLabel) {
    // Calculate ISO week number
    var thu = new Date(mon);
    thu.setDate(mon.getDate() + 3);
    var yearStart = new Date(thu.getFullYear(), 0, 1);
    var weekNum = Math.ceil((((thu - yearStart) / 86400000) + yearStart.getDay() + 1) / 7);

    if (_calView === 'day') {
      weekLabel.textContent = mon.toLocaleDateString('en-US', {weekday:'long', month:'short', day:'numeric'}) + '  | W' + weekNum;
    } else {
      var monLabel = mon.toLocaleDateString('en-US', {month:'short', day:'numeric'});
      var satLabel = sat.toLocaleDateString('en-US', {month:'short', day:'numeric'});
      weekLabel.textContent = monLabel + ' - ' + satLabel + '  | W' + weekNum;
    }
  }

  Promise.all(promises).then(function() {
    _calAllDays = days;
    // Collect all time slots
    var allSlots = {};
    days.forEach(function(d) { Object.keys(d.slots).forEach(function(s) { allSlots[s] = true; }); });

    // Insert lunch break slots (12:00-13:30) so they always appear
    ['12:00','12:30','13:00','13:30'].forEach(function(t) { allSlots[t] = true; });

    // Always show full time range
    var defaultTimes = ['09:00','09:30','10:00','10:30','11:00','11:30','12:00','12:30','13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00','17:30'];
    var dataKeys = Object.keys(allSlots);
    dataKeys.forEach(function(k) { if (defaultTimes.indexOf(k) < 0) defaultTimes.push(k); });
    var times = defaultTimes.sort();
    var lunchSlots = {'12:00':true,'12:30':true,'13:00':true,'13:30':true};

    // Compute daily totals
    var dayTotals = days.map(function(d) {
      var total = 0;
      Object.keys(d.slots).forEach(function(s) { total += d.slots[s].length; });
      return total;
    });

    // Status → dot color helper
    function statusDotColor(status) {
      var s = (status || '').toLowerCase();
      if (s === 'confirmed' || s === 'complete') return '#22c55e';
      if (s === 'scheduled') return '#3b82f6';
      if (s === 'delivered') return '#71717a';
      return '#ef4444';
    }

    // Build grid with Scheduled | Confirmed sub-columns
    var html = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;font-size:13px">';
    var isDark = !document.getElementById('lightThemeCSS');
    // Header row
    html += '<thead>';
    // Row 1: Day name + total
    html += '<tr><th style="padding:8px 12px;font-size:11px;color:#71717a;font-weight:600;border-bottom:1px solid rgba(128,128,128,.1);width:75px;text-transform:uppercase">Time</th>';
    days.forEach(function(d) {
      var isToday = d.date === (now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0'));
      var dayTotal = 0, daySched = 0, dayConf = 0;
      Object.keys(d.slots).forEach(function(s) { d.slots[s].forEach(function(e) { dayTotal++; if (e.status === 'Confirmed' || e.status === 'Complete') dayConf++; else daySched++; }); });
      d._sched = daySched; d._conf = dayConf;
      var headerCol = isToday ? '#3b82f6' : (isDark ? '#f4f4f5' : '#000000');
      html += '<th colspan="2" style="padding:16px 6px;text-align:center;border-bottom:1px solid rgba(128,128,128,.1);border-left:1px solid rgba(128,128,128,.12);' + (isToday ? 'background:rgba(59,130,246,.06)' : '') + '">';
      html += '<div style="font-size:12px;font-weight:700;color:' + (isToday ? '#3b82f6' : isDark ? '#a1a1aa' : '#374151') + ';text-transform:uppercase;letter-spacing:.5px">' + d.label + '</div>';
      html += '<div style="font-size:36px;font-weight:800;color:' + headerCol + ';line-height:1.2">' + dayTotal + '</div>';
      html += '</th>';
    });
    html += '</tr>';
    // Row 2: S | C aligned above columns
    html += '<tr><th style="padding:6px 12px;border-bottom:2px solid rgba(128,128,128,.15)"></th>';
    days.forEach(function(d) {
      html += '<th style="padding:6px 4px;text-align:center;border-bottom:2px solid rgba(128,128,128,.15);border-left:1px solid rgba(128,128,128,.12)"><span style="font-size:20px;font-weight:700;color:#3b82f6">' + d._sched + '</span></th>';
      html += '<th style="padding:6px 4px;text-align:center;border-bottom:2px solid rgba(128,128,128,.15)"><span style="font-size:20px;font-weight:700;color:#22c55e">' + d._conf + '</span></th>';
    });
    html += '</tr></thead><tbody>';

    times.forEach(function(t) {
      var isLunch = !!lunchSlots[t];
      var lunchHasData = false;
      if (isLunch) { days.forEach(function(d) { if (d.slots[t] && d.slots[t].length) lunchHasData = true; }); }
      var isBreakRow = isLunch && !lunchHasData;
      if (isBreakRow && t !== '12:00') return;

      html += '<tr>';
      if (isBreakRow) {
        html += '<td style="padding:8px 12px;font-weight:600;border-bottom:1px solid rgba(128,128,128,.06);font-size:11px;font-style:italic;color:#71717a;white-space:nowrap">12:00-13:30</td>';
        days.forEach(function() {
          html += '<td colspan="2" style="padding:8px;text-align:center;border-bottom:1px solid rgba(128,128,128,.06);border-left:1px solid rgba(128,128,128,.12);color:#71717a;font-size:11px;font-style:italic;background:' + (isDark ? 'rgba(255,255,255,.02)' : 'rgba(0,0,0,.015)') + '">BREAK</td>';
        });
      } else {
        html += '<td style="padding:8px 12px;font-weight:600;border-bottom:1px solid rgba(128,128,128,.06);color:' + (isDark ? '#a1a1aa' : '#6b7280') + ';font-size:13px">' + t + '</td>';
        days.forEach(function(d, dayIndex) {
          var entries = d.slots[t] || [];
          var sched = entries.filter(function(e) { return e.status !== 'Confirmed' && e.status !== 'Complete'; }).length;
          var conf = entries.filter(function(e) { return e.status === 'Confirmed' || e.status === 'Complete'; }).length;
          html += '<td onclick="SHOWCALDETAIL(' + dayIndex + ',\'' + t + '\',\'scheduled\')" style="padding:8px 4px;text-align:center;border-bottom:1px solid rgba(128,128,128,.06);border-left:1px solid rgba(128,128,128,.12);border-right:1px solid rgba(128,128,128,.04);cursor:pointer">';
          html += sched > 0 ? '<span style="font-weight:700;font-size:20px;color:#3b82f6">' + sched + '</span>' : '';
          html += '</td>';
          html += '<td onclick="SHOWCALDETAIL(' + dayIndex + ',\'' + t + '\',\'confirmed\')" style="padding:8px 4px;text-align:center;border-bottom:1px solid rgba(128,128,128,.06);cursor:pointer">';
          html += conf > 0 ? '<span style="font-weight:700;font-size:20px;color:#22c55e">' + conf + '</span>' : '';
          html += '</td>';
        });
      }
      html += '</tr>';
    });

    html += '</tbody></table></div>';
    container.innerHTML = html;
    if (calBar) calBar.classList.remove('active');
  });
}

/* ============================================
   DISPATCH PAGE: Auto-assign deliveries to CES
   ============================================ */
var _dispatchData = null;

function LOADDISPATCHDATE() {
  var summary = document.getElementById('dispatchSummary');
  var board = document.getElementById('dispatchBoard');
  var balBtn = document.getElementById('dispatchBalanceBtn');
  var saveBtn = document.getElementById('dispatchSaveBtn');
  board.innerHTML = '';
  if (balBtn) balBtn.disabled = true;
  if (saveBtn) saveBtn.disabled = true;

  var dp = document.getElementById('dispatchDate');
  if (!dp || !dp.value) return;
  var ds = dp.value;

  summary.innerHTML = '<div style="text-align:center;padding:20px;color:#71717a;font-size:13px">Loading...</div>';

  var h = {"Authorization": AUTH.token, "Content-Type": "application/json", "userid": AUTH.userId};

  fetch(BASE + "/deliveryops/Customers/Dashboard", {
    method: "POST", headers: h,
    body: JSON.stringify({fromDeliveryDate: ds, trtId: CFG.trtId, customerHasNoHost: false, skip: 0, take: 200, fromTime: "00:00", toTime: "23:59", countryCode: CFG.cc, onlyMyLocation: true, sort: {}, stage: [], status: [], deliveryType: [], paperwork: [], customerDeliveryStatus: [], inboundStatus: [], VehicleTypes: [], pdcFilter: [], dmvDocumentStages: []})
  }).then(function(r) { return r.json(); }).then(function(dash) {
    var data = (dash.Data || []);
    if (!data.length) { _dispatchData = []; summary.innerHTML = '<div style="text-align:center;padding:30px;color:#71717a">No deliveries for this date.</div>'; return; }

    // Enrich with Advisor API
    var rns = data.map(function(d) { return d.ReferenceNumber; });
    return fetch(BASE + "/advisor/Dashboard?isSidePanelFullScreen=true", {
      method: "POST", headers: h,
      body: JSON.stringify({condition:"and",rules:[{condition:"and",ReferenceNumbers:rns,Countries:[]}],Skip:0,Take:200,SortOrder:[],SelectedColumns:[]})
    }).then(function(r) { return r.json(); }).then(function(adv) {
      var advMap = {};
      ((adv.Data && adv.Data.Dashboard) || []).forEach(function(a) { advMap[a.ReferenceNumber] = a; });
      
      _dispatchData = data.map(function(d) {
        var a = advMap[d.ReferenceNumber] || {};
        var t = '?';
        var tm = (d.ScheduledDeliveryStartDateString || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (tm) { var hr = parseInt(tm[1]); if (tm[3].toUpperCase() === 'PM' && hr < 12) hr += 12; if (tm[3].toUpperCase() === 'AM' && hr === 12) hr = 0; t = String(hr).padStart(2, '0') + ':' + tm[2]; }
        var hasTI = d.TradeInActionStatus === 'COMPLETE_TRADE_IN';
        var isEnt = !!(d.IsEnterpriseOrder || a.IsEnterpriseOrder);
        return {
          rn: d.ReferenceNumber,
          name: d.CustomerName || a.CustomerName || '?',
          time: t,
          model: a.VehicleModel || d.VehicleModel || '',
          host: d.HostName || a.DeliverySpecialist || '',
          isEnt: isEnt,
          hasTI: hasTI,
          isPM: parseInt(t) >= 13,
          weight: isEnt ? 1.5 : hasTI ? 1.3 : 1.0,
          delivered: !!(a.IsDelivered || d.CustomerDeliveryStatus === 'Delivered'),
          vs: String(a.VehicleStage || ''),
          vehicleMapId: String(a.VehicleMapId || d.VehicleMapId || '')
        };
      }).sort(function(a, b) { return a.time.localeCompare(b.time); });

      RENDERDISPATCH();
      if (balBtn) balBtn.disabled = false;
      if (saveBtn) saveBtn.disabled = false;
    });
  }).catch(function(e) {
    summary.innerHTML = ERRMSG(e.message);
  });
}

function RENDERDISPATCH() {
  var summary = document.getElementById('dispatchSummary');
  var board = document.getElementById('dispatchBoard');
  var data = _dispatchData || [];

  // Summary cards
  var total = data.length;
  var delivered = data.filter(function(d) { return d.delivered; }).length;
  var tradein = data.filter(function(d) { return d.hasTI; }).length;
  var enterprise = data.filter(function(d) { return d.isEnt; }).length;
  var unassigned = data.filter(function(d) { return !d.host; }).length;

  var cs = 'display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:8px;border:1px solid rgba(128,128,128,.1);font-size:13px;font-weight:600';
  summary.innerHTML = '<div style="display:flex;gap:10px;flex-wrap:wrap">'
    + '<div style="' + cs + '"><span style="font-size:20px;font-weight:700">' + total + '</span> Total</div>'
    + '<div style="' + cs + ';color:#22c55e"><span style="font-size:20px">' + (total - delivered) + '</span> To Deliver</div>'
    + '<div style="' + cs + ';color:#3b82f6"><span style="font-size:20px">' + delivered + '</span> Delivered</div>'
    + '<div style="' + cs + ';color:#a855f7"><span style="font-size:20px">' + tradein + '</span> Trade-In</div>'
    + '<div style="' + cs + ';color:#f59e0b"><span style="font-size:20px">' + enterprise + '</span> Enterprise</div>'
    + (unassigned ? '<div style="' + cs + ';color:#ef4444"><span style="font-size:20px">' + unassigned + '</span> Unassigned</div>' : '')
    + '</div>';

  // Group by host
  var columns = {};
  CES.forEach(function(c) { columns[c] = []; });
  columns['Unassigned'] = [];
  data.forEach(function(d) {
    var found = false;
    var hostLower = (d.host || '').toLowerCase();
    CES.forEach(function(c) {
      if (hostLower && hostLower === c.toLowerCase()) { columns[c].push(d); found = true; }
      else if (hostLower && c.toLowerCase().split(' ')[0] === hostLower.split(' ')[0]) { columns[c].push(d); found = true; }
    });
    if (!found) columns['Unassigned'].push(d);
  });

  // Render Kanban
  var colKeys = CES.slice();
  if (columns['Unassigned'].length) colKeys.push('Unassigned');
  board.style.gridTemplateColumns = 'repeat(' + colKeys.length + ', 1fr)';

  var isDark = !document.getElementById('lightThemeCSS');
  var colBg = isDark ? 'rgba(255,255,255,.03)' : '#f8f9fa';
  var colBdr = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)';
  var cardBg = isDark ? 'rgba(255,255,255,.04)' : '#fff';
  var cardBdr = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.08)';

  var html = '';
  colKeys.forEach(function(ces) {
    var items = columns[ces] || [];
    var firstName = ces === 'Unassigned' ? 'Unassigned' : ces.split(' ')[0];
    var amItems = items.filter(function(d) { return !d.isPM; });
    var pmItems = items.filter(function(d) { return d.isPM; });
    var totalWeight = items.reduce(function(s, d) { return s + d.weight; }, 0);
    var headerColor = ces === 'Unassigned' ? '#ef4444' : '#60a5fa';

    html += '<div style="background:' + colBg + ';border:1px solid ' + colBdr + ';border-radius:12px;padding:16px;min-height:300px">';
    // Header
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">';
    html += '<div><span style="font-size:18px;font-weight:700;color:' + headerColor + '">' + firstName + '</span>';
    html += '<span style="margin-left:8px;font-size:13px;color:#71717a">' + items.length + ' deliveries</span></div>';
    html += '<div style="font-size:12px;color:#71717a;font-weight:600">Load: ' + totalWeight.toFixed(1) + '</div>';
    html += '</div>';

    // AM section
    html += '<div style="font-size:11px;font-weight:600;color:#3b82f6;text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid rgba(59,130,246,.15)">Morning — ' + amItems.length + '</div>';
    amItems.forEach(function(d) {
      var tags = '';
      if (d.isEnt) tags += '<span style="font-size:10px;background:rgba(245,158,11,.15);color:#f59e0b;padding:1px 6px;border-radius:10px;font-weight:600">B2B</span> ';
      if (d.hasTI) tags += '<span style="font-size:10px;background:rgba(168,85,247,.15);color:#a855f7;padding:1px 6px;border-radius:10px;font-weight:600">TI</span> ';
      if (d.delivered) tags += '<span style="font-size:10px;background:rgba(34,197,94,.15);color:#22c55e;padding:1px 6px;border-radius:10px;font-weight:600">Done</span> ';
      html += '<div class="dispatch-card" data-rn="' + d.rn + '" onclick="REASSIGN(\'' + d.rn + '\')" style="background:' + cardBg + ';border:1px solid ' + cardBdr + ';border-radius:8px;padding:10px 12px;margin-bottom:6px;cursor:pointer;transition:all .15s">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:600;font-size:13px">' + d.time + ' — ' + d.name + '</span>' + tags + '</div>';
      html += '<div style="font-size:11px;color:#71717a;margin-top:2px">' + d.model + ' · ' + d.rn + '</div>';
      html += '</div>';
    });

    // PM section
    html += '<div style="font-size:11px;font-weight:600;color:#f59e0b;text-transform:uppercase;letter-spacing:.5px;margin:16px 0 8px;padding-bottom:4px;border-bottom:1px solid rgba(245,158,11,.15)">Afternoon — ' + pmItems.length + '</div>';
    pmItems.forEach(function(d) {
      var tags = '';
      if (d.isEnt) tags += '<span style="font-size:10px;background:rgba(245,158,11,.15);color:#f59e0b;padding:1px 6px;border-radius:10px;font-weight:600">B2B</span> ';
      if (d.hasTI) tags += '<span style="font-size:10px;background:rgba(168,85,247,.15);color:#a855f7;padding:1px 6px;border-radius:10px;font-weight:600">TI</span> ';
      if (d.delivered) tags += '<span style="font-size:10px;background:rgba(34,197,94,.15);color:#22c55e;padding:1px 6px;border-radius:10px;font-weight:600">Done</span> ';
      html += '<div class="dispatch-card" data-rn="' + d.rn + '" onclick="REASSIGN(\'' + d.rn + '\')" style="background:' + cardBg + ';border:1px solid ' + cardBdr + ';border-radius:8px;padding:10px 12px;margin-bottom:6px;cursor:pointer;transition:all .15s">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center"><span style="font-weight:600;font-size:13px">' + d.time + ' — ' + d.name + '</span>' + tags + '</div>';
      html += '<div style="font-size:11px;color:#71717a;margin-top:2px">' + d.model + ' · ' + d.rn + '</div>';
      html += '</div>';
    });

    html += '</div>';
  });
  board.innerHTML = html;
}

// Click a card → pick new CES
function REASSIGN(rn) {
  var d = _dispatchData.find(function(x) { return x.rn === rn; });
  if (!d) return;
  var isDark = !document.getElementById('lightThemeCSS');

  var modal = document.createElement('div');
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,.5);z-index:200;display:flex;align-items:center;justify-content:center';
  var box = document.createElement('div');
  box.style.cssText = 'background:' + (isDark ? '#1a1a1a' : '#fff') + ';border-radius:12px;padding:24px;min-width:300px;border:1px solid ' + (isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)') + ';box-shadow:0 12px 40px rgba(0,0,0,.3);color:inherit';
  box.innerHTML = '<div style="font-size:16px;font-weight:600;margin-bottom:4px">' + d.name + '</div>'
    + '<div style="font-size:12px;color:#71717a;margin-bottom:16px">' + d.rn + ' · ' + d.model + ' · ' + d.time + '</div>'
    + '<div style="font-size:13px;font-weight:600;color:#71717a;margin-bottom:8px">Assign to:</div>';

  CES.forEach(function(c) {
    var firstName = c.split(' ')[0];
    var isCurrent = d.host && c.toLowerCase().indexOf(d.host.split(' ')[0].toLowerCase()) >= 0;
    var btn = document.createElement('button');
    btn.textContent = firstName + (isCurrent ? ' (current)' : '');
    btn.style.cssText = 'display:block;width:100%;padding:10px;margin-bottom:6px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;border:1px solid ' + (isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)') + ';background:' + (isCurrent ? 'rgba(59,130,246,.1)' : isDark ? 'rgba(255,255,255,.03)' : '#f8f9fa') + ';color:' + (isCurrent ? '#3b82f6' : 'inherit');
    btn.onclick = function() {
      d.host = c.split(' ')[0];
      modal.remove();
      RENDERDISPATCH();
    };
    box.appendChild(btn);
  });

  var cancel = document.createElement('button');
  cancel.textContent = 'Cancel';
  cancel.style.cssText = 'display:block;width:100%;padding:8px;margin-top:8px;border-radius:8px;font-size:12px;cursor:pointer;font-family:inherit;border:1px solid ' + (isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)') + ';background:none;color:#71717a';
  cancel.onclick = function() { modal.remove(); };
  box.appendChild(cancel);
  modal.appendChild(box);
  modal.onclick = function(e) { if (e.target === modal) modal.remove(); };
  document.body.appendChild(modal);
}

function RUNDISPATCH(mode) {
  if (mode === 'balance') {
    var data = _dispatchData || [];
    var cesLoad = {};
    CES.forEach(function(c) { cesLoad[c] = 0; });

    // Sort by weight descending for better distribution
    var sorted = data.slice().sort(function(a, b) { return b.weight - a.weight; });
    sorted.forEach(function(d) {
      // Assign to CES with lowest TOTAL load
      var minCES = CES[0], minLoad = Infinity;
      CES.forEach(function(c) {
        if (cesLoad[c] < minLoad) { minLoad = cesLoad[c]; minCES = c; }
      });
      d.host = minCES.split(' ')[0];
      cesLoad[minCES] += d.weight;
    });
    RENDERDISPATCH();
  }
}

function SAVEDISPATCH() {
  var btn = document.getElementById('dispatchSaveBtn');
  if (!btn) return;
  var data = _dispatchData || [];
  if (!data.length) return;

  btn.textContent = 'Saving...';
  btn.disabled = true;

  var dp = document.getElementById('dispatchDate');
  var ds = dp ? dp.value : '';

  fetch(SERVER + '/api/config').then(function(r) { return r.json(); }).then(function(cfg) {
    var cesUserMap = {};
    (cfg.hub && cfg.hub.ces || []).forEach(function(c) {
      cesUserMap[c.name.split(' ')[0]] = c.username;
    });

    // Group by host → vehicleMapIds
    var hostGroups = {};
    data.forEach(function(d) {
      if (!d.host || !d.vehicleMapId) return;
      var username = cesUserMap[d.host] || d.host;
      if (!hostGroups[username]) hostGroups[username] = [];
      hostGroups[username].push(d.vehicleMapId);
    });

    var promises = Object.keys(hostGroups).map(function(username) {
      return fetch(SERVER + '/api/planner/assign-host', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trtId: CFG.trtId,
          date: ds,
          hostsToAdd: [username],
          hostsToRemove: [],
          vehicleMapIds: hostGroups[username]
        })
      }).then(function(r) {
        return { username: username, ok: r.ok, status: r.status, count: hostGroups[username].length };
      }).catch(function() { return { username: username, ok: false, count: 0 }; });
    });

    Promise.all(promises).then(function(results) {
      var totalOk = results.filter(function(r) { return r.ok; }).reduce(function(s, r) { return s + r.count; }, 0);
      var fail = results.filter(function(r) { return !r.ok; });
      if (fail.length === 0) {
        btn.textContent = totalOk + ' assigned!';
        btn.style.background = 'rgba(34,197,94,.2)';
        btn.style.color = '#22c55e';
      } else if (fail[0].status === 401) {
        btn.textContent = 'OS token expired';
        btn.style.color = '#ef4444';
      } else {
        btn.textContent = totalOk + ' OK, ' + fail.length + ' failed';
        btn.style.background = 'rgba(245,158,11,.2)';
        btn.style.color = '#f59e0b';
      }
      setTimeout(function() {
        btn.textContent = 'Save to DRO';
        btn.style.background = 'rgba(34,197,94,.12)';
        btn.style.color = '#22c55e';
        btn.disabled = false;
      }, 3000);
    });
  });
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
   VRS: Vehicle Readiness Pipeline
   ============================================ */
function LOADVRS() {
  var container = document.getElementById('vrsContent');
  container.innerHTML = '<div style="text-align:center;padding:30px;color:#71717a">Loading vehicle readiness from COGS...</div>';

  var h = {"Authorization": AUTH.token, "Content-Type": "application/json"};
  var INTREPID = SERVER + '/api/intrepid/cogs/api/cogs';

  // Fetch next 7 days of appointments with COG info
  var allVehicles = [];
  var promises = [];
  for (var i = -1; i < 7; i++) {
    var d = new Date(Date.now() + i * 864e5);
    if (d.getDay() === 0) continue;
    var ds = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    (function(dateStr) {
      promises.push(
        fetch(INTREPID + '/getTssAppointmentsByDate?trtId=' + CFG.trtId + '&date=' + dateStr + '&searchQuery=', {headers: h})
        .then(function(r) { return r.json(); })
        .then(function(data) {
          (data || []).forEach(function(appt) {
            var cogStatus = (appt.cogInfo && appt.cogInfo.vehicleCogStatusName) || 'Unknown';
            // Avoid duplicates by VIN
            var exists = allVehicles.some(function(v) { return v.vin === appt.vin; });
            if (!exists) {
              allVehicles.push({
                vin: appt.vin || '',
                rn: appt.referenceNumber || '',
                model: appt.model === 'my' ? 'Model Y' : appt.model === 'm3' ? 'Model 3' : appt.model || '',
                status: cogStatus,
                statusId: appt.cogInfo ? appt.cogInfo.vehicleCogStatusId : 0,
                date: dateStr,
                time: appt.startDateTime ? new Date(appt.startDateTime).toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'}) : '',
                bay: (appt.cogInfo && appt.cogInfo.bayLocation) || '',
                isB2b: appt.isB2b || false,
                host: (appt.cogInfo && appt.cogInfo.createdBy) || ''
              });
            }
          });
        }).catch(function() {})
      );
    })(ds);
  }

  Promise.all(promises).then(function() {
    if (!allVehicles.length) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:#71717a">No vehicle data from COGS.</div>';
      return;
    }

    // Group by status
    var statusGroups = {};
    allVehicles.forEach(function(v) {
      if (!statusGroups[v.status]) statusGroups[v.status] = [];
      statusGroups[v.status].push(v);
    });

    // Define pipeline order and colors
    var pipeline = [
      { name: 'Too Dirty to Inspect', color: '#71717a', icon: '🚿' },
      { name: 'Receiving Inspection Pending', color: '#f59e0b', icon: '🔍' },
      { name: 'PDI Pending', color: '#3b82f6', icon: '🔧' },
      { name: 'In Wash', color: '#06b6d4', icon: '🚿' },
      { name: 'Charging', color: '#a855f7', icon: '⚡' },
      { name: 'Ready for Delivery', color: '#22c55e', icon: '✅' },
      { name: 'Finished Goods', color: '#22c55e', icon: '✅' }
    ];

    var cardStyle = 'text-align:center;padding:16px;border-radius:12px;border:1px solid rgba(255,255,255,.06);backdrop-filter:blur(12px);background:rgba(255,255,255,.04);cursor:pointer;transition:transform .15s';

    var html = '';

    // Pipeline cards
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:12px;margin-bottom:28px">';
    pipeline.forEach(function(p) {
      var count = (statusGroups[p.name] || []).length;
      html += '<div style="' + cardStyle + '" onclick="SHOWVRSSTATUS(\'' + p.name.replace(/'/g, "\\'") + '\')" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'\'">';
      html += '<div style="font-size:28px;font-weight:700;color:' + p.color + '">' + count + '</div>';
      html += '<div style="font-size:11px;color:#71717a;margin-top:4px;line-height:1.3">' + p.name + '</div>';
      html += '</div>';
    });
    // Other statuses
    Object.keys(statusGroups).forEach(function(s) {
      if (!pipeline.some(function(p) { return p.name === s; })) {
        var count = statusGroups[s].length;
        html += '<div style="' + cardStyle + '" onclick="SHOWVRSSTATUS(\'' + s.replace(/'/g, "\\'") + '\')">';
        html += '<div style="font-size:28px;font-weight:700;color:#71717a">' + count + '</div>';
        html += '<div style="font-size:11px;color:#71717a;margin-top:4px">' + s + '</div>';
        html += '</div>';
      }
    });
    html += '</div>';

    // Pipeline bar
    var total = allVehicles.length;
    html += '<div style="margin-bottom:28px">';
    html += '<div style="font-size:14px;font-weight:600;margin-bottom:8px">Pipeline (' + total + ' vehicles)</div>';
    html += '<div style="display:flex;height:28px;border-radius:6px;overflow:hidden;font-size:11px;font-weight:600">';
    pipeline.forEach(function(p) {
      var count = (statusGroups[p.name] || []).length;
      if (count > 0) {
        html += '<div style="background:' + p.color + ';flex:' + count + ';display:flex;align-items:center;justify-content:center;color:#fff;min-width:20px" title="' + p.name + ': ' + count + '">' + count + '</div>';
      }
    });
    html += '</div>';
    html += '<div style="display:flex;gap:12px;margin-top:8px;font-size:11px;color:#71717a;flex-wrap:wrap">';
    pipeline.forEach(function(p) {
      var count = (statusGroups[p.name] || []).length;
      if (count > 0) html += '<span><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:' + p.color + ';margin-right:4px"></span>' + p.name + ' (' + count + ')</span>';
    });
    html += '</div></div>';

    // Vehicle table
    html += '<div style="font-size:14px;font-weight:600;margin-bottom:8px">All Vehicles</div>';
    html += '<table style="width:100%;border-collapse:collapse">';
    html += '<thead><tr>';
    html += '<th style="text-align:left;padding:10px 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">VIN</th>';
    html += '<th style="text-align:left;padding:10px 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">RN</th>';
    html += '<th style="text-align:left;padding:10px 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">Model</th>';
    html += '<th style="text-align:left;padding:10px 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">Status</th>';
    html += '<th style="text-align:left;padding:10px 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">Appt</th>';
    html += '<th style="text-align:left;padding:10px 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">Bay</th>';
    html += '</tr></thead><tbody>';

    allVehicles.sort(function(a, b) { return (a.statusId || 0) - (b.statusId || 0); });
    allVehicles.forEach(function(v) {
      var statusColor = '#71717a';
      pipeline.forEach(function(p) { if (p.name === v.status) statusColor = p.color; });
      html += '<tr>';
      html += '<td style="padding:8px 12px;font-family:monospace;font-size:12px;border-bottom:1px solid rgba(128,128,128,.06)">' + v.vin + '</td>';
      html += '<td style="padding:8px 12px;border-bottom:1px solid rgba(128,128,128,.06)"><a href="https://dro.tesla.com/advisor?sidepanel_fullscreen=yes&rn=' + v.rn + '" target="_blank" style="color:#60a5fa;text-decoration:none">' + v.rn + '</a></td>';
      html += '<td style="padding:8px 12px;border-bottom:1px solid rgba(128,128,128,.06)">' + v.model + '</td>';
      html += '<td style="padding:8px 12px;border-bottom:1px solid rgba(128,128,128,.06);color:' + statusColor + ';font-weight:600">' + v.status + '</td>';
      html += '<td style="padding:8px 12px;border-bottom:1px solid rgba(128,128,128,.06)">' + v.date + ' ' + v.time + '</td>';
      html += '<td style="padding:8px 12px;border-bottom:1px solid rgba(128,128,128,.06)">' + (v.bay || '-') + '</td>';
      html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  });
}

function SHOWVRSSTATUS(status) {
  // Scroll to and highlight vehicles with this status in the table
  var rows = document.querySelectorAll('#vrsContent tbody tr');
  rows.forEach(function(r) {
    var statusCell = r.cells[3];
    if (statusCell && statusCell.textContent === status) {
      r.style.background = 'rgba(59,130,246,.1)';
    } else {
      r.style.background = '';
    }
  });
}

/* ============================================
   VRS: SV & Holds - Service Visits and Containment Holds
   ============================================ */
function LOADSVHOLDS() {
  var container = document.getElementById('svholdsContent');
  container.innerHTML = '<div style="text-align:center;padding:30px;color:#71717a">Loading...</div>';

  var h = {"Authorization": AUTH.token, "Content-Type": "application/json", "userid": AUTH.userId};
  // Get next 7 days of deliveries and filter for SV/CH
  var promises = [];
  var allItems = [];
  for (var i = 0; i < 7; i++) {
    var d = new Date(Date.now() + i * 864e5);
    var ds = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    (function(dateStr) {
      promises.push(
        fetch(BASE + "/advisor/Dashboard?isSidePanelFullScreen=true", {
          method: "POST", headers: h,
          body: JSON.stringify({condition:"and",rules:[{condition:"and",ReferenceNumbers:[],Countries:[],DeliveryDate:dateStr,TrtId:String(CFG.trtId)}],Skip:0,Take:200,SortOrder:[],SelectedColumns:[]})
        }).then(function(r) { return r.json(); }).then(function(j) {
          ((j.Data && j.Data.Dashboard) || []).forEach(function(a) {
            if (a.IsContainmentHold || a.IsRepairOrderHold || a.ServiceVisitGate === 'Incomplete') {
              allItems.push({
                name: a.CustomerName,
                rn: a.ReferenceNumber,
                model: a.VehicleModel,
                vin: a.Vin || '',
                stage: a.VehicleStage || '',
                sv: a.ServiceVisitGate === 'Incomplete' ? 'Active SV' : '',
                ch: a.IsContainmentHold ? 'Containment Hold' : '',
                hold: a.IsRepairOrderHold ? 'Repair Order Hold' : '',
                date: dateStr
              });
            }
          });
        }).catch(function() {})
      );
    })(ds);
  }

  Promise.all(promises).then(function() {
    if (!allItems.length) {
      container.innerHTML = '<div style="text-align:center;padding:40px;color:#22c55e;font-size:16px;font-weight:600">All clear — No active SVs or Holds</div>';
      return;
    }

    var svCount = allItems.filter(function(it) { return it.sv; }).length;
    var chCount = allItems.filter(function(it) { return it.ch || it.hold; }).length;

    var html = '<div style="display:flex;gap:16px;margin-bottom:24px">';
    html += '<div style="padding:16px 24px;border-radius:10px;border:1px solid rgba(245,158,11,.2);background:rgba(245,158,11,.05)"><span style="font-size:24px;font-weight:700;color:#f59e0b">' + svCount + '</span> <span style="color:#71717a;font-size:13px">Active SVs</span></div>';
    html += '<div style="padding:16px 24px;border-radius:10px;border:1px solid rgba(239,68,68,.2);background:rgba(239,68,68,.05)"><span style="font-size:24px;font-weight:700;color:#ef4444">' + chCount + '</span> <span style="color:#71717a;font-size:13px">Holds</span></div>';
    html += '</div>';

    html += '<table style="width:100%;border-collapse:collapse">';
    html += '<thead><tr><th style="text-align:left;padding:10px 14px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">Customer</th>';
    html += '<th style="text-align:left;padding:10px 14px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">RN</th>';
    html += '<th style="text-align:left;padding:10px 14px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">Model</th>';
    html += '<th style="text-align:left;padding:10px 14px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">Stage</th>';
    html += '<th style="text-align:left;padding:10px 14px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">Issue</th>';
    html += '</tr></thead><tbody>';

    allItems.forEach(function(it) {
      var issue = [it.sv, it.ch, it.hold].filter(function(v) { return v; }).join(', ');
      var issueColor = it.ch || it.hold ? '#ef4444' : '#f59e0b';
      html += '<tr>';
      html += '<td style="padding:10px 14px;font-weight:600;border-bottom:1px solid rgba(128,128,128,.06)">' + it.name + '</td>';
      html += '<td style="padding:10px 14px;border-bottom:1px solid rgba(128,128,128,.06)"><a href="https://dro.tesla.com/advisor?sidepanel_fullscreen=yes&rn=' + it.rn + '" target="_blank" style="color:#60a5fa;text-decoration:none">' + it.rn + '</a></td>';
      html += '<td style="padding:10px 14px;border-bottom:1px solid rgba(128,128,128,.06)">' + it.model + '</td>';
      html += '<td style="padding:10px 14px;border-bottom:1px solid rgba(128,128,128,.06)">' + it.stage + '</td>';
      html += '<td style="padding:10px 14px;border-bottom:1px solid rgba(128,128,128,.06);color:' + issueColor + ';font-weight:600">' + issue + '</td>';
      html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  });
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
    var fg = data.filter(function(d) { var vs = String(d.VehicleStage || ''); return vs === 'Finished Goods' || vs.indexOf('Arrived') >= 0; }).length;
    var notReady = data.filter(function(d) { var vs = String(d.VehicleStage || ''); return d.CustomerDeliveryStatus !== 'Delivered' && d.CustomerDeliveryStatus !== 'Complete' && vs !== 'Finished Goods' && vs.indexOf('Arrived') < 0; }).length;

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

  // 1b. Load TOMORROW's deliveries
  var tmrw = new Date(Date.now() + 864e5);
  var tmrwDate = tmrw.getFullYear() + '-' + String(tmrw.getMonth()+1).padStart(2,'0') + '-' + String(tmrw.getDate()).padStart(2,'0');
  fetch(BASE + "/deliveryops/Customers/Dashboard", {
    method: "POST", headers: h,
    body: JSON.stringify({fromDeliveryDate: tmrwDate, trtId: CFG.trtId, customerHasNoHost: false, skip: 0, take: 200, fromTime: "00:00", toTime: "23:59", countryCode: CFG.cc, onlyMyLocation: true, sort: {}, stage: [], status: [], deliveryType: [], paperwork: [], customerDeliveryStatus: [], inboundStatus: [], VehicleTypes: [], pdcFilter: [], dmvDocumentStages: []})
  }).then(function(r) { return r.json(); }).then(function(dash) {
    var data = dash.Data || [];
    var total = data.length;
    var fg = data.filter(function(d) { var vs = String(d.VehicleStage || ''); return vs === 'Finished Goods' || vs.indexOf('Arrived') >= 0; }).length;
    var notReady = total - fg;

    var el = document.getElementById("dashTmrwDeliveries");
    if (el) el.textContent = total;
    var sub = document.getElementById("dashTmrwSub");
    if (sub) sub.textContent = tmrw.toLocaleDateString('en-US', {weekday:'short', month:'short', day:'numeric'});
    var fgEl = document.getElementById("dashTmrwFG");
    if (fgEl) fgEl.textContent = fg;
    var nrEl = document.getElementById("dashTmrwNR");
    if (nrEl) nrEl.textContent = notReady;

    // Tomorrow schedule
    var schedHtml = '';
    data.sort(function(a, b) { return (a.ScheduledDeliveryStartDateString || '').localeCompare(b.ScheduledDeliveryStartDateString || ''); });
    data.forEach(function(d) {
      var t = '?';
      var tm = (d.ScheduledDeliveryStartDateString || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (tm) { var hr = parseInt(tm[1]); if (tm[3].toUpperCase() === 'PM' && hr < 12) hr += 12; if (tm[3].toUpperCase() === 'AM' && hr === 12) hr = 0; t = String(hr).padStart(2, '0') + ':' + tm[2]; }
      schedHtml += '<div class="dash-schedule-row"><div class="dash-schedule-time">' + t + '</div><div class="dash-schedule-name">' + (d.CustomerName || '') + '</div><div class="dash-schedule-model">' + (d.VehicleModel || '') + '</div></div>';
    });
    var tmrwSched = document.getElementById("dashTmrwSchedule");
    if (tmrwSched) tmrwSched.innerHTML = schedHtml || '<div style="color:#52525b;padding:20px;text-align:center">No deliveries tomorrow</div>';
  }).catch(function() {});

  // 2. Load arrivals
  fetch(SERVER + "/api/bi/arrivals").then(function(r) { return r.json(); }).then(function(j) {
    if (j.error) return;
    var chart = document.getElementById("dashArrChart");
    var dates = j.data ? j.data.dates : [];
    var arrived = j.data ? j.data.arrived : [];
    var confident = j.data ? j.data.confident : [];
    var preliminary = j.data ? j.data.preliminary : [];

    // Filter to current calendar week (Mon-Sun)
    var now = new Date();
    var dayOfWeek = now.getDay(); // 0=Sun,1=Mon..6=Sat
    var diffToMon = (dayOfWeek === 0) ? 6 : dayOfWeek - 1;
    var monDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMon);
    var sunDate = new Date(monDate.getFullYear(), monDate.getMonth(), monDate.getDate() + 6);
    var monTs = monDate.getTime();
    var sunTs = sunDate.getTime();

    // Build a full Mon-Sun map with zeroes, then overlay CSV data
    var weekMap = {};
    for (var wd = 0; wd < 7; wd++) {
      var dd = new Date(monDate.getFullYear(), monDate.getMonth(), monDate.getDate() + wd);
      var key = ('0' + dd.getDate()).slice(-2) + '/' + ('0' + (dd.getMonth()+1)).slice(-2);
      weekMap[key] = { a: 0, c: 0, p: 0 };
    }
    dates.forEach(function(d, i) {
      var parts = d.split('/');
      if (parts.length === 2) {
        var dateObj = new Date(now.getFullYear(), parseInt(parts[1])-1, parseInt(parts[0]));
        var ts = dateObj.getTime();
        if (ts >= monTs && ts <= sunTs) {
          weekMap[d] = { a: arrived[i] || 0, c: confident[i] || 0, p: preliminary[i] || 0 };
        }
      }
    });
    var weekDates = Object.keys(weekMap);
    var weekArr = [], weekConf = [], weekPrel = [];
    weekDates.forEach(function(k) {
      weekArr.push(weekMap[k].a);
      weekConf.push(weekMap[k].c);
      weekPrel.push(weekMap[k].p);
    });

    var maxVal = 1;
    weekDates.forEach(function(_, i) {
      var total = (weekArr[i] || 0) + (weekConf[i] || 0) + (weekPrel[i] || 0);
      if (total > maxVal) maxVal = total;
    });
    var html = '';
    weekDates.forEach(function(d, i) {
      var a = weekArr[i] || 0, c = weekConf[i] || 0, p = weekPrel[i] || 0;
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

  // 6. Load Due Bills count
  fetch(SERVER + '/api/duebills').then(function(r) { return r.json(); }).then(function(bills) {
    var open = bills.filter(function(b) { return b.status !== 'Resolved'; }).length;
    var el = document.getElementById("dashDueBills");
    if (el) el.textContent = open;
    var sub = document.getElementById("dashDueBillsSub");
    if (sub) sub.textContent = open > 0 ? open + ' open' : 'all clear';
  }).catch(function() {});

  // 7. Load SV & Holds counts (requires DRO auth)
  if (AUTH.token) {
    var svH = {"Authorization": AUTH.token, "Content-Type": "application/json", "userid": AUTH.userId};
    var svPromises = [];
    var svCount = 0, chCount = 0;
    for (var si = 0; si < 7; si++) {
      var sd = new Date(Date.now() + si * 864e5);
      var sds = sd.getFullYear() + '-' + String(sd.getMonth()+1).padStart(2,'0') + '-' + String(sd.getDate()).padStart(2,'0');
      (function(dateStr) {
        svPromises.push(
          fetch(BASE + "/advisor/Dashboard?isSidePanelFullScreen=true", {
            method: "POST", headers: svH,
            body: JSON.stringify({condition:"and",rules:[{condition:"and",ReferenceNumbers:[],Countries:[],DeliveryDate:dateStr,TrtId:String(CFG.trtId)}],Skip:0,Take:200,SortOrder:[],SelectedColumns:[]})
          }).then(function(r) { return r.json(); }).then(function(j) {
            ((j.Data && j.Data.Dashboard) || []).forEach(function(a) {
              if (a.ServiceVisitGate === 'Incomplete') svCount++;
              if (a.IsContainmentHold || a.IsRepairOrderHold) chCount++;
            });
          }).catch(function() {})
        );
      })(sds);
    }
    Promise.all(svPromises).then(function() {
      var svEl = document.getElementById("dashSV");
      if (svEl) {
        svEl.textContent = svCount;
        document.getElementById("dashSVSub").textContent = svCount > 0 ? svCount + ' vehicle' + (svCount > 1 ? 's' : '') : 'all clear';
      }
      var chEl = document.getElementById("dashCH");
      if (chEl) {
        chEl.textContent = chCount;
        document.getElementById("dashCHSub").textContent = chCount > 0 ? chCount + ' vehicle' + (chCount > 1 ? 's' : '') : 'all clear';
      }
    });
  } else {
    // Not authenticated — show dash
    var svEl = document.getElementById("dashSV"); if (svEl) { svEl.textContent = '-'; document.getElementById("dashSVSub").textContent = 'login required'; }
    var chEl = document.getElementById("dashCH"); if (chEl) { chEl.textContent = '-'; document.getElementById("dashCHSub").textContent = 'login required'; }
  }
}

/* ============================================
   CALENDAR: Show detail panel for a time slot
   ============================================ */
var _calAllDays = [];

function SHOWCALDETAIL(dayIdx, time, filter) {
  var panel = document.getElementById('calDetailOverlay');
  var title = document.getElementById('calDetailTitle');
  var body = document.getElementById('calDetailBody');
  if (!panel || !_calAllDays[dayIdx]) return;

  var day = _calAllDays[dayIdx];
  var items = day.slots[time] || [];
  
  // Filter by status if specified
  if (filter === 'scheduled') {
    items = items.filter(function(e) { return e.status !== 'Confirmed' && e.status !== 'Complete'; });
  } else if (filter === 'confirmed') {
    items = items.filter(function(e) { return e.status === 'Confirmed' || e.status === 'Complete'; });
  }
  if (!items.length) return;

  var filterLabel = filter === 'scheduled' ? ' · Scheduled' : filter === 'confirmed' ? ' · Confirmed' : '';
  title.innerHTML = '<span style="font-size:20px;font-weight:700">' + day.label + '</span> <span style="font-size:20px;color:#71717a;font-weight:400">— ' + time + '</span>' + (filterLabel ? '<span style="font-size:14px;color:' + (filter === 'scheduled' ? '#3b82f6' : '#22c55e') + ';font-weight:600;margin-left:8px">' + filterLabel + '</span>' : '');
  panel.style.display = 'flex';
  body.innerHTML = '<div style="text-align:center;padding:40px;color:#71717a">Loading details...</div>';

  // Fetch notes + enrich with Customer Dashboard (location-filtered) + Advisor (details)
  var rns = items.map(function(it) { return it.rn; });
  var notesP = fetch(SERVER + '/api/notes').then(function(r) { return r.json(); }).catch(function() { return {}; });
  
  // Customer Dashboard = source of truth for TradeIn, Host
  var dateStr = day.date || '';
  var custP = fetch(SERVER + '/api/dro/deliveryops/Customers/Dashboard', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({fromDeliveryDate: dateStr, trtId: CFG.trtId, customerHasNoHost: false, skip: 0, take: 200, fromTime: '00:00', toTime: '23:59', countryCode: CFG.cc, onlyMyLocation: true, sort: {}, stage: [], status: [], deliveryType: [], paperwork: [], customerDeliveryStatus: [], inboundStatus: [], VehicleTypes: [], pdcFilter: [], dmvDocumentStages: []})
  }).then(function(r) { return r.json(); }).catch(function() { return {}; });

  // Advisor = vehicle details, readiness
  var advP = fetch(SERVER + '/api/dro/advisor/Dashboard?isSidePanelFullScreen=true', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({condition:'and',rules:[{condition:'and',ReferenceNumbers:rns,Countries:[],TrtId:String(CFG.trtId)}],Skip:0,Take:50,SortOrder:[],SelectedColumns:[]})
  }).then(function(r) { return r.json(); }).catch(function() { return {}; });

  Promise.all([notesP, custP, advP]).then(function(results) {
    var notes = results[0] || {};
    var custMap = {};
    (results[1].Data || []).forEach(function(c) { custMap[c.ReferenceNumber] = c; });
    var advMap = {};
    ((results[2].Data && results[2].Data.Dashboard) || []).forEach(function(a) { advMap[a.ReferenceNumber] = a; });

    var isDark = !document.getElementById('lightThemeCSS');
    var html = '';

    items.forEach(function(it, idx) {
      var a = advMap[it.rn] || {};
      var c2 = custMap[it.rn] || {};
      var noteData = notes[it.rn];
      var noteHistory = [];
      if (typeof noteData === 'string' && noteData) noteHistory = [{text: noteData, date: ''}];
      else if (Array.isArray(noteData)) noteHistory = noteData;

      var regOk = !!(a.HasPlates || (a.LicensePlate && a.LicensePlate.indexOf('-') >= 0));
      var payOk = a.AmountDueActionStatus === 'Yes' || a.FinalPaymentGate === 'Complete';
      var insOk = !!(a.InsuranceGate === 'Complete' || a.InsuranceGate === 'Verified');
      var hold = !!(c2.IsContainmentHold || c2.IsRepairOrderHold || a.ServiceVisitGate === 'Incomplete');
      var vs = String(a.VehicleStage || '');
      var otg = vs === 'Finished Goods' || vs.indexOf('Arrived') >= 0 || vs.indexOf('Deliverable') >= 0;
      var hasTI = c2.TradeInActionStatus === 'COMPLETE_TRADE_IN';
      var isEnt = !!(c2.IsEnterpriseOrder || a.IsEnterpriseOrder);
      var delivered = !!a.IsDelivered;
      var allReady = payOk && regOk && otg && !hold;

      var statusDot = it.status === 'Confirmed' || it.status === 'Complete' ? '#22c55e' : '#3b82f6';
      var statusLabel = it.status || 'Scheduled';
      if (delivered) { statusDot = '#71717a'; statusLabel = 'Delivered'; }

      var cardBg, cardBdr, leftBar;
      if (delivered) { cardBg = isDark ? 'rgba(34,197,94,.04)' : '#f0fdf4'; cardBdr = isDark ? 'rgba(34,197,94,.1)' : 'rgba(34,197,94,.12)'; leftBar = '#22c55e'; }
      else if (hold) { cardBg = isDark ? 'rgba(239,68,68,.06)' : '#fef2f2'; cardBdr = isDark ? 'rgba(239,68,68,.1)' : 'rgba(239,68,68,.12)'; leftBar = '#ef4444'; }
      else if (allReady) { cardBg = isDark ? 'rgba(34,197,94,.03)' : '#fafffe'; cardBdr = isDark ? 'rgba(34,197,94,.06)' : 'rgba(34,197,94,.08)'; leftBar = '#22c55e'; }
      else { cardBg = isDark ? 'rgba(255,255,255,.03)' : '#fafafa'; cardBdr = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'; leftBar = '#f59e0b'; }

      html += '<div style="background:' + cardBg + ';border:1px solid ' + cardBdr + ';border-left:4px solid ' + leftBar + ';border-radius:10px;padding:16px 20px;margin-bottom:12px">';

      // Row 1: Name + Tags + Status
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;flex-wrap:wrap">';
      html += '<span style="font-size:16px;font-weight:700">' + it.name + '</span>';
      if (isEnt) html += '<span style="font-size:10px;background:rgba(245,158,11,.15);color:#f59e0b;padding:2px 8px;border-radius:10px;font-weight:600">B2B</span>';
      if (hasTI) html += '<span style="font-size:10px;background:rgba(168,85,247,.15);color:#a855f7;padding:2px 8px;border-radius:10px;font-weight:600">Trade-In</span>';
      if (hold) html += '<span style="font-size:10px;background:rgba(239,68,68,.15);color:#ef4444;padding:2px 8px;border-radius:10px;font-weight:700">HOLD</span>';
      html += '<div style="flex:1"></div>';
      html += '<span style="display:flex;align-items:center;gap:4px;font-size:12px;font-weight:600;color:' + statusDot + '"><span style="width:8px;height:8px;border-radius:50%;background:' + statusDot + '"></span>' + statusLabel + '</span>';
      html += '</div>';

      // Row 2: Info with VIN
      html += '<div style="display:flex;gap:24px;font-size:13px;margin-bottom:12px;flex-wrap:wrap">';
      html += '<div><span style="color:#71717a;font-size:10px;text-transform:uppercase">RN</span><br><a href="https://dro.tesla.com/advisor?sidepanel_fullscreen=yes&rn=' + it.rn + '" target="_blank" style="color:#60a5fa;text-decoration:none;font-weight:600">' + it.rn + '</a></div>';
      html += '<div><span style="color:#71717a;font-size:10px;text-transform:uppercase">Model</span><br><span style="font-weight:600">' + it.model + '</span></div>';
      html += '<div><span style="color:#71717a;font-size:10px;text-transform:uppercase">VIN</span><br><span style="font-family:monospace;font-size:12px;letter-spacing:.5px">' + (it.vin || a.Vin || '-') + '</span></div>';
      html += '<div><span style="color:#71717a;font-size:10px;text-transform:uppercase">Vehicle</span><br><span style="font-weight:600;color:' + (otg ? '#22c55e' : vs.indexOf('Transit') >= 0 ? '#f59e0b' : '#71717a') + '">' + (vs || '-') + '</span></div>';
      html += '</div>';

      // Row 3: Readiness checklist
      var ckG = isDark ? 'rgba(34,197,94,.1)' : 'rgba(34,197,94,.06)';
      var ckR = isDark ? 'rgba(239,68,68,.08)' : 'rgba(239,68,68,.04)';
      html += '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap">';
      html += '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;background:' + (payOk?ckG:ckR) + ';color:' + (payOk?'#22c55e':'#ef4444') + '">' + (payOk?'\u2713':'\u2717') + ' Payment</span>';
      html += '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;background:' + (regOk?ckG:ckR) + ';color:' + (regOk?'#22c55e':'#ef4444') + '">' + (regOk?'\u2713':'\u2717') + ' Registration</span>';
      html += '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;background:' + (insOk?ckG:ckR) + ';color:' + (insOk?'#22c55e':'#ef4444') + '">' + (insOk?'\u2713':'\u2717') + ' Insurance</span>';
      html += '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;background:' + (otg?ckG:ckR) + ';color:' + (otg?'#22c55e':'#f59e0b') + '">' + (otg?'\u2713':'\u2717') + ' OTG</span>';
      html += '<span style="display:inline-flex;align-items:center;gap:4px;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600;background:' + (!hold?ckG:ckR) + ';color:' + (!hold?'#22c55e':'#ef4444') + '">' + (!hold?'\u2713':'\u2717') + ' No Hold</span>';
      html += '</div>';

      // Row 4: Status + Links
      html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">';
      var stOpts = '<option value="Scheduled"' + (statusLabel === 'Scheduled' ? ' selected' : '') + '>\u25CF Scheduled</option><option value="Confirmed"' + (statusLabel === 'Confirmed' ? ' selected' : '') + '>\u25CF Confirmed</option>';
      html += '<select onchange="UPDATESTATUS(\'' + it.rn + '\',this.value)" style="padding:4px 10px;border-radius:6px;border:1px solid rgba(128,128,128,.15);font-size:12px;font-weight:600;font-family:inherit;color:' + statusDot + ';background:transparent;cursor:pointer">' + stOpts + '</select>';
      if (!isEnt) html += '<a href="https://tesla.cee.trustia.ai/admin/folder/folder/?q=' + it.rn + '" target="_blank" style="font-size:11px;color:#22c55e;text-decoration:none;font-weight:600;padding:4px 10px;border:1px solid rgba(34,197,94,.2);border-radius:6px">CEE</a>';
      html += '</div>';

      // Row 5: Notes history
      html += '<div style="border-top:1px solid rgba(128,128,128,.08);padding-top:10px">';
      html += '<div style="font-size:10px;color:#71717a;text-transform:uppercase;font-weight:600;margin-bottom:6px">Notes</div>';
      if (noteHistory.length) {
        noteHistory.forEach(function(n) {
          html += '<div style="padding:3px 0;font-size:12px;color:' + (isDark ? '#a1a1aa' : '#52525b') + '">';
          if (n.date) html += '<span style="color:#71717a;font-size:10px;margin-right:6px">' + new Date(n.date).toLocaleString('fr-FR', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) + '</span>';
          html += n.text + '</div>';
        });
      }
      html += '<div style="display:flex;gap:6px;margin-top:6px">';
      html += '<input type="text" id="noteInput_' + idx + '" placeholder="Ajouter une note..." style="flex:1;padding:6px 10px;border:1px solid rgba(128,128,128,.15);border-radius:6px;font-size:12px;font-family:inherit;color:inherit;background:transparent;outline:none" onkeydown="if(event.key===\'Enter\')ADDNOTE(\'' + it.rn + '\',' + idx + ')">';
      html += '<button onclick="ADDNOTE(\'' + it.rn + '\',' + idx + ')" style="padding:6px 14px;background:rgba(59,130,246,.1);color:#60a5fa;border:1px solid rgba(59,130,246,.2);border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit">Add</button>';
      html += '</div></div>';

      html += '</div>';
    });

    body.innerHTML = html;
  });
}

function SAVENOTE(rn, note) {
  fetch(SERVER + '/api/notes/' + rn, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({note: note})
  }).catch(function() {});
}

function ADDNOTE(rn, idx) {
  var input = document.getElementById('noteInput_' + idx);
  if (!input || !input.value.trim()) return;
  var text = input.value.trim();
  input.value = '';
  fetch(SERVER + '/api/notes/' + rn + '/add', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({text: text})
  }).then(function() {
    // Refresh notes display
    var container = input.parentElement.parentElement;
    var noteDiv = document.createElement('div');
    noteDiv.style.cssText = 'padding:3px 0;font-size:12px;color:#a1a1aa';
    var now = new Date();
    noteDiv.innerHTML = '<span style="color:#71717a;font-size:10px;margin-right:6px">' + now.toLocaleString('fr-FR', {day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) + '</span>' + text;
    container.insertBefore(noteDiv, input.parentElement);
  }).catch(function() {});
}

function UPDATEHOST(rn, host) {
  // TODO: Call DRO API to update host assignment
  // For now, save locally
  console.log('Update host for', rn, '→', host);
  fetch(SERVER + '/api/notes/' + rn, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({note: 'Host: ' + host})
  }).catch(function() {});
}

function UPDATESTATUS(rn, status) {
  // TODO: Call DRO/TSS API to update appointment status
  console.log('Update status for', rn, '→', status);
}

/* ============================================
   DUE BILLS: Track post-delivery defects
   ============================================ */
function LOADDUEBILLS() {
  var container = document.getElementById('duebillsContent');

  fetch(SERVER + '/api/duebills').then(function(r) { return r.json(); }).then(function(bills) {
    var open = bills.filter(function(b) { return b.status === 'Open'; }).length;
    var inProgress = bills.filter(function(b) { return b.status === 'Parts Ordered' || b.status === 'Scheduled'; }).length;
    var resolved = bills.filter(function(b) { return b.status === 'Resolved'; }).length;

    var html = '';

    // Summary + Add button
    html += '<div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">';
    html += '<div style="padding:12px 20px;border-radius:10px;border:1px solid rgba(239,68,68,.2);background:rgba(239,68,68,.05)"><span style="font-size:24px;font-weight:700;color:#ef4444">' + open + '</span> <span style="font-size:13px;color:#71717a">Open</span></div>';
    html += '<div style="padding:12px 20px;border-radius:10px;border:1px solid rgba(245,158,11,.2);background:rgba(245,158,11,.05)"><span style="font-size:24px;font-weight:700;color:#f59e0b">' + inProgress + '</span> <span style="font-size:13px;color:#71717a">In Progress</span></div>';
    html += '<div style="padding:12px 20px;border-radius:10px;border:1px solid rgba(34,197,94,.2);background:rgba(34,197,94,.05)"><span style="font-size:24px;font-weight:700;color:#22c55e">' + resolved + '</span> <span style="font-size:13px;color:#71717a">Resolved</span></div>';
    html += '<div style="flex:1"></div>';
    html += '<button class="bt bt-blue" style="background:rgba(59,130,246,.15);color:#60a5fa;border-color:rgba(59,130,246,.3)" onclick="SHOWADDDUEBILL()">+ New Due Bill</button>';
    html += '</div>';

    // Add form (hidden by default)
    html += '<div id="duebillForm" style="display:none;margin-bottom:24px;padding:20px;border:1px solid rgba(128,128,128,.15);border-radius:12px">';
    html += '<div style="font-size:16px;font-weight:600;margin-bottom:16px">New Due Bill</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:12px">';
    html += '<input id="dbRn" placeholder="RN (ex: RN127...)" style="padding:8px 12px;border:1px solid rgba(128,128,128,.15);border-radius:6px;font-size:13px;font-family:inherit;color:inherit;background:transparent" />';
    html += '<input id="dbCustomer" placeholder="Customer name" style="padding:8px 12px;border:1px solid rgba(128,128,128,.15);border-radius:6px;font-size:13px;font-family:inherit;color:inherit;background:transparent" />';
    html += '<select id="dbType" style="padding:8px 12px;border:1px solid rgba(128,128,128,.15);border-radius:6px;font-size:13px;font-family:inherit;color:inherit;background:transparent"><option value="Cosmetic">Cosmetic</option><option value="Mechanical">Mechanical</option><option value="Missing Part">Missing Part</option><option value="Other">Other</option></select>';
    html += '</div>';
    html += '<input id="dbIssue" placeholder="Issue description" style="width:100%;padding:8px 12px;border:1px solid rgba(128,128,128,.15);border-radius:6px;font-size:13px;font-family:inherit;color:inherit;background:transparent;box-sizing:border-box;margin-bottom:12px" />';
    html += '<div style="display:flex;gap:8px">';
    html += '<button class="bt bt-green" style="background:rgba(34,197,94,.15);color:#22c55e;border-color:rgba(34,197,94,.3)" onclick="SAVEDUEBILL()">Save</button>';
    html += '<button class="bt" onclick="document.getElementById(\'duebillForm\').style.display=\'none\'">Cancel</button>';
    html += '</div></div>';

    // Table
    if (bills.length) {
      html += '<table style="width:100%;border-collapse:collapse">';
      html += '<thead><tr>';
      html += '<th style="text-align:left;padding:10px 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">Date</th>';
      html += '<th style="text-align:left;padding:10px 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">Customer</th>';
      html += '<th style="text-align:left;padding:10px 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">RN</th>';
      html += '<th style="text-align:left;padding:10px 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">Type</th>';
      html += '<th style="text-align:left;padding:10px 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">Issue</th>';
      html += '<th style="text-align:left;padding:10px 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">Status</th>';
      html += '<th style="text-align:left;padding:10px 12px;font-size:12px;color:#71717a;font-weight:600;text-transform:uppercase;border-bottom:1px solid rgba(128,128,128,.15)">Notes</th>';
      html += '</tr></thead><tbody>';

      bills.sort(function(a, b) { return (b.createdDate || '').localeCompare(a.createdDate || ''); });
      bills.forEach(function(b) {
        var statusColor = b.status === 'Open' ? '#ef4444' : b.status === 'Resolved' ? '#22c55e' : '#f59e0b';
        html += '<tr>';
        html += '<td style="padding:10px 12px;font-size:13px;border-bottom:1px solid rgba(128,128,128,.06)">' + (b.createdDate || '') + '</td>';
        html += '<td style="padding:10px 12px;font-weight:600;border-bottom:1px solid rgba(128,128,128,.06)">' + (b.customer || '') + '</td>';
        html += '<td style="padding:10px 12px;border-bottom:1px solid rgba(128,128,128,.06)"><a href="https://dro.tesla.com/advisor?sidepanel_fullscreen=yes&rn=' + b.rn + '" target="_blank" style="color:#60a5fa;text-decoration:none">' + b.rn + '</a></td>';
        html += '<td style="padding:10px 12px;border-bottom:1px solid rgba(128,128,128,.06)">' + (b.type || '') + '</td>';
        html += '<td style="padding:10px 12px;border-bottom:1px solid rgba(128,128,128,.06)">' + (b.issue || '') + '</td>';
        html += '<td style="padding:10px 12px;border-bottom:1px solid rgba(128,128,128,.06)"><select onchange="UPDATEDUEBILL(' + b.id + ',\'status\',this.value)" style="padding:4px 8px;border-radius:4px;border:1px solid rgba(128,128,128,.15);font-size:12px;font-family:inherit;color:' + statusColor + ';background:transparent;cursor:pointer;font-weight:600"><option value="Open"' + (b.status === 'Open' ? ' selected' : '') + '>Open</option><option value="Parts Ordered"' + (b.status === 'Parts Ordered' ? ' selected' : '') + '>Parts Ordered</option><option value="Scheduled"' + (b.status === 'Scheduled' ? ' selected' : '') + '>Scheduled</option><option value="Resolved"' + (b.status === 'Resolved' ? ' selected' : '') + '>Resolved</option></select></td>';
        html += '<td style="padding:10px 12px;border-bottom:1px solid rgba(128,128,128,.06)"><input type="text" value="' + (b.notes || '').replace(/"/g, '&quot;') + '" placeholder="Add note..." onblur="UPDATEDUEBILL(' + b.id + ',\'notes\',this.value)" style="padding:4px 8px;border:1px solid rgba(128,128,128,.15);border-radius:4px;font-size:12px;font-family:inherit;color:inherit;background:transparent;width:100%;box-sizing:border-box" /></td>';
        html += '</tr>';
      });
      html += '</tbody></table>';
    } else {
      html += '<div style="text-align:center;padding:40px;color:#71717a">No due bills yet. Click "+ New Due Bill" to create one.</div>';
    }

    container.innerHTML = html;
  }).catch(function(e) {
    container.innerHTML = '<div style="color:#ef4444">Error: ' + e.message + '</div>';
  });
}

function SHOWADDDUEBILL() {
  document.getElementById('duebillForm').style.display = '';
}

function SAVEDUEBILL() {
  var bill = {
    rn: document.getElementById('dbRn').value,
    customer: document.getElementById('dbCustomer').value,
    type: document.getElementById('dbType').value,
    issue: document.getElementById('dbIssue').value,
    ces: 'Ben Daubin'
  };
  fetch(SERVER + '/api/duebills', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(bill)
  }).then(function() { LOADDUEBILLS(); });
}

function UPDATEDUEBILL(id, field, value) {
  var update = {};
  update[field] = value;
  fetch(SERVER + '/api/duebills/' + id, {
    method: 'PUT',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(update)
  }).catch(function() {});
}
