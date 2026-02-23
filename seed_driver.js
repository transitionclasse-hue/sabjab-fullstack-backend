import mongoose from "mongoose";
import { Order, DeliveryPartner } from "./src/models/index.js";
import dotenv from "dotenv";
dotenv.config();

mongoose.connect(process.env.MONGO_URI || "mongodb+srv://transitionclasse_db_user:devu1234@cluster0.7chsse0.mongodb.net/sabjab12?retryWrites=true&w=majority&appName=Cluster00")
    .then(async () => {
        try {
            // 1. Check if an active order exists
            const orders = await Order.find({ status: { $in: ["available", "confirmed"] } });
            if (orders.length === 0) {
                console.log("No active orders found to assign a driver to.");
                process.exit(0);
            }

            const order = orders[0];
            console.log("Found active order:", order._id);

            // 2. Create a generic Delivery Partner
            let driver = await DeliveryPartner.findOne({ phone: 9998887777 });
            if (!driver) {
                driver = new DeliveryPartner({
                    name: "Test Driver",
                    email: "driver@test.com",
                    password: "password123",
                    phone: 9998887777,
                    role: "DeliveryPartner",
                    isActivated: true,
                    liveLocation: {
                        latitude: order.pickupLocation?.latitude - 0.005 || 28.6139 - 0.005,
                        longitude: order.pickupLocation?.longitude - 0.005 || 77.2090 - 0.005
                    }
                });
                await driver.save();
                console.log("Created test driver:", driver._id);
            } else {
                console.log("Found existing test driver:", driver._id);
            }

            // 3. Assign Driver to Order and Update Status
            order.deliveryPartner = driver._id;
            order.status = "confirmed";
            order.deliveryPersonLocation = {
                latitude: driver.liveLocation.latitude,
                longitude: driver.liveLocation.longitude,
                address: "Near Branch"
            };
            await order.save();
            console.log("✅ Driver assigned to order and status set to 'confirmed'!");

        } catch (err) {
            console.error(err);
        }
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
