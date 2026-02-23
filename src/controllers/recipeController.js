import Recipe from "../models/recipe.js";
import { Customer } from "../models/user.js";

/**
 * ✅ 1. Get All Recipes (with optional category filter)
 */
export const getAllRecipes = async (req, reply) => {
    try {
        const { category } = req.query;
        const filter = category ? { category, isActive: true } : { isActive: true };

        const recipes = await Recipe.find(filter).sort({ createdAt: -1 });
        return reply.send(recipes);
    } catch (error) {
        console.error("Get Recipes Error:", error);
        return reply.status(500).send({ message: "Internal Server Error" });
    }
};

/**
 * ✅ 2. Get Single Recipe Details
 */
export const getRecipeById = async (req, reply) => {
    try {
        const { id } = req.params;
        const recipe = await Recipe.findById(id).populate("ingredients.item");

        if (!recipe) {
            return reply.status(404).send({ message: "Recipe not found." });
        }

        return reply.send(recipe);
    } catch (error) {
        console.error("Get Recipe Detail Error:", error);
        return reply.status(500).send({ message: "Internal Server Error" });
    }
};

/**
 * ✅ 3. Toggle Bookmark
 */
export const toggleBookmarkRecipe = async (req, reply) => {
    try {
        const { recipeId } = req.body;
        const userId = req.user._id;

        const customer = await Customer.findById(userId);
        if (!customer) {
            return reply.status(404).send({ message: "Customer not found." });
        }

        const index = customer.bookmarkedRecipes.indexOf(recipeId);
        let isBookmarked = false;

        if (index === -1) {
            customer.bookmarkedRecipes.push(recipeId);
            isBookmarked = true;
        } else {
            customer.bookmarkedRecipes.splice(index, 1);
            isBookmarked = false;
        }

        await customer.save();
        return reply.send({
            message: isBookmarked ? "Recipe bookmarked!" : "Bookmark removed!",
            isBookmarked
        });
    } catch (error) {
        console.error("Toggle Bookmark Error:", error);
        return reply.status(500).send({ message: "Internal Server Error" });
    }
};

/**
 * ✅ 4. Get Bookmarked Recipes
 */
export const getBookmarkedRecipes = async (req, reply) => {
    try {
        const userId = req.user._id;
        const customer = await Customer.findById(userId).populate("bookmarkedRecipes");

        return reply.send(customer ? customer.bookmarkedRecipes : []);
    } catch (error) {
        console.error("Get Bookmarks Error:", error);
        return reply.status(500).send({ message: "Internal Server Error" });
    }
};
