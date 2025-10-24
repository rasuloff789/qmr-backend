/**
 * QMR Backend - GraphQL Schema Aggregator
 * 
 * This file aggregates all GraphQL schema definitions into a single schema.
 * Organized by domain for better maintainability and scalability.
 * 
 * @author QMR Development Team
 * @version 1.0.0
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { gql } from "graphql-tag";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load GraphQL schema files
 * 
 * Reads all .gql files from the schema directory and combines them
 * into a single GraphQL schema definition.
 */

// Load common types
const commonTypes = fs.readFileSync(path.join(__dirname, "types/common.gql"), "utf8");
const userTypes = fs.readFileSync(path.join(__dirname, "types/user.gql"), "utf8");
const adminTypes = fs.readFileSync(path.join(__dirname, "types/admin.gql"), "utf8");
const teacherTypes = fs.readFileSync(path.join(__dirname, "types/teacher.gql"), "utf8");

// Load queries
const userQueries = fs.readFileSync(path.join(__dirname, "queries/user.gql"), "utf8");
const adminQueries = fs.readFileSync(path.join(__dirname, "queries/admin.gql"), "utf8");
const teacherQueries = fs.readFileSync(path.join(__dirname, "queries/teacher.gql"), "utf8");

// Load mutations
const authMutations = fs.readFileSync(path.join(__dirname, "mutations/auth.gql"), "utf8");
const adminMutations = fs.readFileSync(path.join(__dirname, "mutations/admin.gql"), "utf8");
const teacherMutations = fs.readFileSync(path.join(__dirname, "mutations/teacher.gql"), "utf8");

/**
 * Combined GraphQL Schema
 * 
 * All schema definitions combined into a single schema.
 * Organized by domain for better maintainability.
 */
export const schema = gql`
	${commonTypes}
	${userTypes}
	${adminTypes}
	${teacherTypes}
	${userQueries}
	${adminQueries}
	${teacherQueries}
	${authMutations}
	${adminMutations}
	${teacherMutations}
`;
