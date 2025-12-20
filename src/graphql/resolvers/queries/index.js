/**
 * QMR Backend - Query Resolvers
 *
 * Centralized query resolvers for all GraphQL queries.
 * Handles data fetching and business logic for read operations.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import getAdmins from "./getAdmins.js";
import getAdmin from "./getAdmin.js";
import getTeachers from "./getTeachers.js";
import getTeacher from "./getTeacher.js";
import getTeachersForCourse from "./getTeachersForCourse.js";
import getStudents from "./getStudents.js";
import getStudent from "./getStudent.js";
import { getDegrees, getDegree } from "./getDegrees.js";
import { getCourses, getCourse } from "./getCourses.js";
import getAttendances from "./getAttendances.js";
import me from "./me.js";
import getDashboardStats from "./getDashboardStats.js";
import getInvoices from "./getInvoices.js";
import getInvoice from "./getInvoice.js";

export {
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
};
