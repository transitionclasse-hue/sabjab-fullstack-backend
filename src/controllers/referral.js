import Referral from "../models/referral.js";
import GreenPointsConfig from "../models/greenPointsConfig.js";
import GreenPoints from "../models/greenPoints.js";
import { Customer } from "../models/user.js";
import WalletTransaction from "../models/walletTransaction.js";

// =====================================================
// GENERATE REFERRAL CODE
// =====================================================
export const generateReferralCode = async (req, reply) => {
  try {
    const { userId } = req.user;

    // Check if user already has a code
    const existing = await Referral.findOne({ referrer: userId });

    if (existing) {
      return reply.send({
        success: true,
        referralCode: existing.referralCode,
        expiresAt: existing.expiresAt,
      });
    }

    const config = await GreenPointsConfig.getConfig();

    // Create new referral
    const referral = await Referral.createReferral(
      userId,
      config.earnRules.referral.pointsPerReferral,
      config.earnRules.referral.bonusForReferee
    );

    return reply.send({
      success: true,
      message: "Referral code generated",
      referralCode: referral.referralCode,
      expiresAt: referral.expiresAt,
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      message: "Failed to generate referral code",
      error: error.message,
    });
  }
};

// =====================================================
// GET REFERRAL INFO
// =====================================================
export const getReferralInfo = async (req, reply) => {
  try {
    const { userId } = req.user;

    const referral = await Referral.findOne({ referrer: userId });

    if (!referral) {
      return reply.send({
        success: true,
        hasCode: false,
        referralCode: null,
      });
    }

    // Fetch all customers referred by this user
    const referredUsers = await Customer.find({ referredBy: userId })
      .select("name phone email createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const config = await GreenPointsConfig.getConfig();
    const isSignupTrigger = config?.earnRules?.referral?.trigger === "signup";

    const referredUsersWithStatus = await Promise.all(
      referredUsers.map(async (u) => {
        if (isSignupTrigger) {
          return {
            name: u.name || "Friend",
            phone: u.phone ? String(u.phone).replace(/(\d{3})\d+(\d{3})/, "$1****$2") : "N/A",
            joinedAt: u.createdAt,
            status: "Coins Credited"
          };
        } else {
          const Order = (await import("../models/order.js")).default;
          const orderCount = await Order.countDocuments({ customer: u._id, status: "delivered" });
          return {
            name: u.name || "Friend",
            phone: u.phone ? String(u.phone).replace(/(\d{3})\d+(\d{3})/, "$1****$2") : "N/A",
            joinedAt: u.createdAt,
            status: orderCount > 0 ? "Coins Credited" : "Joined (Pending Purchase)"
          };
        }
      })
    );

    return reply.send({
      success: true,
      hasCode: true,
      referralCode: referral.referralCode,
      status: referral.status,
      pointsEarned: referral.referrerPoints,
      createdAt: referral.createdAt,
      expiresAt: referral.expiresAt,
      referredUsers: referredUsersWithStatus,
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      message: "Failed to fetch referral info",
      error: error.message,
    });
  }
};

// =====================================================
// APPLY REFERRAL CODE (During signup)
// =====================================================
export const applyReferralCode = async (req, reply) => {
  try {
    const { referralCode, refereeId } = req.body;

    if (!referralCode || !refereeId) {
      return reply.code(400).send({
        message: "Referral code and referee ID are required",
      });
    }

    // Find referral
    const referral = await Referral.findOne({
      referralCode: referralCode.toUpperCase(),
    });

    if (!referral) {
      return reply.code(404).send({
        message: "Invalid referral code",
      });
    }

    // Check if referee already has a referrer
    const referee = await Customer.findById(refereeId);
    if (!referee) {
      return reply.code(404).send({
        message: "Referee customer not found",
      });
    }

    if (referee.referredBy) {
      return reply.code(400).send({
        message: "You have already applied a referral code",
      });
    }

    // Check if expired
    if (new Date() > referral.expiresAt) {
      referral.status = "expired";
      await referral.save();
      return reply.code(400).send({
        message: "This referral code has expired",
      });
    }

    // Check if referrer is trying to use their own code
    if (referral.referrer.toString() === refereeId) {
      return reply.code(400).send({
        message: "You cannot use your own referral code",
      });
    }

    // Get config
    const config = await GreenPointsConfig.getConfig();
    const referralSettings = config.earnRules.referral;

    // Link customer
    await Customer.findByIdAndUpdate(refereeId, {
      referredBy: referral.referrer,
    });

    // AWARD LOGIC
    if (referralSettings.trigger === "signup") {
      const awardToReferrer = ["referrer", "both"].includes(referralSettings.awardTo);
      const awardToReferee = ["referee", "both"].includes(referralSettings.awardTo);

      let referrerPointsAwarded = 0;
      let refereePointsAwarded = 0;

      if (awardToReferrer) {
        // Green Points
        const referrerGP = await GreenPoints.getOrCreate(referral.referrer);
        await referrerGP.earnPoints(
          "referral",
          referral.referrerPoints,
          "Referral bonus",
          referralCode
        );
        await Customer.findByIdAndUpdate(referral.referrer, {
          greenPointsBalance: referrerGP.totalBalance,
        });

        // SabJab Coins (WalletTransaction)
        await WalletTransaction.create({
          customer: referral.referrer,
          amount: referral.referrerPoints,
          type: "credit",
          txnType: "referral_bonus",
          description: `Referral bonus for inviting ${referee.name || referee.phone || 'a friend'}`,
          status: "completed"
        });

        referrerPointsAwarded = referral.referrerPoints;
      }

      if (awardToReferee) {
        // Green Points
        const refereeGP = await GreenPoints.getOrCreate(refereeId);
        await refereeGP.earnPoints(
          "referral",
          referral.refereePoints,
          "Referral sign-up bonus",
          referralCode
        );
        await Customer.findByIdAndUpdate(refereeId, {
          greenPointsBalance: refereeGP.totalBalance,
        });

        // SabJab Coins (WalletTransaction)
        await WalletTransaction.create({
          customer: refereeId,
          amount: referral.refereePoints,
          type: "credit",
          txnType: "referral_bonus",
          description: `Referral sign-up bonus`,
          status: "completed"
        });

        refereePointsAwarded = referral.refereePoints;
      }

      return reply.send({
        success: true,
        message: "Referral applied and rewards granted",
        referrerPointsAwarded,
        refereePointsAwarded,
      });
    }

    // If trigger is purchase, just link and return
    return reply.send({
      success: true,
      message: "Referral code applied. Rewards will be granted after your first purchase!",
      referrerPointsAwarded: 0,
      refereePointsAwarded: 0,
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      message: "Failed to apply referral code",
      error: error.message,
    });
  }
};

// =====================================================
// GET REFERRAL STATS
// =====================================================
export const getReferralStats = async (req, reply) => {
  try {
    const { userId } = req.user;

    const stats = await Referral.aggregate([
      {
        $match: { referrer: userId },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const referral = await Referral.findOne({ referrer: userId });

    return reply.send({
      success: true,
      totalReferred: stats.find((s) => s._id === "used")?.count || 0,
      codeStatus: referral?.status || "none",
      pointsEarned: referral?.referrerPoints || 0,
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      message: "Failed to fetch referral stats",
      error: error.message,
    });
  }
};
