/**
 * QMR Backend - Add Partial Payment Mutation Resolver
 *
 * Record a partial payment on an invoice
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../../../database/index.js";

/**
 * Add partial payment to an invoice
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.invoiceId - Invoice ID
 * @param {number} args.amount - Payment amount to add
 * @param {Object} context - GraphQL context
 * @returns {Promise<Object>} - AddPartialPaymentResponse
 */
const addPartialPayment = async (_parent, { invoiceId, amount }, context) => {
	try {
		// Input validation
		if (!invoiceId || !amount) {
			return {
				success: false,
				code: "PAYMENT_MISSING_FIELDS",
				message: "Validation failed",
				invoice: null,
				errors: ["Invoice ID and payment amount are required"],
				timestamp: new Date().toISOString(),
			};
		}
		
		if (amount <= 0) {
			return {
				success: false,
				code: "PAYMENT_INVALID_AMOUNT",
				message: "Validation failed",
				invoice: null,
				errors: ["Payment amount must be a positive number"],
				timestamp: new Date().toISOString(),
			};
		}
		
		const parsedInvoiceId = parseInt(invoiceId);
		const paymentAmount = parseInt(amount);
		
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
		
		if (invoice.status === "CANCELLED") {
			return {
				success: false,
				code: "INVOICE_CANCELLED",
				message: "Cannot add payment to cancelled invoice",
				invoice: invoice,
				errors: ["Cancelled invoices cannot receive payments"],
				timestamp: new Date().toISOString(),
			};
		}
		
		const currentPaid = invoice.paidAmount || 0;
		const newPaidAmount = currentPaid + paymentAmount;
		
		// Check if payment exceeds total amount
		if (newPaidAmount > invoice.totalAmount) {
			return {
				success: false,
				code: "PAYMENT_EXCEEDS_TOTAL",
				message: "Payment exceeds total amount",
				invoice: invoice,
				errors: [
					`Payment amount (${paymentAmount}) would exceed total amount (${invoice.totalAmount}). Current paid: ${currentPaid}, Remaining: ${invoice.totalAmount - currentPaid}`,
				],
				timestamp: new Date().toISOString(),
			};
		}
		
		// Determine new status based on payment amount
		let newStatus = invoice.status;
		if (newPaidAmount >= invoice.totalAmount) {
			newStatus = "PAID";
		} else if (newPaidAmount > 0) {
			newStatus = "PARTIALLY_PAID";
		} else {
			newStatus = "PENDING";
		}
		
		// Update invoice with payment
		const updatedInvoice = await prisma.invoice.update({
			where: { id: parsedInvoiceId },
			data: {
				paidAmount: newPaidAmount,
				status: newStatus,
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
			message: `Payment of ${paymentAmount.toLocaleString()} UZS recorded. Total paid: ${newPaidAmount.toLocaleString()} UZS, Remaining: ${(invoice.totalAmount - newPaidAmount).toLocaleString()} UZS`,
			invoice: updatedInvoice,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Error adding partial payment:", error);
		return {
			success: false,
			code: "PAYMENT_UPDATE_FAILED",
			message: "Failed to record partial payment",
			invoice: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { addPartialPayment };

