/**
 * QMR Backend - Authentication Middleware
 *
 * Clean JWT authentication with proper error handling.
 * Validates token and auto-expires old tokens if password was changed.
 *
 * @author QMR Development Team
 * @version 2.0.0
 */

import { verifyToken } from "../utils/auth/jwt.js";
import { ERROR_MESSAGES } from "../constants/messages.js";
import { prisma } from "../database/index.js";

/**
 * Authentication Middleware
 * Validates JWT token and checks if password hash matches database
 * This ensures old tokens automatically expire when a user changes their password
 */
export const authenticate = async (req) => {
	// Authentication function: Extracts JWT from Authorization header, verifies it, and attaches user to request
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return null;
	}

	const token = authHeader.split(" ")[1];
	let decoded;
	try {
		decoded = verifyToken(token);
	} catch (error) {
		throw new Error(ERROR_MESSAGES.INVALID_TOKEN);
	}

	// Validate password hash from token against database
	// This ensures old tokens expire when password is changed
	if (!decoded.id || !decoded.role || !decoded.passwordHash) {
		return null;
	}

	try {
		let user = null;
		const userId = parseInt(decoded.id);

		// Get user from database based on role
		if (decoded.role === "root") {
			user = await prisma.root.findUnique({
				where: { id: userId },
				select: {
					id: true,
					username: true,
					fullname: true,
					password: true,
					createdAt: true,
				},
			});
		} else if (decoded.role === "admin") {
			user = await prisma.admin.findUnique({
				where: { id: userId, isActive: true, isDeleted: false },
				select: {
					id: true,
					username: true,
					fullname: true,
					password: true,
					isActive: true,
					createdAt: true,
				},
			});
		} else if (decoded.role === "teacher") {
			user = await prisma.teacher.findUnique({
				where: { id: userId },
				select: {
					id: true,
					username: true,
					fullname: true,
					password: true,
					isActive: true,
					createdAt: true,
				},
			});

			// Check if teacher is active
			if (user && !user.isActive) {
				return null;
			}
		}

		// User not found
		if (!user) {
			return null;
		}

		// Compare password hash from token with database
		// If they don't match, the password was changed and token is invalid
		if (user.password !== decoded.passwordHash) {
			return null;
		}

		// Password hash matches - token is valid
		// Return user object with role for context
		const userData = {
			id: decoded.id,
			role: decoded.role,
			username: decoded.username,
			passwordHash: decoded.passwordHash,
		};

		req.user = userData;
		return userData;
	} catch (error) {
		console.error("Authentication error:", error);
		return null;
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
