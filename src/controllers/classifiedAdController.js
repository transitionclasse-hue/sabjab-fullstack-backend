import { ClassifiedAd } from "../models/classifiedAd.js";

// 1. GET ALL CLASSIFIEDS WITH FILTERING (FOR APP, WEBSITE & MANAGER DASHBOARD)
export const getClassifiedAds = async (req, reply) => {
  try {
    const {
      category,
      sellerType,
      search,
      subCategory,
      status,
      phone,
      userId,
      limit = 100,
      page = 1,
    } = req.query;

    const query = {};

    // Filter by specific user / phone if requested (e.g. for My Ads)
    if (phone) {
      query.phone = phone;
    }
    if (userId) {
      query.userId = userId;
    }

    // Status filter
    if (status && status !== "all") {
      query.status = status;
    } else if (!status && !phone && !userId) {
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

// 2. GET USER'S OWN POSTED ADS (FROM DATABASE)
export const getMyClassifiedAds = async (req, reply) => {
  try {
    const phone = req.query.phone || req.user?.phone;
    const userId = req.user?._id || req.query.userId;

    const orConditions = [];
    if (userId) orConditions.push({ userId });
    if (phone) orConditions.push({ phone });

    // If neither is known yet, return latest ads or empty list
    const query = orConditions.length > 0 ? { $or: orConditions } : {};

    const ads = await ClassifiedAd.find(query).sort({ createdAt: -1 });

    return reply.send({
      success: true,
      count: ads.length,
      data: ads,
    });
  } catch (error) {
    console.error("Error fetching my classified ads:", error);
    return reply.status(500).send({ success: false, message: error.message });
  }
};

// 3. GET SINGLE CLASSIFIED AD BY ID (FROM DATABASE)
export const getClassifiedAdById = async (req, reply) => {
  try {
    const { id } = req.params;
    const ad = await ClassifiedAd.findById(id);

    if (!ad) {
      return reply.status(404).send({ success: false, message: "Classified Ad not found" });
    }

    // Increment views in database
    await ClassifiedAd.findByIdAndUpdate(id, { $inc: { views: 1 } });

    return reply.send({ success: true, data: ad });
  } catch (error) {
    console.error("Error fetching classified ad:", error);
    return reply.status(500).send({ success: false, message: error.message });
  }
};

// 4. CREATE NEW CLASSIFIED AD (STORE DIRECTLY IN DATABASE)
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
      userId,
    } = req.body;

    if (!title || price === undefined || price === null) {
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
      title: title.trim(),
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
      phone: phone || req.user?.phone || "9993696297",
      location: location || "Gwalior, Madhya Pradesh",
      latitude: latitude || null,
      longitude: longitude || null,
      specs: specs || "",
      status: status || "active",
      isVerified: isVerified !== undefined ? isVerified : true,
      userId: userId || req.user?._id || null,
    });

    await newAd.save();

    return reply.status(201).send({
      success: true,
      message: "Classified Ad saved in database successfully!",
      data: newAd,
    });
  } catch (error) {
    console.error("Error creating classified ad:", error);
    return reply.status(500).send({ success: false, message: error.message });
  }
};

// 5. UPDATE CLASSIFIED AD (STATUS, PRICE, DETAILS IN DATABASE)
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
      message: "Classified Ad updated in database successfully!",
      data: ad,
    });
  } catch (error) {
    console.error("Error updating classified ad:", error);
    return reply.status(500).send({ success: false, message: error.message });
  }
};

// 6. DELETE CLASSIFIED AD (REMOVE FROM DATABASE)
export const deleteClassifiedAd = async (req, reply) => {
  try {
    const { id } = req.params;
    const ad = await ClassifiedAd.findByIdAndDelete(id);

    if (!ad) {
      return reply.status(404).send({ success: false, message: "Classified Ad not found" });
    }

    return reply.send({
      success: true,
      message: "Classified Ad deleted from database permanently!",
      data: ad,
    });
  } catch (error) {
    console.error("Error deleting classified ad:", error);
    return reply.status(500).send({ success: false, message: error.message });
  }
};

// 7. GET CLASSIFIEDS MANAGER STATS
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
