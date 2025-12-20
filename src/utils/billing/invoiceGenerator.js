/**
 * QMR Backend - Invoice Generator Utilities
 *
 * Utilities for creating and formatting invoice records
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../../database/index.js";
import { calculateMonthlyBilling } from "./calculateBilling.js";

/**
 * Format invoice breakdown for JSON storage
 * @param {Array} periods - Array of billing periods from calculateMonthlyBilling
 * @returns {Array} - Formatted breakdown array
 */
export function formatInvoiceBreakdown(periods) {
	return periods.map((period) => ({
		start: period.start.toISOString(),
		end: period.end.toISOString(),
		price: period.price,
		days: period.days,
		amount: period.amount,
	}));
}

/**
 * Generate invoice for a course enrollment
 * @param {Object} courseStudent - CourseStudent record
 * @param {number} month - Target month (1-12)
 * @param {number} year - Target year
 * @param {Object} calculations - Billing calculation result from calculateMonthlyBilling
 * @returns {Promise<Object>} - Created invoice record
 */
export async function generateInvoice(courseStudent, month, year, calculations) {
	// Invoice date is the 1st of the month AFTER the billing period
	// month is 1-12, Date constructor uses 0-11, so month already represents next month
	const nextMonth = month === 12 ? 1 : month + 1;
	const nextYear = month === 12 ? year + 1 : year;
	const invoiceDate = new Date(nextYear, nextMonth - 1, 1); // Convert back to 0-11 for Date
	invoiceDate.setHours(0, 0, 0, 0);
	
	const breakdown = formatInvoiceBreakdown(calculations.periods);
	
	const invoice = await prisma.invoice.create({
		data: {
			courseStudentId: courseStudent.id,
			billingPeriodStart: calculations.billingPeriodStart,
			billingPeriodEnd: calculations.billingPeriodEnd,
			invoiceDate: invoiceDate,
			totalAmount: calculations.totalAmount,
			daysInPeriod: calculations.daysInPeriod,
			dailyRate: calculations.dailyRate,
			breakdown: breakdown,
			status: "PENDING",
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
	
	// Update lastBilledDate on CourseStudent
	await prisma.courseStudent.update({
		where: { id: courseStudent.id },
		data: { lastBilledDate: calculations.billingPeriodEnd },
	});
	
	return invoice;
}

/**
 * Check if invoice already exists for a period
 * @param {number} courseStudentId - CourseStudent ID
 * @param {Date} periodStart - Billing period start
 * @param {Date} periodEnd - Billing period end
 * @returns {Promise<Object|null>} - Existing invoice or null
 */
export async function findExistingInvoice(courseStudentId, periodStart, periodEnd) {
	return await prisma.invoice.findFirst({
		where: {
			courseStudentId: courseStudentId,
			billingPeriodStart: periodStart,
			billingPeriodEnd: periodEnd,
		},
	});
}

