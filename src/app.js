/**
 * QMR Backend - Express Application Setup
 * 
 * This file configures the Express application with all middleware,
 * routes, and error handling. Optimized structure for better maintainability.
 * 
 * @author QMR Development Team
 * @version 1.0.0
 */

import express from "express";
import cors from "cors";
import { graphqlHTTP } from "express-graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { applyMiddleware } from "graphql-middleware";

// Import optimized modules
import { schema } from "./graphql/schema/index.js";
import resolvers from "./modules/index.js";
import { permissions } from "./permissions/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import config from "./config/env.js";

/**
 * Create Express Application
 * 
 * Initializes the Express application with optimized configuration.
 */
const app = express();

/**
 * GraphQL Schema Setup
 * 
 * Creates an executable GraphQL schema by combining type definitions and resolvers,
 * then applies permission middleware for role-based access control.
 */
const executableSchema = makeExecutableSchema({
	typeDefs: schema,
	resolvers,
});
const schemaWithMiddleware = applyMiddleware(executableSchema, permissions);

/**
 * CORS Configuration
 * 
 * Configures Cross-Origin Resource Sharing to allow frontend applications
 * to communicate with this backend API.
 */
app.use(
	cors({
		origin: config.CORS_ORIGIN,
		credentials: true,
		methods: ["GET", "POST", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	})
);

/**
 * Body Parsing Middleware
 * 
 * Parses incoming request bodies as JSON and URL-encoded data.
 * Set with reasonable limits to prevent abuse.
 */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/**
 * Health Check Endpoint
 * 
 * Provides a simple health check endpoint for monitoring and load balancers.
 * Returns server status, timestamp, and environment information.
 */
app.get("/health", (req, res) => {
	res.status(200).json({
		status: "OK",
		timestamp: new Date().toISOString(),
		environment: config.NODE_ENV,
		version: "1.0.0"
	});
});

/**
 * GraphQL Endpoint
 * 
 * Main GraphQL endpoint that handles all GraphQL queries and mutations.
 * Includes JWT authentication, context injection, and GraphiQL interface.
 */
app.use(
	"/graphql",
	graphqlHTTP(async (req) => {
		// Extract JWT token from Authorization header
		const authHeader = req.headers.authorization;
		let user = null;

		// Parse Bearer token for authentication
		if (authHeader && authHeader.startsWith("Bearer ")) {
			const token = authHeader.split(" ")[1];
			try {
				const { verifyToken } = await import("./utils/auth/jwt.js");
				user = verifyToken(token);
			} catch (error) {
				console.warn("Invalid token:", error.message);
			}
		}

		return {
			schema: schemaWithMiddleware,
			context: { user },
			graphiql:
				config.NODE_ENV === "development"
					? {
							headerEditorEnabled: true,
							defaultQuery: `# Welcome to QMR Backend GraphQL API
# Try this query to test authentication:

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
	})
);

/**
 * Error Handling Middleware
 * 
 * Must be after all routes to catch any unhandled errors.
 */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
