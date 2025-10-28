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
import { getDegrees, getDegree } from "./getDegrees.js";
import me from "./me.js";

export {
	getAdmins,
	getAdmin,
	getTeachers,
	getTeacher,
	getDegrees,
	getDegree,
	me,
};
