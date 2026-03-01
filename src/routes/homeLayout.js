import { getHomeLayout, getActiveHomeVersion } from "../controllers/homeLayout.js";

export const homeLayoutRoutes = async (fastify, options) => {
    fastify.get("/home-layout", getHomeLayout);
    fastify.get("/home-version", getActiveHomeVersion);
};
