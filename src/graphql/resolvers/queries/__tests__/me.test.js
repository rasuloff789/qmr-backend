/**
 * Jest Test Suite for me Query
 */

import { describe, it, expect } from "@jest/globals";
import me from "../me.js";
import {
	createTestAdmin,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";

describe("me Query", () => {
	let testData = {
		admins: [],
	};

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { admins: [] };
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("Authenticated admin bilan admin ma'lumotlarini qaytarishi kerak", async () => {
			const admin = await createTestAdmin();
			testData.admins.push(admin);

			const context = createMockContext({
				id: admin.id,
				role: "admin",
			});

			const result = await me(null, {}, context);

			expect(result).toBeTruthy();
			expect(result.id).toBe(admin.id);
			expect(result.role).toBe("admin");
		});
	});

	describe("Xato holatlar", () => {
		it("User bo'lmasa null qaytarishi kerak", async () => {
			const context = createMockContext(null);
			const result = await me(null, {}, context);

			expect(result).toBeNull();
		});
	});
});

