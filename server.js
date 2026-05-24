const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

//////////////////////////////////////////////////////
// 🧠 MEMORY DATABASE
//////////////////////////////////////////////////////

let drivers = [];

let tickets = [];

//////////////////////////////////////////////////////
// 🧑‍✈️ DRIVER SIGNUP
//////////////////////////////////////////////////////

app.post("/driver-signup", (req, res) => {

  const { name, password } = req.body;

  if (!name || !password) {
    return res.json({
      error: "Missing fields"
    });
  }

  const exists = drivers.find(d => d.name === name);

  if (exists) {
    return res.json({
      error: "Driver already exists"
    });
  }

  const driver = {
    id: "D_" + Date.now(),

    name,
    password,

    earnings: 0,

    location: null,

    bus: {
      id: "BUS_" + Date.now(),

      name: "Unnamed Bus",

      fare: 2,

      seats: 10,

      acceptTickets: true,

      active: false
    }
  };

  drivers.push(driver);

  res.json(driver);
});

//////////////////////////////////////////////////////
// 🔐 DRIVER LOGIN
//////////////////////////////////////////////////////

app.post("/driver-login", (req, res) => {

  const { name, password } = req.body;

  const driver = drivers.find(
    d =>
      d.name === name &&
      d.password === password
  );

  if (!driver) {
    return res.json({
      error: "Invalid login"
    });
  }

  res.json(driver);
});

//////////////////////////////////////////////////////
// 🚌 UPDATE BUS
//////////////////////////////////////////////////////

app.post("/update-bus", (req, res) => {

  const {
    driverId,
    name,
    fare,
    seats,
    acceptTickets
  } = req.body;

  const driver = drivers.find(
    d => d.id === driverId
  );

  if (!driver) {
    return res.json({
      error: "Driver not found"
    });
  }

  if (name !== undefined)
    driver.bus.name = name;

  if (fare !== undefined)
    driver.bus.fare = fare;

  if (seats !== undefined)
    driver.bus.seats = seats;

  if (acceptTickets !== undefined)
    driver.bus.acceptTickets =
      acceptTickets;

  //////////////////////////////////////////////////////
  // 🚍 MAKE BUS ACTIVE AFTER SAVE
  //////////////////////////////////////////////////////

  driver.bus.active = true;

  res.json({
    success: true,
    bus: driver.bus
  });
});

//////////////////////////////////////////////////////
// 📍 LIVE GPS UPDATE
//////////////////////////////////////////////////////

app.post("/update-location", (req, res) => {

  const {
    driverId,
    lat,
    lng
  } = req.body;

  const driver = drivers.find(
    d => d.id === driverId
  );

  if (!driver) {
    return res.json({
      error: "Driver not found"
    });
  }

  driver.location = {
    lat,
    lng
  };

  driver.bus.active = true;

  res.json({
    success: true
  });
});

//////////////////////////////////////////////////////
// 🗺️ GET ALL ACTIVE BUSES
//////////////////////////////////////////////////////

app.get("/buses", (req, res) => {

  const buses = drivers
    .filter(d =>
      d.bus.active &&
      d.location
    )
    .map(d => ({

      id: d.bus.id,

      driverId: d.id,

      name: d.bus.name,

      fare: d.bus.fare,

      seats: d.bus.seats,

      acceptTickets:
        d.bus.acceptTickets,

      earnings: d.earnings,

      location: d.location
    }));

  res.json(buses);
});

//////////////////////////////////////////////////////
// 🎟️ CREATE TICKET
//////////////////////////////////////////////////////

app.post("/create-ticket", (req, res) => {

  const {
    busId,
    passengerName
  } = req.body;

  const serial =
    "SXM-" +
    Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

  const ticket = {
    serial,

    busId,

    passengerName,

    used: false,

    createdAt: Date.now()
  };

  tickets.push(ticket);

  res.json(ticket);
});

//////////////////////////////////////////////////////
// 📱 SCAN TICKET
//////////////////////////////////////////////////////

app.post("/scan-ticket", (req, res) => {

  const { serial } = req.body;

  const ticket = tickets.find(
    t => t.serial === serial
  );

  if (!ticket) {
    return res.json({
      valid: false,
      msg: "❌ Invalid Ticket"
    });
  }

  if (ticket.used) {
    return res.json({
      valid: false,
      msg: "❌ Ticket Already Used"
    });
  }

  ticket.used = true;

  res.json({
    valid: true,
    msg: "✅ Ticket Accepted"
  });
});

//////////////////////////////////////////////////////
// 💰 ADD EARNINGS
//////////////////////////////////////////////////////

app.post("/add-earnings", (req, res) => {

  const {
    driverId,
    amount
  } = req.body;

  const driver = drivers.find(
    d => d.id === driverId
  );

  if (!driver) {
    return res.json({
      error: "Driver not found"
    });
  }

  driver.earnings += Number(amount);

  res.json({
    earnings: driver.earnings
  });
});

//////////////////////////////////////////////////////
// 📊 DRIVER DATA
//////////////////////////////////////////////////////

app.post("/driver-data", (req, res) => {

  const { driverId } = req.body;

  const driver = drivers.find(
    d => d.id === driverId
  );

  if (!driver) {
    return res.json({
      error: "Driver not found"
    });
  }

  res.json(driver);
});

//////////////////////////////////////////////////////
// 🌐 ROOT TEST
//////////////////////////////////////////////////////

app.get("/", (req, res) => {

  res.send("🚍 SXM Bus Backend Running");

});

//////////////////////////////////////////////////////
// 🚀 START SERVER
//////////////////////////////////////////////////////

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {

  console.log(
    "🚍 Server running on port " + PORT
  );

});
