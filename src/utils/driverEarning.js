import { getDistanceKm, isValidLatLng } from "./geo.js";

const roundMoney = (value) => Math.round(Math.max(0, Number(value) || 0) * 100) / 100;

const toMinutes = (timeStr, fallback = 0) => {
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

const isWithinTimeWindow = (startMinutes, endMinutes, nowMinutes) => {
  if (startMinutes === endMinutes) return true;
  if (endMinutes > startMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }
  // overnight window
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
};

/** Distance from store/pickup to customer delivery point (km). */
export const getOrderDeliveryDistanceKm = (order) => {
  if (!order) return null;

  const destLat = order.deliveryLocation?.latitude;
  const destLng = order.deliveryLocation?.longitude;

  let originLat = order.pickupLocation?.latitude;
  let originLng = order.pickupLocation?.longitude;

  const branchLoc = order.branch?.location || order.branch;
  if (!isValidLatLng(originLat, originLng) && branchLoc) {
    originLat = branchLoc.latitude ?? branchLoc.lat;
    originLng = branchLoc.longitude ?? branchLoc.lng;
  }

  if (!isValidLatLng(originLat, originLng) || !isValidLatLng(destLat, destLng)) {
    return null;
  }

  return getDistanceKm(originLat, originLng, destLat, destLng);
};

/**
 * Compute driver earning from pricing config and optional order.
 * Supports flat (defaultDriverEarning), distance-based rate, and optional incentive.
 */
export const computeDriverEarning = (config, order = null) => {
  const flat = Number(config?.defaultDriverEarning ?? 30);
  
  let incentive = 0;
  if (config?.driverIncentiveEnabled) {
    let matchedSlotAmount = null;
    const slots = Array.isArray(config?.driverIncentiveSlots) ? config.driverIncentiveSlots : [];
    
    const targetDate = order?.createdAt ? new Date(order.createdAt) : new Date();
    const nowMinutes = targetDate.getHours() * 60 + targetDate.getMinutes();
    
    for (const slot of slots) {
      if (slot?.isEnabled && slot?.startTime && slot?.endTime) {
        const startMinutes = toMinutes(slot.startTime, -1);
        const endMinutes = toMinutes(slot.endTime, -1);
        if (startMinutes !== -1 && endMinutes !== -1) {
          if (isWithinTimeWindow(startMinutes, endMinutes, nowMinutes)) {
            matchedSlotAmount = Number(slot.amount ?? 0);
            break;
          }
        }
      }
    }
    
    incentive = matchedSlotAmount !== null ? matchedSlotAmount : Number(config?.driverIncentiveAmount ?? 0);
  }

  if (String(config?.driverEarningMode || "flat") !== "distance") {
    return roundMoney(flat + incentive);
  }

  const distanceKm = getOrderDeliveryDistanceKm(order);
  if (distanceKm == null) {
    return roundMoney(flat + incentive);
  }

  const rate = Number(config?.driverRateAmount ?? 0);
  const unit = String(config?.driverRateUnit || "km");
  const units = unit === "100m" ? distanceKm * 10 : distanceKm;

  let earning =
    Number(config?.driverBaseEarning ?? 0) + rate * units + incentive;

  const min = Number(config?.driverMinEarning ?? 0);
  const max = Number(config?.driverMaxEarning ?? 0);
  if (min > 0) earning = Math.max(earning, min);
  if (max > 0) earning = Math.min(earning, max);

  return roundMoney(earning);
};
