import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
	log: ["warn", "error"],
});

// Target date: 01.12.2025 (December 1, 2025)
// Note: JavaScript Date months are 0-indexed, so December is 11
const TARGET_DATE = new Date("2025-12-01T00:00:00.000Z");

/**
 * Update all student enrollments' joinedAt date to 01.12.2025
 */
async function updateEnrollmentsJoinedDate(dryRun = true) {
	try {
		console.log("🔍 Analyzing student enrollments...\n");

		// First, get all enrollments (excluding deleted ones)
		const allEnrollments = await prisma.courseStudent.findMany({
			where: {
				isDeleted: false,
			},
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
			orderBy: {
				id: "asc",
			},
		});

		if (allEnrollments.length === 0) {
			console.log("✅ No active enrollments found.");
			return;
		}

		console.log(`📊 Found ${allEnrollments.length} active enrollment(s)\n`);

		// Show preview of what will be changed
		const enrollmentsToUpdate = allEnrollments.filter(
			(enrollment) => enrollment.joinedAt.getTime() !== TARGET_DATE.getTime()
		);

		if (enrollmentsToUpdate.length === 0) {
			console.log("✅ All enrollments already have joinedAt set to 01.12.2025");
			return;
		}

		console.log(`📝 ${enrollmentsToUpdate.length} enrollment(s) will be updated\n`);

		// Show sample of changes
		console.log("📋 Preview of changes (first 10):");
		console.log("=".repeat(100));

		const preview = enrollmentsToUpdate.slice(0, 10);
		for (const enrollment of preview) {
			const oldDate = new Date(enrollment.joinedAt).toLocaleDateString("en-GB");
			const newDate = new Date(TARGET_DATE).toLocaleDateString("en-GB");
			console.log(
				`\n  Student: ${enrollment.student.fullname} (${enrollment.student.username})`
			);
			console.log(`  Course: ${enrollment.course.name}`);
			console.log(`  Enrollment ID: ${enrollment.id}`);
			console.log(`  Current joinedAt: ${oldDate}`);
			console.log(`  New joinedAt: ${newDate}`);
		}

		if (enrollmentsToUpdate.length > 10) {
			console.log(`\n  ... and ${enrollmentsToUpdate.length - 10} more enrollment(s)`);
		}

		console.log("\n" + "=".repeat(100));

		if (dryRun) {
			console.log("\n⚠️  DRY RUN MODE - No changes were made");
			console.log("   To apply changes, run with: node scripts/update-enrollments-joined-date.js --apply\n");
			return;
		}

		// Confirm before proceeding
		console.log("\n⚠️  WARNING: This will update ALL active enrollments!");
		console.log(`   Target date: ${TARGET_DATE.toLocaleDateString("en-GB")}`);
		console.log(`   Total enrollments to update: ${enrollmentsToUpdate.length}\n`);

		// Perform the update
		console.log("🔄 Updating enrollments...\n");

		const updateResult = await prisma.courseStudent.updateMany({
			where: {
				isDeleted: false,
			},
			data: {
				joinedAt: TARGET_DATE,
			},
		});

		console.log("✅ Update completed!");
		console.log(`   Updated ${updateResult.count} enrollment(s)`);

		// Verify the update
		const verifyEnrollments = await prisma.courseStudent.findMany({
			where: {
				isDeleted: false,
				joinedAt: TARGET_DATE,
			},
			select: {
				id: true,
			},
		});

		console.log(`   Verified: ${verifyEnrollments.length} enrollment(s) now have joinedAt = 01.12.2025\n`);

		// Show summary by course
		const enrollmentsByCourse = await prisma.courseStudent.groupBy({
			by: ["courseId"],
			where: {
				isDeleted: false,
				joinedAt: TARGET_DATE,
			},
			_count: {
				id: true,
			},
		});

		if (enrollmentsByCourse.length > 0) {
			console.log("📊 Summary by course:");
			for (const group of enrollmentsByCourse) {
				const course = await prisma.course.findUnique({
					where: { id: group.courseId },
					select: { name: true },
				});
				console.log(`   ${course?.name || `Course ID ${group.courseId}`}: ${group._count.id} enrollment(s)`);
			}
		}

	} catch (error) {
		console.error("❌ Error updating enrollments:", error);
		throw error;
	}
}

async function main() {
	const args = process.argv.slice(2);
	const applyChanges = args.includes("--apply");

	try {
		await updateEnrollmentsJoinedDate(!applyChanges);
	} catch (error) {
		console.error("❌ Script failed:", error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();

