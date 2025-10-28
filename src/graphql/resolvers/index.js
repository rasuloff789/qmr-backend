/**
 * QMR Backend - GraphQL Resolvers Aggregator
 *
 * Centralized resolver management that combines all query and mutation resolvers.
 * This provides a clean interface for the GraphQL schema.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";

// Import query resolvers
import {
	getAdmins,
	getAdmin,
	getTeachers,
	getTeacher,
	getDegrees,
	getDegree,
	me,
} from "./queries/index.js";

// Import mutation resolvers
import {
	login,
	addAdmin,
	changeAdmin,
	changeAdminActive,
	changePassword,
	deleteAdmin,
	addTeacher,
	changeTeacher,
	changeTeacherActive,
	addDegree,
	updateDegree,
	deleteDegree,
	testFileUpload,
	updateProfile,
} from "./mutations/index.js";

/**
 * Query resolvers
 */
const Query = {
	me,
	getAdmins,
	getAdmin,
	getTeachers,
	getTeacher,
	getDegrees,
	getDegree,
};

/**
 * Mutation resolvers
 */
const Mutation = {
	login,
	addAdmin,
	changeAdmin,
	changeAdminActive,
	changePassword,
	deleteAdmin,
	addTeacher,
	changeTeacher,
	changeTeacherActive,
	addDegree,
	updateDegree,
	deleteDegree,
	testFileUpload,
	updateProfile,
};

/**
 * Combined resolvers
 */
export const resolvers = {
	Upload: GraphQLUpload,
	Query,
	Mutation,
};

export default resolvers;
