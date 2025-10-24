/**
 * QMR Backend - Database Configuration
 * 
 * Clean Prisma client setup with connection pooling and error handling.
 * 
 * @author QMR Development Team
 * @version 2.0.0
 */

import { PrismaClient } from "@prisma/client";
import config from "./env.js";

/**
 * Prisma Client Configuration
 */
const prisma = new PrismaClient({
	log: config.NODE_ENV === "development" 
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