import ProfileConfig from "../models/profileConfig.js";

export const getProfileConfig = async (req, reply) => {
    try {
        const config = await ProfileConfig.findOne({ isActive: true }).sort({ createdAt: -1 }).lean();
        
        // Return defaults if no config exists
        if (!config) {
            return reply.send({
                success: true,
                data: {
                    isPreferencesVisible: true,
                    isActivityVisible: true,
                    isCoinsVisible: true,
                    isEducationVisible: true,
                    isDiscoverVisible: true,
                    isEngageVisible: true,
                    isInsightsVisible: true,
                    backgroundColor: "#F8FAFC",
                    onBackgroundTextColor: "#0F172A",
                    accentColor: "#F59E0B",
                    backgroundDarkColor: "#0F172A",
                    onBackgroundTextDarkColor: "#F8FAFC",
                    accentDarkColor: "#F59E0B"
                }
            });
        }

        return reply.send({
            success: true,
            data: config
        });
    } catch (error) {
        return reply.status(500).send({
            success: false,
            message: error.message
        });
    }
};

export const updateProfileConfig = async (req, reply) => {
    try {
        const data = req.body;
        
        // Find existing config or create new one
        let config = await ProfileConfig.findOne().sort({ createdAt: -1 });
        
        if (config) {
            Object.assign(config, data);
            await config.save();
        } else {
            config = new ProfileConfig(data);
            await config.save();
        }

        return reply.send({
            success: true,
            data: config,
            message: "Profile configuration updated successfully"
        });
    } catch (error) {
        return reply.status(500).send({
            success: false,
            message: error.message
        });
    }
};
