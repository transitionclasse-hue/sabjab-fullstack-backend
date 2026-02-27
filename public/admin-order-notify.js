(function () {
  var played = {};
  var unreadCount = 0;
  var bellEl = null;
  var bellCountEl = null;
  var bellTimeout = null;

  function ensureBellWidget() {
    if (bellEl) return;

    var style = document.createElement("style");
    style.innerHTML = [
      "@keyframes sabjabBellRing {",
      "0% { transform: rotate(0deg) scale(1); }",
      "20% { transform: rotate(-18deg) scale(1.06); }",
      "40% { transform: rotate(16deg) scale(1.06); }",
      "60% { transform: rotate(-10deg) scale(1.04); }",
      "80% { transform: rotate(8deg) scale(1.02); }",
      "100% { transform: rotate(0deg) scale(1); }",
      "}",
    ].join("");
    document.head.appendChild(style);

    bellEl = document.createElement("button");
    bellEl.type = "button";
    bellEl.title = "New Orders";
    bellEl.style.position = "fixed";
    bellEl.style.top = "16px";
    bellEl.style.left = "16px";
    bellEl.style.width = "46px";
    bellEl.style.height = "46px";
    bellEl.style.borderRadius = "23px";
    bellEl.style.border = "none";
    bellEl.style.cursor = "pointer";
    bellEl.style.zIndex = "99999";
    bellEl.style.background = "#3C2A21";
    bellEl.style.color = "#fff";
    bellEl.style.fontSize = "22px";
    bellEl.style.fontWeight = "700";
    bellEl.style.boxShadow = "0 4px 14px rgba(0,0,0,0.25)";
    bellEl.textContent = "🔔";

    bellCountEl = document.createElement("span");
    bellCountEl.style.position = "absolute";
    bellCountEl.style.top = "-6px";
    bellCountEl.style.right = "-5px";
    bellCountEl.style.minWidth = "18px";
    bellCountEl.style.height = "18px";
    bellCountEl.style.borderRadius = "9px";
    bellCountEl.style.padding = "0 4px";
    bellCountEl.style.background = "#ef4444";
    bellCountEl.style.color = "#fff";
    bellCountEl.style.fontSize = "11px";
    bellCountEl.style.fontWeight = "800";
    bellCountEl.style.lineHeight = "18px";
    bellCountEl.style.textAlign = "center";
    bellCountEl.style.display = "none";
    bellEl.appendChild(bellCountEl);

    bellEl.addEventListener("click", function () {
      unreadCount = 0;
      bellCountEl.style.display = "none";
    });

    document.body.appendChild(bellEl);
  }

  function ringBell() {
    ensureBellWidget();
    unreadCount += 1;
    bellCountEl.style.display = "block";
    bellCountEl.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
    bellEl.style.animation = "sabjabBellRing 0.7s ease-in-out 3";
    clearTimeout(bellTimeout);
    bellTimeout = setTimeout(function () {
      if (bellEl) bellEl.style.animation = "";
    }, 2300);
  }

  function beep() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = new Ctx();
      var osc = ctx.createOscillator();
      var gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 880;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(function () {
        osc.stop();
        ctx.close();
      }, 220);
    } catch (e) {
      console.log("Admin sound notification blocked:", e);
    }
  }

  function showBanner(message) {
    var existing = document.getElementById("sabjab-admin-notice");
    if (existing) existing.remove();

    var bar = document.createElement("div");
    bar.id = "sabjab-admin-notice";
    bar.style.position = "fixed";
    bar.style.top = "16px";
    bar.style.right = "16px";
    bar.style.zIndex = "99999";
    bar.style.padding = "10px 14px";
    bar.style.borderRadius = "10px";
    bar.style.background = "#3C2A21";
    bar.style.color = "#fff";
    bar.style.fontSize = "13px";
    bar.style.fontWeight = "700";
    bar.style.boxShadow = "0 4px 14px rgba(0,0,0,0.25)";
    bar.innerText = message;
    document.body.appendChild(bar);

    setTimeout(function () {
      if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
    }, 4500);
  }

  function refreshOrderList() {
    // Check if on the Order list page or OrderAssignment page
    var isOrderPage = window.location.pathname.indexOf('/admin/resources/Order') !== -1 &&
      window.location.pathname.indexOf('/admin/resources/Order/records/') === -1;
    var isAssignmentPage = window.location.pathname.indexOf('/admin/resources/OrderAssignment') !== -1 &&
      window.location.pathname.indexOf('/admin/resources/OrderAssignment/records/') === -1;

    if (isOrderPage || isAssignmentPage) {
      console.log("📦 Order/Assignment Page Detected - Refreshing Data Strip");

      // Target AdminJS Refresh Button if exists
      var refreshBtn = document.querySelector('button[data-testid="action-refresh"]');
      if (refreshBtn) {
        refreshBtn.click();
      } else {
        // Fallback: Soft reload to fetch latest records
        setTimeout(function () { window.location.reload(); }, 1500);
      }
    }
  }

  function handleNewOrder(payload) {
    var id = payload && (payload.orderId || payload._id);
    if (!id || played[id]) return;
    played[id] = true;
    ringBell();
    beep();
    showBanner("New order received: " + (payload.orderNumber || id));
    refreshOrderList();
  }

  function initSocket() {
    if (!window.io) return;
    ensureBellWidget();
    var socket = window.io("/", { transports: ["websocket"] });
    socket.on("admin:new-order", handleNewOrder);
    socket.on("admin:order-assigned", function (payload) {
      var msg =
        "Driver assigned: " +
        (payload && payload.driverName ? payload.driverName : "Delivery Partner");
      showBanner(msg);
      refreshOrderList();
    });
    socket.on("admin:order-status-update", function (payload) {
      refreshOrderList();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSocket);
  } else {
    initSocket();
  }
})();
