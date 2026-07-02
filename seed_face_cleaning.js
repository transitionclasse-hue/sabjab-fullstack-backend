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
    "name": "The Derma Co 1% Salicylic Acid Gel Face Wash",
    "price": 227,
    "mrp": 259,
    "packSize": "100 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/538610a.jpg"
  },
  {
    "name": "Minimalist 2% Salicylic Acid Face Serum for Acne",
    "price": 483,
    "mrp": 569,
    "packSize": "30 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/519948a.jpg"
  },
  {
    "name": "Minimalist 10% Vitamin B5 Gel Face Moisturizer",
    "price": 424,
    "mrp": 499,
    "packSize": "50 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/sliding_image/500361a.jpg"
  },
  {
    "name": "Cetaphil Gentle Skin Cleanser",
    "price": 330,
    "mrp": 389,
    "packSize": "125 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_14093.jpg"
  },
  {
    "name": "Himalaya Purifying Neem Face Wash",
    "price": 165,
    "mrp": 195,
    "packSize": "150 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_976.jpg"
  },
  {
    "name": "Himalaya Moisturizing Aloe Vera Face Wash",
    "price": 169,
    "mrp": 199,
    "packSize": "150 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_366257.jpg"
  },
  {
    "name": "Garnier Bright Complete Vitamin C Face Wash",
    "price": 149,
    "mrp": 175,
    "packSize": "150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_21823.jpg"
  },
  {
    "name": "Pond's Bright Beauty Spot-less Glow Face Wash",
    "price": 142,
    "mrp": 169,
    "packSize": "150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_980.jpg"
  },
  {
    "name": "Clean & Clear Foaming Face Wash",
    "price": 179,
    "mrp": 199,
    "packSize": "150 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_977.jpg"
  },
  {
    "name": "Nivea Milk Delights Moisturizing Honey Face Wash",
    "price": 159,
    "mrp": 179,
    "packSize": "100 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_277091.jpg"
  },
  {
    "name": "The Derma Co 2% Salicylic Acid Face Wash for Active Acne",
    "price": 254,
    "mrp": 299,
    "packSize": "100 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_544202.jpg"
  },
  {
    "name": "Mamaearth Vitamin C Face Wash with Vitamin C & Turmeric",
    "price": 199,
    "mrp": 249,
    "packSize": "100 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_455953.jpg"
  },
  {
    "name": "Mamaearth Tea Tree Natural Face Wash",
    "price": 199,
    "mrp": 249,
    "packSize": "100 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_451085.jpg"
  },
  {
    "name": "Pond's Pure Detox Anti-Pollution Purity Face Wash",
    "price": 178,
    "mrp": 209,
    "packSize": "150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_308820.jpg"
  },
  {
    "name": "Nivea Men All-In-One Face Wash",
    "price": 159,
    "mrp": 185,
    "packSize": "100 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_22050.jpg"
  },
  {
    "name": "Garnier Men Oil Clear Clay D-Tox Face Wash",
    "price": 165,
    "mrp": 199,
    "packSize": "100 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_443556.jpg"
  },
  {
    "name": "Simple Refreshing Facial Wash Gel",
    "price": 295,
    "mrp": 345,
    "packSize": "150 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_353803.jpg"
  },
  {
    "name": "Plum Green Tea Pore Cleansing Face Wash",
    "price": 253,
    "mrp": 298,
    "packSize": "100 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_327960.jpg"
  },
  {
    "name": "Biotique Bio Neem Purifying Face Wash",
    "price": 143,
    "mrp": 169,
    "packSize": "150 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_21845.jpg"
  },
  {
    "name": "Himalaya Oil Clear Lemon Face Wash",
    "price": 165,
    "mrp": 195,
    "packSize": "150 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_21858.jpg"
  },
  {
    "name": "WOW Skin Science Apple Cider Vinegar Face Wash",
    "price": 299,
    "mrp": 349,
    "packSize": "100 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_429289.jpg"
  },
  {
    "name": "Dot & Key Vitamin C + E Super Bright Glow Serum Face Wash",
    "price": 273,
    "mrp": 325,
    "packSize": "100 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_499587.jpg"
  },
  {
    "name": "Cetaphil Oily Skin Cleanser",
    "price": 359,
    "mrp": 425,
    "packSize": "125 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_490764.jpg"
  },
  {
    "name": "Pond's Bright Beauty Serum Cream",
    "price": 178,
    "mrp": 199,
    "packSize": "35 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_344989.jpg"
  },
  {
    "name": "Joy Revivify Vitamin C Face Wash",
    "price": 135,
    "mrp": 159,
    "packSize": "150 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_586985.jpg"
  },
  {
    "name": "Garnier Bright Complete Vitamin C Gel Face Wash - Brightening",
    "price": 199,
    "mrp": 235,
    "packSize": "150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_547655.jpg"
  },
  {
    "name": "Himalaya Tan Removal Orange Face Wash",
    "price": 152,
    "mrp": 179,
    "packSize": "150 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_253282.jpg"
  },
  {
    "name": "Nivea Men Dark Spot Reduction Face Wash",
    "price": 169,
    "mrp": 199,
    "packSize": "100 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_277092.jpg"
  },
  {
    "name": "Garnier Men Turbo Bright Double Action Face Wash",
    "price": 155,
    "mrp": 183,
    "packSize": "100 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_22289.jpg"
  },
  {
    "name": "Dove Beauty Moisture Face Wash",
    "price": 189,
    "mrp": 220,
    "packSize": "100 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_459041.jpg"
  },
  {
    "name": "Minimalist 5% Aquaporin Booster Hydrating Face Moisturizer",
    "price": 382,
    "mrp": 449,
    "packSize": "50 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_500361.jpg"
  },
  {
    "name": "Mamaearth Ubtan Face Wash for Tan Removal",
    "price": 199,
    "mrp": 249,
    "packSize": "100 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_488222.jpg"
  },
  {
    "name": "Pears Pure & Gentle Face Wash",
    "price": 148,
    "mrp": 175,
    "packSize": "150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_10712.jpg"
  },
  {
    "name": "Biotique Bio Honey Gel Refreshing Foaming Face Wash",
    "price": 143,
    "mrp": 169,
    "packSize": "150 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_21847.jpg"
  },
  {
    "name": "Plum 2% Salicylic Acid Face Wash",
    "price": 253,
    "mrp": 298,
    "packSize": "100 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_561046.jpg"
  },
  {
    "name": "Simple Kind To Skin Moisturising Face Wash",
    "price": 295,
    "mrp": 345,
    "packSize": "150 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_353805.jpg"
  },
  {
    "name": "Aqualogica Glow+ Vitamin C Face Wash",
    "price": 203,
    "mrp": 239,
    "packSize": "100 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_545122.jpg"
  },
  {
    "name": "mCaffeine Coffee Face Wash for Fresh & Glowing Skin",
    "price": 254,
    "mrp": 299,
    "packSize": "100 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_454089.jpg"
  },
  {
    "name": "VLCC Neem Face Wash",
    "price": 119,
    "mrp": 140,
    "packSize": "150 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_361780.jpg"
  },
  {
    "name": "Lakme Blush & Glow Lemon Fresh Face Wash",
    "price": 139,
    "mrp": 165,
    "packSize": "100 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_10714.jpg"
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

        // 1. Create a dedicated Category named "Face Cleaning"
        let category = await Category.findOne({ name: "Face Cleaning" });
        if (!category) {
             category = await Category.create({
                 name: "Face Cleaning",
                 image: "https://cdn.grofers.com/app/images/products/sliding_image/538610a.jpg",
                 superCategory: superCategoryId
             });
             console.log("🆕 Created new Category: Face Cleaning");
        }

        // 2. Create SubCategories
        let subCatFaceWash = await SubCategory.findOne({ name: "Face Wash", category: category._id });
        if (!subCatFaceWash) {
             subCatFaceWash = await SubCategory.create({
                 name: "Face Wash",
                 category: category._id
             });
             console.log("🆕 Created new SubCategory: Face Wash");
        }

        let subCatSerums = await SubCategory.findOne({ name: "Face Serums & Moisturizers", category: category._id });
        if (!subCatSerums) {
             subCatSerums = await SubCategory.create({
                 name: "Face Serums & Moisturizers",
                 category: category._id
             });
             console.log("🆕 Created new SubCategory: Face Serums & Moisturizers");
        }

        // 3. Delete previously seeded products to avoid duplicates
        const productNames = scrapedProducts.map(p => p.name);
        const delResult = await Product.deleteMany({ name: { $in: productNames }, userStockLimit: 1, stock: 2 });
        console.log(`🧹 Cleared ${delResult.deletedCount} previously seeded face cleaning products.`);

        // Classify into sub-categories
        const serumKeywords = ['serum', 'moisturizer', 'cream', 'gel moisturizer', 'booster'];
        
        const productsToInsert = scrapedProducts.map(p => {
            const nameLower = p.name.toLowerCase();
            const isSerum = serumKeywords.some(kw => nameLower.includes(kw));
            
            return {
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
                subCategory: isSerum ? subCatSerums._id : subCatFaceWash._id,
                superCategory: superCategoryId
            };
        });

        const result = await Product.insertMany(productsToInsert);
        console.log(`✅ Successfully seeded ${result.length} face cleaning products!`);

        // Print breakdown
        const faceWashCount = productsToInsert.filter(p => p.subCategory.equals(subCatFaceWash._id)).length;
        const serumCount = productsToInsert.filter(p => p.subCategory.equals(subCatSerums._id)).length;
        console.log(`   📦 Face Wash: ${faceWashCount} products`);
        console.log(`   📦 Face Serums & Moisturizers: ${serumCount} products`);

    } catch (err) {
        console.error("❌ Seeding Error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from DB.");
        process.exit(0);
    }
};

seedDatabases();
