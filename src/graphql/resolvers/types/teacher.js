/**
 * QMR Backend - Teacher Type Resolvers
 *
 * Field-level resolvers for Teacher type to handle lazy loading
 * and ensure non-nullable fields always return valid values.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../../../database/index.js";

/**
 * Teacher type resolvers
 * Handles field-level resolution for Teacher type
 */
export const Teacher = {
	/**
	 * Resolve courses field for Teacher
	 * Returns all courses the teacher is teaching
	 * Always returns an array (empty if no courses) to satisfy non-nullable requirement
	 * @param {Object} parent - The Teacher object
	 * @returns {Promise<Array>} - Array of Course objects
	 */
	courses: async (parent) => {
		// If courses are already loaded, return them
		if (parent.courses && Array.isArray(parent.courses)) {
			return parent.courses;
		}

		// If we have teacher id, load courses
		if (parent.id) {
			try {
				const courses = await prisma.course.findMany({
					where: {
						teacherId: parent.id,
					},
					select: {
						id: true,
						name: true,
						description: true,
						daysOfWeek: true,
						gender: true,
						startAt: true,
						endAt: true,
						startTime: true,
						endTime: true,
						teacherId: true,
						createdAt: true,
					},
					orderBy: {
						createdAt: "desc",
					},
				});
				return courses;
			} catch (error) {
				console.error("Error loading teacher courses:", error);
				return [];
			}
		}

		return [];
	},
};

