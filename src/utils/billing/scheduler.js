/**
 * QMR Backend - Invoice Generation Scheduler
 *
 * Automatic invoice generation using cron jobs
 * Runs on the 1st of each month to generate invoices for the previous month
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { schedule } from "node-cron";
import { prisma } from "../../database/index.js";
import { calculateMonthlyBilling } from "./calculateBilling.js";
import { generateInvoice, findExistingInvoice } from "./invoiceGenerator.js";

/**
 * Generate invoices for the previous month
 * Called automatically on the 1st of each month
 */
async function generatePreviousMonthInvoices() {
	try {
		const now = new Date();
		const previousMonth = now.getMonth(); // Current month (0-indexed)
		const previousYear = now.getFullYear();
		
		// If we're in January, previous month is December of last year
		const targetMonth = previousMonth === 0 ? 12 : previousMonth;
		const targetYear = previousMonth === 0 ? previousYear - 1 : previousYear;
		
		console.log(`📅 Starting automatic invoice generation for ${targetMonth}/${targetYear}`);
		
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
		
		let generatedCount = 0;
		let skippedCount = 0;
		const errors = [];
		
		// Generate invoice for each enrollment
		for (const enrollment of enrollments) {
			try {
				// Calculate billing
				const calculations = calculateMonthlyBilling(
					enrollment,
					targetMonth,
					targetYear,
					enrollment.priceChanges
				);
				
				// Skip if no billable period
				if (calculations.totalAmount === 0) {
					skippedCount++;
					continue;
				}
				
				// Check if invoice already exists
				const existingInvoice = await findExistingInvoice(
					enrollment.id,
					calculations.billingPeriodStart,
					calculations.billingPeriodEnd
				);
				
				if (existingInvoice) {
					skippedCount++;
					continue;
				}
				
				// Generate invoice
				await generateInvoice(enrollment, targetMonth, targetYear, calculations);
				generatedCount++;
			} catch (error) {
				console.error(`Error generating invoice for enrollment ${enrollment.id}:`, error);
				errors.push(`Enrollment ${enrollment.id}: ${error.message}`);
			}
		}
		
		console.log(`✅ Invoice generation completed: ${generatedCount} generated, ${skippedCount} skipped`);
		if (errors.length > 0) {
			console.error(`⚠️ Errors occurred: ${errors.length}`, errors);
		}
		
		return {
			success: true,
			generated: generatedCount,
			skipped: skippedCount,
			errors: errors,
		};
	} catch (error) {
		console.error("❌ Error in automatic invoice generation:", error);
		return {
			success: false,
			generated: 0,
			skipped: 0,
			errors: [error.message],
		};
	}
}

/**
 * Initialize the invoice generation scheduler
 * Runs on the 1st of each month at 00:00
 */
export function initializeInvoiceScheduler() {
	// Schedule: Run on the 1st of each month at 00:00
	// Cron format: minute hour day month day-of-week
	// "0 0 1 * *" = At 00:00 on day 1 of every month
	const cronExpression = "0 0 1 * *";
	
	const task = schedule(cronExpression, async () => {
		console.log("🔄 Scheduled invoice generation triggered");
		await generatePreviousMonthInvoices();
	}, {
		scheduled: true,
		timezone: "Asia/Tashkent", // Adjust timezone as needed
	});
	
	console.log("✅ Invoice generation scheduler initialized (runs on 1st of each month at 00:00)");
	
	return task;
}

/**
 * Manually trigger invoice generation (for testing or manual runs)
 */
export async function triggerInvoiceGeneration() {
	return await generatePreviousMonthInvoices();
}

