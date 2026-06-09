const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const Flight = require("../models/Flight");
const { errorHandler } = require("../utils/auth");
const { sendSuccess, sendError } = require("../utils/response");

const { nanoid } = require("nanoid"); //cryptographically random string

// Thrown inside transactions; errorHandler turns it into the standard error
// envelope. `code` is a specific machine-readable string for each case.
class HttpError extends Error {
	constructor(status, message, code) {
		super(message);
		this.status = status;
		this.code = code;
	}
}

// POST /
//-create a new booking for a selected flight
module.exports.createNewBooking = async (req, res) => {
	//body input: flight_id, seat_number, first_name, last_name, date_of_birth, passport_number
	const session = await mongoose.startSession();
	let createdBooking;
	try{
		await session.withTransaction(async() => {
			let selectedFlight = await Flight.findById(req.body.flight_id).session(session);

			if(!selectedFlight){
				throw new HttpError(404, "Flight does not exist", "FLIGHT_NOT_FOUND");
			}
			if(selectedFlight.status == "cancelled"){
				throw new HttpError(400, "Flight has been cancelled", "FLIGHT_CANCELLED");
			}

			// A user may hold multiple bookings at once, but not on flights
			// whose schedules overlap. Bookings on flights that have already
			// happened never conflict, so a past trip can't block a new one.
			const now = new Date();
			const activeBookings = await Booking.find({
				user_id: req.user.id,
				status: { $ne: "Cancelled" }
			}).select("flight_id").session(session);

			const bookedFlightIds = activeBookings
				.map(b => b.flight_id)
				.filter(Boolean);

			if(bookedFlightIds.length){
				// An existing flight conflicts if it is still upcoming AND its
				// [departure, arrival] window overlaps the selected flight's.
				// overlapStart = max(now, selected.departure) drops past flights.
				const overlapStart = new Date(Math.max(
					now.getTime(),
					new Date(selectedFlight.departure_time).getTime()
				));
				const conflict = await Flight.findOne({
					_id: { $in: bookedFlightIds },
					arrival_time: { $gt: overlapStart },
					departure_time: { $lt: selectedFlight.arrival_time }
				}).session(session);

				if(conflict){
					throw new HttpError(409, "You already have a booking on a flight that overlaps this one's schedule", "BOOKING_CONFLICT");
				}
			}

			//seat_number is optional input
			if(req.body.seat_number){
				let seat = selectedFlight.seats.find(seat => seat.seat_number == req.body.seat_number);
				let seatIndex = selectedFlight.seats.findIndex(seat => seat.seat_number == req.body.seat_number);
				if(seat == undefined){
					throw new HttpError(400, "Invalid seat number", "INVALID_SEAT");
				}
				if(seat.status != "available"){
					throw new HttpError(409, "Seat is unavailable", "SEAT_UNAVAILABLE");
				}
				seat.status = "reserved"
				selectedFlight.available_seats -= 1;
				await selectedFlight.save({ session });
			}

			let newPassenger = {
				first_name: req.body.first_name,
				last_name: req.body.last_name,
				date_of_birth: req.body.date_of_birth,
				passport_number: req.body.passport_number //do we need to hash this?
			}

			let newBooking = new Booking({
				booking_reference: `SKY-${nanoid(8).toUpperCase()}`,
				user_id: req.user.id,
				flight_id: req.body.flight_id,
				seat_number: req.body.seat_number || null,
				total_price: selectedFlight.price,
				status: "Pending",
				passenger: (req.body.first_name ? newPassenger : undefined),
				transaction: null
			})

			createdBooking = await newBooking.save({ session });
			
		});
		const populated = await Booking.findById(createdBooking._id).populate('flight_id');
		return sendSuccess(res, 201, "Booking successfully created", populated);
	} catch(error) {
		return errorHandler(error, req, res);
	} finally {
		session.endSession();
	}
}

module.exports.getExistingBookings = async (req, res) => {
	// GET /
	//-get all bookings for the logged-in user
	try{
		let userBookings = await Booking.find({ user_id: req.user.id }).populate('flight_id');
		if(userBookings.length == 0){ //should this be handled in the front-end or nah?
			return sendError(res, 404, "No bookings found", "NO_BOOKINGS");
		}
		return sendSuccess(res, 200, "Existing user bookings found", userBookings);
	} catch(error) {
		return errorHandler(error, req, res);
	}
}

module.exports.getBookingDetails = async (req, res) => {
	// GET /:id
	//-get details of a specific booking
	try{
		let userBooking = await Booking.findById(req.params.id).populate('flight_id');
		if(!userBooking){
			return sendError(res, 404, "Booking does not exist", "BOOKING_NOT_FOUND");
		}
		if(userBooking.user_id.toString() !== req.user.id && req.user.role !== "admin"){
			return sendError(res, 403, "Unauthorized to view booking", "FORBIDDEN");
		}
		return sendSuccess(res, 200, "Booking found", userBooking);
	} catch(error){
		return errorHandler(error, req, res);
	}
}

module.exports.cancelBooking = async (req, res) => {
	// PATCH /:id/cancel
	//-cancel a confirmed booking

	// Note: Using sessions here to make sure 
	// 		that committing to both Flight and Booking
	// 		collections happen at the same time
	// Only works with MongoDB Atlas, or additional mongodb setup
	// Cannot send response while inside transaction
	const session = await mongoose.startSession();
	let cancelledBooking;
	try{
		await session.withTransaction(async() => {
			let userBooking = await Booking.findById(req.params.id).session(session);
			if(!userBooking){
				throw new HttpError(404, "Booking does not exist", "BOOKING_NOT_FOUND");
			}
			if(userBooking.user_id.toString() !== req.user.id && req.user.role !== "admin"){
				throw new HttpError(403, "Unauthorized to cancel booking", "FORBIDDEN");
			}
			if(userBooking.status == "Cancelled"){
				throw new HttpError(400, "Booking already cancelled", "ALREADY_CANCELLED");
			}
			const flight = await Flight.findById(userBooking.flight_id).session(session);
			if(flight.departure_time < new Date()){
				throw new HttpError(400, "Cannot cancel a booking after departure", "FLIGHT_DEPARTED");
			}
			if(flight && userBooking.seat_number){
				const seatIndex = flight.seats.findIndex(seat => seat.seat_number === userBooking.seat_number);
				if(seatIndex !== -1){
					flight.seats[seatIndex].status = "available";
					await flight.save({ session });
				}
			}
			userBooking.status = "Cancelled";
			cancelledBooking = await userBooking.save({ session });
		})

		const populated = await Booking.findById(cancelledBooking._id).populate('flight_id');
		return sendSuccess(res, 200, "Booking cancelled successfully", populated);

	} catch(error){
		return errorHandler(error, req, res);
	} finally {
		session.endSession();
	}
}

module.exports.lookUpBookingByRef = async (req, res) => {
	// GET /ref/:ref
	//- look up a booking by its reference code
	try{
		let userBooking = await Booking.findOne({booking_reference: req.params.ref}).populate('flight_id');
		if(!userBooking){
			return sendError(res, 404, "Booking does not exist", "BOOKING_NOT_FOUND");
		}
		if(userBooking.user_id.toString() !== req.user.id && req.user.role !== "admin"){
			return sendError(res, 403, "Unauthorized to view booking", "FORBIDDEN");
		}
		return sendSuccess(res, 200, "Booking found", userBooking);
	} catch(error){
		return errorHandler(error, req, res);
	}
}

//Seats

module.exports.reserveSeat = async (req, res) => {
	// POST /:id/seat
	//-reserve a seat for an existing booking
	//body input: seat_number
	const session = await mongoose.startSession();
	let reservedBooking;
	try{
		await session.withTransaction(async() => {
			if(!req.body.seat_number){
				throw new HttpError(400, "Seat number is required", "SEAT_REQUIRED");
			}

			let userBooking = await Booking.findById(req.params.id).session(session);
			if(!userBooking){
				throw new HttpError(404, "Booking does not exist", "BOOKING_NOT_FOUND");
			}
			if(userBooking.user_id.toString() !== req.user.id && req.user.role !== "admin"){
				throw new HttpError(403, "Unauthorized to reserve seat for this user", "FORBIDDEN");
			}
			if(userBooking.status == "Cancelled"){
				throw new HttpError(400, "Cannot reserve seat on a cancelled booking", "BOOKING_CANCELLED");
			}

			const flight = await Flight.findById(userBooking.flight_id).session(session);
			if(!flight){
				throw new HttpError(404, "Flight does not exist", "FLIGHT_NOT_FOUND");
			}
			if(flight.departure_time < new Date()){
				throw new HttpError(400, "Cannot reserve seat on a departed flight", "FLIGHT_DEPARTED");
			}

			const seat = flight.seats.find(seat => seat.seat_number === req.body.seat_number);
			if(!seat){
				throw new HttpError(400, "Invalid seat number", "INVALID_SEAT");
			}
			if(seat.status !== "available"){
				throw new HttpError(409, "Seat is unavailable", "SEAT_UNAVAILABLE");
			}

			// release the booking's previously held seat, if any
			if(userBooking.seat_number){
				const oldSeat = flight.seats.find(s => s.seat_number === userBooking.seat_number);
				if(oldSeat && oldSeat.status === "reserved"){
					oldSeat.status = "available";
					flight.available_seats += 1;
				}
			}

			seat.status = "reserved";
			flight.available_seats -= 1;
			await flight.save({ session });

			userBooking.seat_number = req.body.seat_number;
			reservedBooking = await userBooking.save({ session });
		})

		const populated = await Booking.findById(reservedBooking._id).populate('flight_id');
		return sendSuccess(res, 200, "Seat reserved successfully", populated);
	} catch(error){
		return errorHandler(error, req, res);
	} finally {
		session.endSession();
	}
}

module.exports.changeOrConfirmSeat = async (req, res) => {
	// PATCH /:id/seat
	//- change or confirm the seat for a booking
	return sendError(res, 501, "Changing or confirming a seat is not implemented yet", "NOT_IMPLEMENTED");
}

module.exports.releaseSeat = async (req, res) => {
	// DELETE /:id/seat
	//-release a reserved seat back to available
	return sendError(res, 501, "Releasing a seat is not implemented yet", "NOT_IMPLEMENTED");
}





