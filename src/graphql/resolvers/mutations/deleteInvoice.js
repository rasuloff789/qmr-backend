/**
 * QMR Backend - Delete Invoice Mutation Resolver
 *
 * Delete an invoice from the database
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../../../database/index.js";

/**
 * Delete an invoice
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.invoiceId - Invoice ID
 * @param {Object} context - GraphQL context
 * @returns {Promise<Object>} - DeleteInvoiceResponse
 */
const deleteInvoice = async (_parent, { invoiceId }, context) => {
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
			return {
				success: false,
				code: "INVOICE_NOT_FOUND",
				message: "Invoice not found",
				invoice: null,
				errors: [`Invoice with ID ${invoiceId} not found`],
				timestamp: new Date().toISOString(),
			};
		}
		
		// Delete invoice
		await prisma.invoice.delete({
			where: { id: parsedInvoiceId },
		});
		
		return {
			success: true,
			message: "Invoice deleted successfully",
			invoice: invoice,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Error deleting invoice:", error);
		return {
			success: false,
			code: "INVOICE_DELETE_FAILED",
			message: "Failed to delete invoice",
			invoice: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { deleteInvoice };

