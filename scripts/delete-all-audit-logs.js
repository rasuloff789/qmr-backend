/**
 * Script to delete all audit logs from the database
 * 
 * WARNING: This will permanently delete ALL audit logs!
 * 
 * Usage: node scripts/delete-all-audit-logs.js
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteAllAuditLogs() {
	try {
		console.log("🗑️  Starting audit log deletion...");

		// Count existing logs
		const count = await prisma.auditLog.count();
		console.log(`📊 Found ${count} audit log entries`);

		if (count === 0) {
			console.log("✅ No audit logs to delete");
			return;
		}

		// Delete all audit logs
		const result = await prisma.auditLog.deleteMany({});

		console.log(`✅ Successfully deleted ${result.count} audit log entries`);
		console.log("🎉 Audit log cleanup completed!");
	} catch (error) {
		console.error("❌ Error deleting audit logs:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// Run the script
deleteAllAuditLogs();

