/**
 * QMR Backend - GraphQL Resolvers Aggregator
 *
 * Centralized resolver management that combines all query and mutation resolvers.
 * This provides a clean interface for the GraphQL schema.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

// Import query resolvers
import {
	getAdmins,
	getAdmin,
	getTeachers,
	getTeacher,
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
	telegramResetPassword,
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
	telegramResetPassword,
	updateProfile,
};

/**
 * Combined resolvers
 */
export const resolvers = {
	Query,
	Mutation,
};

export default resolvers;
