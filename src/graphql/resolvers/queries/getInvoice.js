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
		const user = context?.user || null;
		const role = String(user?.role || "").toLowerCase();
		const userGender = String(user?.gender || "").toUpperCase();
		
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
		
		if (!invoice) {
			return null;
		}
		
		// Gender filtering for admins: MALE admin sees MALE+CHILD, FEMALE admin sees FEMALE+CHILD
		// ROOT can see all invoices
		if (role === "admin") {
			if (userGender !== "MALE" && userGender !== "FEMALE") {
				return null; // Admin without valid gender can't see invoices
			}
			const studentGender = invoice.courseStudent?.student?.gender;
			if (studentGender !== userGender && studentGender !== "CHILD") {
				return null; // Admin can't see invoices for different gender students
			}
		}
		
		return invoice;
	} catch (error) {
		console.error("Error fetching invoice:", error);
		throw new Error("Failed to fetch invoice");
	}
}

