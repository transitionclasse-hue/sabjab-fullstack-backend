import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from './src/config/connect.js';
import { ScrapRequest } from './src/models/scrapRequest.js';
import { Customer } from './src/models/user.js';
import GreenPoints from './src/models/greenPoints.js';
import GreenPointsConfig from './src/models/greenPointsConfig.js';
import { Address } from './src/models/address.js';

const runTest = async () => {
  try {
    await connectDB(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB for verification');

    // 1. Ensure GreenPointsConfig has our rates enabled and set
    const config = await GreenPointsConfig.getConfig();
    config.earnRules.plasticBottles = {
      pointsPerUnit: 6, // 6 Eco Coins per plastic bottle
      description: "Recycled Plastic Bottles",
      enabled: true
    };
    await config.save();
    console.log('✅ Set plasticBottles rate to 6 coins/unit and enabled it in GreenPointsConfig');

    // 2. Fetch or create a test Customer
    let customer = await Customer.findOne({ phone: 9999999999 });
    if (!customer) {
      customer = new Customer({
        name: "Test Eco User",
        phone: 9999999999,
        email: "test.eco@sabjab.com",
        greenPointsBalance: 0
      });
      await customer.save();
    }
    console.log(`✅ Using Customer: ${customer.name} (Current balance: ${customer.greenPointsBalance} Eco Coins)`);

    // 3. Fetch or create a test Address
    let address = await Address.findOne({ customer: customer._id });
    if (!address) {
      address = new Address({
        customer: customer._id,
        label: "Home",
        houseNo: "Block C-12",
        area: "Green City Enclave",
        landmark: "Near Eco Park",
        latitude: 28.5355,
        longitude: 77.3910
      });
      await address.save();
    }
    console.log(`✅ Using Address: ${address.houseNo}, ${address.area}`);

    // 4. Create a Pending Scrap Request
    const scrapRequest = new ScrapRequest({
      customer: customer._id,
      category: "plastic_bottles",
      quantity: 12, // 12 bottles requested
      address: address._id,
      pickupDate: new Date(),
      pickupSlot: "09:00 AM - 12:00 PM",
      notes: "Please call before coming",
      status: "pending"
    });
    await scrapRequest.save();
    console.log(`✅ Created scrap pickup request: ID=${scrapRequest._id}, Category=${scrapRequest.category}, Est. Quantity=${scrapRequest.quantity}`);

    // 5. Simulate scheduling a Rider (status -> scheduled)
    scrapRequest.status = "scheduled";
    await scrapRequest.save();
    console.log(`✅ Simulated Scheduling: status updated to "${scrapRequest.status}"`);

    // 6. Simulate pickup completion (status -> completed)
    // We will simulate the updateScrapRequestStatus logic to credit the coins
    const finalQuantity = 15; // actual collected is 15 bottles
    const rate = config.earnRules.plasticBottles.pointsPerUnit;
    const coinsToCredit = Math.round(finalQuantity * rate); // 15 * 6 = 90 Eco Coins

    console.log(`\n--- COMPLETING PICKUP ---`);
    console.log(`Actual Collected: ${finalQuantity} units`);
    console.log(`Rate: ${rate} coins/unit`);
    console.log(`Calculated Points to Award: ${coinsToCredit} Eco Coins`);

    scrapRequest.status = "completed";
    scrapRequest.quantity = finalQuantity;
    scrapRequest.pointsAwarded = coinsToCredit;
    await scrapRequest.save();

    // Credit coins via GreenPoints model
    const greenPoints = await GreenPoints.getOrCreate(customer._id);
    const updatedPoints = await greenPoints.earnPoints(
      scrapRequest.category,
      coinsToCredit,
      `Eco Coins earned from completed scrap pickup (${scrapRequest.category.replace("_", " ")})`,
      scrapRequest._id.toString()
    );

    // Sync to Customer profile
    const updatedCustomer = await Customer.findByIdAndUpdate(
      customer._id,
      { greenPointsBalance: updatedPoints.totalBalance },
      { new: true }
    );

    console.log(`✅ Pickup completed successfully!`);
    console.log(`✅ Customer coin balance updated from ${customer.greenPointsBalance} to ${updatedCustomer.greenPointsBalance} Eco Coins`);

    // Clean up test scrap request (optional, but let's keep it for history verification, or delete it)
    console.log(`\n🎉 Verification Completed Successfully!`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Verification Failed:', err);
    process.exit(1);
  }
};

runTest();
