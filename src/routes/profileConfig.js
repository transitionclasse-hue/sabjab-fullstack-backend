import { getProfileConfig } from "../controllers/profileConfig.js";

export default async function profileConfigRoutes(fastify, options) {
    fastify.get("/", getProfileConfig);
}
