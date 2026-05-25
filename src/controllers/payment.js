import Razorpay from "razorpay";
import dotenv from "dotenv";

dotenv.config();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_mockKeyId123",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "mockSecret123",
});

/**
 * 💳 Create Razorpay Order
 * This endpoint is called before opening the checkout payment flow
 */
export const createRazorpayOrder = async (req, reply) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount) || amount <= 0) {
      return reply.code(400).send({ message: "Invalid payment amount" });
    }

    const options = {
      amount: Math.round(amount * 100), // convert to paise
      currency: "INR",
      receipt: `receipt_order_${Date.now()}`,
    };

    const rzpOrder = await razorpay.orders.create(options);
    return reply.code(200).send({
      success: true,
      id: rzpOrder.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      key: process.env.RAZORPAY_KEY_ID || "rzp_test_mockKeyId123",
    });
  } catch (error) {
    console.error("Razorpay Order Creation Error:", error);
    return reply.code(500).send({ message: "Failed to create payment order", error: error.message });
  }
};

/**
 * 🌐 Render WebView Payment Gateway HTML
 * Renders standard Razorpay Checkout loaded inside an iframe/container for mobile apps
 */
export const renderCheckoutWebView = async (req, reply) => {
  const { orderId, amount, key, name, phone } = req.query;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>Sabjab Secure Payment</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      color: #0f172a;
      text-align: center;
    }
    .container {
      padding: 30px 24px;
      border-radius: 20px;
      background: #ffffff;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
      max-width: 90%;
      width: 320px;
      box-sizing: border-box;
    }
    .loader {
      border: 4px solid #e2e8f0;
      border-top: 4px solid #FF8C00;
      border-radius: 50%;
      width: 48px;
      height: 48px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    h2 {
      margin: 0 0 8px 0;
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
    }
    p {
      margin: 0;
      font-size: 14px;
      color: #64748b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="loader"></div>
    <h2>SabJab Secure Checkout</h2>
    <p>Connecting to secure payment gateway...</p>
  </div>

  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    const options = {
      key: "${key || ''}",
      amount: ${amount || 0},
      currency: "INR",
      name: "SabJab",
      description: "Order Payment",
      order_id: "${orderId || ''}",
      prefill: {
        name: "${decodeURIComponent(name || '')}",
        contact: "${phone || ''}"
      },
      theme: {
        color: "#FF8C00"
      },
      webview_intent: true,
      handler: function (response) {
        const data = {
          event: "success",
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature
        };
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(data));
        } else {
          console.log("Success:", data);
        }
      },
      modal: {
        ondismiss: function () {
          const data = { event: "close" };
          if (window.ReactNativeWebView) {
            window.ReactNativeWebView.postMessage(JSON.stringify(data));
          } else {
            console.log("Closed");
          }
        }
      }
    };

    const rzp = new Razorpay(options);
    
    rzp.on('payment.failed', function (response) {
      const data = {
        event: "failure",
        error: response.error
      };
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify(data));
      } else {
        console.log("Failure:", data);
      }
    });

    window.onload = function() {
      rzp.open();
    };
  </script>
</body>
</html>
  `;

  return reply.type("text/html").send(htmlContent);
};
