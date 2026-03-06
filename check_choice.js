import mongoose from 'mongoose';
import Occasion from './src/models/occasion.js';

async function checkChoice() {
    try {
        await mongoose.connect('mongodb://localhost:27017/SabJabDB');
        const choice = await Occasion.findOne({ name: 'Choice' });
        console.log(JSON.stringify(choice, null, 2));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkChoice();
