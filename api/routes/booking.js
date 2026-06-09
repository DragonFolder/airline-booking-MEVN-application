const express = require("express");
const bookingController = require("../controllers/booking");
const { verify } = require("../utils/auth");

const Router = express.Router();

Router.post("/", verify, bookingController.createNewBooking);

Router.get("/", verify, bookingController.getExistingBookings);

Router.get("/:id", verify, bookingController.getBookingDetails);

Router.patch("/:id/cancel", verify, bookingController.cancelBooking);

Router.get("/ref/:ref", verify, bookingController.lookUpBookingByRef);


Router.post("/:id/seat", verify, bookingController.reserveSeat);

Router.patch("/:id/seat", verify, bookingController.changeOrConfirmSeat);

Router.delete("/:id/seat", verify, bookingController.releaseSeat);

module.exports = Router;