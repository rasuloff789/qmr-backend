/**
 * QMR Backend - Admin Type Resolver
 *
 * Resolves computed fields for the Admin GraphQL type.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { isFinancialAdmin } from "../../../utils/financialAdmins.js";

/**
 * Admin type resolver
 */
export const Admin = {
	/**
	 * Return the role for admin (always 'admin')
	 * @param {Object} admin - Admin object from parent resolver
	 * @returns {string} - Always returns 'admin'
	 */
	role: (admin) => {
		return "admin";
	},

	/**
	 * Check if admin is a financial admin
	 * @param {Object} admin - Admin object from parent resolver
	 * @returns {Promise<boolean>} - True if admin is in financial admins list
	 */
	isFinancialAdmin: async (admin) => {
		if (!admin || !admin.id) {
			return false;
		}
		return await isFinancialAdmin(admin.id);
	},
};
