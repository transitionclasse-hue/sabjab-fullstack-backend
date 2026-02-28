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

export const createCategory = async (req, reply) => {
    try {
        const { name, image, superCategory } = req.body;
        const newCategory = new Category({ name, image, superCategory });
        await newCategory.save();
        return reply.status(201).send(newCategory);
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred creating category", error });
    }
};

export const updateCategory = async (req, reply) => {
    try {
        const { id } = req.params;
        const { name, image, superCategory } = req.body;
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { name, image, superCategory },
            { new: true, runValidators: true }
        );
        if (!updatedCategory) {
            return reply.status(404).send({ message: "Category not found" });
        }
        return reply.send(updatedCategory);
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred updating category", error });
    }
};

export const deleteCategory = async (req, reply) => {
    try {
        const { id } = req.params;
        const deletedCategory = await Category.findByIdAndDelete(id);
        if (!deletedCategory) {
            return reply.status(404).send({ message: "Category not found" });
        }
        return reply.send({ message: "Category deleted successfully" });
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred deleting category", error });
    }
};