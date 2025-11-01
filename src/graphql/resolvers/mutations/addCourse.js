import { prisma } from "../../../database/index.js";

/**
 * Add a new course
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.name - Course name
 * @param {string} args.description - Course description
 * @param {Array} args.daysOfWeek - Days of week array
 * @param {string} args.gender - Gender enum
 * @param {Date} args.startAt - Start date
 * @param {Date} args.endAt - End date (optional)
 * @param {Date} args.startTime - Start time
 * @param {Date} args.endTime - End time
 * @param {number} args.teacherId - Teacher ID
 * @param {Array} args.degreeIds - Degree IDs array
 * @param {Object} context - GraphQL context
 * @returns {Object} - AddCourseResponse with success status and course data
 */
const addCourse = async (
	_parent,
	{
		name,
		description,
		daysOfWeek,
		gender,
		startAt,
		endAt,
		startTime,
		endTime,
		teacherId,
		degreeIds,
	}
) => {
	try {
		// Input validation
		if (!name || name.trim().length === 0) {
			return {
				success: false,
				message: "Validation failed",
				course: null,
				errors: ["Course name is required"],
				timestamp: new Date().toISOString(),
			};
		}

		if (!daysOfWeek || daysOfWeek.length === 0) {
			return {
				success: false,
				message: "Validation failed",
				course: null,
				errors: ["At least one day of week is required"],
				timestamp: new Date().toISOString(),
			};
		}

		if (!teacherId || !degreeIds || degreeIds.length === 0) {
			return {
				success: false,
				message: "Validation failed",
				course: null,
				errors: ["Teacher and at least one degree are required"],
				timestamp: new Date().toISOString(),
			};
		}

		// Check if course name already exists
		const existingCourse = await prisma.course.findUnique({
			where: { name: name.trim() },
		});

		if (existingCourse) {
			return {
				success: false,
				message: "Course name already exists",
				course: null,
				errors: [`Course '${name.trim()}' already exists`],
				timestamp: new Date().toISOString(),
			};
		}

		// Check if teacher exists and is valid for this course
		const teacher = await prisma.teacher.findUnique({
			where: {
				id: parseInt(teacherId),
				isActive: true,
				isDeleted: false, // Teacher must not be deleted
				degrees: { some: { id: { in: degreeIds.map((id) => parseInt(id)) } } }, // Teacher must have at least one matching degree
				gender: gender, // Teacher gender must match course gender
			},
		});

		if (!teacher) {
			return {
				success: false,
				message: "Teacher not found or invalid",
				course: null,
				errors: [
					`Teacher with ID ${teacherId} not found, deleted, doesn't have matching degrees, or gender mismatch`,
				],
				timestamp: new Date().toISOString(),
			};
		}

		// Create a new course in the database
		const newCourse = await prisma.course.create({
			data: {
				name: name.trim(),
				description: description?.trim(),
				daysOfWeek,
				gender,
				startAt: new Date(startAt),
				endAt: endAt ? new Date(endAt) : null,
				startTime: new Date(startTime),
				endTime: new Date(endTime),
				teacherId: parseInt(teacherId),
				degrees: {
					connect: degreeIds.map((id) => ({ id: parseInt(id) })),
				},
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
				createdAt: true,
			},
		});

		return {
			success: true,
			message: "Course created successfully",
			course: newCourse,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Add course error:", error);
		return {
			success: false,
			message: "Failed to create course",
			course: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { addCourse };
