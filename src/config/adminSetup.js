// =====================================================
// Admin Configuration for Green Points & Referral
// =====================================================

export const configureGreenPointsAdmin = (model) => {
  return {
    resource: model,
    options: {
      navigation: {
        name: "Green Points Config",
        icon: "Settings",
      },
      listProperties: ["key", "settings.enableLeaderboard", "settings.pointsExpiryDays", "updatedAt"],
      editProperties: [
        "earnRules.plasticBottles.pointsPerUnit",
        "earnRules.plasticBottles.enabled",
        "earnRules.organicWaste.pointsPerUnit",
        "earnRules.organicWaste.enabled",
        "earnRules.ecoPackaging.pointsPerOrder",
        "earnRules.ecoPackaging.enabled",
        "earnRules.referral.pointsPerReferral",
        "earnRules.referral.bonusForReferee",
        "earnRules.referral.enabled",
        "earnRules.sustainablePurchase.pointsPerHundred",
        "earnRules.sustainablePurchase.enabled",
        "earnRules.communityEvents.pointsPerEvent",
        "earnRules.communityEvents.enabled",
        "redeemRules.discount50.pointsRequired",
        "redeemRules.discount50.enabled",
        "redeemRules.discount100.pointsRequired",
        "redeemRules.discount100.enabled",
        "redeemRules.freeDelivery.pointsRequired",
        "redeemRules.freeDelivery.enabled",
        "redeemRules.ecoProductBundle.pointsRequired",
        "redeemRules.ecoProductBundle.enabled",
        "redeemRules.treePlanted.pointsRequired",
        "redeemRules.treePlanted.enabled",
        "settings.maxPointsPerOrder",
        "settings.pointsExpiryDays",
        "settings.minPointsToRedeem",
        "settings.enableLeaderboard",
        "settings.enableNotifications",
      ],
    },
  };
};

export const configureGreenPointsRecordsAdmin = (model) => {
  return {
    resource: model,
    options: {
      navigation: {
        name: "Green Points Records",
        icon: "BarChart",
      },
      listProperties: ["customer", "totalBalance", "lifetime", "lastUpdated"],
      filterProperties: ["customer", "totalBalance"],
      editProperties: ["customer", "totalBalance", "lifetime"],
    },
  };
};

export const configureReferralAdmin = (model) => {
  return {
    resource: model,
    options: {
      navigation: {
        name: "Referrals",
        icon: "Share",
      },
      listProperties: [
        "referralCode",
        "referrer",
        "referee",
        "status",
        "referrerPoints",
        "bonusesAwarded",
        "usedAt",
      ],
      filterProperties: ["status", "referrer", "referee", "bonusesAwarded"],
      editProperties: ["status", "referrerPoints", "refereePoints", "bonusesAwarded"],
    },
  };
};
