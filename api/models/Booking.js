const mongoose = require('mongoose');

const passengerSchema = new mongoose.Schema(
	{
		first_name: {
			type: String,
			required: [true, 'First name is required'],
			trim: true
		},
		last_name: {
			type: String,
			required: [true, 'Last name is required'],
			trim: true
		},
		date_of_birth: {
			type: Date,
			required: [true, 'Date of birth is required'],
			validate: {
			  validator: function (v) {
			    return v < new Date();
			  },
			  message: 'Date of birth must be in the past',
			}
		},
		passport_number: {
			type: String,
			required: [true, 'Passport or ID number is required'],
			trim: true,
			uppercase: true
		}
	},
	{ _id: false }
);

const transactionSchema = new mongoose.Schema(
	{
		amount: {
			type: Number,
			required: true,
			min: [0, 'Transaction amount cannot be negative']
		},
		card_last_four: {
			type: String,
			required: true,
			minlength: 4,
			maxlength: 4,
			match: [/^\d{4}$/, 'card_last_four must be exactly 4 digits']
		},
		payment_status: {
			type: String,
			enum: ['pending', 'approved', 'declined'],
			default: 'pending'
		},
		created_at: {
			type: Date,
			default: Date.now
		}
	},
	{ _id: false }
);

const bookingSchema = new mongoose.Schema(
	{
		booking_reference: {
			type: String,
			required: true,
			unique: true,
			uppercase: true,
			trim: true
		},
		user_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: [true, 'User reference is required']
		},
		flight_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Flight',
			required: [true, 'Flight reference is required']
		},
		seat_number: {
			type: String,
			trim: true,
			uppercase: true,
			default: null, // null until seat is selected or auto-assigned
		},
		total_price: {
			type: Number,
			required: true,
			min: [0, 'Total price cannot be negative']
		},
		status: {
			type: String,
			enum: ["Pending", "Confirmed", "Cancelled"]
		},
		passenger: passengerSchema,
		transaction: {
			type: transactionSchema,
			default: null, // null until payment is attempted
		}
	},
	{
		timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
	}
);

module.exports = mongoose.model('Booking', bookingSchema);