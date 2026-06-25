import jwt from "jsonwebtoken";
import Reel from "../models/reel.js";
import Product from "../models/products.js";
import WalletTransaction from "../models/walletTransaction.js";

/**
 * Create a new Reel
 */
export const createReel = async (req, reply) => {
  try {
    const { videoUrl, thumbnailUrl, caption, productId } = req.body;
    const creatorId = req.user.userId;

    if (!videoUrl) {
      return reply.code(400).send({ message: "Video URL is required" });
    }
    if (!productId) {
      return reply.code(400).send({ message: "Product ID is required" });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return reply.code(404).send({ message: "Product not found" });
    }

    const reel = new Reel({
      videoUrl,
      thumbnailUrl: thumbnailUrl || "",
      caption: caption || "",
      creator: creatorId,
      product: productId,
    });

    await reel.save();
    
    // Populate before sending
    const populated = await Reel.findById(reel._id)
      .populate("creator", "name phone email username profileImage")
      .populate("product", "name price discountPrice image isAvailable stock");

    return reply.code(201).send({ success: true, reel: populated });
  } catch (error) {
    console.error("Error creating reel:", error);
    return reply.code(500).send({ message: "Failed to create reel", error: error.message });
  }
};

/**
 * Get Reels Feed (Paginated)
 */
export const getReels = async (req, reply) => {
  try {
    // 1. Check optional user auth token
    let userId = null;
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        userId = decoded.userId;
      } catch (err) {
        // Ignore invalid token, treat as guest
      }
    }

    // 2. Load followed and liked creators for personalization
    let followedCreatorIds = [];
    let likedCreatorIds = [];
    if (userId) {
      const { Customer } = await import("../models/user.js");
      const currentUser = await Customer.findById(userId).select("following").lean();
      if (currentUser && currentUser.following) {
        followedCreatorIds = currentUser.following.map(id => id.toString());
      }

      const userLikedReels = await Reel.find({ likes: userId }).select("creator").lean();
      likedCreatorIds = userLikedReels.map(r => r.creator?.toString()).filter(Boolean);
    }

    // 3. Fetch candidate pool (top 200 newest reels)
    const candidates = await Reel.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .populate("creator", "name phone email username profileImage")
      .populate("product", "name price discountPrice image isAvailable stock variations isChoice")
      .lean();

    // 4. Set up seed-based random number generator
    const seed = req.query.seed || Math.random().toString(36).substring(2, 15);
    // Simple Mulberry32 generator
    const createRandom = (seedStr) => {
      let h = 0;
      for (let i = 0; i < seedStr.length; i++) {
        h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
      }
      return function() {
        let z = (h += 0x6D2B79F5);
        z = Math.imul(z ^ (z >>> 15), z | 1);
        z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
        return ((z ^ (z >>> 14)) >>> 0) / 4294967296;
      };
    };
    const random = createRandom(seed);

    // 5. Score candidate reels
    const scoredReels = candidates.map(reel => {
      const likesCount = reel.likes?.length || 0;
      const sharesCount = reel.shares || 0;
      const viewsCount = reel.views || 0;
      
      const engagement = (likesCount * 10) + (sharesCount * 5) + (viewsCount * 0.5);
      
      let boost = 1.0;
      const creatorIdStr = reel.creator?._id?.toString() || reel.creator?.toString();
      if (creatorIdStr) {
        if (followedCreatorIds.includes(creatorIdStr)) boost += 1.5;
        if (likedCreatorIds.includes(creatorIdStr)) boost += 0.8;
      }
      
      const ageInHours = (Date.now() - new Date(reel.createdAt).getTime()) / (1000 * 60 * 60);
      const recencyFactor = Math.exp(-ageInHours / 168); // Decay over 1 week (168 hours)
      
      const baseScore = (1 + engagement) * boost * recencyFactor;
      
      // Introduce seed-based randomness (controlled noise between 0.5x and 1.5x of the base score)
      const randomMultiplier = 0.5 + random() * 1.0;
      const finalScore = baseScore * randomMultiplier;
      
      return { reel, finalScore };
    });

    // 6. Sort candidate reels by final score descending
    scoredReels.sort((a, b) => b.finalScore - a.finalScore);
    const sortedReels = scoredReels.map(item => item.reel);

    // 7. Paginate results
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reels = sortedReels.slice(skip, skip + limit);
    const total = await Reel.countDocuments();

    return reply.send({
      success: true,
      reels,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        seed,
      },
    });
  } catch (error) {
    console.error("Error fetching reels:", error);
    return reply.code(500).send({ message: "Failed to retrieve reels", error: error.message });
  }
};

/**
 * Toggle Like on Reel
 */
export const likeReel = async (req, reply) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const reel = await Reel.findById(id);
    if (!reel) {
      return reply.code(404).send({ message: "Reel not found" });
    }

    const index = reel.likes.indexOf(userId);
    let isLiked = false;

    if (index > -1) {
      // Unlike
      reel.likes.splice(index, 1);
    } else {
      // Like
      reel.likes.push(userId);
      isLiked = true;
    }

    await reel.save();

    return reply.send({
      success: true,
      likesCount: reel.likes.length,
      isLiked,
    });
  } catch (error) {
    console.error("Error liking reel:", error);
    return reply.code(500).send({ message: "Failed to update like status", error: error.message });
  }
};

/**
 * Increment Reel View count
 */
export const viewReel = async (req, reply) => {
  try {
    const { id } = req.params;
    const reel = await Reel.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

    if (!reel) {
      return reply.code(404).send({ message: "Reel not found" });
    }

    return reply.send({ success: true, views: reel.views });
  } catch (error) {
    console.error("Error incrementing reel view:", error);
    return reply.code(500).send({ message: "Failed to increment view", error: error.message });
  }
};

/**
 * Increment Reel Share count
 */
export const shareReel = async (req, reply) => {
  try {
    const { id } = req.params;
    const reel = await Reel.findByIdAndUpdate(
      id,
      { $inc: { shares: 1 } },
      { new: true }
    );

    if (!reel) {
      return reply.code(404).send({ message: "Reel not found" });
    }

    return reply.send({ success: true, shares: reel.shares });
  } catch (error) {
    console.error("Error incrementing reel share:", error);
    return reply.code(500).send({ message: "Failed to increment share", error: error.message });
  }
};

/**
 * Get reels uploaded by the logged-in creator
 */
export const getMyReels = async (req, reply) => {
  try {
    const creatorId = req.user.userId;
    const reels = await Reel.find({ creator: creatorId })
      .sort({ createdAt: -1 })
      .populate("product", "name price discountPrice image isAvailable stock");

    return reply.send({ success: true, reels });
  } catch (error) {
    console.error("Error fetching my reels:", error);
    return reply.code(500).send({ message: "Failed to retrieve my reels", error: error.message });
  }
};

/**
 * Get Creator's commission earnings
 */
export const getReelEarnings = async (req, reply) => {
  try {
    const creatorId = req.user.userId;

    // Fetch all commission transactions
    const txns = await WalletTransaction.find({
      customer: creatorId,
      txnType: "reel_commission",
      status: "completed",
    })
      .sort({ createdAt: -1 })
      .populate("order", "orderId totalAmount createdAt");

    // Calculate total earned
    const totalEarnings = txns.reduce((sum, txn) => sum + (txn.amount || 0), 0);
    
    // Itemize referrals count
    const totalSalesReferred = txns.length;

    return reply.send({
      success: true,
      totalEarnings: Math.round(totalEarnings * 100) / 100,
      totalSalesReferred,
      transactions: txns,
    });
  } catch (error) {
    console.error("Error getting reel earnings:", error);
    return reply.code(500).send({ message: "Failed to retrieve earnings info", error: error.message });
  }
};

/**
 * Follow or Unfollow a Creator
 */
export const followCreator = async (req, reply) => {
  try {
    const { creatorId } = req.params;
    const userId = req.user.userId;

    if (creatorId === userId) {
      return reply.code(400).send({ message: "You cannot follow yourself" });
    }

    const { Customer } = await import("../models/user.js");
    const user = await Customer.findById(userId);
    if (!user) {
      return reply.code(404).send({ message: "User not found" });
    }

    const creator = await Customer.findById(creatorId);
    if (!creator) {
      return reply.code(404).send({ message: "Creator not found" });
    }

    if (!user.following) {
      user.following = [];
    }

    const index = user.following.indexOf(creatorId);
    let isFollowing = false;

    if (index > -1) {
      user.following.splice(index, 1);
    } else {
      user.following.push(creatorId);
      isFollowing = true;
    }

    await user.save();

    return reply.send({
      success: true,
      isFollowing,
      following: user.following,
    });
  } catch (error) {
    console.error("Error following creator:", error);
    return reply.code(500).send({ message: "Failed to update follow status", error: error.message });
  }
};

/**
 * Get Weekly Leaderboard of Bawal Creators
 */
export const getReelsLeaderboard = async (req, reply) => {
  try {
    const leaderboard = await WalletTransaction.aggregate([
      {
        $match: {
          txnType: "reel_commission",
          status: "completed",
        },
      },
      {
        $group: {
          _id: "$customer",
          totalCommission: { $sum: "$amount" },
          salesCount: { $sum: 1 },
        },
      },
      {
        $sort: { totalCommission: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    const { Customer } = await import("../models/user.js");
    const populated = await Promise.all(
      leaderboard.map(async (item) => {
        const creator = await Customer.findById(item._id).select("name username");
        return {
          creator: creator || { name: "SabJab User", username: "sabjab_user" },
          totalCommission: Math.round(item.totalCommission * 100) / 100,
          salesCount: item.salesCount,
        };
      })
    );

    return reply.send({
      success: true,
      leaderboard: populated,
    });
  } catch (error) {
    console.error("Error generating reels leaderboard:", error);
    return reply.code(500).send({ message: "Failed to load leaderboard", error: error.message });
  }
};

/**
 * Get Recent Purchases in the System for the Live Ticker
 */
export const getRecentPurchases = async (req, reply) => {
  try {
    const { Order } = await import("../models/order.js");
    const orders = await Order.find({ status: { $ne: "cancelled" } })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("customer", "name username")
      .populate("items.item", "name");

    const recentPurchases = orders
      .filter(o => o.customer && o.items && o.items.length > 0)
      .map(order => {
        const buyerName = order.customer.username || order.customer.name || "A Customer";
        
        let maskedName = buyerName;
        if (buyerName.length > 2) {
          maskedName = buyerName.charAt(0) + "***" + buyerName.charAt(buyerName.length - 1);
        } else {
          maskedName = buyerName + "***";
        }

        const firstItem = order.items[0];
        const productName = firstItem.item ? firstItem.item.name : "grocery items";

        const diffMs = Date.now() - new Date(order.createdAt).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        let timeAgoStr = "Just now";
        if (diffMins > 0 && diffMins < 60) {
          timeAgoStr = `${diffMins} min${diffMins > 1 ? "s" : ""} ago`;
        } else if (diffMins >= 60) {
          const diffHours = Math.floor(diffMins / 60);
          timeAgoStr = `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
        }

        return {
          id: order._id.toString(),
          buyerName: maskedName,
          productName,
          timeAgo: timeAgoStr,
        };
      });

    return reply.send({
      success: true,
      purchases: recentPurchases,
    });
  } catch (error) {
    console.error("Error retrieving recent purchases:", error);
    const mockups = [
      { id: "mock1", buyerName: "R***v", productName: "Maggi 2-minute Double Masala", timeAgo: "2 mins ago" },
      { id: "mock2", buyerName: "A***t", productName: "Dhara Filtered Groundnut oil", timeAgo: "15 mins ago" },
      { id: "mock3", buyerName: "P***a", productName: "Fresh Cauliflower (Gobhi)", timeAgo: "24 mins ago" },
    ];
    return reply.send({
      success: true,
      purchases: mockups,
    });
  }
};

/**
 * Add a Recommended Product (must be purchased by user)
 */
export const addRecommendedProduct = async (req, reply) => {
  try {
    const { productId, category } = req.body;
    const userId = req.user.userId;

    if (!productId) {
      return reply.code(400).send({ message: "Product ID is required" });
    }

    const Product = (await import("../models/products.js")).default;
    const product = await Product.findById(productId);
    if (!product) {
      return reply.code(404).send({ message: "Product not found" });
    }

    const { Order } = await import("../models/order.js");
    const pastOrder = await Order.findOne({
      customer: userId,
      "items.item": productId,
      status: "delivered"
    });

    if (!pastOrder) {
      return reply.code(403).send({ message: "You can only recommend products you have purchased and received." });
    }

    const { Customer } = await import("../models/user.js");
    const user = await Customer.findById(userId);

    const alreadyRecommended = user.recommendedProducts?.some(r => r.product.toString() === productId);
    if (alreadyRecommended) {
      return reply.code(400).send({ message: "You have already recommended this product." });
    }

    if (!user.recommendedProducts) user.recommendedProducts = [];
    user.recommendedProducts.push({
      product: productId,
      category: category || product.category || "General",
    });

    await user.save();

    return reply.send({ success: true, message: "Product added to recommendations" });
  } catch (error) {
    console.error("Error adding recommended product:", error);
    return reply.code(500).send({ message: "Failed to add recommendation", error: error.message });
  }
};

/**
 * Get Creator's Recommended Products
 */
export const getCreatorRecommendations = async (req, reply) => {
  try {
    const { creatorId } = req.params;

    const { Customer } = await import("../models/user.js");
    const creator = await Customer.findById(creatorId).populate({
      path: "recommendedProducts.product",
      select: "name price discountPrice image isAvailable stock category"
    }).select("-password -otp");

    if (!creator) {
      return reply.code(404).send({ message: "Creator not found" });
    }

    return reply.send({ 
      success: true, 
      creator: { name: creator.name, username: creator.username, profileImage: creator.profileImage },
      recommendedProducts: creator.recommendedProducts || [] 
    });
  } catch (error) {
    console.error("Error fetching recommended products:", error);
    return reply.code(500).send({ message: "Failed to fetch recommendations", error: error.message });
  }
};

/**
 * Get influencers who recommended a specific product
 */
export const getProductInfluencers = async (req, reply) => {
  try {
    const { productId } = req.params;
    const { Customer } = await import("../models/user.js");

    const influencers = await Customer.find({
      "recommendedProducts.product": productId
    }).select("name username profileImage").limit(10);

    return reply.send({ success: true, influencers });
  } catch (error) {
    console.error("Error fetching product influencers:", error);
    return reply.code(500).send({ message: "Failed to fetch influencers", error: error.message });
  }
};

/**
 * Get top 10 recommended products in a category
 */
export const getTopCategoryRecommendations = async (req, reply) => {
  try {
    const { category } = req.params;
    const { Customer } = await import("../models/user.js");

    const pipeline = [
      { $unwind: "$recommendedProducts" },
      { $match: { "recommendedProducts.category": category } },
      { 
        $group: { 
          _id: "$recommendedProducts.product", 
          recommendationCount: { $sum: 1 } 
        } 
      },
      { $sort: { recommendationCount: -1 } },
      { $limit: 10 }
    ];

    const results = await Customer.aggregate(pipeline);

    const Product = (await import("../models/products.js")).default;
    const productIds = results.map(r => r._id);
    const products = await Product.find({ _id: { $in: productIds } })
      .select("name price discountPrice image isAvailable stock category");

    const topProducts = results.map(r => {
      const p = products.find(prod => prod._id.toString() === r._id.toString());
      return { product: p, recommendationCount: r.recommendationCount };
    }).filter(item => item.product != null);

    return reply.send({ success: true, topProducts });
  } catch (error) {
    console.error("Error fetching top category recommendations:", error);
    return reply.code(500).send({ message: "Failed to fetch top recommendations", error: error.message });
  }
};

