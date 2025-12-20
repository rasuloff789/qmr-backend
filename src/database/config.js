/**
 * QMR Backend - Database Configuration
 * 
 * Database-specific configuration and utilities.
 * 
 * @author QMR Development Team
 * @version 2.0.0
 */

import config from "../config/env.js";

/**
 * Database Configuration
 * 
 * Note: Prisma manages its own connection pool via DATABASE_URL query parameters.
 * Pool settings are configured in src/database/connection.js using:
 * - connection_limit: Maximum number of connections (default: 5)
 * - pool_timeout: Connection timeout in seconds (default: 10)
 */
export const databaseConfig = {
	url: config.DATABASE_URL,
	environment: config.NODE_ENV,
	connectionLimit: config.DB_CONNECTION_LIMIT,
	poolTimeout: config.DB_POOL_TIMEOUT,
	
	// Logging configuration
	logging: {
		development: ["query", "info", "warn", "error"],
		production: ["error"],
	},
};

/**
 * Database Health Check
 */
export const checkDatabaseHealth = async (prisma) => {
	try {
		await prisma.$queryRaw`SELECT 1`;
		return { status: "healthy", timestamp: new Date().toISOString() };
	} catch (error) {
		return { 
			status: "unhealthy", 
			error: error.message, 
			timestamp: new Date().toISOString() 
		};
	}
};

/**
 * Database Utilities
 */
export const databaseUtils = {
	/**
	 * Safe database operation wrapper
	 */
	async safeOperation(operation, errorMessage = "Database operation failed") {
		try {
			return await operation();
		} catch (error) {
			console.error("Database error:", error);
			throw new Error(errorMessage);
		}
	},
	
	/**
	 * Transaction wrapper
	 */
	async transaction(prisma, operations) {
		return await prisma.$transaction(operations);
	},
	
	/**
	 * Connection test
	 */
	async testConnection(prisma) {
		return await prisma.$queryRaw`SELECT 1 as test`;
	}
};
