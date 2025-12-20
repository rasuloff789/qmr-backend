/**
 * Script to delete all invoices from the database
 * 
 * Usage: node scripts/delete-all-invoices.js
 * 
 * WARNING: This will permanently delete ALL invoices from the database!
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteAllInvoices() {
	try {
		console.log("🗑️  Starting invoice deletion...");
		
		// Count invoices before deletion
		const count = await prisma.invoice.count();
		console.log(`📊 Found ${count} invoice(s) to delete`);
		
		if (count === 0) {
			console.log("✅ No invoices to delete");
			await prisma.$disconnect();
			return;
		}
		
		// Delete all invoices
		const result = await prisma.invoice.deleteMany({});
		
		console.log(`✅ Successfully deleted ${result.count} invoice(s)`);
		
		// Verify deletion
		const remainingCount = await prisma.invoice.count();
		console.log(`📊 Remaining invoices: ${remainingCount}`);
		
	} catch (error) {
		console.error("❌ Error deleting invoices:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// Run the script
deleteAllInvoices();

