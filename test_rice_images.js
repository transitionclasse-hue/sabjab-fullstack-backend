import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/products.js";
import SubCategory from "./src/models/subCategory.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://transitionclasse_db_user:devu1234@cluster0.7chsse0.mongodb.net/sabjab";

async function testImages() {
  try {
    await mongoose.connect(MONGO_URI);
    const sub = await SubCategory.findOne({ name: "Rice" });
    if (!sub) {
      console.log("Subcategory Rice not found.");
      return;
    }

    const products = await Product.find({ subCategory: sub._id });
    console.log(`Checking images of a random sample of 10 products out of ${products.length}...`);

    // Shuffle products
    const shuffled = products.sort(() => 0.5 - Math.random());
    const sample = shuffled.slice(0, 10);

    for (const p of sample) {
      try {
        const res = await fetch(p.image, { method: "HEAD" });
        console.log(`- [${p.name}]: ${res.status === 200 ? "✅ 200 OK" : "❌ " + res.status} (${p.image})`);
      } catch (err) {
        console.log(`- [${p.name}]: ❌ Error (${err.message}) (${p.image})`);
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

testImages();
