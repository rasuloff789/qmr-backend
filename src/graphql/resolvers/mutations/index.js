/**
 * QMR Backend - Mutation Resolvers
 *
 * Centralized mutation resolvers for all GraphQL mutations.
 * Handles data modification and business logic for write operations.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { addAdmin } from "./addAdmin.js";
import { addTeacher } from "./addTeacher.js";
import { addStudent } from "./addStudent.js";
import { addDegree, updateDegree, deleteDegree } from "./addDegree.js";
import { addCourse } from "./addCourse.js";
import { updateCourse } from "./updateCourse.js";
import { deleteCourse } from "./deleteCourse.js";
import { addStudentToCourse } from "./addStudentToCourse.js";
import { removeStudentFromCourse } from "./removeStudentFromCourse.js";
import { setAttendance } from "./setAttendance.js";
import { updateAdmin } from "./updateAdmin.js";
import { updateAdminActive } from "./updateAdminActive.js";
import { updatePassword } from "./updatePassword.js";
import { updateTeacher } from "./updateTeacher.js";
import { updateTeacherActive } from "./updateTeacherActive.js";
import { updateStudent } from "./updateStudent.js";
import { updateStudentActive } from "./updateStudentActive.js";
import { deleteAdmin } from "./deleteAdmin.js";
import { deleteTeacher } from "./deleteTeacher.js";
import { deleteStudent } from "./deleteStudent.js";
import { login } from "./login.js";
import { updateProfile } from "./updateProfile.js";
import { generateInvoice } from "./generateInvoice.js";
import { generateInvoicesForMonth } from "./generateInvoicesForMonth.js";
import { updateCoursePrice } from "./updateCoursePrice.js";
import { updateEnrollmentPrice } from "./updateEnrollmentPrice.js";
import { deleteInvoice } from "./deleteInvoice.js";
import { addPartialPayment } from "./addPartialPayment.js";
import { markInvoicePaid } from "./markInvoicePaid.js";
import { recalculateInvoice } from "./recalculateInvoice.js";
import { addToFinance } from "./addToFinance.js";
import { removeFromFinance } from "./removeFromFinance.js";

export {
	addAdmin,
	addTeacher,
	addStudent,
	addDegree,
	updateDegree,
	deleteDegree,
	addCourse,
	updateCourse,
	deleteCourse,
	addStudentToCourse,
	removeStudentFromCourse,
	setAttendance,
	updateAdmin,
	updateAdminActive,
	updatePassword,
	updateTeacher,
	updateTeacherActive,
	updateStudent,
	updateStudentActive,
	deleteAdmin,
	deleteTeacher,
	deleteStudent,
	login,
	updateProfile,
	generateInvoice,
	generateInvoicesForMonth,
	updateCoursePrice,
	updateEnrollmentPrice,
	markInvoicePaid,
	addPartialPayment,
	recalculateInvoice,
	deleteInvoice,
	addToFinance,
	removeFromFinance,
};
