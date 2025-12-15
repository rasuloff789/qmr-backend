import express from "express";
import cors from "cors";
import { createHandler } from "graphql-http/lib/use/express";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
import { graphql } from "graphql";
import { schema } from "./graphql/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import config from "./config/env.js";
import { authenticate } from "./middleware/auth.js";
import prisma from "./database/connection.js";

const app = express();
const GRAPHQL_PATH = "/graphql";

/**
 * Generate GraphiQL HTML page
 * @param {string} endpoint - GraphQL endpoint path
 * @returns {string} HTML string
 */
const getGraphiQLHtml = (endpoint) => {
	return `<!DOCTYPE html>
<html>
<head>
	<title>GraphiQL</title>
	<link href="https://unpkg.com/graphiql@3/graphiql.min.css" rel="stylesheet" />
</head>
<body style="margin: 0;">
	<div id="graphiql" style="height: 100vh;"></div>
	<script
		crossorigin
		src="https://unpkg.com/react@18/umd/react.production.min.js"
	></script>
	<script
		crossorigin
		src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"
	></script>
	<script
		crossorigin
		src="https://unpkg.com/graphiql@3/graphiql.min.js"
	></script>
	<script>
		const fetcher = GraphiQL.createFetcher({
			url: '${endpoint}',
		});
		const root = ReactDOM.createRoot(document.getElementById('graphiql'));
		root.render(React.createElement(GraphiQL, { fetcher }));
	</script>
</body>
</html>`;
};

// CORS Configuration - Open for everyone
app.use(
	cors({
		origin: [
			"https://admin.elli.uz",
			"https://root.elli.uz",
			"https://teacher.elli.uz",
			"https://qomar.elli.uz",
			"https://studio.apollographql.com",
			"http://localhost:5173",
			"localhost:5173",
			"http://localhost:5174",
			"localhost:5174",
		],
		credentials: true,
		methods: ["GET", "POST", "OPTIONS"],
		allowedHeaders: [
			"Content-Type",
			"Authorization",
			// Add headers needed for multipart requests
			"Accept",
			"X-Requested-With",
		],
		exposedHeaders: ["Content-Type"],
		optionsSuccessStatus: 200,
	})
);

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

// GraphiQL Playground (GET requests)
app.get(GRAPHQL_PATH, (req, res) => {
	res.setHeader("Content-Type", "text/html");
	res.send(getGraphiQLHtml(GRAPHQL_PATH));
});

// Body parsing configuration for GraphQL endpoint
// For JSON requests: let graphql-http handle parsing (it reads the stream itself)
// For multipart requests: let graphql-upload handle parsing
app.use(GRAPHQL_PATH, (req, res, next) => {
	if (req.is("multipart/form-data")) {
		// Let graphql-upload handle multipart parsing
		return next();
	}
	// For JSON requests, graphql-http will read the body stream itself
	// No need to parse here
	next();
});

// GraphQL Upload Middleware (only for multipart/form-data requests)
app.post(GRAPHQL_PATH, (req, res, next) => {
	// Only apply graphql-upload middleware for multipart requests
	// Skip for JSON requests to avoid 415 errors
	if (req.is("multipart/form-data")) {
		return graphqlUploadExpress({ maxFileSize: 10_000_000, maxFiles: 10 })(
			req,
			res,
			(err) => {
				if (err) {
					const contentType = req.headers["content-type"];
					const message = err?.message || "Failed to process multipart request";
					const lower = String(message).toLowerCase();
					let hint =
						"Ensure you're using GraphQL multipart request spec: FormData with 'operations' + 'map' + file fields, and do not set Content-Type manually (let the client add the boundary).";

					if (lower.includes("boundary") && lower.includes("not found")) {
						hint =
							"Your request is missing the multipart boundary. This almost always happens when you manually set `Content-Type: multipart/form-data`. Remove it and let axios/fetch set it.";
					} else if (
						lower.includes("missing multipart field") &&
						(lower.includes("operations") || lower.includes("map"))
					) {
						hint =
							"Your FormData is missing required fields. It must include 'operations' (JSON string), 'map' (JSON string), and then the file field(s) referenced by 'map'.";
					} else if (lower.includes("invalid json")) {
						hint =
							"One of your multipart fields contains invalid JSON. 'operations' and 'map' must be valid JSON strings.";
					}

					console.error("Upload middleware error:", {
						message,
						contentType,
					});

					return res.status(415).json({
						error: "Unsupported Media Type",
						message: "Failed to process multipart request",
						details: message,
						hint,
					});
				}
				next();
			}
		);
	}

	// Skip upload middleware for non-multipart requests
	next();
});

// Multipart GraphQL handler (graphql-http rejects multipart/form-data with 415)
// Must run AFTER graphqlUploadExpress has parsed the multipart request.
app.post(GRAPHQL_PATH, async (req, res, next) => {
	if (!req.is("multipart/form-data")) return next();

	try {
		const { query, variables, operationName } = req.body || {};
		if (!query || typeof query !== "string") {
			return res.status(400).json({
				error: "Bad Request",
				message: "Missing GraphQL 'query' in multipart operations",
			});
		}

		// Reuse the same context shape used by graphql-http handler
		let user = null;
		try {
			user = await authenticate(req);
		} catch {
			user = null;
		}

		const result = await graphql({
			schema,
			source: query,
			variableValues:
				variables && typeof variables === "object" ? variables : undefined,
			operationName:
				typeof operationName === "string" ? operationName : undefined,
			contextValue: { user, req, prisma },
		});

		return res.status(200).json(result);
	} catch (err) {
		return next(err);
	}
});

// GraphQL Endpoint (POST requests)
app.post(
	GRAPHQL_PATH,
	createHandler({
		schema: schema,
		context: async (req, params) => {
			let user = null;
			try {
				user = await authenticate(req);
			} catch (error) {
				// You may want to log or handle authentication errors, but do not expose details to context
				user = null;
			}
			return {
				user,
				req,
				prisma,
			};
		},
	})
);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
