import mongoose from "mongoose";
import dotenv from "dotenv";
import Occasion from "./src/models/occasion.js";
import GlobalConfig from "./src/models/globalConfig.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://transitionclasse_db_user:devu1234@cluster0.7chsse0.mongodb.net/sabjab";

async function setupRamadan() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to DB");

        let ramadan = await Occasion.findOne({ name: "Ramadan Specials" });
        if (!ramadan) {
            ramadan = await Occasion.create({
                name: "Ramadan Specials",
                icon: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444869/category/ramadan_icon.png", // Generic path, should exist or use placeholder
                banner: "https://res.cloudinary.com/dponzgerb/image/upload/v1723444870/category/ramadan_banner.png",
                isActive: true,
                order: 0,
                themeColor: "#0B4D3C"
            });
            console.log("Created Ramadan Specials");
        } else {
            console.log("Ramadan Specials already exists");
        }

        await GlobalConfig.findOneAndUpdate(
            { key: "header_special_occasion" },
            {
                value: ramadan._id,
                description: "The active occasion displayed next to the search bar"
            },
            { upsert: true }
        );
        console.log("Updated GlobalConfig with Ramadan ID");

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

setupRamadan();
