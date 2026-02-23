import PricingConfig from "../models/pricingConfig.js";

const DEFAULT_PRICING_CONFIG = {
  key: "primary",
  freeDeliveryEnabled: true,
  freeDeliveryThreshold: 199,
  baseDeliveryFee: 20,
  promiseProtectEnabled: false,
  promiseProtectFee: 0,
  smallCartFeeEnabled: false,
  smallCartThreshold: 99,
  smallCartFee: 0,
  rainSurgeEnabled: false,
  rainSurgeFee: 0,
  lateNightFeeEnabled: false,
  lateNightStartTime: "23:00",
  lateNightEndTime: "05:00",
  lateNightFee: 0,
  customFees: [],
};

const toNumber = (v, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
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

const isWithinTimeWindow = (startMinutes, endMinutes, nowMinutes) => {
  if (startMinutes === endMinutes) return true;
  if (endMinutes > startMinutes) {
    return nowMinutes >= startMinutes && nowMinutes < endMinutes;
  }
  // overnight window
  return nowMinutes >= startMinutes || nowMinutes < endMinutes;
};

const calculateFees = (config, itemsTotal, coupon = null) => {
  const subtotal = Math.max(0, toNumber(itemsTotal, 0));
  const breakdown = [];

  const freeDeliveryEnabled = Boolean(config.freeDeliveryEnabled);
  const freeDeliveryThreshold = toNumber(config.freeDeliveryThreshold, 0);
  const baseDeliveryFee = toNumber(config.baseDeliveryFee, 0);
  const deliveryFee =
    freeDeliveryEnabled && subtotal >= freeDeliveryThreshold ? 0 : baseDeliveryFee;

  breakdown.push({
    code: "delivery_fee",
    label: "Delivery Fee",
    amount: deliveryFee,
    meta: {
      freeDeliveryApplied: freeDeliveryEnabled && subtotal >= freeDeliveryThreshold,
      freeDeliveryThreshold,
    },
  });

  if (config.promiseProtectEnabled) {
    breakdown.push({
      code: "promise_protect_fee",
      label: "Promise Protect Fee",
      amount: toNumber(config.promiseProtectFee, 0),
    });
  }

  if (config.smallCartFeeEnabled && subtotal < toNumber(config.smallCartThreshold, 0)) {
    breakdown.push({
      code: "small_cart_fee",
      label: "Small Cart Fee",
      amount: toNumber(config.smallCartFee, 0),
      meta: { threshold: toNumber(config.smallCartThreshold, 0) },
    });
  }

  if (config.rainSurgeEnabled) {
    breakdown.push({
      code: "rain_surge_fee",
      label: "Rain Surge Fee",
      amount: toNumber(config.rainSurgeFee, 0),
    });
  }

  if (config.lateNightFeeEnabled) {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = toMinutes(config.lateNightStartTime, 23 * 60);
    const endMinutes = toMinutes(config.lateNightEndTime, 5 * 60);
    if (isWithinTimeWindow(startMinutes, endMinutes, nowMinutes)) {
      breakdown.push({
        code: "late_night_fee",
        label: "Late Night Fee",
        amount: toNumber(config.lateNightFee, 0),
      });
    }
  }

  const customFees = Array.isArray(config.customFees) ? config.customFees : [];
  customFees.forEach((fee, index) => {
    if (!fee?.isEnabled) return;
    breakdown.push({
      code: `custom_fee_${index + 1}`,
      label: fee.name || `Custom Fee ${index + 1}`,
      amount: toNumber(fee.amount, 0),
    });
  });

  // Apply Coupon Discount
  let discountAmount = 0;
  if (coupon) {
    if (coupon.discountType === "percentage") {
      discountAmount = (subtotal * toNumber(coupon.discountValue, 0)) / 100;
      // Cap discount if maxDiscount is set
      if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
        discountAmount = coupon.maxDiscount;
      }
    } else {
      discountAmount = toNumber(coupon.discountValue, 0);
    }

    // Ensure discount doesn't exceed subtotal
    discountAmount = Math.min(discountAmount, subtotal);

    if (discountAmount > 0) {
      breakdown.push({
        code: "coupon_discount",
        label: `Discount (${coupon.code})`,
        amount: -discountAmount,
      });
    }
  }

  const feesTotal = breakdown.reduce((sum, fee) => sum + toNumber(fee.amount, 0), 0);
  const grandTotal = subtotal + feesTotal;

  return {
    itemsTotal: Number(subtotal.toFixed(2)),
    feesTotal: Number(feesTotal.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
    breakdown: breakdown.map((item) => ({
      ...item,
      amount: Number(toNumber(item.amount, 0).toFixed(2)),
    })),
  };
};

const sanitizeCustomFees = (fees) => {
  if (!Array.isArray(fees)) return [];
  return fees
    .map((fee) => ({
      name: String(fee?.name || "").trim(),
      amount: Math.max(0, toNumber(fee?.amount, 0)),
      isEnabled: fee?.isEnabled !== false,
    }))
    .filter((fee) => fee.name.length > 0);
};

export const getPricingConfig = async (req, reply) => {
  try {
    const config = await PricingConfig.findOneAndUpdate(
      { key: "primary" },
      { $setOnInsert: DEFAULT_PRICING_CONFIG },
      { upsert: true, new: true }
    );

    return reply.send(config);
  } catch (error) {
    return reply.status(500).send({
      message: "Failed to fetch pricing config",
      error: error.message,
    });
  }
};

export const estimatePricing = async (req, reply) => {
  try {
    const { itemsTotal, couponCode } = req.body;
    const subtotal = toNumber(itemsTotal, 0);

    const config = await PricingConfig.findOneAndUpdate(
      { key: "primary" },
      { $setOnInsert: DEFAULT_PRICING_CONFIG },
      { upsert: true, new: true }
    );

    let coupon = null;
    if (couponCode) {
      const { Coupon } = await import("../models/coupon.js");
      coupon = await Coupon.findOne({
        code: couponCode.toUpperCase(),
        isActive: true,
        expirationDate: { $gt: new Date() },
        $or: [
          { usageLimit: null },
          { $expr: { $lt: ["$usedCount", "$usageLimit"] } }
        ]
      });

      if (coupon && coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
        // If coupon exists but min amount not met, don't apply it but don't error? 
        // Actually, maybe error so frontend knows why it's not applied.
        // For now, let's just not apply it and we'll handle messaging in checkout.
        coupon = null;
      }
    }

    const estimate = calculateFees(config, subtotal, coupon);
    return reply.send(estimate);
  } catch (error) {
    return reply.status(500).send({
      message: "Failed to estimate pricing",
      error: error.message,
    });
  }
};

export const updatePricingConfig = async (req, reply) => {
  try {
    const body = req.body || {};
    const update = {
      freeDeliveryEnabled: Boolean(body.freeDeliveryEnabled),
      freeDeliveryThreshold: Math.max(0, toNumber(body.freeDeliveryThreshold, 0)),
      baseDeliveryFee: Math.max(0, toNumber(body.baseDeliveryFee, 0)),
      promiseProtectEnabled: Boolean(body.promiseProtectEnabled),
      promiseProtectFee: Math.max(0, toNumber(body.promiseProtectFee, 0)),
      smallCartFeeEnabled: Boolean(body.smallCartFeeEnabled),
      smallCartThreshold: Math.max(0, toNumber(body.smallCartThreshold, 0)),
      smallCartFee: Math.max(0, toNumber(body.smallCartFee, 0)),
      rainSurgeEnabled: Boolean(body.rainSurgeEnabled),
      rainSurgeFee: Math.max(0, toNumber(body.rainSurgeFee, 0)),
      lateNightFeeEnabled: Boolean(body.lateNightFeeEnabled),
      lateNightStartTime: String(body.lateNightStartTime || "23:00"),
      lateNightEndTime: String(body.lateNightEndTime || "05:00"),
      lateNightFee: Math.max(0, toNumber(body.lateNightFee, 0)),
      customFees: sanitizeCustomFees(body.customFees),
    };

    const config = await PricingConfig.findOneAndUpdate(
      { key: "primary" },
      { $setOnInsert: DEFAULT_PRICING_CONFIG, $set: update },
      { upsert: true, new: true }
    );

    return reply.send(config);
  } catch (error) {
    return reply.status(500).send({
      message: "Failed to update pricing config",
      error: error.message,
    });
  }
};
