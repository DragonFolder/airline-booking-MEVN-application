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

const { errorHandler } = require("./utils/auth");
const { sendSuccess, sendError } = require("./utils/response");


//[SECTION] Environment setup
require('dotenv').config();

const PORT = process.env.PORT || 4000;
const MONGODB_STRING = process.env.MONGODB_STRING;

const app = express();

app.use(express.json());

const corsOptions = {

	origin: true,
	credentials: true,
	optionsSuccessStatus: 200
}


app.use(cors(corsOptions));


//[SECTION] Database Connection
// The connection is deliberately NOT allowed to kill the process. On a hosted
// platform a crashed process means no logs and no HTTP response at all, so a
// bad/missing MONGODB_STRING becomes invisible. Instead we always bind the
// port, keep the connection error, and report it through /health and as a 503
// on the routes that actually need the database.

const DB_STATES = {
	0: 'disconnected',
	1: 'connected',
	2: 'connecting',
	3: 'disconnecting',
	99: 'uninitialized'
};

let dbError = null;
let connectPromise = null;

// Without this, a query issued while disconnected is queued and fails 10s later
// with "Operation `x.find()` buffering timed out", which says nothing about the
// real cause. Failing immediately lets the actual connection error surface.
mongoose.set('bufferCommands', false);

function connectDb() {

	if (!MONGODB_STRING) {
		return Promise.reject(new Error("MONGODB_STRING environment variable is not set"));
	}

	if (!connectPromise) {

		// serverSelectionTimeoutMS is lowered from the 30s default so an
		// unreachable cluster (paused, or the host's IP not allowed in Atlas)
		// reports "Could not connect to any servers..." quickly.
		connectPromise = mongoose.connect(MONGODB_STRING, { serverSelectionTimeoutMS: 8000 })
			.then(() => {
				dbError = null;
			})
			.catch(error => {
				dbError = error;
				// Drop the cached promise so a later request can retry instead
				// of being stuck with the first failure forever.
				connectPromise = null;
				throw error;
			});
	}

	return connectPromise;
}

mongoose.connection.once('open', () => console.log('Now connected to MongoDB Atlas.'));

mongoose.connection.on('error', error => {
	dbError = error;
	console.error('MongoDB connection error:', error.message);
});

if (!MONGODB_STRING) {
	console.error('WARNING: MONGODB_STRING is not set - every database-backed route will return 503.');
}

// Start connecting immediately, but swallow the rejection here: it is stored in
// dbError and surfaced per-request. An uncaught rejection would exit the process.
connectDb().catch(error => console.error('Initial MongoDB connection failed:', error.message));


//[SECTION] Status routes
// These work with or without a database so the service is always diagnosable.

app.get("/", (req, res) => {

	return sendSuccess(res, 200, "Sprint Airlines API is online", {
		database: DB_STATES[mongoose.connection.readyState] || String(mongoose.connection.readyState)
	});
});

app.get("/health", (req, res) => {

	const isConnected = mongoose.connection.readyState === 1;

	return res.status(isConnected ? 200 : 503).json({
		success: isConnected,
		message: isConnected
			? "API and database are healthy"
			: "API is online but not connected to MongoDB",
		data: {
			database: DB_STATES[mongoose.connection.readyState] || String(mongoose.connection.readyState),
			databaseError: dbError ? dbError.message : null,
			mongodbStringConfigured: Boolean(MONGODB_STRING),
			jwtSecretConfigured: Boolean(process.env.JWT_SECRET_KEY),
			nodeVersion: process.version
		}
	});
});


//[SECTION] Every route below this point needs the database, so make sure the
// connection is up first (and retry once) rather than letting Mongoose queue
// the query until it times out with an opaque error.

app.use((req, res, next) => {

	if (mongoose.connection.readyState === 1) return next();

	connectDb()
		.then(() => next())
		.catch(error => sendError(
			res,
			503,
			`Database unavailable: ${error.message}`,
			"DB_UNAVAILABLE"
		));
});


app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/flights", flightRoutes);
app.use("/bookings", bookingRoutes);
app.use("/payment", paymentRoutes);
app.use("/admin", adminRoutes);
app.use("/email", emailRoutes);


//[SECTION] Fallbacks - keep unmatched routes and thrown errors in the same
// JSON envelope the frontend already parses, instead of Express' HTML output.

app.use((req, res) => sendError(res, 404, `No route matches ${req.method} ${req.originalUrl}`, "NOT_FOUND"));

app.use(errorHandler);


if(require.main === module) {

	app.listen(PORT, '0.0.0.0', () => {
		console.log(`API is now online on port ${PORT}`);
	})
}

module.exports = { app, mongoose };
