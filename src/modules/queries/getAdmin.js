import prisma from "../../config/db.js";

/**
 * Get a single admin by ID
 * @param {Object} _ - Parent object (unused)
 * @param {Object} args - Query arguments
 * @param {string} args.id - Admin ID
 * @param {Object} context - GraphQL context
 * @returns {Object|null} - Admin object or null if not found
 */
export default async function (_, { id }, context) {
	try {
		const admin = await prisma.admin.findUnique({
			where: { id: parseInt(id) },
			select: {
				id: true,
				username: true,
				fullname: true,
				birthDate: true,
				phone: true,
				tgUsername: true,
				isActive: true,
				createdAt: true,
			},
		});

		return admin;
	} catch (error) {
		console.error("Error fetching admin:", error);
		throw new Error("Failed to fetch admin user");
	}
}
