import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
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
        status: {
            type: String,
            enum: ["pending", "completed", "failed", "refunded"],
            default: "completed",
        },
        description: { type: String },
        txnId: {
            type: String,
            unique: true,
        },
        meta: { type: mongoose.Schema.Types.Mixed },
    },
    { timestamps: true }
);

walletTransactionSchema.index({ customer: 1, createdAt: -1 });

const WalletTransaction = mongoose.model(
    "WalletTransaction",
    walletTransactionSchema
);

export default WalletTransaction;
