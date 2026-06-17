import PricingConfig from "../models/pricingConfig.js";
import { SlotPromotion } from "../models/slotPromotion.js";
import jwt from "jsonwebtoken";

const DEFAULT_PRICING_CONFIG = {
  key: "primary",
  freeDeliveryEnabled: true,
  freeDeliveryThreshold: 199,
  baseDeliveryFee: 20,
  speedDeliveryEnabled: true,
  choiceDeliveryFee: 40,
  choiceFreeDeliveryEnabled: true,
  choiceFreeDeliveryThreshold: 499,
  promiseProtectEnabled: false,
  promiseProtectFee: 0,
  deliveryBagEnabled: false,
  deliveryBagFee: 0,
  smallCartFeeEnabled: false,
  smallCartThreshold: 99,
  smallCartFee: 0,
  rainSurgeEnabled: false,
  rainSurgeFee: 0,
  lateNightFeeEnabled: false,
  lateNightStartTime: "23:00",
  lateNightEndTime: "05:00",
  lateNightFee: 0,
  defaultDriverEarning: 30,
  defaultDriverCodLimit: 2000,
  driverEarningMode: "flat",
  driverRateAmount: 0,
  driverRateUnit: "km",
  driverBaseEarning: 0,
  driverMinEarning: 0,
  driverMaxEarning: 0,
  driverIncentiveEnabled: false,
  driverIncentiveAmount: 0,
  rewardCoinsEnabled: true,
  rewardCoinsPercentage: 1,
  minAmountForCoins: 1,
  customFees: [],
  cartBarColor: "#1A1A1A",
  choiceCartBarColor: "#6D28D9",
  etaColor: "#1A1A1A",
  footerStyle: "standard",
  cartBarAnimationStyle: "snappy",
  cartBarStyle: "standard",
  checkoutStyle: "standard",
  choiceCheckoutStyle: "standard",
  primaryColor: "#4CAF50",
  deliverySlots: [
    { label: "09:00 AM - 11:00 AM", isEnabled: true },
    { label: "11:00 AM - 01:00 PM", isEnabled: true },
    { label: "01:00 PM - 03:00 PM", isEnabled: true },
    { label: "03:00 PM - 05:00 PM", isEnabled: true },
    { label: "05:00 PM - 07:00 PM", isEnabled: true },
    { label: "07:00 PM - 09:00 PM", isEnabled: true },
  ],
  companyUpiId: "",
  companyName: "SabJab",
  hideRazorpayTopbar: false,
  qrCodeAmountPrefill: true,
  driverQrMode: "direct_upi",
  consumerOnlinePaymentMode: "razorpay",
  driverIncentiveSlots: [],
  gstDetailsEnabled: false,
  giftPackagingFee: 30,
  themeWaveEffectEnabled: false,
  walletSystemEnabled: true,
};

const FOOTER_STYLES = new Set(["standard", "floating", "minimal", "premium", "ultra"]);

const sanitizeFooterStyle = (value) => {
  const footerStyle = String(value || "standard").trim();
  return FOOTER_STYLES.has(footerStyle) ? footerStyle : "standard";
};

const ANIMATION_STYLES = new Set(["snappy", "spring_low_mass", "overshoot", "spring_legacy"]);

const sanitizeAnimationStyle = (value) => {
  const style = String(value || "snappy").trim();
  return ANIMATION_STYLES.has(style) ? style : "snappy";
};

const BAR_STYLES = new Set(["standard", "bumpy_pill"]);

const sanitizeCartBarStyle = (value) => {
  const style = String(value || "standard").trim();
  return BAR_STYLES.has(style) ? style : "standard";
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

export const calculateFees = (config, itemsTotal, coupon = null, orderType = 'quick', deliveryInBag = false, tipAmount = 0, giftPackagingFee = 0, walletBalance = 0, useGreenPoints = false, greenPointsBalance = 0, greenPointsConfig = null) => {
  const subtotal = Math.max(0, toNumber(itemsTotal, 0));
  const breakdown = [];

  const isChoice = orderType === 'choice';
  const freeEnabled = isChoice ? Boolean(config.choiceFreeDeliveryEnabled) : Boolean(config.freeDeliveryEnabled);
  const freeThreshold = isChoice ? toNumber(config.choiceFreeDeliveryThreshold, 0) : toNumber(config.freeDeliveryThreshold, 0);
  const baseFee = isChoice ? toNumber(config.choiceDeliveryFee, 40) : toNumber(config.baseDeliveryFee, 0);
  
  const deliveryFee = (freeEnabled && subtotal >= freeThreshold) ? 0 : baseFee;

  breakdown.push({
    code: "delivery_fee",
    label: isChoice ? "Choice Delivery Fee" : "Delivery Fee",
    amount: deliveryFee,
    meta: {
      freeDeliveryApplied: freeEnabled && subtotal >= freeThreshold,
      freeDeliveryThreshold: freeThreshold,
      orderType
    },
  });

  if (toNumber(giftPackagingFee, 0) > 0) {
    breakdown.push({
      code: "gift_packaging_fee",
      label: "Gift Packaging",
      amount: toNumber(giftPackagingFee, 0),
    });
  }

  if (toNumber(tipAmount, 0) > 0) {
    breakdown.push({
      code: "driver_tip",
      label: "Delivery Partner Tip",
      amount: toNumber(tipAmount, 0),
    });
  }

  if (config.promiseProtectEnabled) {
    breakdown.push({
      code: "promise_protect_fee",
      label: "Promise Protect Fee",
      amount: toNumber(config.promiseProtectFee, 0),
    });
  }

  if (config.deliveryBagEnabled && deliveryInBag) {
    breakdown.push({
      code: "delivery_bag_fee",
      label: "Delivery in a Bag",
      amount: toNumber(config.deliveryBagFee, 0),
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

  const feesTotalWithoutLoyalty = breakdown.reduce((sum, fee) => sum + toNumber(fee.amount, 0), 0);
  const grandTotalWithoutLoyalty = subtotal + feesTotalWithoutLoyalty;

  let appliedEcoCoins = 0;
  let appliedEcoAmount = 0;
  if (useGreenPoints && greenPointsConfig?.settings?.enabled && toNumber(greenPointsBalance, 0) >= (greenPointsConfig.settings.minRedemptionPoints || 0)) {
    const pointValue = greenPointsConfig.settings.pointValue !== undefined ? greenPointsConfig.settings.pointValue : 0.20;
    appliedEcoCoins = Math.min(Math.floor(toNumber(greenPointsBalance, 0)), Math.floor(grandTotalWithoutLoyalty / pointValue));
    appliedEcoAmount = appliedEcoCoins * pointValue;
    if (appliedEcoCoins > 0) {
      breakdown.push({
        code: "green_points_deduction",
        label: "Green Points Applied",
        amount: -appliedEcoAmount,
        meta: {
          pointsRedeemed: appliedEcoCoins,
          pointValue: pointValue
        }
      });
    }
  }

  const feesTotalWithoutWallet = breakdown.reduce((sum, fee) => sum + toNumber(fee.amount, 0), 0);
  const grandTotalWithoutWallet = subtotal + feesTotalWithoutWallet;

  let appliedWalletAmount = 0;
  if (config.walletSystemEnabled !== false && toNumber(walletBalance, 0) > 0) {
    appliedWalletAmount = Math.min(toNumber(walletBalance, 0), grandTotalWithoutWallet);
    breakdown.push({
      code: "wallet_deduction",
      label: "Wallet Balance Applied",
      amount: -appliedWalletAmount,
    });
  }

  const feesTotal = breakdown.reduce((sum, fee) => sum + toNumber(fee.amount, 0), 0);
  const grandTotal = subtotal + feesTotal;

  return {
    itemsTotal: Number(subtotal.toFixed(2)),
    feesTotal: Number(feesTotal.toFixed(2)),
    grandTotal: Number(grandTotal.toFixed(2)),
    appliedEcoCoins,
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

const sanitizeIncentiveSlots = (slots) => {
  if (!Array.isArray(slots)) return [];
  return slots
    .map((slot) => ({
      name: String(slot?.name || "").trim(),
      startTime: String(slot?.startTime || "00:00").trim(),
      endTime: String(slot?.endTime || "00:00").trim(),
      amount: Math.max(0, toNumber(slot?.amount, 0)),
      isEnabled: slot?.isEnabled !== false,
    }))
    .filter((slot) => slot.name.length > 0);
};

export const getPricingConfig = async (req, reply) => {
  try {
    const config = await PricingConfig.findOneAndUpdate(
      { key: "primary" },
      { $setOnInsert: DEFAULT_PRICING_CONFIG },
      { upsert: true, new: true }
    );

    // Merge with defaults to ensure new fields exist for old records
    const mergedConfig = { ...DEFAULT_PRICING_CONFIG, ...config.toObject() };

    return reply.send(mergedConfig);
  } catch (error) {
    return reply.status(500).send({
      message: "Failed to fetch pricing config",
      error: error.message,
    });
  }
};

export const estimatePricing = async (req, reply) => {
  try {
    const { itemsTotal, couponCode, orderType, deliveryInBag, latitude, longitude, deliveryMode, deliverySlot, tipAmount, giftPackagingFee, useWallet, useGreenPoints } = req.body;
    const subtotal = toNumber(itemsTotal, 0);

    const config = await PricingConfig.findOneAndUpdate(
      { key: "primary" },
      { $setOnInsert: DEFAULT_PRICING_CONFIG },
      { upsert: true, new: true }
    );

    let userId = null;
    try {
      const authHeader = req.headers["authorization"];
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        userId = decoded.userId;
      }
    } catch (e) {
      // Ignore token verification errors for pricing estimation
    }

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

      if (coupon && coupon.oncePerUser && userId) {
        const { Order } = await import("../models/index.js");
        const existingOrder = await Order.findOne({
          customer: userId,
          couponCode: coupon.code,
          status: { $ne: "cancelled" }
        });
        if (existingOrder) {
          coupon = null;
        }
      }

      if (coupon && coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
        coupon = null;
      }
    }

    let walletBalance = 0;
    if (useWallet && userId) {
      const { Customer } = await import("../models/user.js");
      const customer = await Customer.findById(userId).select("walletBalance");
      walletBalance = customer?.walletBalance || 0;
    }

    let greenPointsBalance = 0;
    let greenPointsConfig = null;
    if (useGreenPoints && userId) {
      const { default: GP } = await import("../models/greenPoints.js");
      const { default: GPC } = await import("../models/greenPointsConfig.js");
      const record = await GP.findOne({ customer: userId });
      greenPointsBalance = record?.totalBalance || 0;
      greenPointsConfig = await GPC.getConfig();
    }

    const estimate = calculateFees(config, subtotal, coupon, orderType, Boolean(deliveryInBag), tipAmount, giftPackagingFee, walletBalance, useGreenPoints, greenPointsBalance, greenPointsConfig);

    let slotPromotion = null;
    let slotPromoDiscount = 0;

    if (deliveryMode === "slot" && deliverySlot && latitude !== undefined && longitude !== undefined) {
      const lat = Number(latitude);
      const lng = Number(longitude);

      // Auto-deactivate expired slot promotions
      await SlotPromotion.updateMany(
        { isActive: true, expiresAt: { $lte: new Date() } },
        { $set: { isActive: false } }
      );

      const activePromos = await SlotPromotion.find({
        isActive: true,
        expiresAt: { $gt: new Date() }
      });

      const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
        const R = 6371e3;
        const phi1 = (lat1 * Math.PI) / 180;
        const phi2 = (lat2 * Math.PI) / 180;
        const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
        const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
        const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      };

      const matchingPromo = activePromos.find(promo => {
        const promoLng = promo.location.coordinates[0];
        const promoLat = promo.location.coordinates[1];
        const distance = getDistanceMeters(lat, lng, promoLat, promoLng);
        if (distance > promo.radiusMeters) return false;

        const timeMatch = deliverySlot.toLowerCase().includes(promo.slotLabel.toLowerCase());
        const dayMatch = !promo.dayLabel || deliverySlot.toLowerCase().includes(promo.dayLabel.toLowerCase());
        return timeMatch && dayMatch;
      });

      if (matchingPromo) {
        slotPromotion = {
          promoId: matchingPromo._id,
          promotionType: matchingPromo.promotionType,
          discountAmount: matchingPromo.promotionType === "discount" ? matchingPromo.discountAmount : 0,
          giftName: matchingPromo.promotionType === "gift" ? matchingPromo.giftName : ""
        };

        if (slotPromotion.promotionType === "discount" && slotPromotion.discountAmount > 0) {
          slotPromoDiscount = slotPromotion.discountAmount;
          estimate.grandTotal = Math.max(0, estimate.grandTotal - slotPromoDiscount);
        }
      }
    }

    estimate.slotPromotion = slotPromotion;
    estimate.slotPromoDiscount = slotPromoDiscount;

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
      speedDeliveryEnabled: body.speedDeliveryEnabled !== undefined ? Boolean(body.speedDeliveryEnabled) : true,
      choiceDeliveryFee: Math.max(0, toNumber(body.choiceDeliveryFee, 40)),
      choiceFreeDeliveryEnabled: body.choiceFreeDeliveryEnabled !== undefined ? Boolean(body.choiceFreeDeliveryEnabled) : true,
      choiceFreeDeliveryThreshold: Math.max(0, toNumber(body.choiceFreeDeliveryThreshold, 499)),
      promiseProtectEnabled: Boolean(body.promiseProtectEnabled),
      promiseProtectFee: Math.max(0, toNumber(body.promiseProtectFee, 0)),
      deliveryBagEnabled: Boolean(body.deliveryBagEnabled),
      deliveryBagFee: Math.max(0, toNumber(body.deliveryBagFee, 0)),
      smallCartFeeEnabled: Boolean(body.smallCartFeeEnabled),
      smallCartThreshold: Math.max(0, toNumber(body.smallCartThreshold, 0)),
      smallCartFee: Math.max(0, toNumber(body.smallCartFee, 0)),
      rainSurgeEnabled: Boolean(body.rainSurgeEnabled),
      rainSurgeFee: Math.max(0, toNumber(body.rainSurgeFee, 0)),
      lateNightFeeEnabled: Boolean(body.lateNightFeeEnabled),
      lateNightStartTime: String(body.lateNightStartTime || "23:00"),
      lateNightEndTime: String(body.lateNightEndTime || "05:00"),
      lateNightFee: Math.max(0, toNumber(body.lateNightFee, 0)),
      defaultDriverEarning: Math.max(0, toNumber(body.defaultDriverEarning, 30)),
      defaultDriverCodLimit: Math.max(0, toNumber(body.defaultDriverCodLimit, 2000)),
      driverEarningMode: body.driverEarningMode === "distance" ? "distance" : "flat",
      driverRateAmount: Math.max(0, toNumber(body.driverRateAmount, 0)),
      driverRateUnit: body.driverRateUnit === "100m" ? "100m" : "km",
      driverBaseEarning: Math.max(0, toNumber(body.driverBaseEarning, 0)),
      driverMinEarning: Math.max(0, toNumber(body.driverMinEarning, 0)),
      driverMaxEarning: Math.max(0, toNumber(body.driverMaxEarning, 0)),
      driverIncentiveEnabled: Boolean(body.driverIncentiveEnabled),
      driverIncentiveAmount: Math.max(0, toNumber(body.driverIncentiveAmount, 0)),
      driverIncentiveSlots: sanitizeIncentiveSlots(body.driverIncentiveSlots),
      rewardCoinsEnabled: body.rewardCoinsEnabled !== undefined ? Boolean(body.rewardCoinsEnabled) : true,
      rewardCoinsPercentage: Math.max(0, toNumber(body.rewardCoinsPercentage, 1)),
      minAmountForCoins: Math.max(0, toNumber(body.minAmountForCoins, 1)),
      customFees: sanitizeCustomFees(body.customFees),
      cartBarColor: String(body.cartBarColor || "#1A1A1A").trim(),
      choiceCartBarColor: String(body.choiceCartBarColor || "#6D28D9").trim(),
      etaColor: String(body.etaColor || "#1A1A1A").trim(),
      footerStyle: sanitizeFooterStyle(body.footerStyle),
      cartBarAnimationStyle: sanitizeAnimationStyle(body.cartBarAnimationStyle),
      cartBarStyle: sanitizeCartBarStyle(body.cartBarStyle),
      checkoutStyle: body.checkoutStyle === "unified" ? "unified" : "standard",
      choiceCheckoutStyle: body.choiceCheckoutStyle === "unified" ? "unified" : "standard",
      primaryColor: body.primaryColor || "#4CAF50",
      deliverySlots: body.deliverySlots || DEFAULT_PRICING_CONFIG.deliverySlots,
      companyUpiId: String(body.companyUpiId || "").trim(),
      companyName: String(body.companyName || "SabJab").trim(),
      hideRazorpayTopbar: body.hideRazorpayTopbar !== undefined ? Boolean(body.hideRazorpayTopbar) : false,
      qrCodeAmountPrefill: body.qrCodeAmountPrefill !== undefined ? Boolean(body.qrCodeAmountPrefill) : true,
      driverQrMode: body.driverQrMode === "razorpay" ? "razorpay" : "direct_upi",
      consumerOnlinePaymentMode: body.consumerOnlinePaymentMode || "razorpay",
      gstDetailsEnabled: body.gstDetailsEnabled !== undefined ? Boolean(body.gstDetailsEnabled) : false,
      giftPackagingFee: body.giftPackagingFee !== undefined ? Math.max(0, toNumber(body.giftPackagingFee, 30)) : 30,
      themeWaveEffectEnabled: body.themeWaveEffectEnabled !== undefined ? Boolean(body.themeWaveEffectEnabled) : false,
      walletSystemEnabled: body.walletSystemEnabled !== undefined ? Boolean(body.walletSystemEnabled) : true,
    };

    const config = await PricingConfig.findOneAndUpdate(
      { key: "primary" },
      { $set: update },
      { upsert: true, new: true, runValidators: true }
    );

    return reply.send(config);
  } catch (error) {
    console.error("❌ PRICE CONFIG UPDATE ERROR:", error);
    return reply.status(500).send({
      message: "Failed to update pricing config",
      error: error.message,
    });
  }
};

export const checkSlotPromotions = async (req, reply) => {
  try {
    const { latitude, longitude } = req.query;
    if (latitude === undefined || longitude === undefined) {
      return reply.status(400).send({ message: "latitude and longitude are required query parameters" });
    }

    const lat = Number(latitude);
    const lng = Number(longitude);

    // Auto-deactivate expired slot promotions
    await SlotPromotion.updateMany(
      { isActive: true, expiresAt: { $lte: new Date() } },
      { $set: { isActive: false } }
    );

    const activePromos = await SlotPromotion.find({
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
      const R = 6371e3;
      const phi1 = (lat1 * Math.PI) / 180;
      const phi2 = (lat2 * Math.PI) / 180;
      const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
      const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;
      const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const nearbyPromos = activePromos.filter(promo => {
      const promoLng = promo.location.coordinates[0];
      const promoLat = promo.location.coordinates[1];
      const distance = getDistanceMeters(lat, lng, promoLat, promoLng);
      return distance <= promo.radiusMeters;
    });

    return reply.send(nearbyPromos);
  } catch (error) {
    return reply.status(500).send({
      message: "Failed to check slot promotions",
      error: error.message
    });
  }
};
