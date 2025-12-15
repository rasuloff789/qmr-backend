/**
 * Jest Test Suite for getTeachers Query
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import getTeachers from "../getTeachers.js";
import {
	createTestDegree,
	createTestTeacher,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";

describe("getTeachers Query", () => {
	let testData = {
		degrees: [],
		teachers: [],
	};
	let maleTeacher;
	let femaleTeacher;
	let childTeacher;
	let deletedTeacher;

	beforeEach(async () => {
		const degree = await createTestDegree();
		testData.degrees.push(degree);

		maleTeacher = await createTestTeacher({
			username: `male${Date.now()}${Math.random().toString(36).substring(2, 4)}`.slice(0, 10),
			gender: "MALE",
			degreeIds: [degree.id],
			isDeleted: false,
		});
		femaleTeacher = await createTestTeacher({
			username: `fem${Date.now()}${Math.random().toString(36).substring(2, 4)}`.slice(0, 10),
			gender: "FEMALE",
			degreeIds: [degree.id],
			isDeleted: false,
		});
		childTeacher = await createTestTeacher({
			username: `chd${Date.now()}${Math.random().toString(36).substring(2, 4)}`.slice(0, 10),
			gender: "CHILD",
			degreeIds: [degree.id],
			isDeleted: false,
		});
		deletedTeacher = await createTestTeacher({
			username: `del${Date.now()}${Math.random().toString(36).substring(2, 4)}`.slice(0, 10),
			gender: "MALE",
			degreeIds: [degree.id],
			isDeleted: true,
		});

		testData.teachers.push(maleTeacher, femaleTeacher, childTeacher, deletedTeacher);
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { degrees: [], teachers: [] };
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("Male admin faqat MALE teacherlarni qaytarishi kerak", async () => {
			const context = createMockContext({ id: 1, role: "admin", gender: "MALE" });
			const result = await getTeachers(null, {}, context);

			expect(Array.isArray(result)).toBe(true);
			const ids = result.map((t) => t.id);
			expect(ids).toContain(maleTeacher.id);
			expect(ids).not.toContain(femaleTeacher.id);
			expect(ids).not.toContain(childTeacher.id);
			expect(ids).not.toContain(deletedTeacher.id);
		});

		it("Female admin faqat FEMALE teacherlarni qaytarishi kerak", async () => {
			const context = createMockContext({ id: 1, role: "admin", gender: "FEMALE" });
			const result = await getTeachers(null, {}, context);

			const ids = result.map((t) => t.id);
			expect(ids).toContain(femaleTeacher.id);
			expect(ids).not.toContain(maleTeacher.id);
			expect(ids).not.toContain(childTeacher.id);
			expect(ids).not.toContain(deletedTeacher.id);
		});
	});
});

