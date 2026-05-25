import Razorpay from "razorpay";
import dotenv from "dotenv";
import PricingConfig from "../models/pricingConfig.js";

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
  const { orderId, amount, key, name, phone, method, deliveryCollection } = req.query || {};
  const isDeliveryCollection = deliveryCollection === "true";
  const rzpKey = key || process.env.RAZORPAY_KEY_ID || "rzp_test_mockKeyId123";

  // Fetch PricingConfig to toggle Razorpay topbar layout
  const config = await PricingConfig.findOne({ key: "primary" }).lean();
  const hideTopbar = config?.hideRazorpayTopbar || false;

  // Construct WebView URL pointing to Fastify hosted payment loader
  const rootUrl = process.env.BASE_URL || "https://api.sabjab.com";

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>SabJab Secure Payment</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: radial-gradient(circle at top right, #03102e, #060913 60%);
      font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      color: #ffffff;
      text-align: center;
      overflow: hidden;
    }
    
    .glow-blob {
      position: absolute;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(3, 16, 46, 0.15) 0%, rgba(3, 16, 46, 0) 70%);
      top: -50px;
      right: -50px;
      z-index: 1;
      pointer-events: none;
    }
    
    .container {
      position: relative;
      z-index: 2;
      padding: 40px 32px;
      border-radius: 24px;
      background: rgba(255, 255, 255, 0.02);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.07);
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      max-width: 90%;
      width: 320px;
      box-sizing: border-box;
      animation: fadeIn 0.8s ease-out;
    }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .brand-logo {
      width: 240px;
      height: auto;
      margin-bottom: 28px;
      filter: drop-shadow(0 4px 10px rgba(3, 16, 46, 0.25));
      background: #ffffff;
      padding: 12px 24px;
      border-radius: 16px;
      box-sizing: border-box;
    }
    
    .loader-ring {
      position: relative;
      width: 64px;
      height: 64px;
      margin: 0 auto 28px auto;
    }
    
    .loader-ring div {
      box-sizing: border-box;
      display: block;
      position: absolute;
      width: 64px;
      height: 64px;
      border: 4px solid transparent;
      border-radius: 50%;
      animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
      border-top-color: #03102e;
    }
    
    .loader-ring div:nth-child(1) {
      animation-delay: -0.45s;
      border-top-color: #1e3a8a;
    }
    
    .loader-ring div:nth-child(2) {
      animation-delay: -0.3s;
      border-top-color: #3b82f6;
    }
    
    .loader-ring div:nth-child(3) {
      animation-delay: -0.15s;
      border-top-color: #03102e;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    h2 {
      margin: 0 0 10px 0;
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 0.5px;
    }
    
    p {
      margin: 0 0 24px 0;
      font-size: 13px;
      color: #94a3b8;
      font-weight: 500;
      line-height: 1.6;
    }
    
    .security-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: rgba(3, 16, 46, 0.2);
      border: 1px solid rgba(3, 16, 46, 0.4);
      border-radius: 100px;
      color: #60a5fa;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }
    
    .security-badge svg {
      width: 12px;
      height: 12px;
      fill: currentColor;
    }
  </style>
</head>
<body>
  <div class="glow-blob"></div>
  <div class="container">
    <img src="${rootUrl}/public/logo.png?v=2" alt="SabJab Logo" class="brand-logo" />
    <div class="loader-ring">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
    <h2>Secure Gateway</h2>
    <p>Connecting to secure payment gateway. Please do not close or refresh this page...</p>
    <div class="security-badge">
      <svg viewBox="0 0 24 24">
        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
      </svg>
      PCI-DSS Secure
    </div>
  </div>

  <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
  <script>
    const rawMethod = "${method || ''}";
    let prefillMethod = rawMethod;
    let customConfig = null;

    if (rawMethod.startsWith("upi_")) {
      prefillMethod = "upi";
      const upiApp = rawMethod.replace("upi_", ""); // 'gpay', 'phonepe', 'paytm', 'cred'
      
      customConfig = {
        display: {
          blocks: {
            upi: {
              name: upiApp === "gpay" ? "Google Pay" : upiApp === "phonepe" ? "PhonePe" : upiApp === "paytm" ? "Paytm" : "CRED Pay",
              instruments: [
                {
                  method: "upi",
                  apps: [upiApp]
                }
              ]
            }
          },
          sequence: ["block.upi"],
          preferences: {
            show_default_blocks: false
          }
        }
      };
    }

    const options = {
      key: "${rzpKey}",
      amount: ${amount || 0},
      currency: "INR",
      name: "SabJab",
      description: "Order Payment",
      image: "${rootUrl}/public/logo.png?v=2",
      order_id: "${orderId || ''}",
      prefill: {
        name: "${decodeURIComponent(name || '')}",
        contact: "${phone || ''}",
        method: prefillMethod
      },
      theme: {
        color: "#03102e",
        hide_topbar: ${hideTopbar}
      },
      webview_intent: true,
      handler: function (response) {
        const data = {
          event: "success",
          orderId: "${orderId || ''}",
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_order_id: response.razorpay_order_id,
          razorpay_signature: response.razorpay_signature
        };
        
        const isDeliveryCollection = ${isDeliveryCollection};

        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify(data));
        } else if (isDeliveryCollection) {
          // Doorstep QR verification
          document.body.innerHTML = '<div class="container">' +
            '<div class="spinner"></div>' +
            '<h2>Verifying Payment...</h2>' +
            '<p>Confirming your transaction status with the server.</p>' +
            '</div>';
          
          fetch("/payment/verify-delivery-payment", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
          })
          .then(function(res) { return res.json(); })
          .then(function(resData) {
            if (resData.success) {
              document.body.innerHTML = '<div class="container">' +
                '<div style="font-size: 64px; color: #10B981; margin-bottom: 20px;">✓</div>' +
                '<h2 style="font-weight: 800; font-size: 24px; margin-bottom: 12px;">Payment Successful!</h2>' +
                '<p style="color: #cbd5e1; font-size: 16px; line-height: 1.5; margin-bottom: 8px;">Your payment of Rs ' + (Number("${amount}") / 100).toFixed(2) + ' has been verified.</p>' +
                '<p style="color: #94a3b8; font-size: 14px; line-height: 1.4;">The driver has been notified of delivery completion. You can safely close this page.</p>' +
                '</div>';
            } else {
              document.body.innerHTML = '<div class="container">' +
                '<div style="font-size: 64px; color: #ef4444; margin-bottom: 20px;">✗</div>' +
                '<h2 style="font-weight: 800; font-size: 24px; margin-bottom: 12px; color: #ef4444;">Verification Failed</h2>' +
                '<p style="color: #cbd5e1; font-size: 16px; line-height: 1.5;">' + (resData.message || "Signature verification failed.") + '</p>' +
                '</div>';
            }
          })
          .catch(function(err) {
            document.body.innerHTML = '<div class="container">' +
              '<div style="font-size: 64px; color: #ef4444; margin-bottom: 20px;">✗</div>' +
              '<h2 style="font-weight: 800; font-size: 24px; margin-bottom: 12px; color: #ef4444;">Connection Error</h2>' +
              '<p style="color: #cbd5e1; font-size: 16px; line-height: 1.5;">Could not connect to the server to verify payment.</p>' +
              '</div>';
          });
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

    if (customConfig) {
      options.config = customConfig;
    }

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
