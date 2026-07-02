import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "./src/models/products.js";
import Category from "./src/models/category.js";
import SubCategory from "./src/models/subCategory.js";
import SuperCategory from "./src/models/superCategory.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://transitionclasse_db_user:devu1234@cluster0.7chsse0.mongodb.net/sabjab";


const scrapedProducts = [
  {
    "name": "L'Oreal Paris Hyaluron Moisture 72H Moisture Sealing Conditioner",
    "price": 225,
    "mrp": 345,
    "packSize": "175 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_513062.jpg"
  },
  {
    "name": "Dove Intense Repair Hair Conditioner",
    "price": 210,
    "mrp": 313,
    "packSize": "175 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_19640.jpg"
  },
  {
    "name": "L'Oreal Paris Glycolic Gloss Shine Sealing Conditioner",
    "price": 252,
    "mrp": 345,
    "packSize": "175 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_691347.jpg"
  },
  {
    "name": "Tresemme Keratin Smooth Conditioner",
    "price": 214,
    "mrp": 318,
    "packSize": "190 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_67402.jpg"
  },
  {
    "name": "Matrix Mega Smooth Shampoo + Conditioner Combo",
    "price": 651,
    "mrp": 765,
    "packSize": "200 ml + 100 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_629488.jpg"
  },
  {
    "name": "Pantene Miracle Rescue Collagen Repair Conditioner",
    "price": 218,
    "mrp": 290,
    "packSize": "200 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_609747.jpg"
  },
  {
    "name": "Mamaearth Onion Conditioner",
    "price": 149,
    "mrp": 149,
    "packSize": "100 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_604642.jpg"
  },
  {
    "name": "Plum Soft & Shiny Hair Duo Shampoo & Conditioner",
    "price": 578,
    "mrp": 665,
    "packSize": "2 pcs",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_561049.jpg"
  },
  {
    "name": "Dove Dryness Care Conditioner",
    "price": 200,
    "mrp": 285,
    "packSize": "175 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_907.jpg"
  },
  {
    "name": "Pilgrim Patua & Keratin Hair Smoothing Conditioner",
    "price": 280,
    "mrp": 400,
    "packSize": "200 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_534333.jpg"
  },
  {
    "name": "Dot & Key Frizz Control Smoothing Hair Conditioner (Moringa & Argan)",
    "price": 262,
    "mrp": 349,
    "packSize": "120 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_499589.jpg"
  },
  {
    "name": "Head & Shoulders Cool Menthol 2-in-1 Shampoo & Conditioner 180 ml",
    "price": 235,
    "mrp": 258,
    "packSize": "180 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_379652.jpg"
  },
  {
    "name": "Biotique Fresh Neem Anti Dandruff Shampoo & Conditioner",
    "price": 204,
    "mrp": 249,
    "packSize": "190 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_21855.jpg"
  },
  {
    "name": "Dove Hair Fall Rescue Bio Protein Care Conditioner",
    "price": 360,
    "mrp": 525,
    "packSize": "335 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_564613.jpg"
  },
  {
    "name": "L'Oreal Paris Dream Lengths Conditioner 175 ml",
    "price": 264,
    "mrp": 329,
    "packSize": "175 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_453384.jpg"
  },
  {
    "name": "L'Oreal Paris Extraordinary Oil Nourishing Conditioner For Dry & Dull Hair 180 ml",
    "price": 280,
    "mrp": 329,
    "packSize": "175 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_916.jpg"
  },
  {
    "name": "Love Beauty & Planet Argan oil and lavender Conditioner",
    "price": 352,
    "mrp": 440,
    "packSize": "200 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_552578.jpg"
  },
  {
    "name": "Love Beauty & Planet Hairfall Control Conditioner",
    "price": 352,
    "mrp": 440,
    "packSize": "200 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_609610.jpg"
  },
  {
    "name": "Pantene Miracle Rescue Biotin Strength Conditioner",
    "price": 218,
    "mrp": 290,
    "packSize": "200 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_609751.jpg"
  },
  {
    "name": "Re' Equil Damage Repair Conditioner",
    "price": 266,
    "mrp": 295,
    "packSize": "125 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_573313.jpg"
  }
];

const seedDatabases = async () => {
    try {
        console.log("🌱 Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected securely!");

        // Find SuperCategory "Beauty & Personal Care"
        let superCat = await SuperCategory.findOne({ name: { $regex: /Beauty/i } });
        let superCategoryId = superCat ? superCat._id : null;

        // 1. Create a dedicated Category named "Conditioner"
        let category = await Category.findOne({ name: "Conditioner" });
        if (!category) {
             category = await Category.create({
                 name: "Conditioner",
                 image: "https://cdn.grofers.com/app/images/products/full_screen/pro_513062.jpg",
                 superCategory: superCategoryId
             });
             console.log("🆕 Created new Category: Conditioner");
        }

        // 2. Create a SubCategory
        let subCategory = await SubCategory.findOne({ name: "All Conditioners", category: category._id });
        if (!subCategory) {
             subCategory = await SubCategory.create({
                 name: "All Conditioners",
                 category: category._id
             });
             console.log("🆕 Created new SubCategory: All Conditioners");
        }

        // 3. Delete previously seeded products (cleanup) to avoid duplicates
        const productNames = scrapedProducts.map(p => p.name);
        const delResult = await Product.deleteMany({ name: { $in: productNames }, userStockLimit: 1, stock: 2 });
        console.log(`🧹 Cleared ${delResult.deletedCount} previously seeded conditioners.`);

        const productsToInsert = scrapedProducts.map(p => ({
            name: p.name,
            price: p.mrp,
            discountPrice: p.price,
            quantity: p.packSize,
            image: p.imageUrl,
            description: `Pack size: ${p.packSize} only.`,
            stock: 2,
            userStockLimit: 1,
            isAvailable: true,
            isApproved: true,
            category: category._id,
            subCategory: subCategory._id,
            superCategory: superCategoryId
        }));

        const result = await Product.insertMany(productsToInsert);
        console.log(`✅ Successfully seeded ${result.length} conditioners!`);

    } catch (err) {
        console.error("❌ Seeding Error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from DB.");
        process.exit(0);
    }
};

seedDatabases();
