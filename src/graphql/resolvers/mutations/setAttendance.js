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
const createErrorResponse = (code, message, errors, attendance = null) => ({
	success: false,
	code,
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
			"ATTENDANCE_REQUIRED_FIELDS",
			"Validation failed",
			"Course ID, Student ID, and date are required"
		);
	}

	if (typeof isPresent !== "boolean") {
		return createErrorResponse(
			"ATTENDANCE_IS_PRESENT_INVALID",
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
			"AUTH_REQUIRED",
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
				"ATTENDANCE_UNAUTHORIZED_NOT_COURSE_TEACHER",
				"Unauthorized",
				"You can only set attendance for courses you are assigned to teach"
			);
		}
		return null;
	}

	// Other roles are not allowed
	return createErrorResponse(
		"ATTENDANCE_UNAUTHORIZED_ROLE",
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
			"ATTENDANCE_DATE_NOT_ON_SCHEDULE",
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
			"ATTENDANCE_DATE_BEFORE_COURSE_START",
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
				"ATTENDANCE_DATE_AFTER_COURSE_END",
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
 * Ensure all enrolled students have attendance records for the given date
 * Creates missing records with isPresent = false
 * @param {number} courseId - Course ID
 * @param {Date} attendanceDate - Date of attendance
 * @param {number} currentStudentId - ID of student whose attendance was just set (to skip)
 * @returns {Promise<{created: number, missing: Array}>} - Number of records created and list of missing student IDs
 */
const ensureAllStudentsHaveAttendance = async (
	courseId,
	attendanceDate,
	currentStudentId
) => {
	// Get all active enrolled students for the course
	const enrollments = await prisma.courseStudent.findMany({
		where: {
			courseId: courseId,
			isActive: true,
			isDeleted: false,
		},
		select: {
			studentId: true,
		},
	});

	if (enrollments.length === 0) {
		return { created: 0, missing: [] };
	}

	// Get all existing attendance records for this date
	const existingAttendances = await prisma.attendance.findMany({
		where: {
			courseId: courseId,
			date: attendanceDate,
		},
		select: {
			studentId: true,
		},
	});

	const existingStudentIds = new Set(
		existingAttendances.map((a) => a.studentId)
	);

	// Find students without attendance records
	const missingStudentIds = enrollments
		.map((e) => e.studentId)
		.filter((studentId) => !existingStudentIds.has(studentId));

	if (missingStudentIds.length === 0) {
		return { created: 0, missing: [] };
	}

	// Create missing attendance records with isPresent = false
	const attendanceRecords = missingStudentIds.map((studentId) => ({
		courseId: courseId,
		studentId: studentId,
		date: attendanceDate,
		isPresent: false,
		notes: null,
	}));

	try {
		await prisma.attendance.createMany({
			data: attendanceRecords,
			skipDuplicates: true,
		});

		return {
			created: attendanceRecords.length,
			missing: missingStudentIds,
		};
	} catch (error) {
		console.error("Error creating missing attendance records:", error);
		// Don't fail the main operation if we can't create missing records
		// Just log it and return what we could create
		return {
			created: 0,
			missing: missingStudentIds,
			error: error.message,
		};
	}
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
		const attendanceDate = normalizeDate(new Date(date));

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
				"COURSE_NOT_FOUND",
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
				"STUDENT_NOT_FOUND_OR_INACTIVE",
				"Student not found or inactive",
				`Student with ID ${studentId} not found, inactive, or deleted`
			);
		}

		// Validate enrollment
		if (!enrollment || !enrollment.isActive || enrollment.isDeleted) {
			return createErrorResponse(
				"STUDENT_NOT_ENROLLED_OR_INACTIVE",
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

		// Ensure all enrolled students have attendance records for this date
		// This prevents any student from being left out
		const missingRecords = await ensureAllStudentsHaveAttendance(
			parsedCourseId,
			attendanceDate,
			parsedStudentId
		);

		// Build success message
		let message = existingAttendance
			? "Attendance updated successfully"
			: "Attendance recorded successfully";

		if (missingRecords.created > 0) {
			message += `. Automatically created ${missingRecords.created} missing attendance record(s) for other students (marked as absent).`;
		}

		return {
			success: true,
			message,
			attendance,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Set attendance error:", error);
		return createErrorResponse(
			"ATTENDANCE_SET_FAILED",
			"Failed to set attendance",
			error.message || "An unexpected error occurred"
		);
	}
};

export { setAttendance };
