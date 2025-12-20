/**
 * QMR Backend - Update Course Price Mutation Resolver
 *
 * Update the monthly price for all active enrollments in a course
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../../../database/index.js";

/**
 * Update course price for all active enrollments
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.courseId - Course ID
 * @param {number} args.newPrice - New monthly price
 * @param {Object} context - GraphQL context
 * @param {Object} context.user - Authenticated user
 * @returns {Promise<Object>} - UpdateCoursePriceResponse
 */
const updateCoursePrice = async (_parent, { courseId, newPrice }, { user }) => {
	try {
		// Input validation
		if (!courseId || !newPrice) {
			return {
				success: false,
				code: "PRICE_UPDATE_MISSING_FIELDS",
				message: "Validation failed",
				updatedCount: 0,
				errors: ["Course ID and new price are required"],
				timestamp: new Date().toISOString(),
			};
		}
		
		if (newPrice <= 0) {
			return {
				success: false,
				code: "PRICE_UPDATE_INVALID_PRICE",
				message: "Validation failed",
				updatedCount: 0,
				errors: ["Price must be a positive number"],
				timestamp: new Date().toISOString(),
			};
		}
		
		if (!user) {
			return {
				success: false,
				code: "AUTH_REQUIRED",
				message: "Authentication required",
				updatedCount: 0,
				errors: ["You must be logged in to update course prices"],
				timestamp: new Date().toISOString(),
			};
		}
		
		const parsedCourseId = parseInt(courseId);
		const changedBy = parseInt(user.id);
		
		// Check if course exists
		const course = await prisma.course.findUnique({
			where: { id: parsedCourseId },
		});
		
		if (!course) {
			return {
				success: false,
				code: "COURSE_NOT_FOUND",
				message: "Course not found",
				updatedCount: 0,
				errors: [`Course with ID ${courseId} not found`],
				timestamp: new Date().toISOString(),
			};
		}
		
		// Find all active enrollments for this course
		const enrollments = await prisma.courseStudent.findMany({
			where: {
				courseId: parsedCourseId,
				isActive: true,
				isDeleted: false,
			},
		});
		
		if (enrollments.length === 0) {
			return {
				success: true,
				message: "No active enrollments found for this course",
				updatedCount: 0,
				errors: [],
				timestamp: new Date().toISOString(),
			};
		}
		
		// Update each enrollment and create price change history
		const updatePromises = enrollments.map(async (enrollment) => {
			const oldPrice = enrollment.monthlyPayment;
			
			// Update enrollment price
			await prisma.courseStudent.update({
				where: { id: enrollment.id },
				data: { monthlyPayment: newPrice },
			});
			
			// Create price change history
			await prisma.priceChangeHistory.create({
				data: {
					courseStudentId: enrollment.id,
					oldPrice: oldPrice,
					newPrice: newPrice,
					changedAt: new Date(),
					changedBy: changedBy,
				},
			});
		});
		
		await Promise.all(updatePromises);
		
		return {
			success: true,
			message: `Updated price for ${enrollments.length} enrollment(s)`,
			updatedCount: enrollments.length,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Error updating course price:", error);
		return {
			success: false,
			code: "PRICE_UPDATE_FAILED",
			message: "Failed to update course price",
			updatedCount: 0,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { updateCoursePrice };

