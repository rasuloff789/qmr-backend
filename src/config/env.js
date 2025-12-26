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

const parseBoolean = (value) => {
	if (value === undefined) return undefined;
	return ["true", "1", "yes", "on"].includes(String(value).toLowerCase());
};

/**
 * Environment Configuration
 */
const config = {
	// Server
	PORT: process.env.PORT || 4000,
	NODE_ENV: process.env.NODE_ENV || "development",

	// Database
	DATABASE_URL: process.env.DATABASE_URL,
	DB_CONNECTION_LIMIT: parseInt(process.env.DB_CONNECTION_LIMIT) || 5,
	DB_POOL_TIMEOUT: parseInt(process.env.DB_POOL_TIMEOUT) || 10,

	// JWT
	JWT_SECRET: process.env.JWT_SECRET,
	JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

	// CORS
	// Support comma-separated origins or single origin
	CORS_ORIGINS: process.env.CORS_ORIGINS
		? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
		: [
				"https://admin.elli.uz",
				"https://root.elli.uz",
				"https://teacher.elli.uz",
				"https://qomar.elli.uz",
				"https://studio.apollographql.com",
				"http://localhost:5173",
				"http://localhost:5174",
			],

	// GraphiQL
	GRAPHIQL_ENABLED: parseBoolean(process.env.GRAPHIQL_ENABLED),

	// Telegram Bot
	TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,

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
