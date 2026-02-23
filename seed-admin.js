import mongoose from 'mongoose';
import { Admin } from './src/models/user.js';

const MONGO_URI = 'mongodb://localhost:27017/sabjab';

async function createAdmin() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: 'admin@sabjab.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }
    
    // Create admin user
    const admin = new Admin({
      email: 'admin@sabjab.com',
      password: 'admin123',
      role: 'Admin',
      isActivated: true
    });
    
    await admin.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@sabjab.com');
    console.log('Password: admin123');
    
    mongoose.connection.close();
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

createAdmin();
