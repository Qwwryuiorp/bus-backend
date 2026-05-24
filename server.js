const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(bodyParser.json());

//////////////////////////////
// 🧠 MEMORY DATABASE (TEMP)
//////////////////////////////

const tickets = new Map();
const usedSerials = new Set();

//////////////////////////////
// 🔐 PAYPAL CONFIG
//////////////////////////////

const PAYPAL_CLIENT = "YOUR_CLIENT_ID";
const PAYPAL_SECRET = "YOUR_SECRET";
const PAYPAL_API = "https://api-m.sandbox.paypal.com";

//////////////////////////////
// 🔑 GET PAYPAL TOKEN
//////////////////////////////

async function getToken() {
  const res = await axios({
    url: PAYPAL_API + "/v1/oauth2/token",
    method: "post",
    auth: {
      username: PAYPAL_CLIENT,
      password: PAYPAL_SECRET
    },
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    data: "grant_type=client_credentials"
  });

  return res.data.access_token;
}

//////////////////////////////
// 💳 VERIFY PAYMENT
//////////////////////////////

app.post("/verify-payment", async (req, res) => {
  const { orderID, userId, busId } = req.body;

  try {
    const token = await getToken();

    const order = await axios({
      url: `${PAYPAL_API}/v2/checkout/orders/${orderID}`,
      method: "get",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const status = order.data.status;

    if (status !== "COMPLETED") {
      return res.status(400).json({ error: "Payment not completed" });
    }

    // 🔐 CREATE UNIQUE SERIAL
    let serial;
    do {
      serial =
        "SXM-" +
        Math.random().toString(36).substr(2, 6).toUpperCase() +
        "-" +
        Date.now().toString().slice(-5);
    } while (usedSerials.has(serial));

    usedSerials.add(serial);

    const ticket = {
      serial,
      userId,
      busId,
      used: false,
      createdAt: Date.now()
    };

    tickets.set(serial, ticket);

    res.json(ticket);

  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});

//////////////////////////////
// 📱 DRIVER SCAN CHECK
//////////////////////////////

app.post("/scan", (req, res) => {
  const { serial } = req.body;

  const ticket = tickets.get(serial);

  if (!ticket) {
    return res.json({ valid: false, msg: "Invalid ticket" });
  }

  if (ticket.used) {
    return res.json({ valid: false, msg: "Already used" });
  }

  ticket.used = true;

  res.json({ valid: true, msg: "Accepted" });
});

//////////////////////////////
// 🚀 START SERVER
//////////////////////////////

app.listen(3000, () => {
  console.log("Backend running on http://localhost:3000");
});
