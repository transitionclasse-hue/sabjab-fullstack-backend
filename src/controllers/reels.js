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
      .populate("creator", "name phone email username")
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
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const reels = await Reel.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("creator", "name phone email username")
      .populate("product", "name price discountPrice image isAvailable stock variations isChoice");

    // Add total count
    const total = await Reel.countDocuments();

    return reply.send({
      success: true,
      reels,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
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
