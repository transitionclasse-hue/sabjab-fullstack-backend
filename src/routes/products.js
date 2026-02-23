import { getAllCategories, getCategoriesBySuperCategoryId } from "../controllers/product/category.js"; //
import { getSubCategoriesByCategoryId } from "../controllers/product/subCategory.js"; //
import { getProductsByCategoryId, getAllProducts, getProductById, searchProducts } from "../controllers/product/product.js"; //

export const categoryRoutes = async (fastify, options) => {
    fastify.get("/categories", getAllCategories); //
    fastify.get("/supercategories/:superCategoryId/categories", getCategoriesBySuperCategoryId); //
    fastify.get("/categories/:categoryId/subcategories", getSubCategoriesByCategoryId); //
};

export const productRoutes = async (fastify, options) => {
    fastify.get("/products", getAllProducts); //
    fastify.get("/products/:categoryId", getProductsByCategoryId); //
    fastify.get("/products/search", searchProducts); //
    fastify.get("/product/:id", getProductById);
};