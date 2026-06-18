import { Customer } from "../models/user.js";
import WalletTransaction from "../models/walletTransaction.js";
import PricingConfig from "../models/pricingConfig.js";

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

export const getSabjabCoinsBalance = async (req, reply) => {
    try {
        const userId = req.user.userId;
        const customer = await Customer.findById(userId).select("sabjabCoinsBalance");
        const pricingConfig = await PricingConfig.findOne() || {};

        return reply.send({
            success: true,
            balance: customer?.sabjabCoinsBalance || 0,
            conversionRatio: pricingConfig.sabjabCoinsToRupeesRatio || 0,
        });
    } catch (error) {
        return reply.status(500).send({ message: "Failed to fetch sabjab coins balance" });
    }
};

export const redeemSabjabCoins = async (req, reply) => {
    try {
        const userId = req.user.userId;
        const { coinsToRedeem } = req.body;

        if (!coinsToRedeem || coinsToRedeem <= 0) {
            return reply.status(400).send({ message: "Invalid amount of coins to redeem" });
        }

        const pricingConfig = await PricingConfig.findOne() || {};
        const ratio = pricingConfig.sabjabCoinsToRupeesRatio || 0;

        if (ratio <= 0) {
            return reply.status(400).send({ message: "Coin redemption is currently disabled by the admin" });
        }

        const customer = await Customer.findById(userId);
        if (!customer) return reply.status(404).send({ message: "Customer not found" });

        if ((customer.sabjabCoinsBalance || 0) < coinsToRedeem) {
            return reply.status(400).send({ message: "Insufficient SabJab coins" });
        }

        const rupeesToCredit = (coinsToRedeem / ratio);

        // Deduct Coins
        customer.sabjabCoinsBalance -= coinsToRedeem;
        await customer.save();

        // Credit Wallet
        const newWalletTxn = new WalletTransaction({
            customer: userId,
            amount: rupeesToCredit,
            type: "credit",
            txnType: "reward_coins", // or something similar
            description: `Converted ${coinsToRedeem} SabJab Coins to Wallet Rupees`,
            status: "completed",
        });
        await newWalletTxn.save();

        return reply.send({
            success: true,
            message: `Successfully redeemed ${coinsToRedeem} coins for ₹${rupeesToCredit.toFixed(2)}`,
            sabjabCoinsBalance: customer.sabjabCoinsBalance,
        });
    } catch (error) {
        console.error("Redeem SabJab Coins Error:", error);
        return reply.status(500).send({ message: "Failed to redeem SabJab coins" });
    }
};
