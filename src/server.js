import express from "express";
import cors from "cors";
import { graphqlHTTP } from "express-graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { applyMiddleware } from "graphql-middleware";
import { schema } from "./schema/index.js";
import resolvers from "./modules/index.js";
import { verifyToken } from "./utils/jwt.js";
import { permissions } from "./permissions/index.js";

const app = express();

const executableSchema = makeExecutableSchema({ typeDefs: schema, resolvers });
const schemaWithMiddleware = applyMiddleware(executableSchema, permissions);

app.use(
	cors({
		origin: "http://localhost:5173", // Frontend porti
		credentials: true, // Agar token yoki cookie ishlatsang
	})
);

app.use(express.json());

app.use(
	"/graphql",
	graphqlHTTP(async (req) => {
		// JWTdan user olish
		const token = req.headers.authorization?.split(" ")[1];
		let user = null;

		if (token) {
			try {
				user = verifyToken(token);
			} catch (err) {}
		}

		return {
			schema: schemaWithMiddleware,
			context: { user },
			graphiql: { headerEditorEnabled: true },
		};
	})
);

export default app;
