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
	getStudents,
	getStudent,
	getDegrees,
	getDegree,
	getCourses,
	getCourse,
	me,
	getDashboardStats,
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
	deleteTeacher,
	addStudent,
	changeStudent,
	changeStudentActive,
	deleteStudent,
	addDegree,
	updateDegree,
	deleteDegree,
	addCourse,
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
	getStudents,
	getStudent,
	getDegrees,
	getDegree,
	getCourses,
	getCourse,
	getDashboardStats,
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
	deleteTeacher,
	addStudent,
	changeStudent,
	changeStudentActive,
	deleteStudent,
	addDegree,
	updateDegree,
	deleteDegree,
	addCourse,
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
