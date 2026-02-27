import mongoose from 'mongoose';
import 'dotenv/config';

// Import Admin model directly using the same path as the app
const adminSchema = new mongoose.Schema({
    name: { type: String },
    role: { type: String, default: 'Admin' },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
}, { timestamps: true, strict: false });

const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

async function checkAdmin() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('❌ MONGO_URI not found in .env');
        process.exit(1);
    }

    try {
        await mongoose.connect(uri);
        console.log('✅ Connected to MongoDB');

        const admin = await Admin.findOne({ email: 'admin@sabjab.com' });
        if (admin) {
            console.log('👤 Admin found:');
            console.log('Email:', admin.email);
            console.log('Password in DB:', admin.password);
            console.log('Role:', admin.role);
        } else {
            console.log('❌ Admin not found for email: admin@sabjab.com');
        }

        const allAdmins = await Admin.find({});
        console.log(`\n📊 Total Admins in DB: ${allAdmins.length}`);
        allAdmins.forEach(a => console.log(`- ${a.email} (${a.role})`));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

checkAdmin();
