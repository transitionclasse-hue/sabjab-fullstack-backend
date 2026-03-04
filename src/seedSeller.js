import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Seller } from './models/user.js';

dotenv.config();

const createDemoSeller = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        const existing = await Seller.findOne({ email: 'demo@seller.com' });
        if (existing) {
            console.log("Demo seller already exists!");
            process.exit(0);
        }

        const seller = new Seller({
            name: "Demo Seller",
            email: "demo@seller.com",
            password: "password123",
            phone: "9876543210",
            businessName: "Demo Store",
            role: "Seller",
            isApproved: true,
            phoneVerified: true,
        });

        await seller.save();
        console.log("Successfully created demo seller!");
        console.log("Email: demo@seller.com");
        console.log("Password: password123");

        process.exit(0);
    } catch (error) {
        console.error("Error creating demo seller:", error);
        process.exit(1);
    }
};

createDemoSeller();
