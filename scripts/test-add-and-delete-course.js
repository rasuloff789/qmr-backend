/**
 * QMR Backend - Test Add and Delete Course
 *
 * This script demonstrates adding a course and then deleting it
 * using the addCourse and deleteCourse mutations.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { addCourse } from "../src/graphql/resolvers/mutations/addCourse.js";
import { deleteCourse } from "../src/graphql/resolvers/mutations/deleteCourse.js";
import { prisma } from "../src/database/index.js";

async function main() {
	try {
		console.log("🚀 Starting add and delete course test...\n");

		// Get or create a degree
		const degree = await prisma.degree.upsert({
			where: { name: "Test Degree For Course" },
			update: {},
			create: { name: "Test Degree For Course" },
		});

		// Get a teacher or create one with degrees
		let teacher = await prisma.teacher.findFirst({
			where: {
				isActive: true,
				isDeleted: false,
			},
			include: {
				degrees: true,
			},
		});

		if (!teacher) {
			console.log("📝 Creating test teacher...");
			teacher = await prisma.teacher.create({
				data: {
					username: `test.teacher.${Date.now()}`,
					fullname: "Test Teacher",
					password: "hashed",
					birthDate: new Date("1980-01-01"),
					phone: "998901234500",
					tgUsername: "testteacher",
					gender: "MALE",
					degrees: { connect: { id: degree.id } },
					isActive: true,
					isDeleted: false,
				},
				include: {
					degrees: true,
				},
			});
		} else if (!teacher.degrees || teacher.degrees.length === 0) {
			console.log("📝 Assigning degree to teacher...");
			teacher = await prisma.teacher.update({
				where: { id: teacher.id },
				data: {
					degrees: { connect: { id: degree.id } },
				},
				include: {
					degrees: true,
				},
			});
		}

		const degreeId =
			teacher.degrees && teacher.degrees.length > 0
				? teacher.degrees[0].id
				: degree.id;
		const courseName = `Test Course ${Date.now()}`;

		console.log(`📚 Creating course: ${courseName}`);
		console.log(`   Teacher: ${teacher.fullname} (ID: ${teacher.id})`);
		console.log(`   Degree: ${teacher.degrees[0].name} (ID: ${degreeId})\n`);

		// Step 1: Add a course
		const addResult = await addCourse(
			null,
			{
				name: courseName,
				description: "Test course for add and delete demonstration",
				daysOfWeek: ["MONDAY", "WEDNESDAY", "FRIDAY"],
				gender: teacher.gender,
				startAt: new Date("2024-01-01"),
				endAt: new Date("2024-12-31"),
				startTime: new Date("2024-01-01T09:00:00Z"),
				endTime: new Date("2024-01-01T11:00:00Z"),
				teacherId: String(teacher.id),
				degreeIds: [String(degreeId)],
			},
			{ user: null }
		);

		if (!addResult.success) {
			console.error("❌ Failed to add course:");
			console.error(`   Message: ${addResult.message}`);
			console.error(`   Errors: ${addResult.errors?.join(", ")}`);
			process.exitCode = 1;
			return;
		}

		console.log("✅ Course created successfully!");
		console.log(`   Course ID: ${addResult.course.id}`);
		console.log(`   Course Name: ${addResult.course.name}`);
		console.log(`   Description: ${addResult.course.description}`);
		console.log(`   Days: ${addResult.course.daysOfWeek.join(", ")}`);
		console.log(`   Gender: ${addResult.course.gender}`);
		console.log(`   Teacher: ${addResult.course.teacher.fullname}\n`);

		// Verify course exists in database
		const createdCourse = await prisma.course.findUnique({
			where: { id: addResult.course.id },
			include: {
				teacher: true,
				degrees: true,
			},
		});

		if (!createdCourse) {
			console.error("❌ Course was not found in database after creation!");
			process.exitCode = 1;
			return;
		}

		console.log("✅ Verified course exists in database\n");

		// Step 2: Delete the course
		console.log(
			`🗑️  Deleting course: ${courseName} (ID: ${addResult.course.id})\n`
		);

		const deleteResult = await deleteCourse(
			null,
			{
				courseId: String(addResult.course.id),
			},
			{ user: null }
		);

		if (!deleteResult.success) {
			console.error("❌ Failed to delete course:");
			console.error(`   Message: ${deleteResult.message}`);
			console.error(`   Errors: ${deleteResult.errors?.join(", ")}`);
			process.exitCode = 1;
			return;
		}

		console.log("✅ Course deleted successfully!");
		console.log(`   Message: ${deleteResult.message}`);
		console.log(`   Timestamp: ${deleteResult.timestamp}\n`);

		// Verify course is deleted from database
		const deletedCourse = await prisma.course.findUnique({
			where: { id: addResult.course.id },
		});

		if (deletedCourse) {
			console.error("❌ Course still exists in database after deletion!");
			process.exitCode = 1;
			return;
		}

		console.log("✅ Verified course is deleted from database");

		// Verify related data is cleaned up
		const enrollments = await prisma.courseStudent.findMany({
			where: { courseId: addResult.course.id },
		});

		const substitutes = await prisma.substituteTeacher.findMany({
			where: { courseId: addResult.course.id },
		});

		if (enrollments.length > 0 || substitutes.length > 0) {
			console.log(
				`⚠️  Warning: Found ${enrollments.length} enrollments and ${substitutes.length} substitute teachers`
			);
		} else {
			console.log("✅ Verified all related data is cleaned up");
		}

		console.log("\n" + "=".repeat(60));
		console.log("🎉 Test completed successfully!");
		console.log("=".repeat(60));
		console.log("✅ Course was created");
		console.log("✅ Course was deleted");
		console.log("✅ Database cleanup verified");
		console.log("=".repeat(60));
	} catch (error) {
		console.error("❌ Test failed:", error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();
