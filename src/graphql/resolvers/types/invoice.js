/**
 * QMR Backend - Invoice Type Resolvers
 *
 * Field-level resolvers for Invoice type
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

/**
 * Invoice type resolvers
 * Handles field-level resolution for Invoice type
 */
export const Invoice = {
	/**
	 * Resolve breakdown field - convert JSON to array of InvoiceBreakdownItem
	 * @param {Object} parent - The Invoice object
	 * @returns {Array} - Array of breakdown items
	 */
	breakdown: (parent) => {
		if (Array.isArray(parent.breakdown)) {
			return parent.breakdown;
		}
		// If stored as JSON string, parse it
		if (typeof parent.breakdown === "string") {
			try {
				return JSON.parse(parent.breakdown);
			} catch (error) {
				console.error("Error parsing invoice breakdown:", error);
				return [];
			}
		}
		return [];
	},
	
	/**
	 * Calculate remaining amount to be paid
	 * @param {Object} parent - The Invoice object
	 * @returns {number} - Remaining amount (totalAmount - paidAmount)
	 */
	remainingAmount: (parent) => {
		const total = parent.totalAmount || 0;
		const paid = parent.paidAmount || 0;
		return Math.max(0, total - paid);
	},
};

/**
 * PriceChangeHistory type resolvers
 */
export const PriceChangeHistory = {
	// No special resolvers needed - all fields are direct
};

