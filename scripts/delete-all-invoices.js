/**
 * Script to delete all invoices from the database
 * 
 * Usage: 
 *   Preview: node scripts/delete-all-invoices.js
 *   Delete:  node scripts/delete-all-invoices.js --apply
 * 
 * WARNING: This will permanently delete ALL invoices from the database!
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
	log: ["warn", "error"],
});

/**
 * Delete all invoices from the database
 * @param {boolean} dryRun - If true, only preview without deleting
 */
async function deleteAllInvoices(dryRun = true) {
	try {
		console.log("🗑️  Analyzing invoices...\n");

		// Get all invoices with related data for preview
		const allInvoices = await prisma.invoice.findMany({
			include: {
				courseStudent: {
					include: {
						student: {
							select: {
								id: true,
								fullname: true,
								username: true,
							},
						},
						course: {
							select: {
								id: true,
								name: true,
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
			console.log("✅ No invoices found to delete.");
			return;
		}

		console.log(`📊 Found ${allInvoices.length} invoice(s)\n`);

		// Calculate statistics
		const totalAmount = allInvoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
		const totalPaid = allInvoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
		const totalDebt = totalAmount - totalPaid;

		const statusCounts = {
			PENDING: allInvoices.filter((inv) => inv.status === "PENDING").length,
			PARTIALLY_PAID: allInvoices.filter((inv) => inv.status === "PARTIALLY_PAID").length,
			PAID: allInvoices.filter((inv) => inv.status === "PAID").length,
			CANCELLED: allInvoices.filter((inv) => inv.status === "CANCELLED").length,
		};

		// Show summary
		console.log("📋 Summary of invoices to be deleted:");
		console.log("=".repeat(100));
		console.log(`   Total invoices: ${allInvoices.length}`);
		console.log(`   Total amount: ${totalAmount.toLocaleString()} UZS`);
		console.log(`   Total paid: ${totalPaid.toLocaleString()} UZS`);
		console.log(`   Total debt: ${totalDebt.toLocaleString()} UZS`);
		console.log(`\n   By status:`);
		console.log(`     PENDING: ${statusCounts.PENDING}`);
		console.log(`     PARTIALLY_PAID: ${statusCounts.PARTIALLY_PAID}`);
		console.log(`     PAID: ${statusCounts.PAID}`);
		console.log(`     CANCELLED: ${statusCounts.CANCELLED}`);

		// Show sample invoices (first 10)
		console.log("\n📋 Sample invoices (first 10):");
		console.log("=".repeat(100));

		const preview = allInvoices.slice(0, 10);
		for (const invoice of preview) {
			const periodStart = new Date(invoice.billingPeriodStart).toLocaleDateString("en-GB");
			const periodEnd = new Date(invoice.billingPeriodEnd).toLocaleDateString("en-GB");
			console.log(`\n  Invoice ID: ${invoice.id}`);
			console.log(`  Student: ${invoice.courseStudent.student.fullname}`);
			console.log(`  Course: ${invoice.courseStudent.course.name}`);
			console.log(`  Period: ${periodStart} - ${periodEnd}`);
			console.log(`  Amount: ${invoice.totalAmount.toLocaleString()} UZS`);
			console.log(`  Paid: ${invoice.paidAmount.toLocaleString()} UZS`);
			console.log(`  Status: ${invoice.status}`);
		}

		if (allInvoices.length > 10) {
			console.log(`\n  ... and ${allInvoices.length - 10} more invoice(s)`);
		}

		console.log("\n" + "=".repeat(100));

		if (dryRun) {
			console.log("\n⚠️  DRY RUN MODE - No invoices were deleted");
			console.log("   To actually delete all invoices, run with: node scripts/delete-all-invoices.js --apply");
			console.log("\n⚠️  WARNING: This action cannot be undone!\n");
			return;
		}

		// Confirm before proceeding
		console.log("\n⚠️  WARNING: This will PERMANENTLY DELETE ALL INVOICES!");
		console.log(`   Total invoices: ${allInvoices.length}`);
		console.log(`   Total amount: ${totalAmount.toLocaleString()} UZS`);
		console.log(`   Total debt: ${totalDebt.toLocaleString()} UZS`);
		console.log("\n   This action cannot be undone!\n");

		// Perform deletion
		console.log("🗑️  Deleting invoices...\n");

		const result = await prisma.invoice.deleteMany({});

		console.log("✅ Deletion completed!");
		console.log(`   Deleted ${result.count} invoice(s)`);

		// Verify deletion
		const remainingCount = await prisma.invoice.count();
		console.log(`   Remaining invoices: ${remainingCount}`);

		if (remainingCount === 0) {
			console.log("\n🎉 All invoices have been successfully deleted!\n");
		} else {
			console.log(`\n⚠️  Warning: ${remainingCount} invoice(s) still remain in the database\n`);
		}

	} catch (error) {
		console.error("❌ Error deleting invoices:", error);
		throw error;
	}
}

async function main() {
	const args = process.argv.slice(2);
	const applyChanges = args.includes("--apply");

	try {
		await deleteAllInvoices(!applyChanges);
	} catch (error) {
		console.error("❌ Script failed:", error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();

