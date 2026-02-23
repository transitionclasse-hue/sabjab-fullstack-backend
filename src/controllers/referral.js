import Referral from "../models/referral.js";
import GreenPointsConfig from "../models/greenPointsConfig.js";
import GreenPoints from "../models/greenPoints.js";
import { Customer } from "../models/user.js";

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

    const referral = await Referral.findOne({ referrer: userId }).populate({
      path: "referee",
      select: "name phone email",
    });

    if (!referral) {
      return reply.send({
        success: true,
        hasCode: false,
        referralCode: null,
      });
    }

    return reply.send({
      success: true,
      hasCode: true,
      referralCode: referral.referralCode,
      status: referral.status,
      referee: referral.referee ? { name: referral.referee.name, phone: referral.referee.phone } : null,
      pointsEarned: referral.referrerPoints,
      bonusAwarded: referral.bonusesAwarded,
      createdAt: referral.createdAt,
      expiresAt: referral.expiresAt,
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

    // Check if already used
    if (referral.status === "used") {
      return reply.code(400).send({
        message: "This referral code has already been used",
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

    // Mark as used
    await referral.markAsUsed(refereeId);

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
        referrerPointsAwarded = referral.referrerPoints;
      }

      if (awardToReferee) {
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
        refereePointsAwarded = referral.refereePoints;
      }

      // Mark bonuses as awarded in reference record
      await referral.markBonusesAwarded();

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
