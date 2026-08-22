import { ClassifiedAd } from "../models/classifiedAd.js";

// 1. GET ALL CLASSIFIEDS WITH FILTERING (FOR APP, WEBSITE & MANAGER DASHBOARD)
export const getClassifiedAds = async (req, reply) => {
  try {
    const { category, sellerType, search, subCategory, status, limit = 50, page = 1 } = req.query;

    const query = {};

    // If status is specifically provided (e.g. from manager), filter by it; otherwise default to "active"
    if (status && status !== "all") {
      query.status = status;
    } else if (!status) {
      query.status = "active";
    }

    if (category && category !== "all") {
      query.category = category;
    }

    if (sellerType && sellerType !== "all") {
      query.sellerType = sellerType;
    }

    if (subCategory && subCategory !== "all") {
      query.subCategory = subCategory;
    }

    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: "i" };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const ads = await ClassifiedAd.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const total = await ClassifiedAd.countDocuments(query);

    return reply.send({
      success: true,
      count: ads.length,
      total,
      data: ads,
    });
  } catch (error) {
    console.error("Error fetching classified ads:", error);
    return reply.status(500).send({ success: false, message: error.message });
  }
};

// 2. GET SINGLE CLASSIFIED AD BY ID
export const getClassifiedAdById = async (req, reply) => {
  try {
    const { id } = req.params;
    const ad = await ClassifiedAd.findById(id);

    if (!ad) {
      return reply.status(404).send({ success: false, message: "Classified Ad not found" });
    }

    return reply.send({ success: true, data: ad });
  } catch (error) {
    console.error("Error fetching classified ad:", error);
    return reply.status(500).send({ success: false, message: error.message });
  }
};

// 3. CREATE NEW CLASSIFIED AD (FROM APP, WEBSITE, OR MANAGER DASHBOARD)
export const createClassifiedAd = async (req, reply) => {
  try {
    const {
      title,
      description,
      price,
      category,
      subCategory,
      sellerType,
      shopName,
      images,
      video,
      phone,
      location,
      latitude,
      longitude,
      specs,
      status,
      isVerified,
    } = req.body;

    if (!title || !price) {
      return reply.status(400).send({
        success: false,
        message: "Title and Price are required fields.",
      });
    }

    const primaryImage =
      images && images.length > 0
        ? images[0]
        : "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80";

    const newAd = new ClassifiedAd({
      title,
      description: description || "",
      price: Number(price),
      category: category || "cars",
      subCategory: subCategory || "",
      sellerType: sellerType || "individual",
      shopName: sellerType === "shopkeeper" ? shopName || "Verified Shop" : "",
      images: images && images.length > 0 ? images : [primaryImage],
      primaryImage,
      video: video || "",
      hasVideo: !!video,
      phone: phone || "9876543210",
      location: location || "Gwalior, Madhya Pradesh",
      latitude: latitude || null,
      longitude: longitude || null,
      specs: specs || "",
      status: status || "active",
      isVerified: isVerified !== undefined ? isVerified : true,
      userId: req.user?._id || null,
    });

    await newAd.save();

    return reply.status(201).send({
      success: true,
      message: "Classified Ad posted successfully!",
      data: newAd,
    });
  } catch (error) {
    console.error("Error creating classified ad:", error);
    return reply.status(500).send({ success: false, message: error.message });
  }
};

// 4. UPDATE CLASSIFIED AD (APPROVE, REJECT, MARK SOLD, EDIT, TOGGLE VERIFIED)
export const updateClassifiedAd = async (req, reply) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const ad = await ClassifiedAd.findByIdAndUpdate(id, updates, { new: true });

    if (!ad) {
      return reply.status(404).send({ success: false, message: "Classified Ad not found" });
    }

    return reply.send({
      success: true,
      message: "Classified Ad updated successfully!",
      data: ad,
    });
  } catch (error) {
    console.error("Error updating classified ad:", error);
    return reply.status(500).send({ success: false, message: error.message });
  }
};

// 5. DELETE CLASSIFIED AD
export const deleteClassifiedAd = async (req, reply) => {
  try {
    const { id } = req.params;
    const ad = await ClassifiedAd.findByIdAndDelete(id);

    if (!ad) {
      return reply.status(404).send({ success: false, message: "Classified Ad not found" });
    }

    return reply.send({
      success: true,
      message: "Classified Ad deleted successfully!",
      data: ad,
    });
  } catch (error) {
    console.error("Error deleting classified ad:", error);
    return reply.status(500).send({ success: false, message: error.message });
  }
};

// 6. GET CLASSIFIEDS MANAGER STATS
export const getClassifiedsStats = async (req, reply) => {
  try {
    const total = await ClassifiedAd.countDocuments();
    const active = await ClassifiedAd.countDocuments({ status: "active" });
    const pending = await ClassifiedAd.countDocuments({ status: "pending" });
    const shopAds = await ClassifiedAd.countDocuments({ sellerType: "shopkeeper" });
    const individualAds = await ClassifiedAd.countDocuments({ sellerType: "individual" });

    return reply.send({
      success: true,
      data: {
        total,
        active,
        pending,
        shopAds,
        individualAds,
      },
    });
  } catch (error) {
    console.error("Error fetching classified stats:", error);
    return reply.status(500).send({ success: false, message: error.message });
  }
};
