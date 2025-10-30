import { prisma } from "../../../database/index.js";

/**
 * Get a single teacher by ID
 * @param {Object} _ - Parent object (unused)
 * @param {Object} args - Query arguments
 * @param {string} args.id - Teacher ID
 * @param {Object} context - GraphQL context
 * @returns {Object|null} - Teacher object or null if not found
 */
export default async function (_, { id }, context) {
	console.log("🔍 getTeacher query called with id:", id);
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
		});

		if (!teacher) return null;
		return { ...teacher, degrees: teacher.degrees || [] };
	} catch (error) {
		console.error("Error fetching teacher:", error);
		throw new Error("Failed to fetch teacher user");
	}
}
