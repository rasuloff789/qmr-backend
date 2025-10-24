/**
 * QMR Backend - Authentication Middleware
 * 
 * Clean JWT authentication with proper error handling.
 * 
 * @author QMR Development Team
 * @version 2.0.0
 */

import { verifyToken } from "../utils/auth/jwt.js";
import { ERROR_MESSAGES } from "../constants/messages.js";

/**
 * Authentication Middleware
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