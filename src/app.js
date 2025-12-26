import express from "express";
import cors from "cors";
import { createHandler } from "graphql-http/lib/use/express";
import graphqlUploadExpress from "graphql-upload/graphqlUploadExpress.mjs";
import { graphql } from "graphql";

import { schema } from "./graphql/index.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { authenticate } from "./middleware/auth.js";
import prisma from "./database/connection.js";
import config from "./config/env.js";

const app = express();
const GRAPHQL_PATH = "/graphql";

/* =========================
   CORS CONFIG
========================= */

const corsOptions = {
	origin: config.CORS_ORIGINS,
	credentials: true,
	methods: ["GET", "POST", "OPTIONS"],
	allowedHeaders: [
		"Content-Type",
		"Authorization",
		"Accept",
		"X-Requested-With",
	],
};

/* Global CORS */
app.use(cors(corsOptions));

/* IMPORTANT: Preflight */
app.options(GRAPHQL_PATH, cors(corsOptions));

/* =========================
   STATIC UPLOADS
========================= */

app.use(
	"/uploads",
	cors({ origin: "*", credentials: false }),
	express.static("uploads", {
		setHeaders: (res) => {
			res.setHeader("Access-Control-Allow-Origin", "*");
			res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
		},
	})
);

/* =========================
   HEALTH CHECK
========================= */

app.get("/health", (req, res) => {
	res.status(200).json({
		status: "OK",
		env: config.NODE_ENV,
		time: new Date().toISOString(),
	});
});

/* =========================
   GRAPHIQL (GET)
========================= */

app.get(GRAPHQL_PATH, (req, res) => {
	res.type("html").send(`<!DOCTYPE html>
<html>
<head>
  <title>GraphiQL</title>
  <link href="https://unpkg.com/graphiql@3/graphiql.min.css" rel="stylesheet" />
</head>
<body style="margin:0">
  <div id="graphiql" style="height:100vh"></div>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/graphiql@3/graphiql.min.js"></script>
  <script>
    const fetcher = GraphiQL.createFetcher({ url: '${GRAPHQL_PATH}' });
    ReactDOM.createRoot(document.getElementById('graphiql'))
      .render(React.createElement(GraphiQL, { fetcher }));
  </script>
</body>
</html>`);
});

/* =========================
   MULTIPART UPLOAD
========================= */

app.post(
	GRAPHQL_PATH,
	graphqlUploadExpress({
		maxFileSize: 10_000_000,
		maxFiles: 10,
	})
);

/* =========================
   GRAPHQL HANDLER (multipart)
========================= */

app.post(GRAPHQL_PATH, async (req, res, next) => {
	if (!req.is("multipart/form-data")) return next();

	try {
		const { query, variables, operationName } = req.body;

		let user = null;
		try {
			user = await authenticate(req);
		} catch {}

		const result = await graphql({
			schema,
			source: query,
			variableValues: variables,
			operationName,
			contextValue: { user, req, prisma },
		});

		return res.status(200).json(result);
	} catch (err) {
		return next(err);
	}
});

/* =========================
   GRAPHQL HANDLER (JSON)
========================= */

app.post(
	GRAPHQL_PATH,
	createHandler({
		schema,
		context: async (req) => {
			let user = null;
			try {
				user = await authenticate(req);
			} catch {}

			return { user, req, prisma };
		},
	})
);

/* =========================
   ERRORS
========================= */

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
