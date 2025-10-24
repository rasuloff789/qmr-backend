import bcrypt from "bcrypt";
import config from "../config/env.js";

/**
 * Hash a plain text password
 * @param {string} plainPassword - The plain text password to hash
 * @returns {Promise<string>} - The hashed password
 */
const hashPassword = async (plainPassword) => {
	try {
		const hashed = await bcrypt.hash(plainPassword, config.BCRYPT_ROUNDS);
		return hashed;
	} catch (error) {
		throw new Error("Password hashing failed");
	}
};

/**
 * Verify a plain text password against a hashed password
 * @param {string} plainPassword - The plain text password to verify
 * @param {string} hashedPassword - The hashed password to compare against
 * @returns {Promise<boolean>} - True if password matches, false otherwise
 */
const verifyPassword = async (plainPassword, hashedPassword) => {
	try {
		const isValid = await bcrypt.compare(plainPassword, hashedPassword);
		return isValid;
	} catch (error) {
		throw new Error("Password verification failed");
	}
};

/**
 * Check if a password meets security requirements
 * @param {string} password - The password to check
 * @returns {boolean} - True if password meets requirements
 */
const isPasswordSecure = (password) => {
	// Minimum 8 characters, at least one uppercase, one lowercase, one number
	const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
	return passwordRegex.test(password);
};

export { hashPassword, verifyPassword, isPasswordSecure };
