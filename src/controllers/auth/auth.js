import { Customer, DeliveryPartner, Admin, Seller } from '../../models/user.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

/* =====================================================
   TOKEN GENERATION
===================================================== */

const generateTokens = (user) => {
  // Provision for Manager/SubManager/Seller to stay logged in longer
  const isPrivileged = user.role === 'Admin' || user.role === 'Seller' || user.role === 'SubManager';
  
  const accessToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: isPrivileged ? '7d' : '1d' } // 7 days for managers
  );

  const refreshToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: isPrivileged ? '30d' : '7d' } // 30-day refresh for managers
  );

  // Update last active for the user asynchronously
  if (user.role === 'Customer') {
    Customer.findByIdAndUpdate(user._id, { lastActive: new Date(), appUninstalled: false }).catch(err => console.error("Update lastActive error:", err));
  }

  return { accessToken, refreshToken };
};

/* =====================================================
   REQUEST OTP
===================================================== */

export const requestEmailOtp = async (req, reply) => {
  try {
    const phoneStr = req.body.phone ? String(req.body.phone).replace(/[^0-9]/g, "").slice(-10) : null;
    const phone = phoneStr && phoneStr.length === 10 ? Number(phoneStr) : null;
    const emailStr = req.body.email ? String(req.body.email).trim().toLowerCase() : null;
    const username = req.body.username ? String(req.body.username).trim() : null;

    let finalPhone = phone;
    let finalEmail = emailStr;

    if (!finalPhone && !finalEmail) {
      return reply.status(400).send({ message: "Phone or Email is required." });
    }

    // Identify user
    let user = null;
    if (finalPhone) {
      user = await Customer.findOne({ phone: finalPhone });
    } else if (finalEmail) {
      user = await Customer.findOne({ email: finalEmail });
      if (user) finalPhone = user.phone;
    }

    if (user && user.email) {
      finalEmail = user.email;
    }

    if (!finalEmail && !emailStr) {
      return reply.status(400).send({ message: "Email ID is required for OTP." });
    }

    // For new registrations via Email-only login flow, we might not have a phone yet.
    // But the user said phone is mandatory at signup.
    // So if user not found by email, we should tell frontend to ask for phone.
    if (!user && !finalPhone) {
      return reply.status(404).send({ message: "User not found. Please sign up with phone and email.", errorCode: "USER_NOT_FOUND" });
    }

    /* ---------- CHECK DUPLICATE EMAIL ---------- */
    const existingUser = await Customer.findOne({ email: finalEmail });
    if (existingUser && finalPhone && Number(existingUser.phone) !== Number(finalPhone)) {
      return reply.status(400).send({ message: "Email already linked to another number." });
    }

    /* ---------- GENERATE OTP ---------- */
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    /* ---------- SAVE OTP IN DATABASE ---------- */
    const updateFields = {
      email: finalEmail,
      otp,
      otpExpires: Date.now() + 300000,
      role: "Customer",
    };
    if (username) updateFields.name = username;
    if (finalPhone) updateFields.phone = finalPhone; // Ensure phone is saved/updated

    await Customer.findOneAndUpdate(
      { $or: [{ phone: finalPhone }, { email: finalEmail }] },
      updateFields,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log("✅ OTP saved in DB for:", finalEmail);

    /* =====================================================
       SEND OTP VIA HOSTINGER MAIL API
    ===================================================== */

    try {
      const response = await fetch("https://sabjab.com/send-otp.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: finalEmail, otp }),
      });

      const raw = await response.text();
      console.log("📩 Mail API response:", raw);

      let result;
      try {
        result = JSON.parse(raw);
      } catch (err) {
        console.error("❌ Invalid JSON from mail API");
        result = { success: false };
      }

      if (!result.success) {
        console.error("⚠️ Email send failed");
      } else {
        console.log("✅ OTP email sent");
      }

    } catch (mailError) {
      console.error("⚠️ Mail API error:", mailError.message);
      // do not fail OTP flow
    }

    return reply.send({
      message: "OTP sent successfully",
      phone: finalPhone // return phone so frontend can use it if it only had email
    });

  } catch (error) {
    console.error("❌ OTP ERROR:", error);
    return reply.status(500).send({
      message: "Error",
      error: error.message
    });
  }
};

/* =====================================================
   VERIFY OTP
===================================================== */

export const verifyOtp = async (req, reply) => {
  try {

    const phoneStr = req.body.phone ? String(req.body.phone).replace(/[^0-9]/g, "").slice(-10) : null;
    const phone = phoneStr ? Number(phoneStr) : null;
    const { otp, password, email } = req.body;

    let customer = null;
    if (phone) {
      customer = await Customer.findOne({ phone });
    } else if (email) {
      customer = await Customer.findOne({ email: email.toLowerCase().trim() });
    }

    if (
      !customer ||
      customer.otp !== otp ||
      customer.otpExpires < Date.now()
    ) {
      return reply.status(400).send({
        message: "Invalid or expired OTP"
      });
    }

    customer.otp = undefined;
    customer.isActivated = true;
    if (password) {
      customer.password = password; // Save the newly set password during registration
    }
    await customer.save();

    const customerObj = customer.toObject();
    delete customerObj.password;
    delete customerObj.otp;
    return reply.send({
      message: "Login Successful",
      ...generateTokens(customer),
      customer: customerObj
    });

  } catch (error) {
    return reply.status(500).send({ message: "Error" });
  }
};

/* =====================================================
   CHECK PHONE
===================================================== */

export const checkPhone = async (req, reply) => {
  try {
    const { phone: rawPhone, email: rawEmail } = req.body;
    let query = {};

    if (rawPhone) {
      const phoneStr = String(rawPhone).replace(/[^0-9]/g, "").slice(-10);
      if (phoneStr.length === 10) query.phone = Number(phoneStr);
    }

    if (rawEmail) {
      query.email = String(rawEmail).trim().toLowerCase();
    }

    if (Object.keys(query).length === 0) {
      return reply.status(400).send({ message: "Phone or Email required." });
    }

    const customer = await Customer.findOne(query);

    return reply.send({
      exists: !!customer,
      hasPassword: !!customer && !!customer.password,
      hasEmail: !!customer && !!customer.email,
      hasPhone: !!customer && !!customer.phone,
      name: customer ? customer.name : null,
      email: customer ? customer.email : null,
      phone: customer ? customer.phone : null
    });
  } catch (error) {
    return reply.status(500).send({ message: "Error checking identity" });
  }
};

/* =====================================================
   CHECK DRIVER PHONE
===================================================== */
export const checkDriverPhone = async (req, reply) => {
  try {
    const { phone: rawPhone } = req.body;
    if (!rawPhone) {
      return reply.status(400).send({ message: "Phone is required." });
    }
    const phoneStr = String(rawPhone).replace(/[^0-9]/g, "").slice(-10);
    const phone = Number(phoneStr);

    const driver = await DeliveryPartner.findOne({ phone, role: "DeliveryPartner" });

    return reply.send({
      exists: !!driver,
      hasPassword: !!driver && !!driver.password,
      hasEmail: !!driver && !!driver.email,
      name: driver ? driver.name : null,
      email: driver ? driver.email : null,
      phone: driver ? driver.phone : null,
    });
  } catch (error) {
    console.error("Error in checkDriverPhone:", error);
    return reply.status(500).send({ message: "Error checking driver identity" });
  }
};

/* =====================================================
   LOGIN WITH PASSWORD
===================================================== */

export const loginPassword = async (req, reply) => {
  try {
    const { phone: rawPhone, password } = req.body;
    const phoneStr = String(rawPhone).replace(/[^0-9]/g, "").slice(-10);
    const phone = Number(phoneStr);
    let customer = await Customer.findOne({ phone });

    // Ensure password matches if they have one set
    if (!customer || !customer.password || !await bcrypt.compare(password, customer.password)) {
      return reply.code(401).send({ message: "Invalid phone number or password" });
    }

    const { accessToken, refreshToken } = generateTokens(customer);
    const customerObj = customer.toObject();
    delete customerObj.password;
    return reply.send({
      message: "Login successful",
      accessToken,
      refreshToken,
      customer: customerObj,
    });
  } catch (error) {
    return reply.code(500).send({ message: "Login failed", error: error.message });
  }
};

/* ===========================
   DRIVER LOGIN (NATIVE APP)
=========================== */
export const loginDeliveryPartner = async (req, reply) => {
  try {
    const rawEmail = req.body.email || '';
    const rawPhone = req.body.phone || '';
    const rawPassword = req.body.password || '';

    const password = String(rawPassword).trim();

    let query = { role: "DeliveryPartner" };
    if (rawEmail) {
      query.email = String(rawEmail).trim().toLowerCase();
    } else if (rawPhone) {
      const phoneStr = String(rawPhone).replace(/[^0-9]/g, "").slice(-10);
      query.phone = Number(phoneStr);
    } else {
      return reply.code(400).send({ message: "Email or Phone is required" });
    }

    const driver = await DeliveryPartner.findOne(query);

    if (!driver || !driver.password || !await bcrypt.compare(password, driver.password)) {
      return reply.code(401).send({ message: "Invalid driver credentials" });
    }

    if (!driver.isActivated) {
      return reply.code(403).send({ message: "Driver account not activated by Admin" });
    }

    const { accessToken, refreshToken } = generateTokens(driver);

    const driverObj = driver.toObject();
    delete driverObj.password;
    return reply.send({
      message: "Driver login successful",
      accessToken,
      refreshToken,
      deliveryPartner: driverObj,
    });
  } catch (error) {
    return reply.code(500).send({ message: "Driver login failed", error: error.message });
  }
};

/* ===========================
   ADMIN/MANAGER LOGIN
=========================== */
export const loginAdmin = async (req, reply) => {
  try {
    const { email: rawEmail, password: rawPassword } = req.body;
    const email = String(rawEmail || "").trim().toLowerCase();
    const password = String(rawPassword || "").trim();

    const user = await Admin.findOne({ email });

    if (!user) {
      return reply.code(401).send({ message: "Invalid admin credentials" });
    }

    if (!await bcrypt.compare(password, user.password)) {
      return reply.code(401).send({ message: "Invalid admin credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    const userObj = user.toObject();
    delete userObj.password;
    return reply.send({
      message: "Admin login successful",
      token: accessToken, // Manager app expects 'token'
      refreshToken,
      user: userObj
    });
  } catch (error) {
    return reply.code(500).send({ message: "Admin login failed", error: error.message });
  }
};

/* =====================================================
   DRIVER OTP REGISTRATION (NATIVE APP)
===================================================== */

export const requestDriverOtp = async (req, reply) => {
  try {
    const { email } = req.body;
    const phoneStr = req.body.phone ? String(req.body.phone).replace(/[^0-9]/g, "").slice(-10) : null;
    const phone = phoneStr && phoneStr.length === 10 ? Number(phoneStr) : null;

    if (!phone || !email) {
      return reply.status(400).send({ message: "Valid 10-digit phone number and email are required." });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    let driver = await DeliveryPartner.findOne({ phone });
    
    // Check if email is used by another driver
    const existingEmail = await DeliveryPartner.findOne({ email: email.toLowerCase().trim() });
    if (existingEmail && existingEmail.phone !== phone) {
      return reply.status(400).send({ message: "Email is already registered to another driver." });
    }
    
    if (!driver) {
      // Create skeleton driver profile pending registration
      driver = new DeliveryPartner({
        phone,
        email: email.toLowerCase().trim(),
        role: "DeliveryPartner",
        isActivated: false
      });
    } else {
      driver.email = email.toLowerCase().trim();
    }

    driver.otp = otp;
    driver.otpExpires = Date.now() + 300000;
    await driver.save();

    console.log(`✅ Driver OTP saved in DB for phone: ${phone}, OTP: ${otp}`);

    // If driver has an email, send OTP via email
    if (driver.email) {
      try {
        await fetch("https://sabjab.com/send-otp.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: driver.email, otp }),
        });
        console.log("✅ OTP email sent to driver");
      } catch (mailError) {
        console.error("⚠️ Mail API error:", mailError.message);
      }
    }

    return reply.send({ message: "OTP sent successfully", phone });
  } catch (error) {
    console.error("❌ requestDriverOtp ERROR:", error);
    return reply.status(500).send({ message: "Error", error: error.message });
  }
};

export const verifyDriverOtp = async (req, reply) => {
  try {
    const phoneStr = req.body.phone ? String(req.body.phone).replace(/[^0-9]/g, "").slice(-10) : null;
    const phone = phoneStr ? Number(phoneStr) : null;
    const { otp } = req.body;

    const driver = await DeliveryPartner.findOne({ phone });

    if (!driver || driver.otp !== otp || driver.otpExpires < Date.now()) {
      return reply.status(400).send({ message: "Invalid or expired OTP" });
    }

    driver.otp = undefined;
    await driver.save();

    // Check if the driver has completed registration (has name)
    if (!driver.name) {
      return reply.send({
        status: "needs_registration",
        deliveryPartner: { _id: driver._id, phone: driver.phone }
      });
    }

    // Driver has registered name -> Generate tokens (even if pending approval, they can access app to fill forms)
    const { accessToken, refreshToken } = generateTokens(driver);
    const driverObj = driver.toObject();
    delete driverObj.password;

    return reply.send({
      status: "success",
      message: "Driver login successful",
      accessToken,
      refreshToken,
      deliveryPartner: driverObj,
    });
  } catch (error) {
    console.error("❌ verifyDriverOtp ERROR:", error);
    return reply.status(500).send({ message: "Error verifying OTP" });
  }
};

export const registerDriverDetails = async (req, reply) => {
  try {
    const { phone, name } = req.body;
    const phoneStr = phone ? String(phone).replace(/[^0-9]/g, "").slice(-10) : null;
    const phoneNumber = phoneStr ? Number(phoneStr) : null;

    if (!phoneNumber || !name) {
      return reply.status(400).send({ message: "Phone and Name are required." });
    }

    const driver = await DeliveryPartner.findOne({ phone: phoneNumber });
    if (!driver) {
      return reply.status(404).send({ message: "Driver not found. Please restart OTP flow." });
    }

    driver.name = name;
    driver.isActivated = false; // Remains false pending Manager approval

    await driver.save();

    // Generate tokens so they are logged in immediately
    const { accessToken, refreshToken } = generateTokens(driver);
    const driverObj = driver.toObject();
    delete driverObj.password;

    return reply.send({
      status: "success", // Navigate them into the app directly!
      message: "Registration successful. Pending manager approval.",
      accessToken,
      refreshToken,
      deliveryPartner: driverObj
    });

  } catch (error) {
    console.error("❌ registerDriverDetails ERROR:", error);
    return reply.status(500).send({ message: "Error completing registration" });
  }
};

/* =====================================================
   REQUIRED EXPORTS
===================================================== */

export const updateCustomerProfile = async (req, reply) => {
  try {
    const { name, dateOfBirth, email, notificationsEnabled, pushToken, password, sensitiveMode, liveLocation, address, gstNumber, businessName, businessAddress } = req.body;
    const userId = req.user.userId;

    const customer = await Customer.findById(userId);
    if (!customer) {
      return reply.status(404).send({ message: "Customer not found" });
    }

    if (name) customer.name = name;
    if (email) customer.email = email.toLowerCase();
    if (password) customer.password = password;
    if (pushToken) customer.pushToken = pushToken;
    if (typeof notificationsEnabled === 'boolean') {
      customer.notificationsEnabled = notificationsEnabled;
    }
    // ✅ Sensitive Mode preference
    if (typeof sensitiveMode === 'boolean') {
      customer.sensitiveMode = sensitiveMode;
    } else if (sensitiveMode === 'true' || sensitiveMode === 'false') {
      customer.sensitiveMode = sensitiveMode === 'true';
    }

    if (gstNumber !== undefined) customer.gstNumber = gstNumber;
    if (businessName !== undefined) customer.businessName = businessName;
    if (businessAddress !== undefined) customer.businessAddress = businessAddress;

    if (dateOfBirth) {
      // Robust DD/MM/YYYY parsing
      if (typeof dateOfBirth === 'string' && dateOfBirth.includes('/')) {
        const [day, month, year] = dateOfBirth.split('/').map(Number);
        const parsedDate = new Date(year, month - 1, day);
        if (!isNaN(parsedDate.getTime())) {
          customer.dateOfBirth = parsedDate;
        } else {
          customer.dateOfBirth = new Date(dateOfBirth); // Fallback
        }
      } else {
        customer.dateOfBirth = new Date(dateOfBirth);
      }
    }

    if (liveLocation) {
        customer.liveLocation = {
            latitude: Number(liveLocation.latitude || liveLocation.lat),
            longitude: Number(liveLocation.longitude || liveLocation.lng)
        };
    }
    if (address) customer.address = address;

    await customer.save();

    return reply.send({
      message: "Profile updated successfully",
      customer
    });
  } catch (error) {
    console.error("❌ UPDATE PROFILE ERROR:", error);
    return reply.status(500).send({ message: "Error updating profile", error: error.message });
  }
};

export const updateDriverProfile = async (req, reply) => {
  try {
    const { name, email, address, vehicleType, licenseNumber, aadhaarNumber } = req.body;
    const userId = req.user.userId;

    const { DeliveryPartner } = await import("../../models/user.js");
    const driver = await DeliveryPartner.findById(userId);
    
    if (!driver) {
      return reply.status(404).send({ message: "Driver not found" });
    }

    if (name) driver.name = name;
    if (email !== undefined) driver.email = email === "" ? undefined : email.toLowerCase();
    if (address !== undefined) driver.address = address;
    if (vehicleType !== undefined) driver.vehicleType = vehicleType;
    if (licenseNumber !== undefined) driver.licenseNumber = licenseNumber;
    if (aadhaarNumber !== undefined) driver.aadhaarNumber = aadhaarNumber;

    await driver.save();

    return reply.send({
      message: "Profile updated successfully",
      driver
    });
  } catch (error) {
    console.error("❌ UPDATE DRIVER PROFILE ERROR:", error);
    return reply.status(500).send({ message: "Error updating driver profile", error: error.message });
  }
};

export const deleteCustomerAccount = async (req, reply) => {
  try {
    const userId = req.user.userId;
    const customer = await Customer.findByIdAndDelete(userId);

    if (!customer) {
      return reply.status(404).send({ message: "Customer not found" });
    }

    return reply.send({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("❌ DELETE ACCOUNT ERROR:", error);
    return reply.status(500).send({ message: "Error deleting account", error: error.message });
  }
};

export const fetchUser = async (req, reply) => {
  try {
    const user =
      (await Customer.findById(req.user.userId).select('-password -otp')) ||
      (await DeliveryPartner.findById(req.user.userId).select('-password'));

    return reply.send({ user });

  } catch (error) {
    return reply.status(500).send({ message: "Error" });
  }
};

export const refreshToken = async (req, reply) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return reply.status(401).send({ message: "Refresh token required" });
    }

    // Verify Refresh Token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    // Find User (Customer, DeliveryPartner, Admin, or Seller)
    const user =
      (await Customer.findById(decoded.userId)) ||
      (await DeliveryPartner.findById(decoded.userId)) ||
      (await Admin.findById(decoded.userId)) ||
      (await Seller.findById(decoded.userId));

    if (!user) {
      return reply.status(403).send({ message: "Invalid refresh token" });
    }

    // Generate New Tokens
    const tokens = generateTokens(user);

    return reply.send({
      message: "Token refreshed successfully",
      ...tokens,
    });
  } catch (error) {
    console.error("❌ REFRESH TOKEN ERROR:", error.message);
    return reply.status(403).send({ message: "Refresh token invalid or expired" });
  }
};
export const updateAdminPushToken = async (req, reply) => {
  try {
    const { pushToken } = req.body;
    const userId = req.user.userId;

    const user = await Admin.findById(userId);
    if (!user) {
      return reply.status(404).send({ message: "Admin not found" });
    }

    user.pushToken = pushToken;
    await user.save();

    return reply.send({ message: "Admin push token updated successfully" });
  } catch (error) {
    return reply.status(500).send({ message: "Error updating admin push token", error: error.message });
  }
};

export const updateAdminProfile = async (req, reply) => {
  try {
    const { 
      name, email, password, notificationsEnabled,
      department, employeeId, address, city, state, pincode,
      emergencyContact, joiningDate, workShift, managerLevel, profileImage
    } = req.body;
    const userId = req.user.userId;

    const admin = await Admin.findById(userId);
    if (!admin) {
      return reply.status(404).send({ message: "Admin not found" });
    }

    if (name) admin.name = name;
    if (email) admin.email = email.toLowerCase();
    if (password) admin.password = password;
    if (typeof notificationsEnabled === 'boolean') {
      admin.notificationsEnabled = notificationsEnabled;
    }

    // New Fields Sync
    if (department !== undefined) admin.department = department;
    if (employeeId !== undefined) admin.employeeId = employeeId;
    if (address !== undefined) admin.address = address;
    if (city !== undefined) admin.city = city;
    if (state !== undefined) admin.state = state;
    if (pincode !== undefined) admin.pincode = pincode;
    if (emergencyContact !== undefined) admin.emergencyContact = emergencyContact;
    if (joiningDate !== undefined) admin.joiningDate = joiningDate;
    if (workShift !== undefined) admin.workShift = workShift;
    if (managerLevel !== undefined) admin.managerLevel = managerLevel;
    if (profileImage !== undefined) admin.profileImage = profileImage;

    await admin.save();

    return reply.send(admin);
  } catch (error) {
    console.error("❌ UPDATE ADMIN PROFILE ERROR:", error);
    return reply.status(500).send({ message: "Error updating admin profile", error: error.message });
  }
};

export const getFriends = async (req, reply) => {
  try {
    const userId = req.user.userId;
    const { search } = req.query;

    let query = { _id: { $ne: userId }, role: "Customer" };

    if (search && String(search).trim() !== "") {
      const searchStr = String(search).trim();
      const isNum = !isNaN(Number(searchStr)) && searchStr.length >= 3;
      
      query.$or = [
        { name: new RegExp(searchStr, "i") },
        { username: new RegExp(searchStr, "i") }
      ];
      
      if (isNum) {
        query.$or.push({ phone: Number(searchStr) });
      }
    }

    let friends = [];
    if (search && String(search).trim() !== "") {
      friends = await Customer.find(query).select("name username phone email").limit(20);
    } else {
      const user = await Customer.findById(userId).populate("following", "name username phone email");
      if (user && user.following && user.following.length > 0) {
        friends = user.following;
      } else {
        friends = await Customer.find(query).select("name username phone email").limit(20);
      }
    }

    const emojis = ["👩‍🦰", "👨", "🧑", "👩", "🧔", "👱‍♂️", "👱‍♀️", "👵", "👴", "👧"];
    const formattedFriends = friends.map((f) => {
      const friendObj = f.toObject ? f.toObject() : f;
      const idStr = String(friendObj._id);
      let hash = 0;
      for (let i = 0; i < idStr.length; i++) {
        hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
      }
      const emojiIndex = Math.abs(hash) % emojis.length;
      
      let username = friendObj.username || friendObj.name || "friend";
      if (!username.startsWith("@")) {
        username = "@" + username.toLowerCase().replace(/\s+/g, "_");
      }

      return {
        _id: friendObj._id,
        name: friendObj.name || username,
        username,
        avatar: emojis[emojiIndex],
      };
    });

    return reply.send({ success: true, friends: formattedFriends });
  } catch (error) {
    console.error("❌ GET FRIENDS ERROR:", error);
    return reply.status(500).send({ message: "Error fetching friends", error: error.message });
  }
};
