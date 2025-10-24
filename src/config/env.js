import dotenv from "dotenv";

// Load environment variables
dotenv.config();

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

	// Security
	BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 10,
};

// Validate required environment variables
const requiredEnvVars = ["DATABASE_URL", "JWT_SECRET"];

for (const envVar of requiredEnvVars) {
	if (!config[envVar]) {
		throw new Error(`Missing required environment variable: ${envVar}`);
	}
}

export default config;
