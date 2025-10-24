import prisma from "../../config/db.js";

/**
 * Get all teacher users
 * @param {Object} _ - Parent object (unused)
 * @param {Object} args - Query arguments
 * @param {Object} context - GraphQL context
 * @returns {Array} - Array of teacher users
 */
export default async function (_, args, context) {
	try {
		const teachers = await prisma.teacher.findMany({
			select: {
				id: true,
				username: true,
				fullname: true,
				birthDate: true,
				phone: true,
				tgUsername: true,
				department: true,
				isActive: true,
				createdAt: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return teachers;
	} catch (error) {
		console.error("Error fetching teachers:", error);
		throw new Error("Failed to fetch teacher users");
	}
}
