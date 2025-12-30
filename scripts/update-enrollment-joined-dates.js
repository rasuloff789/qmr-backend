import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
	log: ["warn", "error"],
});

// Mapping of usernames to their joinedAt dates
const joinedAtDecember = {
	marvarid1: "2025-12-13",
	shoxsanam1: "2025-12-08",
	sarvinoz1: "2025-12-23",
	qilicheva1: "2025-12-15",
	egamova1: "2025-12-06",
	sevinchxon1: "2025-12-21",
	lola1: "2025-12-23",
	ismanova1: "2025-12-23",
	oygul1: "2025-12-05",
	odilxon1: "2025-12-04",
	roziyev1: "2025-12-08",
	jalolova1: "2025-12-06",
	malik1: "2025-12-07",
	shaxboz1: "2025-12-24",
	anvar1: "2025-12-20",
	yunus1: "2025-12-23",
	abror1: "2025-12-20",
	jorabek1: "2025-12-25",
	umarqulov1: "2025-12-25",
	asadbek1: "2025-12-22",
	qurbonov1: "2025-12-28",
	yakubjanov1: "2025-12-29",
	farmanova1: "2025-12-23",
	nozanin1: "2025-12-28",
	xolida1: "2025-12-23",
	malikahon1: "2025-12-08",
	qilich1: "2025-12-22",
	yasmin1: "2025-12-29",
	ramazon1: "2025-12-29",
	solih1: "2025-12-29",
	mahkam1: "2025-12-30",
	ravsha1: "2025-12-04",
	robiyaxon1: "2025-12-03",
};

/**
 * Update joinedAt dates for student enrollments
 */
async function updateEnrollmentJoinedDates(dryRun = true) {
	try {
		console.log("🔍 Updating enrollment joinedAt dates...\n");
		console.log(
			`📊 Total students to update: ${Object.keys(joinedAtDecember).length}\n`
		);

		const updates = [];
		const errors = [];
		const notFound = [];

		// Process each username
		for (const [username, dateString] of Object.entries(joinedAtDecember)) {
			try {
				// Parse the date
				const newDate = new Date(dateString + "T00:00:00.000Z");

				// Find student by username
				const student = await prisma.student.findUnique({
					where: { username },
					select: {
						id: true,
						fullname: true,
						username: true,
					},
				});

				if (!student) {
					notFound.push({ username, date: dateString });
					continue;
				}

				// Find student's enrollments (non-deleted)
				const enrollments = await prisma.courseStudent.findMany({
					where: {
						studentId: student.id,
						isDeleted: false,
					},
					include: {
						course: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				});

				if (enrollments.length === 0) {
					errors.push({
						username,
						fullname: student.fullname,
						date: dateString,
						error: "No active enrollments found",
					});
					continue;
				}

				// Update each enrollment
				for (const enrollment of enrollments) {
					const oldDate = new Date(enrollment.joinedAt);
					const needsUpdate = oldDate.getTime() !== newDate.getTime();

					if (needsUpdate || !dryRun) {
						updates.push({
							username,
							fullname: student.fullname,
							enrollmentId: enrollment.id,
							courseName: enrollment.course.name,
							oldDate: oldDate.toISOString().split("T")[0],
							newDate: dateString,
						});

						if (!dryRun) {
							await prisma.courseStudent.update({
								where: { id: enrollment.id },
								data: { joinedAt: newDate },
							});
						}
					}
				}
			} catch (error) {
				errors.push({
					username,
					date: dateString,
					error: error.message,
				});
			}
		}

		// Show results
		console.log("=".repeat(100));
		console.log("\n📊 Summary:");
		console.log(
			`   Total students in mapping: ${Object.keys(joinedAtDecember).length}`
		);
		console.log(
			`   Students found: ${
				Object.keys(joinedAtDecember).length - notFound.length - errors.length
			}`
		);
		console.log(`   Enrollments to update: ${updates.length}`);
		console.log(`   Errors: ${errors.length}`);
		console.log(`   Not found: ${notFound.length}`);

		// Show updates
		if (updates.length > 0) {
			console.log("\n\n📋 Enrollments to be updated:");
			console.log("=".repeat(100));

			// Group by username
			const updatesByUsername = {};
			for (const update of updates) {
				if (!updatesByUsername[update.username]) {
					updatesByUsername[update.username] = [];
				}
				updatesByUsername[update.username].push(update);
			}

			for (const [username, userUpdates] of Object.entries(updatesByUsername)) {
				const firstUpdate = userUpdates[0];
				console.log(`\n  ${username} (${firstUpdate.fullname})`);
				for (const update of userUpdates) {
					console.log(`    Enrollment ID: ${update.enrollmentId}`);
					console.log(`    Course: ${update.courseName}`);
					console.log(`    Old joinedAt: ${update.oldDate}`);
					console.log(`    New joinedAt: ${update.newDate}`);
				}
			}
		}

		// Show errors
		if (errors.length > 0) {
			console.log("\n\n❌ Errors:");
			console.log("=".repeat(100));
			for (const error of errors) {
				console.log(`\n  Username: ${error.username}`);
				if (error.fullname) console.log(`  Student: ${error.fullname}`);
				console.log(`  Date: ${error.date}`);
				console.log(`  Error: ${error.error}`);
			}
		}

		// Show not found
		if (notFound.length > 0) {
			console.log("\n\n⚠️  Usernames not found in database:");
			console.log("=".repeat(100));
			for (const item of notFound) {
				console.log(`  ${item.username} (date: ${item.date})`);
			}
		}

		if (dryRun) {
			console.log("\n\n⚠️  DRY RUN MODE - No changes were made");
			console.log(
				"   To apply changes, run with: node scripts/update-enrollment-joined-dates.js --apply\n"
			);
		} else {
			console.log("\n\n✅ Update completed!");
			console.log(`   Updated ${updates.length} enrollment(s)\n`);

			// Verify updates
			let verifiedCount = 0;
			for (const update of updates) {
				const enrollment = await prisma.courseStudent.findUnique({
					where: { id: update.enrollmentId },
					select: { joinedAt: true },
				});
				const expectedDate = new Date(update.newDate + "T00:00:00.000Z");
				if (
					enrollment &&
					enrollment.joinedAt.getTime() === expectedDate.getTime()
				) {
					verifiedCount++;
				}
			}
			console.log(
				`   Verified: ${verifiedCount}/${updates.length} enrollment(s) updated correctly\n`
			);
		}
	} catch (error) {
		console.error("❌ Error updating enrollment dates:", error);
		throw error;
	}
}

async function main() {
	const args = process.argv.slice(2);
	const applyChanges = args.includes("--apply");

	try {
		await updateEnrollmentJoinedDates(!applyChanges);
	} catch (error) {
		console.error("❌ Script failed:", error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();
