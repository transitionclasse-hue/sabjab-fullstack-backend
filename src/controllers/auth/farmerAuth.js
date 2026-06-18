import { Farmer } from '../../models/user.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import fetch from 'node-fetch'; // if needed for external API

dotenv.config();

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '30d' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '90d' } 
  );

  return { accessToken, refreshToken };
};

/* =====================================================
   REQUEST OTP
===================================================== */
export const requestFarmerOtp = async (req, reply) => {
  try {
    const phoneStr = req.body.phone ? String(req.body.phone).replace(/[^0-9]/g, "").slice(-10) : null;
    const phone = phoneStr && phoneStr.length === 10 ? Number(phoneStr) : null;

    if (!phone) {
      return reply.status(400).send({ message: "Valid 10-digit phone number is required." });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    let farmer = await Farmer.findOne({ phone });

    if (!farmer) {
      // Create a skeleton farmer profile pending registration
      farmer = new Farmer({
        phone,
        role: "Farmer",
        isApproved: false
      });
    }

    farmer.otp = otp;
    farmer.otpExpires = Date.now() + 300000; // 5 mins
    await farmer.save();

    console.log(`✅ Farmer OTP saved in DB for phone: ${phone}, OTP: ${otp}`);

    return reply.send({ message: "OTP sent successfully", phone, success: true });
  } catch (error) {
    console.error("❌ requestFarmerOtp ERROR:", error);
    return reply.status(500).send({ message: "Error", error: error.message, success: false });
  }
};

/* =====================================================
   VERIFY OTP
===================================================== */
export const verifyFarmerOtp = async (req, reply) => {
  try {
    const phoneStr = req.body.phone ? String(req.body.phone).replace(/[^0-9]/g, "").slice(-10) : null;
    const phone = phoneStr ? Number(phoneStr) : null;
    const { otp } = req.body;

    const farmer = await Farmer.findOne({ phone });

    if (!farmer || farmer.otp !== otp || farmer.otpExpires < Date.now()) {
      return reply.status(400).send({ message: "Invalid or expired OTP", success: false });
    }

    // Check if the farmer has completed registration (has name)
    if (!farmer.name) {
      farmer.otp = undefined;
      await farmer.save();
      return reply.send({
        success: true,
        status: "needs_registration",
        farmer: { _id: farmer._id, phone: farmer.phone }
      });
    }

    // If farmer is registered but NOT approved by Manager
    if (!farmer.isApproved) {
      return reply.status(403).send({ 
        message: "Your account is pending manager approval. Please wait for activation.", 
        success: false 
      });
    }

    farmer.otp = undefined;
    farmer.isActivated = true;
    await farmer.save();

    const { accessToken, refreshToken } = generateTokens(farmer);
    const farmerObj = farmer.toObject();
    delete farmerObj.otp;

    return reply.send({
      success: true,
      status: "success",
      message: "Login successful",
      token: accessToken,
      refreshToken,
      user: farmerObj,
    });
  } catch (error) {
    console.error("❌ verifyFarmerOtp ERROR:", error);
    return reply.status(500).send({ message: "Error verifying OTP", success: false });
  }
};

/* =====================================================
   REGISTER DETAILS
===================================================== */
export const registerFarmerDetails = async (req, reply) => {
  try {
    const { phone, name, village, farmAddress } = req.body;
    const phoneStr = phone ? String(phone).replace(/[^0-9]/g, "").slice(-10) : null;
    const phoneNumber = phoneStr ? Number(phoneStr) : null;

    if (!phoneNumber || !name || !village) {
      return reply.status(400).send({ message: "Phone, Name, and Village are required.", success: false });
    }

    const farmer = await Farmer.findOne({ phone: phoneNumber });
    if (!farmer) {
      return reply.status(404).send({ message: "Farmer not found. Please restart OTP flow.", success: false });
    }

    farmer.name = name;
    farmer.village = village;
    if (farmAddress) farmer.farmAddress = farmAddress;
    
    // Explicitly set isApproved to false so it requires manager approval
    farmer.isApproved = false;

    await farmer.save();

    return reply.send({
      success: true,
      status: "pending_approval", 
      message: "Registration successful. Pending manager approval."
    });

  } catch (error) {
    console.error("❌ registerFarmerDetails ERROR:", error);
    return reply.status(500).send({ message: "Error completing registration", success: false });
  }
};
