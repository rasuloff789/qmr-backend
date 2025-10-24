/**
 * QMR Backend - Password Utilities
 * 
 * This file provides secure password hashing and verification functions using bcrypt.
 * Moved to auth subdirectory for better organization.
 * 
 * @author QMR Development Team
 * @version 1.0.0
 */

import bcrypt from "bcrypt";
import config from "../../config/env.js";

/**
 * Hash a plain text password
 * 
 * Securely hashes a plain text password using bcrypt with configurable salt rounds.
 * Uses the BCRYPT_ROUNDS environment variable for salt rounds.
 * 
 * @param {string} plainPassword - The plain text password to hash
 * @returns {Promise<string>} - The hashed password
 * @throws {Error} - If hashing fails
 * 
 * @example
 * const hashedPassword = await hashPassword('myPassword123');
 * console.log(hashedPassword); // '$2b$10$...'
 */
export const hashPassword = async (plainPassword) => {
	try {
		const hashed = await bcrypt.hash(plainPassword, config.BCRYPT_ROUNDS);
		return hashed;
	} catch (error) {
		throw new Error("Password hashing failed");
	}
};

/**
 * Verify a plain text password against a hashed password
 * 
 * Compares a plain text password against a hashed password to verify authentication.
 * Uses bcrypt's secure comparison function to prevent timing attacks.
 * 
 * @param {string} plainPassword - The plain text password to verify
 * @param {string} hashedPassword - The hashed password to compare against
 * @returns {Promise<boolean>} - True if password matches, false otherwise
 * @throws {Error} - If verification fails
 * 
 * @example
 * const isValid = await verifyPassword('myPassword123', hashedPassword);
 * if (isValid) {
 *   console.log('Password is correct');
 * }
 */
export const verifyPassword = async (plainPassword, hashedPassword) => {
	try {
		const isValid = await bcrypt.compare(plainPassword, hashedPassword);
		return isValid;
	} catch (error) {
		throw new Error("Password verification failed");
	}
};

/**
 * Check if a password meets security requirements
 * 
 * Validates password strength based on common security requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - Optional special characters
 * 
 * @param {string} password - The password to check
 * @returns {boolean} - True if password meets requirements
 * 
 * @example
 * if (isPasswordSecure('MyPassword123')) {
 *   console.log('Password is secure');
 * } else {
 *   console.log('Password is too weak');
 * }
 */
export const isPasswordSecure = (password) => {
	// Minimum 8 characters, at least one uppercase, one lowercase, one number
	const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
	return passwordRegex.test(password);
};
