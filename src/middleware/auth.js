/**
 * QMR Backend - Authentication Middleware
 * 
 * This file provides authentication middleware for protecting routes.
 * Handles JWT token verification and user context injection.
 * 
 * @author QMR Development Team
 * @version 1.0.0
 */

import { verifyToken } from "../utils/auth/jwt.js";
import { ERROR_MESSAGES } from "../constants/messages.js";

/**
 * Authentication Middleware
 * 
 * Verifies JWT token and injects user context into request.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export const authenticate = (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		
		if (!authHeader || !authHeader.startsWith("Bearer ")) {
			return res.status(401).json({
				success: false,
				message: ERROR_MESSAGES.UNAUTHORIZED
			});
		}

		const token = authHeader.split(" ")[1];
		const user = verifyToken(token);
		
		// Inject user into request context
		req.user = user;
		next();
	} catch (error) {
		return res.status(401).json({
			success: false,
			message: ERROR_MESSAGES.INVALID_TOKEN
		});
	}
};

/**
 * Optional Authentication Middleware
 * 
 * Verifies JWT token if present, but doesn't require it.
 * Useful for routes that work with or without authentication.
 * 
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export const optionalAuth = (req, res, next) => {
	try {
		const authHeader = req.headers.authorization;
		
		if (authHeader && authHeader.startsWith("Bearer ")) {
			const token = authHeader.split(" ")[1];
			const user = verifyToken(token);
			req.user = user;
		}
		
		next();
	} catch (error) {
		// Continue without authentication
		next();
	}
};
