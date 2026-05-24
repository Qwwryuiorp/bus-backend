const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

app.use(cors());
app.use(bodyParser.json());

//////////////////////////////
// 🧠 DATABASE (IN MEMORY)
//////////////////////////////

let drivers = [];
let tickets = new Map();

//////////////////////////////
// 🧑‍✈️ DRIVER SIGNUP
//////////////////////////////

app.post("/driver-signup", (req, res) => {

  const { name, password } = req.body;

  if (!name || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const exists = drivers.find(d => d.name === name);
  if (exists) {
    return res.status(400).json({ error: "Driver already exists" });
  }

  const driver = {
    id: "D_" + Date.now(),
    name,
    password,
    earnings: 0,
    bus: {
      id: "BUS_" + Date.now(),
      name: "New Route",
      fare: 1,
      acceptTickets: true
    }
  };

  drivers.push(driver);

  res.json(driver);
});

//////////////////////////////
// 🔐 DRIVER LOGIN
//////////////////////////////

app.post("/driver-login", (req, res) => {

  const { name, password } = req.body;

  const driver = drivers.find(
    d => d.name === name && d.password === password
  );

  if (!driver) {
    return res.status(401).json({ error: "Invalid login" });
  }

  res.json(driver);
});

//////////////////////////////
// 🚌 UPDATE BUS SETTINGS
//////////////////////////////

app.post("/update-bus", (req, res) => {

  const { driverId, name, fare, acceptTickets } = req.body;

  const driver = drivers.find(d => d.id === driverId);

  if (!driver) {
    return res.status(404).json({ error: "Driver not found" });
  }

  if (name !== undefined) driver.bus.name = name;
  if (fare !== undefined) driver.bus.fare = fare;
  if (acceptTickets !== undefined) driver.bus.acceptTickets = acceptTickets;

  res.json(driver.bus);
});

//////////////////////////////
// 🎟️ CREATE TICKET (AFTER PAYMENT)
//////////////////////////////

app.post("/create-ticket", (req, res) => {

  const { userId, busId } = req.body;

  const serial =
    "SXM-" +
    Math.random().toString(36).substr(2, 6).toUpperCase() +
    "-" +
    Date.now().toString().slice(-5);

  const ticket = {
    serial,
    userId,
    busId,
    used: false,
    createdAt: Date.now()
  };

  tickets.set(serial, ticket);

  res.json(ticket);
});

//////////////////////////////
// 📱 SCAN TICKET (DRIVER APP)
//////////////////////////////

app.post("/scan-ticket", (req, res) => {

  const { serial } = req.body;

  const ticket = tickets.get(serial);

  if (!ticket) {
    return res.json({ valid: false, msg: "❌ Invalid ticket" });
  }

  if (ticket.used) {
    return res.json({ valid: false, msg: "❌ Already used" });
  }

  ticket.used = true;

  res.json({ valid: true, msg: "✅ Accepted" });
});

//////////////////////////////
// 💰 ADD EARNINGS
//////////////////////////////

app.post("/add-earnings", (req, res) => {

  const { driverId, amount } = req.body;

  const driver = drivers.find(d => d.id === driverId);

  if (!driver) {
    return res.status(404).json({ error: "Driver not found" });
  }

  driver.earnings += amount;

  res.json({ earnings: driver.earnings });
});

//////////////////////////////
// 📊 GET DRIVER DATA
//////////////////////////////

app.post("/driver-data", (req, res) => {

  const { driverId } = req.body;

  const driver = drivers.find(d => d.id === driverId);

  if (!driver) {
    return res.status(404).json({ error: "Driver not found" });
  }

  res.json(driver);
});

//////////////////////////////
// 🚀 START SERVER
//////////////////////////////

app.listen(3000, () => {
  console.log("🚍 SXM Bus Backend running on port 3000");
});
