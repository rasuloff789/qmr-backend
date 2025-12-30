import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
	log: ["warn", "error"],
});

// List of usernames to filter
const usernames = [
	"malikahon1",
	"shoxsanam1",
	"parvina1",
	"sevinchxon1",
	"qilich1",
	"marvarid1",
	"lola1",
	"oygul1",
	"farmanova1",
	"jalolova1",
	"ismanova1",
	"umarqulov1",
	"jorabek1",
	"anvar1",
	"abror1",
	"roziyev1",
	"qilicheva1",
	"nozanin1",
	"asadbek1",
	"sodiqov79",
	"solih1",
	"mahkam1",
	"qurbonov1",
	"artiqova1",
	"yakubjanov1",
	"shaxboz1",
	"egamova1",
	"karimova1",
	"robiya1",
	"ravsha1",
	"robiyaxon1",
	"sarvinoz1",
	"xolida1",
	"ramazon1",
	"yasmin1",
	"odilxon1",
	"yunus1",
	"giyosjon1",
	"malik1",
];

/**
 * Filter usernames to only those enrolled in exactly ONE course
 */
async function filterUsernamesInCourses() {
	try {
		console.log(
			"🔍 Filtering usernames that are enrolled in exactly ONE course...\n"
		);
		console.log(`📊 Total usernames to check: ${usernames.length}\n`);

		// Find all students with these usernames that have enrollments
		const studentsWithEnrollments = await prisma.student.findMany({
			where: {
				username: {
					in: usernames,
				},
				courses: {
					some: {
						isDeleted: false, // Only count active enrollments
					},
				},
			},
			select: {
				username: true,
				fullname: true,
				courses: {
					where: {
						isDeleted: false,
					},
					select: {
						id: true,
						course: {
							select: {
								id: true,
								name: true,
							},
						},
						isActive: true,
					},
				},
			},
		});

		// Filter to only students with exactly ONE enrollment
		const studentsWithOneEnrollment = studentsWithEnrollments.filter(
			(student) => student.courses.length === 1
		);

		// Extract usernames
		const enrolledUsernames = studentsWithOneEnrollment.map(
			(student) => student.username
		);

		// Get all students with these usernames (including those without enrollments)
		const allStudents = await prisma.student.findMany({
			where: {
				username: {
					in: usernames,
				},
			},
			select: {
				username: true,
				fullname: true,
				courses: {
					where: {
						isDeleted: false,
					},
					select: {
						id: true,
					},
				},
			},
		});

		const allFoundUsernames = allStudents.map((s) => s.username);

		// Find students with ZERO enrollments (not enrolled in any course)
		const studentsWithNoEnrollments = allStudents.filter(
			(student) => student.courses.length === 0
		);
		const notEnrolledUsernames = studentsWithNoEnrollments.map(
			(student) => student.username
		);

		// Find students with multiple enrollments (for reporting)
		const studentsWithMultipleEnrollments = studentsWithEnrollments.filter(
			(student) => student.courses.length > 1
		);

		// Show results
		console.log("=".repeat(100));
		console.log("\n📊 Results:");
		console.log(`   Total usernames checked: ${usernames.length}`);
		console.log(`   Usernames found in database: ${allFoundUsernames.length}`);
		console.log(
			`   Usernames enrolled in exactly ONE course: ${enrolledUsernames.length}`
		);
		console.log(
			`   Usernames with multiple enrollments: ${studentsWithMultipleEnrollments.length}`
		);
		console.log(`   Usernames NOT enrolled: ${notEnrolledUsernames.length}`);

		// Show students with exactly one enrollment
		if (studentsWithOneEnrollment.length > 0) {
			console.log("\n✅ Students enrolled in exactly ONE course:");
			console.log("=".repeat(100));
			for (const student of studentsWithOneEnrollment) {
				const enrollment = student.courses[0];
				console.log(`\n  ${student.username} (${student.fullname})`);
				console.log(
					`    Course: ${enrollment.course.name} (ID: ${enrollment.course.id})`
				);
				console.log(
					`    Status: ${enrollment.isActive ? "Active" : "Inactive"}`
				);
			}
		}

		// Show students with multiple enrollments (for reference)
		if (studentsWithMultipleEnrollments.length > 0) {
			console.log(
				"\n\n⚠️  Students with MULTIPLE enrollments (excluded from results):"
			);
			console.log("=".repeat(100));
			for (const student of studentsWithMultipleEnrollments) {
				const activeCourses = student.courses.filter((c) => c.isActive);
				const inactiveCourses = student.courses.filter((c) => !c.isActive);
				console.log(`\n  ${student.username} (${student.fullname})`);
				console.log(`    Total enrollments: ${student.courses.length}`);
				console.log(
					`    Active: ${activeCourses.length}, Inactive: ${inactiveCourses.length}`
				);
				console.log(`    Courses:`);
				for (const enrollment of student.courses) {
					console.log(
						`      - ${enrollment.course.name} (ID: ${enrollment.course.id}) [${
							enrollment.isActive ? "Active" : "Inactive"
						}]`
					);
				}
			}
		}

		// Show not enrolled students
		if (studentsWithNoEnrollments.length > 0) {
			console.log("\n\n❌ Students NOT enrolled in any course:");
			console.log("=".repeat(100));
			for (const student of studentsWithNoEnrollments) {
				console.log(`  ${student.username} (${student.fullname})`);
			}
		}

		// Show usernames not found in database
		const notFoundUsernames = usernames.filter(
			(username) => !allFoundUsernames.includes(username)
		);
		if (notFoundUsernames.length > 0) {
			console.log("\n\n⚠️  Usernames NOT found in database:");
			console.log("=".repeat(100));
			for (const username of notFoundUsernames) {
				console.log(`  ${username}`);
			}
		}

		// Output filtered array
		console.log("\n\n" + "=".repeat(100));
		console.log(
			"📋 Filtered Usernames Array (only those enrolled in exactly ONE course):"
		);
		console.log("=".repeat(100));
		console.log("\nconst enrolledUsernames = [");
		for (let i = 0; i < enrolledUsernames.length; i++) {
			const comma = i < enrolledUsernames.length - 1 ? "," : "";
			console.log(`  "${enrolledUsernames[i]}"${comma}`);
		}
		console.log("];\n");

		// Also output as JSON
		console.log("💾 JSON Format:");
		console.log(JSON.stringify(enrolledUsernames, null, 2));
		console.log("\n");

		// Return the filtered array
		return enrolledUsernames;
	} catch (error) {
		console.error("❌ Error filtering usernames:", error);
		throw error;
	}
}

async function main() {
	try {
		await filterUsernamesInCourses();
	} catch (error) {
		console.error("❌ Script failed:", error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();
