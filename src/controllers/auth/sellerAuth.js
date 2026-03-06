import { Seller } from "../../models/user.js";
import jwt from "jsonwebtoken";

const sanitizeSeller = (seller) => {
    if (!seller) return null;
    const safeSeller = seller.toObject ? seller.toObject() : { ...seller };
    delete safeSeller.password;
    return safeSeller;
};

const canManageSellerApprovals = (role) => role === "Admin" || role === "Manager";

export const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "1d" }
    );

    const refreshToken = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: "1d" }
    );

    return { accessToken, refreshToken };
};

export const registerSeller = async (req, reply) => {
    try {
        const { name, email, password, phone, businessName, businessAddress } = req.body;

        const existingSeller = await Seller.findOne({ email });
        if (existingSeller) {
            return reply.status(400).send({ message: "Seller with this email already exists" });
        }

        const seller = new Seller({
            name,
            email,
            password, // Storing plain text as requested by architecture (or implement hash if global applies)
            phone,
            businessName,
            businessAddress,
            role: "Seller",
            isApproved: false // Requires admin approval
        });

        await seller.save();

        const { accessToken, refreshToken } = generateTokens(seller);
        return reply.status(201).send({
            message: "Seller registered successfully. Pending Admin approval.",
            accessToken,
            refreshToken,
            seller: sanitizeSeller(seller)
        });
    } catch (error) {
        console.error("Seller Registration Error:", error);
        return reply.status(500).send({ message: "An error occurred during registration", error: error.message });
    }
};

export const loginSeller = async (req, reply) => {
    try {
        const { email, password } = req.body;

        const seller = await Seller.findOne({ email, role: "Seller" });
        if (!seller) {
            return reply.status(404).send({ message: "Seller not found" });
        }

        if (seller.password !== password) {
            return reply.status(401).send({ message: "Invalid credentials" });
        }

        if (!seller.isApproved) {
            // They can login, but we notify frontend they are pending
        }

        const { accessToken, refreshToken } = generateTokens(seller);
        return reply.send({
            message: "Login successful",
            accessToken,
            refreshToken,
            seller: sanitizeSeller(seller)
        });
    } catch (error) {
        console.error("Seller Login Error:", error);
        return reply.status(500).send({ message: "An error occurred during login", error: error.message });
    }
};

export const getSellerProfile = async (req, reply) => {
    try {
        const { userId } = req.user;
        const seller = await Seller.findById(userId).select("-password");
        if (!seller) {
            return reply.status(404).send({ message: "Seller profile not found" });
        }
        return reply.send(seller);
    } catch (error) {
        console.error("Fetch Seller Profile Error:", error);
        return reply.status(500).send({ message: "An error occurred fetching profile", error: error.message });
    }
};

export const getPendingSellers = async (req, reply) => {
    try {
        const { role } = req.user;
        if (!canManageSellerApprovals(role)) {
            return reply.status(403).send({ message: "Unauthorized. Admin or Manager only." });
        }

        const sellers = await Seller.find({ isApproved: false })
            .sort({ createdAt: -1 })
            .select("-password")
            .lean();

        return reply.send({ success: true, count: sellers.length, sellers });
    } catch (error) {
        console.error("Fetch Pending Sellers Error:", error);
        return reply.status(500).send({ message: "An error occurred fetching pending sellers", error: error.message });
    }
};

export const approveSeller = async (req, reply) => {
    try {
        const { role } = req.user;
        if (!canManageSellerApprovals(role)) {
            return reply.status(403).send({ message: "Unauthorized. Admin or Manager only." });
        }

        const seller = await Seller.findByIdAndUpdate(
            req.params.id,
            { isApproved: true },
            { new: true }
        ).select("-password");

        if (!seller) {
            return reply.status(404).send({ message: "Seller not found" });
        }

        return reply.send({ success: true, message: "Seller approved successfully", seller });
    } catch (error) {
        console.error("Approve Seller Error:", error);
        return reply.status(500).send({ message: "An error occurred approving seller", error: error.message });
    }
};

export const updateSellerProfile = async (req, reply) => {
    try {
        const { userId } = req.user;
        const { name, phone, businessName, businessAddress, gstNumber } = req.body;

        const updatedSeller = await Seller.findByIdAndUpdate(
            userId,
            {
                $set: {
                    ...(name && { name }),
                    ...(phone && { phone }),
                    ...(businessName && { businessName }),
                    ...(businessAddress && { businessAddress }),
                    ...(gstNumber && { gstNumber }),
                },
            },
            { new: true }
        ).select("-password");

        if (!updatedSeller) {
            return reply.status(404).send({ message: "Seller not found" });
        }

        return reply.send({
            message: "Profile updated successfully",
            seller: updatedSeller,
        });
    } catch (error) {
        console.error("Update Seller Profile Error:", error);
        return reply.status(500).send({ message: "An error occurred updating profile", error: error.message });
    }
};
