import { PrismaClient } from "@prisma/client";
import { calculateMonthlyBilling } from "../src/utils/billing/calculateBilling.js";
import { formatInvoiceBreakdown } from "../src/utils/billing/invoiceGenerator.js";

const prisma = new PrismaClient({
	log: ["warn", "error"],
});

/**
 * Recalculate all invoices in the database
 */
async function recalculateAllInvoices(dryRun = true) {
	try {
		console.log("🔍 Analyzing invoices...\n");

		// Get all invoices with their related data
		const allInvoices = await prisma.invoice.findMany({
			include: {
				courseStudent: {
					include: {
						course: true,
						student: {
							select: {
								id: true,
								fullname: true,
								username: true,
							},
						},
						priceChanges: {
							orderBy: {
								changedAt: "asc",
							},
						},
					},
				},
			},
			orderBy: {
				id: "asc",
			},
		});

		if (allInvoices.length === 0) {
			console.log("✅ No invoices found.");
			return;
		}

		console.log(`📊 Found ${allInvoices.length} invoice(s)\n`);

		// Track changes
		const changes = [];
		const errors = [];
		let totalAmountDifference = 0;

		// Process each invoice
		for (let i = 0; i < allInvoices.length; i++) {
			const invoice = allInvoices[i];
			const invoiceNum = i + 1;

			try {
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

				// Compare old vs new values
				const oldTotal = invoice.totalAmount;
				const newTotal = calculations.totalAmount;
				const amountDiff = newTotal - oldTotal;

				const oldDays = invoice.daysInPeriod;
				const newDays = calculations.daysInPeriod;

				const oldDailyRate = invoice.dailyRate;
				const newDailyRate = calculations.dailyRate;

				const hasChanges =
					oldTotal !== newTotal ||
					oldDays !== newDays ||
					Math.abs(oldDailyRate - newDailyRate) > 0.01; // Allow small floating point differences

				if (hasChanges || !dryRun) {
					changes.push({
						invoiceId: invoice.id,
						student: invoice.courseStudent.student.fullname,
						course: invoice.courseStudent.course.name,
						billingPeriod: `${periodStart.toLocaleDateString("en-GB")}`,
						oldTotal,
						newTotal,
						amountDiff,
						oldDays,
						newDays,
						oldDailyRate,
						newDailyRate,
					});

					totalAmountDifference += amountDiff;

					if (!dryRun) {
						// Update invoice
						const breakdown = formatInvoiceBreakdown(calculations.periods);

						await prisma.invoice.update({
							where: { id: invoice.id },
							data: {
								totalAmount: calculations.totalAmount,
								daysInPeriod: calculations.daysInPeriod,
								dailyRate: calculations.dailyRate,
								breakdown: breakdown,
							},
						});
					}
				}

				// Show progress
				if ((invoiceNum % 10 === 0) || invoiceNum === allInvoices.length) {
					process.stdout.write(`\r   Processing: ${invoiceNum}/${allInvoices.length} invoices...`);
				}
			} catch (error) {
				errors.push({
					invoiceId: invoice.id,
					student: invoice.courseStudent?.student?.fullname || "Unknown",
					course: invoice.courseStudent?.course?.name || "Unknown",
					error: error.message,
				});
				console.error(`\n❌ Error processing invoice ${invoice.id}:`, error.message);
			}
		}

		console.log("\n"); // New line after progress

		// Show summary
		console.log("=".repeat(100));
		console.log("\n📊 Summary:");
		console.log(`   Total invoices processed: ${allInvoices.length}`);
		console.log(`   Invoices with changes: ${changes.length}`);
		console.log(`   Errors: ${errors.length}`);

		if (changes.length > 0) {
			const totalIncrease = changes
				.filter((c) => c.amountDiff > 0)
				.reduce((sum, c) => sum + c.amountDiff, 0);
			const totalDecrease = changes
				.filter((c) => c.amountDiff < 0)
				.reduce((sum, c) => sum + Math.abs(c.amountDiff), 0);

			console.log(`\n💰 Amount Changes:`);
			console.log(`   Total increase: ${totalIncrease.toLocaleString()} UZS`);
			console.log(`   Total decrease: ${totalDecrease.toLocaleString()} UZS`);
			console.log(`   Net change: ${totalAmountDifference.toLocaleString()} UZS`);
		}

		// Show detailed changes (first 20)
		if (changes.length > 0) {
			console.log("\n📋 Detailed Changes (showing first 20):");
			console.log("=".repeat(100));

			const preview = changes.slice(0, 20);
			for (const change of preview) {
				console.log(`\n  Invoice ID: ${change.invoiceId}`);
				console.log(`  Student: ${change.student}`);
				console.log(`  Course: ${change.course}`);
				console.log(`  Period: ${change.billingPeriod}`);
				console.log(`  Old Total: ${change.oldTotal.toLocaleString()} UZS`);
				console.log(`  New Total: ${change.newTotal.toLocaleString()} UZS`);
				console.log(
					`  Change: ${change.amountDiff >= 0 ? "+" : ""}${change.amountDiff.toLocaleString()} UZS`
				);
				if (change.oldDays !== change.newDays) {
					console.log(`  Days: ${change.oldDays} → ${change.newDays}`);
				}
				if (Math.abs(change.oldDailyRate - change.newDailyRate) > 0.01) {
					console.log(
						`  Daily Rate: ${change.oldDailyRate.toFixed(2)} → ${change.newDailyRate.toFixed(2)} UZS`
					);
				}
			}

			if (changes.length > 20) {
				console.log(`\n  ... and ${changes.length - 20} more invoice(s) with changes`);
			}
		}

		// Show errors
		if (errors.length > 0) {
			console.log("\n\n❌ Errors:");
			console.log("=".repeat(100));
			for (const error of errors) {
				console.log(`\n  Invoice ID: ${error.invoiceId}`);
				console.log(`  Student: ${error.student}`);
				console.log(`  Course: ${error.course}`);
				console.log(`  Error: ${error.error}`);
			}
		}

		if (dryRun) {
			console.log("\n\n⚠️  DRY RUN MODE - No changes were made");
			console.log("   To apply changes, run with: node scripts/recalculate-all-invoices.js --apply\n");
		} else {
			console.log("\n\n✅ Recalculation completed!");
			console.log(`   Updated ${changes.length} invoice(s)\n`);
		}

		// Export summary data
		if (changes.length > 0) {
			const summaryData = {
				totalInvoices: allInvoices.length,
				invoicesWithChanges: changes.length,
				errors: errors.length,
				totalAmountDifference,
				changes: changes.map((c) => ({
					invoiceId: c.invoiceId,
					student: c.student,
					course: c.course,
					billingPeriod: c.billingPeriod,
					oldTotal: c.oldTotal,
					newTotal: c.newTotal,
					amountDiff: c.amountDiff,
					oldDays: c.oldDays,
					newDays: c.newDays,
					oldDailyRate: c.oldDailyRate,
					newDailyRate: c.newDailyRate,
				})),
				errors: errors,
			};

			console.log("💾 Summary JSON (copy this if needed):");
			console.log(JSON.stringify(summaryData, null, 2));
		}

	} catch (error) {
		console.error("❌ Error recalculating invoices:", error);
		throw error;
	}
}

async function main() {
	const args = process.argv.slice(2);
	const applyChanges = args.includes("--apply");

	try {
		await recalculateAllInvoices(!applyChanges);
	} catch (error) {
		console.error("❌ Script failed:", error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();

