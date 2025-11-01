import { prisma } from "../../../database/index.js";

/**
 * Get all courses
 * @param {Object} _ - Parent object (unused)
 * @param {Object} args - Query arguments
 * @param {Object} context - GraphQL context
 * @returns {Array} - Array of courses
 */
export const getCourses = async (_, args, context) => {
	try {
		const courses = await prisma.course.findMany({
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
				teacher: {
					select: {
						id: true,
						username: true,
						fullname: true,
						isActive: true,
					},
				},
				degrees: {
					select: {
						id: true,
						name: true,
					},
				},
				createdAt: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return courses;
	} catch (error) {
		console.error("Error fetching courses:", error);
		throw new Error("Failed to fetch courses");
	}
};

/**
 * Get a single course by ID
 * @param {Object} _ - Parent object (unused)
 * @param {Object} args - Query arguments
 * @param {string} args.id - Course ID
 * @param {Object} context - GraphQL context
 * @returns {Object|null} - Course object or null if not found
 */
export const getCourse = async (_, { id }, context) => {
	try {
		const course = await prisma.course.findUnique({
			where: { id: parseInt(id) },
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
				teacher: {
					select: {
						id: true,
						username: true,
						fullname: true,
						isActive: true,
					},
				},
				degrees: {
					select: {
						id: true,
						name: true,
					},
				},
				createdAt: true,
			},
		});

		return course;
	} catch (error) {
		console.error("Error fetching course:", error);
		throw new Error("Failed to fetch course");
	}
};
