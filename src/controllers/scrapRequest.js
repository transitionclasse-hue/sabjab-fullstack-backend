import { ScrapRequest } from "../models/scrapRequest.js";
import { Address } from "../models/address.js";
import GreenPoints from "../models/greenPoints.js";
import GreenPointsConfig from "../models/greenPointsConfig.js";
import { Customer } from "../models/user.js";

// =====================================================
// CREATE PICKUP REQUEST
// =====================================================
export const createScrapRequest = async (req, reply) => {
  try {
    const { userId } = req.user;
    const { category, quantity, addressId, pickupDate, pickupSlot, notes } = req.body;

    if (!category || !quantity || !addressId || !pickupDate || !pickupSlot) {
      return reply.code(400).send({ message: "All fields are required" });
    }

    if (quantity <= 0) {
      return reply.code(400).send({ message: "Quantity must be greater than zero" });
    }

    // Verify address exists
    const address = await Address.findOne({ _id: addressId, customer: userId });
    if (!address) {
      return reply.code(404).send({ message: "Address not found" });
    }

    const scrapRequest = new ScrapRequest({
      customer: userId,
      category,
      quantity,
      address: addressId,
      pickupDate: new Date(pickupDate),
      pickupSlot,
      notes: notes || "",
      status: "pending",
    });

    await scrapRequest.save();

    return reply.send({
      success: true,
      message: "Scrap pickup requested successfully",
      scrapRequest,
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      message: "Failed to request scrap pickup",
      error: error.message,
    });
  }
};

// =====================================================
// GET CUSTOMER'S PICKUP REQUESTS
// =====================================================
export const getScrapRequests = async (req, reply) => {
  try {
    const { userId } = req.user;
    const requests = await ScrapRequest.find({ customer: userId })
      .populate("address")
      .sort({ createdAt: -1 });

    return reply.send({
      success: true,
      requests,
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      message: "Failed to fetch scrap requests",
      error: error.message,
    });
  }
};

// =====================================================
// CANCEL PICKUP REQUEST
// =====================================================
export const cancelScrapRequest = async (req, reply) => {
  try {
    const { userId } = req.user;
    const { id } = req.params;

    const request = await ScrapRequest.findOne({ _id: id, customer: userId });
    if (!request) {
      return reply.code(404).send({ message: "Pickup request not found" });
    }

    if (request.status === "completed") {
      return reply.code(400).send({ message: "Cannot cancel a completed pickup request" });
    }

    request.status = "cancelled";
    await request.save();

    return reply.send({
      success: true,
      message: "Pickup request cancelled successfully",
      request,
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      message: "Failed to cancel pickup request",
      error: error.message,
    });
  }
};

// =====================================================
// UPDATE STATUS (MANAGER/ADMIN USE - WITH ECO COINS AWARD)
// =====================================================
export const updateScrapRequestStatus = async (req, reply) => {
  try {
    const { id } = req.params;
    const { status, pointsAwarded } = req.body;

    const request = await ScrapRequest.findById(id);
    if (!request) {
      return reply.code(404).send({ message: "Pickup request not found" });
    }

    if (request.status === status) {
      return reply.code(400).send({ message: `Status is already ${status}` });
    }

    const previousStatus = request.status;
    request.status = status;

    // Award Eco Coins if status transitions to completed
    if (status === "completed" && previousStatus !== "completed") {
      // Calculate points dynamically from config rates if not explicitly passed
      let finalPoints = pointsAwarded;
      if (finalPoints === undefined || finalPoints === null) {
        const config = await GreenPointsConfig.getConfig();
        const categoryKey = request.category.replace(/_([a-z])/g, (m, c) => c.toUpperCase()); // snake to camel
        const rule = config.earnRules[categoryKey] || config.earnRules[request.category];
        const pointsPerUnit = rule?.pointsPerUnit || rule?.points || 0;
        finalPoints = Math.round(pointsPerUnit * request.quantity);
      }

      request.pointsAwarded = finalPoints;

      if (finalPoints > 0) {
        const greenPoints = await GreenPoints.getOrCreate(request.customer);
        const updated = await greenPoints.earnPoints(
          request.category,
          finalPoints,
          `Eco Coins earned from completed scrap pickup (${request.category.replace("_", " ")})`,
          request._id.toString()
        );

        // Sync to Customer profile
        await Customer.findByIdAndUpdate(request.customer, {
          greenPointsBalance: updated.totalBalance,
        });
      }
    }

    await request.save();

    return reply.send({
      success: true,
      message: `Pickup request status updated to ${status}`,
      request,
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      message: "Failed to update pickup request status",
      error: error.message,
    });
  }
};

// =====================================================
// GET ALL SCRAP REQUESTS (MANAGER/ADMIN USE)
// =====================================================
export const getAllScrapRequests = async (req, reply) => {
  try {
    const requests = await ScrapRequest.find({})
      .populate("customer", "name phone email")
      .populate("address")
      .sort({ createdAt: -1 });

    return reply.send({
      success: true,
      requests,
    });
  } catch (error) {
    req.log.error(error);
    return reply.code(500).send({
      message: "Failed to fetch all scrap requests",
      error: error.message,
    });
  }
};

