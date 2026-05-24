import mongoose from "mongoose";
import Order from "../models/order.js";
import Product from "../models/products.js";
import WalletTransaction from "../models/walletTransaction.js";

/**
 * Processes commission payouts for creators whose reels referred items in a delivered order.
 * Ensures payouts are only credited once per item and blocks self-referrals.
 * 
 * @param {string|ObjectId} orderId - The ID of the delivered order.
 */
export const processReelCommission = async (orderId) => {
  try {
    console.log(`[Commission] Processing reel commissions for Order: ${orderId}`);
    
    // Check if Bawal is enabled
    const GlobalConfig = (await import("../models/globalConfig.js")).default;
    const bawalConfig = await GlobalConfig.findOne({ key: "bawal_config" }).lean();
    if (bawalConfig && bawalConfig.value?.enabled === false) {
      console.log(`[Commission] Bawal/Reels are disabled. Skipping commission processing.`);
      return;
    }
    
    // Fetch the order
    const order = await Order.findById(orderId);
    if (!order) {
      console.warn(`[Commission] Order not found: ${orderId}`);
      return;
    }

    if (!order.items || order.items.length === 0) {
      console.log(`[Commission] Order ${orderId} has no items.`);
      return;
    }

    // Filter items with reel referral details
    const referredItems = order.items.filter(
      (item) => item.referredByReel && item.referrer
    );

    if (referredItems.length === 0) {
      console.log(`[Commission] Order ${orderId} has no referred items.`);
      return;
    }

    for (const item of referredItems) {
      const referrerId = item.referrer.toString();
      const buyerId = order.customer.toString();

      // 1. Prevent self-referrals
      if (referrerId === buyerId) {
        console.log(
          `[Commission] Skipping self-referral for item ${item.item} in Order ${orderId}`
        );
        continue;
      }

      // 2. Prevent duplicate credits
      const existingTxn = await WalletTransaction.findOne({
        order: orderId,
        customer: item.referrer,
        txnType: "reel_commission",
        "meta.itemId": item._id,
      });

      if (existingTxn) {
        console.log(
          `[Commission] Commission already paid for item ${item.item} of Order ${orderId} to creator ${item.referrer}`
        );
        continue;
      }

      // 3. Fetch product to determine commission rate
      const product = await Product.findById(item.item);
      if (!product) {
        console.warn(`[Commission] Product not found: ${item.item}`);
        continue;
      }

      // Calculate item total price
      const price = item.variation?.price || product.price || 0;
      const totalAmount = price * (item.count || 1);

      // Determine commission rate (fallback to 5% if not set)
      const commissionRate = product.commissionRate !== undefined ? product.commissionRate : 0.05;
      const commissionAmount = Math.round(totalAmount * commissionRate * 100) / 100;

      if (commissionAmount <= 0) {
        console.log(
          `[Commission] Calculated commission for product ${product.name} is 0. Skipping.`
        );
        continue;
      }

      // 4. Create the WalletTransaction to credit the creator
      const txn = new WalletTransaction({
        customer: item.referrer,
        order: order._id,
        amount: commissionAmount,
        type: "credit",
        txnType: "reel_commission",
        description: `Commission earned from reel referral for ${product.name} (Qty: ${item.count})`,
        status: "completed",
        meta: {
          itemId: item._id,
          productId: product._id,
          reelId: item.referredByReel,
          rate: commissionRate,
          purchasedQty: item.count,
          purchaseAmount: totalAmount,
        },
      });

      await txn.save();
      console.log(
        `[Commission] SUCCESS: Credited ₹${commissionAmount} to creator ${item.referrer} for item ${product.name} in Order ${orderId}`
      );
    }
  } catch (error) {
    console.error(`[Commission] CRITICAL ERROR in processReelCommission:`, error);
  }
};
