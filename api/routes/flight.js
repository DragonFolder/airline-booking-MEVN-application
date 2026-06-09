const express = require("express");
const flightController = require("../controllers/flight");
const { verify, verifyAdmin } = require("../utils/auth");

const Router = express.Router();

Router.get("/", flightController.searchFlights);

Router.get("/airports", flightController.searchAirports);

Router.get("/:id", flightController.flightDetails);

Router.get("/:id/seats", flightController.getFlightSeats);

//admin flight routes

Router.post("/", verify, verifyAdmin, flightController.createFlight);

Router.patch("/:id", verify, verifyAdmin, flightController.updateFlight);

Router.delete("/:id", verify, verifyAdmin, flightController.deleteFlight);



module.exports = Router;