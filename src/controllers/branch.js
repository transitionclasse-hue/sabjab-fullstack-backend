import Branch from "../models/branch.js";

const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const isValidLatLng = (lat, lng) =>
  Number.isFinite(lat) &&
  Number.isFinite(lng) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180 &&
  !(lat === 0 && lng === 0);

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

    // Guard against broken data producing nonsense ETAs.
    const safeDistanceKm =
      minDistance !== null && minDistance >= 0 && minDistance <= 100 ? minDistance : 5;
    const etaMinutes = clamp(Math.ceil(safeDistanceKm * 3) + 5, 5, 180);

    // Check delivery eligibility (Geofencing)
    const deliveryRadius = nearest.deliveryRadius || 2.5;
    const isWithinRadius = safeDistanceKm <= deliveryRadius;

    // Check Pincode Fallback
    const isPincodeServiced = userPincode && nearest.servicedPincodes?.includes(String(userPincode));

    const isDeliverable = isWithinRadius || isPincodeServiced;

    return reply.send({
      branchId: nearest._id,
      name: nearest.name,
      location: nearest.location,
      address: nearest.address,
      distanceKm: Number(safeDistanceKm.toFixed(2)),
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
