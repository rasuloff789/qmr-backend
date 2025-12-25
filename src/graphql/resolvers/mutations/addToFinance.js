/**
 * QMR Backend - Add To Finance Mutation Resolver
 *
 * Add an admin to the financial admins whitelist.
 * Only root users can perform this operation.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../../../database/index.js";
import { addFinancialAdmin } from "../../../utils/financialAdmins.js";
import { ROLES } from "../../../constants/roles.js";

/**
 * Add an admin to the financial admins list
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.adminId - Admin ID to add
 * @param {Object} context - GraphQL context
 * @param {Object} context.user - Current user from JWT
 * @returns {Object} - AddToFinanceResponse with success status and admin data
 */
export const addToFinance = async (_parent, { adminId }, { user }) => {
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
				errors: ["Only root users can add admins to the financial admins list"],
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

		// Check if admin exists in database
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

		if (!admin) {
			return {
				success: false,
				code: "ADMIN_NOT_FOUND",
				message: "Admin not found",
				admin: null,
				errors: [`Admin with ID ${adminId} does not exist`],
				timestamp: new Date().toISOString(),
			};
		}

		// Add admin to financial admins list
		const result = await addFinancialAdmin(adminIdInt);

		if (!result.success) {
			return {
				success: false,
				code: "ADD_FAILED",
				message: result.message,
				admin: null,
				errors: [result.message],
				timestamp: new Date().toISOString(),
			};
		}

		return {
			success: true,
			message: "Admin added to financial admins list successfully",
			admin: admin,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Add to finance error:", error);
		return {
			success: false,
			code: "ADD_TO_FINANCE_FAILED",
			message: "Failed to add admin to financial admins list",
			admin: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};
