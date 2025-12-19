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
		const user = context?.user || null;
		const role = String(user?.role || "").toLowerCase();
		const teacherIdFilter =
			role === "teacher" && user?.id ? parseInt(user.id) : null;

		// ADMIN users can only see courses of their own gender + CHILD.
		// If admin gender is missing, deny (return empty list).
		if (role === "admin") {
			const adminGender = user?.gender
				? String(user.gender).toUpperCase()
				: null;
			if (!adminGender) return [];
		}

		const adminGenderFilter =
			role === "admin"
				? {
						gender: {
							in: [String(user.gender).toUpperCase(), "CHILD"],
						},
				  }
				: null;

		const courses = await prisma.course.findMany({
			where: {
				...(teacherIdFilter ? { teacherId: teacherIdFilter } : {}),
				...(adminGenderFilter ? adminGenderFilter : {}),
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
				teacher: {
					select: {
						id: true,
						username: true,
						fullname: true,
						birthDate: true,
						phone: true,
						tgUsername: true,
						gender: true,
						profilePicture: true,
						degrees: {
							select: {
								id: true,
								name: true,
								createdAt: true,
							},
						},
						isActive: true,
						createdAt: true,
					},
				},
				degrees: {
					select: {
						id: true,
						name: true,
					},
				},
				students: {
					select: {
						id: true,
						studentId: true,
						student: {
							select: {
								id: true,
								username: true,
								fullname: true,
							},
						},
						isActive: true,
					},
					where: {
						isActive: true,
						isDeleted: false,
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
		const user = context?.user || null;
		const role = String(user?.role || "").toLowerCase();
		const parsedId = parseInt(id);

		// ADMIN users can only fetch courses of their own gender + CHILD.
		// If admin gender is missing, deny (return null).
		if (role === "admin") {
			const adminGender = user?.gender
				? String(user.gender).toUpperCase()
				: null;
			if (!adminGender) return null;
		}

		// Teachers can only fetch their own course; others can fetch by id.
		const where =
			role === "teacher" && user?.id
				? { id: parsedId, teacherId: parseInt(user.id) }
				: role === "admin"
				? {
						id: parsedId,
						gender: {
							in: [String(user.gender).toUpperCase(), "CHILD"],
						},
				  }
				: { id: parsedId };

		const course = await prisma.course.findFirst({
			where,
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
						birthDate: true,
						phone: true,
						tgUsername: true,
						gender: true,
						profilePicture: true,
						degrees: {
							select: {
								id: true,
								name: true,
								createdAt: true,
							},
						},
						isActive: true,
						createdAt: true,
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
