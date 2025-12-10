/**
 * Jest Test Suite for addStudent Mutation
 * 
 * Bu test fayli addStudent mutation uchun to'liq testlarni o'z ichiga oladi.
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { addStudent } from "../addStudent.js";
import {
	createTestDegree,
	createTestStudent,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";
import { prisma } from "../../../../database/index.js";

describe("addStudent Mutation", () => {
	let testData = {
		degrees: [],
		students: [],
	};

	// Har bir testdan oldin
	beforeEach(async () => {
		// Test uchun degree yaratish
		const degree = await createTestDegree();
		testData.degrees.push(degree);
	});

	// Har bir testdan keyin cleanup
	afterEach(async () => {
		await cleanupTestData(testData);
		testData = {
			degrees: [],
			students: [],
		};
	});

	describe("Muvaffaqiyatli testlar (Success Cases)", () => {
		it("To'g'ri ma'lumotlar bilan student yaratish kerak", async () => {
			const context = createMockContext();
			// Username: faqat kichik harflar va raqamlar, 4-10 belgi
			const uniqueId = `${Date.now()}${Math.random().toString(36).substring(2, 4)}`;
			const args = {
				username: `std${uniqueId.slice(-7)}`, // Eng oxirgi 7 raqam
				password: "Password123",
				fullname: "Test Student",
				birthDate: "2000-01-01",
				phone: "998901234567",
				tgUsername: `testst${Date.now().toString().slice(-8)}`, // Telegram username: faqat harflar, raqamlar va _
				gender: "MALE",
				possibleDegrees: [String(testData.degrees[0].id)],
			};

			const result = await addStudent(null, args, context);

			// Assertions
			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}
			
			expect(result.success).toBe(true);
			expect(result.student).toBeTruthy();
			expect(result.student.username).toBe(args.username);
			expect(result.student.fullname).toBe(args.fullname);
			expect(result.errors).toEqual([]);

			// Database'dan tekshirish
			const createdStudent = await prisma.student.findUnique({
				where: { username: args.username },
			});
			expect(createdStudent).toBeTruthy();
			expect(createdStudent.fullname).toBe(args.fullname);

			testData.students.push(createdStudent);
		});

		it("Phone bo'sh bo'lsa ham student yaratish kerak", async () => {
			const context = createMockContext();
			const uniqueId = `${Date.now()}${Math.random().toString(36).substring(2, 4)}`;
			const args = {
				username: `std${uniqueId.slice(-7)}`,
				password: "Password123",
				fullname: "Test Student No Phone",
				birthDate: "2000-01-01",
				phone: null,
				tgUsername: `testst${Date.now().toString().slice(-8)}`,
				gender: "FEMALE",
				possibleDegrees: [String(testData.degrees[0].id)],
			};

			const result = await addStudent(null, args, context);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			expect(result.student).toBeTruthy();
			expect(result.errors).toEqual([]);

			const createdStudent = await prisma.student.findUnique({
				where: { username: args.username },
			});
			testData.students.push(createdStudent);
		});
	});

	describe("Validatsiya xatoliklari (Validation Errors)", () => {
		it("Noto'g'ri username bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const args = {
				username: `invalid username!${Date.now()}`, // Space va ! belgilar noto'g'ri
				password: "Password123",
				fullname: "Test Student",
				birthDate: "2000-01-01",
				phone: "998901234567",
				tgUsername: "teststudent",
				gender: "MALE",
				possibleDegrees: [String(testData.degrees[0].id)],
			};

			const result = await addStudent(null, args, context);

			expect(result.success).toBe(false);
			expect(result.student).toBeNull();
			expect(result.errors).toBeTruthy();
			expect(result.errors.length).toBeGreaterThan(0);
		});

		it("Kuchsiz parol bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const uniqueId = `${Date.now()}${Math.random().toString(36).substring(2, 4)}`;
			const args = {
				username: `std${uniqueId.slice(-7)}`,
				password: "weak", // Parol juda kuchsiz
				fullname: "Test Student",
				birthDate: "2000-01-01",
				phone: "998901234567",
				tgUsername: "teststudent",
				gender: "MALE",
				possibleDegrees: [String(testData.degrees[0].id)],
			};

			const result = await addStudent(null, args, context);

			expect(result.success).toBe(false);
			expect(result.student).toBeNull();
			expect(result.errors).toBeTruthy();
			expect(
				result.errors.some((e) => e.includes("Password"))
			).toBe(true);
		});

		it("Noto'g'ri telefon raqami bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const args = {
				username: `student.badphone.${Date.now()}`,
				password: "Password123",
				fullname: "Test Student",
				birthDate: "2000-01-01",
				phone: "12345", // Noto'g'ri format
				tgUsername: "teststudent",
				gender: "MALE",
				possibleDegrees: [String(testData.degrees[0].id)],
			};

			const result = await addStudent(null, args, context);

			expect(result.success).toBe(false);
			expect(result.student).toBeNull();
			expect(result.errors).toBeTruthy();
		});

		it("Noto'g'ri telegram username bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const args = {
				username: `student.badtg.${Date.now()}`,
				password: "Password123",
				fullname: "Test Student",
				birthDate: "2000-01-01",
				phone: "998901234567",
				tgUsername: "@invalid username!", // Space va ! belgilar
				gender: "MALE",
				possibleDegrees: [String(testData.degrees[0].id)],
			};

			const result = await addStudent(null, args, context);

			expect(result.success).toBe(false);
			expect(result.student).toBeNull();
			expect(result.errors).toBeTruthy();
		});

		it("Noto'g'ri tug'ilgan sana bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const args = {
				username: `student.baddate.${Date.now()}`,
				password: "Password123",
				fullname: "Test Student",
				birthDate: "invalid-date", // Noto'g'ri format
				phone: "998901234567",
				tgUsername: "teststudent",
				gender: "MALE",
				possibleDegrees: [String(testData.degrees[0].id)],
			};

			const result = await addStudent(null, args, context);

			expect(result.success).toBe(false);
			expect(result.student).toBeNull();
			expect(result.errors).toBeTruthy();
		});
	});

	describe("Duplicate va boshqa xatolar (Duplicate & Other Errors)", () => {
		it("Mavjud username bilan xato qaytarishi kerak", async () => {
			// Avval bir student yaratamiz - to'g'ri username formatida
			const uniqueId1 = `${Date.now()}${Math.random().toString(36).substring(2, 4)}`;
			const existingUsername = `std${uniqueId1.slice(-7)}`;
			const existingStudent = await createTestStudent({
				username: existingUsername,
			});
			testData.students.push(existingStudent);

			const context = createMockContext();
			const args = {
				username: existingUsername, // Bir xil username
				password: "Password123",
				fullname: "Test Student",
				birthDate: "2000-01-01",
				phone: "998901234567",
				tgUsername: `testst${Date.now().toString().slice(-8)}`,
				gender: "MALE",
				possibleDegrees: [String(testData.degrees[0].id)],
			};

			const result = await addStudent(null, args, context);

			expect(result.success).toBe(false);
			expect(result.student).toBeNull();
			expect(result.errors).toBeTruthy();
			expect(
				result.errors.some((e) =>
					e.toLowerCase().includes("already exists") || e.toLowerCase().includes("in use")
				)
			).toBe(true);
		});

		it("Mavjud bo'lmagan degree ID bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const args = {
				username: `student.nodegree.${Date.now()}`,
				password: "Password123",
				fullname: "Test Student",
				birthDate: "2000-01-01",
				phone: "998901234567",
				tgUsername: `testst${Date.now().toString().slice(-8)}`, // Telegram username: faqat harflar, raqamlar va _
				gender: "MALE",
				possibleDegrees: [99999], // Mavjud bo'lmagan ID
			};

			const result = await addStudent(null, args, context);

			expect(result.success).toBe(false);
			expect(result.student).toBeNull();
			expect(result.errors).toBeTruthy();
		});
	});

	describe("Gender va boshqa maydonlar", () => {
		it("FEMALE gender bilan student yaratish kerak", async () => {
			const context = createMockContext();
			const uniqueId = `${Date.now()}${Math.random().toString(36).substring(2, 4)}`;
			const args = {
				username: `std${uniqueId.slice(-7)}`,
				password: "Password123",
				fullname: "Test Female Student",
				birthDate: "2000-01-01",
				phone: "998901234567",
				tgUsername: `testst${Date.now().toString().slice(-8)}`, // Telegram username: faqat harflar, raqamlar va _
				gender: "FEMALE",
				possibleDegrees: [String(testData.degrees[0].id)],
			};

			const result = await addStudent(null, args, context);

			expect(result.success).toBe(true);
			expect(result.student.gender).toBe("FEMALE");

			const createdStudent = await prisma.student.findUnique({
				where: { username: args.username },
			});
			testData.students.push(createdStudent);
		});

		it("CHILD gender bilan student yaratish kerak", async () => {
			const context = createMockContext();
			const uniqueId = `${Date.now()}${Math.random().toString(36).substring(2, 4)}`;
			const args = {
				username: `std${uniqueId.slice(-7)}`,
				password: "Password123",
				fullname: "Test Child Student",
				birthDate: "2015-01-01",
				phone: "998901234567",
				tgUsername: `testst${Date.now().toString().slice(-8)}`, // Telegram username: faqat harflar, raqamlar va _
				gender: "CHILD",
				possibleDegrees: [String(testData.degrees[0].id)],
			};

			const result = await addStudent(null, args, context);

			expect(result.success).toBe(true);
			expect(result.student.gender).toBe("CHILD");

			const createdStudent = await prisma.student.findUnique({
				where: { username: args.username },
			});
			testData.students.push(createdStudent);
		});
	});
});

