import { SubCategory } from "../../models/index.js";

export const getSubCategoriesByCategoryId = async (req, reply) => {
    try {
        const { categoryId } = req.params;

        // Find all subcategories linked to this parent category
        const subCategories = await SubCategory.find({ category: categoryId }).exec();

        return reply.send({
            message: "Subcategories fetched successfully",
            data: subCategories
        });
    } catch (error) {
        return reply.status(500).send({
            message: "An error occurred fetching subcategories",
            error: error.message
        });
    }
};
