/**
 * QMR Backend - Course Type Resolvers
 *
 * Field-level resolvers for Course type to handle lazy loading
 * and ensure non-nullable fields always return valid values.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../../../database/index.js";

/**
 * Course type resolvers
 * Handles field-level resolution for Course type
 */
export const Course = {
	/**
	 * Resolve teacher field for Course
	 * Ensures teacher is always loaded (required non-nullable field)
	 * @param {Object} parent - The Course object
	 * @returns {Promise<Object>} - Teacher object
	 */
	teacher: async (parent) => {
		// If teacher is already loaded, return it
		if (parent.teacher) {
			return parent.teacher;
		}

		// If we have teacherId but teacher wasn't loaded, fetch it
		if (parent.teacherId) {
			try {
				const teacher = await prisma.teacher.findUnique({
					where: { id: parent.teacherId },
					select: {
						id: true,
						username: true,
						fullname: true,
						birthDate: true,
						phone: true,
						tgUsername: true,
						gender: true,
						profilePicture: true,
						isActive: true,
						createdAt: true,
					},
				});

				if (!teacher) {
					console.error(
						`❌ Teacher with ID ${parent.teacherId} not found for course ${parent.id}`
					);
					throw new Error(
						`Teacher not found for course ${parent.name || parent.id}`
					);
				}

				return teacher;
			} catch (error) {
				console.error("Error loading course teacher:", error);
				throw error;
			}
		}

		// If we have course id, try to load the course with teacher
		if (parent.id) {
			try {
				const course = await prisma.course.findUnique({
					where: { id: parent.id },
					select: {
						teacher: {
							select: {
								id: true,
								username: true,
								fullname: true,
								birthDate: true,
								phone: true,
								tgUsername: true,
								gender: true,
								profilePicture: true,
								isActive: true,
								createdAt: true,
							},
						},
					},
				});

				if (course && course.teacher) {
					return course.teacher;
				}
			} catch (error) {
				console.error("Error loading course teacher:", error);
			}
		}

		throw new Error(`Teacher not found for course ${parent.name || parent.id}`);
	},

	/**
	 * Resolve students field for Course
	 * Always returns an array (empty if no students) to satisfy non-nullable requirement
	 * @param {Object} parent - The Course object
	 * @returns {Promise<Array>} - Array of CourseStudent enrollments
	 */
	students: async (parent) => {
		if (!parent.id) return [];
		try {
			const enrollments = await prisma.courseStudent.findMany({
				where: {
					courseId: parent.id,
					isDeleted: false,
				},
				include: {
					student: {
						select: {
							id: true,
							fullname: true,
							username: true,
							birthDate: true,
							phone: true,
							tgUsername: true,
							gender: true,
							profilePicture: true,
							isActive: true,
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
			console.error("Error loading course students:", error);
			return [];
		}
	},

	/**
	 * Resolve degrees field for Course
	 * Always returns an array (empty if none) to satisfy non-nullable requirement
	 * @param {Object} parent - The Course object
	 * @returns {Promise<Array>} - Array of Degree objects
	 */
	degrees: async (parent) => {
		// If degrees are already loaded, return them
		if (parent.degrees && Array.isArray(parent.degrees)) {
			return parent.degrees;
		}

		// If we have course id, load degrees
		if (parent.id) {
			try {
				const course = await prisma.course.findUnique({
					where: { id: parent.id },
					select: {
						degrees: {
							select: {
								id: true,
								name: true,
								createdAt: true,
							},
						},
					},
				});

				if (course && course.degrees) {
					return course.degrees;
				}
			} catch (error) {
				console.error("Error loading course degrees:", error);
			}
		}

		return [];
	},

	/**
	 * Resolve substituteTeachers field for Course
	 * Always returns an array (empty if none) to satisfy non-nullable requirement
	 * @param {Object} parent - The Course object
	 * @returns {Promise<Array>} - Array of SubstituteTeacher assignments
	 */
	substituteTeachers: async (parent) => {
		if (!parent.id) return [];
		try {
			const substitutes = await prisma.substituteTeacher.findMany({
				where: {
					courseId: parent.id,
				},
				include: {
					teacher: {
						select: {
							id: true,
							fullname: true,
							username: true,
							isActive: true,
						},
					},
				},
				orderBy: {
					startDate: "desc",
				},
			});
			return substitutes;
		} catch (error) {
			console.error("Error loading substitute teachers:", error);
			return [];
		}
	},
};
