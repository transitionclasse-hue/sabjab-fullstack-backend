import { Address } from "../models/address.js";
import { verifyToken } from "../middleware/auth.js";

export const addressRoutes = async (fastify) => {
  fastify.post(
    "/address",
    { preHandler: [verifyToken] },
    async (request, reply) => {
      try {
        const userId = request.user.userId;
        const { house, street, city, pincode, recipientName, recipientPhone, address, latitude, longitude } = request.body;

        // basic validation
        if (!address || !latitude || !longitude) {
          return reply.status(400).send({
            message: "Missing required Location fields",
          });
        }

        const newAddress = new Address({
          customer: userId,
          label: address, // Map 'address' key from frontend to 'label'
          houseNo: house,
          area: street,
          landmark: city,
          pincode,
          recipientName,
          recipientPhone,
          latitude,
          longitude,
        });

        await newAddress.save();

        return {
          success: true,
          message: "Address saved permanently",
          data: newAddress,
        };
      } catch (err) {
        console.error("Save Address Error:", err);
        return reply.status(500).send({
          message: "Database Server error",
        });
      }
    }
  );

  fastify.get(
    "/address",
    { preHandler: [verifyToken] },
    async (request, reply) => {
      try {
        const userId = request.user.userId;

        // Fetch user's saved addresses
        const addresses = await Address.find({ customer: userId }).sort({ createdAt: -1 });

        return {
          success: true,
          addresses: addresses || [],
        };
      } catch (err) {
        console.error("Fetch Address Error:", err);
        return reply.status(500).send({
          message: "Server error",
        });
      }
    }
  );
};
