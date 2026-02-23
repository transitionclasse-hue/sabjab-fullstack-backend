import mongoose from "mongoose";

const supportMessageSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true,
        },
        sender: {
            type: String,
            enum: ["customer", "support"],
            required: true,
        },
        message: { type: String, required: true },
        isRead: { type: Boolean, default: false },
    },
    { timestamps: true }
);

supportMessageSchema.index({ customer: 1, createdAt: -1 });

const SupportMessage = mongoose.model("SupportMessage", supportMessageSchema);

export default SupportMessage;
