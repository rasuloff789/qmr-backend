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
 * Request Logging Middleware
 */
app.use((req, res, next) => {
	console.log("🌐 Incoming Request:", {
		method: req.method,
		url: req.url,
		origin: req.headers.origin,
		userAgent: req.headers["user-agent"],
		contentType: req.headers["content-type"],
		timestamp: new Date().toISOString(),
	});
	next();
});

/**
 * CORS Configuration
 */
app.use(
	cors({
		origin: (origin, callback) => {
			console.log("🔒 CORS Check:", {
				origin: origin,
				allowedOrigins:
					config.NODE_ENV === "development"
						? [
								config.CORS_ORIGIN,
								"http://localhost:3000",
								"http://localhost:5173",
						  ]
						: config.CORS_ORIGIN,
				nodeEnv: config.NODE_ENV,
			});

			const allowedOrigins =
				config.NODE_ENV === "development"
					? [
							config.CORS_ORIGIN,
							"http://localhost:3000",
							"http://localhost:5173",
					  ]
					: config.CORS_ORIGIN;

			// Allow requests with no origin (like mobile apps or curl requests)
			if (!origin) return callback(null, true);

			if (allowedOrigins.includes(origin)) {
				console.log("✅ CORS: Origin allowed");
				return callback(null, true);
			} else {
				console.log("❌ CORS: Origin blocked");
				return callback(new Error("Not allowed by CORS"));
			}
		},
		credentials: true,
		methods: ["GET", "POST", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		optionsSuccessStatus: 200, // For legacy browser support
	})
);

/**
 * Body Parsing Middleware
 * Skip multipart/form-data to let graphql-upload handle it
 */
app.use((req, res, next) => {
	if (req.headers["content-type"]?.includes("multipart/form-data")) {
		console.log("📤 Skipping body parsing for multipart request");
		next();
	} else {
		express.json({ limit: "10mb" })(req, res, next);
	}
});

app.use((req, res, next) => {
	if (req.headers["content-type"]?.includes("multipart/form-data")) {
		next();
	} else {
		express.urlencoded({ extended: true, limit: "10mb" })(req, res, next);
	}
});

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
 * Frontend Debug Endpoint
 */
app.get("/debug", (req, res) => {
	res.status(200).json({
		message: "Frontend debug endpoint working",
		origin: req.headers.origin,
		userAgent: req.headers["user-agent"],
		timestamp: new Date().toISOString(),
		cors: {
			allowedOrigins: config.NODE_ENV === "development" 
				? [config.CORS_ORIGIN, "http://localhost:3000", "http://localhost:5173"]
				: config.CORS_ORIGIN,
			nodeEnv: config.NODE_ENV
		}
	});
});

/**
 * GraphQL Test Endpoint (Simple)
 */
app.post("/graphql-test", (req, res) => {
	res.status(200).json({
		message: "GraphQL test endpoint working",
		body: req.body,
		headers: {
			contentType: req.headers["content-type"],
			origin: req.headers.origin,
			authorization: req.headers.authorization ? "Present" : "Missing"
		},
		timestamp: new Date().toISOString(),
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
			console.log("🔍 GraphQL Request Details:", {
				method: req.method,
				url: req.url,
				headers: {
					authorization: req.headers?.authorization
						? "Bearer token present"
						: "No auth",
					contentType: req.headers["content-type"],
					origin: req.headers.origin,
					userAgent: req.headers["user-agent"],
				},
				timestamp: new Date().toISOString(),
			});

			const authHeader = req.headers?.authorization;
			let user = null;

			if (authHeader && authHeader.startsWith("Bearer ")) {
				const token = authHeader.split(" ")[1];
				try {
					const { verifyToken } = await import("./utils/auth/jwt.js");
					user = verifyToken(token);
				} catch (error) {}
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
