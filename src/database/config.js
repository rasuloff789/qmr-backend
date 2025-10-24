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
 */
export const databaseConfig = {
	url: config.DATABASE_URL,
	environment: config.NODE_ENV,
	
	// Connection pool settings
	pool: {
		min: 2,
		max: 10,
		acquireTimeoutMillis: 30000,
		createTimeoutMillis: 30000,
		destroyTimeoutMillis: 5000,
		idleTimeoutMillis: 30000,
		reapIntervalMillis: 1000,
		createRetryIntervalMillis: 200,
	},
	
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
