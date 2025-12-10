/**
 * Jest Test Suite for getStudents Query
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import getStudents from "../getStudents.js";
import {
	createTestDegree,
	createTestStudent,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";

describe("getStudents Query", () => {
	let testData = {
		degrees: [],
		students: [],
	};

	beforeEach(async () => {
		const degree = await createTestDegree();
		testData.degrees.push(degree);

		for (let i = 0; i < 3; i++) {
			const student = await createTestStudent({
				username: `student${i}${Date.now()}${Math.random().toString(36).substring(2, 4)}`.slice(0, 10),
				degreeIds: [degree.id],
			});
			testData.students.push(student);
		}
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { degrees: [], students: [] };
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("Barcha studentlarni qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await getStudents(null, {}, context);

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThanOrEqual(3);
		});

		it("Faqat o'chirilmagan studentlarni qaytarishi kerak", async () => {
			const deletedStudent = await createTestStudent({
				username: `deleted${Date.now()}${Math.random().toString(36).substring(2, 4)}`.slice(0, 10),
				isDeleted: true,
				degreeIds: [testData.degrees[0].id],
			});

			const context = createMockContext();
			const result = await getStudents(null, {}, context);

			const deletedInResult = result.find((s) => s.id === deletedStudent.id);
			expect(deletedInResult).toBeUndefined();

			await cleanupTestData({ students: [deletedStudent] });
		});
	});
});

