import { getAllSuperCategories } from "../controllers/product/superCategory.js";

export const superCategoryRoutes = async (fastify, options) => {
    fastify.get("/supercategories", getAllSuperCategories);
};
