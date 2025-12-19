/**
 * QMR Backend - Delete Course Mutation Tests
 *
 * Comprehensive test suite for the deleteCourse mutation.
 * Tests all validation scenarios and edge cases.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { deleteCourse } from "../deleteCourse.js";
import { prisma } from "../../../../database/index.js";

/**
 * Test suite for deleteCourse mutation
 */
async function runTests() {
	console.log("🧪 Starting deleteCourse mutation tests...\n");

	const tests = [];
	let passed = 0;
	let failed = 0;

	/**
	 * Helper function to run a test
	 */
	async function test(name, testFn) {
		try {
			await testFn();
			tests.push({ name, status: "✅ PASSED" });
			passed++;
			console.log(`✅ ${name}`);
		} catch (error) {
			tests.push({ name, status: "❌ FAILED", error: error.message });
			failed++;
			console.error(`❌ ${name}: ${error.message}`);
		}
	}

	/**
	 * Helper to create test data
	 */
	async function createTestData() {
		// Create a degree
		const degree = await prisma.degree.upsert({
			where: { name: "Test Degree For Delete" },
			update: {},
			create: { name: "Test Degree For Delete" },
		});

		// Create a teacher
		const teacher = await prisma.teacher.upsert({
			where: { username: "test.teacher.delete" },
			update: {
				degrees: { connect: { id: degree.id } },
				gender: "MALE",
				isActive: true,
				isDeleted: false,
			},
			create: {
				username: "test.teacher.delete",
				fullname: "Test Teacher Delete",
				password: "hashed",
				birthDate: new Date("1980-01-01"),
				phone: "998901234500",
				tgUsername: "testteacherdelete",
				gender: "MALE",
				degrees: { connect: { id: degree.id } },
				isActive: true,
				isDeleted: false,
			},
		});

		// Create a course
		const course = await prisma.course.upsert({
			where: { name: "Test Course For Delete" },
			update: {
				teacherId: teacher.id,
				degrees: { set: [], connect: { id: degree.id } },
				gender: "MALE",
			},
			create: {
				name: "Test Course For Delete",
				description: "Test course for deletion",
				daysOfWeek: ["MONDAY", "WEDNESDAY"],
				gender: "MALE",
				startAt: new Date("2024-01-01"),
				endAt: new Date("2024-12-31"),
				startTime: new Date("2024-01-01T09:00:00Z"),
				endTime: new Date("2024-01-01T11:00:00Z"),
				teacherId: teacher.id,
				degrees: { connect: { id: degree.id } },
			},
		});

		// Create a course with active enrollments
		const courseWithEnrollments = await prisma.course.upsert({
			where: { name: "Test Course With Enrollments" },
			update: {
				teacherId: teacher.id,
				degrees: { set: [], connect: { id: degree.id } },
				gender: "MALE",
			},
			create: {
				name: "Test Course With Enrollments",
				description: "Test course with active enrollments",
				daysOfWeek: ["TUESDAY", "THURSDAY"],
				gender: "MALE",
				startAt: new Date("2024-01-01"),
				endAt: new Date("2024-12-31"),
				startTime: new Date("2024-01-01T09:00:00Z"),
				endTime: new Date("2024-01-01T11:00:00Z"),
				teacherId: teacher.id,
				degrees: { connect: { id: degree.id } },
			},
		});

		// Create a student
		const student = await prisma.student.upsert({
			where: { username: "test.student.delete" },
			update: {
				gender: "MALE",
				possibleDegrees: { set: [], connect: { id: degree.id } },
				isActive: true,
				isDeleted: false,
			},
			create: {
				username: "test.student.delete",
				fullname: "Test Student Delete",
				password: "hashed",
				birthDate: new Date("2000-01-01"),
				phone: "998901234501",
				tgUsername: "teststudentdelete",
				gender: "MALE",
				possibleDegrees: { connect: { id: degree.id } },
				isActive: true,
				isDeleted: false,
			},
		});

		// Create active enrollment
		await prisma.courseStudent.deleteMany({
			where: {
				courseId: courseWithEnrollments.id,
				studentId: student.id,
			},
		});

		await prisma.courseStudent.create({
			data: {
				courseId: courseWithEnrollments.id,
				studentId: student.id,
				monthlyPayment: 500000,
				isActive: true,
				isDeleted: false,
			},
		});

		// Create a substitute teacher
		const substituteTeacher = await prisma.teacher.upsert({
			where: { username: "test.substitute.teacher" },
			update: {
				degrees: { connect: { id: degree.id } },
				gender: "MALE",
				isActive: true,
				isDeleted: false,
			},
			create: {
				username: "test.substitute.teacher",
				fullname: "Test Substitute Teacher",
				password: "hashed",
				birthDate: new Date("1985-01-01"),
				phone: "998901234502",
				tgUsername: "testsubstituteteacher",
				gender: "MALE",
				degrees: { connect: { id: degree.id } },
				isActive: true,
				isDeleted: false,
			},
		});

		// Create substitute teacher assignment
		await prisma.substituteTeacher.deleteMany({
			where: {
				courseId: course.id,
			},
		});

		await prisma.substituteTeacher.create({
			data: {
				courseId: course.id,
				teacherId: substituteTeacher.id,
				startDate: new Date("2024-06-01"),
				endDate: new Date("2024-06-30"),
				reason: "Test substitution",
			},
		});

		return {
			course,
			courseWithEnrollments,
			degree,
			teacher,
			student,
			substituteTeacher,
		};
	}

	/**
	 * Cleanup test data
	 */
	async function cleanupTestData(testData) {
		// Clean up enrollments
		await prisma.courseStudent.deleteMany({
			where: {
				courseId: {
					in: [testData.course.id, testData.courseWithEnrollments.id],
				},
			},
		});

		// Clean up substitute teachers
		await prisma.substituteTeacher.deleteMany({
			where: {
				courseId: {
					in: [testData.course.id, testData.courseWithEnrollments.id],
				},
			},
		});

		// Clean up courses (if they still exist)
		await prisma.course.deleteMany({
			where: {
				id: { in: [testData.course.id, testData.courseWithEnrollments.id] },
			},
		});
	}

	// Get or create test data
	const testData = await createTestData();

	// Test 1: Successful deletion
	await test("Should successfully delete a course without active enrollments", async () => {
		const result = await deleteCourse(
			null,
			{ courseId: String(testData.course.id) },
			{ user: null }
		);

		if (!result.success) {
			throw new Error(
				`Expected success but got: ${result.message} - ${result.errors?.join(
					", "
				)}`
			);
		}

		if (!result.message.includes("deleted successfully")) {
			throw new Error(`Expected success message but got: ${result.message}`);
		}

		// Verify course is deleted
		const deletedCourse = await prisma.course.findUnique({
			where: { id: testData.course.id },
		});

		if (deletedCourse) {
			throw new Error("Course should be deleted but still exists");
		}

		// Verify enrollments are deleted
		const enrollments = await prisma.courseStudent.findMany({
			where: { courseId: testData.course.id },
		});

		if (enrollments.length > 0) {
			throw new Error("Enrollments should be deleted");
		}

		// Verify substitute teachers are deleted
		const substitutes = await prisma.substituteTeacher.findMany({
			where: { courseId: testData.course.id },
		});

		if (substitutes.length > 0) {
			throw new Error("Substitute teachers should be deleted");
		}
	});

	// Test 2: Prevent deletion with any enrollments (active or inactive)
	await test("Should prevent deletion when course has enrollments", async () => {
		const result = await deleteCourse(
			null,
			{ courseId: String(testData.courseWithEnrollments.id) },
			{ user: null }
		);

		if (result.success) {
			throw new Error("Expected failure for course with enrollments");
		}

		if (!result.message.includes("enrollments")) {
			throw new Error(
				`Expected 'enrollments' message but got: ${result.message}`
			);
		}

		// Verify course still exists
		const course = await prisma.course.findUnique({
			where: { id: testData.courseWithEnrollments.id },
		});

		if (!course) {
			throw new Error("Course should still exist");
		}
	});

	// Test 3: Missing courseId
	await test("Should fail when courseId is missing", async () => {
		const result = await deleteCourse(null, { courseId: null }, { user: null });

		if (result.success) {
			throw new Error("Expected failure for missing courseId");
		}

		if (!result.errors?.some((e) => e.includes("required"))) {
			throw new Error("Expected validation error for missing courseId");
		}
	});

	// Test 4: Invalid courseId
	await test("Should fail when courseId is invalid", async () => {
		const result = await deleteCourse(
			null,
			{ courseId: "invalid" },
			{ user: null }
		);

		if (result.success) {
			throw new Error("Expected failure for invalid courseId");
		}

		if (!result.errors?.some((e) => e.includes("Invalid"))) {
			throw new Error("Expected validation error for invalid courseId");
		}
	});

	// Test 5: Non-existent course
	await test("Should fail when course doesn't exist", async () => {
		const result = await deleteCourse(
			null,
			{ courseId: "99999" },
			{ user: null }
		);

		if (result.success) {
			throw new Error("Expected failure for non-existent course");
		}

		if (!result.message.includes("not found")) {
			throw new Error(
				`Expected 'not found' message but got: ${result.message}`
			);
		}
	});

	// Test 6: Delete course with deleted enrollments only
	await test("Should delete course with only deleted enrollments", async () => {
		// Create a new course for this test
		const testCourse = await prisma.course.create({
			data: {
				name: `Test Course Delete ${Date.now()}`,
				description: "Test course",
				daysOfWeek: ["MONDAY"],
				gender: "MALE",
				startAt: new Date("2024-01-01"),
				endAt: new Date("2024-12-31"),
				startTime: new Date("2024-01-01T09:00:00Z"),
				endTime: new Date("2024-01-01T11:00:00Z"),
				teacherId: testData.teacher.id,
				degrees: { connect: { id: testData.degree.id } },
			},
		});

		// Create a deleted enrollment
		await prisma.courseStudent.create({
			data: {
				courseId: testCourse.id,
				studentId: testData.student.id,
				monthlyPayment: 500000,
				isActive: false,
				isDeleted: true,
			},
		});

		const result = await deleteCourse(
			null,
			{ courseId: String(testCourse.id) },
			{ user: null }
		);

		if (!result.success) {
			throw new Error(
				`Expected success for course with only deleted enrollments but got: ${result.message}`
			);
		}

		// Verify course is deleted
		const deletedCourse = await prisma.course.findUnique({
			where: { id: testCourse.id },
		});

		if (deletedCourse) {
			throw new Error("Course should be deleted");
		}
	});

	// Test 7: Delete course with substitute teachers
	await test("Should delete course and all substitute teachers", async () => {
		// Create a new course with substitute teachers
		const testCourse = await prisma.course.create({
			data: {
				name: `Test Course Substitutes ${Date.now()}`,
				description: "Test course",
				daysOfWeek: ["MONDAY"],
				gender: "MALE",
				startAt: new Date("2024-01-01"),
				endAt: new Date("2024-12-31"),
				startTime: new Date("2024-01-01T09:00:00Z"),
				endTime: new Date("2024-01-01T11:00:00Z"),
				teacherId: testData.teacher.id,
				degrees: { connect: { id: testData.degree.id } },
			},
		});

		// Create substitute teacher assignments
		await prisma.substituteTeacher.create({
			data: {
				courseId: testCourse.id,
				teacherId: testData.substituteTeacher.id,
				startDate: new Date("2024-06-01"),
				endDate: new Date("2024-06-30"),
				reason: "Test",
			},
		});

		const result = await deleteCourse(
			null,
			{ courseId: String(testCourse.id) },
			{ user: null }
		);

		if (!result.success) {
			throw new Error(
				`Expected success but got: ${result.message} - ${result.errors?.join(
					", "
				)}`
			);
		}

		// Verify substitute teachers are deleted
		const substitutes = await prisma.substituteTeacher.findMany({
			where: { courseId: testCourse.id },
		});

		if (substitutes.length > 0) {
			throw new Error("Substitute teachers should be deleted");
		}
	});

	// Cleanup
	await cleanupTestData(testData);

	// Print summary
	console.log("\n" + "=".repeat(60));
	console.log("📊 TEST SUMMARY");
	console.log("=".repeat(60));
	console.log(`✅ Passed: ${passed}`);
	console.log(`❌ Failed: ${failed}`);
	console.log(`📝 Total: ${tests.length}`);
	console.log("=".repeat(60));

	if (failed > 0) {
		console.log("\n❌ Failed Tests:");
		tests
			.filter((t) => t.status === "❌ FAILED")
			.forEach((t) => {
				console.log(`   • ${t.name}: ${t.error}`);
			});
		process.exitCode = 1;
	} else {
		console.log("\n🎉 All tests passed!");
	}
}

// Run tests
runTests()
	.catch((error) => {
		console.error("❌ Test suite failed:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
