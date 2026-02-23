import { Customer } from "../models/user.js";
import WalletTransaction from "../models/walletTransaction.js";

export const getWalletBalance = async (req, reply) => {
    try {
        const userId = req.user.userId;
        const customer = await Customer.findById(userId).select("walletBalance");

        if (!customer) {
            return reply.status(404).send({ message: "Customer not found" });
        }

        return reply.send({
            success: true,
            balance: customer.walletBalance || 0,
        });
    } catch (error) {
        console.error("Get Wallet Balance Error:", error);
        return reply.status(500).send({ message: "Failed to fetch wallet balance" });
    }
};

export const getWalletTransactions = async (req, reply) => {
    try {
        const userId = req.user.userId;
        const transactions = await WalletTransaction.find({ customer: userId })
            .sort({ createdAt: -1 })
            .limit(20);

        return reply.send({
            success: true,
            transactions,
        });
    } catch (error) {
        console.error("Get Wallet Transactions Error:", error);
        return reply.status(500).send({ message: "Failed to fetch wallet transactions" });
    }
};
