import { prisma } from "../../../database/index.js";

/**
 * Get all degrees
 * @param {Object} _ - Parent object (unused)
 * @param {Object} args - Query arguments
 * @param {Object} context - GraphQL context
 * @returns {Array} - Array of degrees
 */
export const getDegrees = async (_, args, context) => {
	try {
		const degrees = await prisma.degree.findMany({
			select: {
				id: true,
				name: true,
				createdAt: true,
			},
			orderBy: {
				name: "asc",
			},
		});

		return degrees;
	} catch (error) {
		console.error("Error fetching degrees:", error);
		throw new Error("Failed to fetch degrees");
	}
};

/**
 * Get a single degree by ID
 * @param {Object} _ - Parent object (unused)
 * @param {Object} args - Query arguments
 * @param {string} args.id - Degree ID
 * @param {Object} context - GraphQL context
 * @returns {Object|null} - Degree object or null if not found
 */
export const getDegree = async (_, { id }, context) => {
	try {
		const degree = await prisma.degree.findUnique({
			where: { id: parseInt(id) },
			select: {
				id: true,
				name: true,
				teachers: {
					select: {
						id: true,
						username: true,
						fullname: true,
						isActive: true,
					},
				},
				createdAt: true,
			},
		});

		return degree;
	} catch (error) {
		console.error("Error fetching degree:", error);
		throw new Error("Failed to fetch degree");
	}
};
