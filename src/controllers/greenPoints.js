import GreenPoints from "../models/greenPoints.js";
import GreenPointsConfig from "../models/greenPointsConfig.js";
import { Customer } from "../models/user.js";

// =====================================================
// GET BALANCE
// =====================================================
export const getGreenPointsBalance = async (req, reply) => {
  try {
    const { userId } = req.user;

    const greenPoints = await GreenPoints.findOne({ customer: userId });

    if (!greenPoints) {
      return reply.send({
        success: true,
        balance: 0,
        lifetime: 0,
        transactions: [],
      });
    }

    return reply.send({
      success: true,
      balance: greenPoints.totalBalance,
      lifetime: greenPoints.lifetime,
      transactions: greenPoints.transactions.slice(-20), // Last 20 transactions
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      message: "Failed to fetch green points balance",
      error: error.message,
    });
  }
};

// =====================================================
// EARN POINTS (Internal use by other controllers)
// =====================================================
export const earnGreenPoints = async (req, reply) => {
  try {
    const { userId } = req.user;
    const { category, amount, description, reference } = req.body;

    // Validate category
    const validCategories = [
      "plastic_bottles",
      "organic_waste",
      "eco_packaging",
      "referral",
      "sustainable_purchase",
      "community_events",
    ];

    if (!validCategories.includes(category)) {
      return reply.code(400).send({ message: "Invalid category" });
    }

    if (amount <= 0) {
      return reply.code(400).send({ message: "Amount must be positive" });
    }

    const greenPoints = await GreenPoints.getOrCreate(userId);
    const config = await GreenPointsConfig.getConfig();

    // Check max points per transaction
    if (amount > config.settings.maxPointsPerOrder) {
      return reply.code(400).send({
        message: `Cannot earn more than ${config.settings.maxPointsPerOrder} points per transaction`,
      });
    }

    const updated = await greenPoints.earnPoints(
      category,
      amount,
      description,
      reference
    );

    // Update customer record
    await Customer.findByIdAndUpdate(userId, {
      greenPointsBalance: updated.totalBalance,
    });

    return reply.send({
      success: true,
      message: "Points earned successfully",
      balance: updated.totalBalance,
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      message: "Failed to earn points",
      error: error.message,
    });
  }
};

// =====================================================
// REDEEM POINTS
// =====================================================
export const redeemGreenPoints = async (req, reply) => {
  try {
    const { userId } = req.user;
    const { rewardType, description, reference } = req.body;

    const config = await GreenPointsConfig.getConfig();
    const greenPoints = await GreenPoints.getOrCreate(userId);

    // Get redemption rule
    let redemptionRule = null;
    let pointsRequired = 0;

    switch (rewardType) {
      case "discount_50":
        redemptionRule = config.redeemRules.discount50;
        pointsRequired = redemptionRule.pointsRequired;
        break;
      case "discount_100":
        redemptionRule = config.redeemRules.discount100;
        pointsRequired = redemptionRule.pointsRequired;
        break;
      case "free_delivery":
        redemptionRule = config.redeemRules.freeDelivery;
        pointsRequired = redemptionRule.pointsRequired;
        break;
      case "eco_products":
        redemptionRule = config.redeemRules.ecoProductBundle;
        pointsRequired = redemptionRule.pointsRequired;
        break;
      case "tree_planted":
        redemptionRule = config.redeemRules.treePlanted;
        pointsRequired = redemptionRule.pointsRequired;
        break;
      default:
        return reply.code(400).send({ message: "Invalid reward type" });
    }

    if (!redemptionRule.enabled) {
      return reply.code(400).send({
        message: "This reward is currently unavailable",
      });
    }

    if (greenPoints.totalBalance < pointsRequired) {
      return reply.code(400).send({
        message: "Insufficient green points",
        required: pointsRequired,
        balance: greenPoints.totalBalance,
      });
    }

    const updated = await greenPoints.redeemPoints(
      rewardType,
      pointsRequired,
      description || redemptionRule.description,
      reference
    );

    // Update customer record
    await Customer.findByIdAndUpdate(userId, {
      greenPointsBalance: updated.totalBalance,
    });

    return reply.send({
      success: true,
      message: `Successfully redeemed ${rewardType}`,
      balance: updated.totalBalance,
      redeemDetails: redemptionRule,
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      message: "Failed to redeem points",
      error: error.message,
    });
  }
};

// =====================================================
// GET TRANSACTION HISTORY
// =====================================================
export const getGreenPointsHistory = async (req, reply) => {
  try {
    const { userId } = req.user;
    const { limit = 50, skip = 0 } = req.query;

    const greenPoints = await GreenPoints.findOne({ customer: userId });

    if (!greenPoints) {
      return reply.send({
        success: true,
        transactions: [],
        total: 0,
      });
    }

    const transactions = greenPoints.transactions
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(skip, skip + limit);

    return reply.send({
      success: true,
      transactions,
      total: greenPoints.transactions.length,
      limit: parseInt(limit),
      skip: parseInt(skip),
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      message: "Failed to fetch history",
      error: error.message,
    });
  }
};

// =====================================================
// GET CONFIG (For frontend to know current rates)
// =====================================================
export const getGreenPointsConfig = async (req, reply) => {
  try {
    const config = await GreenPointsConfig.getConfig();
    return reply.send({
      success: true,
      earnRules: config.earnRules,
      redeemRules: config.redeemRules,
      settings: config.settings,
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      message: "Failed to fetch config",
      error: error.message,
    });
  }
};
