/**
 * QMR Backend - Audit Logging Middleware
 *
 * Automatically logs all admin actions for audit purposes.
 * Only logs actions performed by administrators (not root or teachers).
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { auditLogger } from "../utils/audit.js";

/**
 * Extract IP address from request
 */
const getIpAddress = (req) => {
	return (
		req?.headers?.["x-forwarded-for"]?.split(",")[0]?.trim() ||
		req?.headers?.["x-real-ip"] ||
		req?.connection?.remoteAddress ||
		req?.socket?.remoteAddress ||
		null
	);
};

/**
 * Extract user agent from request
 */
const getUserAgent = (req) => {
	return req?.headers?.["user-agent"] || null;
};

/**
 * GraphQL middleware to log admin actions
 * This wraps resolvers and logs admin actions automatically
 */
export const auditMiddleware = async (resolve, parent, args, context, info) => {
	const { user, req } = context || {};

	// Only log admin actions
	if (!user || user.role !== "admin") {
		return resolve(parent, args, context, info);
	}

	const operationName = info.fieldName;
	const operationType = info.operation.operation; // 'query', 'mutation', 'subscription'
	const parentType = info.parentType.name;

	// Determine action and resource from GraphQL operation
	let action = operationName;
	let resource = parentType;
	let resourceId = null;

	// Extract resource ID from arguments if available
	if (args) {
		// Common ID field names
		const idFields = ["id", "studentId", "teacherId", "courseId", "adminId", "invoiceId"];
		for (const field of idFields) {
			if (args[field]) {
				resourceId = String(args[field]);
				break;
			}
		}
	}

	// Map common operations to audit actions
	const actionMap = {
		// Student operations
		addStudent: "create_student",
		updateStudent: "update_student",
		deleteStudent: "delete_student",
		getStudent: "view_student",
		getStudents: "view_students",

		// Teacher operations
		addTeacher: "create_teacher",
		updateTeacher: "update_teacher",
		deleteTeacher: "delete_teacher",
		getTeacher: "view_teacher",
		getTeachers: "view_teachers",

		// Course operations
		addCourse: "create_course",
		updateCourse: "update_course",
		deleteCourse: "delete_course",
		addStudentToCourse: "enroll_student",
		removeStudentFromCourse: "unenroll_student",
		setAttendance: "set_attendance",

		// Invoice operations
		generateInvoice: "generate_invoice",
		generateInvoicesForMonth: "generate_invoices_bulk",
		markInvoicePaid: "mark_invoice_paid",
		addPartialPayment: "add_partial_payment",
		recalculateInvoice: "recalculate_invoice",
		deleteInvoice: "delete_invoice",
		updateCoursePrice: "update_course_price",
		updateEnrollmentPrice: "update_enrollment_price",

		// Degree operations
		addDegree: "create_degree",
		updateDegree: "update_degree",
		deleteDegree: "delete_degree",
	};

	const mappedAction = actionMap[operationName] || operationName;

	// Determine category based on operation type
	let category = "system";
	if (operationType === "mutation") {
		if (mappedAction.includes("create") || mappedAction.includes("add")) {
			category = "data_modification";
		} else if (
			mappedAction.includes("update") ||
			mappedAction.includes("delete") ||
			mappedAction.includes("remove")
		) {
			category = "data_modification";
		} else {
			category = "data_modification";
		}
	} else if (operationType === "query") {
		category = "data_access";
	}

	// Prepare details
	const details = {
		operationType,
		parentType,
		args: args ? JSON.parse(JSON.stringify(args)) : null, // Deep clone to avoid circular references
	};

	// Execute the resolver
	let success = true;
	let errorMessage = null;
	let result = null;

	try {
		result = await resolve(parent, args, context, info);

		// Check if result indicates failure
		if (result && typeof result === "object") {
			if (result.success === false) {
				success = false;
				errorMessage = result.message || result.code || "Operation failed";
			}
		}
	} catch (error) {
		success = false;
		errorMessage = error.message || "Unknown error";
		throw error; // Re-throw to maintain error handling
	} finally {
		// Log the action (async, don't wait for it)
		auditLogger
			.logDataModification(
				user,
				mappedAction,
				resource,
				resourceId,
				{},
				{
					...details,
					ipAddress: getIpAddress(req),
					userAgent: getUserAgent(req),
					success,
					errorMessage,
				}
			)
			.catch((err) => {
				// Don't fail the main operation if audit logging fails
				console.error("Error logging audit entry:", err);
			});
	}

	return result;
};

