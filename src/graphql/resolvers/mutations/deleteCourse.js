import { prisma } from "../../../database/index.js";

/**
 * Delete a course
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.courseId - Course ID
 * @param {Object} context - GraphQL context
 * @returns {Object} - DeleteCourseResponse with success status
 */
const deleteCourse = async (_parent, { courseId }, context) => {
	try {
		// Input validation
		if (!courseId) {
			return {
				success: false,
				code: "COURSE_ID_REQUIRED",
				message: "Validation failed",
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
				errors: ["Invalid course ID"],
				timestamp: new Date().toISOString(),
			};
		}

		// Check if course exists
		const course = await prisma.course.findUnique({
			where: { id: parsedCourseId },
			include: {
				students: {
					where: {
						isDeleted: false,
					},
				},
				substituteTeachers: true,
				degrees: true,
			},
		});

		if (!course) {
			return {
				success: false,
				code: "COURSE_NOT_FOUND",
				message: "Course not found",
				errors: [`Course with ID ${courseId} not found`],
				timestamp: new Date().toISOString(),
			};
		}

		// Block deletion if the course still has any enrolled students.
		//
		// Note: `course.students` is CourseStudent rows filtered by `isDeleted: false`,
		// so any row here means the student is still considered enrolled.
		const existingEnrollments = course.students;

		if (existingEnrollments.length > 0) {
			return {
				success: false,
				code: "COURSE_DELETE_BLOCKED_ENROLLMENTS",
				message: "Cannot delete course with enrollments",
				errors: [
					`Course has ${existingEnrollments.length} student enrollment(s). Please remove students from the course first.`,
				],
				timestamp: new Date().toISOString(),
			};
		}

		// Delete attendances first to satisfy FK constraints.
		await prisma.attendance.deleteMany({
			where: {
				courseId: parsedCourseId,
			},
		});

		// Delete all student enrollments (hard delete since course is being deleted)
		await prisma.courseStudent.deleteMany({
			where: {
				courseId: parsedCourseId,
			},
		});

		// Delete substitute teacher assignments
		await prisma.substituteTeacher.deleteMany({
			where: {
				courseId: parsedCourseId,
			},
		});

		// Disconnect degrees (many-to-many relation)
		await prisma.course.update({
			where: { id: parsedCourseId },
			data: {
				degrees: {
					set: [],
				},
			},
		});

		// Delete the course
		await prisma.course.delete({
			where: { id: parsedCourseId },
		});

		console.log(
			`✅ Course deleted successfully: ${course.name} (ID: ${courseId})`
		);

		return {
			success: true,
			message: "Course deleted successfully",
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Delete course error:", error);
		return {
			success: false,
			code: "COURSE_DELETE_FAILED",
			message: "Failed to delete course",
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { deleteCourse };
