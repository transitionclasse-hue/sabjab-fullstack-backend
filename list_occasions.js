import mongoose from 'mongoose';
import Occasion from './src/models/occasion.js';

async function listOccasions() {
    const timeout = setTimeout(() => {
        console.error('Timeout connecting to MongoDB');
        process.exit(1);
    }, 10000);

    try {
        await mongoose.connect('mongodb://localhost:27017/SabJabDB');
        const occasions = await Occasion.find({}).select('name _id');
        console.log(JSON.stringify(occasions, null, 2));
        await mongoose.disconnect();
        clearTimeout(timeout);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

listOccasions();
