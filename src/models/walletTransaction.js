import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            // required: true, // Removed required:true to support Driver transactions
        },
        deliveryPartner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "DeliveryPartner",
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
        },
        amount: { type: Number, required: true },
        type: {
            type: String,
            enum: ["credit", "debit"],
            required: true,
        },
        txnType: {
            type: String,
            enum: ["delivery_fee", "cod_collection", "cod_settlement", "payout", "customer_order", "refund", "referral_bonus", "green_points_redemption"],
            default: "customer_order",
        },
        status: {
            type: String,
            enum: ["pending", "completed", "failed", "refunded"],
            default: "completed",
        },
        description: { type: String },
        txnId: {
            type: String,
            unique: true,
            sparse: true,
        },
        meta: { type: mongoose.Schema.Types.Mixed },
    },
    { timestamps: true }
);

// Automatic Balance Synchronization Hook
walletTransactionSchema.post("save", async function (doc) {
    if (doc.status !== "completed") return;

    try {
        const { Customer, DeliveryPartner } = await import("./user.js");

        if (doc.deliveryPartner) {
            const driver = await DeliveryPartner.findById(doc.deliveryPartner);
            if (driver) {
                if (doc.txnType === "delivery_fee" || doc.txnType === "payout" || doc.txnType === "referral_bonus") {
                    // Wallet balance updates
                    const change = doc.type === "credit" ? doc.amount : -doc.amount;
                    driver.walletBalance = (driver.walletBalance || 0) + change;
                } else if (doc.txnType === "cod_collection" || doc.txnType === "cod_settlement") {
                    // Cash in hand updates
                    const change = doc.txnType === "cod_collection" ? doc.amount : -doc.amount;
                    driver.cashInHand = (driver.cashInHand || 0) + change;
                }
                await driver.save();
                console.log(`[WalletSync] Updated Driver ${driver._id} balance. Wallet: ${driver.walletBalance}, Cash: ${driver.cashInHand}`);
            }
        }

        if (doc.customer) {
            const customer = await Customer.findById(doc.customer);
            if (customer) {
                const change = doc.type === "credit" ? doc.amount : -doc.amount;
                customer.walletBalance = (customer.walletBalance || 0) + change;
                await customer.save();
                console.log(`[WalletSync] Updated Customer ${customer._id} wallet balance: ${customer.walletBalance}`);
            }
        }
    } catch (error) {
        console.error("[WalletSync] Error in post-save hook:", error.message);
    }
});

walletTransactionSchema.index({ customer: 1, createdAt: -1 });
walletTransactionSchema.index({ deliveryPartner: 1, createdAt: -1 });

const WalletTransaction = mongoose.model(
    "WalletTransaction",
    walletTransactionSchema
);

export default WalletTransaction;
