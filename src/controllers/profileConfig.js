import ProfileConfig from "../models/profileConfig.js";

const DEFAULT_CONFIG = {
    isPreferencesVisible: true,
    isActivityVisible: true,
    isCoinsVisible: true,
    isEducationVisible: true,
    isDiscoverVisible: true,
    isEngageVisible: true,
    isInsightsVisible: true,
    isSupportVisible: true,
    isVersionVisible: true,
    isQuickActionsVisible: true,
    isGstDetailsVisible: true,
    isSamacharVisible: true,
    samacharUrl: "https://sabjab.com/news",
    samacharTitle: "SabJab Samachar",
    samacharSubtitle: "Get the latest local updates, deals, & stories directly in the app!",
    samacharBadge: "News",
    samacharColor: "#FEF3C7",
    backgroundColor: "#F8FAFC",
    onBackgroundTextColor: "#0F172A",
    accentColor: "#F59E0B",
    backgroundDarkColor: "#0F172A",
    onBackgroundTextDarkColor: "#F8FAFC",
    accentDarkColor: "#F59E0B"
};

export const getProfileConfig = async (req, reply) => {
    try {
        const config = await ProfileConfig.findOne({ isActive: true }).sort({ createdAt: -1 }).lean();
        
        // Return defaults merged with stored config to handle newly added schema fields
        const mergedData = config ? { ...DEFAULT_CONFIG, ...config } : DEFAULT_CONFIG;

        return reply.send({
            success: true,
            data: mergedData
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
