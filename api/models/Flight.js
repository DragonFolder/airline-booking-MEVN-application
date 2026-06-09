const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema(
	{
		seat_number: {
			type: String,
			required: true
		},
		row: {
			type: Number,
			required: true
		},
		column: {
			type: String,
			required: true,
			enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L']
		},
		class: {
			type: String,
			required: true,
			enum: ['Economy', 'Business', 'First']
		},
		status: {
			type: String,
			enum: ['available', 'reserved', 'taken'],
			default: 'available'
		}

	},
	{ _id: false } //no separate _id for subdocument
);

const flightSchema = new mongoose.Schema(
	{
		flight_number: {
			type: String,
			required: [true, 'Flight number is required'],
			uppercase: true,
			trim: true,
			unique: true
		},
		airline: {
			type: String,
		    required: [true, 'Airline name is required'],
		    trim: true
		},
		origin_code: {
			type: String,
			required: [true, 'Origin IATA code is required'],
			uppercase: true,
			trim: true,
			minlength: 3,
			maxlength: 3
		},
		origin_city: {
			type: String,
		    required: true,
		    trim: true
		},
		destination_code: {
			type: String,
			required: [true, 'Destination IATA code is required'],
			uppercase: true,
			trim: true,
			minlength: 3,
			maxlength: 3
		},
		destination_city: {
			type: String,
			required: true,
			trim: true
		},
		departure_time: {
			type: Date,
			required: [true, 'Departure time is required'],
			validate: {
			  validator: function (v) {
			    return v > new Date();
			  },
			  message: 'Departure time must be in the future',
			}
		},
		arrival_time: {
			type: Date,
			required: [true, 'Arrival time is required'],
			validate: {
			  validator: function (v) {
			    return v > this.departure_time;
			  },
			  message: 'Arrival time must be after departure time'
			}
		},
		duration_minutes: {
			type: Number,
			required: true,
			min: [1, 'Duration must be at least 1 minute']
		},
		stops: {
			type: Number,
			default: 0,
			min: 0
		},
		cabin_class: {
			type: String,
			required: true,
			enum: ['Economy', 'Business', 'First']
		},
		price: {
			type: Number,
			required: [true, 'Price is required'],
			min: [0, 'Price cannot be negative']
		},
		total_seats: {
			type: Number,
			required: true,
			min: 1
		},
		available_seats: {
			type: Number,
			required: true,
			min: 0
		},
		status: {
			type: String,
			enum: ['scheduled', 'cancelled'],
			default: 'scheduled'
		},
		seats: [seatSchema]
	},
	{
		timestamps: { createdAt: 'created_at', updatedAt: 'updated_at'}
	}
);

module.exports = mongoose.model('Flight', flightSchema);