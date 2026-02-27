import { Order, DeliveryPartner, Branch, Customer, Product, Category, Occasion, HomeComponent, Payout, WalletTransaction } from "../models/index.js";
import GreenPointsConfig from "../models/greenPointsConfig.js";
import GreenPoints from "../models/greenPoints.js";
import Referral from "../models/referral.js";
import { expireStaleAssignedOrders } from "./order/order.js";

const parseBool = (v) => String(v).toLowerCase() === "true";

export const getManagerOverview = async (req, reply) => {
  try {
    await expireStaleAssignedOrders(req.server.io);
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
    await expireStaleAssignedOrders(req.server.io);
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
    order.status = "assigned";
    order.assignedAt = new Date();
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
    req.server.io.emit("admin:order-status-update", {
      orderId: String(order._id),
      status: "assigned",
      orderNumber: order.orderId,
    });
    req.server.io.to(String(driver._id)).emit("driver:order-assigned", {
      order: populatedOrder,
    });
    req.server.io.to(String(driver._id)).emit("driver:order-status-update", {
      orderId: String(order._id),
      status: "assigned",
      order: populatedOrder,
      orderNumber: order.orderId,
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
    req.server.io.emit("admin:order-status-update", {
      orderId: String(order._id),
      status,
      orderNumber: populatedOrder.orderId,
    });
    if (order.deliveryPartner) {
      req.server.io.to(String(order.deliveryPartner)).emit("driver:order-status-update", {
        orderId: String(order._id),
        status,
        order: populatedOrder,
        orderNumber: populatedOrder.orderId,
      });
    }

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
const safeDate = (d) => {
  try {
    if (!d) return "N/A";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "N/A";
    return date.toISOString().split("T")[0];
  } catch (e) {
    return "N/A";
  }
};


export const getManagerAnalytics = async (req, reply) => {
  try {
    const { range } = req.query || { range: '7d' };
    const days = range === '90d' ? 90 : range === '30d' ? 30 : 7;

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const prevStartDate = new Date(startDate.getTime() - days * 24 * 60 * 60 * 1000);

    // Basic Metrics (Current Period)
    const currentStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: "delivered" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
          totalOrders: { $sum: 1 },
          customerIds: { $addToSet: "$customer" }
        }
      }
    ]);

    // Basic Metrics (Previous Period)
    const prevStats = await Order.aggregate([
      { $match: { createdAt: { $gte: prevStartDate, $lt: startDate }, status: "delivered" } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
          totalOrders: { $sum: 1 },
          customerIds: { $addToSet: "$customer" }
        }
      }
    ]);

    const curr = currentStats[0] || { totalRevenue: 0, totalOrders: 0, customerIds: [] };
    const prev = prevStats[0] || { totalRevenue: 0, totalOrders: 0, customerIds: [] };

    const calcChange = (c, p) => p === 0 ? (c > 0 ? 100 : 0) : Math.round(((c - p) / p) * 100);

    // Chart Data (Daily breakdown)
    const dateMap = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const key = d.toISOString().split('T')[0];
      dateMap[key] = {
        label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        revenue: 0,
        orders: 0
      };
    }

    const dailyStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: "delivered" } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 }
        }
      }
    ]);

    dailyStats.forEach(stat => {
      if (dateMap[stat._id]) {
        dateMap[stat._id].revenue = stat.revenue;
        dateMap[stat._id].orders = stat.orders;
      }
    });

    const chartKeys = Object.keys(dateMap).sort();

    // Category Breakdown
    const categoryStats = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: "delivered" } },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.item",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: "$productInfo" },
      {
        $lookup: {
          from: "categories",
          localField: "productInfo.category",
          foreignField: "_id",
          as: "categoryInfo"
        }
      },
      { $unwind: "$categoryInfo" },
      {
        $group: {
          _id: "$categoryInfo.name",
          count: { $sum: "$items.quantity" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Top Products
    const topProducts = await Order.aggregate([
      { $match: { createdAt: { $gte: startDate }, status: "delivered" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.item",
          sales: { $sum: "$items.quantity" }
        }
      },
      { $sort: { sales: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productInfo"
        }
      },
      { $unwind: { path: "$productInfo", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          name: { $ifNull: ["$productInfo.name", "Unknown Item"] },
          sales: 1
        }
      }
    ]);

    const activeCustomers = curr.customerIds.length;
    const prevActiveCustomers = prev.customerIds.length;
    const avgOrderValue = curr.totalOrders > 0 ? Math.round(curr.totalRevenue / curr.totalOrders) : 0;
    const prevAvgOrderValue = prev.totalOrders > 0 ? Math.round(prev.totalRevenue / prev.totalOrders) : 0;

    return reply.send({
      totalRevenue: curr.totalRevenue,
      revenueChange: calcChange(curr.totalRevenue, prev.totalRevenue),
      totalOrders: curr.totalOrders,
      ordersChange: calcChange(curr.totalOrders, prev.totalOrders),
      avgOrderValue,
      aovChange: calcChange(avgOrderValue, prevAvgOrderValue),
      activeCustomers,
      customersChange: calcChange(activeCustomers, prevActiveCustomers),
      ordersChart: {
        labels: chartKeys.map(k => dateMap[k].label),
        data: chartKeys.map(k => dateMap[k].orders)
      },
      revenueChart: {
        labels: chartKeys.map(k => dateMap[k].label),
        data: chartKeys.map(k => dateMap[k].revenue)
      },
      categoryChart: {
        labels: categoryStats.map(c => c._id),
        data: categoryStats.map(c => c.count)
      },
      topProducts
    });

  } catch (error) {
    console.error("Analytics Error:", error);
    return reply.status(500).send({ message: "Failed to fetch analytics", error: error.message });
  }
};

export const getReferralStats = async (req, reply) => {
  try {
    console.log("Fetching Manager Referral Stats [SAFE_MODE]...");

    // Use individual catches to identify exactly which query fails
    const totalReferrals = await Referral.countDocuments({}).catch(err => {
      console.error("Error in totalReferrals count:", err);
      return 0;
    });

    const activeReferralCodes = await Referral.countDocuments({ status: "active" }).catch(err => {
      console.error("Error in activeReferralCodes count:", err);
      return 0;
    });

    const redeemedCodes = await Referral.countDocuments({ status: "used" }).catch(err => {
      console.error("Error in redeemedCodes count:", err);
      return 0;
    });

    const pendingBonuses = await Referral.countDocuments({ bonusesAwarded: false, status: "used" }).catch(err => {
      console.error("Error in pendingBonuses count:", err);
      return 0;
    });

    const topReferrersRaw = await Referral.aggregate([
      {
        $group: {
          _id: "$referrer",
          referralCode: { $first: "$referralCode" },
          usageCount: { $sum: { $cond: [{ $eq: ["$status", "used"] }, 1, 0] } },
        },
      },
      { $sort: { usageCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "customers",
          localField: "_id",
          foreignField: "_id",
          as: "customerInfo",
        },
      },
    ]).catch(err => {
      console.error("Error in topReferrers aggregation:", err);
      return [];
    });

    const topReferrers = (topReferrersRaw || []).map(item => ({
      code: item.referralCode || "N/A",
      customerId: item._id,
      name: item.customerInfo?.[0]?.name || "Unknown User",
      referrals: item.usageCount || 0,
      earned: (item.usageCount || 0) * 10,
    }));

    const recentReferrals = await Referral.find({})
      .limit(20)
      .populate("referrer", "name")
      .sort({ createdAt: -1 })
      .lean()
      .catch(err => {
        console.error("Error in recentReferrals find:", err);
        return [];
      });

    const recentFormatted = (recentReferrals || []).map((ref) => {
      try {
        return {
          code: ref.referralCode || "UNKNOWN",
          referrer: ref.referrer?.name || (typeof ref.referrer === 'string' ? "ID: " + ref.referrer : "Unknown User"),
          status: ref.status || "active",
          date: safeDate(ref.createdAt),
          bonus: 10,
        };
      } catch (e) {
        return { code: "ERR", referrer: "Error", status: "active", date: "N/A", bonus: 0 };
      }
    });

    const result = {
      totalReferrals,
      activeReferralCodes,
      redeemedCodes,
      pendingBonuses,
      avgConversionRate: totalReferrals > 0 ? ((redeemedCodes / totalReferrals) * 100).toFixed(1) : 0,
      topReferrers,
      recentReferrals: recentFormatted,
    };

    return reply.send(result);
  } catch (error) {
    console.error("CRITICAL Referral Stats Error:", error);
    return reply.status(200).send({
      totalReferrals: 0,
      activeReferralCodes: 0,
      redeemedCodes: 0,
      pendingBonuses: 0,
      avgConversionRate: "0.0",
      topReferrers: [],
      recentReferrals: [],
      _debug_error: error.message
    });
  }
};

export const getAllReferralCodes = async (req, reply) => {
  try {
    console.log("Fetching All Referral Codes [SAFE_MODE]...");
    const codes = await Referral.find({})
      .populate("referrer", "name")
      .sort({ createdAt: -1 })
      .lean()
      .catch(err => {
        console.error("Error fetching referral codes list:", err);
        return [];
      });

    const formatted = (codes || []).map((code) => {
      try {
        return {
          code: code.referralCode || "N/A",
          customerId: code.referrer?._id || code.referrer || null,
          name: code.referrer?.name || (typeof code.referrer === 'string' ? 'ID: ' + code.referrer : "Unknown"),
          created: safeDate(code.createdAt),
          used: code.status === "used" ? 1 : 0,
          unused: code.status === "active" ? 1 : 0,
          status: code.status || "active",
        };
      } catch (e) {
        return { code: "ERR", name: "Error", status: "error" };
      }
    });

    return reply.send(formatted);
  } catch (error) {
    console.error("CRITICAL All Referral Codes Error:", error);
    return reply.status(200).send([]);
  }
};


// =====================================================
// HOME LAYOUT & COMPONENT MANAGEMENT
// =====================================================

export const getManagerOccasions = async (req, reply) => {
  try {
    const occasions = await Occasion.find({}).sort({ order: 1 }).populate("components");
    return reply.send(occasions);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch occasions", error: error.message });
  }
};

export const getManagerHomeComponents = async (req, reply) => {
  try {
    const components = await HomeComponent.find({}).lean();
    return reply.send(components);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch components", error: error.message });
  }
};

export const createManagerOccasion = async (req, reply) => {
  try {
    const { name, icon, banner, themeColor, themeMode, nameAlignment, isDefault } = req.body;

    // If setting as default, unset others
    if (isDefault) {
      await Occasion.updateMany({}, { isDefault: false });
    }

    const occasion = new Occasion({
      name,
      icon,
      banner,
      themeColor,
      themeMode,
      nameAlignment,
      isDefault,
      order: (await Occasion.countDocuments({})) + 1
    });

    await occasion.save();
    return reply.status(201).send(occasion);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to create occasion", error: error.message });
  }
};

export const updateManagerOccasion = async (req, reply) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (updateData.isDefault) {
      await Occasion.updateMany({ _id: { $ne: id } }, { isDefault: false });
    }

    const occasion = await Occasion.findByIdAndUpdate(id, updateData, { new: true }).populate("components");
    if (!occasion) return reply.status(404).send({ message: "Occasion not found" });

    return reply.send(occasion);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to update occasion", error: error.message });
  }
};

export const deleteManagerOccasion = async (req, reply) => {
  try {
    const { id } = req.params;
    const occasion = await Occasion.findByIdAndDelete(id);
    if (!occasion) return reply.status(404).send({ message: "Occasion not found" });

    return reply.send({ message: "Occasion deleted successfully" });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to delete occasion", error: error.message });
  }
};

export const createManagerHomeComponent = async (req, reply) => {
  try {
    const { occasionId, ...componentData } = req.body;

    const component = new HomeComponent(componentData);
    await component.save();

    if (occasionId) {
      await Occasion.findByIdAndUpdate(occasionId, {
        $push: { components: component._id }
      });
    }

    return reply.status(201).send(component);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to create component", error: error.message });
  }
};

export const updateManagerHomeComponent = async (req, reply) => {
  try {
    const { id } = req.params;
    const component = await HomeComponent.findByIdAndUpdate(id, req.body, { new: true });
    if (!component) return reply.status(404).send({ message: "Component not found" });

    return reply.send(component);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to update component", error: error.message });
  }
};

export const deleteManagerHomeComponent = async (req, reply) => {
  try {
    const { id } = req.params;
    const component = await HomeComponent.findByIdAndDelete(id);
    if (!component) return reply.status(404).send({ message: "Component not found" });

    // Also remove from all occasions
    await Occasion.updateMany({}, { $pull: { components: id } });

    return reply.send({ message: "Component deleted successfully" });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to delete component", error: error.message });
  }
};

// =====================================================
// DRIVER FINANCIAL MANAGEMENT & REPORTING
// =====================================================

export const getManagerDriverFinance = async (req, reply) => {
  try {
    const drivers = await DeliveryPartner.find({ isActive: true }).lean();

    const driversWithStats = await Promise.all(
      drivers.map(async (driver) => {
        // 1. Pending Payout (Completed delivery fees not yet paid out)
        // We look for 'delivery_fee' transactions that haven't been 'payout'ed
        // For simplicity in this implementation, we calculate current wallet balance for earnings
        const earningsTxns = await WalletTransaction.find({
          deliveryPartner: driver._id,
          txnType: "delivery_fee",
          status: "completed"
        }).lean();

        const payoutTxns = await WalletTransaction.find({
          deliveryPartner: driver._id,
          txnType: "payout",
          status: "completed"
        }).lean();

        const totalEarned = earningsTxns.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        const totalPaid = payoutTxns.reduce((sum, tx) => sum + (tx.amount || 0), 0);
        const pendingPayout = Math.max(0, totalEarned - totalPaid);

        // 2. Cash in Hand (Net COD collection)
        const codTxns = await WalletTransaction.find({
          deliveryPartner: driver._id,
          txnType: { $in: ["cod_collection", "cod_settlement"] },
          status: "completed"
        }).lean();

        const cashInHand = codTxns.reduce((sum, tx) => {
          if (tx.txnType === "cod_collection") return sum + (tx.amount || 0);
          if (tx.txnType === "cod_settlement") return sum - (tx.amount || 0);
          return sum;
        }, 0);

        return {
          ...driver,
          pendingPayout,
          cashInHand: Math.max(0, cashInHand),
          totalLifetimeEarnings: totalEarned
        };
      })
    );

    return reply.send(driversWithStats);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch driver finance", error: error.message });
  }
};

export const settleDriverCod = async (req, reply) => {
  try {
    const { id } = req.params;
    const { amount, description } = req.body;

    if (!amount || amount <= 0) {
      return reply.status(400).send({ message: "Invalid settlement amount" });
    }

    const transaction = new WalletTransaction({
      deliveryPartner: id,
      amount: amount,
      type: "debit",
      txnType: "cod_settlement",
      status: "completed",
      description: description || "Manual COD settlement by manager"
    });

    await transaction.save();
    return reply.send({ message: "COD settled successfully", transaction });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to settle COD", error: error.message });
  }
};

export const bulkProcessPayout = async (req, reply) => {
  try {
    const { payouts } = req.body; // Array of { driverId, amount }

    if (!Array.isArray(payouts) || payouts.length === 0) {
      return reply.status(400).send({ message: "Invalid payouts data" });
    }

    const results = await Promise.all(
      payouts.map(async (p) => {
        try {
          const payout = new Payout({
            deliveryPartner: p.driverId,
            amount: p.amount,
            status: "completed",
            completedAt: new Date(),
            meta: { processedBy: "manager_bulk" }
          });
          await payout.save();

          const transaction = new WalletTransaction({
            deliveryPartner: p.driverId,
            amount: p.amount,
            type: "debit",
            txnType: "payout",
            status: "completed",
            description: "Bulk payout processed by manager"
          });
          await transaction.save();

          return { driverId: p.driverId, status: "success" };
        } catch (err) {
          return { driverId: p.driverId, status: "failed", error: err.message };
        }
      })
    );

    return reply.send({ message: "Bulk payout processing completed", results });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to process bulk payouts", error: error.message });
  }
};

export const getDriverDetailedReport = async (req, reply) => {
  try {
    const { id } = req.params;

    const [driver, transactions, payouts, orders] = await Promise.all([
      DeliveryPartner.findById(id).lean(),
      WalletTransaction.find({ deliveryPartner: id }).sort({ createdAt: -1 }).limit(50).lean(),
      Payout.find({ deliveryPartner: id }).sort({ createdAt: -1 }).limit(20).lean(),
      Order.find({ deliveryPartner: id }).sort({ createdAt: -1 }).limit(20).lean()
    ]);

    if (!driver) return reply.status(404).send({ message: "Driver not found" });

    return reply.send({
      driver,
      transactions,
      payouts,
      recentOrders: orders
    });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch driver report", error: error.message });
  }
};
