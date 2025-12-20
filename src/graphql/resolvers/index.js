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
 * Combined resolvers
 */
export const resolvers = {
	Upload: GraphQLUpload,
	Query,
	Mutation,
	Course,
	Student,
	Teacher,
	Invoice,
	PriceChangeHistory,
};

export default resolvers;
