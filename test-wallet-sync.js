import mongoose from "mongoose";
import dotenv from "dotenv";
import WalletTransaction from "./src/models/walletTransaction.js";
import { DeliveryPartner } from "./src/models/user.js";

dotenv.config();

const runTest = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/sabjab", {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to DB");

        const driver = await DeliveryPartner.findOne();
        if (!driver) {
            console.log("No driver found.");
            process.exit(1);
        }
        console.log("Found driver:", driver._id, "walletBalance:", driver.walletBalance);

        const feeTxn = await WalletTransaction.create({
            deliveryPartner: driver._id,
            amount: 45,
            type: "credit",
            txnType: "delivery_fee",
            description: `Test Delivery fee`,
            status: "completed"
        });

        console.log("Created feeTxn:", feeTxn._id);

        // Check if wallet balance was updated
        const updatedDriver = await DeliveryPartner.findById(driver._id);
        console.log("Updated driver walletBalance:", updatedDriver.walletBalance);

        process.exit(0);
    } catch (err) {
        console.error("Test error:", err);
        process.exit(1);
    }
};

runTest();
