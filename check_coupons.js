import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { Coupon } from './src/models/coupon.js';

dotenv.config();

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/SabJabDB';
    console.log('Connecting to Mongo:', mongoUri);
    await mongoose.connect(mongoUri);
    console.log('Connected!');

    const coupons = await Coupon.find({});
    console.log(`Found ${coupons.length} coupons in database:`);
    coupons.forEach(c => {
      console.log(`- Code: ${c.code}, Active: ${c.isActive}, Hidden: ${c.isHidden}, MinOrder: ${c.minOrderAmount}, Exp: ${c.expirationDate}`);
    });
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

run();
