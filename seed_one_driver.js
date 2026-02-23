/**
 * Seeds a single driver for testing the Driver app.
 * Does NOT require branches. Use when seed:drivers fails due to "No branches found".
 *
 * Login: ravi.driver@sabjab.mock / mockdriver123
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
import { DeliveryPartner } from "./src/models/index.js";

dotenv.config();

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://transitionclasse_db_user:devu1234@cluster0.7chsse0.mongodb.net/sabjab12?retryWrites=true&w=majority&appName=Cluster00";

const TEST_DRIVER = {
  name: "Ravi Kumar",
  email: "ravi.driver@sabjab.mock",
  phone: 9000000011,
  password: "mockdriver123",
  role: "DeliveryPartner",
  isActivated: true,
  liveLocation: { latitude: 28.6139, longitude: 77.209 },
  address: "Test address",
};

async function run() {
  await mongoose.connect(MONGO_URI);

  const existing = await DeliveryPartner.findOne({ email: TEST_DRIVER.email });
  if (existing) {
    await DeliveryPartner.updateOne({ _id: existing._id }, { $set: TEST_DRIVER });
    console.log("✅ Test driver updated. Login: ravi.driver@sabjab.mock / mockdriver123");
  } else {
    await DeliveryPartner.create(TEST_DRIVER);
    console.log("✅ Test driver created. Login: ravi.driver@sabjab.mock / mockdriver123");
  }

  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Failed:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
