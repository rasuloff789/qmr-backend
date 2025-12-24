/**
 * Comprehensive test script for tgUsername optional changes
 * Tests:
 * 1. Add teacher without tgUsername
 * 2. Add teacher with empty string tgUsername
 * 3. Add student with only phone (no tgUsername)
 * 4. Add student with only tgUsername (no phone)
 * 5. Add student with neither (should fail)
 * 6. Add student with empty string tgUsername
 * 7. Update teacher to remove tgUsername (null)
 * 8. Update teacher to remove tgUsername (empty string)
 * 9. Update student to remove tgUsername (null)
 * 10. Update student to remove tgUsername (empty string)
 */

import { prisma } from "../src/database/index.js";
import { addTeacher } from "../src/graphql/resolvers/mutations/addTeacher.js";
import { addStudent } from "../src/graphql/resolvers/mutations/addStudent.js";
import { updateTeacher } from "../src/graphql/resolvers/mutations/updateTeacher.js";
import { updateStudent } from "../src/graphql/resolvers/mutations/updateStudent.js";
import { createMockContext } from "../tests/helpers/testHelpers.js";

const context = createMockContext();

let testResults = {
	passed: [],
	failed: [],
};

function logTest(name, passed, message = "") {
	if (passed) {
		testResults.passed.push(name);
		console.log(`✅ ${name}`);
	} else {
		testResults.failed.push({ name, message });
		console.log(`❌ ${name}: ${message}`);
	}
}

async function cleanup() {
	// Clean up test data
	const testUsernames = [
		"testteacher1",
		"testteacher2",
		"testteacher3",
		"teststudent1",
		"teststudent2",
		"teststudent3",
		"teststudent4",
		"teststudent5",
	];

	for (const username of testUsernames) {
		await prisma.teacher.deleteMany({ where: { username } }).catch(() => {});
		await prisma.student.deleteMany({ where: { username } }).catch(() => {});
	}
}

async function runTests() {
	console.log("🧪 Testing tgUsername optional changes...\n");

	// Create a test degree
	const degree = await prisma.degree.findFirst();
	if (!degree) {
		console.log("❌ No degree found. Please seed degrees first.");
		process.exit(1);
	}

	try {
		// Test 1: Add teacher without tgUsername
		console.log("Test 1: Add teacher without tgUsername");
		const result1 = await addTeacher(null, {
			username: "testteacher1",
			password: "Password123",
			fullname: "Test Teacher 1",
			birthDate: "1980-01-01",
			phone: "998901234567",
			tgUsername: null,
			gender: "MALE",
			degreeIds: [String(degree.id)],
		}, context);
		logTest("Add teacher without tgUsername", result1.success, result1.message);

		// Test 2: Add teacher with empty string tgUsername
		console.log("\nTest 2: Add teacher with empty string tgUsername");
		const result2 = await addTeacher(null, {
			username: "testteacher2",
			password: "Password123",
			fullname: "Test Teacher 2",
			birthDate: "1980-01-01",
			phone: "998901234568",
			tgUsername: "",
			gender: "MALE",
			degreeIds: [String(degree.id)],
		}, context);
		logTest("Add teacher with empty string tgUsername", result2.success, result2.message);

		// Test 3: Add student with only phone (no tgUsername)
		console.log("\nTest 3: Add student with only phone (no tgUsername)");
		const result3 = await addStudent(null, {
			username: "teststudent1",
			password: "Password123",
			fullname: "Test Student 1",
			birthDate: "2000-01-01",
			phone: "998901234569",
			tgUsername: null,
			gender: "MALE",
			possibleDegrees: [String(degree.id)],
		}, context);
		logTest("Add student with only phone", result3.success, result3.message);

		// Test 4: Add student with only tgUsername (no phone)
		console.log("\nTest 4: Add student with only tgUsername (no phone)");
		const result4 = await addStudent(null, {
			username: "teststudent2",
			password: "Password123",
			fullname: "Test Student 2",
			birthDate: "2000-01-01",
			phone: null,
			tgUsername: "teststudent2",
			gender: "FEMALE",
			possibleDegrees: [String(degree.id)],
		}, context);
		logTest("Add student with only tgUsername", result4.success, result4.message);

		// Test 5: Add student with neither (should fail)
		console.log("\nTest 5: Add student with neither phone nor tgUsername (should fail)");
		const result5 = await addStudent(null, {
			username: "teststudent3",
			password: "Password123",
			fullname: "Test Student 3",
			birthDate: "2000-01-01",
			phone: null,
			tgUsername: null,
			gender: "MALE",
			possibleDegrees: [String(degree.id)],
		}, context);
		logTest("Add student with neither (should fail)", !result5.success && result5.code === "STUDENT_CONTACT_REQUIRED", result5.message);

		// Test 6: Add student with empty string tgUsername
		console.log("\nTest 6: Add student with empty string tgUsername");
		const result6 = await addStudent(null, {
			username: "teststudent4",
			password: "Password123",
			fullname: "Test Student 4",
			birthDate: "2000-01-01",
			phone: "998901234570",
			tgUsername: "",
			gender: "MALE",
			possibleDegrees: [String(degree.id)],
		}, context);
		logTest("Add student with empty string tgUsername", result6.success, result6.message);

		// Test 7: Update teacher to remove tgUsername (null)
		if (result1.success && result1.teacher) {
			console.log("\nTest 7: Update teacher to remove tgUsername (null)");
			const result7 = await updateTeacher(null, {
				id: String(result1.teacher.id),
				tgUsername: null,
			}, context);
			logTest("Update teacher to remove tgUsername (null)", result7.success, result7.message);
		}

		// Test 8: Update teacher to remove tgUsername (empty string)
		if (result2.success && result2.teacher) {
			// First add a tgUsername
			await updateTeacher(null, {
				id: String(result2.teacher.id),
				tgUsername: "testteacher2",
			}, context);
			
			console.log("\nTest 8: Update teacher to remove tgUsername (empty string)");
			const result8 = await updateTeacher(null, {
				id: String(result2.teacher.id),
				tgUsername: "",
			}, context);
			logTest("Update teacher to remove tgUsername (empty string)", result8.success && result8.teacher.tgUsername === null, result8.message);
		}

		// Test 9: Update student to remove tgUsername (null)
		if (result4.success && result4.student) {
			console.log("\nTest 9: Update student to remove tgUsername (null) - should fail without phone");
			const result9 = await updateStudent(null, {
				id: String(result4.student.id),
				tgUsername: null,
			}, context);
			logTest("Update student to remove tgUsername without phone (should fail)", !result9.success && result9.code === "STUDENT_CONTACT_REQUIRED", result9.message);
		}

		// Test 10: Update student to remove tgUsername (empty string) - with phone
		if (result3.success && result3.student) {
			// First add a tgUsername
			await updateStudent(null, {
				id: String(result3.student.id),
				tgUsername: "teststudent1",
			}, context);
			
			console.log("\nTest 10: Update student to remove tgUsername (empty string) - with phone");
			const result10 = await updateStudent(null, {
				id: String(result3.student.id),
				tgUsername: "",
			}, context);
			logTest("Update student to remove tgUsername (empty string) with phone", result10.success && result10.student.tgUsername === null, result10.message);
		}

	} catch (error) {
		console.error("❌ Test error:", error);
	} finally {
		await cleanup();
	}

	// Summary
	console.log("\n" + "=".repeat(50));
	console.log("📊 Test Summary:");
	console.log(`✅ Passed: ${testResults.passed.length}`);
	console.log(`❌ Failed: ${testResults.failed.length}`);
	
	if (testResults.failed.length > 0) {
		console.log("\nFailed tests:");
		testResults.failed.forEach(({ name, message }) => {
			console.log(`  - ${name}: ${message}`);
		});
		process.exit(1);
	} else {
		console.log("\n🎉 All tests passed!");
		process.exit(0);
	}
}

runTests().catch(console.error);

