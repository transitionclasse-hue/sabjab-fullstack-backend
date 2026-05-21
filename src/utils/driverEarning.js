import { getDistanceKm, isValidLatLng } from "./geo.js";

const roundMoney = (value) => Math.round(Math.max(0, Number(value) || 0) * 100) / 100;

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
  const incentive = config?.driverIncentiveEnabled
    ? Number(config?.driverIncentiveAmount ?? 0)
    : 0;

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
