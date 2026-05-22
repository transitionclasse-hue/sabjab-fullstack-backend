import { GigSchedule, DeliveryPartner } from "../models/index.js";

// Helper to get local date string in YYYY-MM-DD format (IST UTC+5:30)
const getLocalDateStr = () => {
  const d = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
  return d.toISOString().split("T")[0];
};

export const saveDriverGigSchedule = async (req, reply) => {
  try {
    const { id, date, startTime, endTime } = req.body;
    const driverId = req.user.userId;

    if (!date || !startTime || !endTime) {
      return reply.status(400).send({ message: "Date, start time, and end time are required" });
    }

    if (startTime >= endTime) {
      return reply.status(400).send({ message: "Start time must be strictly before end time" });
    }

    const todayStr = getLocalDateStr();
    
    // Check if driver is attempting to schedule for a past date
    if (date < todayStr) {
      return reply.status(400).send({ message: "Cannot schedule gigs for past dates" });
    }

    // Overlap validation: check all other shifts on this date for this driver
    const query = { deliveryPartner: driverId, date };
    if (id) {
      query._id = { $ne: id };
    }
    const existingShifts = await GigSchedule.find(query);

    for (const shift of existingShifts) {
      // Overlap formula: (newStart < existingEnd) && (newEnd > existingStart)
      if (startTime < shift.endTime && endTime > shift.startTime) {
        return reply.status(400).send({ 
          message: `This slot overlaps with an existing shift today: ${shift.startTime} - ${shift.endTime}` 
        });
      }
    }

    let schedule;
    if (id) {
      schedule = await GigSchedule.findOne({ _id: id, deliveryPartner: driverId });
      if (!schedule) {
        return reply.status(404).send({ message: "Gig schedule not found" });
      }
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
    const { date } = req.query;
    const targetDate = date || getLocalDateStr();

    const schedules = await GigSchedule.find({ deliveryPartner: driverId, date: targetDate }).sort({ startTime: 1 });
    
    // Fetch driver profile to return current points balance too
    const driver = await DeliveryPartner.findById(driverId).select("fleetPoints");

    return reply.status(200).send({ 
      schedules: schedules || [], 
      fleetPoints: driver?.fleetPoints || 0 
    });
  } catch (error) {
    console.error("getTodayGigSchedule error:", error);
    return reply.status(500).send({ message: "Failed to fetch gig schedules", error: error.message });
  }
};

export const deleteDriverGigSchedule = async (req, reply) => {
  try {
    const { id } = req.params;
    const driverId = req.user.userId;

    const schedule = await GigSchedule.findOne({ _id: id, deliveryPartner: driverId });
    if (!schedule) {
      return reply.status(404).send({ message: "Gig schedule not found" });
    }

    if (schedule.status !== "pending") {
      return reply.status(400).send({ message: "Cannot delete a schedule that has already been evaluated" });
    }

    await GigSchedule.deleteOne({ _id: id });
    return reply.status(200).send({ message: "Gig schedule deleted successfully" });
  } catch (error) {
    console.error("deleteDriverGigSchedule error:", error);
    return reply.status(500).send({ message: "Failed to delete gig schedule", error: error.message });
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

export const getWeeklyGigSchedules = async (req, reply) => {
  try {
    const { startDate } = req.query;
    const start = startDate || getLocalDateStr();
    
    // Calculate endDate as start date + 6 days (7 days total)
    const startObj = new Date(start);
    const endObj = new Date(startObj.getTime() + 6 * 24 * 60 * 60 * 1000);
    const end = endObj.toISOString().split("T")[0];

    const schedules = await GigSchedule.find({
      date: { $gte: start, $lte: end }
    })
    .populate({
      path: "deliveryPartner",
      select: "name phone email branch fleetPoints isOnline batteryLevel",
      populate: { path: "branch", select: "name" }
    })
    .sort({ date: 1, startTime: 1 })
    .lean();

    return reply.status(200).send(schedules);
  } catch (error) {
    console.error("getWeeklyGigSchedules error:", error);
    return reply.status(500).send({ message: "Failed to fetch weekly gig schedules", error: error.message });
  }
};
