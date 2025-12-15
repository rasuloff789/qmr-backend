/**
 * Jest Test Suite for getTeachersForCourse Query
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import getTeachersForCourse from "../getTeachersForCourse.js";
import {
	createTestDegree,
	createTestTeacher,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";

describe("getTeachersForCourse Query", () => {
	let testData = {
		degrees: [],
		teachers: [],
	};

	let d1;
	let d2;
	let tMaleBoth;
	let tMaleOne;
	let tFemaleBoth;
	let tChildBoth;
	let tInactive;
	let tDeleted;

	beforeEach(async () => {
		d1 = await createTestDegree();
		d2 = await createTestDegree();
		testData.degrees.push(d1, d2);

		tMaleBoth = await createTestTeacher({
			gender: "MALE",
			degreeIds: [d1.id, d2.id],
			isActive: true,
			isDeleted: false,
		});
		tMaleOne = await createTestTeacher({
			gender: "MALE",
			degreeIds: [d1.id],
			isActive: true,
			isDeleted: false,
		});
		tFemaleBoth = await createTestTeacher({
			gender: "FEMALE",
			degreeIds: [d1.id, d2.id],
			isActive: true,
			isDeleted: false,
		});
		tChildBoth = await createTestTeacher({
			gender: "CHILD",
			degreeIds: [d1.id, d2.id],
			isActive: true,
			isDeleted: false,
		});
		tInactive = await createTestTeacher({
			gender: "MALE",
			degreeIds: [d1.id, d2.id],
			isActive: false,
			isDeleted: false,
		});
		tDeleted = await createTestTeacher({
			gender: "MALE",
			degreeIds: [d1.id, d2.id],
			isActive: true,
			isDeleted: true,
		});

		testData.teachers.push(
			tMaleBoth,
			tMaleOne,
			tFemaleBoth,
			tChildBoth,
			tInactive,
			tDeleted
		);
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { degrees: [], teachers: [] };
	});

	it("MALE + [d1,d2] should return only active, non-deleted MALE teachers with ANY matching degree", async () => {
		const context = createMockContext();
		const result = await getTeachersForCourse(
			null,
			{ gender: "MALE", degreeIds: [String(d1.id), String(d2.id)] },
			context
		);

		const ids = result.map((t) => t.id);
		expect(ids).toContain(tMaleBoth.id);
		expect(ids).toContain(tMaleOne.id); // has d1 -> acceptable
		expect(ids).not.toContain(tFemaleBoth.id); // wrong gender
		expect(ids).not.toContain(tChildBoth.id); // wrong gender (exact match for MALE)
		expect(ids).not.toContain(tInactive.id); // inactive excluded
		expect(ids).not.toContain(tDeleted.id); // deleted excluded
	});

	it("CHILD + [d1,d2] should return MALE+FEMALE teachers with ANY matching degree (not CHILD teachers)", async () => {
		const context = createMockContext();
		const result = await getTeachersForCourse(
			null,
			{ gender: "CHILD", degreeIds: [String(d1.id), String(d2.id)] },
			context
		);

		const ids = result.map((t) => t.id);
		expect(ids).toContain(tMaleBoth.id);
		expect(ids).toContain(tFemaleBoth.id);
		expect(ids).not.toContain(tChildBoth.id); // CHILD excludes CHILD teachers per rule
		expect(ids).toContain(tMaleOne.id); // has d1 -> acceptable
	});

	it("MALE + [d1] should return MALE teachers that have d1 (ANY-match with one element)", async () => {
		const context = createMockContext();
		const result = await getTeachersForCourse(
			null,
			{ gender: "MALE", degreeIds: [String(d1.id)] },
			context
		);

		const ids = result.map((t) => t.id);
		expect(ids).toContain(tMaleBoth.id);
		expect(ids).toContain(tMaleOne.id);
		expect(ids).not.toContain(tFemaleBoth.id);
	});
});


