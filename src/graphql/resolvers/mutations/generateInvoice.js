/**
 * QMR Backend - Generate Invoice Mutation Resolver
 *
 * Generate an invoice for a specific enrollment and month
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../../../database/index.js";
import { calculateMonthlyBilling } from "../../../utils/billing/calculateBilling.js";
import { generateInvoice, findExistingInvoice } from "../../../utils/billing/invoiceGenerator.js";

/**
 * Generate invoice for a course enrollment
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.courseStudentId - Course enrollment ID
 * @param {number} args.month - Billing month (1-12)
 * @param {number} args.year - Billing year
 * @param {Object} context - GraphQL context
 * @returns {Promise<Object>} - GenerateInvoiceResponse
 */
const generateInvoiceMutation = async (_parent, { courseStudentId, month, year }, context) => {
	try {
		// Input validation
		if (!courseStudentId || !month || !year) {
			return {
				success: false,
				code: "INVOICE_MISSING_FIELDS",
				message: "Validation failed",
				invoice: null,
				errors: ["Course enrollment ID, month, and year are required"],
				timestamp: new Date().toISOString(),
			};
		}
		
		if (month < 1 || month > 12) {
			return {
				success: false,
				code: "INVOICE_INVALID_MONTH",
				message: "Validation failed",
				invoice: null,
				errors: ["Month must be between 1 and 12"],
				timestamp: new Date().toISOString(),
			};
		}
		
		const parsedCourseStudentId = parseInt(courseStudentId);
		
		// Fetch enrollment with course and price history
		const courseStudent = await prisma.courseStudent.findUnique({
			where: { id: parsedCourseStudentId },
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
		
		if (!courseStudent) {
			return {
				success: false,
				code: "ENROLLMENT_NOT_FOUND",
				message: "Course enrollment not found",
				invoice: null,
				errors: [`Enrollment with ID ${courseStudentId} not found`],
				timestamp: new Date().toISOString(),
			};
		}
		
		if (!courseStudent.isActive || courseStudent.isDeleted) {
			return {
				success: false,
				code: "ENROLLMENT_INACTIVE",
				message: "Enrollment is not active",
				invoice: null,
				errors: ["Cannot generate invoice for inactive or deleted enrollment"],
				timestamp: new Date().toISOString(),
			};
		}
		
		// Calculate billing
		const calculations = calculateMonthlyBilling(
			courseStudent,
			month,
			year,
			courseStudent.priceChanges
		);
		
		if (calculations.totalAmount === 0) {
			return {
				success: false,
				code: "INVOICE_NO_BILLABLE_PERIOD",
				message: "No billable period",
				invoice: null,
				errors: ["No billable days in the specified period"],
				timestamp: new Date().toISOString(),
			};
		}
		
		// Check if invoice already exists for this period
		const existingInvoice = await findExistingInvoice(
			parsedCourseStudentId,
			calculations.billingPeriodStart,
			calculations.billingPeriodEnd
		);
		
		if (existingInvoice) {
			return {
				success: false,
				code: "INVOICE_ALREADY_EXISTS",
				message: "Invoice already exists for this period",
				invoice: existingInvoice,
				errors: [`Invoice with ID ${existingInvoice.id} already exists for this billing period`],
				timestamp: new Date().toISOString(),
			};
		}
		
		// Generate invoice
		const invoice = await generateInvoice(courseStudent, month, year, calculations);
		
		return {
			success: true,
			message: "Invoice generated successfully",
			invoice: invoice,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Error generating invoice:", error);
		return {
			success: false,
			code: "INVOICE_GENERATION_FAILED",
			message: "Failed to generate invoice",
			invoice: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { generateInvoiceMutation as generateInvoice };

