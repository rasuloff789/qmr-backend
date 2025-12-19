import { prisma } from "../../../database/index.js";

/**
 * Update an existing course
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.courseId - Course ID
 * @param {string} args.name - Course name (optional)
 * @param {string} args.description - Course description (optional)
 * @param {Array} args.daysOfWeek - Days of week array (optional)
 * @param {Date} args.startTime - Start time (optional)
 * @param {Date} args.endTime - End time (optional)
 * @param {number} args.teacherId - Teacher ID (optional)
 * @param {Array} args.degreeIds - Degree IDs array (optional)
 * @param {Object} context - GraphQL context
 * @returns {Object} - UpdateCourseResponse with success status and course data
 */
const updateCourse = async (
	_parent,
	{
		courseId,
		name,
		description,
		daysOfWeek,
		startTime,
		endTime,
		teacherId,
		degreeIds,
	}
) => {
	try {
		// Input validation
		if (!courseId) {
			return {
				success: false,
				code: "COURSE_ID_REQUIRED",
				message: "Validation failed",
				course: null,
				errors: ["Course ID is required"],
				timestamp: new Date().toISOString(),
			};
		}

		const parsedCourseId = parseInt(courseId);

		if (isNaN(parsedCourseId)) {
			return {
				success: false,
				code: "COURSE_ID_INVALID",
				message: "Validation failed",
				course: null,
				errors: ["Invalid course ID"],
				timestamp: new Date().toISOString(),
			};
		}

		// Check if course exists
		const existingCourse = await prisma.course.findUnique({
			where: { id: parsedCourseId },
		});

		if (!existingCourse) {
			return {
				success: false,
				code: "COURSE_NOT_FOUND",
				message: "Course not found",
				course: null,
				errors: [`Course with ID ${courseId} not found`],
				timestamp: new Date().toISOString(),
			};
		}

		// Build update data object
		const updateData = {};

		// Validate and add name if provided
		if (name !== undefined) {
			if (!name || name.trim().length === 0) {
				return {
					success: false,
					code: "COURSE_NAME_EMPTY",
					message: "Validation failed",
					course: null,
					errors: ["Course name cannot be empty"],
					timestamp: new Date().toISOString(),
				};
			}

			// Check if new name already exists (excluding current course)
			const nameExists = await prisma.course.findFirst({
				where: {
					name: name.trim(),
					id: { not: parsedCourseId },
				},
			});

			if (nameExists) {
				return {
					success: false,
					code: "COURSE_NAME_TAKEN",
					message: "Course name already exists",
					course: null,
					errors: [`Course '${name.trim()}' already exists`],
					timestamp: new Date().toISOString(),
				};
			}

			updateData.name = name.trim();
		}

		// Add description if provided
		if (description !== undefined) {
			updateData.description = description?.trim() || null;
		}

		// Add daysOfWeek if provided
		if (daysOfWeek !== undefined) {
			if (!daysOfWeek || daysOfWeek.length === 0) {
				return {
					success: false,
					code: "COURSE_DAYS_OF_WEEK_REQUIRED",
					message: "Validation failed",
					course: null,
					errors: ["At least one day of week is required"],
					timestamp: new Date().toISOString(),
				};
			}
			updateData.daysOfWeek = daysOfWeek;
		}

		// Add dates if provided
		if (startTime !== undefined) {
			updateData.startTime = new Date(startTime);
		}

		if (endTime !== undefined) {
			updateData.endTime = new Date(endTime);
		}

		// Validate and update teacher if provided
		if (teacherId !== undefined) {
			const parsedTeacherId = parseInt(teacherId);

			if (isNaN(parsedTeacherId)) {
				return {
					success: false,
					code: "TEACHER_ID_INVALID",
					message: "Validation failed",
					course: null,
					errors: ["Invalid teacher ID"],
					timestamp: new Date().toISOString(),
				};
			}

			// Check if teacher exists and is active
			const teacher = await prisma.teacher.findUnique({
				where: {
					id: parsedTeacherId,
					isActive: true,
					isDeleted: false,
				},
				include: {
					degrees: true,
				},
			});

			if (!teacher) {
				return {
					success: false,
					code: "TEACHER_NOT_FOUND_OR_INACTIVE",
					message: "Teacher not found or inactive",
					course: null,
					errors: [
						`Teacher with ID ${teacherId} not found, inactive, or deleted`,
					],
					timestamp: new Date().toISOString(),
				};
			}

			// Validate teacher can teach this course gender:
			// - MALE teacher -> MALE + CHILD courses
			// - FEMALE teacher -> FEMALE + CHILD courses
			// (CHILD courses accept MALE/FEMALE teachers)
			const courseGender = existingCourse.gender;
			const teacherCanTeachCourseGender =
				courseGender === "CHILD"
					? teacher.gender === "MALE" || teacher.gender === "FEMALE"
					: teacher.gender === courseGender;

			if (!teacherCanTeachCourseGender) {
				return {
					success: false,
					code: "COURSE_TEACHER_GENDER_MISMATCH",
					message: "Gender mismatch",
					course: null,
					errors: [
						`Teacher gender (${teacher.gender}) cannot teach course gender (${courseGender})`,
					],
					timestamp: new Date().toISOString(),
				};
			}

			updateData.teacherId = parsedTeacherId;
		}

		// Validate and update degrees if provided
		if (degreeIds !== undefined) {
			if (!degreeIds || degreeIds.length === 0) {
				return {
					success: false,
					code: "COURSE_DEGREES_REQUIRED",
					message: "Validation failed",
					course: null,
					errors: ["At least one degree is required"],
					timestamp: new Date().toISOString(),
				};
			}

			const parsedDegreeIds = degreeIds
				.map((id) => parseInt(id))
				.filter((id) => Number.isFinite(id));

			if (parsedDegreeIds.length === 0) {
				return {
					success: false,
					code: "COURSE_DEGREE_IDS_INVALID",
					message: "Validation failed",
					course: null,
					errors: ["Invalid degree IDs"],
					timestamp: new Date().toISOString(),
				};
			}

			// Check if all degrees exist
			const degrees = await prisma.degree.findMany({
				where: {
					id: { in: parsedDegreeIds },
				},
				select: { id: true },
			});

			if (degrees.length !== parsedDegreeIds.length) {
				const foundIds = degrees.map((d) => d.id);
				const missingIds = parsedDegreeIds.filter((id) => !foundIds.includes(id));
				return {
					success: false,
					code: "COURSE_DEGREE_IDS_NOT_FOUND",
					message: "Invalid degree IDs",
					course: null,
					errors: [`Degrees with IDs ${missingIds.join(", ")} not found`],
					timestamp: new Date().toISOString(),
				};
			}

			// Validate teacher has at least one of the course degrees (ANY-match)
			const currentTeacherId =
				teacherId !== undefined ? parseInt(teacherId) : existingCourse.teacherId;

			if (currentTeacherId) {
				const teacher = await prisma.teacher.findUnique({
					where: { id: currentTeacherId },
					include: { degrees: { select: { id: true } } },
				});

				if (teacher) {
					const teacherDegreeIds = teacher.degrees.map((d) => d.id);
					const hasMatchingDegree = teacherDegreeIds.some((id) =>
						parsedDegreeIds.includes(id)
					);

					if (!hasMatchingDegree) {
						return {
							success: false,
							code: "COURSE_TEACHER_DEGREE_MISMATCH",
							message: "Teacher degree mismatch",
							course: null,
							errors: [
								"Teacher does not have any degrees matching the course requirements",
							],
							timestamp: new Date().toISOString(),
						};
					}
				}
			}

			updateData.degrees = {
				set: [],
				connect: parsedDegreeIds.map((id) => ({ id })),
			};
		}

		// Check if there are any fields to update
		if (Object.keys(updateData).length === 0) {
			return {
				success: false,
				code: "NO_FIELDS_TO_UPDATE",
				message: "No fields provided to update",
				course: null,
				errors: ["No fields provided to update"],
				timestamp: new Date().toISOString(),
			};
		}

		// Update the course
		const updatedCourse = await prisma.course.update({
			where: { id: parsedCourseId },
			data: updateData,
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

		return {
			success: true,
			message: "Course updated successfully",
			course: updatedCourse,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		return {
			success: false,
			code: "COURSE_UPDATE_FAILED",
			message: "Failed to update course",
			course: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { updateCourse };
