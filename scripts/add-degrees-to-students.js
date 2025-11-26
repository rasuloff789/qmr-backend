/**
 * QMR Backend - Add Degrees to All Students
 *
 * This script adds random degrees (1-3) to all existing students
 * that don't have degrees assigned yet.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../src/database/index.js";

/**
 * Pick random degrees for a student
 * @param {Array} availableDegrees - All available degrees
 * @returns {Array} - Array of degree IDs (1-3 degrees)
 */
function pickRandomDegrees(availableDegrees) {
	if (availableDegrees.length === 0) return [];
	const numDegrees = Math.max(1, Math.floor(Math.random() * 3) + 1);
	const shuffled = [...availableDegrees].sort(() => Math.random() - 0.5);
	return shuffled
		.slice(0, Math.min(numDegrees, availableDegrees.length))
		.map((d) => d.id);
}

async function main() {
	try {
		console.log("🚀 Starting to add degrees to all students...\n");

		// Get all available degrees
		const degrees = await prisma.degree.findMany({
			select: { id: true, name: true },
		});

		if (degrees.length === 0) {
			console.error(
				"❌ No degrees found in database. Please run 'npm run seed:teachers' first to create degrees."
			);
			process.exitCode = 1;
			return;
		}

		console.log(`📚 Found ${degrees.length} degrees available\n`);

		// Get all students
		const students = await prisma.student.findMany({
			select: {
				id: true,
				username: true,
				fullname: true,
				possibleDegrees: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		if (students.length === 0) {
			console.log("ℹ️  No students found in database.");
			return;
		}

		console.log(`👥 Found ${students.length} students\n`);

		let updatedCount = 0;
		let skippedCount = 0;

		// Update each student with random degrees
		for (const student of students) {
			// Skip if student already has degrees
			if (student.possibleDegrees.length > 0) {
				console.log(
					`⏭️  Skipping ${student.fullname} - already has ${student.possibleDegrees.length} degree(s)`
				);
				skippedCount++;
				continue;
			}

			// Pick random degrees
			const degreeIds = pickRandomDegrees(degrees);
			const selectedDegrees = degrees.filter((d) => degreeIds.includes(d.id));

			try {
				await prisma.student.update({
					where: { id: student.id },
					data: {
						possibleDegrees: {
							connect: degreeIds.map((id) => ({ id })),
						},
					},
				});

				const degreeNames = selectedDegrees.map((d) => d.name).join(", ");
				console.log(`✅ ${student.fullname}: Added degrees - ${degreeNames}`);
				updatedCount++;
			} catch (error) {
				console.error(
					`❌ Failed to update ${student.fullname}: ${error.message}`
				);
			}
		}

		console.log("\n" + "=".repeat(50));
		console.log(`✅ Successfully updated ${updatedCount} students`);
		if (skippedCount > 0) {
			console.log(
				`⏭️  Skipped ${skippedCount} students (already have degrees)`
			);
		}
		console.log("=".repeat(50));
	} catch (error) {
		console.error("❌ Failed to add degrees to students:", error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();
