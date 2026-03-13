import Branch from "../models/branch.js";
import { getDistanceKm, isValidLatLng } from "../utils/geo.js";

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export const getNearestBranch = async (req, reply) => {
  try {
    const userLat = toNumber(req.query?.lat);
    const userLng = toNumber(req.query?.lng);
    const userPincode = req.query?.pincode;

    const branches = await Branch.find({});
    if (!branches.length) {
      return reply.status(404).send({ message: "No branches found" });
    }

    const validBranches = branches.filter(
      (b) =>
        isValidLatLng(Number(b.location?.latitude), Number(b.location?.longitude))
    );

    const targetPool = validBranches.length ? validBranches : branches;
    let nearest = targetPool[0];
    let minDistance = null;

    if (userLat !== null && userLng !== null && validBranches.length) {
      for (const branch of validBranches) {
        const branchLat = Number(branch.location?.latitude);
        const branchLng = Number(branch.location?.longitude);

        // Prefer normal coordinates; if branch coords were accidentally swapped,
        // use the smaller valid distance to avoid absurd ETA values.
        const candidates = [];
        if (isValidLatLng(branchLat, branchLng)) {
          candidates.push(getDistanceKm(userLat, userLng, branchLat, branchLng));
        }
        if (isValidLatLng(branchLng, branchLat)) {
          candidates.push(getDistanceKm(userLat, userLng, branchLng, branchLat));
        }
        const dist = candidates.length ? Math.min(...candidates) : null;

        if (Number.isFinite(dist) && (minDistance === null || dist < minDistance)) {
          minDistance = dist;
          nearest = branch;
        }
      }
    }

    // Fix bug where distance > 100 was reset to 5
    // Fix bug where distance > 100 was reset to 5
    const actualDistanceKm = minDistance !== null && minDistance >= 0 ? minDistance : 9999;
    
    // Dynamic ETA Calculation
    const prepTime = nearest.prepTime || 5;
    const vehicleSpeed = nearest.vehicleSpeed || 20;
    const travelTimeMinutes = (actualDistanceKm / vehicleSpeed) * 60;
    const etaMinutes = clamp(Math.ceil(travelTimeMinutes + prepTime), 5, 180);

    // Check delivery eligibility (Geofencing)
    const deliveryRadius = nearest.deliveryRadius || 2.5;
    const isWithinRadius = actualDistanceKm <= deliveryRadius;

    // Check Pincode but DO NOT bypass the strict geofencing radius
    const isPincodeServiced = userPincode && nearest.servicedPincodes?.includes(String(userPincode));

    // Strict Geofencing: MUST be within radius
    const isDeliverable = isWithinRadius;

    return reply.send({
      branchId: nearest._id,
      name: nearest.name,
      location: nearest.location,
      address: nearest.address,
      distanceKm: Number(actualDistanceKm.toFixed(2)),
      deliveryRadius,
      isDeliverable,
      isWithinRadius,
      isPincodeServiced,
      pincodeChecked: userPincode || null,
      etaMinutes,
    });
  } catch (error) {
    return reply.status(500).send({
      message: "Failed to fetch nearest branch",
      error: error.message,
    });
  }
};
