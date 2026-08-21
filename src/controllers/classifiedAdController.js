import { ClassifiedAd } from "../models/classifiedAd.js";

// 1. GET ALL CLASSIFIEDS WITH FILTERING (FOR APP & WEBSITE FEED)
export const getClassifiedAds = async (req, reply) => {
  try {
    const { category, sellerType, search, subCategory, limit = 50, page = 1 } = req.query;

    const query = { status: "active" };

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

// 3. CREATE NEW CLASSIFIED AD (FROM APP POST AD OR WEBSITE POST AD)
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
    } = req.body;

    if (!title || !price || !phone || !location) {
      return reply.status(400).send({
        success: false,
        message: "Title, Price, Phone, and Location are required fields.",
      });
    }

    const primaryImage =
      images && images.length > 0
        ? images[0]
        : "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80";

    const newAd = new ClassifiedAd({
      title,
      description,
      price: Number(price),
      category: category || "other",
      subCategory: subCategory || "",
      sellerType: sellerType || "individual",
      shopName: sellerType === "shopkeeper" ? shopName || "" : "",
      images: images || [primaryImage],
      primaryImage,
      video: video || "",
      hasVideo: !!video,
      phone,
      location,
      latitude: latitude || null,
      longitude: longitude || null,
      specs: specs || "",
      status: "active",
      isVerified: true,
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
