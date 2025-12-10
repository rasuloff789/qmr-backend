/**
 * Jest Test Suite for getTeacher Query
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import getTeacher from "../getTeacher.js";
import {
	createTestDegree,
	createTestTeacher,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";

describe("getTeacher Query", () => {
	let testData = {
		degrees: [],
		teachers: [],
	};

	beforeEach(async () => {
		const degree = await createTestDegree();
		testData.degrees.push(degree);

		const teacher = await createTestTeacher({
			degreeIds: [degree.id],
		});
		testData.teachers.push(teacher);
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { degrees: [], teachers: [] };
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("Mavjud teacher ID bilan teacher qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await getTeacher(
				null,
				{ id: String(testData.teachers[0].id) },
				context
			);

			expect(result).toBeTruthy();
			expect(result.id).toBe(testData.teachers[0].id);
			expect(result.username).toBe(testData.teachers[0].username);
		});
	});

	describe("Xato holatlar", () => {
		it("Mavjud bo'lmagan ID bilan null qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await getTeacher(null, { id: "99999" }, context);

			expect(result).toBeNull();
		});
	});
});

