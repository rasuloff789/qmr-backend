import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
	log: ["warn", "error"],
});

// Target date: 30.12.2025 22:00
// Note: JavaScript Date months are 0-indexed, so December is 11
// Format: YYYY-MM-DD HH:MM
const TARGET_DATE = new Date("2025-12-30T22:00:00.000Z");

/**
 * Find enrollments with joinedAt after specific date
 */
async function findEnrollmentsByDate() {
	try {
		console.log("🔍 Searching for enrollments with joinedAt AFTER 30.12.2025 22:00...\n");
		console.log(`Target date: ${TARGET_DATE.toISOString()}\n`);

		// Find enrollments with joinedAt >= target date
		const enrollments = await prisma.courseStudent.findMany({
			where: {
				joinedAt: {
					gte: TARGET_DATE,
				},
			},
			include: {
				student: {
					select: {
						id: true,
						fullname: true,
						username: true,
						phone: true,
						tgUsername: true,
					},
				},
				course: {
					select: {
						id: true,
						name: true,
						description: true,
						startAt: true,
						endAt: true,
					},
				},
			},
			orderBy: {
				id: "asc",
			},
		});

		if (enrollments.length === 0) {
			console.log("✅ No enrollments found with joinedAt after 30.12.2025 22:00");
			return;
		}

		console.log(`📊 Found ${enrollments.length} enrollment(s) with joinedAt after 30.12.2025 22:00\n`);
		console.log("=".repeat(100));

		// Show details for each enrollment
		for (let i = 0; i < enrollments.length; i++) {
			const enrollment = enrollments[i];
			const joinedAt = new Date(enrollment.joinedAt);

			console.log(`\n${i + 1}. Enrollment ID: ${enrollment.id}`);
			console.log(`   Student: ${enrollment.student.fullname} (${enrollment.student.username})`);
			console.log(`   Student ID: ${enrollment.student.id}`);
			if (enrollment.student.phone) {
				console.log(`   Phone: ${enrollment.student.phone}`);
			}
			if (enrollment.student.tgUsername) {
				console.log(`   Telegram: @${enrollment.student.tgUsername}`);
			}
			console.log(`   Course: ${enrollment.course.name} (ID: ${enrollment.course.id})`);
			if (enrollment.course.description) {
				console.log(`   Course Description: ${enrollment.course.description}`);
			}
			console.log(`   Monthly Payment: ${enrollment.monthlyPayment.toLocaleString()} UZS`);
			console.log(`   Joined At: ${joinedAt.toISOString()}`);
			console.log(`   Joined At (Local): ${joinedAt.toLocaleString()}`);
			console.log(`   Is Active: ${enrollment.isActive}`);
			console.log(`   Is Deleted: ${enrollment.isDeleted}`);
			console.log(`   Created At: ${new Date(enrollment.createdAt).toLocaleString()}`);
			if (enrollment.lastBilledDate) {
				console.log(`   Last Billed Date: ${new Date(enrollment.lastBilledDate).toLocaleString()}`);
			}
			console.log(`   Course Start: ${new Date(enrollment.course.startAt).toLocaleDateString()}`);
			if (enrollment.course.endAt) {
				console.log(`   Course End: ${new Date(enrollment.course.endAt).toLocaleDateString()}`);
			}
		}

		console.log("\n" + "=".repeat(100));

		// Summary statistics
		const activeEnrollments = enrollments.filter((e) => e.isActive && !e.isDeleted);
		const inactiveEnrollments = enrollments.filter((e) => !e.isActive || e.isDeleted);
		const totalPayment = enrollments.reduce((sum, e) => sum + e.monthlyPayment, 0);

		console.log("\n📊 Summary:");
		console.log(`   Total enrollments: ${enrollments.length}`);
		console.log(`   Active enrollments: ${activeEnrollments.length}`);
		console.log(`   Inactive/Deleted enrollments: ${inactiveEnrollments.length}`);
		console.log(`   Total monthly payment: ${totalPayment.toLocaleString()} UZS`);

		// Group by course
		const byCourse = {};
		for (const enrollment of enrollments) {
			const courseName = enrollment.course.name;
			if (!byCourse[courseName]) {
				byCourse[courseName] = [];
			}
			byCourse[courseName].push(enrollment);
		}

		if (Object.keys(byCourse).length > 0) {
			console.log("\n📋 Grouped by Course:");
			for (const [courseName, courseEnrollments] of Object.entries(byCourse)) {
				console.log(`   ${courseName}: ${courseEnrollments.length} enrollment(s)`);
			}
		}

		// Export data as JSON
		const exportData = enrollments.map((e) => ({
			enrollmentId: e.id,
			student: {
				id: e.student.id,
				fullname: e.student.fullname,
				username: e.student.username,
				phone: e.student.phone,
				tgUsername: e.student.tgUsername,
			},
			course: {
				id: e.course.id,
				name: e.course.name,
				description: e.course.description,
			},
			monthlyPayment: e.monthlyPayment,
			joinedAt: e.joinedAt.toISOString(),
			isActive: e.isActive,
			isDeleted: e.isDeleted,
			createdAt: e.createdAt.toISOString(),
			lastBilledDate: e.lastBilledDate ? e.lastBilledDate.toISOString() : null,
		}));

		console.log("\n💾 JSON Export (copy this if needed):");
		console.log(JSON.stringify(exportData, null, 2));
		console.log("\n");

	} catch (error) {
		console.error("❌ Error finding enrollments:", error);
		throw error;
	}
}

async function main() {
	try {
		await findEnrollmentsByDate();
	} catch (error) {
		console.error("❌ Script failed:", error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();

