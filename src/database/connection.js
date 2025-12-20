/**
 * QMR Backend - Database Connection
 * 
 * Clean Prisma client setup with connection pooling and error handling.
 * 
 * @author QMR Development Team
 * @version 2.0.0
 */

import { PrismaClient } from "@prisma/client";
import config from "../config/env.js";

/**
 * Build optimized DATABASE_URL with connection pool parameters
 */
const buildDatabaseUrl = () => {
	const baseUrl = config.DATABASE_URL;
	
	// Check if URL already has query parameters
	const hasQueryParams = baseUrl.includes("?");
	const separator = hasQueryParams ? "&" : "?";
	
	// Build query parameters (only add if not already present)
	let queryParams = [];
	
	if (!baseUrl.includes("connection_limit=")) {
		queryParams.push(`connection_limit=${config.DB_CONNECTION_LIMIT}`);
	}
	if (!baseUrl.includes("pool_timeout=")) {
		queryParams.push(`pool_timeout=${config.DB_POOL_TIMEOUT}`);
	}
	
	// Return URL with added parameters
	return queryParams.length > 0 
		? `${baseUrl}${separator}${queryParams.join("&")}`
		: baseUrl;
};

/**
 * Prisma Client Configuration
 */
const prisma = new PrismaClient({
	log: config.NODE_ENV === "development" 
		? ["query", "info", "warn", "error"] 
		: ["error"],
	datasources: {
		db: {
			url: buildDatabaseUrl(),
		},
	},
});

/**
 * Database Connection
 */
prisma
	.$connect()
	.then(() => {
		console.log(`✅ Database connected successfully (pool: ${config.DB_CONNECTION_LIMIT} connections)`);
	})
	.catch((error) => {
		console.error("❌ Database connection failed:", error);
		process.exit(1);
	});

/**
 * Graceful Shutdown
 */
const gracefulShutdown = async () => {
	try {
		await prisma.$disconnect();
		console.log("✅ Database disconnected successfully");
	} catch (error) {
		console.error("❌ Error disconnecting from database:", error);
	}
};

process.on("beforeExit", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
process.on("SIGTERM", gracefulShutdown);

export default prisma;
