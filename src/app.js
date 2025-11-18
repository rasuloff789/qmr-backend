import express from "express";
import cors from "cors";
import { createHandler } from "graphql-http/lib/use/express";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
import { schema } from "./graphql/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import config from "./config/env.js";
import { verifyToken } from "./utils/auth/jwt.js";

const app = express();

// CORS Configuration - Open for everyone
app.use(
	cors({
		origin: "*",
		credentials: false,
		methods: ["GET", "POST", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
		optionsSuccessStatus: 200,
	})
);

// Static file serving for uploaded files with permissive CORS and caching
app.use(
	"/uploads",
	cors({ origin: true, credentials: false }),
	express.static("uploads", {
		setHeaders: (res, _path) => {
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
			res.setHeader(
				"Access-Control-Allow-Headers",
				"Content-Type, Authorization"
			);
			// Cache images aggressively; adjust if needed
			res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
		},
	})
);

// Health Check
app.get("/health", (req, res) => {
	res.status(200).json({
		status: "OK",
		timestamp: new Date().toISOString(),
		environment: config.NODE_ENV,
		version: "2.0.0",
	});
});

// GraphQL Upload Middleware (single instance)
app.use(
	"/graphql",
	graphqlUploadExpress({ maxFileSize: 10_000_000, maxFiles: 10 })
);

// GraphQL Endpoint
app.all(
	"/graphql",
	createHandler({
		schema: schema,
		context: async (req, params) => {
			const authHeader =
				req.headers?.authorization || req.headers?.Authorization;
			let user = null;

			if (authHeader && authHeader.startsWith("Bearer ")) {
				const token = authHeader.split(" ")[1];
				try {
					user = verifyToken(token);
				} catch (error) {
					console.warn("❌ Invalid token:", error.message);
				}
			}

			return { user };
		},
		graphiql: config.NODE_ENV === "development",
	})
);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
