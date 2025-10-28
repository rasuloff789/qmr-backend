import express from "express";
import cors from "cors";
import { ApolloServer } from "@apollo/server";
import { startStandaloneServer } from "@apollo/server/standalone";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
import { schema } from "./graphql/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import config from "./config/env.js";
import { initializeBot, stopBot } from "./utils/telegram/bot.js";

const app = express();

// Initialize Telegram Bot
const telegramBot = initializeBot();
if (!telegramBot) {
	console.warn("⚠️ Telegram bot initialization failed");
}

// Graceful shutdown
process.on("SIGINT", () => {
	console.log("\n🛑 Shutting down gracefully...");
	stopBot();
	process.exit(0);
});

process.on("SIGTERM", () => {
	console.log("\n🛑 Shutting down gracefully...");
	stopBot();
	process.exit(0);
});

// CORS Configuration
app.use(
	cors({
		origin:
			config.NODE_ENV === "development"
				? [config.CORS_ORIGIN, "http://localhost:3000", "http://localhost:5173"]
				: config.CORS_ORIGIN,
		credentials: true,
		methods: ["GET", "POST", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		optionsSuccessStatus: 200,
	})
);

// Body Parsing Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// GraphQL Upload Middleware
app.use(
	"/graphql",
	graphqlUploadExpress({ maxFileSize: 10_000_000, maxFiles: 10 })
);

// Static file serving
app.use("/uploads", express.static("uploads"));

// Health Check
app.get("/health", (req, res) => {
	res.status(200).json({
		status: "OK",
		timestamp: new Date().toISOString(),
		environment: config.NODE_ENV,
		version: "2.0.0",
	});
});

// Initialize Apollo Server
const server = new ApolloServer({
	schema: schema,
	csrfPrevention: false, // Disable CSRF for file uploads
	formatError: (error) => {
		if (config.NODE_ENV === "development") {
			console.error("❌ GraphQL Error:", {
				message: error.message,
				locations: error.locations,
				path: error.path,
			});
		}
		return error;
	},
});

// Apollo Server will be started by startStandaloneServer

// Start the standalone Apollo Server with custom context and CORS
const { url } = await startStandaloneServer(server, {
	listen: { port: 4000 },
	context: async ({ req }) => {
		const authHeader = req.headers?.authorization;
		let user = null;

		if (authHeader && authHeader.startsWith("Bearer ")) {
			const token = authHeader.split(" ")[1];
			try {
				const { verifyToken } = await import("./utils/auth/jwt.js");
				user = verifyToken(token);
			} catch (error) {
				console.warn("❌ Invalid token:", error.message);
			}
		}

		return { user };
	},
	// Configure CORS for Apollo Server
	cors: {
		origin: (origin, callback) => {
			const allowedOrigins = config.NODE_ENV === "development"
				? [config.CORS_ORIGIN, "http://localhost:3000", "http://localhost:5173"]
				: [config.CORS_ORIGIN];

			// Allow requests with no origin (like mobile apps or curl requests)
			if (!origin) return callback(null, true);

			if (allowedOrigins.includes(origin)) {
				return callback(null, true);
			} else {
				return callback(new Error("Not allowed by CORS"));
			}
		},
		credentials: true,
		methods: ["GET", "POST", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		optionsSuccessStatus: 200,
	},
});

console.log(`🚀 Apollo Server ready at ${url}`);
console.log(`🏥 Health: http://localhost:4000/health`);
console.log(`🌍 Environment: ${config.NODE_ENV}`);
console.log(`📦 Version: 2.0.0`);

export default app;
