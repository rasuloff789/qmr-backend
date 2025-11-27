import { prisma } from "../../../database/index.js";

// Constants
const DAY_OF_WEEK_MAP = {
	0: "SUNDAY",
	1: "MONDAY",
	2: "TUESDAY",
	3: "WEDNESDAY",
	4: "THURSDAY",
	5: "FRIDAY",
	6: "SATURDAY",
};

// Shared select/include objects
const COURSE_SELECT = {
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
};

const STUDENT_SELECT = {
	id: true,
	fullname: true,
	username: true,
	birthDate: true,
	phone: true,
	tgUsername: true,
	gender: true,
	isActive: true,
	createdAt: true,
};

const ATTENDANCE_INCLUDE = {
	course: { select: COURSE_SELECT },
	student: { select: STUDENT_SELECT },
};

/**
 * Helper function to create error response
 */
const createErrorResponse = (message, errors, attendance = null) => ({
	success: false,
	message,
	attendance,
	errors: Array.isArray(errors) ? errors : [errors],
	timestamp: new Date().toISOString(),
});

/**
 * Helper function to normalize date to start of day
 */
const normalizeDate = (date) => {
	const normalized = new Date(date);
	normalized.setHours(0, 0, 0, 0);
	return normalized;
};

/**
 * Helper function to format date as YYYY-MM-DD
 */
const formatDate = (date) => date.toISOString().split("T")[0];

/**
 * Validate input parameters
 */
const validateInput = (courseId, studentId, date, isPresent) => {
	if (!courseId || !studentId || !date) {
		return createErrorResponse(
			"Validation failed",
			"Course ID, Student ID, and date are required"
		);
	}

	if (typeof isPresent !== "boolean") {
		return createErrorResponse(
			"Validation failed",
			"isPresent must be a boolean value"
		);
	}

	return null;
};

/**
 * Validate user authorization
 */
const validateAuthorization = (user, course) => {
	if (!user) {
		return createErrorResponse(
			"Authentication required",
			"You must be logged in to set attendance"
		);
	}

	// ROOT users can set attendance for any course
	if (user.role === "root") {
		return null;
	}

	// TEACHER users can only set attendance for courses they are assigned to
	if (user.role === "teacher") {
		const teacherId = parseInt(user.id);
		if (course.teacherId !== teacherId) {
			return createErrorResponse(
				"Unauthorized",
				"You can only set attendance for courses you are assigned to teach"
			);
		}
		return null;
	}

	// Other roles are not allowed
	return createErrorResponse(
		"Unauthorized",
		"Only teachers and root users can set attendance"
	);
};

/**
 * Validate attendance date
 */
const validateAttendanceDate = (attendanceDate, course) => {
	const attendanceDayOfWeek = DAY_OF_WEEK_MAP[attendanceDate.getDay()];

	// Check if date falls on a scheduled day
	if (!course.daysOfWeek.includes(attendanceDayOfWeek)) {
		return createErrorResponse(
			"Invalid attendance date",
			`The attendance date (${attendanceDayOfWeek}) does not match any of the course's scheduled days: ${course.daysOfWeek.join(
				", "
			)}`
		);
	}

	// Check date range
	const courseStartDate = normalizeDate(course.startAt);
	const attendanceDateOnly = normalizeDate(attendanceDate);

	if (attendanceDateOnly < courseStartDate) {
		return createErrorResponse(
			"Invalid attendance date",
			`The attendance date cannot be before the course start date (${formatDate(
				courseStartDate
			)})`
		);
	}

	if (course.endAt) {
		const courseEndDate = new Date(course.endAt);
		courseEndDate.setHours(23, 59, 59, 999);

		if (attendanceDateOnly > courseEndDate) {
			return createErrorResponse(
				"Invalid attendance date",
				`The attendance date cannot be after the course end date (${formatDate(
					courseEndDate
				)})`
			);
		}
	}

	return null;
};

/**
 * Set attendance for a student in a course
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.courseId - Course ID
 * @param {string} args.studentId - Student ID
 * @param {Date} args.date - Date of attendance
 * @param {boolean} args.isPresent - Whether student was present
 * @param {string} args.notes - Optional notes
 * @param {Object} context - GraphQL context
 * @param {Object} context.user - Authenticated user
 * @returns {Object} - SetAttendanceResponse with success status and attendance data
 */
const setAttendance = async (
	_parent,
	{ courseId, studentId, date, isPresent, notes },
	{ user }
) => {
	try {
		// Input validation
		const inputError = validateInput(courseId, studentId, date, isPresent);
		if (inputError) return inputError;

		const parsedCourseId = parseInt(courseId);
		const parsedStudentId = parseInt(studentId);
		const attendanceDate = new Date(date);

		// Fetch course and validate authorization in parallel with input validation
		const course = await prisma.course.findUnique({
			where: { id: parsedCourseId },
			select: {
				id: true,
				name: true,
				daysOfWeek: true,
				startAt: true,
				endAt: true,
				teacherId: true,
			},
		});

		if (!course) {
			return createErrorResponse(
				"Course not found",
				`Course with ID ${courseId} not found`
			);
		}

		// Validate authorization
		const authError = validateAuthorization(user, course);
		if (authError) return authError;

		// Validate attendance date
		const dateError = validateAttendanceDate(attendanceDate, course);
		if (dateError) return dateError;

		// Parallel queries for student and enrollment validation
		const [student, enrollment, existingAttendance] = await Promise.all([
			prisma.student.findUnique({
				where: {
					id: parsedStudentId,
					isActive: true,
					isDeleted: false,
				},
			}),
			prisma.courseStudent.findUnique({
				where: {
					courseId_studentId: {
						courseId: parsedCourseId,
						studentId: parsedStudentId,
					},
				},
			}),
			prisma.attendance.findUnique({
				where: {
					courseId_studentId_date: {
						courseId: parsedCourseId,
						studentId: parsedStudentId,
						date: attendanceDate,
					},
				},
			}),
		]);

		// Validate student
		if (!student) {
			return createErrorResponse(
				"Student not found or inactive",
				`Student with ID ${studentId} not found, inactive, or deleted`
			);
		}

		// Validate enrollment
		if (!enrollment || !enrollment.isActive || enrollment.isDeleted) {
			return createErrorResponse(
				"Student not enrolled",
				"Student is not enrolled in this course or enrollment is inactive"
			);
		}

		// Create or update attendance record
		const attendanceData = {
			isPresent,
			notes: notes?.trim() || null,
		};

		const attendance = existingAttendance
			? await prisma.attendance.update({
					where: { id: existingAttendance.id },
					data: attendanceData,
					include: ATTENDANCE_INCLUDE,
			  })
			: await prisma.attendance.create({
					data: {
						courseId: parsedCourseId,
						studentId: parsedStudentId,
						date: attendanceDate,
						...attendanceData,
					},
					include: ATTENDANCE_INCLUDE,
			  });

		return {
			success: true,
			message: existingAttendance
				? "Attendance updated successfully"
				: "Attendance recorded successfully",
			attendance,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Set attendance error:", error);
		return createErrorResponse(
			"Failed to set attendance",
			error.message || "An unexpected error occurred"
		);
	}
};

export { setAttendance };
