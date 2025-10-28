/**
 * QMR Backend - Express Application
 *
 * Clean, optimized Express application setup with proper middleware,
 * GraphQL configuration, and error handling.
 *
 * @author QMR Development Team
 * @version 2.0.0
 */

import express from "express";
import cors from "cors";
import { graphqlHTTP } from "express-graphql";
import graphqlUploadExpress from "../node_modules/graphql-upload/graphqlUploadExpress.mjs";
// Core imports
import { schema } from "./graphql/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import config from "./config/env.js";
// Initialize Telegram bot
import { initializeBot, stopBot } from "./utils/telegram/bot.js";

/**
 * Create Express Application
 */
const app = express();

/**
 * Initialize Telegram Bot
 */
const telegramBot = initializeBot();
if (!telegramBot) {
	console.warn(
		"⚠️ Telegram bot initialization failed - bot features will not be available"
	);
}

/**
 * Graceful shutdown handling
 */
process.on("SIGINT", () => {
	console.log("\n🛑 Received SIGINT, shutting down gracefully...");
	stopBot();
	process.exit(0);
});

process.on("SIGTERM", () => {
	console.log("\n🛑 Received SIGTERM, shutting down gracefully...");
	stopBot();
	process.exit(0);
});

/**
 * GraphQL Schema Setup
 * Schema is already configured with permissions in the graphql module
 */

/**
 * CORS Configuration
 */
app.use(
	cors({
		origin:
			config.NODE_ENV === "development"
				? [config.CORS_ORIGIN, "http://localhost:3000", "http://localhost:5173"]
				: config.CORS_ORIGIN,
		credentials: true,
		methods: ["GET", "POST", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		optionsSuccessStatus: 200, // For legacy browser support
	})
);

/**
 * Body Parsing Middleware
 */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/**
 * Static file serving for uploaded images
 */
app.use("/uploads", express.static("uploads"));

/**
 * Health Check Endpoint
 */
app.get("/health", (req, res) => {
	res.status(200).json({
		status: "OK",
		timestamp: new Date().toISOString(),
		environment: config.NODE_ENV,
		version: "2.0.0",
	});
});


/**
 * File Upload Middleware for GraphQL
 * Must be placed before the GraphQL endpoint
 */
try {
	app.use(
		"/graphql",
		graphqlUploadExpress({
			maxFileSize: 10000000, // 10MB
			maxFiles: 10,
		})
	);
} catch (error) {
	throw error;
}

/**
 * GraphQL Endpoint with enhanced error handling
 */
app.use(
	"/graphql",
	graphqlHTTP(async (req) => {
		try {

			const authHeader = req.headers?.authorization;
			let user = null;

			if (authHeader && authHeader.startsWith("Bearer ")) {
				const token = authHeader.split(" ")[1];
				try {
					const { verifyToken } = await import("./utils/auth/jwt.js");
					user = verifyToken(token);
				} catch (error) {
				}
			}



			const graphqlConfig = {
				schema: schema, // Using the centralized schema
				context: { user },
				graphiql:
					config.NODE_ENV === "development"
						? {
								headerEditorEnabled: true,
								defaultQuery: `# QMR Backend GraphQL API
query Me {
  me {
    id
    username
    fullname
    role
    createdAt
  }
}`,
						  }
						: false,
			};

			// Add response logging
			if (config.NODE_ENV === "development") {
				graphqlConfig.customFormatErrorFn = (error) => {
					console.error("❌ GraphQL Error:", {
						message: error.message,
						locations: error.locations,
						path: error.path,
						stack: error.stack,
					});
					return error;
				};
			}

			return graphqlConfig;
		} catch (error) {
			console.error("❌ GraphQL Endpoint Error:", {
				message: error.message,
				stack: error.stack,
				url: req?.url || "unknown",
				method: req?.method || "unknown",
				timestamp: new Date().toISOString(),
				errorType: error.constructor.name,
			});


			// Return a basic GraphQL schema to prevent complete failure
			return {
				schema: schema,
				context: { user: null },
				graphiql: false,
			};
		}
	})
);

/**
 * Error Handling
 */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
