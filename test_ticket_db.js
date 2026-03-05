import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

async function testDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    // Explicitly import Counter so it registers
    await import("./src/models/counter.js");
    
    const Ticket = (await import("./src/models/ticket.js")).default;
    const Customer = (await import("./src/models/user.js")).Customer;

    const customer = await Customer.findOne();
    if (!customer) {
        console.log("No customer found");
        process.exit();
    }

    const ticket = await Ticket.create({
        customer: customer._id,
        category: "General",
        subject: "Direct DB Test",
        description: "Checking if schema is valid"
    });
    console.log("Ticket created successfully in DB:", ticket);

    const SupportMessage = (await import("./src/models/supportMessage.js")).default;
    const msg = await SupportMessage.create({
        customer: customer._id,
        ticket: ticket._id,
        sender: "customer",
        message: "Checking if schema is valid"
    });
    console.log("Message created successfully in DB:", msg);

  } catch (err) {
    console.error("DB Test Error:", err);
  } finally {
    process.exit();
  }
}
testDB();
