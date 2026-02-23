import Category from "../../models/category.js";

export const getAllCategories = async (req, reply) => {
    try {
        const categories = await Category.find().populate("superCategory");
        return reply.send(categories);
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred", error });
    }
};

export const getCategoriesBySuperCategoryId = async (req, reply) => {
    try {
        const { superCategoryId } = req.params;
        const categories = await Category.find({ superCategory: superCategoryId }).exec();
        return reply.send({
            message: "Categories fetched successfully",
            data: categories
        });
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred fetching categories", error });
    }
};