import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const occasionSchema = new mongoose.Schema({}, { strict: false });
const Occasion = mongoose.model('Occasion', occasionSchema);

async function checkOccasions() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB.");

        const occasions = await Occasion.find({ isActive: true });
        console.log(`Found ${occasions.length} active occasions:`);

        occasions.forEach(o => {
            console.log(`- ${o.name}: Icon: ${o.icon}, Image: ${o.image}, ThemeColor: ${o.themeColor}`);
        });

        process.exit(0);
    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

checkOccasions();
