/**
 * QMR Backend - Mark Invoice Paid Mutation Resolver
 *
 * Mark an invoice as paid
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../../../database/index.js";

/**
 * Mark invoice as paid
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.invoiceId - Invoice ID
 * @param {Object} context - GraphQL context
 * @returns {Promise<Object>} - MarkInvoicePaidResponse
 */
const markInvoicePaid = async (_parent, { invoiceId }, context) => {
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
		
		// Find invoice
		const invoice = await prisma.invoice.findUnique({
			where: { id: parsedInvoiceId },
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
		
		if (invoice.status === "PAID") {
			return {
				success: true,
				message: "Invoice is already marked as paid",
				invoice: invoice,
				errors: [],
				timestamp: new Date().toISOString(),
			};
		}
		
		if (invoice.status === "CANCELLED") {
			return {
				success: false,
				code: "INVOICE_CANCELLED",
				message: "Cannot mark cancelled invoice as paid",
				invoice: invoice,
				errors: ["Cancelled invoices cannot be marked as paid"],
				timestamp: new Date().toISOString(),
			};
		}
		
		// Update invoice status and set paidAmount to totalAmount
		const updatedInvoice = await prisma.invoice.update({
			where: { id: parsedInvoiceId },
			data: {
				status: "PAID",
				paidAmount: invoice.totalAmount, // Mark as fully paid
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
			message: "Invoice marked as paid successfully",
			invoice: updatedInvoice,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Error marking invoice as paid:", error);
		return {
			success: false,
			code: "INVOICE_UPDATE_FAILED",
			message: "Failed to mark invoice as paid",
			invoice: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { markInvoicePaid };

