/**
 * QMR Backend - JWT Utilities
 * 
 * Clean JWT token management with proper security measures.
 * 
 * @author QMR Development Team
 * @version 2.0.0
 */

import jwt from "jsonwebtoken";
import config from "../../config/env.js";

/**
 * Sign JWT Token
 */
export const signToken = (payload) => {
	return jwt.sign(payload, config.JWT_SECRET, {
		expiresIn: config.JWT_EXPIRES_IN,
		issuer: "qmr-backend",
		audience: "qmr-frontend",
	});
};

/**
 * Verify JWT Token
 */
export const verifyToken = (token) => {
	try {
		return jwt.verify(token, config.JWT_SECRET, {
			issuer: "qmr-backend",
			audience: "qmr-frontend",
		});
	} catch (error) {
		throw new Error("Invalid or expired token");
	}
};

/**
 * Decode JWT Token (for debugging)
 */
export const decodeToken = (token) => {
	try {
		return jwt.decode(token);
	} catch (error) {
		return null;
	}
};