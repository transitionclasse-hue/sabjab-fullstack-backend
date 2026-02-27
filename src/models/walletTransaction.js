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
            const update = {};
            if (doc.txnType === "delivery_fee" || doc.txnType === "payout" || doc.txnType === "referral_bonus") {
                // Wallet balance updates (Atomic $inc)
                const change = doc.type === "credit" ? doc.amount : -doc.amount;
                update.$inc = { walletBalance: change };
                console.log(`[WalletSync] ATOMIC_WALLET_START: ${doc.txnType} | Amt: ${change} | Driver: ${doc.deliveryPartner}`);
            } else if (doc.txnType === "cod_collection" || doc.txnType === "cod_settlement") {
                // Cash in hand updates (Atomic $inc)
                const change = doc.txnType === "cod_collection" ? doc.amount : -doc.amount;
                update.$inc = { cashInHand: change };
                console.log(`[WalletSync] ATOMIC_CASH_START: ${doc.txnType} | Amt: ${change} | Driver: ${doc.deliveryPartner}`);
            }

            if (Object.keys(update).length > 0) {
                const updatedDriver = await DeliveryPartner.findByIdAndUpdate(
                    doc.deliveryPartner,
                    update,
                    { new: true }
                );
                if (updatedDriver) {
                    console.log(`[WalletSync] ATOMIC_SUCCESS: Driver ${doc.deliveryPartner} | Wallet: ${updatedDriver.walletBalance} | Cash: ${updatedDriver.cashInHand}`);
                } else {
                    console.warn(`[WalletSync] ATOMIC_FAIL: Driver ${doc.deliveryPartner} not found`);
                }
            }
        }

        if (doc.customer) {
            const change = doc.type === "credit" ? doc.amount : -doc.amount;
            const updatedCustomer = await Customer.findByIdAndUpdate(
                doc.customer,
                { $inc: { walletBalance: change } },
                { new: true }
            );
            if (updatedCustomer) {
                console.log(`[WalletSync] ATOMIC_CUSTOMER_SUCCESS: Customer ${doc.customer} | New Balance: ${updatedCustomer.walletBalance}`);
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
