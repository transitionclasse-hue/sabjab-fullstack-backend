import mongoose from "mongoose";
import dotenv from "dotenv";
import { Branch, DeliveryPartner } from "./src/models/index.js";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://transitionclasse_db_user:devu1234@cluster0.7chsse0.mongodb.net/sabjab12?retryWrites=true&w=majority&appName=Cluster00";

const MOCK_DRIVERS = [
  { name: "Ravi Kumar", email: "ravi.driver@sabjab.mock", phone: 9000000011 },
  { name: "Aman Singh", email: "aman.driver@sabjab.mock", phone: 9000000012 },
  { name: "Nitin Yadav", email: "nitin.driver@sabjab.mock", phone: 9000000013 },
  { name: "Vikash Das", email: "vikash.driver@sabjab.mock", phone: 9000000014 },
  { name: "Rohit Mehta", email: "rohit.driver@sabjab.mock", phone: 9000000015 },
];

const jitter = (base, step, i) => Number((base + step * (i + 1)).toFixed(6));

async function run() {
  await mongoose.connect(MONGO_URI);
  const branches = await Branch.find({});
  if (!branches.length) {
    throw new Error("No branches found. Seed branches before mock drivers.");
  }

  const branch = branches[0];
  const baseLat = branch.location?.latitude ?? 28.6139;
  const baseLng = branch.location?.longitude ?? 77.209;

  let createdCount = 0;
  const driverIds = [];

  for (let i = 0; i < MOCK_DRIVERS.length; i += 1) {
    const seed = MOCK_DRIVERS[i];
    const payload = {
      ...seed,
      password: "mockdriver123",
      role: "DeliveryPartner",
      isActivated: true,
      liveLocation: {
        latitude: jitter(baseLat, 0.0023, i),
        longitude: jitter(baseLng, 0.0021, i),
      },
      address: branch.address || "Near branch zone",
      branch: branch._id,
    };

    const existing = await DeliveryPartner.findOne({ email: seed.email });
    if (existing) {
      await DeliveryPartner.updateOne({ _id: existing._id }, { $set: payload });
      driverIds.push(existing._id);
      continue;
    }

    const created = await DeliveryPartner.create(payload);
    driverIds.push(created._id);
    createdCount += 1;
  }

  await Branch.updateOne(
    { _id: branch._id },
    { $addToSet: { deliveryPartners: { $each: driverIds } } }
  );

  console.log(`Mock drivers ready. Created: ${createdCount}, Total linked to branch: ${driverIds.length}`);
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Failed seeding mock drivers:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
