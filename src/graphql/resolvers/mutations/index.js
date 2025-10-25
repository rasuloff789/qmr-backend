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
import { changeAdmin } from "./changeAdmin.js";
import { changeAdminActive } from "./changeAdminActive.js";
import { changePassword } from "./changePassword.js";
import { changeTeacher } from "./changeTeacher.js";
import { deleteAdmin } from "./deleteAdmin.js";
import { forgotPassword } from "./forgotPassword.js";
import { linkFirebaseUser } from "./linkFirebaseUser.js";
import { login } from "./login.js";
import { resetPassword } from "./resetPassword.js";
import { updateProfile } from "./updateProfile.js";

export {
	addAdmin,
	addTeacher,
	changeAdmin,
	changeAdminActive,
	changePassword,
	changeTeacher,
	deleteAdmin,
	forgotPassword,
	linkFirebaseUser,
	login,
	resetPassword,
	updateProfile,
};
