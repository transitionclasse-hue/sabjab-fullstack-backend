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

        // ⚡ IDEMPOTENCY CHECK: Prevent duplicate addresses
        const existing = await Address.findOne({
          customer: userId,
          houseNo: house,
          area: street,
          pincode: pincode
        });

        if (existing) {
          console.log("ℹ️ Address already exists, returning existing entry.");
          return {
            success: true,
            message: "Address already exists in your book",
            data: existing,
          };
        }

        const newAddress = new Address({
          customer: userId,
          label: address || "Other", // Map 'address' key from frontend to 'label'
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

  // ✅ DELETE a saved address
  fastify.delete(
    "/address/:id",
    { preHandler: [verifyToken] },
    async (request, reply) => {
      try {
        const userId = request.user.userId;
        const { id } = request.params;
        if (!id || id === "undefined") {
          return reply.status(400).send({ success: false, message: "Invalid Address ID" });
        }

        // Find the address and verify ownership
        const address = await Address.findOne({ _id: id, customer: userId });

        if (!address) {
          return reply.status(404).send({
            success: false,
            message: "Address not found or you don't have permission to delete it.",
          });
        }

        await Address.deleteOne({ _id: id });

        return {
          success: true,
          message: "Address deleted successfully",
        };
      } catch (err) {
        console.error("Delete Address Error:", err);
        return reply.status(500).send({
          message: "Server error while deleting address",
        });
      }
    }
  );
};
