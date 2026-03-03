import mongoose from "mongoose";

const suggestionSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
    },
    brandName: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "reviewed", "added", "rejected"],
        default: "pending",
    },
    rewardCoins: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Suggestion = mongoose.model("Suggestion", suggestionSchema);

export default Suggestion;
