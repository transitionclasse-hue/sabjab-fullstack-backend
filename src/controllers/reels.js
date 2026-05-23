import Reel from "../../models/reel.js";
import Product from "../../models/products.js";
import WalletTransaction from "../../models/walletTransaction.js";

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
