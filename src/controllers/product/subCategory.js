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

export const getAllSubCategories = async (req, reply) => {
    try {
        const subCategories = await SubCategory.find().exec();
        return reply.send({
            message: "All subcategories fetched successfully",
            data: subCategories
        });
    } catch (error) {
        return reply.status(500).send({
            message: "An error occurred fetching subcategories",
            error: error.message
        });
    }
};
