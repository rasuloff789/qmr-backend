import { prisma } from "../../../database/index.js";

/**
 * Get all admin users
 * @param {Object} _ - Parent object (unused)
 * @param {Object} args - Query arguments
 * @param {Object} context - GraphQL context
 * @returns {Array} - Array of admin users
 */
export default async function (_, args, context) {
	try {
		const admins = await prisma.admin.findMany({
			where: {
				isDeleted: false,
			},
			select: {
				id: true,
				username: true,
				fullname: true,
				// We'll select birthDate, but format it after fetching from DB
				birthDate: true,
				phone: true,
				tgUsername: true,
				isActive: true,
				isDeleted: true,
				createdAt: true,
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return admins;
	} catch (error) {
		console.error("Error fetching admins:", error);
		throw new Error("Failed to fetch admin users");
	}
}
