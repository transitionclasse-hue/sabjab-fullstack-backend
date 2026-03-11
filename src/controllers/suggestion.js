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

export const getWinners = async (req, reply) => {
    try {
        const winners = await Suggestion.find({ isWinner: true })
            .populate("customer", "name")
            .sort({ createdAt: -1 })
            .limit(10);
        
        // Format for frontend (mask names slightly like "Rahul S.")
        const formatted = winners.map(w => ({
            id: w._id,
            name: w.customer?.name ? `${w.customer.name.split(' ')[0]} ${w.customer.name.split(' ')[1]?.[0] || ''}.`.trim() : "User",
            prize: `${w.rewardCoins} SabJab Coins`,
            product: w.brandName,
            date: w.createdAt
        }));

        return reply.send({ success: true, winners: formatted });
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
        const { coins, isWinner, status } = req.body; // How many coins to reward

        const sug = await Suggestion.findById(id);
        if (!sug) return reply.status(404).send({ message: "Not found" });

        if (status) sug.status = status;
        else sug.status = "reviewed";

        if (isWinner !== undefined) sug.isWinner = isWinner;
        
        sug.rewardCoins = coins || 0;
        await sug.save();

        if (coins > 0 && !sug.rewardSent) {
            const customer = await Customer.findById(sug.customer);
            if (customer) {
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
                sug.rewardSent = true;
                await sug.save();
            }
        }

        return reply.send({ success: true, message: "Suggestion approved and rewarded" });
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred", error: error.message });
    }
};
