const Booking = require("../models/Booking");
const { errorHandler } = require("../utils/auth");
const { sendSuccess, sendError } = require("../utils/response");

module.exports.processAndConfirmBooking = async (req, res) => {
	// POST /:bookingId
	//- process a mock payment and confirm a booking
	try {
		const { bookingId }  = req.params;
		const { id } = req.user;
		// accept { transaction: { amount, card_last_four, payment_status? } } or flat fields
		const transactionInput = req.body.transaction || req.body;
		const amount = transactionInput.amount;
		const card_last_four = transactionInput.card_last_four;

		// Mock payment gateway: cards ending in 0000 are declined. The result
		// is decided here on the server, not trusted from the client.
		const isDeclined = String(card_last_four) === '0000';

		if(isDeclined){
			// Record the declined attempt but leave the booking unconfirmed
			// (status stays Pending) so the user can retry with another card.
			const declined = await Booking.findOneAndUpdate(
				{ _id: bookingId, user_id: id },
				{
					$set: {
						transaction: {
							amount: amount,
							card_last_four: card_last_four,
							payment_status: 'declined',
							created_at: new Date()
						}
					}
				},
				{ new: true, runValidators: true }
			);

			if(!declined){
				return sendError(res, 404, "Booking not found or you are not authorized to pay for it", "BOOKING_NOT_FOUND");
			}
			return sendError(res, 402, "Payment declined. Please try a different card.", "PAYMENT_DECLINED");
		}

		const updated = await Booking.findOneAndUpdate(
			{ _id: bookingId, user_id: id },
			{
				$set: {
					transaction: {
						amount: amount,
						card_last_four: card_last_four,
						payment_status: 'approved',
						created_at: new Date()
					},
					status: 'Confirmed'
				}
			},
			{ new: true, runValidators: true }
		);

		if(!updated){
			return sendError(res, 404, "Booking not found or you are not authorized to pay for it", "BOOKING_NOT_FOUND");
		}

		const populated = await Booking.findById(updated._id).populate('flight_id');

		return sendSuccess(res, 200, "Booking confirmed", populated);

	} catch (err) {
		console.error("Process payment error", err);
		return sendError(res, 500, "An error occurred while processing the payment: " + err.message, "PAYMENT_PROCESS_ERROR");
	}
}

module.exports.getBookingTransaction = async (req, res) => {
	// GET /:bookingId
	//- get transaction record for a booking
	try{
		const { bookingId } = req.params
		const { id, role } = req.user
		const booking = await Booking.findById(bookingId);

		if(!booking){
			return sendError(res, 404, "Booking not found", "BOOKING_NOT_FOUND");
		}

		const isOwner = booking.user_id.toString() === id.toString();
		const isAdmin = role === "admin";

		// if user is not owner and also not admin access denied
		if(!isOwner && !isAdmin){
			return sendError(res, 403, "You are not authorized to access this booking", "FORBIDDEN");
		}

		const bookingTransaction = booking.transaction
		if(bookingTransaction === null){
			return sendError(res, 404, "Payment information not yet available. Please complete your payment to confirm this booking", "NO_TRANSACTION");
		}

		return sendSuccess(res, 200, "Booking transaction found", bookingTransaction);

	} catch (err){
		console.error("Get booking transaction error", err);
		return sendError(res, 500, "An error occurred while retrieving the transaction: " + err.message, "TRANSACTION_FETCH_ERROR");
	}
}


