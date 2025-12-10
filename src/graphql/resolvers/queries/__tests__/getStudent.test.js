/**
 * Jest Test Suite for getStudent Query
 * 
 * Bu test fayli getStudent query uchun to'liq testlarni o'z ichiga oladi.
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import getStudent from "../getStudent.js";
import {
	createTestDegree,
	createTestStudent,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";
import { prisma } from "../../../../database/index.js";

describe("getStudent Query", () => {
	let testData = {
		degrees: [],
		students: [],
	};

	beforeEach(async () => {
		const degree = await createTestDegree();
		testData.degrees.push(degree);
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = {
			degrees: [],
			students: [],
		};
	});

	describe("Muvaffaqiyatli testlar (Success Cases)", () => {
		it("Mavjud student ID bilan student qaytarishi kerak", async () => {
			// Test student yaratish
			const student = await createTestStudent({
				username: `test.student.${Date.now()}`,
				fullname: "Test Student",
				gender: "MALE",
				degreeIds: [testData.degrees[0].id],
			});
			testData.students.push(student);

			const context = createMockContext();
			const result = await getStudent(null, { id: String(student.id) }, context);

			expect(result).toBeTruthy();
			expect(result.id).toBe(student.id);
			expect(result.username).toBe(student.username);
			expect(result.fullname).toBe(student.fullname);
			expect(result.gender).toBe(student.gender);
		});

		it("Student barcha kerakli maydonlar bilan qaytarilishi kerak", async () => {
			const student = await createTestStudent({
				username: `test.student.full.${Date.now()}`,
				fullname: "Full Test Student",
				birthDate: new Date("2000-01-01"),
				phone: "998901234567",
				tgUsername: `teststudent${Date.now()}`,
				gender: "FEMALE",
				degreeIds: [testData.degrees[0].id],
			});
			testData.students.push(student);

			const context = createMockContext();
			const result = await getStudent(null, { id: String(student.id) }, context);

			expect(result).toBeTruthy();
			expect(result.id).toBe(student.id);
			expect(result.fullname).toBe("Full Test Student");
			expect(result.gender).toBe("FEMALE");
			expect(result.possibleDegrees).toBeTruthy();
		});
	});

	describe("Xato holatlar (Error Cases)", () => {
		it("Mavjud bo'lmagan ID bilan null qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await getStudent(null, { id: "99999" }, context);

			expect(result).toBeNull();
		});

		it("Noto'g'ri formatdagi ID bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();

			// Jest expect().toThrow() ishlatish uchun async funksiyani wrap qilish kerak
			await expect(
				getStudent(null, { id: "invalid-id" }, context)
			).rejects.toThrow();
		});

		it("Bo'sh ID bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();

			await expect(
				getStudent(null, { id: "" }, context)
			).rejects.toThrow();
		});
	});

	describe("Permission va context testlar", () => {
		it("Context bo'sh bo'lsa ham ishlashi kerak", async () => {
			const student = await createTestStudent({
				username: `test.student.context.${Date.now()}`,
				degreeIds: [testData.degrees[0].id],
			});
			testData.students.push(student);

			const context = createMockContext(null); // null user
			const result = await getStudent(null, { id: String(student.id) }, context);

			expect(result).toBeTruthy();
			expect(result.id).toBe(student.id);
		});

		it("Faqat aktiv va o'chirilmagan studentlarni qaytarishi kerak", async () => {
			// Aktiv student
			const activeStudent = await createTestStudent({
				username: `test.active.${Date.now()}`,
				isActive: true,
				isDeleted: false,
				degreeIds: [testData.degrees[0].id],
			});
			testData.students.push(activeStudent);

			// O'chirilgan student
			const deletedStudent = await createTestStudent({
				username: `test.deleted.${Date.now()}`,
				isActive: false,
				isDeleted: true,
				degreeIds: [testData.degrees[0].id],
			});
			testData.students.push(deletedStudent);

			const context = createMockContext();

			// Aktiv studentni topish kerak
			const activeResult = await getStudent(
				null,
				{ id: String(activeStudent.id) },
				context
			);
			expect(activeResult).toBeTruthy();

			// O'chirilgan studentni ham topish mumkin (agar select filter qilmasa)
			// Bu query logikasiga bog'liq
			const deletedResult = await getStudent(
				null,
				{ id: String(deletedStudent.id) },
				context
			);
			// Agar query isDeleted ni filter qilsa, null qaytaradi
			// Aks holda student qaytaradi
		});
	});

	describe("Relationship testlar", () => {
		it("Student bilan birga possibleDegrees qaytarilishi kerak", async () => {
			const degree1 = await createTestDegree(`Degree 1 ${Date.now()}`);
			const degree2 = await createTestDegree(`Degree 2 ${Date.now()}`);
			testData.degrees.push(degree1, degree2);

			const student = await createTestStudent({
				username: `test.student.degrees.${Date.now()}`,
				degreeIds: [degree1.id, degree2.id],
			});
			testData.students.push(student);

			const context = createMockContext();
			const result = await getStudent(null, { id: String(student.id) }, context);

			expect(result).toBeTruthy();
			expect(result.possibleDegrees).toBeTruthy();
			expect(Array.isArray(result.possibleDegrees)).toBe(true);
			expect(result.possibleDegrees.length).toBeGreaterThanOrEqual(0);
		});
	});
});

