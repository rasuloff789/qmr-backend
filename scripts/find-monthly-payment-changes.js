import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
	log: ["warn", "error"],
});

/**
 * Find all students whose monthlyPayment has changed
 * Uses PriceChangeHistory to track changes
 */
async function findMonthlyPaymentChanges() {
	try {
		console.log("🔍 Searching for students with changed monthlyPayment...\n");

		// Query PriceChangeHistory with related data
		const priceChanges = await prisma.priceChangeHistory.findMany({
			include: {
				courseStudent: {
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
							},
						},
					},
				},
			},
			orderBy: {
				changedAt: "desc",
			},
		});

		if (priceChanges.length === 0) {
			console.log("✅ No monthlyPayment changes found.");
			return;
		}

		console.log(`📊 Found ${priceChanges.length} monthlyPayment change(s):\n`);
		console.log("=".repeat(100));

		// Group by student to show all changes per student
		const studentChanges = new Map();

		for (const change of priceChanges) {
			const studentId = change.courseStudent.student.id;
			const studentName = change.courseStudent.student.fullname;
			const courseName = change.courseStudent.course.name;

			if (!studentChanges.has(studentId)) {
				studentChanges.set(studentId, {
					student: change.courseStudent.student,
					changes: [],
				});
			}

			studentChanges.get(studentId).changes.push({
				courseName,
				courseId: change.courseStudent.course.id,
				oldPrice: change.oldPrice,
				newPrice: change.newPrice,
				changedAt: change.changedAt,
				changedBy: change.changedBy,
				priceDifference: change.newPrice - change.oldPrice,
			});
		}

		// Display results
		let index = 1;
		for (const [studentId, data] of studentChanges.entries()) {
			const { student, changes } = data;

			console.log(`\n${index}. Student: ${student.fullname} (ID: ${student.id})`);
			console.log(`   Username: ${student.username}`);
			if (student.phone) console.log(`   Phone: ${student.phone}`);
			if (student.tgUsername) console.log(`   Telegram: @${student.tgUsername}`);
			console.log(`   Total Changes: ${changes.length}`);

			for (const change of changes) {
				const changeDate = new Date(change.changedAt).toLocaleString();
				const priceDiff = change.priceDifference > 0 
					? `+${change.priceDifference.toLocaleString()}` 
					: change.priceDifference.toLocaleString();
				const diffPercent = ((change.priceDifference / change.oldPrice) * 100).toFixed(2);

				console.log(`\n   📝 Course: ${change.courseName} (ID: ${change.courseId})`);
				console.log(`      Old Price: ${change.oldPrice.toLocaleString()} UZS`);
				console.log(`      New Price: ${change.newPrice.toLocaleString()} UZS`);
				console.log(`      Change: ${priceDiff} UZS (${diffPercent}%)`);
				console.log(`      Changed At: ${changeDate}`);
				console.log(`      Changed By User ID: ${change.changedBy}`);
			}

			console.log("\n" + "-".repeat(100));
			index++;
		}

		// Summary statistics
		console.log("\n📈 Summary Statistics:");
		console.log(`   Total Students Affected: ${studentChanges.size}`);
		console.log(`   Total Price Changes: ${priceChanges.length}`);

		const totalIncrease = priceChanges
			.filter(c => c.newPrice > c.oldPrice)
			.reduce((sum, c) => sum + (c.newPrice - c.oldPrice), 0);
		const totalDecrease = priceChanges
			.filter(c => c.newPrice < c.oldPrice)
			.reduce((sum, c) => sum + (c.oldPrice - c.newPrice), 0);

		console.log(`   Total Price Increases: ${totalIncrease.toLocaleString()} UZS`);
		console.log(`   Total Price Decreases: ${totalDecrease.toLocaleString()} UZS`);
		console.log(`   Net Change: ${(totalIncrease - totalDecrease).toLocaleString()} UZS`);

		// Export option: JSON format
		const exportData = Array.from(studentChanges.entries()).map(([studentId, data]) => ({
			student: {
				id: data.student.id,
				fullname: data.student.fullname,
				username: data.student.username,
				phone: data.student.phone,
				tgUsername: data.student.tgUsername,
			},
			changes: data.changes.map(c => ({
				courseId: c.courseId,
				courseName: c.courseName,
				oldPrice: c.oldPrice,
				newPrice: c.newPrice,
				priceDifference: c.priceDifference,
				changedAt: c.changedAt.toISOString(),
				changedBy: c.changedBy,
			})),
		}));

		console.log("\n💾 JSON Export (copy this if needed):");
		console.log(JSON.stringify(exportData, null, 2));

	} catch (error) {
		console.error("❌ Error finding monthlyPayment changes:", error);
		throw error;
	}
}

async function main() {
	try {
		await findMonthlyPaymentChanges();
	} catch (error) {
		console.error("❌ Script failed:", error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();

