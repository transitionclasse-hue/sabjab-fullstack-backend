import { SlotPromotion } from "../models/slotPromotion.js";
import Order from "../models/order.js";

function calculateSlotExpiration(dayLabel, slotLabel, baseDate = new Date()) {
  try {
    const now = new Date(baseDate);
    const kolkataStr = now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
    const localDate = new Date(kolkataStr);

    let targetDate = new Date(localDate);
    const cleanDay = dayLabel ? dayLabel.toLowerCase().trim() : "today";

    if (cleanDay === "tomorrow") {
      targetDate.setDate(targetDate.getDate() + 1);
    } else if (cleanDay === "today") {
      // Keep today
    } else {
      const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      const targetDayIdx = weekdays.indexOf(cleanDay);
      if (targetDayIdx !== -1) {
        const currentDayIdx = targetDate.getDay();
        let daysToAdd = targetDayIdx - currentDayIdx;
        if (daysToAdd < 0) {
          daysToAdd += 7;
        }
        targetDate.setDate(targetDate.getDate() + daysToAdd);
      }
    }

    const parts = slotLabel.split(/[-–—]|(\s+to\s+)/i);
    const endStr = parts[parts.length - 1].trim().toLowerCase();

    const isPM = endStr.includes("pm");
    const isAM = endStr.includes("am");
    const cleanTime = endStr.replace(/[^0-9:]/g, "");
    const timeParts = cleanTime.split(":");
    let hours = parseInt(timeParts[0], 10);
    let minutes = timeParts[1] ? parseInt(timeParts[1], 10) : 0;

    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }

    targetDate.setHours(hours, minutes, 0, 0);

    const offsetDiff = targetDate.getTime() - localDate.getTime();
    return new Date(now.getTime() + offsetDiff);
  } catch (err) {
    console.error("Error calculating slot expiration:", err);
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
  }
}

// Create a new slot clustering promotion
export const createSlotPromotion = async (req, reply) => {
  try {
    const {
      referenceAddress,
      latitude,
      longitude,
      slotLabel,
      dayLabel,
      promotionType,
      discountAmount,
      giftName,
      radiusMeters,
    } = req.body;

    if (latitude === undefined || longitude === undefined || !slotLabel || !promotionType) {
      return reply.status(400).send({ message: "Missing required fields (latitude, longitude, slotLabel, promotionType)" });
    }

    const expiresAt = calculateSlotExpiration(dayLabel, slotLabel);

    const newPromo = new SlotPromotion({
      referenceAddress: referenceAddress || "Standard Address",
      location: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)]
      },
      slotLabel,
      dayLabel: dayLabel || "",
      promotionType,
      discountAmount: Number(discountAmount) || 0,
      giftName: giftName || "",
      radiusMeters: Number(radiusMeters) || 50,
      expiresAt,
      isActive: true
    });

    await newPromo.save();
    return reply.status(201).send({ success: true, promotion: newPromo });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to create slot promotion", error: error.message });
  }
};

// Fetch active or all slot promotions
export const getSlotPromotions = async (req, reply) => {
  try {
    const { activeOnly } = req.query;
    const filter = {};
    if (activeOnly === "true") {
      filter.isActive = true;
    }

    const promos = await SlotPromotion.find(filter).sort({ createdAt: -1 });
    return reply.send(promos);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch slot promotions", error: error.message });
  }
};

// Deactivate/delete a slot promotion
export const deleteSlotPromotion = async (req, reply) => {
  try {
    const { id } = req.params;
    const promo = await SlotPromotion.findByIdAndUpdate(id, { isActive: false }, { new: true });
    if (!promo) {
      return reply.status(404).send({ message: "Slot promotion not found" });
    }
    return reply.send({ success: true, message: "Slot promotion deactivated successfully", promotion: promo });
  } catch (error) {
    return reply.status(500).send({ message: "Failed to delete slot promotion", error: error.message });
  }
};

// Fetch recent orders with slot delivery
export const getSlotOrders = async (req, reply) => {
  try {
    const orders = await Order.find({ deliveryMode: "slot" })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate("customer", "name phone");

    return reply.send(orders);
  } catch (error) {
    return reply.status(500).send({ message: "Failed to fetch slot orders", error: error.message });
  }
};
