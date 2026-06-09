const User = require("../models/User");
const Blacklist = require("../models/Blacklist");
const bcrypt = require("bcryptjs");
const auth = require("../utils/auth");
const { errorHandler } = require("../utils/auth");
const { sendSuccess, sendError } = require("../utils/response");

// POST /register
//-register new account
module.exports.registerUser = (req, res) => {

    if(!req.body.full_name || !req.body.email || !req.body.password){
        return sendError(res, 400, "Please fill in all input fields", "MISSING_FIELDS");
    }


    let newUser = new User({
        full_name: req.body.full_name,
        email : req.body.email,
        password_hash: req.body.password
    })

    newUser.password_hash = bcrypt.hashSync(newUser.password_hash, 10)

    User.findOne({ email: req.body.email})
    .then(existingEmail => {
        if(existingEmail){
            return sendError(res, 409, "An account already exists with this email", "EMAIL_TAKEN");
        } else {
            return newUser.save()
            .then((result) => {

                // To display the result to user without showing their password
                const userResponse = result.toObject();
                delete userResponse.password_hash;

                sendSuccess(res, 201, "Account created successfully", userResponse);
            })
            .catch(error => errorHandler(error, req, res))
        }
    })
        
}

// POST /login
//-login and receive session token
module.exports.loginUser = (req, res) => {
                                                    // added this because I cant get the hash normally
    return User.findOne({ email: req.body.email }).select('+password_hash')
    .then(result => {

        if(result == null){
            return sendError(res, 404, "No account found with that email", "EMAIL_NOT_FOUND");
        } else {
            // comparing hashed password in database to password in req.body
            const isPasswordCorrect = bcrypt.compareSync(req.body.password, result.password_hash);

            if(isPasswordCorrect){
                // creating access token from ../utils/auth.js
                return sendSuccess(res, 200, "Login successful", { access: auth.createAccessToken(result) });
            } else {
                return sendError(res, 401, "Incorrect password", "WRONG_PASSWORD");
            }
        }
    })
    .catch(error => errorHandler(error, req, res));
};

// POST /logout
//-invalidate the session token
module.exports.logoutUser = (req, res) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return sendError(res, 400, "Authorization header missing", "NO_TOKEN");
    }

    const token = authHeader.split(" ")[1];

    // save token in blacklist collection
    Blacklist.create({ token: token })
        .then(() => {
            sendSuccess(res, 200, "Logged out successfully");
        })
        .catch(error => {
            sendError(res, 500, "Logout failed: " + error.message, "LOGOUT_FAILED");
        });
};

// GET /me
//- get currently authenticatd user's profile
module.exports.getUserProfile = (req, res) => {
    // grab the id from the verify method
    const userId = req.user.id; 

    // find user in the database
    User.findById(userId)
        .then(user => {
            if (!user) {
                return sendError(res, 404, "User not found", "USER_NOT_FOUND");
            }
            // send user data back (password is undefined in case we use it for changing password in the future)
            user.password_hash = undefined;
            sendSuccess(res, 200, "User profile retrieved", user);
        })
        .catch(error => errorHandler(error, req, res))
};