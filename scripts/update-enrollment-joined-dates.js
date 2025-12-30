import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
	log: ["warn", "error"],
});

// Mapping of usernames to their joinedAt dates and optional course selection
// Format: { username: { date: "YYYY-MM-DD", courseId?: number, courseName?: string } }
// If courseId or courseName is specified, only that enrollment will be updated
// If not specified and student has multiple enrollments, an error will be shown
const joinedAtDecember = {
	karimova1: {
		date: "2025-12-26",
		courseId: 43, // Optional: specify course ID to update only this enrollment
		// OR use courseName: "Ummu Huzayfa 3 kunlik"
		// If neither is specified and student has multiple enrollments, script will show error
	},
	// Example with courseName:
	// parvina1: {
	// 	date: "2025-12-24",
	// 	courseName: "Ummu Huzayfa 3 kunlik"
	// },
	// Example without course selection (only works if student has exactly one enrollment):
	// robiya1: {
	// 	date: "2025-12-26"
	// },
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
		for (const [username, config] of Object.entries(joinedAtDecember)) {
			try {
				// Handle both old format (string) and new format (object)
				let dateString, courseId, courseName;
				if (typeof config === "string") {
					// Old format: just a date string
					dateString = config;
					courseId = null;
					courseName = null;
				} else {
					// New format: object with date and optional course selection
					dateString = config.date;
					courseId = config.courseId || null;
					courseName = config.courseName || null;
				}

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

				// Determine which enrollment(s) to update
				let enrollmentsToUpdate = [];

				if (courseId) {
					// Find enrollment by course ID
					const enrollment = enrollments.find((e) => e.course.id === courseId);
					if (enrollment) {
						enrollmentsToUpdate = [enrollment];
					} else {
						errors.push({
							username,
							fullname: student.fullname,
							date: dateString,
							error: `Course with ID ${courseId} not found for this student. Available courses: ${enrollments
								.map((e) => `${e.course.name} (ID: ${e.course.id})`)
								.join(", ")}`,
						});
						continue;
					}
				} else if (courseName) {
					// Find enrollment by course name
					const enrollment = enrollments.find(
						(e) => e.course.name === courseName
					);
					if (enrollment) {
						enrollmentsToUpdate = [enrollment];
					} else {
						errors.push({
							username,
							fullname: student.fullname,
							date: dateString,
							error: `Course "${courseName}" not found for this student. Available courses: ${enrollments
								.map((e) => `${e.course.name} (ID: ${e.course.id})`)
								.join(", ")}`,
						});
						continue;
					}
				} else {
					// No course specified - update all enrollments if only one, otherwise show error
					if (enrollments.length === 1) {
						enrollmentsToUpdate = enrollments;
					} else {
						errors.push({
							username,
							fullname: student.fullname,
							date: dateString,
							error: `Student has ${
								enrollments.length
							} enrollments. Please specify courseId or courseName. Available courses: ${enrollments
								.map((e) => `${e.course.name} (ID: ${e.course.id})`)
								.join(", ")}`,
						});
						continue;
					}
				}

				// Update selected enrollment(s)
				for (const enrollment of enrollmentsToUpdate) {
					const oldDate = new Date(enrollment.joinedAt);
					const needsUpdate = oldDate.getTime() !== newDate.getTime();

					if (needsUpdate || !dryRun) {
						updates.push({
							username,
							fullname: student.fullname,
							enrollmentId: enrollment.id,
							courseId: enrollment.course.id,
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
					date: typeof config === "string" ? config : config.date,
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
					console.log(`    Course ID: ${update.courseId}`);
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
