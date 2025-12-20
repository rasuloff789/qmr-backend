/**
 * QMR Backend - Generate Invoices For Month Mutation Resolver
 *
 * Generate invoices for all active enrollments in a given month
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../../../database/index.js";
import { calculateMonthlyBilling } from "../../../utils/billing/calculateBilling.js";
import { generateInvoice, findExistingInvoice } from "../../../utils/billing/invoiceGenerator.js";

/**
 * Generate invoices for all active enrollments in a month
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {number} args.month - Billing month (1-12)
 * @param {number} args.year - Billing year
 * @param {Object} context - GraphQL context
 * @returns {Promise<Object>} - GenerateInvoicesForMonthResponse
 */
const generateInvoicesForMonth = async (_parent, { month, year }, context) => {
	try {
		// Input validation
		if (!month || !year) {
			return {
				success: false,
				code: "INVOICE_MISSING_FIELDS",
				message: "Validation failed",
				count: 0,
				invoices: [],
				errors: ["Month and year are required"],
				timestamp: new Date().toISOString(),
			};
		}
		
		if (month < 1 || month > 12) {
			return {
				success: false,
				code: "INVOICE_INVALID_MONTH",
				message: "Validation failed",
				count: 0,
				invoices: [],
				errors: ["Month must be between 1 and 12"],
				timestamp: new Date().toISOString(),
			};
		}
		
		// Find all active enrollments
		const enrollments = await prisma.courseStudent.findMany({
			where: {
				isActive: true,
				isDeleted: false,
			},
			include: {
				course: true,
				student: true,
				priceChanges: {
					orderBy: {
						changedAt: "asc",
					},
				},
			},
		});
		
		const generatedInvoices = [];
		const errors = [];
		
		// Generate invoice for each enrollment
		for (const enrollment of enrollments) {
			try {
				// Calculate billing
				const calculations = calculateMonthlyBilling(
					enrollment,
					month,
					year,
					enrollment.priceChanges
				);
				
				// Skip if no billable period
				if (calculations.totalAmount === 0) {
					continue;
				}
				
				// Check if invoice already exists
				const existingInvoice = await findExistingInvoice(
					enrollment.id,
					calculations.billingPeriodStart,
					calculations.billingPeriodEnd
				);
				
				if (existingInvoice) {
					continue; // Skip if already exists
				}
				
				// Generate invoice
				const invoice = await generateInvoice(enrollment, month, year, calculations);
				generatedInvoices.push(invoice);
			} catch (error) {
				console.error(`Error generating invoice for enrollment ${enrollment.id}:`, error);
				errors.push(`Failed to generate invoice for enrollment ${enrollment.id}: ${error.message}`);
			}
		}
		
		return {
			success: true,
			message: `Generated ${generatedInvoices.length} invoices for ${month}/${year}`,
			count: generatedInvoices.length,
			invoices: generatedInvoices,
			errors: errors,
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Error generating invoices for month:", error);
		return {
			success: false,
			code: "INVOICE_BULK_GENERATION_FAILED",
			message: "Failed to generate invoices",
			count: 0,
			invoices: [],
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { generateInvoicesForMonth };

