import { prisma } from "../../../database/index.js";

// Shared select/include objects (matching setAttendance)
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
 * Get attendance records with optional filters
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Query arguments
 * @param {string} args.courseId - Optional course ID filter
 * @param {string} args.studentId - Optional student ID filter
 * @param {Date} args.startDate - Optional start date filter
 * @param {Date} args.endDate - Optional end date filter
 * @param {Object} context - GraphQL context
 * @param {Object} context.user - Authenticated user
 * @returns {Array} - Array of attendance records
 */
const getAttendances = async (
	_parent,
	{ courseId, studentId, startDate, endDate },
	{ user }
) => {
	try {
		// Build where clause dynamically based on provided filters
		const where = {};

		// Gender-based scoping for ADMIN:
		// - FEMALE admin -> FEMALE + CHILD students
		// - MALE admin   -> MALE + CHILD students
		// - ROOT         -> all students
		//
		// NOTE: This is enforced at query time to avoid leaking attendance data.
		const role = String(user?.role || "").trim().toLowerCase();
		if (role === "admin") {
			const adminGender = String(user?.gender || "").trim().toUpperCase();
			let allowedGenders = [];

			if (adminGender === "MALE" || adminGender === "FEMALE") {
				allowedGenders = [adminGender, "CHILD"];
			} else if (adminGender === "CHILD") {
				allowedGenders = ["CHILD"];
			} else {
				// If admin gender is unknown/missing, return nothing (safe default).
				allowedGenders = [];
			}

			where.student = {
				gender: { in: allowedGenders },
			};
		}

		if (courseId) {
			where.courseId = parseInt(courseId);
		}

		if (studentId) {
			where.studentId = parseInt(studentId);
		}

		if (startDate || endDate) {
			where.date = {};
			if (startDate) {
				const start = new Date(startDate);
				start.setHours(0, 0, 0, 0);
				where.date.gte = start;
			}
			if (endDate) {
				const end = new Date(endDate);
				end.setHours(23, 59, 59, 999);
				where.date.lte = end;
			}
		}

		// Fetch attendance records
		const attendances = await prisma.attendance.findMany({
			where,
			include: ATTENDANCE_INCLUDE,
			orderBy: [{ date: "desc" }, { createdAt: "desc" }],
		});

		return attendances;
	} catch (error) {
		console.error("Get attendances error:", error);
		throw new Error(error.message || "Failed to fetch attendance records");
	}
};

export default getAttendances;

