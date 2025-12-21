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
	getTeachersForCourse,
	getStudents,
	getStudent,
	getDegrees,
	getDegree,
	getCourses,
	getCourse,
	getAttendances,
	me,
	getDashboardStats,
	getInvoices,
	getInvoice,
	getDebtorStudents,
	getAuditLogs,
} from "./queries/index.js";

// Import mutation resolvers
import {
	login,
	addAdmin,
	updateAdmin,
	updateAdminActive,
	updatePassword,
	deleteAdmin,
	addTeacher,
	updateTeacher,
	updateTeacherActive,
	deleteTeacher,
	addStudent,
	updateStudent,
	updateStudentActive,
	deleteStudent,
	addDegree,
	updateDegree,
	deleteDegree,
	addCourse,
	updateCourse,
	deleteCourse,
	addStudentToCourse,
	removeStudentFromCourse,
	setAttendance,
	updateProfile,
	generateInvoice,
	generateInvoicesForMonth,
	updateCoursePrice,
	updateEnrollmentPrice,
	markInvoicePaid,
	addPartialPayment,
	recalculateInvoice,
	deleteInvoice,
} from "./mutations/index.js";

// Import type resolvers
import { Course, Student, Teacher, Invoice, PriceChangeHistory } from "./types/index.js";

/**
 * Query resolvers
 */
const Query = {
	me,
	getAdmins,
	getAdmin,
	getTeachers,
	getTeacher,
	getTeachersForCourse,
	getStudents,
	getStudent,
	getDegrees,
	getDegree,
	getCourses,
	getCourse,
	getAttendances,
	getDashboardStats,
	getInvoices,
	getInvoice,
	getDebtorStudents,
	getAuditLogs,
};

/**
 * Mutation resolvers
 */
const Mutation = {
	login,
	addAdmin,
	updateAdmin,
	updateAdminActive,
	updatePassword,
	deleteAdmin,
	addTeacher,
	updateTeacher,
	updateTeacherActive,
	deleteTeacher,
	addStudent,
	updateStudent,
	updateStudentActive,
	deleteStudent,
	addDegree,
	updateDegree,
	deleteDegree,
	addCourse,
	updateCourse,
	deleteCourse,
	addStudentToCourse,
	removeStudentFromCourse,
	setAttendance,
	updateProfile,
	generateInvoice,
	generateInvoicesForMonth,
	updateCoursePrice,
	updateEnrollmentPrice,
	markInvoicePaid,
	addPartialPayment,
	recalculateInvoice,
	deleteInvoice,
};

/**
 * JSON scalar resolver
 * Accepts any JSON value and returns it as-is
 */
const Json = {
	parseValue: (value) => value, // Parse from variable
	serialize: (value) => value, // Serialize to response
	parseLiteral: (ast) => {
		// Parse from literal in query
		if (ast.kind === "StringValue") {
			try {
				return JSON.parse(ast.value);
			} catch {
				return ast.value;
			}
		}
		return null;
	},
};

/**
 * Combined resolvers
 */
export const resolvers = {
	Upload: GraphQLUpload,
	Json,
	Query,
	Mutation,
	Course,
	Student,
	Teacher,
	Invoice,
	PriceChangeHistory,
};

export default resolvers;
