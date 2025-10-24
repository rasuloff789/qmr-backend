/**
 * QMR Backend - Database Configuration
 * 
 * This file configures the Prisma database client with connection pooling,
 * logging, and graceful shutdown handling.
 * 
 * Features:
 * - Connection pooling for better performance
 * - Environment-based logging configuration
 * - Graceful shutdown handling
 * - Error handling and connection monitoring
 * 
 * @author QMR Development Team
 * @version 1.0.0
 */

import { PrismaClient } from "@prisma/client";
import config from "./env.js";

/**
 * Prisma Client Configuration
 * 
 * Creates a new Prisma client instance with optimized settings:
 * - Development: Full logging for debugging
 * - Production: Error-only logging for performance
 * - Connection pooling: Automatic connection management
 */
const prisma = new PrismaClient({
	log:
		config.NODE_ENV === "development"
			? ["query", "info", "warn", "error"]
			: ["error"],
	datasources: {
		db: {
			url: config.DATABASE_URL,
		},
	},
});

/**
 * Database Connection
 * 
 * Establishes connection to the PostgreSQL database.
 * Handles connection errors and provides feedback.
 */
prisma
	.$connect()
	.then(() => {
		console.log("✅ Database connected successfully");
	})
	.catch((error) => {
		console.error("❌ Database connection failed:", error);
		process.exit(1);
	});

/**
 * Graceful Shutdown Handlers
 * 
 * Ensures database connections are properly closed when the application
 * is terminated, preventing connection leaks and ensuring data integrity.
 */

// Handle normal application exit
process.on("beforeExit", async () => {
	await prisma.$disconnect();
});

// Handle SIGINT (Ctrl+C)
process.on("SIGINT", async () => {
	await prisma.$disconnect();
	process.exit(0);
});

// Handle SIGTERM (process manager termination)
process.on("SIGTERM", async () => {
	await prisma.$disconnect();
	process.exit(0);
});

// Export the configured Prisma client
export default prisma;
