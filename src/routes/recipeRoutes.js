import { getAllRecipes, getRecipeById, toggleBookmarkRecipe, getBookmarkedRecipes } from "../controllers/recipeController.js";
import { verifyToken } from "../middleware/auth.js";

const recipeRoutes = async (app, options) => {
    // Public routes
    app.get("/recipes", getAllRecipes);
    app.get("/recipes/:id", getRecipeById);

    // Protected routes (requires login)
    app.post("/recipes/bookmark", { preHandler: [verifyToken] }, toggleBookmarkRecipe);
    app.get("/recipes/bookmarked", { preHandler: [verifyToken] }, getBookmarkedRecipes);
};

export const registerRecipeRoutes = recipeRoutes;
export default recipeRoutes;
