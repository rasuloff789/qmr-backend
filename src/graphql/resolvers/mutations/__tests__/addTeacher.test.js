/**
 * Jest Test Suite for addTeacher Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { addTeacher } from "../addTeacher.js";
import {
	createTestDegree,
	createTestTeacher,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";
import { prisma } from "../../../../database/index.js";

describe("addTeacher Mutation", () => {
	let testData = {
		degrees: [],
		teachers: [],
	};

	beforeEach(async () => {
		const degree = await createTestDegree();
		testData.degrees.push(degree);
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { degrees: [], teachers: [] };
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("To'g'ri ma'lumotlar bilan teacher yaratish kerak", async () => {
			const context = createMockContext();
			const uniqueId = `${Date.now()}${Math.random().toString(36).substring(2, 4)}`;
			const args = {
				username: `tch${uniqueId.slice(-7)}`,
				password: "Password123",
				fullname: "Test Teacher",
				birthDate: "1980-01-01",
				phone: "998901234567",
				tgUsername: `teacher${Date.now().toString().slice(-8)}`,
				gender: "MALE",
				degreeIds: [String(testData.degrees[0].id)],
			};

			const result = await addTeacher(null, args, context);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			expect(result.teacher).toBeTruthy();
			expect(result.teacher.username).toBe(args.username);
			testData.teachers.push(result.teacher);
		});
	});

	describe("Validatsiya xatoliklari", () => {
		it("Noto'g'ri username bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await addTeacher(
				null,
				{
					username: "Invalid Username!",
					password: "Password123",
					fullname: "Test",
					birthDate: "1980-01-01",
					phone: "998901234567",
					tgUsername: "teacher",
					gender: "MALE",
					degreeIds: [],
				},
				context
			);

			expect(result.success).toBe(false);
		});

		it("Kuchsiz parol bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const uniqueId = `${Date.now()}${Math.random().toString(36).substring(2, 4)}`;
			const result = await addTeacher(
				null,
				{
					username: `tch${uniqueId.slice(-7)}`,
					password: "weak",
					fullname: "Test",
					birthDate: "1980-01-01",
					phone: "998901234567",
					tgUsername: "teacher",
					gender: "MALE",
					degreeIds: [],
				},
				context
			);

			expect(result.success).toBe(false);
			expect(
				result.errors.some((e) => e.includes("Password"))
			).toBe(true);
		});
	});

	describe("Duplicate xatolar", () => {
		it("Mavjud username bilan xato qaytarishi kerak", async () => {
			const existingTeacher = await createTestTeacher({
				username: `existing${Date.now()}${Math.random().toString(36).substring(2, 4)}`.slice(0, 10),
			});
			testData.teachers.push(existingTeacher);

			const context = createMockContext();
			const result = await addTeacher(
				null,
				{
					username: existingTeacher.username,
					password: "Password123",
					fullname: "Test",
					birthDate: "1980-01-01",
					phone: "998901234568",
					tgUsername: "teacher2",
					gender: "MALE",
					degreeIds: [],
				},
				context
			);

			expect(result.success).toBe(false);
			expect(
				result.errors.some((e) =>
					e.toLowerCase().includes("already") || e.toLowerCase().includes("in use")
				)
			).toBe(true);
		});
	});
});

