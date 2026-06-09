const Booking = require("../models/Booking");
const { errorHandler } = require("../utils/auth");
const { sendError } = require("../utils/response");

module.exports.sendConfirmationEmail = (req, res) => {
	// POST /confirmation
	//-send a booking confirmation email to the user
	return sendError(res, 501, "Sending confirmation emails is not implemented yet", "NOT_IMPLEMENTED");
}

module.exports.resendConfirmationEmail = (req, res) => {
	//POST /resend/:id
	//-resend a confirmation email for a booking
	return sendError(res, 501, "Resending confirmation emails is not implemented yet", "NOT_IMPLEMENTED");
}
