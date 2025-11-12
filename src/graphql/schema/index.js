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
const studentTypes = loadSchemaFile("types/student.gql");
const dashboardTypes = loadSchemaFile("types/dashboard.gql");
const courseTypes = loadSchemaFile("types/course.gql");

const userQueries = loadSchemaFile("queries/user.gql");
const adminQueries = loadSchemaFile("queries/admin.gql");
const teacherQueries = loadSchemaFile("queries/teacher.gql");
const studentQueries = loadSchemaFile("queries/student.gql");
const degreeQueries = loadSchemaFile("queries/degree.gql");
const courseQueries = loadSchemaFile("queries/course.gql");
const dashboardQueries = loadSchemaFile("queries/dashboard.gql");

const authMutations = loadSchemaFile("mutations/auth.gql");
const adminMutations = loadSchemaFile("mutations/admin.gql");
const teacherMutations = loadSchemaFile("mutations/teacher.gql");
const studentMutations = loadSchemaFile("mutations/student.gql");
const degreeMutations = loadSchemaFile("mutations/degree.gql");
const courseMutations = loadSchemaFile("mutations/course.gql");

/**
 * Combined GraphQL Schema
 */
const schemaString = `
	${commonTypes}
	${userTypes}
	${adminTypes}
	${teacherTypes}
	${studentTypes}
	${dashboardTypes}
	${courseTypes}
	${userQueries}
	${adminQueries}
	${teacherQueries}
	${studentQueries}
	${degreeQueries}
	${courseQueries}
	${dashboardQueries}
	${authMutations}
	${adminMutations}
	${teacherMutations}
	${studentMutations}
	${degreeMutations}
	${courseMutations}
`;

export const schema = schemaString;
