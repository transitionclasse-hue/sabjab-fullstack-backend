import Category from "../../models/category.js";
import { getSafeSensitiveMode } from "../../utils/sensitiveMode.js";

const isChoiceOnlyRequest = (value) => ["1", "true", "yes"].includes(String(value || "").toLowerCase());

// PUBLIC — used by the frontend; respects sensitive mode
export const getCategoriesBySuperCategoryId = async (req, reply) => {
    try {
        const { superCategoryId } = req.params;
        const shouldFilterChoice = isChoiceOnlyRequest(req.query?.choiceOnly);
        const isManager = req.url.includes('/manager');
        const hideSensitive = await getSafeSensitiveMode(req);
        const sensitiveFilter = hideSensitive ? { isSensitive: { $ne: true } } : {};

        const categories = await Category.find({
            superCategory: superCategoryId,
            ...(!isManager ? { isAvailable: true } : {}),
            ...sensitiveFilter,
            ...(shouldFilterChoice ? { isChoice: true } : {}),
        }).exec();

        return reply.send({
            message: "Categories fetched successfully",
            data: categories
        });
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred fetching categories", error });
    }
};

// MANAGER — returns all categories (no sensitive filter)
export const getAllCategories = async (req, reply) => {
    try {
        const isManager = req.url.includes('/manager');
        const categories = await Category.find({
            ...(shouldFilterChoice ? { isChoice: true } : {}),
            ...(!isManager ? { isAvailable: true } : {})
        })
            .sort({ createdAt: -1 })
            .populate("superCategory");
        return reply.send(categories);
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred", error });
    }
};

export const createCategory = async (req, reply) => {
    try {
        const { name, image, superCategory, isSensitive, isAvailable, isChoice, canEarnCoins } = req.body;
        const newCategory = new Category({ name, image, superCategory, isSensitive, isAvailable, isChoice, canEarnCoins });
        await newCategory.save();
        return reply.status(201).send(newCategory);
    } catch (error) {
        return reply.status(500).send({ message: "An error occurred creating category", error });
    }
};

export const updateCategory = async (req, reply) => {
    try {
        const { id } = req.params;
        const { name, image, superCategory, isSensitive, isAvailable, isChoice, canEarnCoins } = req.body;
        const updatedCategory = await Category.findByIdAndUpdate(
            id,
            { name, image, superCategory, isSensitive, isAvailable, isChoice, canEarnCoins },
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
