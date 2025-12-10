/**
 * Jest Test Suite for getAdmin Query
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import getAdmin from "../getAdmin.js";
import {
	createTestAdmin,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";

describe("getAdmin Query", () => {
	let testData = {
		admins: [],
	};

	beforeEach(async () => {
		const admin = await createTestAdmin({
			username: `admin${Date.now()}${Math.random().toString(36).substring(2, 4)}`.slice(0, 10),
		});
		testData.admins.push(admin);
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { admins: [] };
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("Mavjud admin ID bilan admin qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await getAdmin(
				null,
				{ id: String(testData.admins[0].id) },
				context
			);

			expect(result).toBeTruthy();
			expect(result.id).toBe(testData.admins[0].id);
			expect(result.username).toBe(testData.admins[0].username);
		});
	});

	describe("Xato holatlar", () => {
		it("Mavjud bo'lmagan ID bilan null qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await getAdmin(null, { id: "99999" }, context);

			expect(result).toBeNull();
		});
	});
});

