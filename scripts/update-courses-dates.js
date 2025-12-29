import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
	log: ["warn", "error"],
});

// Target date: 01.12.2025 (December 1, 2025)
// Note: JavaScript Date months are 0-indexed, so December is 11
const TARGET_START_DATE = new Date("2025-12-01T00:00:00.000Z");

/**
 * Update all courses' startAt to 01.12.2025 and endAt to null
 */
async function updateCoursesDates(dryRun = true) {
	try {
		console.log("🔍 Analyzing courses...\n");

		// Get all courses
		const allCourses = await prisma.course.findMany({
			include: {
				teacher: {
					select: {
						id: true,
						fullname: true,
						username: true,
					},
				},
			},
			orderBy: {
				id: "asc",
			},
		});

		if (allCourses.length === 0) {
			console.log("✅ No courses found.");
			return;
		}

		console.log(`📊 Found ${allCourses.length} course(s)\n`);

		// Find courses that need updating
		const coursesToUpdate = allCourses.filter((course) => {
			const startNeedsUpdate = course.startAt.getTime() !== TARGET_START_DATE.getTime();
			const endNeedsUpdate = course.endAt !== null;
			return startNeedsUpdate || endNeedsUpdate;
		});

		if (coursesToUpdate.length === 0) {
			console.log("✅ All courses already have startAt = 01.12.2025 and endAt = null");
			return;
		}

		console.log(`📝 ${coursesToUpdate.length} course(s) will be updated\n`);

		// Show preview of changes
		console.log("📋 Preview of changes:");
		console.log("=".repeat(100));

		for (const course of coursesToUpdate) {
			const currentStart = new Date(course.startAt).toLocaleDateString("en-GB");
			const currentEnd = course.endAt
				? new Date(course.endAt).toLocaleDateString("en-GB")
				: "null";
			const newStart = new Date(TARGET_START_DATE).toLocaleDateString("en-GB");

			console.log(`\n  Course: ${course.name} (ID: ${course.id})`);
			console.log(`  Teacher: ${course.teacher.fullname} (${course.teacher.username})`);
			console.log(`  Current startAt: ${currentStart}`);
			console.log(`  Current endAt: ${currentEnd}`);
			console.log(`  New startAt: ${newStart}`);
			console.log(`  New endAt: null`);
		}

		console.log("\n" + "=".repeat(100));

		if (dryRun) {
			console.log("\n⚠️  DRY RUN MODE - No changes were made");
			console.log("   To apply changes, run with: node scripts/update-courses-dates.js --apply\n");
			return;
		}

		// Confirm before proceeding
		console.log("\n⚠️  WARNING: This will update ALL courses!");
		console.log(`   Target start date: ${TARGET_START_DATE.toLocaleDateString("en-GB")}`);
		console.log(`   Target end date: null (removed)`);
		console.log(`   Total courses to update: ${coursesToUpdate.length}\n`);

		// Perform the update
		console.log("🔄 Updating courses...\n");

		const updateResult = await prisma.course.updateMany({
			data: {
				startAt: TARGET_START_DATE,
				endAt: null,
			},
		});

		console.log("✅ Update completed!");
		console.log(`   Updated ${updateResult.count} course(s)`);

		// Verify the update
		const verifyCourses = await prisma.course.findMany({
			where: {
				startAt: TARGET_START_DATE,
				endAt: null,
			},
			select: {
				id: true,
				name: true,
			},
		});

		console.log(
			`   Verified: ${verifyCourses.length} course(s) now have startAt = 01.12.2025 and endAt = null\n`
		);

		// Show summary by teacher
		const coursesByTeacher = await prisma.course.groupBy({
			by: ["teacherId"],
			where: {
				startAt: TARGET_START_DATE,
				endAt: null,
			},
			_count: {
				id: true,
			},
		});

		if (coursesByTeacher.length > 0) {
			console.log("📊 Summary by teacher:");
			for (const group of coursesByTeacher) {
				const teacher = await prisma.teacher.findUnique({
					where: { id: group.teacherId },
					select: { fullname: true },
				});
				console.log(
					`   ${teacher?.fullname || `Teacher ID ${group.teacherId}`}: ${group._count.id} course(s)`
				);
			}
		}

		// Show courses that still have endAt (should be none after update)
		const coursesWithEndDate = await prisma.course.findMany({
			where: {
				endAt: { not: null },
			},
			select: {
				id: true,
				name: true,
				endAt: true,
			},
		});

		if (coursesWithEndDate.length > 0) {
			console.log("\n⚠️  Warning: Some courses still have endAt set:");
			for (const course of coursesWithEndDate) {
				console.log(
					`   - ${course.name} (ID: ${course.id}): ${new Date(course.endAt).toLocaleDateString("en-GB")}`
				);
			}
		} else {
			console.log("\n✅ All courses have endAt = null");
		}

	} catch (error) {
		console.error("❌ Error updating courses:", error);
		throw error;
	}
}

async function main() {
	const args = process.argv.slice(2);
	const applyChanges = args.includes("--apply");

	try {
		await updateCoursesDates(!applyChanges);
	} catch (error) {
		console.error("❌ Script failed:", error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();

