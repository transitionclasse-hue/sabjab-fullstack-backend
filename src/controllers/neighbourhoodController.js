import NeighbourhoodCard from "../models/neighbourhoodCard.js";
import { Customer } from "../models/user.js";
import Branch from "../models/branch.js";
import { getDistanceKm, isValidLatLng } from "../utils/geo.js";

/**
 * NeighbourhoodController
 * Handles all CRUD and interaction logic for hyper-local neighbourhood cards.
 * Uses SabJab's delivery radius from the nearest branch for geo-scoping.
 */

// Daily card limit per user
const MAX_CARDS_PER_DAY = 5;

/**
 * Get the effective radius in meters from the nearest branch.
 * Falls back to 2.5 km if no branch is found.
 */
const getRadiusMeters = async (lat, lng) => {
  try {
    const branches = await Branch.find({}).lean();
    if (!branches.length) return 2500; // 2.5 km default

    let nearest = branches[0];
    let minDist = Infinity;

    for (const b of branches) {
      if (b.location?.latitude && b.location?.longitude) {
        const d = getDistanceKm(lat, lng, b.location.latitude, b.location.longitude);
        if (d < minDist) {
          minDist = d;
          nearest = b;
        }
      }
    }

    const radiusKm = nearest.deliveryRadius || 2.5;
    return radiusKm * 1000; // Convert to meters
  } catch (err) {
    console.error("Error fetching branch radius:", err.message);
    return 2500;
  }
};

/**
 * GET /neighbourhood/cards
 * Fetch active cards near a location, scoped to delivery radius.
 */
export const getNearbyCards = async (req, reply) => {
  try {
    const { lat, lng, type } = req.query;
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (!isValidLatLng(latitude, longitude)) {
      return reply.status(400).send({ message: "Valid latitude and longitude are required" });
    }

    const radiusMeters = await getRadiusMeters(latitude, longitude);

    const filter = {
      status: "active",
      location: {
        $nearSphere: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: radiusMeters,
        },
      },
    };

    if (type && type !== "all") {
      filter.type = type;
    }

    const cards = await NeighbourhoodCard.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Compute reaction counts and time remaining for each card
    const enriched = cards.map(card => ({
      ...card,
      replyCount: card.replies?.length || 0,
      reactionSummary: summarizeReactions(card.reactions || []),
      timeRemainingMs: Math.max(0, new Date(card.expiresAt) - Date.now()),
      // Hide author details — only show displayName
      author: undefined,
    }));

    return reply.send({ success: true, cards: enriched, radiusMeters });
  } catch (error) {
    console.error("getNearbyCards Error:", error);
    return reply.status(500).send({ message: "Failed to fetch neighbourhood cards" });
  }
};

/**
 * POST /neighbourhood/cards
 * Drop a new card at the user's location.
 */
export const createCard = async (req, reply) => {
  try {
    const userId = req.user.userId;
    const { type, title, body, latitude, longitude, areaLabel, tags } = req.body;

    if (!title || !body) {
      return reply.status(400).send({ message: "Title and body are required" });
    }
    if (title.length > 100) {
      return reply.status(400).send({ message: "Title must be 100 characters or fewer" });
    }
    if (body.length > 500) {
      return reply.status(400).send({ message: "Body must be 500 characters or fewer" });
    }
    if (!isValidLatLng(parseFloat(latitude), parseFloat(longitude))) {
      return reply.status(400).send({ message: "Valid location is required" });
    }

    // Rate limit: max cards per day
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayCount = await NeighbourhoodCard.countDocuments({
      author: userId,
      createdAt: { $gte: todayStart },
    });
    if (todayCount >= MAX_CARDS_PER_DAY) {
      return reply.status(429).send({
        message: `You can drop up to ${MAX_CARDS_PER_DAY} cards per day. Try again tomorrow!`,
      });
    }

    // Get user's display name from profile
    const customer = await Customer.findById(userId).select("name phone").lean();
    const displayName = customer?.name || `User ${String(customer?.phone).slice(-4)}`;

    const card = new NeighbourhoodCard({
      author: userId,
      displayName,
      type: type || "general",
      title: title.trim(),
      body: body.trim(),
      location: {
        type: "Point",
        coordinates: [parseFloat(longitude), parseFloat(latitude)],
      },
      areaLabel: areaLabel || "",
      tags: Array.isArray(tags) ? tags.slice(0, 5) : [],
    });

    await card.save();

    // Emit socket event for real-time updates
    if (req.server?.io) {
      const geoRoom = getGeoRoom(parseFloat(latitude), parseFloat(longitude));
      req.server.io.to(geoRoom).emit("neighbourhood:newCard", {
        cardId: card._id,
        type: card.type,
        title: card.title,
        displayName,
        areaLabel: card.areaLabel,
        createdAt: card.createdAt,
      });
    }

    return reply.status(201).send({ success: true, card });
  } catch (error) {
    console.error("createCard Error:", error);
    return reply.status(500).send({ message: "Failed to create card" });
  }
};

/**
 * POST /neighbourhood/cards/:id/reply
 * Add a reply to a card (max 1 per user).
 */
export const replyToCard = async (req, reply) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { body } = req.body;

    if (!body || body.length > 300) {
      return reply.status(400).send({ message: "Reply body required (max 300 chars)" });
    }

    const card = await NeighbourhoodCard.findById(id);
    if (!card || card.status !== "active") {
      return reply.status(404).send({ message: "Card not found or expired" });
    }

    // Check if user already replied
    const alreadyReplied = card.replies.some(
      r => r.author.toString() === userId
    );
    if (alreadyReplied) {
      return reply.status(409).send({ message: "You have already replied to this card" });
    }

    // Get user display name
    const customer = await Customer.findById(userId).select("name phone").lean();
    const displayName = customer?.name || `User ${String(customer?.phone).slice(-4)}`;

    card.replies.push({
      author: userId,
      displayName,
      body: body.trim(),
    });

    await card.save();

    // Notify card author via socket
    if (req.server?.io) {
      req.server.io.to(String(card.author)).emit("neighbourhood:newReply", {
        cardId: card._id,
        cardTitle: card.title,
        replyBy: displayName,
      });
    }

    return reply.send({ success: true, replies: card.replies });
  } catch (error) {
    console.error("replyToCard Error:", error);
    return reply.status(500).send({ message: "Failed to reply" });
  }
};

/**
 * POST /neighbourhood/cards/:id/react
 * Add or toggle a reaction on a card.
 */
export const reactToCard = async (req, reply) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { emoji } = req.body;

    const validEmojis = ["👍", "❤️", "🙏", "😂", "💡", "🔥"];
    if (!validEmojis.includes(emoji)) {
      return reply.status(400).send({ message: "Invalid reaction" });
    }

    const card = await NeighbourhoodCard.findById(id);
    if (!card || card.status !== "active") {
      return reply.status(404).send({ message: "Card not found or expired" });
    }

    // Toggle: remove if same emoji exists, else add/update
    const existingIdx = card.reactions.findIndex(
      r => r.userId.toString() === userId
    );

    if (existingIdx >= 0) {
      if (card.reactions[existingIdx].emoji === emoji) {
        card.reactions.splice(existingIdx, 1); // Remove reaction
      } else {
        card.reactions[existingIdx].emoji = emoji; // Change emoji
      }
    } else {
      card.reactions.push({ userId, emoji });
    }

    await card.save();

    return reply.send({
      success: true,
      reactionSummary: summarizeReactions(card.reactions),
    });
  } catch (error) {
    console.error("reactToCard Error:", error);
    return reply.status(500).send({ message: "Failed to react" });
  }
};

/**
 * PATCH /neighbourhood/cards/:id/resolve
 * Mark a card as resolved (author only).
 */
export const resolveCard = async (req, reply) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const card = await NeighbourhoodCard.findById(id);
    if (!card) {
      return reply.status(404).send({ message: "Card not found" });
    }
    if (card.author.toString() !== userId) {
      return reply.status(403).send({ message: "Only the card author can resolve it" });
    }

    card.status = "resolved";
    await card.save();

    // Broadcast resolved status
    if (req.server?.io) {
      const [lng, lat] = card.location.coordinates;
      const geoRoom = getGeoRoom(lat, lng);
      req.server.io.to(geoRoom).emit("neighbourhood:resolved", {
        cardId: card._id,
      });
    }

    return reply.send({ success: true });
  } catch (error) {
    console.error("resolveCard Error:", error);
    return reply.status(500).send({ message: "Failed to resolve card" });
  }
};

/**
 * DELETE /neighbourhood/cards/:id
 * Delete own card.
 */
export const deleteCard = async (req, reply) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    const card = await NeighbourhoodCard.findById(id);
    if (!card) {
      return reply.status(404).send({ message: "Card not found" });
    }
    if (card.author.toString() !== userId) {
      return reply.status(403).send({ message: "Only the card author can delete it" });
    }

    await NeighbourhoodCard.findByIdAndDelete(id);
    return reply.send({ success: true });
  } catch (error) {
    console.error("deleteCard Error:", error);
    return reply.status(500).send({ message: "Failed to delete card" });
  }
};

/**
 * GET /neighbourhood/my-cards
 * Fetch the authenticated user's own cards.
 */
export const getMyCards = async (req, reply) => {
  try {
    const userId = req.user.userId;

    const cards = await NeighbourhoodCard.find({ author: userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const enriched = cards.map(card => ({
      ...card,
      replyCount: card.replies?.length || 0,
      reactionSummary: summarizeReactions(card.reactions || []),
      timeRemainingMs: Math.max(0, new Date(card.expiresAt) - Date.now()),
    }));

    return reply.send({ success: true, cards: enriched });
  } catch (error) {
    console.error("getMyCards Error:", error);
    return reply.status(500).send({ message: "Failed to fetch your cards" });
  }
};

/**
 * GET /neighbourhood/cards/:id
 * Get full card detail with replies.
 */
export const getCardDetail = async (req, reply) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const card = await NeighbourhoodCard.findById(id).lean();
    if (!card) {
      return reply.status(404).send({ message: "Card not found" });
    }

    const enriched = {
      ...card,
      replyCount: card.replies?.length || 0,
      reactionSummary: summarizeReactions(card.reactions || []),
      timeRemainingMs: Math.max(0, new Date(card.expiresAt) - Date.now()),
      isOwner: card.author.toString() === userId,
      hasReplied: card.replies?.some(r => r.author.toString() === userId) || false,
      myReaction: card.reactions?.find(r => r.userId.toString() === userId)?.emoji || null,
    };

    // Hide author ID from non-owners
    if (!enriched.isOwner) {
      enriched.author = undefined;
    }

    return reply.send({ success: true, card: enriched });
  } catch (error) {
    console.error("getCardDetail Error:", error);
    return reply.status(500).send({ message: "Failed to fetch card" });
  }
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Summarize reactions into a map like { "👍": 3, "❤️": 1 }
 */
function summarizeReactions(reactions) {
  const summary = {};
  for (const r of reactions) {
    summary[r.emoji] = (summary[r.emoji] || 0) + 1;
  }
  return summary;
}

/**
 * Generate a geo-room ID for socket broadcasting.
 * Uses ~2km grid cells by rounding to 2 decimal places.
 */
export function getGeoRoom(lat, lng) {
  const gridLat = Math.round(lat * 50) / 50; // ~2km cells
  const gridLng = Math.round(lng * 50) / 50;
  return `geo:${gridLat}:${gridLng}`;
}
