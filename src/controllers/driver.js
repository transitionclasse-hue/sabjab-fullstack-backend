import { Order, DeliveryPartner, Payout, WalletTransaction } from "../models/index.js";
import PricingConfig from "../models/pricingConfig.js";

const getDateRange = (filter) => {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  switch (filter) {
    case "Today":
      return { start, end: now };
    case "This Week":
      const day = start.getDay();
      const weekStart = new Date(start);
      weekStart.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
      return { start: weekStart, end: now };
    case "This Month":
      start.setDate(1);
      return { start, end: now };
    default:
      return null;
  }
};

export const getWalletStats = async (req, reply) => {
  try {
    const { userId } = req.user;
    const driver = await DeliveryPartner.findById(userId);
    if (!driver) {
      return reply.status(404).send({ message: "Driver not found" });
    }

    // Fetch all earnings transactions for the driver
    const earningsTxns = await WalletTransaction.find({
      deliveryPartner: userId,
      txnType: "delivery_fee",
      status: "completed"
    }).lean();

    const totalEarnings = earningsTxns.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const totalTrips = await Order.countDocuments({ deliveryPartner: userId, status: "delivered" });

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(todayStart);
    weekStart.setDate(todayStart.getDate() - (todayStart.getDay() === 0 ? 6 : todayStart.getDay() - 1));
    const monthStart = new Date(todayStart.getFullYear(), todayStart.getMonth(), 1);

    const todayEarnings = earningsTxns
      .filter((tx) => new Date(tx.createdAt) >= todayStart)
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const weekEarnings = earningsTxns
      .filter((tx) => new Date(tx.createdAt) >= weekStart)
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const monthEarnings = earningsTxns
      .filter((tx) => new Date(tx.createdAt) >= monthStart)
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      const dayEarnings = earningsTxns
        .filter((tx) => {
          const od = new Date(tx.createdAt);
          return od >= d && od < next;
        })
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);
      last7Days.push({ date: d.toISOString().slice(0, 10), amount: dayEarnings });
    }

    return reply.send({
      totalEarnings,
      totalTrips,
      todayEarnings,
      weekEarnings,
      monthEarnings,
      last7Days,
      currentWalletBalance: driver.walletBalance || 0,
      cashInHand: driver.cashInHand || 0,
    });
  } catch (error) {
    console.error("getWalletStats error:", error);
    return reply.status(500).send({ message: "Failed to fetch wallet stats", error: error.message });
  }
};

export const getPayouts = async (req, reply) => {
  try {
    const { userId } = req.user;
    const payouts = await Payout.find({ deliveryPartner: userId })
      .sort({ createdAt: -1 })
      .lean();

    const pending = payouts.filter((p) => p.status === "pending" || p.status === "processing");
    const history = payouts.filter((p) => p.status === "completed" || p.status === "failed");

    // Fetch actual unsettled earnings (balance owed to driver)
    const driver = await DeliveryPartner.findById(userId).select("walletBalance").lean();
    const pendingTotal = driver?.walletBalance > 0 ? driver.walletBalance : 0;

    return reply.send({
      pending: pending.map((p) => ({
        id: p._id,
        amount: p.amount,
        date: p.createdAt,
        status: p.status,
      })),
      history: history.map((p) => ({
        id: p._id,
        amount: p.amount,
        date: p.completedAt || p.createdAt,
        status: p.status,
        txnId: p.txnId,
      })),
      pendingTotal,
    });
  } catch (error) {
    console.error("getPayouts error:", error);
    return reply.status(500).send({ message: "Failed to fetch payouts", error: error.message });
  }
};

export const getBankAccount = async (req, reply) => {
  try {
    const { userId } = req.user;
    const driver = await DeliveryPartner.findById(userId).select("bankAccount").lean();
    if (!driver) {
      return reply.status(404).send({ message: "Driver not found" });
    }
    const bank = driver.bankAccount;
    const hasBankAccount = bank && (bank.bankName || bank.accountLast4 || bank.ifsc);
    return reply.send({
      hasBankAccount: !!hasBankAccount,
      bankName: bank?.bankName || null,
      accountLast4: bank?.accountLast4 || null,
      ifsc: bank?.ifsc || null,
    });
  } catch (error) {
    console.error("getBankAccount error:", error);
    return reply.status(500).send({ message: "Failed to fetch bank account", error: error.message });
  }
};

export const updateBankAccount = async (req, reply) => {
  try {
    const { userId } = req.user;
    const { bankName, accountNumber, ifsc } = req.body || {};
    if (!bankName || !accountNumber || !ifsc) {
      return reply.status(400).send({ message: "bankName, accountNumber, and ifsc are required" });
    }
    const last4 = String(accountNumber).slice(-4);
    const driver = await DeliveryPartner.findByIdAndUpdate(
      userId,
      {
        bankAccount: {
          bankName: String(bankName).trim(),
          accountLast4: last4,
          ifsc: String(ifsc).trim().toUpperCase(),
        },
      },
      { new: true }
    );
    if (!driver) {
      return reply.status(404).send({ message: "Driver not found" });
    }
    return reply.send({
      message: "Bank account updated",
      bankName: driver.bankAccount?.bankName,
      accountLast4: driver.bankAccount?.accountLast4,
      ifsc: driver.bankAccount?.ifsc,
    });
  } catch (error) {
    console.error("updateBankAccount error:", error);
    return reply.status(500).send({ message: "Failed to update bank account", error: error.message });
  }
};

export const getDriverStats = async (req, reply) => {
  try {
    const { userId } = req.user;
    const deliveredCount = await Order.countDocuments({ deliveryPartner: userId, status: "delivered" });
    const totalAssigned = await Order.countDocuments({ deliveryPartner: userId });
    const cancelledCount = await Order.countDocuments({
      deliveryPartner: userId,
      status: "cancelled",
    });
    const acceptanceRate = totalAssigned > 0 ? Math.round(((totalAssigned - cancelledCount) / totalAssigned) * 100) : 0;
    const cancellationRate = totalAssigned > 0 ? Math.round((cancelledCount / totalAssigned) * 100) : 0;

    return reply.send({
      totalDeliveries: deliveredCount,
      acceptanceRate,
      cancellationRate,
    });
  } catch (error) {
    console.error("getDriverStats error:", error);
    return reply.status(500).send({ message: "Failed to fetch driver stats", error: error.message });
  }
};

export const getCodStatus = async (req, reply) => {
  try {
    const { userId } = req.user;

    // Fetch driver to get custom codLimit
    const driver = await DeliveryPartner.findById(userId).select('codLimit');
    let COD_LIMIT = driver?.codLimit;

    if (COD_LIMIT === null || COD_LIMIT === undefined) {
      let config = await PricingConfig.findOne({ key: "primary" });
      if (!config) config = await PricingConfig.create({ key: "primary" });
      COD_LIMIT = config.defaultDriverCodLimit;
    }

    // Sum all cod_collection (liability increase) and subtract any cod_settlement (liability decrease)
    const txns = await WalletTransaction.find({
      deliveryPartner: userId,
      txnType: { $in: ["cod_collection", "cod_settlement"] },
      status: "completed"
    }).lean();

    const codCollected = txns.reduce((sum, tx) => {
      if (tx.txnType === "cod_collection") return sum + (tx.amount || 0);
      if (tx.txnType === "cod_settlement") return sum - (tx.amount || 0);
      return sum;
    }, 0);

    return reply.send({ collected: Math.max(0, codCollected), limit: COD_LIMIT });
  } catch (error) {
    console.error("getCodStatus error:", error);
    return reply.status(500).send({ message: "Failed to fetch COD status", error: error.message });
  }
};
export const updatePushToken = async (req, reply) => {
  try {
    const { userId } = req.user;
    const { pushToken } = req.body || {};

    if (!pushToken) {
      return reply.status(400).send({ message: "pushToken is required" });
    }

    const driver = await DeliveryPartner.findByIdAndUpdate(
      userId,
      { pushToken },
      { new: true }
    );

    if (!driver) {
      return reply.status(404).send({ message: "Driver not found" });
    }

    return reply.send({ message: "Push token updated successfully", pushToken: driver.pushToken });
  } catch (error) {
    console.error("updatePushToken error:", error);
    return reply.status(500).send({ message: "Failed to update push token", error: error.message });
  }
};
export const updateNotificationSettings = async (req, reply) => {
  try {
    const { userId } = req.user;
    const { notificationsEnabled, notificationSound } = req.body || {};

    const updateData = {};
    if (typeof notificationsEnabled === "boolean") updateData.notificationsEnabled = notificationsEnabled;
    if (notificationSound) updateData.notificationSound = notificationSound;

    const driver = await DeliveryPartner.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    if (!driver) {
      return reply.status(404).send({ message: "Driver not found" });
    }

    return reply.send({
      message: "Settings updated successfully",
      notificationsEnabled: driver.notificationsEnabled,
      notificationSound: driver.notificationSound
    });
  } catch (error) {
    console.error("updateNotificationSettings error:", error);
    return reply.status(500).send({ message: "Failed to update settings", error: error.message });
  }
};

export const toggleOnlineStatus = async (req, reply) => {
  try {
    const { userId } = req.user;
    const { isOnline } = req.body;

    if (typeof isOnline !== "boolean") {
      return reply.status(400).send({ message: "isOnline (boolean) is required" });
    }

    const driver = await DeliveryPartner.findByIdAndUpdate(
      userId,
      { isOnline, lastSeen: new Date() },
      { new: true }
    );

    if (!driver) {
      return reply.status(404).send({ message: "Driver not found" });
    }

    return reply.send({
      message: `Driver is now ${isOnline ? "Online" : "Offline"}`,
      isOnline: driver.isOnline
    });
  } catch (error) {
    console.error("toggleOnlineStatus error:", error);
    return reply.status(500).send({ message: "Failed to toggle status", error: error.message });
  }
};
