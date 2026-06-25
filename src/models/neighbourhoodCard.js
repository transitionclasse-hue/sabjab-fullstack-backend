import mongoose from "mongoose";

/**
 * NeighbourhoodCard Model
 * 
 * Hyper-local community cards — inspired by LyPinn.
 * Users "drop" cards pinned to their location, visible within the branch delivery radius.
 * Cards auto-expire after 24 hours via MongoDB TTL index.
 */

const replySchema = new mongoose.Schema({
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  displayName: { type: String, required: true },
  body: { type: String, required: true, maxlength: 300 },
  createdAt: { type: Date, default: Date.now },
});

const reactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  emoji: { type: String, required: true, enum: ["👍", "❤️", "🙏", "😂", "💡", "🔥"] },
}, { _id: false });

const neighbourhoodCardSchema = new mongoose.Schema({
  // Author reference — always stored, but display depends on isAnonymous
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true,
  },
  // Display name: real name from user profile (per user preference Q4)
  displayName: { type: String, required: true },

  // Card content
  type: {
    type: String,
    enum: ["ask", "offer", "recommend", "lost_found", "event", "general"],
    default: "general",
  },
  title: { type: String, required: true, maxlength: 100 },
  body: { type: String, required: true, maxlength: 500 },

  // GeoJSON Point for 2dsphere queries
  location: {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },

  // Human-readable area label
  areaLabel: { type: String, default: "" },

  // Auto-expiry: TTL index will delete documents after expiresAt
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
  },

  // Interactions
  replies: {
    type: [replySchema],
    validate: [arr => arr.length <= 20, "Maximum 20 replies per card"],
  },
  reactions: [reactionSchema],

  // Card status
  status: {
    type: String,
    enum: ["active", "resolved", "expired"],
    default: "active",
  },

  // Optional tags for filtering
  tags: [{ type: String, maxlength: 30 }],

}, { timestamps: true });

// 2dsphere index for geo queries (find cards near a location)
neighbourhoodCardSchema.index({ location: "2dsphere" });

// TTL index — MongoDB automatically deletes documents when expiresAt passes
neighbourhoodCardSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for efficient queries: active cards by author
neighbourhoodCardSchema.index({ author: 1, status: 1 });

// Virtual: time remaining in milliseconds
neighbourhoodCardSchema.virtual("timeRemainingMs").get(function () {
  return Math.max(0, this.expiresAt - Date.now());
});

// Ensure virtuals are included in JSON
neighbourhoodCardSchema.set("toJSON", { virtuals: true });

const NeighbourhoodCard = mongoose.model("NeighbourhoodCard", neighbourhoodCardSchema);

export default NeighbourhoodCard;
