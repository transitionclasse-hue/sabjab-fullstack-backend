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

walletTransactionSchema.index({ customer: 1, createdAt: -1 });
walletTransactionSchema.index({ deliveryPartner: 1, createdAt: -1 });

const WalletTransaction = mongoose.model(
    "WalletTransaction",
    walletTransactionSchema
);

export default WalletTransaction;
