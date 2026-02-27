import StoreStatus from "../models/storeStatus.js";

const DEFAULT_STORE_STATUS = {
  key: "primary",
  mode: "schedule",
  openingTime: "09:00",
  closingTime: "22:00",
  alertBeforeMinutes: 30,
  note: "",
};

const formatIn = (value) => {
  const safeValue = Number(value) || 1;
  if (safeValue >= 60) {
    const hr = Math.ceil(safeValue / 60);
    return `${hr} ${hr === 1 ? "hr" : "hrs"}`;
  }
  return `${safeValue} ${safeValue === 1 ? "min" : "mins"}`;
};

const toMinutes = (timeStr, fallback) => {
  const value = String(timeStr || "").trim();
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return fallback;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  if (!Number.isFinite(hh) || !Number.isFinite(mm) || hh < 0 || hh > 23 || mm < 0 || mm > 59) {
    return fallback;
  }
  return hh * 60 + mm;
};

export const getStoreStatus = async (req, reply) => {
  try {
    console.log("🏪 Fetching Store Status [primary]");
    const config = await StoreStatus.findOneAndUpdate(
      { key: "primary" },
      { $setOnInsert: DEFAULT_STORE_STATUS },
      { upsert: true, new: true }
    );
    console.log("✅ Store Status fetched:", config.mode);

    return reply.send(buildStoreStatusResponse(config));
  } catch (error) {
    console.error("❌ Failed to fetch store status:", error);
    return reply.status(500).send({
      message: "Failed to fetch store status",
      error: error.message,
    });
  }
};

const buildStoreStatusResponse = (config) => {
  // ✅ Force IST (Asia/Kolkata) regardless of server location (e.g. Render/UTC)
  const now = new Date();
  const istString = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Kolkata",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).format(now);

  const [istHours, istMinutes] = istString.split(":").map(Number);
  const nowMinutes = istHours * 60 + istMinutes;

  const openingMinutes = toMinutes(config.openingTime, 9 * 60);
  const closingMinutes = toMinutes(config.closingTime, 22 * 60);
  const alertBeforeMinutes = Number(config.alertBeforeMinutes) || 30;

  let status = "open";
  let statusLabel = "Open";
  let minutesToBoundary = null;

  if (config.mode === "manual_open") {
    status = "open";
    statusLabel = "Open";
  } else if (config.mode === "manual_closed") {
    status = "closed";
    statusLabel = "Closed";
  } else {
    // schedule mode
    const overnight = closingMinutes <= openingMinutes;
    const isOpen = overnight
      ? nowMinutes >= openingMinutes || nowMinutes < closingMinutes
      : nowMinutes >= openingMinutes && nowMinutes < closingMinutes;

    if (isOpen) {
      const minsToClose = overnight
        ? (nowMinutes < closingMinutes
          ? closingMinutes - nowMinutes
          : 24 * 60 - nowMinutes + closingMinutes)
        : closingMinutes - nowMinutes;
      minutesToBoundary = minsToClose;
      if (minsToClose <= alertBeforeMinutes) {
        status = "closing_soon";
        statusLabel = `Closes in ${formatIn(minsToClose)}`;
      } else {
        status = "open";
        statusLabel = "Open";
      }
    } else {
      const minsToOpen = overnight
        ? openingMinutes - nowMinutes
        : (nowMinutes < openingMinutes ? openingMinutes - nowMinutes : 24 * 60 - nowMinutes + openingMinutes);
      minutesToBoundary = minsToOpen;
      status = "closed";
      statusLabel = minsToOpen <= alertBeforeMinutes ? `Opens in ${formatIn(minsToOpen)}` : "Closed";
    }
  }

  return {
    status,
    statusLabel,
    mode: config.mode,
    openingTime: config.openingTime,
    closingTime: config.closingTime,
    alertBeforeMinutes: config.alertBeforeMinutes,
    minutesToBoundary,
    note: config.note || "",
    updatedAt: config.updatedAt,
  };
};

export const updateStoreStatus = async (req, reply) => {
  try {
    const payload = req.body || {};
    const allowedModes = new Set(["manual_open", "manual_closed", "schedule"]);
    const update = {};

    if (typeof payload.mode === "string" && allowedModes.has(payload.mode)) {
      update.mode = payload.mode;
    }
    if (typeof payload.openingTime === "string") {
      update.openingTime = payload.openingTime;
    }
    if (typeof payload.closingTime === "string") {
      update.closingTime = payload.closingTime;
    }
    if (payload.alertBeforeMinutes !== undefined) {
      update.alertBeforeMinutes = Math.max(1, Number(payload.alertBeforeMinutes) || 30);
    }
    if (typeof payload.note === "string") {
      update.note = payload.note;
    }

    const config = await StoreStatus.findOneAndUpdate(
      { key: "primary" },
      { $setOnInsert: DEFAULT_STORE_STATUS, $set: update },
      { upsert: true, new: true }
    );

    return reply.send(buildStoreStatusResponse(config));
  } catch (error) {
    return reply.status(500).send({
      message: "Failed to update store status",
      error: error.message,
    });
  }
};
