const express = require("express");
const mongoose = require("mongoose");

//Allow our backend application to be available to our frontend application
//Allows us to controll the app's Cross Origin Resource Sharing Settings
const cors = require("cors");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const flightRoutes = require("./routes/flight");
const bookingRoutes = require("./routes/booking");
const paymentRoutes = require("./routes/payment");
const adminRoutes = require("./routes/admin");
const emailRoutes = require("./routes/email");


//[SECTION] Environment setup
//const port = 4000;
require('dotenv').config();

const app = express();

app.use(express.json());

const corsOptions = {

	origin: ['http://localhost:8000', 'http://localhost:5173'],
	credentials: true,
	optionsSuccessStatus: 200
}


app.use(cors(corsOptions));


//[SECTION] Database Connection
//Connect to our MongoDB database
mongoose.connect(process.env.MONGODB_STRING);

mongoose.connection.once('open', () => console.log('Now connected to MongoDB Atlas.'))


app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/flights", flightRoutes);
app.use("/bookings", bookingRoutes);
app.use("/payment", paymentRoutes);
app.use("/admin", adminRoutes);
app.use("/email", emailRoutes);

if(require.main === module) {

	app.listen(process.env.PORT || 3000, () => {
		console.log(`API is now online on port ${process.env.PORT || 3000}`);
	})
}

module.exports = { app, mongoose };