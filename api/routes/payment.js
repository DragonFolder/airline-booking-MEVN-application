const express = require("express");
const paymentController = require("../controllers/payment");
const { verify } = require("../utils/auth");

const Router = express.Router();

Router.post("/:bookingId", verify, paymentController.processAndConfirmBooking);

Router.get("/:bookingId", verify, paymentController.getBookingTransaction);

module.exports = Router;