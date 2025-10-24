/**
 * QMR Backend - Main Entry Point
 * 
 * This is the main entry point for the QMR (Quality Management System) backend API.
 * It starts the Express server with GraphQL endpoint and handles graceful shutdown.
 * 
 * Features:
 * - GraphQL API with authentication
 * - Support for Root, Admin, and Teacher user types
 * - Role-based access control
 * - Database integration with Prisma
 * - Health check endpoint
 * - Graceful shutdown handling
 * 
 * @author QMR Development Team
 * @version 1.0.0
 */

import app from "./server.js";
import config from "./config/env.js";

// Get port from environment configuration
const PORT = config.PORT;

/**
 * Start the Express server
 * 
 * The server provides:
 * - GraphQL endpoint at /graphql
 * - Health check at /health
 * - Debug endpoint at /debug (development only)
 */
const server = app.listen(PORT, () => {
	console.log(`🚀 Server running at http://localhost:${PORT}/graphql`);
	console.log(`📊 Health check: http://localhost:${PORT}/health`);
	console.log(`🌍 Environment: ${config.NODE_ENV}`);
});

/**
 * Graceful shutdown handlers
 * 
 * These handlers ensure the server shuts down cleanly when receiving
 * termination signals, closing database connections and stopping the server properly.
 */

// Handle SIGTERM signal (used by process managers like PM2)
process.on("SIGTERM", () => {
	console.log("SIGTERM received, shutting down gracefully");
	server.close(() => {
		console.log("Process terminated");
		process.exit(0);
	});
});

// Handle SIGINT signal (Ctrl+C)
process.on("SIGINT", () => {
	console.log("SIGINT received, shutting down gracefully");
	server.close(() => {
		console.log("Process terminated");
		process.exit(0);
	});
});
