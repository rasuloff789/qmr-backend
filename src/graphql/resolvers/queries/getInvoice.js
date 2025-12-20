/**
 * QMR Backend - Get Invoice Query Resolver
 *
 * Fetch a specific invoice by ID
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../../../database/index.js";

/**
 * Get a single invoice by ID
 * @param {Object} _ - Parent object (unused)
 * @param {Object} args - Query arguments
 * @param {string} args.id - Invoice ID
 * @param {Object} context - GraphQL context
 * @returns {Promise<Object|null>} - Invoice record or null if not found
 */
export default async function (_, { id }, context) {
	try {
		const invoice = await prisma.invoice.findUnique({
			where: { id: parseInt(id) },
			include: {
				courseStudent: {
					include: {
						course: true,
						student: true,
					},
				},
			},
		});
		
		return invoice;
	} catch (error) {
		console.error("Error fetching invoice:", error);
		throw new Error("Failed to fetch invoice");
	}
}

