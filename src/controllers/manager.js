import { Order, DeliveryPartner, Branch, Customer } from "../models/index.js";
import GreenPointsConfig from "../models/greenPointsConfig.js";
import GreenPoints from "../models/greenPoints.js";
import Referral from "../models/referral.js";

const parseBool = (v) => String(v).toLowerCase() === "true";

export const getManagerOverview = async (req, reply) => {
  try {
    const [totalOrders, activeOrders, deliveredOrders, customers, drivers] = await Promise.all([
      Order.countDocuments({}),
      Order.countDocuments({ status: { $in: ["available", "assigned", "confirmed", "arriving", "at_location"] } }),
      Order.countDocuments({ status: "delivered" }),
      Customer.countDocuments({}),
      DeliveryPartner.countDocuments({}),
    ]);

    return reply.send({
      totalOrders,
      activeOrders,
      deliveredOrders,
      totalCustomers: customers,
      totalDrivers: drivers,
    });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch overview", error: error.message });
  }
};

export const getManagerOrders = async (req, reply) => {
  try {
    const { status, activeOnly } = req.query || {};
    const query = {};
    if (status) query.status = status;
    if (parseBool(activeOnly)) query.status = { $in: ["available", "assigned", "confirmed", "arriving", "at_location"] };

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("customer branch items.item deliveryPartner");

    return reply.send(orders);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch orders", error: error.message });
  }
};

export const getManagerDrivers = async (req, reply) => {
  try {
    const drivers = await DeliveryPartner.find({}).sort({ createdAt: -1 }).populate("branch");
    return reply.send(drivers);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch drivers", error: error.message });
  }
};

export const assignDriverByManager = async (req, reply) => {
  try {
    const { orderId } = req.params;
    const { driverId } = req.body || {};

    const [order, driver] = await Promise.all([
      Order.findById(orderId),
      DeliveryPartner.findById(driverId),
    ]);

    if (!order) return reply.status(404).send({ message: "Order not found" });
    if (!driver) return reply.status(404).send({ message: "Driver not found" });

    order.deliveryPartner = driver._id;
    order.status = order.status === "available" ? "confirmed" : order.status;
    order.deliveryPersonLocation = {
      latitude: driver.liveLocation?.latitude ?? order.pickupLocation?.latitude,
      longitude: driver.liveLocation?.longitude ?? order.pickupLocation?.longitude,
      address: "Assigned from Manager App",
    };
    await order.save();

    const populatedOrder = await Order.findById(order._id).populate(
      "customer branch items.item deliveryPartner"
    );

    req.server.io.to(String(order._id)).emit("orderConfirmed", populatedOrder);
    req.server.io.to(String(order._id)).emit("liveTrackingUpdates", {
      ...populatedOrder.toObject(),
      deliveryPartnerName: populatedOrder?.deliveryPartner?.name || "Delivery Partner",
    });
    req.server.io.emit("admin:order-assigned", {
      orderId: String(order._id),
      orderNumber: order.orderId,
      driverName: populatedOrder?.deliveryPartner?.name || "Delivery Partner",
    });

    return reply.send(populatedOrder);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to assign driver", error: error.message });
  }
};

export const updateOrderStatusByManager = async (req, reply) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return reply.code(404).send({ message: "Order not found" });
    }

    order.status = status;
    await order.save();

    const populatedOrder = await Order.findById(order._id).populate(
      "customer branch items.item deliveryPartner"
    );

    req.server.io.to(String(order._id)).emit("liveTrackingUpdates", {
      ...populatedOrder.toObject(),
      status,
    });

    return reply.send(populatedOrder);
  } catch (error) {
    return reply.code(500).send({ message: "Failed to update order status", error });
  }
};

export const getManagerBranches = async (req, reply) => {
  try {
    const branches = await Branch.find({}).sort({ name: 1 }).populate("deliveryPartners");
    return reply.send(branches);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch branches", error: error.message });
  }
};

export const getManagerCustomers = async (req, reply) => {
  try {
    const customers = await Customer.find()
      .select("-password -otp -otpExpires")
      .sort({ createdAt: -1 })
      .lean();

    // Add order statistics for each customer
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const [totalOrders, totalSpent] = await Promise.all([
          Order.countDocuments({ customer: customer._id }),
          Order.aggregate([
            { $match: { customer: customer._id, status: "delivered" } },
            { $group: { _id: null, total: { $sum: "$totalPrice" } } }
          ])
        ]);

        return {
          ...customer,
          totalOrders: totalOrders || 0,
          totalSpent: totalSpent[0]?.total || 0,
        };
      })
    );

    return reply.send(customersWithStats);
  } catch (error) {
    return reply.code(500).send({ message: "Failed to fetch customers", error });
  }
};

// =====================================================
// GREEN POINTS MANAGEMENT
// =====================================================
export const getGreenPointsConfig = async (req, reply) => {
  try {
    let config = await GreenPointsConfig.findOne({});
    
    if (!config) {
      // Return default config if none exists
      return reply.send({
        earnRules: [],
        redeemRules: [],
        settings: {
          enabled: true,
          minRedemptionPoints: 50,
          bonusPerReferral: 10,
        },
      });
    }

    return reply.send(config);
  } catch (error) {
    return reply.code(500).send({ message: "Failed to fetch green points config", error });
  }
};

export const updateGreenPointsConfig = async (req, reply) => {
  try {
    const { earnRules, redeemRules, settings } = req.body;

    let config = await GreenPointsConfig.findOne({});

    if (!config) {
      config = new GreenPointsConfig({
        earnRules: earnRules || [],
        redeemRules: redeemRules || [],
        settings: settings || {},
      });
    } else {
      if (earnRules) config.earnRules = earnRules;
      if (redeemRules) config.redeemRules = redeemRules;
      if (settings) config.settings = { ...config.settings, ...settings };
    }

    await config.save();

    return reply.send({
      message: "Green points config updated successfully",
      config,
    });
  } catch (error) {
    return reply.code(500).send({ message: "Failed to update green points config", error });
  }
};

export const getGreenPointsStats = async (req, reply) => {
  try {
    const [
      totalGreenPoints,
      totalRedeemed,
      totalTransactions,
      topEarners,
    ] = await Promise.all([
      GreenPoints.aggregate([
        { $group: { _id: null, total: { $sum: "$totalBalance" } } },
      ]),
      GreenPoints.aggregate([
        {
          $group: {
            _id: null,
            total: {
              $sum: {
                $reduce: {
                  input: "$transactions",
                  initialValue: 0,
                  in: {
                    $cond: [
                      { $eq: ["$$this.type", "redeem"] },
                      { $add: ["$$value", "$$this.amount"] },
                      "$$value",
                    ],
                  },
                },
              },
            },
          },
        },
      ]),
      GreenPoints.countDocuments({}),
      GreenPoints.aggregate([
        { $sort: { totalBalance: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "customers",
            localField: "customer",
            foreignField: "_id",
            as: "customerInfo",
          },
        },
        {
          $project: {
            customer: { $arrayElemAt: ["$customerInfo.name", 0] },
            balance: "$totalBalance",
            lifetime: "$lifetime",
          },
        },
      ]),
    ]);

    return reply.send({
      totalGreenPointsInSystem: totalGreenPoints[0]?.total || 0,
      totalPointsRedeemed: totalRedeemed[0]?.total || 0,
      totalUsersWithPoints: totalTransactions,
      topEarners,
    });
  } catch (error) {
    return reply.code(500).send({ message: "Failed to fetch green points stats", error });
  }
};

// =====================================================
// REFERRAL MANAGEMENT
// =====================================================
export const getReferralStats = async (req, reply) => {
  try {
    const [
      totalReferrals,
      activeReferralCodes,
      redeemedCodes,
      pendingBonuses,
      topReferrers,
      recentReferrals,
    ] = await Promise.all([
      Referral.countDocuments({}),
      Referral.countDocuments({ status: "active" }),
      Referral.countDocuments({ status: "redeemed" }),
      Referral.countDocuments({ "bonusDetails.status": "pending" }),
      Referral.aggregate([
        { $sort: { usageCount: -1 } },
        { $limit: 10 },
        {
          $lookup: {
            from: "customers",
            localField: "customer",
            foreignField: "_id",
            as: "customerInfo",
          },
        },
        {
          $project: {
            code: 1,
            customerId: "$customer",
            name: { $arrayElemAt: ["$customerInfo.name", 0] },
            referrals: "$usageCount",
            earned: { $multiply: ["$usageCount", 10] },
          },
        },
      ]),
      Referral.find({})
        .limit(20)
        .populate("customer", "name")
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const recentFormatted = recentReferrals.map((ref) => ({
      code: ref.code,
      referrer: ref.customer?.name || "Unknown",
      status: ref.status,
      date: ref.createdAt?.toISOString().split("T")[0],
      bonus: 10,
    }));

    return reply.send({
      totalReferrals,
      activeReferralCodes,
      redeemedCodes,
      pendingBonuses,
      avgConversionRate: totalReferrals > 0 ? ((redeemedCodes / totalReferrals) * 100).toFixed(1) : 0,
      topReferrers,
      recentReferrals: recentFormatted,
    });
  } catch (error) {
    return reply.code(500).send({ message: "Failed to fetch referral stats", error });
  }
};

export const getAllReferralCodes = async (req, reply) => {
  try {
    const codes = await Referral.find({})
      .populate("customer", "name")
      .sort({ createdAt: -1 })
      .lean();

    const formatted = codes.map((code) => ({
      code: code.code,
      customerId: code.customer._id,
      name: code.customer.name,
      created: code.createdAt?.toISOString().split("T")[0],
      used: code.usageCount || 0,
      unused: 0,
      status: code.status,
    }));

    return reply.send(formatted);
  } catch (error) {
    return reply.code(500).send({ message: "Failed to fetch referral codes", error });
  }
};
