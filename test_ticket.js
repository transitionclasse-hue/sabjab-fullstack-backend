import fetch from "node-fetch";

async function runTest() {
  try {
    // 1. Register a fake user to get a token
    const regRes = await fetch("http://localhost:5001/api/auth/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "9999999999" })
    });
    
    // We assume OTP is bypassed or we can just send any OTP if it's test
    const verifyRes = await fetch("http://localhost:5001/api/auth/customer/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "9999999999", otp: "123456" }) // Assuming test OTP works or it's standard
    });
    
    const verifyData = await verifyRes.json();
    console.log("Login Data:", verifyData);

    if (!verifyData.accessToken) {
        console.log("Failed to get token, cannot test ticket creation");
        return;
    }

    // 2. Create a ticket
    const ticketRes = await fetch("http://localhost:5001/api/tickets", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${verifyData.accessToken}`
         },
        body: JSON.stringify({
            category: "General",
            subject: "Test Ticket",
            description: "Testing ticket"
        })
    });

    const ticketData = await ticketRes.json();
    console.log("Ticket Creation Response:", ticketData);
  } catch (error) {
    console.error("Test Script Error:", error);
  }
}

runTest();
