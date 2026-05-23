import { verifyToken } from "../middleware/auth.js";
import GlobalConfig from "../models/globalConfig.js";

export const configRoutes = async (fastify) => {
  fastify.get("/config/support", async (req, reply) => {
    return reply.send({
      phone: process.env.SUPPORT_PHONE || "+911234567890",
      email: process.env.SUPPORT_EMAIL || "help@sabjab.com",
    });
  });

  fastify.get("/config/app-version", async (req, reply) => {
    try {
      const GlobalConfig = (await import("../models/globalConfig.js")).default;
      const config = await GlobalConfig.findOne({ key: "app_version_config" }).lean();

      if (!config) {
        return reply.send({
          currentVersion: "1.0.0",
          updateAvailable: false,
          updateMessage: "",
          isMandatory: false
        });
      }

      return reply.send(config.value);
    } catch (error) {
      console.error("APP VERSION API ERROR:", error);
      return reply.status(500).send({ message: "Error fetching app version" });
    }
  });

  fastify.get("/config/safe-mode", async (req, reply) => {
    try {
      const config = await GlobalConfig.findOne({ key: "safe_mode_config" }).lean();

      if (!config) {
        return reply.send({
          isWebViewMode: false,
          webViewUrl: "https://sabjab.com"
        });
      }

      return reply.send(config.value);
    } catch (error) {
      console.error("SAFE MODE API ERROR:", error);
      return reply.send({ isWebViewMode: false });
    }
  });

  fastify.get("/config/assignment-timeout", async (req, reply) => {
    try {
      const config = await GlobalConfig.findOne({ key: "assignment_timeout_config" }).lean();
      if (!config) {
        return reply.send({ minutes: 5 });
      }
      return reply.send(config.value);
    } catch (error) {
      console.error("ASSIGNMENT TIMEOUT API ERROR:", error);
      return reply.send({ minutes: 5 });
    }
  });

};
