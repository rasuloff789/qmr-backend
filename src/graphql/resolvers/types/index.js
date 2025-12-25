/**
 * QMR Backend - Type Resolvers Aggregator
 *
 * Centralized export for all GraphQL type resolvers.
 * Type resolvers handle field-level resolution for complex types.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { Course } from "./course.js";
import { Student } from "./student.js";
import { Teacher } from "./teacher.js";
import { Invoice, PriceChangeHistory } from "./invoice.js";
import { Admin } from "./admin.js";
import { UserData } from "./userData.js";

export {
	Course,
	Student,
	Teacher,
	Invoice,
	PriceChangeHistory,
	Admin,
	UserData,
};
