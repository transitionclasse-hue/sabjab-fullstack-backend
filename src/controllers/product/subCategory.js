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

export const createSubCategory = async (req, reply) => {
    try {
        const { name, image, category } = req.body;
        const newSubCategory = new SubCategory({ name, image, category });
        await newSubCategory.save();
        return reply.status(201).send(newSubCategory);
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred creating subcategory", error });
    }
};

export const updateSubCategory = async (req, reply) => {
    try {
        const { id } = req.params;
        const { name, image, category } = req.body;
        const updatedSubCategory = await SubCategory.findByIdAndUpdate(
            id,
            { name, image, category },
            { new: true, runValidators: true }
        );
        if (!updatedSubCategory) {
            return reply.status(404).send({ message: "SubCategory not found" });
        }
        return reply.send(updatedSubCategory);
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred updating subcategory", error });
    }
};

export const deleteSubCategory = async (req, reply) => {
    try {
        const { id } = req.params;
        const deletedSubCategory = await SubCategory.findByIdAndDelete(id);
        if (!deletedSubCategory) {
            return reply.status(404).send({ message: "SubCategory not found" });
        }
        return reply.send({ message: "SubCategory deleted successfully" });
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred deleting subcategory", error });
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
