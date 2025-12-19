/**
 * Jest Test Suite for getCourse Query
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { getCourse } from "../getCourses.js";
import {
	createTestDegree,
	createTestTeacher,
	createTestCourse,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";

describe("getCourse Query", () => {
	let testData = {
		degrees: [],
		teachers: [],
		courses: [],
	};

	beforeEach(async () => {
		const degree = await createTestDegree();
		testData.degrees.push(degree);

		const teacher = await createTestTeacher({
			gender: "MALE",
			degreeIds: [degree.id],
		});
		testData.teachers.push(teacher);

		const courseMale = await createTestCourse({
			name: `Test Course MALE ${Date.now()}`,
			teacherId: teacher.id,
			degreeIds: [degree.id],
			gender: "MALE",
		});
		const courseFemale = await createTestCourse({
			name: `Test Course FEMALE ${Date.now()}`,
			teacherId: teacher.id,
			degreeIds: [degree.id],
			gender: "FEMALE",
		});
		const courseChild = await createTestCourse({
			name: `Test Course CHILD ${Date.now()}`,
			teacherId: teacher.id,
			degreeIds: [degree.id],
			gender: "CHILD",
		});

		testData.courses.push(courseMale, courseFemale, courseChild);
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { degrees: [], teachers: [], courses: [] };
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("Mavjud course ID bilan course qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await getCourse(
				null,
				{ id: String(testData.courses[0].id) },
				context
			);

			expect(result).toBeTruthy();
			expect(result.id).toBe(testData.courses[0].id);
			expect(result.name).toBe(testData.courses[0].name);
		});

		it("Teacher faqat o'z course'ini id bilan ola olishi kerak", async () => {
			const teacher = testData.teachers[0];
			const course = testData.courses[0];
			const context = createMockContext({ id: teacher.id, role: "teacher" });

			const result = await getCourse(null, { id: String(course.id) }, context);
			expect(result).toBeTruthy();
			expect(result.id).toBe(course.id);
		});

		it("ADMIN FEMALE faqat FEMALE va CHILD course'larni id bilan ola olishi kerak", async () => {
			const contextAdminFemale = createMockContext({
				id: 1,
				role: "admin",
				gender: "FEMALE",
			});

			const femaleCourse = testData.courses.find((c) => c.gender === "FEMALE");
			const childCourse = testData.courses.find((c) => c.gender === "CHILD");
			const maleCourse = testData.courses.find((c) => c.gender === "MALE");

			const resultFemale = await getCourse(
				null,
				{ id: String(femaleCourse.id) },
				contextAdminFemale
			);
			expect(resultFemale).toBeTruthy();
			expect(resultFemale.gender).toBe("FEMALE");

			const resultChild = await getCourse(
				null,
				{ id: String(childCourse.id) },
				contextAdminFemale
			);
			expect(resultChild).toBeTruthy();
			expect(resultChild.gender).toBe("CHILD");

			const resultMale = await getCourse(
				null,
				{ id: String(maleCourse.id) },
				contextAdminFemale
			);
			expect(resultMale).toBeNull();
		});

		it("ADMIN MALE faqat MALE va CHILD course'larni id bilan ola olishi kerak", async () => {
			const contextAdminMale = createMockContext({
				id: 1,
				role: "admin",
				gender: "MALE",
			});

			const femaleCourse = testData.courses.find((c) => c.gender === "FEMALE");
			const childCourse = testData.courses.find((c) => c.gender === "CHILD");
			const maleCourse = testData.courses.find((c) => c.gender === "MALE");

			const resultMale = await getCourse(
				null,
				{ id: String(maleCourse.id) },
				contextAdminMale
			);
			expect(resultMale).toBeTruthy();
			expect(resultMale.gender).toBe("MALE");

			const resultChild = await getCourse(
				null,
				{ id: String(childCourse.id) },
				contextAdminMale
			);
			expect(resultChild).toBeTruthy();
			expect(resultChild.gender).toBe("CHILD");

			const resultFemale = await getCourse(
				null,
				{ id: String(femaleCourse.id) },
				contextAdminMale
			);
			expect(resultFemale).toBeNull();
		});

		it("ADMIN gender null bo'lsa getCourse null qaytarishi kerak", async () => {
			const contextAdminNoGender = createMockContext({
				id: 1,
				role: "admin",
				gender: null,
			});
			const result = await getCourse(
				null,
				{ id: String(testData.courses[0].id) },
				contextAdminNoGender
			);
			expect(result).toBeNull();
		});
	});

	describe("Xato holatlar", () => {
		it("Mavjud bo'lmagan ID bilan null qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await getCourse(null, { id: "99999" }, context);

			expect(result).toBeNull();
		});

		it("Teacher boshqa teacher course'ini ola olmasligi kerak (null)", async () => {
			const degree = testData.degrees[0];
			const otherTeacher = await createTestTeacher({
				gender: "MALE",
				degreeIds: [degree.id],
			});
			testData.teachers.push(otherTeacher);

			const otherCourse = await createTestCourse({
				name: `Other Teacher Course ${Date.now()}`,
				teacherId: otherTeacher.id,
				degreeIds: [degree.id],
			});
			testData.courses.push(otherCourse);

			const context = createMockContext({
				id: testData.teachers[0].id,
				role: "teacher",
			});

			const result = await getCourse(null, { id: String(otherCourse.id) }, context);
			expect(result).toBeNull();
		});
	});
});

