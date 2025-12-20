/**
 * QMR Backend - Recalculate Invoice Mutation Resolver
 *
 * Recalculate an existing invoice
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../../../database/index.js";
import { calculateMonthlyBilling } from "../../../utils/billing/calculateBilling.js";
import { formatInvoiceBreakdown } from "../../../utils/billing/invoiceGenerator.js";

/**
 * Recalculate an existing invoice
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.invoiceId - Invoice ID
 * @param {Object} context - GraphQL context
 * @returns {Promise<Object>} - RecalculateInvoiceResponse
 */
const recalculateInvoice = async (_parent, { invoiceId }, context) => {
	try {
		// Input validation
		if (!invoiceId) {
			return {
				success: false,
				code: "INVOICE_MISSING_ID",
				message: "Validation failed",
				invoice: null,
				errors: ["Invoice ID is required"],
				timestamp: new Date().toISOString(),
			};
		}
		
		const parsedInvoiceId = parseInt(invoiceId);
		
		// Find invoice with enrollment data
		const invoice = await prisma.invoice.findUnique({
			where: { id: parsedInvoiceId },
			include: {
				courseStudent: {
					include: {
						course: true,
						student: true,
						priceChanges: {
							orderBy: {
								changedAt: "asc",
							},
						},
					},
				},
			},
		});
		
		if (!invoice) {
			return {
				success: false,
				code: "INVOICE_NOT_FOUND",
				message: "Invoice not found",
				invoice: null,
				errors: [`Invoice with ID ${invoiceId} not found`],
				timestamp: new Date().toISOString(),
			};
		}
		
		// Extract month and year from billing period
		const periodStart = new Date(invoice.billingPeriodStart);
		const month = periodStart.getMonth() + 1;
		const year = periodStart.getFullYear();
		
		// Recalculate billing
		const calculations = calculateMonthlyBilling(
			invoice.courseStudent,
			month,
			year,
			invoice.courseStudent.priceChanges
		);
		
		// Update invoice with new calculations
		const breakdown = formatInvoiceBreakdown(calculations.periods);
		
		const updatedInvoice = await prisma.invoice.update({
			where: { id: parsedInvoiceId },
			data: {
				totalAmount: calculations.totalAmount,
				daysInPeriod: calculations.daysInPeriod,
				dailyRate: calculations.dailyRate,
				breakdown: breakdown,
			},
			include: {
				courseStudent: {
					include: {
						course: true,
						student: true,
					},
				},
			},
		});
		
		return {
			success: true,
			message: "Invoice recalculated successfully",
			invoice: updatedInvoice,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Error recalculating invoice:", error);
		return {
			success: false,
			code: "INVOICE_RECALCULATION_FAILED",
			message: "Failed to recalculate invoice",
			invoice: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { recalculateInvoice };

