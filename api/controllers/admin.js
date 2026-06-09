const User = require("../models/User");
const Booking = require("../models/Booking");
const { errorHandler } = require("../utils/auth");
const { sendSuccess, sendError } = require("../utils/response");

// GET /users/all
//-(admin) get all registered users
module.exports.getAllUsers = (req, res) => {
    User.find()
    .then(users => {
        if(users.length === 0){
            return sendError(res, 404, "No registered users found", "NO_USERS");
        }
        sendSuccess(res, 200, "Users retrieved", users);
    })
    .catch(error => errorHandler(error, req, res))
}
// GET /users/:id
//-(admin) get a specific user's profile
module.exports.getUser = (req, res) => {
    User.findById(req.params.id)
    .then(user => {
        if(!user){
            return sendError(res, 404, "User not found", "USER_NOT_FOUND");
        }
        sendSuccess(res, 200, "User retrieved", user);
    })
    .catch(error => errorHandler(error, req, res));
}
// PATCH /users/:id
//-(admin) update a user's role or details
module.exports.updateUser = (req, res) => {
    User.findByIdAndUpdate(req.params.id,
        {
            $set: req.body // Only updates the one in the req.body will not touch the ones not in req.body
        },
        {
            new: true, // Returns with the new docu
            runValidators: true // Runs validators of the schema
        })
    .then(user => {
        if(!user){
            return sendError(res, 404, "User not found", "USER_NOT_FOUND");
        }
        sendSuccess(res, 200, "User updated successfully", user);
    })
    .catch(error => errorHandler(error, req, res));

}
// DELETE /users/:id
//-(admin) delete a user account
module.exports.deleteUser = (req, res) => {
    User.findByIdAndDelete(req.params.id)
    .then(user => {
        if(!user){
            return sendError(res, 404, "User not found", "USER_NOT_FOUND");
        }
        sendSuccess(res, 200, "User has been successfully deleted");
    })
    .catch(error => errorHandler(error, req, res));

}
// GET /bookings
//-(admin) get all bookings across all users
module.exports.getAllBookings = (req, res) => {
    Booking.find()
    .then(bookings => {
        if(bookings.length === 0){
            return sendError(res, 404, "No bookings found", "NO_BOOKINGS");
        }
        sendSuccess(res, 200, "Bookings retrieved", bookings);
    })
    .catch(error => errorHandler(error, req, res))
}
// DELETE /bookings/:id
//-(admin) hard delete a booking record
module.exports.deleteBooking = (req, res) => {
    Booking.findByIdAndDelete(req.params.id)
    .then(booking => {
        if(!booking){
            return sendError(res, 404, "Booking not found", "BOOKING_NOT_FOUND");
        }
        sendSuccess(res, 200, "Booking has been successfully deleted");
    })
    .catch(error => errorHandler(error, req, res));

}
