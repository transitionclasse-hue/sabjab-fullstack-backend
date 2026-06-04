import SplitBill from "../models/splitBill.js";
import { Customer } from "../models/user.js";
import WalletTransaction from "../models/walletTransaction.js";

/**
 * Create a new Split Bill Request
 */
export const createSplitRequest = async (req, reply) => {
  try {
    const { payerId, amount, description } = req.body;
    const requesterId = req.user.userId;

    if (!payerId) {
      return reply.code(400).send({ message: "Payer ID is required" });
    }
    if (!amount || Number(amount) <= 0) {
      return reply.code(400).send({ message: "Valid amount is required" });
    }

    if (String(payerId) === String(requesterId)) {
      return reply.code(400).send({ message: "You cannot split a bill with yourself" });
    }

    // Verify payer exists
    const payer = await Customer.findById(payerId);
    if (!payer) {
      return reply.code(404).send({ message: "Payer not found" });
    }

    const splitRequest = new SplitBill({
      requester: requesterId,
      payer: payerId,
      amount: Number(amount),
      description: description || "Split Bill Request",
      status: "pending",
    });

    await splitRequest.save();

    const populated = await SplitBill.findById(splitRequest._id)
      .populate("requester", "name username phone email")
      .populate("payer", "name username phone email");

    return reply.code(201).send({ success: true, request: populated });
  } catch (error) {
    console.error("Error creating split request:", error);
    return reply.code(500).send({ message: "Failed to create split request", error: error.message });
  }
};

/**
 * Get incoming/outgoing split bill requests
 */
export const getSplitRequests = async (req, reply) => {
  try {
    const userId = req.user.userId;
    const { type } = req.query;

    let query = {};
    if (type === "incoming") {
      query = { payer: userId };
    } else if (type === "outgoing") {
      query = { requester: userId };
    } else {
      query = { $or: [{ requester: userId }, { payer: userId }] };
    }

    const requests = await SplitBill.find(query)
      .sort({ createdAt: -1 })
      .populate("requester", "name username phone email")
      .populate("payer", "name username phone email");

    return reply.send({ success: true, requests });
  } catch (error) {
    console.error("Error fetching split requests:", error);
    return reply.code(500).send({ message: "Failed to retrieve split requests", error: error.message });
  }
};

/**
 * Respond (accept/decline) to a split request
 */
export const respondToSplit = async (req, reply) => {
  try {
    const { requestId, action } = req.body;
    const userId = req.user.userId;

    if (!requestId || !action) {
      return reply.code(400).send({ message: "Request ID and Action are required" });
    }

    if (action !== "accept" && action !== "decline") {
      return reply.code(400).send({ message: "Invalid action. Use 'accept' or 'decline'" });
    }

    const request = await SplitBill.findById(requestId)
      .populate("requester", "name username walletBalance")
      .populate("payer", "name username walletBalance");

    if (!request) {
      return reply.code(404).send({ message: "Split request not found" });
    }

    // Ensure only the payer can respond to this request
    if (String(request.payer._id) !== String(userId)) {
      return reply.code(403).send({ message: "You are not authorized to respond to this request" });
    }

    if (request.status !== "pending") {
      return reply.code(400).send({ message: "This split request has already been processed" });
    }

    if (action === "decline") {
      request.status = "declined";
      await request.save();
      return reply.send({ success: true, message: "Split request declined successfully", request });
    }

    // Action is "accept": transact via wallet
    const payer = await Customer.findById(userId);
    if (payer.walletBalance < request.amount) {
      return reply.code(400).send({ message: "Insufficient wallet balance. Please load money." });
    }

    // Create Debit Transaction for Payer
    const debitTxn = new WalletTransaction({
      customer: payer._id,
      amount: request.amount,
      type: "debit",
      txnType: "split_bill",
      status: "completed",
      description: `Split bill paid to ${request.requester.name || request.requester.username}`,
    });

    // Create Credit Transaction for Requester
    const creditTxn = new WalletTransaction({
      customer: request.requester._id,
      amount: request.amount,
      type: "credit",
      txnType: "split_bill",
      status: "completed",
      description: `Split bill received from ${payer.name || payer.username}`,
    });

    // Save transactions (automatically adjusts customer walletBalances in walletTransaction.js post-save hooks)
    await Promise.all([debitTxn.save(), creditTxn.save()]);

    request.status = "accepted";
    await request.save();

    return reply.send({
      success: true,
      message: "Split request accepted and paid successfully!",
      request,
    });
  } catch (error) {
    console.error("Error responding to split request:", error);
    return reply.code(500).send({ message: "Failed to process response", error: error.message });
  }
};
