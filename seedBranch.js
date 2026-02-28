import "dotenv/config.js";
import mongoose from "mongoose";
import Branch from "./src/models/branch.js";

async function seedBranch() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Check if branch exists
        const existing = await Branch.findOne({ name: "DD Nagar Branch" }) || await Branch.findOne({ name: "Gwalior Main Branch" });

        const branchData = {
            name: "DD Nagar Branch",
            location: {
                latitude: 26.212400,
                longitude: 78.177200,
            },
            address: "DD Nagar, Gwalior, Madhya Pradesh",
            deliveryRadius: 2.5,
            servicedPincodes: ["474005", "474020"]
        };

        if (existing) {
            console.log("Branch already exists. Updating to DD Nagar Branch and specific pincodes...");
            Object.assign(existing, branchData);
            await existing.save();
        } else {
            await Branch.create(branchData);
            console.log("✅ DD Nagar Branch seeded with 2.5km radius and specific pincodes!");
        }
    } catch (error) {
        console.error("Error seeding branch:", error);
    } finally {
        mongoose.connection.close();
    }
}

seedBranch();
