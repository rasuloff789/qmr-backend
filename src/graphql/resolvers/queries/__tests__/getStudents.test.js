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
	let maleStudent;
	let femaleStudent;
	let childStudent;
	let deletedStudent;

	beforeEach(async () => {
		const degree = await createTestDegree();
		testData.degrees.push(degree);

		maleStudent = await createTestStudent({
			username: `male${Date.now()}${Math.random().toString(36).substring(2, 4)}`.slice(0, 10),
			gender: "MALE",
			degreeIds: [degree.id],
		});
		femaleStudent = await createTestStudent({
			username: `fem${Date.now()}${Math.random().toString(36).substring(2, 4)}`.slice(0, 10),
			gender: "FEMALE",
			degreeIds: [degree.id],
		});
		childStudent = await createTestStudent({
			username: `chd${Date.now()}${Math.random().toString(36).substring(2, 4)}`.slice(0, 10),
			gender: "CHILD",
			degreeIds: [degree.id],
		});
		deletedStudent = await createTestStudent({
			username: `del${Date.now()}${Math.random().toString(36).substring(2, 4)}`.slice(0, 10),
			gender: "MALE",
			isDeleted: true,
			degreeIds: [degree.id],
		});

		testData.students.push(maleStudent, femaleStudent, childStudent, deletedStudent);
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { degrees: [], students: [] };
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("Male admin faqat MALE va CHILD studentlarni qaytarishi kerak", async () => {
			const context = createMockContext({ id: 1, role: "admin", gender: "MALE" });
			const result = await getStudents(null, {}, context);

			expect(Array.isArray(result)).toBe(true);
			const ids = result.map((s) => s.id);
			expect(ids).toContain(maleStudent.id);
			expect(ids).toContain(childStudent.id);
			expect(ids).not.toContain(femaleStudent.id);
			expect(ids).not.toContain(deletedStudent.id);
		});

		it("Female admin faqat FEMALE va CHILD studentlarni qaytarishi kerak", async () => {
			const context = createMockContext({ id: 1, role: "admin", gender: "FEMALE" });
			const result = await getStudents(null, {}, context);

			const ids = result.map((s) => s.id);
			expect(ids).toContain(femaleStudent.id);
			expect(ids).toContain(childStudent.id);
			expect(ids).not.toContain(maleStudent.id);
			expect(ids).not.toContain(deletedStudent.id);
		});
	});
});

