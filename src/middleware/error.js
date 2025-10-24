/**
 * QMR Backend - Error Handling Middleware
 * 
 * Clean, centralized error handling with proper logging and responses.
 * 
 * @author QMR Development Team
 * @version 2.0.0
 */

import { ERROR_MESSAGES } from "../constants/messages.js";

/**
 * Global Error Handler
 */
export const errorHandler = (error, req, res, next) => {
	console.error("❌ Server Error:", {
		message: error.message,
		stack: error.stack,
		url: req.url,
		method: req.method,
		timestamp: new Date().toISOString()
	});

	let statusCode = 500;
	let message = ERROR_MESSAGES.INTERNAL_ERROR;

	// Handle specific error types
	switch (error.name) {
		case "ValidationError":
			statusCode = 400;
			message = ERROR_MESSAGES.VALIDATION_ERROR;
			break;
		case "UnauthorizedError":
			statusCode = 401;
			message = ERROR_MESSAGES.UNAUTHORIZED;
			break;
		case "ForbiddenError":
			statusCode = 403;
			message = ERROR_MESSAGES.FORBIDDEN;
			break;
		case "NotFoundError":
			statusCode = 404;
			message = ERROR_MESSAGES.USER_NOT_FOUND;
			break;
		case "ConflictError":
			statusCode = 409;
			message = ERROR_MESSAGES.USER_ALREADY_EXISTS;
			break;
		default:
			statusCode = 500;
			message = ERROR_MESSAGES.INTERNAL_ERROR;
	}

	res.status(statusCode).json({
		success: false,
		message,
		...(process.env.NODE_ENV === "development" && {
			error: error.message,
			stack: error.stack
		})
	});
};

/**
 * 404 Not Found Handler
 */
export const notFoundHandler = (req, res) => {
	res.status(404).json({
		success: false,
		message: `Route ${req.method} ${req.originalUrl} not found`
	});
};