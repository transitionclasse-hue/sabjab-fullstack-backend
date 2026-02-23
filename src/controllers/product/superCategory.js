import SuperCategory from "../../models/superCategory.js";

export const getAllSuperCategories = async (req, reply) => {
    try {
        const superCategories = await SuperCategory.find().sort({ order: 1 });
        return reply.send(superCategories);
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred fetching supercategories", error });
    }
};
