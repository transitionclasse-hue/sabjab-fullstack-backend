import Suggestion from "../models/suggestion.js";
import WalletTransaction from "../models/walletTransaction.js";
import { Customer } from "../models/user.js";

export const createSuggestion = async (req, reply) => {
    try {
        const { brandName } = req.body;
        const userId = req.user.userId; // From token

        if (!brandName || brandName.trim().length < 3) {
            return reply.status(400).send({ message: "Invalid brand suggestion" });
        }

        const suggestion = new Suggestion({
            customer: userId,
            brandName: brandName.trim(),
        });

        await suggestion.save();
        return reply.code(201).send({ success: true, message: "Suggestion received!", suggestion });
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred", error: error.message });
    }
};

export const getMySuggestions = async (req, reply) => {
    try {
        const userId = req.user.userId;
        const suggestions = await Suggestion.find({ customer: userId }).sort({ createdAt: -1 });
        return reply.send({ success: true, suggestions });
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred", error: error.message });
    }
};

// Manager: approve and reward
export const approveSuggestion = async (req, reply) => {
    try {
        const { id } = req.params;
        const { coins } = req.body; // How many coins to reward

        const sug = await Suggestion.findById(id);
        if (!sug) return reply.status(404).send({ message: "Not found" });

        sug.status = "reviewed";
        sug.rewardCoins = coins || 50;
        await sug.save();

        if (coins > 0) {
            const customer = await Customer.findById(sug.customer);
            customer.walletBalance += Number(coins);
            await customer.save();

            // Record transaction
            const txn = new WalletTransaction({
                customer: sug.customer,
                amount: Number(coins),
                type: "credit",
                txnType: "manual_adjustment",
                description: `Reward for suggesting brand: ${sug.brandName}`,
                status: "completed",
            });
            await txn.save();
        }

        return reply.send({ success: true, message: "Suggestion approved and rewarded" });
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred", error: error.message });
    }
};
