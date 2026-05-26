const express = require("express");
const cors = require("cors");
const crypto = require("crypto");

const app = express();

app.use(cors());
app.use(express.json());

//////////////////////////////////////////////////////
// 🗄️ STORAGE
//////////////////////////////////////////////////////

let drivers = [];

let tickets = [];

//////////////////////////////////////////////////////
// 🧑‍✈️ DRIVER SIGNUP
//////////////////////////////////////////////////////

app.post("/driver-signup",(req,res)=>{

const {name,password} = req.body;

if(!name || !password){

return res.json({
error:"Missing fields"
});
}

const exists =
drivers.find(d=>d.name===name);

if(exists){

return res.json({
error:"Driver already exists"
});
}

const driver = {

id:
crypto.randomUUID(),

name,

password,

earnings:0,

bus:{
name:"",
fare:0,
seats:0,
acceptTickets:true,
active:false
},

location:null
};

drivers.push(driver);

res.json(driver);
});

//////////////////////////////////////////////////////
// 🔐 DRIVER LOGIN
//////////////////////////////////////////////////////

app.post("/driver-login",(req,res)=>{

const {name,password} = req.body;

const driver =
drivers.find(
d=>
d.name===name &&
d.password===password
);

if(!driver){

return res.json({
error:"Invalid login"
});
}

res.json(driver);
});

//////////////////////////////////////////////////////
// 🚌 UPDATE BUS
//////////////////////////////////////////////////////

app.post("/update-bus",(req,res)=>{

const {
driverId,
name,
fare,
seats,
acceptTickets
} = req.body;

const driver =
drivers.find(
d=>d.id===driverId
);

if(!driver){

return res.json({
error:"Driver not found"
});
}

driver.bus = {

name,

fare,

seats,

acceptTickets,

active:true
};

res.json({
success:true
});
});

//////////////////////////////////////////////////////
// 📍 UPDATE LOCATION
//////////////////////////////////////////////////////

app.post("/update-location",(req,res)=>{

const {
driverId,
lat,
lng
} = req.body;

const driver =
drivers.find(
d=>d.id===driverId
);

if(!driver){

return res.json({
error:"Driver not found"
});
}

driver.location = {
lat,
lng
};

res.json({
success:true
});
});

//////////////////////////////////////////////////////
// 🚌 GET ACTIVE BUSES
//////////////////////////////////////////////////////

app.get("/buses",(req,res)=>{

const buses =
drivers
.filter(
d=>
d.bus.active &&
d.location
)
.map(d=>({

id:d.id,

name:d.bus.name,

fare:d.bus.fare,

seats:d.bus.seats,

acceptTickets:
d.bus.acceptTickets,

location:d.location
}));

res.json(buses);
});

//////////////////////////////////////////////////////
// 🎟️ CREATE TICKET
//////////////////////////////////////////////////////

app.post("/create-ticket",(req,res)=>{

const {
busId,
passengerName
} = req.body;

const driver =
drivers.find(
d=>d.id===busId
);

if(!driver){

return res.json({
error:"Bus not found"
});
}

if(!driver.bus.acceptTickets){

return res.json({
error:
"Driver not accepting tickets"
});
}

//////////////////////////////////////////////////////
// 🔢 SERIAL
//////////////////////////////////////////////////////

const serial =
crypto.randomBytes(16)
.toString("hex");

//////////////////////////////////////////////////////
// 💳 PAYPAL LINK
//////////////////////////////////////////////////////

const paypalUsername =
"YOUR_PAYPAL_EMAIL";

const amount =
driver.bus.fare;

const paymentUrl =
`https://www.paypal.com/paypalme/${paypalUsername}/${amount}`;

//////////////////////////////////////////////////////
// 🎟️ TICKET
//////////////////////////////////////////////////////

const ticket = {

id:
crypto.randomUUID(),

serial,

busId,

driverId:
driver.id,

passengerName,

fare:
driver.bus.fare,

paid:false,

created:
Date.now()
};

tickets.push(ticket);

res.json({

success:true,

serial,

paymentUrl,

ticket
});
});

//////////////////////////////////////////////////////
// ✅ VERIFY PAYMENT
//////////////////////////////////////////////////////

app.post("/verify-payment",(req,res)=>{

const {serial} = req.body;

const ticket =
tickets.find(
t=>t.serial===serial
);

if(!ticket){

return res.json({
error:"Invalid ticket"
});
}

//////////////////////////////////////////////////////
// ⚠️ TEMP MANUAL VERIFY
//////////////////////////////////////////////////////

ticket.paid = true;

//////////////////////////////////////////////////////
// 💰 DRIVER EARNINGS
//////////////////////////////////////////////////////

const driver =
drivers.find(
d=>d.id===ticket.driverId
);

if(driver){

driver.earnings +=
ticket.fare;
}

res.json({

success:true,

ticket
});
});

//////////////////////////////////////////////////////
// 📲 SCAN QR
//////////////////////////////////////////////////////

app.post("/scan-ticket",(req,res)=>{

const {serial} = req.body;

const ticket =
tickets.find(
t=>t.serial===serial
);

if(!ticket){

return res.json({
valid:false
});
}

if(!ticket.paid){

return res.json({
valid:false,
reason:"Unpaid ticket"
});
}

res.json({
valid:true,
ticket
});
});

//////////////////////////////////////////////////////
// 💰 DRIVER EARNINGS
//////////////////////////////////////////////////////

app.get("/driver-earnings/:id",(req,res)=>{

const driver =
drivers.find(
d=>d.id===req.params.id
);

if(!driver){

return res.json({
error:"Driver not found"
});
}

res.json({

earnings:
driver.earnings
});
});

//////////////////////////////////////////////////////
// 🚀 START
//////////////////////////////////////////////////////

const PORT =
process.env.PORT || 3000;

app.listen(PORT,()=>{

console.log(
"Server running on port " + PORT
);
});
