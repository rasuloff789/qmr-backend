/**
 * QMR Backend - Error Handling Middleware
 * 
 * This file provides centralized error handling for the application.
 * Handles different types of errors and provides appropriate responses.
 * 
 * @author QMR Development Team
 * @version 1.0.0
 */

import { ERROR_MESSAGES } from "../constants/messages.js";

/**
 * Global Error Handler
 * 
 * Catches and handles all unhandled errors in the application.
 * Provides appropriate error responses based on error type.
 * 
 * @param {Error} error - The error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export const errorHandler = (error, req, res, next) => {
	console.error("Error:", error);

	// Default error response
	let statusCode = 500;
	let message = ERROR_MESSAGES.INTERNAL_ERROR;

	// Handle specific error types
	if (error.name === "ValidationError") {
		statusCode = 400;
		message = ERROR_MESSAGES.VALIDATION_ERROR;
	} else if (error.name === "UnauthorizedError") {
		statusCode = 401;
		message = ERROR_MESSAGES.UNAUTHORIZED;
	} else if (error.name === "ForbiddenError") {
		statusCode = 403;
		message = ERROR_MESSAGES.FORBIDDEN;
	} else if (error.name === "NotFoundError") {
		statusCode = 404;
		message = ERROR_MESSAGES.USER_NOT_FOUND;
	} else if (error.name === "ConflictError") {
		statusCode = 409;
		message = ERROR_MESSAGES.USER_ALREADY_EXISTS;
	}

	// Send error response
	res.status(statusCode).json({
		success: false,
		message: message,
		...(process.env.NODE_ENV === "development" && {
			error: error.message,
			stack: error.stack
		})
	});
};

/**
 * 404 Not Found Handler
 * 
 * Handles requests to non-existent routes.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export const notFoundHandler = (req, res, next) => {
	res.status(404).json({
		success: false,
		message: `Route ${req.method} ${req.originalUrl} not found`
	});
};
