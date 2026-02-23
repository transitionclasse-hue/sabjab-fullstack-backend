import mongoose from "mongoose";
import dotenv from "dotenv";
import SuperCategory from "./src/models/superCategory.js";
import Category from "./src/models/category.js";
import SubCategory from "./src/models/subCategory.js";
import Product from "./src/models/products.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://transitionclasse_db_user:devu1234@cluster0.7chsse0.mongodb.net/sabjab";

// Data Extracted from Screenshots
const rawCategories = [
    // GROUP 0: Grocery & Kitchen
    { name: "Vegetables & Fruits", image: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444869/category/uic8gcnbzknosdvva13o.png", groupIndex: 0 },
    { name: "Atta, Rice & Dal", image: "https://m.media-amazon.com/images/I/71YvU5M8y2L._AC_UL640_QL65_.jpg", groupIndex: 0 },
    { name: "Oil, Ghee & Masala", image: "https://m.media-amazon.com/images/I/61N9p7XU2-L._AC_UL640_QL65_.jpg", groupIndex: 0 },
    { name: "Dairy, Bread & Eggs", image: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444870/category/cq7m7yxuttemyb4tkidp.png", groupIndex: 0 },
    { name: "Bakery & Biscuits", image: "https://m.media-amazon.com/images/I/41D8zD5qS1L._AC_UL640_QL65_.jpg", groupIndex: 0 },
    { name: "Dry Fruits & Cereals", image: "https://m.media-amazon.com/images/I/61FwX1iRIfL._AC_UL640_QL65_.jpg", groupIndex: 0 },
    { name: "Chicken, Meat & Fish", image: "https://m.media-amazon.com/images/I/51wXbE2PkeL._AC_UL640_QL65_.jpg", groupIndex: 0 },
    { name: "Kitchenware & Appliances", image: "https://m.media-amazon.com/images/I/71+bz5i4SDL._AC_UL640_QL65_.jpg", groupIndex: 0 },

    // GROUP 1: Snacks & Drinks
    { name: "Chips & Namkeen", image: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444869/category/vyakccm3axdyt8yei8wc.png", groupIndex: 1 },
    { name: "Sweets & Chocolates", image: "https://m.media-amazon.com/images/I/61N9p7XU2-L._AC_UL640_QL65_.jpg", groupIndex: 1 },
    { name: "Drinks & Juices", image: "https://m.media-amazon.com/images/I/61FwX1iRIfL._AC_UL640_QL65_.jpg", groupIndex: 1 },
    { name: "Tea, Coffee & Milk Drinks", image: "https://m.media-amazon.com/images/I/71YvU5M8y2L._AC_UL640_QL65_.jpg", groupIndex: 1 },
    { name: "Instant Food", image: "https://m.media-amazon.com/images/I/71+bz5i4SDL._AC_UL640_QL65_.jpg", groupIndex: 1 },
    { name: "Sauces & Spreads", image: "https://m.media-amazon.com/images/I/61Xz4c-Q8-L._AC_UL640_QL65_.jpg", groupIndex: 1 },
    { name: "Paan Corner", image: "https://m.media-amazon.com/images/I/51wXbE2PkeL._AC_UL640_QL65_.jpg", groupIndex: 1 },
    { name: "Ice Creams & More", image: "https://m.media-amazon.com/images/I/41D8zD5qS1L._AC_UL640_QL65_.jpg", groupIndex: 1 },

    // GROUP 2: Beauty & Personal Care
    { name: "Bath & Body", image: "https://m.media-amazon.com/images/I/61FwX1iRIfL._AC_UL640_QL65_.jpg", groupIndex: 2 },
    { name: "Hair", image: "https://m.media-amazon.com/images/I/51wXbE2PkeL._AC_UL640_QL65_.jpg", groupIndex: 2 },
    { name: "Skin & Face", image: "https://m.media-amazon.com/images/I/71+bz5i4SDL._AC_UL640_QL65_.jpg", groupIndex: 2 },
    { name: "Beauty & Cosmetics", image: "https://m.media-amazon.com/images/I/61Xz4c-Q8-L._AC_UL640_QL65_.jpg", groupIndex: 2 },
    { name: "Feminine Hygiene", image: "https://m.media-amazon.com/images/I/71YvU5M8y2L._AC_UL640_QL65_.jpg", groupIndex: 2 },
    { name: "Baby Care", image: "https://m.media-amazon.com/images/I/41D8zD5qS1L._AC_UL640_QL65_.jpg", groupIndex: 2 },
    { name: "Health & Pharma", image: "https://m.media-amazon.com/images/I/61mXZw8HjCL._AC_UL640_QL65_.jpg", groupIndex: 2 },
    { name: "Sexual Wellness", image: "https://m.media-amazon.com/images/I/71zxuMC71jL._AC_UL640_QL65_.jpg", groupIndex: 2 },

    // GROUP 3: Household Essentials 
    { name: "Home & Lifestyle", image: "https://m.media-amazon.com/images/I/61N9p7XU2-L._AC_UL640_QL65_.jpg", groupIndex: 3 },
    { name: "Cleaners & Repellents", image: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444869/category/pfbuktnsxdub5njww7tj.png", groupIndex: 3 },
    { name: "Electronics", image: "https://m.media-amazon.com/images/I/71YvU5M8y2L._AC_UL640_QL65_.jpg", groupIndex: 3 },
    { name: "Stationery & Games", image: "https://m.media-amazon.com/images/I/61FwX1iRIfL._AC_UL640_QL65_.jpg", groupIndex: 3 },
];

const subCategoryMap = {
    // Grocery & Kitchen
    "Vegetables & Fruits": ["Fresh Vegetables", "Fresh Fruits", "Exotic Fruits", "Exotic Vegetables", "Leafy, Herbs & Seasonings", "Flower Bouquets"],
    "Atta, Rice & Dal": ["Atta & Flours", "Rice & Rice Products", "Dals & Pulses"],
    "Oil, Ghee & Masala": ["Cooking Oils", "Pure Ghee", "Spices & Masalas", "Salt & Sugar"],
    "Dairy, Bread & Eggs": ["Milk", "Bread & Buns", "Eggs", "Curd & Yogurt", "Butter & Cheese", "Paneer & Tofu"],
    "Bakery & Biscuits": ["Cookies", "Sweet Biscuits", "Salty & Marie Biscuits", "Cakes & Muffins", "Rusk & Khari", "Breads & Pavs"],
    "Dry Fruits & Cereals": ["Almonds", "Cashews", "Raisins", "Walnuts", "Oats & Muesli", "Corn Flakes"],
    "Chicken, Meat & Fish": ["Fresh Chicken", "Fresh Mutton", "Fish & Seafood", "Cold Cuts", "Marinades"],
    "Kitchenware & Appliances": ["Bottles & Flasks", "Kitchen Accessories", "Mugs & Glasses", "Cookware & Sets", "Storage & Containers", "Barware", "Lunch Boxes"],

    // Snacks & Drinks
    "Chips & Namkeen": ["Chips & Wafers", "Bhujia & Mixtures", "Namkeen Snacks", "Nachos", "Healthy Snacks", "Popcorn", "Papad & Fryums"],
    "Sweets & Chocolates": ["Chocolates", "Chocolate Packs", "Chocolate Gift Pack", "Indian Sweets", "Candies & Gum", "Premium Chocolates", "Energy Bars", "Syrups"],
    "Drinks & Juices": ["Soft Drinks", "Fruit Juices", "Energy Drinks", "Hydration Drinks", "Soda & Mixers", "Water & Ice Cubes", "Mango Drinks"],
    "Tea, Coffee & Milk Drinks": ["Tea", "Coffee", "Hot Chocolate", "Green Tea", "Milk Drinks", "Cold Coffee & Ice Tea", "Bags & Premixes"],
    "Instant Food": ["Noodles", "Pasta", "Vermicelli", "Soups", "Ready to Eat", "Dessert Mixes"],
    "Sauces & Spreads": ["Tomato Ketchup", "Chilli & Soya Sauce", "Dips & Mayonnaise", "Jams & Honey", "Peanut Butter", "Chutney & Pickles"],
    "Paan Corner": ["Mouth Fresheners", "Digestives", "Paan Masala", "Sweet Supari", "Dates"],
    "Ice Creams & More": ["Tubs & Party Packs", "Sticks & Cones", "Cups & Cassatta", "Frozen Desserts"],

    // Beauty & Personal Care
    "Bath & Body": ["Body Wash", "Soaps", "Body Lotions", "Loofahs & Sponges", "Talcum Powder", "Hand Wash"],
    "Hair": ["Shampoos", "Conditioners", "Hair Oils", "Hair Colors", "Hair Styling", "Combs & Brushes"],
    "Skin & Face": ["Face Wash", "Moisturizers", "Sunscreen", "Face Masks", "Lip Care", "Toners & Serums"],
    "Beauty & Cosmetics": ["Makeup", "Nail Care", "Fragrances", "Makeup Removers", "Beauty Accessories"],
    "Feminine Hygiene": ["Sanitary Pads", "Pantyliners", "Intimate Wash", "Hair Removal", "Tampons & Cups"],
    "Baby Care": ["Diapers", "Baby Wipes", "Baby Food", "Baby Bath & Skin", "Baby Oral Care"],
    "Health & Pharma": ["Pain Relievers", "First Aid", "Vitamins & Supplements", "Cold & Cough", "Digestive Care", "Ayurvedic"],
    "Sexual Wellness": ["Condoms", "Lubricants", "Pregnancy Kits", "Wellness Supplements"],

    // Household Essentials
    "Home & Lifestyle": ["Towels & Napkins", "Bedsheets", "Pooja Needs", "Shoe Care", "Umbrellas"],
    "Cleaners & Repellents": ["Laundry Detergents", "Dishwash", "Surface Cleaners", "Toilet Cleaners", "Mosquito Repellents", "Air Fresheners"],
    "Electronics": ["Batteries", "Earphones", "Chargers & Cables", "Smart Watches", "Trimmers", "Extension Boards"],
    "Stationery & Games": ["Pens & Pencils", "Notebooks", "Art Supplies", "Office Needs", "Board Games", "Card Games"]
};

// Helper to generate products (Safe assign)
const _dbRawProducts = [
    ["Chilean Cherry", 294, 243, "125 g", "https://m.media-amazon.com/images/I/61N9p7XU2-L._AC_UL640_QL65_.jpg"],
    ["Kinnaur Apple (Seb)", 187, 148, "500 g", "https://m.media-amazon.com/images/I/71YvU5M8y2L._AC_UL640_QL65_.jpg"],
    ["Fresh Spinach", 45, 30, "250 g", "https://m.media-amazon.com/images/I/71dpKUWhfmL._AC_UL640_QL65_.jpg"],
    ["Coriander Leaves", 20, 15, "100 g", "https://m.media-amazon.com/images/I/41D8zD5qS1L._AC_UL640_QL65_.jpg"],
    ["Hass Avocado", 299, 249, "2 pcs", "https://m.media-amazon.com/images/I/71zxuMC71jL._AC_UL640_QL65_.jpg"],
    ["Dragon Fruit", 150, 120, "1 pc", "https://m.media-amazon.com/images/I/51wXbE2PkeL._AC_UL640_QL65_.jpg"],
    ["Amul Taaza Toned Milk", 27, 27, "500 ml", "https://m.media-amazon.com/images/I/61mXZw8HjCL._AC_UL640_QL65_.jpg"],
    ["Amul Butter", 60, 58, "100 g", "https://m.media-amazon.com/images/I/51wXbE2PkeL._AC_UL640_QL65_.jpg"],
    ["Mother Dairy Classic Curd", 35, 32, "400 g", "https://m.media-amazon.com/images/I/812816L+HkL._AC_UL640_QL65_.jpg"],
    ["Epigamia Greek Yogurt", 70, 65, "120 g", "https://m.media-amazon.com/images/I/61N9p7XU2-L._AC_UL640_QL65_.jpg"],
    ["Kellogg's Corn Flakes", 149, 120, "250 g", "https://m.media-amazon.com/images/I/71tikpIQnbL._AC_UL640_QL65_.jpg"],
    ["Britannia Whole Wheat Bread", 45, 45, "400 g", "https://m.media-amazon.com/images/I/71dpKUWhfmL._AC_UL640_QL65_.jpg"],
    ["Aashirvaad Shudh Chakki Atta", 240, 219, "5 kg", "https://m.media-amazon.com/images/I/71YvU5M8y2L._AC_UL640_QL65_.jpg"],
    ["Fortune Chakki Fresh Atta", 230, 215, "5 kg", "https://m.media-amazon.com/images/I/71tikpIQnbL._AC_UL640_QL65_.jpg"],
    ["India Gate Basmati Rice", 599, 499, "5 kg", "https://m.media-amazon.com/images/I/51wXbE2PkeL._AC_UL640_QL65_.jpg"],
    ["Kohinoor Super Silver Rice", 450, 420, "5 kg", "https://m.media-amazon.com/images/I/41D8zD5qS1L._AC_UL640_QL65_.jpg"],
    ["Tata Sampann Toor Dal", 185, 175, "1 kg", "https://m.media-amazon.com/images/I/61N9p7XU2-L._AC_UL640_QL65_.jpg"],
    ["Rajdhani Chana Dal", 140, 130, "1 kg", "https://m.media-amazon.com/images/I/71dpKUWhfmL._AC_UL640_QL65_.jpg"],
    ["Fortune Sunlite Sunflower Oil", 175, 160, "1 L", "https://m.media-amazon.com/images/I/61N9p7XU2-L._AC_UL640_QL65_.jpg"],
    ["Saffola Gold Cooking Oil", 180, 165, "1 L", "https://m.media-amazon.com/images/I/41D8zD5qS1L._AC_UL640_QL65_.jpg"],
    ["Amul Pure Ghee", 550, 520, "1 L", "https://m.media-amazon.com/images/I/51wXbE2PkeL._AC_UL640_QL65_.jpg"],
    ["Mother Dairy Cow Ghee", 540, 510, "1 L", "https://m.media-amazon.com/images/I/71YvU5M8y2L._AC_UL640_QL65_.jpg"],
    ["MDH Garam Masala", 85, 80, "100 g", "https://m.media-amazon.com/images/I/71YvU5M8y2L._AC_UL640_QL65_.jpg"],
    ["Everest Turmeric Powder", 45, 40, "100 g", "https://m.media-amazon.com/images/I/61Xz4c-Q8-L._AC_UL640_QL65_.jpg"],
    ["Licious Chicken Breast", 299, 280, "500 g", "https://m.media-amazon.com/images/I/71zxuMC71jL._AC_UL640_QL65_.jpg"],
    ["Godrej Real Good Chicken", 220, 200, "500 g", "https://m.media-amazon.com/images/I/41D8zD5qS1L._AC_UL640_QL65_.jpg"],
    ["Rohu Fish Cleaned", 250, 230, "500 g", "https://m.media-amazon.com/images/I/61mXZw8HjCL._AC_UL640_QL65_.jpg"],
    ["Fresh Prawns", 350, 320, "250 g", "https://m.media-amazon.com/images/I/61FwX1iRIfL._AC_UL640_QL65_.jpg"],
    ["Nandu's Farm Fresh Eggs", 75, 70, "10 pcs", "https://m.media-amazon.com/images/I/812816L+HkL._AC_UL640_QL65_.jpg"],
    ["Brown Eggs OMEGA-3", 90, 85, "6 pcs", "https://m.media-amazon.com/images/I/71tikpIQnbL._AC_UL640_QL65_.jpg"],
    ["Lay's Magic Masala", 20, 20, "50 g", "https://m.media-amazon.com/images/I/61FwX1iRIfL._AC_UL640_QL65_.jpg"],
    ["Pringles Original", 110, 99, "107 g", "https://m.media-amazon.com/images/I/71YvU5M8y2L._AC_UL640_QL65_.jpg"],
    ["Doritos Nacho Cheese", 50, 50, "100 g", "https://m.media-amazon.com/images/I/71zxuMC71jL._AC_UL640_QL65_.jpg"],
    ["Cornitos Jalapeno", 90, 85, "150 g", "https://m.media-amazon.com/images/I/41D8zD5qS1L._AC_UL640_QL65_.jpg"],
    ["Kurkure Masala Munch", 20, 20, "82 g", "https://m.media-amazon.com/images/I/71+bz5i4SDL._AC_UL640_QL65_.jpg"],
    ["Cheetos Cheese Puffs", 45, 40, "80 g", "https://m.media-amazon.com/images/I/51wXbE2PkeL._AC_UL640_QL65_.jpg"],
    ["Surf Excel Easy Wash", 120, 115, "1 kg", "https://res.cloudinary.com/dponzgerb/image/upload/v1723444869/category/pfbuktnsxdub5njww7tj.png"],
    ["Ariel Matic Powder", 250, 230, "1 kg", "https://m.media-amazon.com/images/I/61mXZw8HjCL._AC_UL640_QL65_.jpg"],
    ["Vim Dishwash Liquid", 160, 140, "500 ml", "https://m.media-amazon.com/images/I/71+bz5i4SDL._AC_UL640_QL65_.jpg"],
    ["Pril Tamarind", 99, 90, "425 ml", "https://m.media-amazon.com/images/I/71YvU5M8y2L._AC_UL640_QL65_.jpg"],
    ["Lizol Floor Cleaner", 180, 160, "975 ml", "https://m.media-amazon.com/images/I/71R1vX7R9xL._AC_UL640_QL65_.jpg"],
    ["Harpic Power Plus", 199, 185, "1 L", "https://m.media-amazon.com/images/I/61FwX1iRIfL._AC_UL640_QL65_.jpg"],
    ["Britannia Good Day Cachew", 40, 35, "200 g", "https://m.media-amazon.com/images/I/61N9p7XU2-L._AC_UL640_QL65_.jpg"],
    ["Sunfeast Dark Fantasy", 120, 110, "300 g", "https://m.media-amazon.com/images/I/51wXbE2PkeL._AC_UL640_QL65_.jpg"],
    ["Winkies Plum Cake", 150, 140, "400 g", "https://m.media-amazon.com/images/I/71+bz5i4SDL._AC_UL640_QL65_.jpg"],
    ["Britannia Fruit Cake", 60, 55, "150 g", "https://m.media-amazon.com/images/I/71zxuMC71jL._AC_UL640_QL65_.jpg"],
    ["Biskarmm Premium Rusk", 60, 55, "300 g", "https://m.media-amazon.com/images/I/71dpKUWhfmL._AC_UL640_QL65_.jpg"],
    ["Parle Rusk Real Elaichi", 50, 45, "300 g", "https://m.media-amazon.com/images/I/812816L+HkL._AC_UL640_QL65_.jpg"],
    ["Tulsi Californian Almonds", 399, 350, "500 g", "https://m.media-amazon.com/images/I/61FwX1iRIfL._AC_UL640_QL65_.jpg"],
    ["Happilo Premium Cashews", 450, 420, "250 g", "https://m.media-amazon.com/images/I/71YvU5M8y2L._AC_UL640_QL65_.jpg"],
    ["Lion Dates Seedless", 220, 200, "500 g", "https://m.media-amazon.com/images/I/61N9p7XU2-L._AC_UL640_QL65_.jpg"],
    ["Farmley Premium Raisins", 150, 130, "250 g", "https://m.media-amazon.com/images/I/51wXbE2PkeL._AC_UL640_QL65_.jpg"],
    ["Quaker Oats", 199, 185, "1 kg", "https://m.media-amazon.com/images/I/812816L+HkL._AC_UL640_QL65_.jpg"],
    ["Saffola Masala Oats", 220, 205, "500 g", "https://m.media-amazon.com/images/I/71dpKUWhfmL._AC_UL640_QL65_.jpg"],
    ["Pigeon Aluminum Pressure Cooker", 1299, 1099, "3 L", "https://m.media-amazon.com/images/I/71+bz5i4SDL._AC_UL640_QL65_.jpg"],
    ["Prestige Gas Stove", 2999, 2599, "1 Unit", "https://m.media-amazon.com/images/I/71zxuMC71jL._AC_UL640_QL65_.jpg"],
    ["Milton Thermosteel Flask", 850, 799, "500 ml", "https://m.media-amazon.com/images/I/61mXZw8HjCL._AC_UL640_QL65_.jpg"],
    ["Cello Glass Water Bottle", 499, 450, "1 L", "https://m.media-amazon.com/images/I/61Xz4c-Q8-L._AC_UL640_QL65_.jpg"],
    ["Gala Spin Mop", 1199, 1050, "1 Unit", "https://m.media-amazon.com/images/I/61FwX1iRIfL._AC_UL640_QL65_.jpg"],
    ["Scotch Brite Scrub Pad", 50, 45, "3 pcs", "https://m.media-amazon.com/images/I/41D8zD5qS1L._AC_UL640_QL65_.jpg"]
];

const seedDatabases = async () => {
    try {
        console.log("🌱 Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("✅ Connected securely!");

        // WIPE existing data 
        await SuperCategory.deleteMany({});
        await Category.deleteMany({});
        await SubCategory.deleteMany({});
        await Product.deleteMany({});
        console.log("🧹 Cleared old DB state.");

        // 0. CREATE 4 SUPERCATEGORIES
        const sc1 = await SuperCategory.create({ name: "Grocery & Kitchen", order: 1 });
        const sc2 = await SuperCategory.create({ name: "Snacks & Drinks", order: 2 });
        const sc3 = await SuperCategory.create({ name: "Beauty & Personal Care", order: 3 });
        const sc4 = await SuperCategory.create({ name: "Household Essentials", order: 4 });
        const superCatMap = [sc1._id, sc2._id, sc3._id, sc4._id];

        let productIndex = 0;
        const finalProducts = [];
        let totalSubCats = 0;

        // Traverse Categories
        for (const catData of rawCategories) {
            // 1. Create Parent Category and hook to SuperCategory!
            const newCat = await Category.create({
                name: catData.name,
                image: catData.image,
                superCategory: superCatMap[catData.groupIndex]
            });

            // 2. Fetch specific subcategories from the map (extrapolated + real from screenshots)
            const subCategoryList = subCategoryMap[catData.name] || [`All ${catData.name}`];

            for (const subName of subCategoryList) {
                const newSub = await SubCategory.create({
                    name: subName,
                    image: catData.image, // Fallback to category image
                    category: newCat._id
                });
                totalSubCats++;

                // 3. Assign 1 product to this subcategory if available to ensure feed looks rich
                const item = _dbRawProducts[productIndex % _dbRawProducts.length];
                if (item) {
                    finalProducts.push({
                        name: item[0],
                        price: item[1],
                        discountPrice: item[2],
                        quantity: item[3],
                        image: item[4],
                        category: newSub._id
                    });
                    productIndex++;
                }

                // Sprinkle a random second product occasionally
                if (Math.random() > 0.5) {
                    const extraItem = _dbRawProducts[(productIndex + 14) % _dbRawProducts.length];
                    finalProducts.push({
                        name: extraItem[0],
                        price: extraItem[1],
                        discountPrice: extraItem[2],
                        quantity: extraItem[3],
                        image: extraItem[4],
                        category: newSub._id
                    });
                }
            }
        }

        const createdProducts = await Product.insertMany(finalProducts);

        console.log(`✅ Successfully seeded SuperCategories!`);
        console.log(`✅ Successfully seeded 28 Categories!`);
        console.log(`✅ Successfully seeded ${totalSubCats} Exhaustive SubCategories!`);
        console.log(`✅ Successfully mapped ${createdProducts.length} Premium Products into Feed!`);

    } catch (err) {
        console.error("❌ Seeding Error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from DB.");
        process.exit(0);
    }
};

seedDatabases();
