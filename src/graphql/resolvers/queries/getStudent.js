import { prisma } from "../../../database/index.js";

/**
 * Get a single student by ID
 * @param {Object} _ - Parent object (unused)
 * @param {Object} args - Query arguments
 * @param {string} args.id - Student ID
 * @param {Object} context - GraphQL context
 * @returns {Object|null} - Student object or null if not found
 */
export default async function (_, { id }, context) {
	console.log("🔍 getStudent query called with id:", id);
	try {
		const student = await prisma.student.findUnique({
			where: { id: parseInt(id) },
			select: {
				id: true,
				username: true,
				fullname: true,
				birthDate: true,
				phone: true,
				tgUsername: true,
				gender: true,
				profilePicture: true,
				isActive: true,
				isDeleted: true,
				createdAt: true,
			},
		});

		if (!student) return null;
		return student;
	} catch (error) {
		console.error("Error fetching student:", error);
		throw new Error("Failed to fetch student user");
	}
}
