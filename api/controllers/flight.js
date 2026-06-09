const Flight = require("../models/Flight");
const { sendSuccess, sendError } = require("../utils/response");

module.exports.searchFlights = async (req, res) => {
	// GET /
	//-search flights by origin, destination, and date
	try {
		const {origin, destination, date} = req.query

		let query = {}

		// for origin query
        if (origin) {
            query.$or = [
                { origin_city: { $regex: origin, $options: 'i' } },
                { origin_code: { $regex: origin, $options: 'i' } }
            ];
        }

        // for destination query
        if (destination) {
            // use a separate and if origin is already using or
            const destQuery = {
                $or: [
                    { destination_city: { $regex: destination, $options: 'i' } },
                    { destination_code: { $regex: destination, $options: 'i' } }
                ]
            };
            
            if (query.$or) {
                query = { $and: [ { $or: query.$or }, destQuery ] };
            } else {
                query.$or = destQuery.$or;
            }
        }

        // date query
        if (date) {
            // Build the day-window from the date's calendar parts in the
            // server's local time. Using `new Date("YYYY-MM-DD")` parses as
            // UTC midnight, which (on a non-UTC server) shifts the window by
            // the timezone offset and hides flights — so split the parts out.
            const [y, m, d] = date.split('-').map(Number);
            const startOfDay = new Date(y, m - 1, d, 0, 0, 0, 0);
            const endOfDay = new Date(y, m - 1, d, 23, 59, 59, 999);

            query.departure_time = {
                $gte: startOfDay,
                $lte: endOfDay
            };
        }

		// Exclude the heavy embedded seats[] array (not needed for a results
		// list) and cap the result size so an unfiltered query stays fast.
		const flights = await Flight.find(query)
			.select("-seats")
			.sort({ departure_time: 1 })
			.limit(100);

		return sendSuccess(res, 200, "Flights retrieved", flights);

	} catch (err) {
		console.error("Flight search error", err);
		return sendError(res, 500, "An error occurred while searching for flights: " + err.message, "FLIGHT_SEARCH_ERROR");
	}

}

module.exports.flightDetails = async (req, res) => {
	// GET /:id
	//-get full details of a specific flight
	try{
		// get specific flight and remove seat schema
		const details = await Flight.findById(req.params.id).select("-seats").lean()
		if(!details){
			return sendError(res, 404, "Flight not found", "FLIGHT_NOT_FOUND");
		}
		return sendSuccess(res, 200, "Flight details retrieved", details);
	} catch (err){
		console.error("Get flight detail error", err);
		return sendError(res, 500, "An error occurred while getting flight details: " + err.message, "FLIGHT_DETAILS_ERROR");
	}
}

module.exports.getFlightSeats = async (req, res) => {
	// GET /:id/seats
	//-Get seat map and availability for a flight
	try{
		// get specific flight
		const flight = await Flight.findById(req.params.id).lean()
		if(!flight){
			return sendError(res, 404, "Flight not found", "FLIGHT_NOT_FOUND");
		}
		// filter the seats that only have status available
		const availableSeats = flight.seats.filter(seat => seat.status === "available");
		return sendSuccess(res, 200, "Seats retrieved", {
			flight_id: flight._id,
			available_seats: flight.available_seats,
			seats: availableSeats
		});
	} catch (err){
		console.error("Get flight seats error", err);
		return sendError(res, 500, "An error occurred while getting flight seats: " + err.message, "FLIGHT_SEATS_ERROR");
	}
}

module.exports.createFlight = async (req, res) => {
	// POST /
	//-(admin) create a new flight
	try {
		// gets all details in req.body
		const flightDetails = req.body
		flightDetails.seats = [];
		// auto schema validation on .create
		const createdFlight = await Flight.create(flightDetails);

		return sendSuccess(res, 201, "Flight has been successfully created", createdFlight);
	} catch (err) {
		// flight duplicate handler
		if (err.code === 11000) {
            return sendError(res, 409, `Flight number '${req.body.flight_number}' already exists.`, "FLIGHT_NUMBER_TAKEN");
        }

        // validation handler
        if (err.name === 'ValidationError') {
            return sendError(res, 400, "Invalid data / missing required fields: " + err.message, "VALIDATION_ERROR");
        }
		console.error("Create flight error", err);
		return sendError(res, 500, "An error occurred while creating the flight: " + err.message, "FLIGHT_CREATE_ERROR");
	}
};

module.exports.updateFlight = async (req, res) => {
	// PUT /:id
	//-(admin) update all fields of a flight
	try {
		const { id } = req.params;
		const updateData = req.body;
		updateData.seats = [];

		const updatedFlight = await Flight.findByIdAndUpdate(
			id,
			updateData,
			{ new: true, runValidators: true }
		);

		if(!updatedFlight){
			return sendError(res, 404, "Flight not found", "FLIGHT_NOT_FOUND");
		}

		return sendSuccess(res, 200, "Flight updated successfully", updatedFlight);

} catch (err) {
        // handle duplicate flight number
        if (err.code === 11000) {
            return sendError(res, 409, "Flight number is already assigned to another flight.", "FLIGHT_NUMBER_TAKEN");
        }

        // validation error
        if (err.name === 'ValidationError') {
            return sendError(res, 400, "Invalid data provided for update: " + err.message, "VALIDATION_ERROR");
        }
		console.error("Update flight error", err);
		return sendError(res, 500, "An error occurred while updating the flight: " + err.message, "FLIGHT_UPDATE_ERROR");
	}
};

module.exports.deleteFlight = async (req, res) => {
	// DELETE /:id
	//-(admin) delete a flight record
	try{
		const deletedFlight = await Flight.findByIdAndDelete( req.params.id )

		if(!deletedFlight){
			return sendError(res, 404, "Flight not found", "FLIGHT_NOT_FOUND");
		}

		return sendSuccess(res, 200, "Flight has been successfully removed", deletedFlight);

	} catch (err) {
		console.error("Flight deletion error:", err);
		return sendError(res, 500, "An error occurred while deleting the flight: " + err.message, "FLIGHT_DELETE_ERROR");
	}

}

module.exports.searchAirports = async (req, res) => {
    // GET /flights/airports?q=lon
    // -autocomplete: distinct cities + IATA codes pulled from existing flights
    try {
        const q = (req.query.q || "").trim();
        if (q.length < 2) {
            return sendSuccess(res, 200, "Query too short; no airports returned", []);
        }

        const rx = new RegExp(q, "i");

        const results = await Flight.aggregate([
            {
                $project: {
                    airports: [
                        { city: "$origin_city", code: "$origin_code" },
                        { city: "$destination_city", code: "$destination_code" }
                    ]
                }
            },
            { $unwind: "$airports" },
            { $match: { $or: [ { "airports.city": rx }, { "airports.code": rx } ] } },
            { $group: { _id: "$airports.code", city: { $first: "$airports.city" } } },
            { $project: { _id: 0, code: "$_id", city: 1 } },
            { $sort: { city: 1 } },
            { $limit: 8 }
        ]);

        return sendSuccess(res, 200, "Airports retrieved", results);
    } catch (err) {
        console.error("Airport search error", err);
        return sendError(res, 500, "An error occurred while searching for airports: " + err.message, "AIRPORT_SEARCH_ERROR");
    }
};











