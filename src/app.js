import express from "express";
import cors from "cors";
import { graphqlHTTP } from "express-graphql";
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

// GraphQL Endpoint
app.use(
	"/graphql",
	graphqlHTTP(async (req) => {
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

		return {
			schema: schema,
			context: { user },
			graphiql: config.NODE_ENV === "development",
		};
	})
);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
