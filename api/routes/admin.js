const express = require("express");
const adminController = require("../controllers/admin");
const auth = require("../utils/auth");

const Router = express.Router();

// routes

Router.get("/users/all", auth.verify, auth.verifyAdmin, adminController.getAllUsers);

Router.get("/users/:id", auth.verify, auth.verifyAdmin, adminController.getUser);

Router.patch("/users/:id", auth.verify, auth.verifyAdmin, adminController.updateUser);

Router.delete("/users/:id", auth.verify, auth.verifyAdmin, adminController.deleteUser);

Router.get("/bookings", auth.verify, auth.verifyAdmin, adminController.getAllBookings);

Router.delete("/bookings/:id", auth.verify, auth.verifyAdmin, adminController.deleteBooking);



module.exports = Router;