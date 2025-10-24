/**
 * QMR Backend - Password Utilities
 * 
 * Clean password hashing and validation with security best practices.
 * 
 * @author QMR Development Team
 * @version 2.0.0
 */

import bcrypt from "bcrypt";
import config from "../../config/env.js";

/**
 * Hash Password
 */
export const hashPassword = async (password) => {
	try {
		return await bcrypt.hash(password, config.BCRYPT_ROUNDS);
	} catch (error) {
		throw new Error("Password hashing failed");
	}
};

/**
 * Verify Password
 */
export const verifyPassword = async (password, hashedPassword) => {
	try {
		return await bcrypt.compare(password, hashedPassword);
	} catch (error) {
		throw new Error("Password verification failed");
	}
};

/**
 * Check Password Strength
 */
export const isPasswordSecure = (password) => {
	const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
	return passwordRegex.test(password);
};