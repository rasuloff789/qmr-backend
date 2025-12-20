/**
 * Script to clean database while preserving Root users
 * 
 * WARNING: This will permanently delete ALL data except Root users!
 * 
 * Usage: node scripts/clean-database.js
 * 
 * This script:
 * - Deletes all data from all tables except Root
 * - Resets auto-increment sequences
 * - Preserves Root user accounts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanDatabase() {
	try {
		console.log("🗑️  Starting database cleanup (preserving Root users)...");
		
		// Count records before deletion
		const counts = {
			root: await prisma.root.count(),
			admin: await prisma.admin.count(),
			teacher: await prisma.teacher.count(),
			student: await prisma.student.count(),
			degree: await prisma.degree.count(),
			course: await prisma.course.count(),
			courseStudent: await prisma.courseStudent.count(),
			attendance: await prisma.attendance.count(),
			substituteTeacher: await prisma.substituteTeacher.count(),
			invoice: await prisma.invoice.count(),
			priceChangeHistory: await prisma.priceChangeHistory.count(),
		};
		
		console.log("\n📊 Current database state:");
		console.log(`  Root users: ${counts.root}`);
		console.log(`  Admins: ${counts.admin}`);
		console.log(`  Teachers: ${counts.teacher}`);
		console.log(`  Students: ${counts.student}`);
		console.log(`  Degrees: ${counts.degree}`);
		console.log(`  Courses: ${counts.course}`);
		console.log(`  Enrollments: ${counts.courseStudent}`);
		console.log(`  Attendances: ${counts.attendance}`);
		console.log(`  Substitute Teachers: ${counts.substituteTeacher}`);
		console.log(`  Invoices: ${counts.invoice}`);
		console.log(`  Price Changes: ${counts.priceChangeHistory}`);
		
		// Delete in order to respect foreign key constraints
		console.log("\n🗑️  Deleting data...");
		
		// 1. Delete PriceChangeHistory (references CourseStudent)
		const priceChangesDeleted = await prisma.priceChangeHistory.deleteMany({});
		console.log(`  ✅ Deleted ${priceChangesDeleted.count} price change records`);
		
		// 2. Delete Invoices (references CourseStudent)
		const invoicesDeleted = await prisma.invoice.deleteMany({});
		console.log(`  ✅ Deleted ${invoicesDeleted.count} invoices`);
		
		// 3. Delete CourseStudent enrollments (references Course and Student)
		const enrollmentsDeleted = await prisma.courseStudent.deleteMany({});
		console.log(`  ✅ Deleted ${enrollmentsDeleted.count} enrollments`);
		
		// 4. Delete Attendances (references Course and Student)
		const attendancesDeleted = await prisma.attendance.deleteMany({});
		console.log(`  ✅ Deleted ${attendancesDeleted.count} attendance records`);
		
		// 5. Delete SubstituteTeachers (references Course and Teacher)
		const substitutesDeleted = await prisma.substituteTeacher.deleteMany({});
		console.log(`  ✅ Deleted ${substitutesDeleted.count} substitute teacher records`);
		
		// 6. Delete Courses (references Teacher and Degree)
		const coursesDeleted = await prisma.course.deleteMany({});
		console.log(`  ✅ Deleted ${coursesDeleted.count} courses`);
		
		// 7. Delete Students (references Degree)
		const studentsDeleted = await prisma.student.deleteMany({});
		console.log(`  ✅ Deleted ${studentsDeleted.count} students`);
		
		// 8. Delete Teachers (references Degree)
		const teachersDeleted = await prisma.teacher.deleteMany({});
		console.log(`  ✅ Deleted ${teachersDeleted.count} teachers`);
		
		// 9. Delete Degrees
		const degreesDeleted = await prisma.degree.deleteMany({});
		console.log(`  ✅ Deleted ${degreesDeleted.count} degrees`);
		
		// 10. Delete Admins
		const adminsDeleted = await prisma.admin.deleteMany({});
		console.log(`  ✅ Deleted ${adminsDeleted.count} admins`);
		
		// Root users are preserved - no deletion
		console.log(`  ✅ Preserved ${counts.root} root user(s)`);
		
		// Reset sequences for auto-increment IDs
		console.log("\n🔄 Resetting auto-increment sequences...");
		
		// Note: Prisma doesn't have direct sequence reset, so we use raw SQL
		await prisma.$executeRawUnsafe(`
			SELECT setval(pg_get_serial_sequence('"Admin"', 'id'), 1, false);
			SELECT setval(pg_get_serial_sequence('"Teacher"', 'id'), 1, false);
			SELECT setval(pg_get_serial_sequence('"Student"', 'id'), 1, false);
			SELECT setval(pg_get_serial_sequence('"Degree"', 'id'), 1, false);
			SELECT setval(pg_get_serial_sequence('"Course"', 'id'), 1, false);
			SELECT setval(pg_get_serial_sequence('"CourseStudent"', 'id'), 1, false);
			SELECT setval(pg_get_serial_sequence('"Attendance"', 'id'), 1, false);
			SELECT setval(pg_get_serial_sequence('"SubstituteTeacher"', 'id'), 1, false);
			SELECT setval(pg_get_serial_sequence('"Invoice"', 'id'), 1, false);
			SELECT setval(pg_get_serial_sequence('"PriceChangeHistory"', 'id'), 1, false);
		`);
		console.log("  ✅ Sequences reset");
		
		// Verify cleanup
		console.log("\n📊 Database state after cleanup:");
		const finalCounts = {
			root: await prisma.root.count(),
			admin: await prisma.admin.count(),
			teacher: await prisma.teacher.count(),
			student: await prisma.student.count(),
			degree: await prisma.degree.count(),
			course: await prisma.course.count(),
			courseStudent: await prisma.courseStudent.count(),
			attendance: await prisma.attendance.count(),
			substituteTeacher: await prisma.substituteTeacher.count(),
			invoice: await prisma.invoice.count(),
			priceChangeHistory: await prisma.priceChangeHistory.count(),
		};
		
		console.log(`  Root users: ${finalCounts.root} (preserved)`);
		console.log(`  Admins: ${finalCounts.admin}`);
		console.log(`  Teachers: ${finalCounts.teacher}`);
		console.log(`  Students: ${finalCounts.student}`);
		console.log(`  Degrees: ${finalCounts.degree}`);
		console.log(`  Courses: ${finalCounts.course}`);
		console.log(`  Enrollments: ${finalCounts.courseStudent}`);
		console.log(`  Attendances: ${finalCounts.attendance}`);
		console.log(`  Substitute Teachers: ${finalCounts.substituteTeacher}`);
		console.log(`  Invoices: ${finalCounts.invoice}`);
		console.log(`  Price Changes: ${finalCounts.priceChangeHistory}`);
		
		console.log("\n✅ Database cleanup completed successfully!");
		console.log("   Root users have been preserved.");
		
	} catch (error) {
		console.error("❌ Error cleaning database:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

// Run the script
cleanDatabase();

