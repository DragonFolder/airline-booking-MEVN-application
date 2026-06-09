require('dotenv').config();
const jwt = require("jsonwebtoken");
const Blacklist = require("../models/Blacklist");
const User = require("../models/User")
const { sendError } = require("./response");

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'dev-secret-change-me';



module.exports.createAccessToken = (user) => {


    const data = {

        id: user._id,
        email: user.email,
        role: user.role

    };
                            //sample expiry time {expiresIn: '1h', '10m', '7d'}
    return jwt.sign(data, JWT_SECRET, {});

}

module.exports.verify = (req, res, next) => {

    let headerToken = req.headers.authorization;

    if(!headerToken) {
        return sendError(res, 401, "No authorization token provided", "NO_TOKEN");
    } else {

        const token = req.headers.authorization.split(" ")[1];

        jwt.verify(token, JWT_SECRET, (err, decodedToken) => {
            if (err) {
                return sendError(res, 403, "Invalid authorization token", "INVALID_TOKEN");
            }

            // Check blacklist if blacklisted return 401 status
            Blacklist.findOne({ token: token })
                .then(isBlacklisted => {
                    if (isBlacklisted) {
                        return sendError(res, 401, "Token is no longer valid (already logged out)", "TOKEN_REVOKED");
                    }
                    // If token not in blacklist proceed to next
                    req.user = decodedToken;
                    next();
                })
                .catch(error => errorHandler(error, req, res));
        });
    }
};

module.exports.verifyAdmin = (req, res, next) => {
    // check if user exists and if user is admin
    if(req.user && req.user.role === 'admin'){
        next()
    } else {
        // check the database if not found in token
        const userId = req.user.id;

        User.findById(userId)
        .then(user => {
            // check if user exists and if they are admin
            if(!user || user.role !== 'admin'){
                return sendError(res, 403, "Action forbidden: admin access required", "ADMIN_REQUIRED");
            }

            // if user is admin
            next();
        })
        .catch(error => errorHandler(error, req, res))
    }
}

function errorHandler(err, req, res, next) {

    console.error(err);

    // Keep the thrown error's own message/status/code so the response stays
    // specific to wherever it was raised (e.g. an HttpError from a controller).
    const statusCode = err.status || 500;
    return sendError(res, statusCode, err.message, err.code);
}

module.exports.errorHandler = errorHandler;