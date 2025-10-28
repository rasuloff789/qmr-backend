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
import { addDegree, updateDegree, deleteDegree } from "./addDegree.js";
import { changeAdmin } from "./changeAdmin.js";
import { changeAdminActive } from "./changeAdminActive.js";
import { changePassword } from "./changePassword.js";
import { changeTeacher } from "./changeTeacher.js";
import { changeTeacherActive } from "./changeTeacherActive.js";
import { deleteAdmin } from "./deleteAdmin.js";
import { login } from "./login.js";
import { testFileUpload } from "./testFileUpload.js";
import { updateProfile } from "./updateProfile.js";

export {
	addAdmin,
	addTeacher,
	addDegree,
	updateDegree,
	deleteDegree,
	changeAdmin,
	changeAdminActive,
	changePassword,
	changeTeacher,
	changeTeacherActive,
	deleteAdmin,
	login,
	testFileUpload,
	updateProfile,
};
