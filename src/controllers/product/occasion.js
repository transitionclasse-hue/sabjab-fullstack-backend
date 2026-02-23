import Occasion from "../../models/occasion.js";

export const getOccasions = async (req, reply) => {
    try {
        // Fetch all active occasions sorted by order
        const occasions = await Occasion.find({ isActive: true })
            .select("-products") // Exclude products array for the high-level home strip
            .sort({ order: 1 });

        return reply.send(occasions);
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred fetching occasions", error });
    }
};

export const getOccasionById = async (req, reply) => {
    try {
        const { id } = req.params;

        // Fetch the occasion by ID and fully populate the products array
        // so the frontend OccasionScreen has everything needed to render the list.
        const occasion = await Occasion.findById(id).populate("products");

        if (!occasion) {
            return reply.status(404).send({ message: "Occasion not found" });
        }

        return reply.send(occasion);
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred fetching occasion details", error });
    }
};
