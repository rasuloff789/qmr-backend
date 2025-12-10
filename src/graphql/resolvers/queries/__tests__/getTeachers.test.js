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

	beforeEach(async () => {
		const degree = await createTestDegree();
		testData.degrees.push(degree);

		for (let i = 0; i < 3; i++) {
			const teacher = await createTestTeacher({
				username: `teacher${i}${Date.now()}${Math.random().toString(36).substring(2, 4)}`.slice(0, 10),
				degreeIds: [degree.id],
			});
			testData.teachers.push(teacher);
		}
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { degrees: [], teachers: [] };
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("Barcha teachersni qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await getTeachers(null, {}, context);

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThanOrEqual(3);
		});

		it("Teacher barcha kerakli maydonlar bilan qaytarilishi kerak", async () => {
			const context = createMockContext();
			const result = await getTeachers(null, {}, context);

			if (result.length > 0) {
				const teacher = result[0];
				expect(teacher).toHaveProperty("id");
				expect(teacher).toHaveProperty("username");
				expect(teacher).toHaveProperty("degrees");
			}
		});
	});
});

