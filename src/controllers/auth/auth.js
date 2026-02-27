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

    // ⭐ FIXED (normalize types)
    const phone = Number(req.body.phone);
    const email = String(req.body.email).trim().toLowerCase();

    if (!phone || !email) {
      return reply.status(400).send({
        message: "Phone and email required"
      });
    }

    /* ---------- CHECK DUPLICATE EMAIL ---------- */
    const existingUser = await Customer.findOne({ email });

    // ⭐ FIXED COMPARISON
    if (
      existingUser &&
      Number(existingUser.phone) !== Number(phone)
    ) {
      return reply.status(400).send({
        message: "Email already linked to another number."
      });
    }

    /* ---------- GENERATE OTP ---------- */
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    /* ---------- SAVE OTP IN DATABASE ---------- */
    await Customer.findOneAndUpdate(
      { phone },
      {
        email,
        otp,
        otpExpires: Date.now() + 300000,
        role: "Customer",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    console.log("✅ OTP saved in DB");

    /* =====================================================
       SEND OTP VIA HOSTINGER MAIL API
    ===================================================== */

    try {
      const response = await fetch("https://sabjab.com/send-otp.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email, otp }),
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
      otp: otp // Returning OTP for the frontend to receive directly
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

    // ⭐ ensure same type
    const phone = Number(req.body.phone);
    const { otp, password } = req.body;

    const customer = await Customer.findOne({ phone });

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
    const phone = Number(req.body.phone);
    if (!phone) return reply.status(400).send({ message: "Phone required" });

    const customer = await Customer.findOne({ phone });

    return reply.send({
      exists: !!customer && !!customer.password,
      hasEmail: !!customer && !!customer.email
    });
  } catch (error) {
    return reply.status(500).send({ message: "Error checking phone" });
  }
};

/* =====================================================
   LOGIN WITH PASSWORD
===================================================== */

export const loginPassword = async (req, reply) => {
  try {
    const { phone, password } = req.body;
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
    const { name, dateOfBirth, email, notificationsEnabled, pushToken, password } = req.body;
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
