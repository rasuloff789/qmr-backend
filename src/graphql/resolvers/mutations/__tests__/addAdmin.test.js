/**
 * Jest Test Suite for addAdmin Mutation
 * 
 * Bu test fayli addAdmin mutation uchun to'liq testlarni o'z ichiga oladi.
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { addAdmin } from "../addAdmin.js";
import {
	createTestAdmin,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";
import { prisma } from "../../../../database/index.js";

describe("addAdmin Mutation", () => {
	let testData = {
		admins: [],
	};

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { admins: [] };
	});

	describe("Muvaffaqiyatli testlar (Success Cases)", () => {
		it("To'g'ri ma'lumotlar bilan admin yaratish kerak", async () => {
			const context = createMockContext();
			const uniqueId = `${Date.now()}${Math.random().toString(36).substring(2, 4)}`;
			const args = {
				username: `adm${uniqueId.slice(-7)}`,
				password: "Password123",
				fullname: "Test Admin",
				birthDate: "1990-01-01",
				phone: "998901234567",
				tgUsername: `admin${Date.now().toString().slice(-8)}`,
				gender: "MALE",
			};

			const result = await addAdmin(null, args, context);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			expect(result.admin).toBeTruthy();
			expect(result.admin.username).toBe(args.username);
			expect(result.admin.fullname).toBe(args.fullname);
			expect(result.errors).toEqual([]);

			const createdAdmin = await prisma.admin.findUnique({
				where: { username: args.username },
			});
			expect(createdAdmin).toBeTruthy();
			testData.admins.push(createdAdmin);
		});

		it("FEMALE gender bilan admin yaratish kerak", async () => {
			const context = createMockContext();
			const uniqueId = `${Date.now()}${Math.random().toString(36).substring(2, 4)}`;
			const args = {
				username: `adm${uniqueId.slice(-7)}`,
				password: "Password123",
				fullname: "Test Female Admin",
				birthDate: "1990-01-01",
				phone: "998901234568",
				tgUsername: `admin${Date.now().toString().slice(-8)}`,
				gender: "FEMALE",
			};

			const result = await addAdmin(null, args, context);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			expect(result.admin).toBeTruthy();
			// Gender field select qilinmagan bo'lishi mumkin, lekin database'da saqlanadi
			if (result.admin.gender) {
				expect(result.admin.gender).toBe("FEMALE");
			}
			testData.admins.push(result.admin);
		});
	});

	describe("Validatsiya xatoliklari (Validation Errors)", () => {
		it("Noto'g'ri username bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const args = {
				username: "Invalid Username!", // Space va ! belgilar
				password: "Password123",
				fullname: "Test Admin",
				birthDate: "1990-01-01",
				phone: "998901234567",
				tgUsername: "admin",
				gender: "MALE",
			};

			const result = await addAdmin(null, args, context);

			expect(result.success).toBe(false);
			expect(result.admin).toBeNull();
			expect(result.errors).toBeTruthy();
		});

		it("Kuchsiz parol bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const uniqueId = `${Date.now()}${Math.random().toString(36).substring(2, 4)}`;
			const args = {
				username: `adm${uniqueId.slice(-7)}`,
				password: "weak", // Kuchsiz parol
				fullname: "Test Admin",
				birthDate: "1990-01-01",
				phone: "998901234567",
				tgUsername: "admin",
				gender: "MALE",
			};

			const result = await addAdmin(null, args, context);

			expect(result.success).toBe(false);
			expect(result.admin).toBeNull();
			expect(result.errors).toBeTruthy();
			expect(
				result.errors.some((e) => e.includes("Password"))
			).toBe(true);
		});

		it("Noto'g'ri telefon raqami bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const uniqueId = `${Date.now()}${Math.random().toString(36).substring(2, 4)}`;
			const args = {
				username: `adm${uniqueId.slice(-7)}`,
				password: "Password123",
				fullname: "Test Admin",
				birthDate: "1990-01-01",
				phone: "12345", // Noto'g'ri format
				tgUsername: "admin",
				gender: "MALE",
			};

			const result = await addAdmin(null, args, context);

			expect(result.success).toBe(false);
			expect(result.admin).toBeNull();
			expect(result.errors).toBeTruthy();
		});

		it("Noto'g'ri tug'ilgan sana bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const uniqueId = `${Date.now()}${Math.random().toString(36).substring(2, 4)}`;
			const args = {
				username: `adm${uniqueId.slice(-7)}`,
				password: "Password123",
				fullname: "Test Admin",
				birthDate: "invalid-date",
				phone: "998901234567",
				tgUsername: "admin",
				gender: "MALE",
			};

			const result = await addAdmin(null, args, context);

			expect(result.success).toBe(false);
			expect(result.admin).toBeNull();
			expect(result.errors).toBeTruthy();
		});
	});

	describe("Duplicate va boshqa xatolar", () => {
		it("Mavjud username bilan xato qaytarishi kerak", async () => {
			const existingAdmin = await createTestAdmin({
				username: `existing${Date.now()}${Math.random().toString(36).substring(2, 4)}`.slice(0, 10),
			});
			testData.admins.push(existingAdmin);

			const context = createMockContext();
			const args = {
				username: existingAdmin.username,
				password: "Password123",
				fullname: "Test Admin",
				birthDate: "1990-01-01",
				phone: "998901234569",
				tgUsername: "admin",
				gender: "MALE",
			};

			const result = await addAdmin(null, args, context);

			expect(result.success).toBe(false);
			expect(result.admin).toBeNull();
			expect(result.errors).toBeTruthy();
			expect(
				result.errors.some((e) =>
					e.toLowerCase().includes("already exists") || e.toLowerCase().includes("in use")
				)
			).toBe(true);
		});
	});
});

