import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './src/models/products.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://transitionclasse_db_user:devu1234@cluster0.7chsse0.mongodb.net/sabjab";

async function cleanDescriptions() {
  try {
    console.log("🌱 Connecting to MongoDB...");
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected securely!");

    // Find all products containing Blinkit or Seeded in description
    const products = await Product.find({
      $or: [
        { description: { $regex: /blinkit/i } },
        { description: { $regex: /seeded/i } }
      ]
    });

    console.log(`Found ${products.length} products with Blinkit or Seeded in description.`);

    let updatedCount = 0;
    for (const product of products) {
      const oldDesc = product.description;
      
      // Extract pack size from existing description if possible, otherwise use quantity
      let size = product.quantity || '1 unit';
      const match = oldDesc.match(/Pack size:\s*([^\n\r]+)/i);
      if (match && match[1]) {
        size = match[1].trim();
        // Remove trailing "only" if it exists
        size = size.replace(/\s*only\.?$/i, '');
      }

      const newDesc = `Pack size: ${size} only.`;

      product.description = newDesc;
      await product.save();
      
      console.log(`Updated [${product.name}]:`);
      console.log(`  OLD: "${oldDesc.replace(/\n/g, ' ')}"`);
      console.log(`  NEW: "${newDesc}"`);
      updatedCount++;
    }

    console.log(`\n✅ Successfully cleaned descriptions for ${updatedCount} products!`);

  } catch (err) {
    console.error("❌ Error cleaning descriptions:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from DB.");
    process.exit(0);
  }
}

cleanDescriptions();
