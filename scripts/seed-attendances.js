/**
 * QMR Backend - Seed Attendance Data
 *
 * This script creates mock attendance records for students enrolled in courses.
 * It generates attendance for the entire course duration (past and future dates)
 * based on course schedules, with realistic attendance patterns.
 *
 * @author QMR Development Team
 * @version 2.0.0
 */

import { prisma } from "../src/database/index.js";

// Day of week mapping
const DAY_OF_WEEK_MAP = {
	0: "SUNDAY",
	1: "MONDAY",
	2: "TUESDAY",
	3: "WEDNESDAY",
	4: "THURSDAY",
	5: "FRIDAY",
	6: "SATURDAY",
};

/**
 * Get all dates for a specific day of week within a date range
 */
function getDatesForDayOfWeek(startDate, endDate, dayOfWeek) {
	const dates = [];
	const current = new Date(startDate);
	const targetDay = Object.keys(DAY_OF_WEEK_MAP).find(
		(key) => DAY_OF_WEEK_MAP[key] === dayOfWeek
	);

	// Find first occurrence of the target day
	while (current.getDay() !== parseInt(targetDay)) {
		current.setDate(current.getDate() + 1);
	}

	// Collect all occurrences
	while (current <= endDate) {
		dates.push(new Date(current));
		current.setDate(current.getDate() + 7); // Next week
	}

	return dates;
}

/**
 * Generate realistic notes for attendance
 */
function generateNotes(isPresent, date) {
	if (!isPresent) {
		const absentReasons = [
			"Absent - no excuse",
			"Absent - sick",
			"Absent - family emergency",
			"Absent - personal reasons",
			"Absent - late arrival (marked absent)",
			"Absent - excused",
			"Absent - doctor appointment",
		];
		return absentReasons[Math.floor(Math.random() * absentReasons.length)];
	}

	// Present notes (less frequent)
	if (Math.random() < 0.15) {
		const presentNotes = [
			"On time",
			"Arrived on time",
			"Present and participated",
			"Excellent participation",
			"Late arrival (5 min)",
			"Late arrival (10 min)",
			"Present - good performance",
		];
		return presentNotes[Math.floor(Math.random() * presentNotes.length)];
	}

	return null;
}

/**
 * Generate attendance records for a course
 */
async function generateAttendanceForCourse(course, enrollments) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);

	const courseStartDate = new Date(course.startAt);
	courseStartDate.setHours(0, 0, 0, 0);

	// Generate attendance for the entire course duration
	// If course has end date, use it; otherwise generate up to 6 months from start
	let endDate;
	if (course.endAt) {
		endDate = new Date(course.endAt);
		endDate.setHours(23, 59, 59, 999);
	} else {
		// Generate 6 months of data from course start
		endDate = new Date(courseStartDate);
		endDate.setMonth(endDate.getMonth() + 6);
		endDate.setHours(23, 59, 59, 999);
	}

	// Also generate some historical data (3 months before course start if course is old enough)
	const historicalStartDate = new Date(courseStartDate);
	historicalStartDate.setMonth(historicalStartDate.getMonth() - 3);

	// Use the earlier of historical start or course start
	// This gives us up to 3 months of historical data plus the full course duration
	const actualStartDate =
		historicalStartDate < courseStartDate
			? historicalStartDate
			: courseStartDate;

	const attendanceDates = [];

	// Generate dates for each day of week the course meets
	for (const dayOfWeek of course.daysOfWeek) {
		const dates = getDatesForDayOfWeek(actualStartDate, endDate, dayOfWeek);
		attendanceDates.push(...dates);
	}

	// Sort dates
	attendanceDates.sort((a, b) => a - b);

	// Filter out dates that are too far in the future (max 1 month ahead)
	const maxFutureDate = new Date(today);
	maxFutureDate.setMonth(maxFutureDate.getMonth() + 1);
	const validDates = attendanceDates.filter((date) => date <= maxFutureDate);

	console.log(
		`   📅 Generated ${validDates.length} attendance dates for ${
			course.name
		} (from ${actualStartDate.toISOString().split("T")[0]} to ${
			endDate.toISOString().split("T")[0]
		})`
	);

	let created = 0;
	let skipped = 0;
	let errors = 0;

	// First, get all existing attendances for this course to avoid duplicates
	const existingAttendances = await prisma.attendance.findMany({
		where: {
			courseId: course.id,
			date: {
				gte: actualStartDate,
				lte: endDate,
			},
		},
		select: {
			studentId: true,
			date: true,
		},
	});

	// Create a Set for fast lookup
	const existingSet = new Set(
		existingAttendances.map(
			(a) => `${a.studentId}-${a.date.toISOString().split("T")[0]}`
		)
	);

	// Prepare batch data
	const batchData = [];

	// Create attendance records for each student and date
	for (const enrollment of enrollments) {
		if (!enrollment.isActive || enrollment.isDeleted) {
			continue;
		}

		// Each student has a base attendance rate (between 75% and 95%)
		const studentAttendanceRate = 0.75 + Math.random() * 0.2;

		for (const date of validDates) {
			const dateKey = `${enrollment.studentId}-${
				date.toISOString().split("T")[0]
			}`;

			// Skip if already exists
			if (existingSet.has(dateKey)) {
				skipped++;
				continue;
			}

			// Determine if student was present based on their attendance rate
			// Also consider if date is in the future (lower chance of having records)
			const isFutureDate = date > today;
			const futureDateChance = isFutureDate ? 0.3 : 1.0; // 30% chance for future dates

			const isPresent =
				Math.random() < studentAttendanceRate * futureDateChance;

			// Generate notes
			const notes = generateNotes(isPresent, date);

			batchData.push({
				courseId: course.id,
				studentId: enrollment.studentId,
				date: date,
				isPresent: isPresent,
				notes: notes,
			});
		}
	}

	// Batch create attendances (in chunks of 100 for better performance)
	const BATCH_SIZE = 100;
	for (let i = 0; i < batchData.length; i += BATCH_SIZE) {
		const batch = batchData.slice(i, i + BATCH_SIZE);
		try {
			await prisma.attendance.createMany({
				data: batch,
				skipDuplicates: true,
			});
			created += batch.length;
		} catch (error) {
			console.error(
				`   ❌ Error creating batch ${i / BATCH_SIZE + 1}:`,
				error.message
			);
			// Try individual creates for this batch
			for (const data of batch) {
				try {
					await prisma.attendance.create({
						data: data,
					});
					created++;
				} catch (individualError) {
					errors++;
				}
			}
		}
	}

	return { created, skipped, errors };
}

/**
 * Main function
 */
async function main() {
	try {
		console.log("🚀 Starting attendance seed script...\n");

		// Get all active courses with their enrollments
		const courses = await prisma.course.findMany({
			where: {
				// Only courses that have started or will start soon
			},
			include: {
				students: {
					where: {
						isActive: true,
						isDeleted: false,
					},
					select: {
						studentId: true,
						isActive: true,
						isDeleted: true,
					},
				},
			},
		});

		if (courses.length === 0) {
			console.log("⚠️  No courses found. Please create courses first.");
			console.log("   Run: npm run seed:teachers (or create courses manually)");
			return;
		}

		console.log(`📚 Found ${courses.length} courses\n`);

		let totalCreated = 0;
		let totalSkipped = 0;
		let totalErrors = 0;

		for (const course of courses) {
			if (course.students.length === 0) {
				console.log(`⏭️  Skipping ${course.name} - no enrolled students`);
				continue;
			}

			console.log(
				`📖 Processing: ${course.name} (${course.students.length} students)`
			);

			const result = await generateAttendanceForCourse(course, course.students);

			console.log(
				`   ✅ Created: ${result.created}, Skipped: ${result.skipped}, Errors: ${result.errors}\n`
			);

			totalCreated += result.created;
			totalSkipped += result.skipped;
			totalErrors += result.errors;
		}

		// Summary
		console.log("=".repeat(60));
		console.log("📊 ATTENDANCE SEED SUMMARY");
		console.log("=".repeat(60));
		console.log(`✅ Total created: ${totalCreated}`);
		console.log(`⏭️  Total skipped: ${totalSkipped}`);
		console.log(`❌ Total errors: ${totalErrors}`);
		console.log(
			`📈 Total processed: ${totalCreated + totalSkipped + totalErrors}`
		);

		// Get total attendance count
		const totalAttendances = await prisma.attendance.count();
		console.log(`📊 Total attendances in database: ${totalAttendances}`);
		console.log("=".repeat(60));
		console.log("\n🎉 Attendance seeding complete!");

		// Show sample attendance records
		const sampleAttendances = await prisma.attendance.findMany({
			take: 5,
			include: {
				course: {
					select: {
						name: true,
					},
				},
				student: {
					select: {
						fullname: true,
					},
				},
			},
			orderBy: {
				date: "desc",
			},
		});

		if (sampleAttendances.length > 0) {
			console.log("\n📋 Sample attendance records:");
			for (const att of sampleAttendances) {
				const status = att.isPresent ? "✅ Present" : "❌ Absent";
				console.log(
					`   • ${att.student.fullname} - ${att.course.name} - ${
						att.date.toISOString().split("T")[0]
					} - ${status}`
				);
			}
		}
	} catch (error) {
		console.error("❌ Seed failed:", error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();
