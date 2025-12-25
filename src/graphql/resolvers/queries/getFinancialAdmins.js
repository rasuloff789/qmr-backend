/**
 * QMR Backend - Get Financial Admins Query Resolver
 *
 * Fetch list of financial admins (admins with access to invoice/debtor operations).
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../../../database/index.js";
import { getFinancialAdmins } from "../../../utils/financialAdmins.js";

/**
 * Get list of financial admins
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} _args - Query arguments (unused)
 * @param {Object} context - GraphQL context
 * @returns {Promise<Array>} - Array of financial admin records with admin details
 */
export default async function (_parent, _args, context) {
	try {
		// Get financial admin IDs from JSON file
		const financialAdminList = await getFinancialAdmins();

		if (financialAdminList.length === 0) {
			return [];
		}

		// Get admin IDs
		const adminIds = financialAdminList.map((fa) => parseInt(fa.id));

		// Fetch admin details from database
		const admins = await prisma.admin.findMany({
			where: {
				id: {
					in: adminIds,
				},
			},
			select: {
				id: true,
				username: true,
				fullname: true,
				birthDate: true,
				phone: true,
				tgUsername: true,
				gender: true,
				isActive: true,
				createdAt: true,
			},
		});

		// Map to FinancialAdmin type with addedAt timestamp
		const financialAdmins = admins.map((admin) => {
			const financialAdminData = financialAdminList.find(
				(fa) => parseInt(fa.id) === admin.id
			);
			return {
				id: admin.id.toString(),
				admin: admin,
				addedAt: financialAdminData?.addedAt || new Date().toISOString(),
			};
		});

		// Sort by addedAt (most recent first)
		financialAdmins.sort((a, b) => {
			return new Date(b.addedAt) - new Date(a.addedAt);
		});

		return financialAdmins;
	} catch (error) {
		console.error("Error fetching financial admins:", error);
		throw new Error("Failed to fetch financial admins");
	}
}

