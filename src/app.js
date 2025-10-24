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
import { makeExecutableSchema } from "@graphql-tools/schema";
import { applyMiddleware } from "graphql-middleware";

// Core imports
import { schema } from "./graphql/schema/index.js";
import resolvers from "./modules/index.js";
import { permissions } from "./permissions/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import config from "./config/env.js";

/**
 * Create Express Application
 */
const app = express();

/**
 * GraphQL Schema Setup
 */
const executableSchema = makeExecutableSchema({
	typeDefs: schema,
	resolvers,
});
const schemaWithMiddleware = applyMiddleware(executableSchema, permissions);

/**
 * CORS Configuration
 */
app.use(
	cors({
		origin: config.NODE_ENV === "development" 
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
 * Health Check Endpoint
 */
app.get("/health", (req, res) => {
	res.status(200).json({
		status: "OK",
		timestamp: new Date().toISOString(),
		environment: config.NODE_ENV,
		version: "2.0.0"
	});
});

/**
 * GraphQL Endpoint
 */
app.use(
	"/graphql",
	graphqlHTTP(async (req) => {
		const authHeader = req.headers.authorization;
		let user = null;

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
			graphiql: config.NODE_ENV === "development" ? {
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
}`
			} : false,
		};
	})
);

/**
 * Error Handling
 */
app.use(notFoundHandler);
app.use(errorHandler);

export default app;