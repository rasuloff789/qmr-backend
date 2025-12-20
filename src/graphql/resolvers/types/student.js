/**
 * QMR Backend - Student Type Resolvers
 *
 * Field-level resolvers for Student type to handle lazy loading
 * and ensure non-nullable fields always return valid values.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../../../database/index.js";

/**
 * Student type resolvers
 * Handles field-level resolution for Student type
 */
export const Student = {
	/**
	 * Resolve courses field for Student
	 * Returns all course enrollments for the student
	 * Always returns an array (empty if no courses) to satisfy non-nullable requirement
	 * @param {Object} parent - The Student object
	 * @returns {Promise<Array>} - Array of CourseStudent enrollments
	 */
	courses: async (parent) => {
		if (!parent.id) return [];
		
		try {
			const enrollments = await prisma.courseStudent.findMany({
				where: {
					studentId: parent.id,
					isDeleted: false,
				},
				include: {
					course: {
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
					},
				},
				orderBy: {
					joinedAt: "desc",
				},
			});
			return enrollments;
		} catch (error) {
			console.error("Error loading student courses:", error);
			return [];
		}
	},
};

