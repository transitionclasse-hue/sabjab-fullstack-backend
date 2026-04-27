import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

async function reset() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  const { DeliveryPartner } = await import('./src/models/user.js');

  const hash = await bcrypt.hash('12345678', 10);
  const result = await DeliveryPartner.updateMany({}, { password: hash });
  
  console.log(`Updated ${result.modifiedCount} drivers to password: 12345678`);
  process.exit(0);
}

reset().catch(console.error);
