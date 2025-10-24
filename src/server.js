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

const app = express();

// Create executable schema with middleware
const executableSchema = makeExecutableSchema({
	typeDefs: schema,
	resolvers,
});
const schemaWithMiddleware = applyMiddleware(executableSchema, permissions);

// CORS configuration
app.use(
	cors({
		origin: config.CORS_ORIGIN,
		credentials: true,
		methods: ["GET", "POST", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	})
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/health", (req, res) => {
	res.status(200).json({
		status: "OK",
		timestamp: new Date().toISOString(),
		environment: config.NODE_ENV,
	});
});

// GraphQL endpoint
app.use(
	"/graphql",
	graphqlHTTP(async (req) => {
		// Extract JWT token from Authorization header
		const authHeader = req.headers.authorization;
		let user = null;

		if (authHeader && authHeader.startsWith("Bearer ")) {
			const token = authHeader.split(" ")[1];
			try {
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
					: false,
		};
	})
);

// Error handling middleware
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

// 404 handler
app.use((req, res) => {
	res.status(404).json({
		error: "Not found",
		message: "The requested resource was not found",
	});
});

export default app;
