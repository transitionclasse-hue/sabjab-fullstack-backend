import mongoose from "mongoose";

const profileConfigSchema = new mongoose.Schema({
    isPreferencesVisible: { type: Boolean, default: true },
    isActivityVisible: { type: Boolean, default: true },
    isCoinsVisible: { type: Boolean, default: true },
    isEducationVisible: { type: Boolean, default: true },
    isDiscoverVisible: { type: Boolean, default: true },
    isEngageVisible: { type: Boolean, default: true },
    isInsightsVisible: { type: Boolean, default: true },
    isSupportVisible: { type: Boolean, default: true },
    isVersionVisible: { type: Boolean, default: true },
    isQuickActionsVisible: { type: Boolean, default: true },
    isGstDetailsVisible: { type: Boolean, default: true },
    isNeighbourhoodVisible: { type: Boolean, default: true },
    
    // Payments & Money Cards Visibility
    isBawalEarningsVisible: { type: Boolean, default: true },
    isPaymentMethodsVisible: { type: Boolean, default: true },
    isRefundStatusVisible: { type: Boolean, default: true },
    isGiftCardsVisible: { type: Boolean, default: true },
    isRewardsCardVisible: { type: Boolean, default: true },
    isSpendingTrendsVisible: { type: Boolean, default: true },
    // SabJab Samachar
    isSamacharVisible: { type: Boolean, default: true },
    samacharUrl: { type: String, default: "https://sabjab.com/news" },
    samacharTitle: { type: String, default: "SabJab Samachar" },
    samacharSubtitle: { type: String, default: "Get the latest local updates, deals, & stories directly in the app!" },
    samacharBadge: { type: String, default: "News" },
    samacharColor: { type: String, default: "#FEF3C7" },
    
    // Light Mode Styles
    backgroundColor: { type: String, default: "#F8FAFC" },
    onBackgroundTextColor: { type: String, default: "#0F172A" },
    accentColor: { type: String, default: "#F59E0B" },
    
    // Dark Mode Styles
    backgroundDarkColor: { type: String, default: "#0F172A" },
    onBackgroundTextDarkColor: { type: String, default: "#F8FAFC" },
    accentDarkColor: { type: String, default: "#F59E0B" },

    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const ProfileConfig = mongoose.model("ProfileConfig", profileConfigSchema);
export default ProfileConfig;
