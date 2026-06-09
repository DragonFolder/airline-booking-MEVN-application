// Standard API response envelope, used by every controller and middleware so
// the frontend can rely on a single, predictable shape:
//
//   success: { success: true,  message, data }
//   error:   { success: false, message, errorCode }
//
// This helper ONLY fixes the JSON shape. The message and errorCode are always
// passed in by the caller so each response stays specific to where it came
// from — there are no generic/centralized error messages.

function sendSuccess(res, statusCode, message, data = null) {
	return res.status(statusCode).json({
		success: true,
		message,
		data,
	});
}

function sendError(res, statusCode, message, errorCode) {
	return res.status(statusCode).json({
		success: false,
		message,
		errorCode,
	});
}

module.exports = { sendSuccess, sendError };
