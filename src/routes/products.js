import { getAllCategories, getCategoriesBySuperCategoryId } from "../controllers/product/category.js"; //
import { getSubCategoriesByCategoryId } from "../controllers/product/subCategory.js"; //
import { getProductsByCategoryId, getAllProducts, getProductById, searchProducts } from "../controllers/product/product.js";
import { uploadSellerProduct, getMySellerProducts, getPendingSellerProducts, approveSellerProduct } from "../controllers/product/sellerProduct.js";
import { verifyToken } from "../middleware/auth.js";
export const categoryRoutes = async (fastify, options) => {
    fastify.get("/categories", getAllCategories); //
    fastify.get("/supercategories/:superCategoryId/categories", getCategoriesBySuperCategoryId); //
    fastify.get("/categories/:categoryId/subcategories", getSubCategoriesByCategoryId); //
};

export const productRoutes = async (fastify, options) => {
    // Consumer Product Routes
    fastify.get("/products", getAllProducts);
    fastify.get("/products/:categoryId", getProductsByCategoryId);
    fastify.get("/products/search", searchProducts);
    fastify.get("/product/:id", getProductById);

    // Seller Product Routes
    fastify.post("/seller/products", { preHandler: [verifyToken] }, uploadSellerProduct);
    fastify.get("/seller/products", { preHandler: [verifyToken] }, getMySellerProducts);

    // Admin Approval Routes
    fastify.get("/admin/seller-products/pending", { preHandler: [verifyToken] }, getPendingSellerProducts);
    fastify.put("/admin/seller-products/:id/approve", { preHandler: [verifyToken] }, approveSellerProduct);
};