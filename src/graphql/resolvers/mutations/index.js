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
import { changeAdmin } from "./changeAdmin.js";
import { changeAdminActive } from "./changeAdminActive.js";
import { changePassword } from "./changePassword.js";
import { changeTeacher } from "./changeTeacher.js";
import { changeTeacherActive } from "./changeTeacherActive.js";
import { changeStudent } from "./changeStudent.js";
import { changeStudentActive } from "./changeStudentActive.js";
import { deleteAdmin } from "./deleteAdmin.js";
import { deleteTeacher } from "./deleteTeacher.js";
import { deleteStudent } from "./deleteStudent.js";
import { login } from "./login.js";
import { updateProfile } from "./updateProfile.js";

export {
	addAdmin,
	addTeacher,
	addStudent,
	addDegree,
	updateDegree,
	deleteDegree,
	addCourse,
	changeAdmin,
	changeAdminActive,
	changePassword,
	changeTeacher,
	changeTeacherActive,
	changeStudent,
	changeStudentActive,
	deleteAdmin,
	deleteTeacher,
	deleteStudent,
	login,
	updateProfile,
};
