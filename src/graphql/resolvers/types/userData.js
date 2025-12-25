/**
 * QMR Backend - UserData Type Resolver
 *
 * Resolves computed fields for the UserData GraphQL type.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { isFinancialAdmin } from "../../../utils/financialAdmins.js";

/**
 * UserData type resolver
 */
export const UserData = {
	/**
	 * Check if admin is a financial admin (only for admin role)
	 * @param {Object} userData - UserData object from parent resolver
	 * @returns {Promise<boolean|null>} - True if admin is in financial admins list, null for non-admins
	 */
	isFinancialAdmin: async (userData) => {
		if (!userData || !userData.id) {
			return null;
		}

		// Only admins can be financial admins
		if (userData.role !== "admin") {
			return null;
		}

		return await isFinancialAdmin(userData.id);
	},
};
