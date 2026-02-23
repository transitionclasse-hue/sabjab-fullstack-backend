import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Customer, DeliveryPartner } from './src/models/user.js';
import Branch from './src/models/branch.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function seedDrivers() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('📦 Connected to MongoDB.');

        // Find any existing branch to attach the drivers to
        const branch = await Branch.findOne({});
        if (!branch) {
            console.error('❌ No branches found. Please run seedData.js first.');
            process.exit(1);
        }

        const driversData = [
            {
                name: "Ravi Kumar (SabJab Fleet)",
                email: "driver1@sabjab.com",
                password: "password123",
                phone: 9999999991,
                role: "DeliveryPartner",
                isActivated: true,
                branch: branch._id
            },
            {
                name: "Amit Sharma (SabJab Fleet)",
                email: "driver2@sabjab.com",
                password: "password123",
                phone: 9999999992,
                role: "DeliveryPartner",
                isActivated: true,
                branch: branch._id
            }
        ];

        console.log('🧹 Clearing old mock drivers...');
        await DeliveryPartner.deleteMany({}); // Wipe old test drivers

        console.log('🚀 Injecting Production Drivers...');
        await DeliveryPartner.insertMany(driversData);

        console.log('✅ Drivers successfully injected! You can now log into Frontend-Driver using:');
        console.log('Email: driver1@sabjab.com | Pass: password123');
        console.log('Email: driver2@sabjab.com | Pass: password123');

    } catch (error) {
        console.error('Error seeding drivers:', error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}

seedDrivers();
