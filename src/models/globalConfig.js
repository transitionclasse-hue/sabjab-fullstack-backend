import mongoose from "mongoose";

const globalConfigSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true },
        value: { type: mongoose.Schema.Types.Mixed, required: true },
        description: { type: String },
    },
    { timestamps: true }
);

const GlobalConfig = mongoose.model("GlobalConfig", globalConfigSchema);

export default GlobalConfig;
