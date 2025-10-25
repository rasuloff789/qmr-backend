/**
 * QMR Backend - Environment Configuration
 *
 * Clean environment variable management with validation and defaults.
 *
 * @author QMR Development Team
 * @version 2.0.0
 */

import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * Environment Configuration
 */
const config = {
	// Server
	PORT: process.env.PORT || 4000,
	NODE_ENV: process.env.NODE_ENV || "development",

	// Database
	DATABASE_URL: process.env.DATABASE_URL,

	// JWT
	JWT_SECRET: process.env.JWT_SECRET,
	JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

	// CORS
	CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",

	// Security
	BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
};

/**
 * Validate Required Environment Variables
 */
const requiredVars = ["DATABASE_URL", "JWT_SECRET"];

for (const varName of requiredVars) {
	if (!config[varName]) {
		throw new Error(`❌ Missing required environment variable: ${varName}`);
	}
}

export default config;
