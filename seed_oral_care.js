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
    "name": "Oral-B Pro Clean Sensitive & Gums Toothbrush Extra Soft, Colour may Vary",
    "price": 50,
    "mrp": 50,
    "packSize": "1 pc",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_526484.jpg"
  },
  {
    "name": "Colgate Strong Teeth Anticavity Toothpaste (150 g)",
    "price": 103,
    "mrp": 103,
    "packSize": "150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_19192.jpg"
  },
  {
    "name": "Colgate Visible White Purple Whitening Toothpaste",
    "price": 99,
    "mrp": 110,
    "packSize": "75 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_764789.jpg"
  },
  {
    "name": "Patanjali Dant Kanti Herbal Toothpaste",
    "price": 106,
    "mrp": 106,
    "packSize": "200 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_10656.jpg"
  },
  {
    "name": "Colgate Total Advanced Health Toothpaste",
    "price": 80,
    "mrp": 80,
    "packSize": "80 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_566542.jpg"
  },
  {
    "name": "Sensodyne Sensitive Toothbrush With Soft Bristles",
    "price": 59,
    "mrp": 65,
    "packSize": "1 pc",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_505516.jpg"
  },
  {
    "name": "Sensodyne Deep Clean Sensitive Toothpaste",
    "price": 116,
    "mrp": 145,
    "packSize": "70 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_366189.jpg"
  },
  {
    "name": "Closeup Everfresh+ Gel Toothpaste (Red Hot)",
    "price": 117,
    "mrp": 129,
    "packSize": "150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_19570.jpg"
  },
  {
    "name": "Sensodyne Sensitive Toothbrush With Soft Rounded Bristles - Buy 2 Get 1 Free",
    "price": 104,
    "mrp": 130,
    "packSize": "3 pcs",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_23704.jpg"
  },
  {
    "name": "Dabur Red Herbal Toothpaste 200 g",
    "price": 125,
    "mrp": 135,
    "packSize": "200 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_972.jpg"
  },
  {
    "name": "Oral-B Kids Toothbrush (Colour may Vary)",
    "price": 50,
    "mrp": 50,
    "packSize": "3 pcs",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_443628.jpg"
  },
  {
    "name": "Oral-B Sensitive Care Toothbrush Extra Soft",
    "price": 108,
    "mrp": 120,
    "packSize": "5 pcs",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_443627.jpg"
  },
  {
    "name": "Colgate MaxFresh Peppermint Ice Gel Toothpaste",
    "price": 136,
    "mrp": 160,
    "packSize": "150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_21886.jpg"
  },
  {
    "name": "Colgate MaxFresh Spicy Fresh Gel Toothpaste",
    "price": 122,
    "mrp": 138,
    "packSize": "150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_23816.jpg"
  },
  {
    "name": "Colgate Gentle Sensitive Soft Bristles Toothbrush",
    "price": 59,
    "mrp": 65,
    "packSize": "1 pc",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_276959.jpg"
  },
  {
    "name": "Patanjali Dant Kanti Natural Herbal Toothpaste (500 g)",
    "price": 208,
    "mrp": 239,
    "packSize": "500 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_528042.jpg"
  },
  {
    "name": "Oral-B Cavity Defense Bacterial Fighter Toothbrush Soft - Pack of 6",
    "price": 123,
    "mrp": 130,
    "packSize": "6 pcs",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_401914.jpg"
  },
  {
    "name": "Colgate Strong Teeth Anticavity Toothpaste (500 g)",
    "price": 228,
    "mrp": 325,
    "packSize": "2 x 250 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_19184.jpg"
  },
  {
    "name": "Perfora Purple Magic Whitening Toothpaste",
    "price": 186,
    "mrp": 199,
    "packSize": "75 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_633673.jpg"
  },
  {
    "name": "Perfora Super Soft Toothbrush OG Black",
    "price": 90,
    "mrp": 99,
    "packSize": "1 pc",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_554630.jpg"
  },
  {
    "name": "Closeup Everfresh+ Anti-Germ Red Hot Gel Toothpaste",
    "price": 203,
    "mrp": 260,
    "packSize": "2 x 150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_367009.jpg"
  },
  {
    "name": "Dabur Red Gel Toothpaste for effective Oral Care",
    "price": 122,
    "mrp": 246,
    "packSize": "2 x 150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_400929.jpg"
  },
  {
    "name": "Colgate MaxFresh Peppermint Ice Gel Toothpaste - Saver Pack",
    "price": 193,
    "mrp": 299,
    "packSize": "2 x 150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_490674.jpg"
  },
  {
    "name": "Colgate PerioGard Gum Expert Toothbrush",
    "price": 133,
    "mrp": 156,
    "packSize": "1 pc",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_623667.jpg"
  },
  {
    "name": "Colgate Visible White Purple Whitening Toothpaste",
    "price": 229,
    "mrp": 395,
    "packSize": "2 x 120 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_587171.jpg"
  },
  {
    "name": "Listerine Cool Mint Mouthwash (250 ml)",
    "price": 209,
    "mrp": 220,
    "packSize": "250 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_963.jpg"
  },
  {
    "name": "Oral-B Cavity Defense Toothbrush with Charcoal Extract",
    "price": 105,
    "mrp": 105,
    "packSize": "4 pcs",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_587180.jpg"
  },
  {
    "name": "Perfora Dream White - Whitening Toothpaste",
    "price": 132,
    "mrp": 141,
    "packSize": "75 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_497529.jpg"
  },
  {
    "name": "Closeup White Now Stain Eraser Whitening Toothpaste",
    "price": 145,
    "mrp": 170,
    "packSize": "100 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_618263.jpg"
  },
  {
    "name": "Colgate Gentle UltraFoam Bristles Toothbrush Ultra Soft",
    "price": 197,
    "mrp": 280,
    "packSize": "2 pcs",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_523328.jpg"
  },
  {
    "name": "Colgate MaxFresh Gel Toothpaste (Spicy Fresh)",
    "price": 185,
    "mrp": 280,
    "packSize": "300 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_19191.jpg"
  },
  {
    "name": "Colgate Visible White Sparkling Mint Toothpaste",
    "price": 169,
    "mrp": 198,
    "packSize": "120 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_559395.jpg"
  },
  {
    "name": "Oral-B Crisscross Sensitive Toothbrush Set - Buy 2 Get 1",
    "price": 108,
    "mrp": 110,
    "packSize": "3 pcs",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_777767.jpg"
  },
  {
    "name": "Colgate Extra Soft Baby Toothbrush (0 - 2 Years)",
    "price": 27,
    "mrp": 27,
    "packSize": "1 pc",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_342498.jpg"
  },
  {
    "name": "Patanjali Dant Kanti Advance Toothpaste",
    "price": 129,
    "mrp": 142,
    "packSize": "2 x 100 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_748223.jpg"
  },
  {
    "name": "Sensodyne Rapid Relief Sensitive Toothpaste",
    "price": 161,
    "mrp": 200,
    "packSize": "80 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_978.jpg"
  },
  {
    "name": "Colgate Kids Toothpaste ((2 - 5 years) - Strawberry Flavor)",
    "price": 95,
    "mrp": 99,
    "packSize": "40 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_300716.jpg"
  },
  {
    "name": "Colgate Smiles Barbie Extra Soft Kids Toothbrush (Ages 5+)",
    "price": 73,
    "mrp": 85,
    "packSize": "1 pc",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_195168.jpg"
  },
  {
    "name": "Colgate Total Advanced Health Antibacterial Toothpaste",
    "price": 153,
    "mrp": 179,
    "packSize": "150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_552802.jpg"
  },
  {
    "name": "Colgate Zig Zag Deep Clean Toothbrush Medium) (Removes Bacteria Between The Teeth",
    "price": 81,
    "mrp": 81,
    "packSize": "3 pcs",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_21646.jpg"
  },
  {
    "name": "Himalaya Complete Care Herbal Toothpaste",
    "price": 97,
    "mrp": 97,
    "packSize": "150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_209345.jpg"
  },
  {
    "name": "Sensodyne Alcohol Free Complete Protection + Mouthwash",
    "price": 111,
    "mrp": 130,
    "packSize": "100 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_554485.jpg"
  },
  {
    "name": "Sensodyne Fresh Gel Sensitive Toothpaste",
    "price": 197,
    "mrp": 245,
    "packSize": "150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_92728.jpg"
  },
  {
    "name": "Sensodyne Repair & Protect Sensitive Toothpaste",
    "price": 194,
    "mrp": 215,
    "packSize": "70 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_193072.jpg"
  },
  {
    "name": "Colgate Visible White O2 Whitening Toothpaste",
    "price": 196,
    "mrp": 279,
    "packSize": "50 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_481424.jpg"
  },
  {
    "name": "Himalaya Sparkling White - Whitening Toothpaste",
    "price": 100,
    "mrp": 106,
    "packSize": "150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_328948.jpg"
  },
  {
    "name": "Parodontax Daily Fluoride Toothpaste",
    "price": 100,
    "mrp": 111,
    "packSize": "75 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_63639.jpg"
  },
  {
    "name": "Pepsodent 2 In 1 Toothpaste",
    "price": 95,
    "mrp": 118,
    "packSize": "150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_974.jpg"
  },
  {
    "name": "Perfora Purple Magic Teeth Whitening Serum",
    "price": 480,
    "mrp": 499,
    "packSize": "30 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_539672.jpg"
  },
  {
    "name": "Sensodyne Pronamel Toothpaste - Daily Protection",
    "price": 126,
    "mrp": 140,
    "packSize": "70 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_726476.jpg"
  },
  {
    "name": "Colgate Batman Bubble Fruit Flavour Kids Toothpaste (6+ Years)",
    "price": 152,
    "mrp": 190,
    "packSize": "80 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_10626.jpg"
  },
  {
    "name": "Colgate Pain Out Dental Gel",
    "price": 76,
    "mrp": 84,
    "packSize": "10 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_240049.jpg"
  },
  {
    "name": "Colgate Total Advanced Health Anti-Germ Toothpaste with Toothbrush",
    "price": 190,
    "mrp": 378,
    "packSize": "2 x 150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_552804.jpg"
  },
  {
    "name": "Colgate Total Plaque Release Toothpaste 3X Powerful",
    "price": 216,
    "mrp": 269,
    "packSize": "80 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_594437.jpg"
  },
  {
    "name": "Colgate Total Ultra Soft Toothbrush Set - With Free Total Advanced Toothpaste",
    "price": 152,
    "mrp": 196,
    "packSize": "3 pcs",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_632836.jpg"
  },
  {
    "name": "Colgate Vedshakti Ayurvedic Herbal Toothpaste",
    "price": 172,
    "mrp": 172,
    "packSize": "200 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_373525.jpg"
  },
  {
    "name": "GUBB Dental Floss Toothpick",
    "price": 133,
    "mrp": 135,
    "packSize": "24 pcs",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_512222.jpg"
  },
  {
    "name": "Oral-B Sensitive Toothbrush Extra Soft",
    "price": 135,
    "mrp": 140,
    "packSize": "4 pcs",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_83329.jpg"
  },
  {
    "name": "Parodontax Ultra Clean Expert Gum Care Toothpaste",
    "price": 104,
    "mrp": 115,
    "packSize": "75 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_618965.jpg"
  },
  {
    "name": "Pepsodent G Expert Protection Gumcare + Toothpaste - 140 g",
    "price": 98,
    "mrp": 115,
    "packSize": "140 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_85117.jpg"
  },
  {
    "name": "Pepsodent Germicheck 8 Actions Toothpaste",
    "price": 142,
    "mrp": 202,
    "packSize": "2 x 150 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_307446.jpg"
  },
  {
    "name": "Sensodyne Deep Clean Toothbrush - Buy 2 Get 1 Free",
    "price": 128,
    "mrp": 160,
    "packSize": "3 pcs",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_506534.jpg"
  },
  {
    "name": "Chicco Apple-Banana Kids Toothpaste (6m to 6 yr)",
    "price": 148,
    "mrp": 159,
    "packSize": "50 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_492174.jpg"
  },
  {
    "name": "Colgate Bamboo Charcoal & Mint Toothpaste",
    "price": 216,
    "mrp": 420,
    "packSize": "2 x 120 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_490673.jpg"
  },
  {
    "name": "Colgate MaxFresh Charcoal Gel Toothpaste (130 g)",
    "price": 122,
    "mrp": 153,
    "packSize": "130 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_498973.jpg"
  },
  {
    "name": "Colgate MaxFresh Peppermint Mouthwash (250 ml)",
    "price": 148,
    "mrp": 210,
    "packSize": "250 ml",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_967.jpg"
  },
  {
    "name": "Colgate SlimSoft Charcoal Soft Toothbrush",
    "price": 81,
    "mrp": 85,
    "packSize": "1 pc",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_126165.jpg"
  },
  {
    "name": "ComfortPlus 3-in-1 Toothpick Dental Floss",
    "price": 98,
    "mrp": 199,
    "packSize": "20 pcs",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_547655.jpg"
  },
  {
    "name": "Dabur Meswak Complete Tooth & Gum Care Toothpaste - Mega Saver Pack",
    "price": 165,
    "mrp": 255,
    "packSize": "2 x 200 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_366925.jpg"
  },
  {
    "name": "Dabur Red Herbal Toothpaste",
    "price": 154,
    "mrp": 213,
    "packSize": "300 g",
    "imageUrl": "https://cdn.grofers.com/app/images/products/full_screen/pro_19593.jpg"
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

        // 1. Create a dedicated Category named "Oral Care"
        let category = await Category.findOne({ name: "Oral Care" });
        if (!category) {
             category = await Category.create({
                 name: "Oral Care",
                 image: "https://cdn.grofers.com/app/images/products/full_screen/pro_19192.jpg",
                 superCategory: superCategoryId
             });
             console.log("🆕 Created new Category: Oral Care");
        }

        // 2. Create a SubCategory
        let subCategory = await SubCategory.findOne({ name: "All Oral Care", category: category._id });
        if (!subCategory) {
             subCategory = await SubCategory.create({
                 name: "All Oral Care",
                 category: category._id
             });
             console.log("🆕 Created new SubCategory: All Oral Care");
        }

        // 3. Delete previously seeded products (under userStockLimit: 1, stock: 2) to avoid duplicates
        const productNames = scrapedProducts.map(p => p.name);
        const delResult = await Product.deleteMany({ name: { $in: productNames }, userStockLimit: 1, stock: 2 });
        console.log(`🧹 Cleared ${delResult.deletedCount} previously seeded oral care products.`);

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
        console.log(`✅ Successfully seeded ${result.length} oral care products!`);

    } catch (err) {
        console.error("❌ Seeding Error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from DB.");
        process.exit(0);
    }
};

seedDatabases();
