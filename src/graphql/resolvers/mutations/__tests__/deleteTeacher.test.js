/**
 * Jest Test Suite for deleteTeacher Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { deleteTeacher } from "../deleteTeacher.js";
import {
	createTestDegree,
	createTestTeacher,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";
import { prisma } from "../../../../database/index.js";

describe("deleteTeacher Mutation", () => {
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
		it("Teacher o'chirish kerak (isDeleted = true)", async () => {
			const teacher = await createTestTeacher({
				degreeIds: [testData.degrees[0].id],
			});
			const context = createMockContext();
			const result = await deleteTeacher(
				null,
				{ id: String(teacher.id) },
				context
			);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			const deleted = await prisma.teacher.findUnique({ where: { id: teacher.id } });
			expect(deleted.isDeleted).toBe(true);
		});
	});

	describe("Xato holatlar", () => {
		it("Mavjud bo'lmagan ID bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await deleteTeacher(null, { id: "99999" }, context);

			expect(result.success).toBe(false);
		});

		it("Noto'g'ri ID format bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await deleteTeacher(null, { id: "invalid" }, context);

			expect(result.success).toBe(false);
		});
	});
});

