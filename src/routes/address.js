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

  // ✅ DELETE a saved address
  fastify.delete(
    "/address/:id",
    { preHandler: [verifyToken] },
    async (request, reply) => {
      try {
        const userId = request.user.userId;
        const { id } = request.params;

        // Find the address and verify ownership
        const address = await Address.findOne({ _id: id, customer: userId });

        if (!address) {
          return reply.status(404).send({
            success: false,
            message: "Address not found or you don't have permission to delete it.",
          });
        }

        await Address.findByIdAndDelete(id);

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
