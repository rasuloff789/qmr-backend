import { prisma } from "../../../database/index.js";

/**
 * Remove a student from a course enrollment
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.courseId - Course ID
 * @param {string} args.studentId - Student ID
 * @param {Object} context - GraphQL context
 * @returns {Object} - RemoveStudentFromCourseResponse with success status
 */
const removeStudentFromCourse = async (_parent, { courseId, studentId }) => {
	try {
		// Input validation
		if (!courseId || !studentId) {
			return {
				success: false,
				code: "ENROLLMENT_REQUIRED_FIELDS",
				message: "Validation failed",
				errors: ["Course ID and Student ID are required"],
				timestamp: new Date().toISOString(),
			};
		}

		const parsedCourseId = parseInt(courseId);
		const parsedStudentId = parseInt(studentId);

		if (isNaN(parsedCourseId) || isNaN(parsedStudentId)) {
			return {
				success: false,
				code: "ENROLLMENT_IDS_INVALID",
				message: "Validation failed",
				errors: ["Invalid course ID or student ID"],
				timestamp: new Date().toISOString(),
			};
		}

		// Check if course exists
		const course = await prisma.course.findUnique({
			where: { id: parsedCourseId },
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

		// Check if student exists
		const student = await prisma.student.findUnique({
			where: { id: parsedStudentId },
		});

		if (!student) {
			return {
				success: false,
				code: "STUDENT_NOT_FOUND",
				message: "Student not found",
				errors: [`Student with ID ${studentId} not found`],
				timestamp: new Date().toISOString(),
			};
		}

		// Check if enrollment exists
		const enrollment = await prisma.courseStudent.findUnique({
			where: {
				courseId_studentId: {
					courseId: parsedCourseId,
					studentId: parsedStudentId,
				},
			},
		});

		if (!enrollment) {
			return {
				success: false,
				code: "ENROLLMENT_NOT_FOUND",
				message: "Enrollment not found",
				errors: [
					`Student is not enrolled in this course (Course ID: ${courseId}, Student ID: ${studentId})`,
				],
				timestamp: new Date().toISOString(),
			};
		}

		// Check if enrollment is already deleted
		if (enrollment.isDeleted) {
			return {
				success: false,
				code: "ENROLLMENT_ALREADY_REMOVED",
				message: "Student already removed",
				errors: [
					`Student has already been removed from this course (Enrollment ID: ${enrollment.id})`,
				],
				timestamp: new Date().toISOString(),
			};
		}

		// Soft-delete the enrollment (set isDeleted to true and isActive to false)
		await prisma.courseStudent.update({
			where: {
				id: enrollment.id,
			},
			data: {
				isDeleted: true,
				isActive: false,
			},
		});

		console.log(
			`✅ Student removed from course: Student ID ${studentId} removed from Course ID ${courseId}`
		);

		return {
			success: true,
			message: "Student removed from course successfully",
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Remove student from course error:", error);
		return {
			success: false,
			code: "ENROLLMENT_REMOVE_FAILED",
			message: "Failed to remove student from course",
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { removeStudentFromCourse };
