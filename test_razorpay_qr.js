import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_mockKeyId123",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "mockSecret123",
});

async function testQr() {
  try {
    const qrOptions = {
      type: "upi_qr",
      name: "SabJab Store",
      usage: "single_use",
      fixed_amount: true,
      payment_amount: 100, // 1 INR in paise
      description: "Test Order #123",
      notes: {
        orderId: "test_order_id_123"
      }
    };
    
    console.log("Calling razorpay.qrCode.create with keys:", {
      key_id: razorpay.key_id,
      key_secret: razorpay.key_secret ? "EXISTS" : "MISSING"
    });
    
    const qr = await razorpay.qrCode.create(qrOptions);
    console.log("Success:", qr);
  } catch (err) {
    console.error("Error from Razorpay API:", err);
  }
}

testQr();
