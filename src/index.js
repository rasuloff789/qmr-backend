/**
 * QMR Backend - Application Entry Point
 * 
 * Clean entry point with proper server startup, graceful shutdown,
 * and comprehensive error handling.
 * 
 * @author QMR Development Team
 * @version 2.0.0
 */

import app from "./app.js";
import config from "./config/env.js";

const PORT = config.PORT;

/**
 * Start Server
 */
const server = app.listen(PORT, () => {
	console.log(`🚀 QMR Backend Server`);
	console.log(`📍 GraphQL: http://localhost:${PORT}/graphql`);
	console.log(`🏥 Health: http://localhost:${PORT}/health`);
	console.log(`🌍 Environment: ${config.NODE_ENV}`);
	console.log(`📦 Version: 2.0.0`);
});

/**
 * Graceful Shutdown Handlers
 */
const gracefulShutdown = (signal) => {
	console.log(`\n${signal} received. Shutting down gracefully...`);
	
	server.close(() => {
		console.log("✅ Server closed successfully");
		process.exit(0);
	});
	
	// Force close after 10 seconds
	setTimeout(() => {
		console.error("❌ Forced shutdown");
		process.exit(1);
	}, 10000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

/**
 * Unhandled Error Handling
 */
process.on("uncaughtException", (error) => {
	console.error("❌ Uncaught Exception:", error);
	process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
	console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
	process.exit(1);
});