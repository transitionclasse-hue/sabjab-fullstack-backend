import { GigSchedule, DeliveryPartner } from "../models/index.js";

// Helper to get local date string in YYYY-MM-DD format (IST UTC+5:30)
const getLocalDateStr = () => {
  const d = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
};

export const saveDriverGigSchedule = async (req, reply) => {
  try {
    const { date, startTime, endTime } = req.body;
    const driverId = req.user.userId;

    if (!date || !startTime || !endTime) {
      return reply.status(400).send({ message: "Date, start time, and end time are required" });
    }

    const todayStr = getLocalDateStr();
    
    // Check if driver is attempting to schedule for a past date
    if (date < todayStr) {
      return reply.status(400).send({ message: "Cannot schedule gigs for past dates" });
    }

    // Find if a schedule already exists for this driver and date
    let schedule = await GigSchedule.findOne({ deliveryPartner: driverId, date });

    if (schedule) {
      // If it exists, check its status
      if (schedule.status !== "pending") {
        return reply.status(400).send({ message: "Cannot modify a schedule that has already been evaluated" });
      }
      schedule.startTime = startTime;
      schedule.endTime = endTime;
      await schedule.save();
    } else {
      schedule = await GigSchedule.create({
        deliveryPartner: driverId,
        date,
        startTime,
        endTime,
        status: "pending",
      });
    }

    return reply.status(200).send({ message: "Gig schedule saved successfully", schedule });
  } catch (error) {
    console.error("saveDriverGigSchedule error:", error);
    return reply.status(500).send({ message: "Failed to save gig schedule", error: error.message });
  }
};

export const getTodayGigSchedule = async (req, reply) => {
  try {
    const driverId = req.user.userId;
    const todayStr = getLocalDateStr();

    const schedule = await GigSchedule.findOne({ deliveryPartner: driverId, date: todayStr });
    
    // Fetch driver profile to return current points balance too
    const driver = await DeliveryPartner.findById(driverId).select("fleetPoints");

    return reply.status(200).send({ 
      schedule: schedule || null, 
      fleetPoints: driver?.fleetPoints || 0 
    });
  } catch (error) {
    console.error("getTodayGigSchedule error:", error);
    return reply.status(500).send({ message: "Failed to fetch today's gig schedule", error: error.message });
  }
};

export const getManagerGigSchedules = async (req, reply) => {
  try {
    const { date } = req.query;
    const targetDate = date || getLocalDateStr();

    // Fetch schedules for the target date and populate delivery partner info along with their branch
    const schedules = await GigSchedule.find({ date: targetDate })
      .populate({
        path: "deliveryPartner",
        select: "name phone email branch fleetPoints",
        populate: { path: "branch", select: "name" }
      })
      .sort({ createdAt: -1 })
      .lean();

    return reply.status(200).send(schedules);
  } catch (error) {
    console.error("getManagerGigSchedules error:", error);
    return reply.status(500).send({ message: "Failed to fetch gig schedules", error: error.message });
  }
};

export const evaluateGigSchedule = async (req, reply) => {
  try {
    const { id } = req.params;
    const { status, points, notes } = req.body;

    if (!["rewarded", "penalized"].includes(status)) {
      return reply.status(400).send({ message: "Status must be 'rewarded' or 'penalized'" });
    }

    const ptsAmount = Number(points);
    if (isNaN(ptsAmount) || ptsAmount < 0) {
      return reply.status(400).send({ message: "Points must be a valid positive number" });
    }

    const schedule = await GigSchedule.findById(id);
    if (!schedule) {
      return reply.status(404).send({ message: "Gig schedule not found" });
    }

    const driver = await DeliveryPartner.findById(schedule.deliveryPartner);
    if (!driver) {
      return reply.status(404).send({ message: "Delivery partner not found" });
    }

    // Points change logic: if rewarded, add points. If penalized, subtract points.
    const newPointsChange = status === "rewarded" ? ptsAmount : -ptsAmount;
    const oldPointsChange = schedule.pointsChange || 0;
    
    // Adjust driver fleetPoints balance (difference)
    const pointsDifference = newPointsChange - oldPointsChange;
    driver.fleetPoints = (driver.fleetPoints || 0) + pointsDifference;
    
    // Safety check: points should not fall below 0
    if (driver.fleetPoints < 0) {
      driver.fleetPoints = 0;
    }

    await driver.save();

    // Update schedule
    schedule.status = status;
    schedule.pointsChange = newPointsChange;
    schedule.evaluatedAt = new Date();
    schedule.evaluationNotes = notes || "";
    await schedule.save();

    return reply.status(200).send({ 
      message: "Gig schedule evaluated successfully", 
      schedule,
      updatedFleetPoints: driver.fleetPoints 
    });
  } catch (error) {
    console.error("evaluateGigSchedule error:", error);
    return reply.status(500).send({ message: "Failed to evaluate gig schedule", error: error.message });
  }
};
