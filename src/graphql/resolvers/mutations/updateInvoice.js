/**
 * QMR Backend - Update Invoice Mutation Resolver
 *
 * Manually update invoice total amount (for corrections).
 *
 * This is restricted to ROOT and financial admins via GraphQL Shield.
 */

import { prisma } from "../../../database/index.js";

/**
 * Manually update invoice total amount
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.invoiceId - Invoice ID
 * @param {number} args.totalAmount - New total amount
 * @param {Object} context - GraphQL context
 * @returns {Promise<Object>} - UpdateInvoiceResponse
 */
const updateInvoice = async (
	_parent,
	{ invoiceId, totalAmount },
	context
) => {
	try {
		// Basic validation
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

		// Ensure totalAmount is provided
		if (typeof totalAmount === "undefined" || totalAmount === null) {
			return {
				success: false,
				code: "INVOICE_MISSING_TOTAL",
				message: "Validation failed",
				invoice: null,
				errors: ["totalAmount is required"],
				timestamp: new Date().toISOString(),
			};
		}

		const parsedInvoiceId = parseInt(invoiceId);
		if (Number.isNaN(parsedInvoiceId)) {
			return {
				success: false,
				code: "INVOICE_INVALID_ID",
				message: "Validation failed",
				invoice: null,
				errors: ["Invoice ID must be a valid number"],
				timestamp: new Date().toISOString(),
			};
		}

		// Load existing invoice (with relations for return payload)
		const existingInvoice = await prisma.invoice.findUnique({
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

		if (!existingInvoice) {
			return {
				success: false,
				code: "INVOICE_NOT_FOUND",
				message: "Invoice not found",
				invoice: null,
				errors: [`Invoice with ID ${invoiceId} not found`],
				timestamp: new Date().toISOString(),
			};
		}

		const errors = [];

		// Normalize numeric fields
		const newTotalAmount = parseInt(totalAmount);
		const newPaidAmount = existingInvoice.paidAmount || 0;

		if (Number.isNaN(newTotalAmount)) {
			errors.push("totalAmount must be a valid integer");
		}

		if (newTotalAmount < 0) {
			errors.push("totalAmount cannot be negative");
		}
		if (newPaidAmount > newTotalAmount) {
			errors.push("paidAmount cannot exceed totalAmount");
		}

		// If we collected validation errors, abort before updating
		if (errors.length > 0) {
			return {
				success: false,
				code: "INVOICE_UPDATE_VALIDATION_FAILED",
				message: "Validation failed",
				invoice: existingInvoice,
				errors,
				timestamp: new Date().toISOString(),
			};
		}

		// Derive status from paid vs new total
		let newStatus = existingInvoice.status;
		if (newPaidAmount >= newTotalAmount) {
			newStatus = "PAID";
		} else if (newPaidAmount > 0) {
			newStatus = "PARTIALLY_PAID";
		} else {
			newStatus = "PENDING";
		}

		const data = {
			totalAmount: newTotalAmount,
			paidAmount: newPaidAmount,
			status: newStatus,
		};

		// Persist changes
		const updatedInvoice = await prisma.invoice.update({
			where: { id: parsedInvoiceId },
			data,
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
			message: "Invoice updated successfully",
			invoice: updatedInvoice,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Error updating invoice:", error);
		return {
			success: false,
			code: "INVOICE_UPDATE_FAILED",
			message: "Failed to update invoice",
			invoice: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { updateInvoice };

