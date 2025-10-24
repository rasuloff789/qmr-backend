/**
 * QMR Backend - Environment Configuration
 * 
 * This file handles all environment variable configuration and validation.
 * It loads variables from .env file and provides default values for development.
 * 
 * Required Environment Variables:
 * - DATABASE_URL: PostgreSQL database connection string
 * - JWT_SECRET: Secret key for JWT token signing
 * 
 * Optional Environment Variables:
 * - PORT: Server port (default: 4000)
 * - NODE_ENV: Environment mode (development/production)
 * - JWT_EXPIRES_IN: JWT token expiration (default: 10d)
 * - CORS_ORIGIN: Allowed frontend origin (default: http://localhost:5173)
 * - BCRYPT_ROUNDS: Password hashing rounds (default: 10)
 * 
 * @author QMR Development Team
 * @version 1.0.0
 */

import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

/**
 * Environment Configuration Object
 * 
 * Centralized configuration for the entire application.
 * All environment variables are loaded and validated here.
 */
const config = {
	// Server configuration
	PORT: process.env.PORT || 4000,
	NODE_ENV: process.env.NODE_ENV || "development",

	// Database configuration
	DATABASE_URL: process.env.DATABASE_URL,

	// JWT configuration
	JWT_SECRET: process.env.JWT_SECRET,
	JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "10d",

	// CORS configuration
	CORS_ORIGIN: process.env.CORS_ORIGIN || "http://localhost:5173",

	// Security configuration
	BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 10,
};

/**
 * Environment Variable Validation
 * 
 * Validates that all required environment variables are present.
 * Throws errors if critical variables are missing.
 */
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];

for (const envVar of requiredEnvVars) {
	if (!config[envVar]) {
		throw new Error(`Missing required environment variable: ${envVar}`);
	}
}

export default config;
