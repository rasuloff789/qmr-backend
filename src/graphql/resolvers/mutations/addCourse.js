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
			},
			include: {
				degrees: {
					select: {
						id: true,
					},
				},
			},
		});

		if (!teacher) {
			return {
				success: false,
				message: "Teacher not found",
				course: null,
				errors: [`Teacher with ID ${teacherId} not found`],
				timestamp: new Date().toISOString(),
			};
		}

		// Validate teacher status
		if (!teacher.isActive || teacher.isDeleted) {
			return {
				success: false,
				message: "Teacher is not active",
				course: null,
				errors: [`Teacher with ID ${teacherId} is inactive or deleted`],
				timestamp: new Date().toISOString(),
			};
		}

		// Validate teacher gender matches course gender
		if (teacher.gender !== gender) {
			return {
				success: false,
				message: "Gender mismatch",
				course: null,
				errors: [
					`Teacher gender (${teacher.gender}) does not match course gender (${gender})`,
				],
				timestamp: new Date().toISOString(),
			};
		}

		// Validate teacher has at least one matching degree
		const teacherDegreeIds = teacher.degrees.map((d) => d.id);
		const courseDegreeIds = degreeIds.map((id) => parseInt(id));
		const hasMatchingDegree = teacherDegreeIds.some((id) =>
			courseDegreeIds.includes(id)
		);

		if (!hasMatchingDegree) {
			return {
				success: false,
				message: "Teacher degree mismatch",
				course: null,
				errors: [
					`Teacher does not have any degrees matching the course requirements`,
				],
				timestamp: new Date().toISOString(),
			};
		}

		// Create a new course in the database
		console.log("Creating course with data:", {
			name: name.trim(),
			teacherId: parseInt(teacherId),
			degreeIds: degreeIds.map((id) => parseInt(id)),
		});

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
			include: {
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
			},
		});

		console.log(
			"✅ Course created successfully:",
			newCourse.id,
			newCourse.name
		);

		return {
			success: true,
			message: "Course created successfully",
			course: newCourse,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("❌ Add course error:", error);
		console.error("Error details:", {
			message: error.message,
			code: error.code,
			meta: error.meta,
		});
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
