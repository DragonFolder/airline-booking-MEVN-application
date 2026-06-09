const express = require("express");
const emailController = require("../controllers/email");
const { verify } = require("../utils/auth");

const Router = express.Router();

Router.post("/confirmation", verify, emailController.sendConfirmationEmail);

Router.post("/resend/:id", verify, emailController.resendConfirmationEmail);

module.exports = Router;