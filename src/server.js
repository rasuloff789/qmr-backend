/**
 * QMR Backend - Express Server Configuration
 *
 * This file configures the Express server with all middleware, routes, and GraphQL setup.
 * It handles CORS, authentication, GraphQL endpoint, and error handling.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import express from "express";
import cors from "cors";
import { graphqlHTTP } from "express-graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { applyMiddleware } from "graphql-middleware";
import { schema } from "./schema/index.js";
import resolvers from "./modules/index.js";
import { verifyToken } from "./utils/jwt.js";
import { permissions } from "./permissions/index.js";
import config from "./config/env.js";

// Initialize Express application
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
		origin: config.CORS_ORIGIN, // Allowed frontend origin
		credentials: true, // Allow cookies and authentication headers
		methods: ["GET", "POST", "OPTIONS"], // Allowed HTTP methods
		allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
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
	});
});

/**
 * Debug Endpoint (Development Only)
 *
 * Provides debugging information for development purposes.
 * Logs request details to help troubleshoot API issues.
 */
app.post("/debug", (req, res) => {
	console.log("Debug request received:");
	console.log("Headers:", req.headers);
	console.log("Body:", req.body);
	console.log("Query:", req.query);

	res.status(200).json({
		message: "Debug endpoint working",
		received: {
			headers: req.headers,
			body: req.body,
			query: req.query,
		},
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
				user = verifyToken(token);
			} catch (error) {
				console.warn("Invalid token:", error.message);
			}
		}

		return {
			schema: schemaWithMiddleware, // Schema with permission middleware
			context: { user }, // Inject user context into resolvers
			graphiql:
				config.NODE_ENV === "development"
					? {
							headerEditorEnabled: true,
							defaultQuery: `# Welcome to QMR Backend GraphQL API
# Try this query to test authentication:

query Me {
  me {
    ... on Root {
      id
      username
      fullname
      createdAt
    }
    ... on Admin {
      id
      username
      fullname
      birthDate
      phone
      tgUsername
      isActive
      createdAt
    }
  }
}`,
					  }
					: false, // Disable GraphiQL in production
		};
	})
);

/**
 * Global Error Handling Middleware
 *
 * Catches and handles all unhandled errors in the application.
 * Provides appropriate error responses based on environment.
 */
app.use((error, req, res, next) => {
	console.error("Server error:", error);
	res.status(500).json({
		error: "Internal server error",
		message:
			config.NODE_ENV === "development"
				? error.message
				: "Something went wrong",
	});
});

/**
 * 404 Not Found Handler
 *
 * Handles all requests that don't match any defined routes.
 * Returns a standardized 404 response.
 */
app.use((req, res) => {
	res.status(404).json({
		error: "Not found",
		message: "The requested resource was not found",
	});
});

// Export the configured Express app
export default app;
