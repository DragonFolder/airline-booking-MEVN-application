const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
	{
		full_name: {
			type: String,
			required: [true, 'Full name is required'],
	      	trim: true 
		},
		email: {
			type: String,
			required: [true, 'Email is required'],
			unique: true,
			lowercase: true,
			trim: true,
			match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
		},
		password_hash: {
			type: String,
			required: [true, 'Password is required'],
			minlength: [8, 'Password must be at least 8 characters'],
			select: false, // never returned in queries by default
		},
		role: {
			type: String,
			enum: ['user', 'admin'],
			default: 'user'
		}
	},
	{
	  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
	}
);

module.exports = mongoose.model('User', userSchema);