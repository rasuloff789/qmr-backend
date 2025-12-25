/**
 * QMR Backend - Remove From Finance Mutation Resolver
 *
 * Remove an admin from the financial admins whitelist.
 * Only root users can perform this operation.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../../../database/index.js";
import { removeFinancialAdmin } from "../../../utils/financialAdmins.js";
import { ROLES } from "../../../constants/roles.js";

/**
 * Remove an admin from the financial admins list
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.adminId - Admin ID to remove
 * @param {Object} context - GraphQL context
 * @param {Object} context.user - Current user from JWT
 * @returns {Object} - RemoveFromFinanceResponse with success status and admin data
 */
export const removeFromFinance = async (_parent, { adminId }, { user }) => {
	try {
		// Validate user is root
		if (!user) {
			return {
				success: false,
				code: "UNAUTHORIZED",
				message: "Authentication required",
				admin: null,
				errors: ["You must be authenticated to perform this operation"],
				timestamp: new Date().toISOString(),
			};
		}

		const userRole = String(user.role || "").toLowerCase();
		if (userRole !== ROLES.ROOT.toLowerCase()) {
			return {
				success: false,
				code: "FORBIDDEN",
				message: "Insufficient permissions",
				admin: null,
				errors: [
					"Only root users can remove admins from the financial admins list",
				],
				timestamp: new Date().toISOString(),
			};
		}

		// Validate adminId
		const adminIdInt = parseInt(adminId);
		if (isNaN(adminIdInt) || adminIdInt <= 0) {
			return {
				success: false,
				code: "INVALID_ADMIN_ID",
				message: "Validation failed",
				admin: null,
				errors: ["Invalid admin ID"],
				timestamp: new Date().toISOString(),
			};
		}

		// Get admin info before removing (for response)
		const admin = await prisma.admin.findUnique({
			where: { id: adminIdInt },
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

		// Remove admin from financial admins list
		const result = await removeFinancialAdmin(adminIdInt);

		if (!result.success) {
			return {
				success: false,
				code: "REMOVE_FAILED",
				message: result.message,
				admin: null,
				errors: [result.message],
				timestamp: new Date().toISOString(),
			};
		}

		// Return admin info if found, otherwise return null
		return {
			success: true,
			message: "Admin removed from financial admins list successfully",
			admin: admin || null,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Remove from finance error:", error);
		return {
			success: false,
			code: "REMOVE_FROM_FINANCE_FAILED",
			message: "Failed to remove admin from financial admins list",
			admin: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};
