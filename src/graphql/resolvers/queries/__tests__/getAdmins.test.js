/**
 * Jest Test Suite for getAdmins Query
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import getAdmins from "../getAdmins.js";
import {
	createTestAdmin,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";

describe("getAdmins Query", () => {
	let testData = {
		admins: [],
	};

	beforeEach(async () => {
		// Bir nechta admin yaratish
		for (let i = 0; i < 3; i++) {
			const admin = await createTestAdmin({
				username: `admin${i}${Date.now()}${Math.random().toString(36).substring(2, 4)}`.slice(0, 10),
			});
			testData.admins.push(admin);
		}
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { admins: [] };
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("Barcha adminlarni qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await getAdmins(null, {}, context);

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThanOrEqual(3);
		});

		it("Faqat o'chirilmagan adminlarni qaytarishi kerak", async () => {
			// O'chirilgan admin yaratish
			const deletedAdmin = await createTestAdmin({
				username: `deleted${Date.now()}${Math.random().toString(36).substring(2, 4)}`.slice(0, 10),
				isDeleted: true,
			});

			const context = createMockContext();
			const result = await getAdmins(null, {}, context);

			const deletedInResult = result.find((a) => a.id === deletedAdmin.id);
			expect(deletedInResult).toBeUndefined();

			await cleanupTestData({ admins: [deletedAdmin] });
		});
	});
});

