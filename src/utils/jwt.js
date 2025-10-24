/**
 * QMR Backend - JWT Utility Functions
 * 
 * This file provides JWT (JSON Web Token) utility functions for authentication.
 * It handles token signing, verification, and decoding with proper security measures.
 * 
 * Features:
 * - Secure token signing with expiration
 * - Token verification with issuer/audience validation
 * - Error handling for invalid tokens
 * - Debug token decoding for development
 * 
 * @author QMR Development Team
 * @version 1.0.0
 */

import jwt from "jsonwebtoken";
import config from "../config/env.js";

/**
 * Sign a JWT token with user data
 * 
 * Creates a signed JWT token containing user information for authentication.
 * Includes expiration, issuer, and audience for security.
 * 
 * @param {Object} payload - User data to include in token (id, role, etc.)
 * @returns {string} - Signed JWT token
 * 
 * @example
 * const token = signToken({ id: 1, role: 'admin', username: 'john' });
 */
export function signToken(payload) {
	return jwt.sign(payload, config.JWT_SECRET, {
		expiresIn: config.JWT_EXPIRES_IN,
		issuer: "qmr-backend",
		audience: "qmr-frontend",
	});
}

/**
 * Verify a JWT token
 * 
 * Verifies and decodes a JWT token, ensuring it's valid and not expired.
 * Throws an error if the token is invalid, expired, or tampered with.
 * 
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token payload containing user data
 * @throws {Error} - If token is invalid, expired, or tampered with
 * 
 * @example
 * try {
 *   const user = verifyToken(token);
 *   console.log(user.id, user.role);
 * } catch (error) {
 *   console.log('Invalid token');
 * }
 */
export function verifyToken(token) {
	try {
		return jwt.verify(token, config.JWT_SECRET, {
			issuer: "qmr-backend",
			audience: "qmr-frontend",
		});
	} catch (error) {
		throw new Error("Invalid or expired token");
	}
}

/**
 * Decode a JWT token without verification (for debugging)
 * 
 * Decodes a JWT token without verifying its signature or expiration.
 * Use only for debugging purposes, not for authentication.
 * 
 * @param {string} token - JWT token to decode
 * @returns {Object|null} - Decoded token payload or null if invalid
 * 
 * @example
 * const payload = decodeToken(token);
 * console.log('Token payload:', payload);
 */
export function decodeToken(token) {
	try {
		return jwt.decode(token);
	} catch (error) {
		return null;
	}
}
