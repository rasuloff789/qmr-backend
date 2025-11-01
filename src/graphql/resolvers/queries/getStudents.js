import { prisma } from "../../../database/index.js";

/**
 * Get all student users
 * @param {Object} _ - Parent object (unused)
 * @param {Object} args - Query arguments
 * @param {Object} context - GraphQL context
 * @returns {Array} - Array of student users
 */
export default async function (_, args, context) {
	try {
		const students = await prisma.student.findMany({
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
			orderBy: {
				createdAt: "desc",
			},
		});

		return students;
	} catch (error) {
		console.error("Error fetching students:", error);
		throw new Error("Failed to fetch student users");
	}
}
