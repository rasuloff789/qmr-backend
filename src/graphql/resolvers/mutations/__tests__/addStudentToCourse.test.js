/**
 * QMR Backend - Add Student to Course Mutation Tests
 *
 * Comprehensive test suite for the addStudentToCourse mutation.
 * Tests all validation scenarios and edge cases.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { addStudentToCourse } from "../addStudentToCourse.js";
import { prisma } from "../../../../database/index.js";

/**
 * Test suite for addStudentToCourse mutation
 */
async function runTests() {
	console.log("🧪 Starting addStudentToCourse mutation tests...\n");

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
			where: { name: "Test Degree" },
			update: {},
			create: { name: "Test Degree" },
		});

		// Create a teacher
		const teacher = await prisma.teacher.upsert({
			where: { username: "test.teacher" },
			update: {
				degrees: { connect: { id: degree.id } },
				gender: "MALE",
				isActive: true,
				isDeleted: false,
			},
			create: {
				username: "test.teacher",
				fullname: "Test Teacher",
				password: "hashed",
				birthDate: new Date("1980-01-01"),
				phone: "998901234567",
				tgUsername: "testteacher",
				gender: "MALE",
				degrees: { connect: { id: degree.id } },
				isActive: true,
				isDeleted: false,
			},
		});

		// Create a course
		const course = await prisma.course.upsert({
			where: { name: "Test Course" },
			update: {
				teacherId: teacher.id,
				degrees: { set: [], connect: { id: degree.id } },
				gender: "MALE",
			},
			create: {
				name: "Test Course",
				description: "Test course description",
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

		// Create a matching student (same gender, has matching degree)
		const matchingStudent = await prisma.student.upsert({
			where: { username: "test.student.matching" },
			update: {
				gender: "MALE",
				possibleDegrees: { set: [], connect: { id: degree.id } },
				isActive: true,
				isDeleted: false,
			},
			create: {
				username: "test.student.matching",
				fullname: "Test Student Matching",
				password: "hashed",
				birthDate: new Date("2000-01-01"),
				phone: "998901234568",
				tgUsername: "teststudentmatching",
				gender: "MALE",
				possibleDegrees: { connect: { id: degree.id } },
				isActive: true,
				isDeleted: false,
			},
		});

		// Create a student with gender mismatch
		const genderMismatchStudent = await prisma.student.upsert({
			where: { username: "test.student.gender.mismatch" },
			update: {
				gender: "FEMALE",
				possibleDegrees: { set: [], connect: { id: degree.id } },
				isActive: true,
				isDeleted: false,
			},
			create: {
				username: "test.student.gender.mismatch",
				fullname: "Test Student Gender Mismatch",
				password: "hashed",
				birthDate: new Date("2000-01-01"),
				phone: "998901234569",
				tgUsername: "teststudentgendermismatch",
				gender: "FEMALE",
				possibleDegrees: { connect: { id: degree.id } },
				isActive: true,
				isDeleted: false,
			},
		});

		// Create another degree
		const otherDegree = await prisma.degree.upsert({
			where: { name: "Other Test Degree" },
			update: {},
			create: { name: "Other Test Degree" },
		});

		// Create a student with degree mismatch
		const degreeMismatchStudent = await prisma.student.upsert({
			where: { username: "test.student.degree.mismatch" },
			update: {
				gender: "MALE",
				possibleDegrees: { set: [], connect: { id: otherDegree.id } },
				isActive: true,
				isDeleted: false,
			},
			create: {
				username: "test.student.degree.mismatch",
				fullname: "Test Student Degree Mismatch",
				password: "hashed",
				birthDate: new Date("2000-01-01"),
				phone: "998901234570",
				tgUsername: "teststudentdegreemismatch",
				gender: "MALE",
				possibleDegrees: { connect: { id: otherDegree.id } },
				isActive: true,
				isDeleted: false,
			},
		});

		return {
			course,
			degree,
			matchingStudent,
			genderMismatchStudent,
			degreeMismatchStudent,
		};
	}

	/**
	 * Cleanup test data
	 */
	async function cleanupTestData(testData) {
		// Delete enrollments
		await prisma.courseStudent.deleteMany({
			where: {
				courseId: testData.course.id,
			},
		});
	}

	// Get or create test data
	const testData = await createTestData();

	// Test 1: Successful enrollment
	await test("Should successfully enroll a valid student", async () => {
		// Clean up any existing enrollment first
		await prisma.courseStudent.deleteMany({
			where: {
				courseId: testData.course.id,
				studentId: testData.matchingStudent.id,
			},
		});

		const result = await addStudentToCourse(
			null,
			{
				courseId: String(testData.course.id),
				studentId: String(testData.matchingStudent.id),
				monthlyPayment: 500000,
			},
			{ user: null }
		);

		if (!result.success) {
			throw new Error(
				`Expected success but got: ${result.message} - ${result.errors?.join(
					", "
				)}`
			);
		}

		if (!result.courseStudent) {
			throw new Error("Expected courseStudent but got null");
		}

		if (result.courseStudent.monthlyPayment !== 500000) {
			throw new Error(
				`Expected monthlyPayment 500000 but got ${result.courseStudent.monthlyPayment}`
			);
		}
	});

	// Test 2: Duplicate enrollment (should fail)
	await test("Should fail when student is already enrolled", async () => {
		const result = await addStudentToCourse(
			null,
			{
				courseId: String(testData.course.id),
				studentId: String(testData.matchingStudent.id),
				monthlyPayment: 500000,
			},
			{ user: null }
		);

		if (result.success) {
			throw new Error("Expected failure for duplicate enrollment");
		}

		if (!result.message.includes("already enrolled")) {
			throw new Error(
				`Expected 'already enrolled' message but got: ${result.message}`
			);
		}
	});

	// Test 3: Gender mismatch
	await test("Should fail when student gender doesn't match course gender", async () => {
		const result = await addStudentToCourse(
			null,
			{
				courseId: String(testData.course.id),
				studentId: String(testData.genderMismatchStudent.id),
				monthlyPayment: 500000,
			},
			{ user: null }
		);

		if (result.success) {
			throw new Error("Expected failure for gender mismatch");
		}

		if (!result.message.includes("Gender mismatch")) {
			throw new Error(
				`Expected 'Gender mismatch' message but got: ${result.message}`
			);
		}
	});

	// Test 4: Degree mismatch
	await test("Should fail when student doesn't have matching degrees", async () => {
		const result = await addStudentToCourse(
			null,
			{
				courseId: String(testData.course.id),
				studentId: String(testData.degreeMismatchStudent.id),
				monthlyPayment: 500000,
			},
			{ user: null }
		);

		if (result.success) {
			throw new Error("Expected failure for degree mismatch");
		}

		if (!result.message.includes("Degree mismatch")) {
			throw new Error(
				`Expected 'Degree mismatch' message but got: ${result.message}`
			);
		}
	});

	// Test 5: Missing courseId
	await test("Should fail when courseId is missing", async () => {
		const result = await addStudentToCourse(
			null,
			{
				courseId: null,
				studentId: String(testData.matchingStudent.id),
				monthlyPayment: 500000,
			},
			{ user: null }
		);

		if (result.success) {
			throw new Error("Expected failure for missing courseId");
		}

		if (!result.errors?.some((e) => e.includes("required"))) {
			throw new Error("Expected validation error for missing courseId");
		}
	});

	// Test 6: Missing studentId
	await test("Should fail when studentId is missing", async () => {
		const result = await addStudentToCourse(
			null,
			{
				courseId: String(testData.course.id),
				studentId: null,
				monthlyPayment: 500000,
			},
			{ user: null }
		);

		if (result.success) {
			throw new Error("Expected failure for missing studentId");
		}

		if (!result.errors?.some((e) => e.includes("required"))) {
			throw new Error("Expected validation error for missing studentId");
		}
	});

	// Test 7: Invalid monthlyPayment
	await test("Should fail when monthlyPayment is invalid", async () => {
		const result = await addStudentToCourse(
			null,
			{
				courseId: String(testData.course.id),
				studentId: String(testData.matchingStudent.id),
				monthlyPayment: 0,
			},
			{ user: null }
		);

		if (result.success) {
			throw new Error("Expected failure for invalid monthlyPayment");
		}

		if (!result.errors?.some((e) => e.includes("positive"))) {
			throw new Error("Expected validation error for invalid monthlyPayment");
		}
	});

	// Test 8: Non-existent course
	await test("Should fail when course doesn't exist", async () => {
		const result = await addStudentToCourse(
			null,
			{
				courseId: "99999",
				studentId: String(testData.matchingStudent.id),
				monthlyPayment: 500000,
			},
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

	// Test 9: Non-existent student
	await test("Should fail when student doesn't exist", async () => {
		const result = await addStudentToCourse(
			null,
			{
				courseId: String(testData.course.id),
				studentId: "99999",
				monthlyPayment: 500000,
			},
			{ user: null }
		);

		if (result.success) {
			throw new Error("Expected failure for non-existent student");
		}

		if (!result.message.includes("not found")) {
			throw new Error(
				`Expected 'not found' message but got: ${result.message}`
			);
		}
	});

	// Test 10: Reactivate deleted enrollment
	await test("Should reactivate a deleted enrollment", async () => {
		// First, get or create a deleted enrollment
		// Delete any existing enrollment first
		await prisma.courseStudent.deleteMany({
			where: {
				courseId: testData.course.id,
				studentId: testData.matchingStudent.id,
			},
		});

		// Create a deleted enrollment
		let enrollment = await prisma.courseStudent.create({
			data: {
				courseId: testData.course.id,
				studentId: testData.matchingStudent.id,
				monthlyPayment: 400000,
				isActive: false,
				isDeleted: true,
			},
		});

		const result = await addStudentToCourse(
			null,
			{
				courseId: String(testData.course.id),
				studentId: String(testData.matchingStudent.id),
				monthlyPayment: 600000,
			},
			{ user: null }
		);

		if (!result.success) {
			throw new Error(
				`Expected success for reactivation but got: ${
					result.message
				} - ${result.errors?.join(", ")}`
			);
		}

		if (!result.message.includes("re-enrolled")) {
			throw new Error(
				`Expected 're-enrolled' message but got: ${result.message}`
			);
		}

		// Verify it was reactivated
		const reactivated = await prisma.courseStudent.findUnique({
			where: { id: enrollment.id },
		});

		if (!reactivated) {
			throw new Error("Enrollment not found after reactivation");
		}

		if (reactivated.isDeleted || !reactivated.isActive) {
			throw new Error(
				`Enrollment should be reactivated. isDeleted: ${reactivated.isDeleted}, isActive: ${reactivated.isActive}`
			);
		}

		if (reactivated.monthlyPayment !== 600000) {
			throw new Error(
				`Monthly payment should be updated to 600000 but got ${reactivated.monthlyPayment}`
			);
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
