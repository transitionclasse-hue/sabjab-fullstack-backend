import jwt from "jsonwebtoken";

/**
 * ✅ FASTIFY AUTH MIDDLEWARE
 * Secured for the new OTP login flow and optimized for Render's environment.
 */
/**
 * 🛡️ ROLE-BASED MIDDLEWARE
 * Verifies token AND checks that user is Admin or Manager.
 */
export const verifyManager = async (req, reply) => {
    await verifyToken(req, reply);
    // If verifyToken already sent a response (401/403), stop here
    if (reply.sent) return;
    const role = req.user?.role;
    if (role !== "Admin" && role !== "Manager" && role !== "SubManager") {
        return reply.status(403).send({ message: "Forbidden. Admin, Manager, or SubManager role required." });
    }
    return true;
};

export const verifyToken = async (req, reply) => {
    try {
        const authHeader = req.headers["authorization"];
        
        // 1. Validate Header Presence
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return reply.status(401).send({ message: "Access token required" });
        }

        const token = authHeader.split(" ")[1];
        
        // 2. Verify against the same secret used in your updated auth controller
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        
        /**
         * 3. Attach decoded payload to req.user
         * Matches payload: { userId: user._id, role: user.role }
         */
        req.user = decoded;

        // In Fastify, returning true in a preHandler allows the request to continue
        return true;
    } catch (error) {
        // 4. Enhanced Error Handling for Frontend Refresh Logic
        if (error.name === 'TokenExpiredError') {
            return reply.status(401).send({ 
                message: "Token Expired", 
                code: "TOKEN_EXPIRED" 
            });
        }

        return reply.status(403).send({ message: "Invalid or tampered token" });
    }
};
