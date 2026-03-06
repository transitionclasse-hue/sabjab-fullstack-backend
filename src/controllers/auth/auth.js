import { Customer, DeliveryPartner, Admin } from '../../models/user.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/* =====================================================
   TOKEN GENERATION
===================================================== */

const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: '1d' }
  );

  const refreshToken = jwt.sign(
    { userId: user._id, role: user.role },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

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
      otp: otp,
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

    return reply.send({
      message: "Login Successful",
      ...generateTokens(customer),
      customer
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
   LOGIN WITH PASSWORD
===================================================== */

export const loginPassword = async (req, reply) => {
  try {
    const { phone: rawPhone, password } = req.body;
    const phoneStr = String(rawPhone).replace(/[^0-9]/g, "").slice(-10);
    const phone = Number(phoneStr);
    let customer = await Customer.findOne({ phone });

    // Ensure password matches if they have one set
    if (!customer || customer.password !== password) {
      return reply.code(401).send({ message: "Invalid phone number or password" });
    }

    const { accessToken, refreshToken } = generateTokens(customer);
    return reply.send({
      message: "Login successful",
      accessToken,
      refreshToken,
      customer,
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
    const rawPassword = req.body.password || '';

    const email = String(rawEmail).trim().toLowerCase();
    const password = String(rawPassword).trim();

    console.log(`[AUTH DEBUG] Attempting Driver Login: |${email}| with pass |${password}|`);

    const driver = await DeliveryPartner.findOne({ email, role: "DeliveryPartner" });

    if (!driver || driver.password !== password) {
      return reply.code(401).send({ message: `Invalid driver credentials. (Seen: '${email}' / '${password}')` });
    }

    if (!driver.isActivated) {
      return reply.code(403).send({ message: "Driver account not activated by Admin" });
    }

    const { accessToken, refreshToken } = generateTokens(driver);

    return reply.send({
      message: "Driver login successful",
      accessToken,
      refreshToken,
      deliveryPartner: driver,
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

    console.log(`[AUTH DEBUG] Attempting Admin Login: "${email}"`);
    const user = await Admin.findOne({ email });

    if (!user) {
      console.log(`[AUTH DEBUG] User not found for: "${email}"`);
      return reply.code(401).send({ message: "Invalid admin credentials" });
    }

    if (user.password !== password) {
      console.log(`[AUTH DEBUG] Password mismatch for: "${email}" (Expected: "${user.password}", Got: "${password}")`);
      return reply.code(401).send({ message: "Invalid admin credentials" });
    }

    const { accessToken, refreshToken } = generateTokens(user);

    return reply.send({
      message: "Admin login successful",
      token: accessToken, // Manager app expects 'token'
      refreshToken,
      user
    });
  } catch (error) {
    return reply.code(500).send({ message: "Admin login failed", error: error.message });
  }
};

/* =====================================================
   REQUIRED EXPORTS
===================================================== */

export const updateCustomerProfile = async (req, reply) => {
  try {
    const { name, dateOfBirth, email, notificationsEnabled, pushToken, password, sensitiveMode } = req.body;
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
    }

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
      (await Customer.findById(req.user.userId)) ||
      (await DeliveryPartner.findById(req.user.userId));

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

    // Find User (Customer or DeliveryPartner)
    const user =
      (await Customer.findById(decoded.userId)) ||
      (await DeliveryPartner.findById(decoded.userId));

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
