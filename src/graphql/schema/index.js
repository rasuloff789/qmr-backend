/**
 * QMR Backend - GraphQL Schema Aggregator
 *
 * Clean aggregation of all GraphQL schema definitions.
 *
 * @author QMR Development Team
 * @version 2.0.0
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { gql } from "graphql-tag";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load GraphQL Schema Files
 */
const loadSchemaFile = (filePath) => {
	return fs.readFileSync(path.join(__dirname, filePath), "utf8");
};

// Load all schema files
const commonTypes = loadSchemaFile("types/common.gql");
const userTypes = loadSchemaFile("types/user.gql");
const adminTypes = loadSchemaFile("types/admin.gql");
const teacherTypes = loadSchemaFile("types/teacher.gql");

const userQueries = loadSchemaFile("queries/user.gql");
const adminQueries = loadSchemaFile("queries/admin.gql");
const teacherQueries = loadSchemaFile("queries/teacher.gql");
const degreeQueries = loadSchemaFile("queries/degree.gql");

const authMutations = loadSchemaFile("mutations/auth.gql");
const adminMutations = loadSchemaFile("mutations/admin.gql");
const teacherMutations = loadSchemaFile("mutations/teacher.gql");
const degreeMutations = loadSchemaFile("mutations/degree.gql");

/**
 * Combined GraphQL Schema
 */
const schemaString = `
	${commonTypes}
	${userTypes}
	${adminTypes}
	${teacherTypes}
	${userQueries}
	${adminQueries}
	${teacherQueries}
	${degreeQueries}
	${authMutations}
	${adminMutations}
	${teacherMutations}
	${degreeMutations}
`;

export const schema = schemaString;
