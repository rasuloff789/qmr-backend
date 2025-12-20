/**
 * QMR Backend - Update Enrollment Price Mutation Resolver
 *
 * Update the monthly price for a specific course enrollment
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../../../database/index.js";

/**
 * Update enrollment price for a specific student-course enrollment
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.courseStudentId - Course enrollment ID
 * @param {number} args.newPrice - New monthly price
 * @param {Object} context - GraphQL context
 * @param {Object} context.user - Authenticated user
 * @returns {Promise<Object>} - UpdateEnrollmentPriceResponse
 */
const updateEnrollmentPrice = async (_parent, { courseStudentId, newPrice }, { user }) => {
	try {
		// Input validation
		if (!courseStudentId || !newPrice) {
			return {
				success: false,
				code: "PRICE_UPDATE_MISSING_FIELDS",
				message: "Validation failed",
				courseStudent: null,
				errors: ["Enrollment ID and new price are required"],
				timestamp: new Date().toISOString(),
			};
		}
		
		if (newPrice <= 0) {
			return {
				success: false,
				code: "PRICE_UPDATE_INVALID_PRICE",
				message: "Validation failed",
				courseStudent: null,
				errors: ["Price must be a positive number"],
				timestamp: new Date().toISOString(),
			};
		}
		
		if (!user) {
			return {
				success: false,
				code: "AUTH_REQUIRED",
				message: "Authentication required",
				courseStudent: null,
				errors: ["You must be logged in to update enrollment prices"],
				timestamp: new Date().toISOString(),
			};
		}
		
		const parsedCourseStudentId = parseInt(courseStudentId);
		const changedBy = parseInt(user.id);
		
		// Check if enrollment exists
		const enrollment = await prisma.courseStudent.findUnique({
			where: { id: parsedCourseStudentId },
			include: {
				course: true,
				student: true,
			},
		});
		
		if (!enrollment) {
			return {
				success: false,
				code: "ENROLLMENT_NOT_FOUND",
				message: "Enrollment not found",
				courseStudent: null,
				errors: [`Enrollment with ID ${courseStudentId} not found`],
				timestamp: new Date().toISOString(),
			};
		}
		
		if (enrollment.isDeleted) {
			return {
				success: false,
				code: "ENROLLMENT_DELETED",
				message: "Cannot update price for deleted enrollment",
				courseStudent: null,
				errors: ["Enrollment has been deleted"],
				timestamp: new Date().toISOString(),
			};
		}
		
		const oldPrice = enrollment.monthlyPayment;
		
		// Update enrollment price
		const updatedEnrollment = await prisma.courseStudent.update({
			where: { id: parsedCourseStudentId },
			data: { monthlyPayment: newPrice },
			include: {
				course: true,
				student: true,
			},
		});
		
		// Create price change history
		await prisma.priceChangeHistory.create({
			data: {
				courseStudentId: parsedCourseStudentId,
				oldPrice: oldPrice,
				newPrice: newPrice,
				changedAt: new Date(),
				changedBy: changedBy,
			},
		});
		
		return {
			success: true,
			message: "Enrollment price updated successfully",
			courseStudent: updatedEnrollment,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Error updating enrollment price:", error);
		return {
			success: false,
			code: "PRICE_UPDATE_FAILED",
			message: "Failed to update enrollment price",
			courseStudent: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { updateEnrollmentPrice };

