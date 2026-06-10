import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const StoreStatus = (await import("./src/models/storeStatus.js")).default;

async function runTest() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully.");

    let config = await StoreStatus.findOne({ key: "primary" });
    if (!config) {
      config = await StoreStatus.create({ key: "primary" });
    }

    const backup = {
      acceptOrders: config.acceptOrders,
      acceptInstantOrders: config.acceptInstantOrders,
      acceptSlotOrders: config.acceptSlotOrders,
      acceptChoiceOrders: config.acceptChoiceOrders,
    };

    function simulateOrderValidation(storeConfig, orderType, deliveryMode) {
      const acceptInstant = storeConfig.acceptInstantOrders !== false;
      const acceptSlot = storeConfig.acceptSlotOrders !== false;
      const acceptChoice = storeConfig.acceptChoiceOrders !== false;

      if (storeConfig.acceptOrders === false || (!acceptInstant && !acceptSlot && !acceptChoice)) {
        return "Store is closed and fresh order not accepting";
      }

      const isChoice = orderType === "choice";
      const isSlot = deliveryMode === "slot";
      const isInstant = !isChoice && !isSlot;

      if (isInstant && !acceptInstant) {
        const optionsOn = [];
        if (acceptSlot) optionsOn.push("slot");
        if (acceptChoice) optionsOn.push("choice");
        let msg = "Store is closed for instant delivery.";
        if (optionsOn.length > 0) {
          msg += ` Instead, try ${optionsOn.join(" or ")} delivery.`;
        }
        return msg;
      }

      if (isSlot && !acceptSlot) {
        const optionsOn = [];
        if (acceptInstant) optionsOn.push("instant");
        if (acceptChoice) optionsOn.push("choice");
        let msg = "Store is closed for slot delivery.";
        if (optionsOn.length > 0) {
          msg += ` Instead, try ${optionsOn.join(" or ")} delivery.`;
        }
        return msg;
      }

      if (isChoice && !acceptChoice) {
        const optionsOn = [];
        if (acceptInstant) optionsOn.push("instant");
        if (acceptSlot) optionsOn.push("slot");
        let msg = "Store is closed for choice delivery.";
        if (optionsOn.length > 0) {
          msg += ` Instead, try ${optionsOn.join(" or ")} delivery.`;
        }
        return msg;
      }
      return "Order allowed";
    }

    // Test Case A: Only Instant closed (slot & choice open)
    console.log("\n--- Test Case A: Only Instant closed (slot & choice open) ---");
    config.acceptOrders = true;
    config.acceptInstantOrders = false;
    config.acceptSlotOrders = true;
    config.acceptChoiceOrders = true;
    await config.save();
    let refreshed = await StoreStatus.findOne({ key: "primary" });
    console.log("Instant order check:", simulateOrderValidation(refreshed, "instant", "instant"));

    // Test Case B: Instant & Choice closed (only slot open)
    console.log("\n--- Test Case B: Instant & Choice closed (only slot open) ---");
    config.acceptOrders = true;
    config.acceptInstantOrders = false;
    config.acceptSlotOrders = true;
    config.acceptChoiceOrders = false;
    await config.save();
    refreshed = await StoreStatus.findOne({ key: "primary" });
    console.log("Instant order check:", simulateOrderValidation(refreshed, "instant", "instant"));

    // Test Case C: All toggles closed (but acceptOrders is true)
    console.log("\n--- Test Case C: All toggles closed (but acceptOrders is true) ---");
    config.acceptOrders = true;
    config.acceptInstantOrders = false;
    config.acceptSlotOrders = false;
    config.acceptChoiceOrders = false;
    await config.save();
    refreshed = await StoreStatus.findOne({ key: "primary" });
    console.log("Instant order check:", simulateOrderValidation(refreshed, "instant", "instant"));

    // Restore backup
    console.log("\nRestoring original store configuration...");
    config.acceptOrders = backup.acceptOrders;
    config.acceptInstantOrders = backup.acceptInstantOrders;
    config.acceptSlotOrders = backup.acceptSlotOrders;
    config.acceptChoiceOrders = backup.acceptChoiceOrders;
    await config.save();
    console.log("Original configuration restored successfully.");

  } catch (error) {
    console.error("Test execution failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
    process.exit(0);
  }
}

runTest();
