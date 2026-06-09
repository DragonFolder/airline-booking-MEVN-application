const express = require("express");
const authController = require("../controllers/auth");
const auth = require("../utils/auth");

const Router = express.Router();

// routes
Router.post("/register", authController.registerUser);

Router.post("/login", authController.loginUser);

Router.post("/logout", auth.verify, authController.logoutUser);

Router.get("/me", auth.verify, authController.getUserProfile);

module.exports = Router;