import { prisma } from "../../../database/index.js";

/**
 * Add a student to a course enrollment
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.courseId - Course ID
 * @param {string} args.studentId - Student ID
 * @param {number} args.monthlyPayment - Monthly payment amount
 * @param {Object} context - GraphQL context
 * @returns {Object} - AddStudentToCourseResponse with success status and enrollment data
 */
const addStudentToCourse = async (
	_parent,
	{ courseId, studentId, monthlyPayment }
) => {
	try {
		// Input validation
		if (!courseId || !studentId) {
			return {
				success: false,
				message: "Validation failed",
				courseStudent: null,
				errors: ["Course ID and Student ID are required"],
				timestamp: new Date().toISOString(),
			};
		}

		if (!monthlyPayment || monthlyPayment <= 0) {
			return {
				success: false,
				message: "Validation failed",
				courseStudent: null,
				errors: ["Monthly payment must be a positive number"],
				timestamp: new Date().toISOString(),
			};
		}

		const parsedCourseId = parseInt(courseId);
		const parsedStudentId = parseInt(studentId);

		// Check if course exists and is valid
		const course = await prisma.course.findUnique({
			where: { id: parsedCourseId },
			include: {
				degrees: true,
			},
		});

		if (!course) {
			return {
				success: false,
				message: "Course not found",
				courseStudent: null,
				errors: [`Course with ID ${courseId} not found`],
				timestamp: new Date().toISOString(),
			};
		}

		// Check if student exists and is active
		const student = await prisma.student.findUnique({
			where: {
				id: parsedStudentId,
				isActive: true,
				isDeleted: false,
			},
			include: {
				possibleDegrees: true,
			},
		});

		if (!student) {
			return {
				success: false,
				message: "Student not found or inactive",
				courseStudent: null,
				errors: [
					`Student with ID ${studentId} not found, inactive, or deleted`,
				],
				timestamp: new Date().toISOString(),
			};
		}

		// Check if student gender matches course gender
		if (student.gender !== course.gender) {
			return {
				success: false,
				message: "Gender mismatch",
				courseStudent: null,
				errors: [
					`Student gender (${student.gender}) does not match course gender (${course.gender})`,
				],
				timestamp: new Date().toISOString(),
			};
		}

		// Check if student has at least one matching degree
		const studentDegreeIds = student.possibleDegrees.map((d) => d.id);
		const courseDegreeIds = course.degrees.map((d) => d.id);
		const hasMatchingDegree = studentDegreeIds.some((id) =>
			courseDegreeIds.includes(id)
		);

		if (!hasMatchingDegree) {
			return {
				success: false,
				message: "Degree mismatch",
				courseStudent: null,
				errors: [
					"Student does not have any degrees matching the course requirements",
				],
				timestamp: new Date().toISOString(),
			};
		}

		// Check if enrollment already exists
		const existingEnrollment = await prisma.courseStudent.findUnique({
			where: {
				courseId_studentId: {
					courseId: parsedCourseId,
					studentId: parsedStudentId,
				},
			},
		});

		if (existingEnrollment) {
			// If enrollment exists but is deleted, reactivate it
			if (existingEnrollment.isDeleted) {
				const reactivatedEnrollment = await prisma.courseStudent.update({
					where: {
						id: existingEnrollment.id,
					},
					data: {
						isDeleted: false,
						isActive: true,
						monthlyPayment: monthlyPayment,
						joinedAt: new Date(),
					},
					include: {
						course: true,
						student: true,
					},
				});

				return {
					success: true,
					message: "Student re-enrolled in course successfully",
					courseStudent: reactivatedEnrollment,
					errors: [],
					timestamp: new Date().toISOString(),
				};
			}

			// If enrollment exists and is active, return error
			return {
				success: false,
				message: "Student already enrolled",
				courseStudent: null,
				errors: [
					`Student is already enrolled in this course (Enrollment ID: ${existingEnrollment.id})`,
				],
				timestamp: new Date().toISOString(),
			};
		}

		// Create new enrollment
		const newEnrollment = await prisma.courseStudent.create({
			data: {
				courseId: parsedCourseId,
				studentId: parsedStudentId,
				monthlyPayment: monthlyPayment,
				isActive: true,
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
						createdAt: true,
					},
				},
				student: {
					select: {
						id: true,
						fullname: true,
						username: true,
						birthDate: true,
						phone: true,
						tgUsername: true,
						gender: true,
						isActive: true,
						createdAt: true,
					},
				},
			},
		});

		return {
			success: true,
			message: "Student added to course successfully",
			courseStudent: newEnrollment,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Add student to course error:", error);
		return {
			success: false,
			message: "Failed to add student to course",
			courseStudent: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { addStudentToCourse };
