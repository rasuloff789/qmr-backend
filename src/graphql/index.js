/**
 * QMR Backend - GraphQL Module Aggregator
 *
 * Centralized GraphQL module that combines schema, resolvers, and permissions.
 * This provides a clean interface for the main application.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { makeExecutableSchema } from "@graphql-tools/schema";
import { applyMiddleware } from "graphql-middleware";
import { shield } from "graphql-shield";

// Import existing modules
import { schema } from "./schema/index.js";
import { resolvers } from "./resolvers/index.js";
import { permissions } from "../permissions/index.js";

/**
 * Create executable GraphQL schema
 */
const executableSchema = makeExecutableSchema({
	typeDefs: schema,
	resolvers,
});

/**
 * Apply GraphQL Shield middleware for permissions
 */
const schemaWithPermissions = applyMiddleware(executableSchema, permissions);

/**
 * Export the complete GraphQL setup
 */
export { schemaWithPermissions as schema, executableSchema, permissions };

export default schemaWithPermissions;
