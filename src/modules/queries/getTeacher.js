import prisma from "../../config/db.js";

/**
 * Get a single teacher by ID
 * @param {Object} _ - Parent object (unused)
 * @param {Object} args - Query arguments
 * @param {string} args.id - Teacher ID
 * @param {Object} context - GraphQL context
 * @returns {Object|null} - Teacher object or null if not found
 */
export default async function (_, { id }, context) {
	try {
		const teacher = await prisma.teacher.findUnique({
			where: { id: parseInt(id) },
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
		});

		return teacher;
	} catch (error) {
		console.error("Error fetching teacher:", error);
		throw new Error("Failed to fetch teacher user");
	}
}
