import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: false, // null if broadcast to all
        },
        title: {
            type: String,
            required: true,
        },
        body: {
            type: String,
            required: true,
        },
        data: {
            type: Object,
            default: {},
        },
        status: {
            type: String,
            enum: ["pending", "sent", "failed"],
            default: "pending",
        },
        type: {
            type: String,
            enum: ["broadcast", "individual"],
            default: "individual",
        },
        sentAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

export const Notification = mongoose.model("Notification", notificationSchema);
