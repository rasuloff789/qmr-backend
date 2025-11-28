import express from "express";
import cors from "cors";
import { createHandler } from "graphql-http/lib/use/express";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
import { schema } from "./graphql/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import config from "./config/env.js";
import { authenticate } from "./middleware/auth.js";
import prisma from "./database/connection.js"

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

// GraphiQL Playground (GET requests)
app.get(GRAPHQL_PATH, (req, res) => {
	res.setHeader("Content-Type", "text/html");
	res.send(getGraphiQLHtml(GRAPHQL_PATH));
});

// GraphQL Upload Middleware (only for POST requests)
app.post(
	GRAPHQL_PATH,
	graphqlUploadExpress({ maxFileSize: 10_000_000, maxFiles: 10 })
);

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
