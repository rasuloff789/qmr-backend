/**
 * Test Helper Functions
 * 
 * Test yozishda yordamchi funksiyalar.
 * Bu funksiyalar test ma'lumotlarini yaratish, o'chirish va boshqa
 * umumiy operatsiyalarni bajarish uchun ishlatiladi.
 */

import { prisma } from "../../src/database/index.js";

/**
 * Test uchun Degree yaratish
 */
export async function createTestDegree(name = null) {
	// Unique name yaratish
	const uniqueName = name || `Test Degree ${Date.now()}-${Math.random().toString(36).substring(7)}`;
	
	return await prisma.degree.upsert({
		where: { name: uniqueName },
		update: {},
		create: { name: uniqueName },
	});
}

/**
 * Test uchun Teacher yaratish
 */
export async function createTestTeacher(data = {}) {
	// Unique username yaratish - Date.now() + random string + process pid
	const uniqueId = `${Date.now()}${Math.random().toString(36).substring(2, 9)}${process.pid}`;
	const {
		username = `tch${uniqueId.slice(-15)}`, // Username: 4-19 belgi
		fullname = "Test Teacher",
		password = "hashed_password",
		birthDate = new Date("1980-01-01"),
		phone = `9989012345${Math.floor(Math.random() * 1000)}`,
		tgUsername = `tch${uniqueId.slice(-12)}`,
		gender = "MALE",
		degreeIds = [],
		isActive = true,
		isDeleted = false,
	} = data;

	// Agar degreeIds berilgan bo'lsa, ularni ulash
	const degreeConnect = degreeIds.length > 0
		? { connect: degreeIds.map(id => ({ id })) }
		: {};

	// Avval mavjud bo'lmasligini tekshirish va unique username yaratish
	let finalUsername = username;
	let attempts = 0;
	while (attempts < 5) {
		try {
			return await prisma.teacher.create({
				data: {
					username: finalUsername,
					fullname,
					password,
					birthDate,
					phone,
					tgUsername,
					gender,
					isActive,
					isDeleted,
					degrees: degreeConnect,
				},
			});
		} catch (error) {
			if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
				// Unique constraint xatosi - yangi username yaratish
				attempts++;
				finalUsername = `tch${Date.now()}${Math.random().toString(36).substring(2, 9)}${process.pid}${attempts}`;
				if (finalUsername.length > 20) {
					finalUsername = finalUsername.slice(-20);
				}
				continue;
			}
			throw error;
		}
	}
	
	// Agar 5 marta urinishdan keyin ham xato bo'lsa, upsert ishlatish
	return await prisma.teacher.upsert({
		where: { username: finalUsername },
		update: {
			fullname,
			gender,
			isActive,
			isDeleted,
			degrees: degreeConnect,
		},
		create: {
			username: finalUsername,
			fullname,
			password,
			birthDate,
			phone,
			tgUsername,
			gender,
			isActive,
			isDeleted,
			degrees: degreeConnect,
		},
	});
}

/**
 * Test uchun Student yaratish
 */
export async function createTestStudent(data = {}) {
	// Unique username yaratish - Date.now() + random string + process pid
	const uniqueId = `${Date.now()}${Math.random().toString(36).substring(2, 9)}${process.pid}`;
	const {
		username = `std${uniqueId.slice(-15)}`, // Username: 4-19 belgi
		fullname = "Test Student",
		password = "hashed_password",
		birthDate = new Date("2000-01-01"),
		phone = `9989012345${Math.floor(Math.random() * 1000)}`,
		tgUsername = `std${uniqueId.slice(-12)}`,
		gender = "MALE",
		degreeIds = [],
		isActive = true,
		isDeleted = false,
	} = data;

	// Agar degreeIds berilgan bo'lsa, ularni ulash
	const degreeConnect = degreeIds.length > 0
		? { connect: degreeIds.map(id => ({ id })) }
		: {};

	// Avval mavjud bo'lmasligini tekshirish va unique username yaratish
	let finalUsername = username;
	let attempts = 0;
	while (attempts < 5) {
		try {
			return await prisma.student.create({
				data: {
					username: finalUsername,
					fullname,
					password,
					birthDate,
					phone,
					tgUsername,
					gender,
					isActive,
					isDeleted,
					possibleDegrees: degreeConnect,
				},
			});
		} catch (error) {
			if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
				// Unique constraint xatosi - yangi username yaratish
				attempts++;
				finalUsername = `std${Date.now()}${Math.random().toString(36).substring(2, 9)}${process.pid}${attempts}`;
				if (finalUsername.length > 20) {
					finalUsername = finalUsername.slice(-20);
				}
				continue;
			}
			throw error;
		}
	}
	
	// Agar 5 marta urinishdan keyin ham xato bo'lsa, upsert ishlatish
	return await prisma.student.upsert({
		where: { username: finalUsername },
		update: {
			fullname,
			gender,
			isActive,
			isDeleted,
			possibleDegrees: degreeConnect,
		},
		create: {
			username: finalUsername,
			fullname,
			password,
			birthDate,
			phone,
			tgUsername,
			gender,
			isActive,
			isDeleted,
			possibleDegrees: degreeConnect,
		},
	});
}

/**
 * Test uchun Course yaratish
 */
export async function createTestCourse(data = {}) {
	// Unique course name yaratish
	const uniqueId = `${Date.now()}${Math.random().toString(36).substring(2, 9)}${process.pid}`;
	const {
		// If caller provides a name, we still make it unique to avoid test flakiness
		// when Jest runs test files in parallel (Course.name is UNIQUE).
		name,
		description = "Test course description",
		daysOfWeek = ["MONDAY", "WEDNESDAY"],
		gender = "MALE",
		startAt = new Date("2024-01-01"),
		endAt = new Date("2024-12-31"),
		startTime = new Date("2024-01-01T09:00:00Z"),
		endTime = new Date("2024-01-01T11:00:00Z"),
		teacherId,
		degreeIds = [],
	} = data;

	if (!teacherId) {
		throw new Error("teacherId majburiy");
	}

	const degreeConnect = degreeIds.length > 0
		? { connect: degreeIds.map(id => ({ id })) }
		: {};

	const baseName = name || `Course${uniqueId.slice(-20)}`;
	let finalName = `${baseName}-${uniqueId.slice(-12)}`;
	let attempts = 0;

	while (attempts < 5) {
		try {
			return await prisma.course.create({
				data: {
					name: finalName,
			description,
			daysOfWeek,
			gender,
			startAt,
			endAt,
			startTime,
			endTime,
			teacherId,
			degrees: degreeConnect,
		},
			});
		} catch (error) {
			// Unique constraint xatosi - yangi name yaratish va qayta urinish
			if (error.code === 'P2002' && error.meta?.target?.includes('name')) {
				attempts++;
				finalName = `${baseName}-${Date.now()}${Math.random().toString(36).substring(2, 9)}${process.pid}${attempts}`.slice(
					0,
					255
				);
				continue;
			}
			throw error;
		}
	}

	// Oxirgi urinish: baribir create qilib ko'ramiz (xato bo'lsa yuqoriga tashlanadi)
	return await prisma.course.create({
		data: {
			name: `${baseName}-${Date.now()}${Math.random().toString(36).substring(2, 9)}${process.pid}`.slice(
				0,
				255
			),
			description,
			daysOfWeek,
			gender,
			startAt,
			endAt,
			startTime,
			endTime,
			teacherId,
			degrees: degreeConnect,
		},
	});
}

/**
 * Test uchun Admin yaratish
 */
export async function createTestAdmin(data = {}) {
	// Unique username yaratish - Date.now() + random string + process pid
	const uniqueId = `${Date.now()}${Math.random().toString(36).substring(2, 9)}${process.pid}`;
	const {
		username = `adm${uniqueId.slice(-15)}`, // Username: 4-19 belgi
		fullname = "Test Admin",
		password = "hashed_password",
		birthDate = new Date("1990-01-01"),
		phone = `9989012345${Math.floor(Math.random() * 1000)}`,
		tgUsername = `adm${uniqueId.slice(-12)}`,
		gender = "MALE",
		isActive = true,
		isDeleted = false,
	} = data;

	// Avval mavjud bo'lmasligini tekshirish va unique username yaratish
	let finalUsername = username;
	let attempts = 0;
	while (attempts < 5) {
		try {
			return await prisma.admin.create({
				data: {
					username: finalUsername,
					fullname,
					password,
					birthDate,
					phone,
					tgUsername,
					gender,
					isActive,
					isDeleted,
				},
			});
		} catch (error) {
			if (error.code === 'P2002' && error.meta?.target?.includes('username')) {
				// Unique constraint xatosi - yangi username yaratish
				attempts++;
				finalUsername = `adm${Date.now()}${Math.random().toString(36).substring(2, 9)}${process.pid}${attempts}`;
				if (finalUsername.length > 20) {
					finalUsername = finalUsername.slice(-20);
				}
				continue;
			}
			throw error;
		}
	}
	
	// Agar 5 marta urinishdan keyin ham xato bo'lsa, upsert ishlatish
	return await prisma.admin.upsert({
		where: { username: finalUsername },
		update: {
			fullname,
			gender,
			isActive,
			isDeleted,
		},
		create: {
			username: finalUsername,
			fullname,
			password,
			birthDate,
			phone,
			tgUsername,
			gender,
			isActive,
			isDeleted,
		},
	});
}

/**
 * Test uchun CourseStudent yaratish (enrollment)
 */
export async function createTestEnrollment(data = {}) {
	const {
		courseId,
		studentId,
		monthlyPayment = 500000,
		isActive = true,
		isDeleted = false,
	} = data;

	if (!courseId || !studentId) {
		throw new Error("courseId va studentId majburiy");
	}

	// Avval mavjud enrollmentni o'chirish
	await prisma.courseStudent.deleteMany({
		where: {
			courseId,
			studentId,
		},
	});

	return await prisma.courseStudent.create({
		data: {
			courseId,
			studentId,
			monthlyPayment,
			isActive,
			isDeleted,
		},
	});
}

/**
 * Test ma'lumotlarini tozalash
 */
export async function cleanupTestData(entities = {}) {
	const {
		courses = [],
		students = [],
		teachers = [],
		degrees = [],
		admins = [],
		enrollments = [],
	} = entities;

	// Enrollmentsni o'chirish
	for (const enrollment of enrollments) {
		await prisma.courseStudent.deleteMany({
			where: {
				OR: [
					{ courseId: enrollment.courseId },
					{ studentId: enrollment.studentId },
				],
			},
		});
	}

	// Coursesni o'chirish
	if (courses.length > 0) {
		await prisma.course.deleteMany({
			where: {
				id: { in: courses.map(c => c.id) },
			},
		});
	}

	// Studentsni o'chirish
	if (students.length > 0) {
		await prisma.student.deleteMany({
			where: {
				id: { in: students.map(s => s.id) },
			},
		});
	}

	// Teachersni o'chirish
	if (teachers.length > 0) {
		await prisma.teacher.deleteMany({
			where: {
				id: { in: teachers.map(t => t.id) },
			},
		});
	}

	// Adminsni o'chirish
	if (admins.length > 0) {
		await prisma.admin.deleteMany({
			where: {
				id: { in: admins.map(a => a.id) },
			},
		});
	}

	// Degreesni o'chirish
	if (degrees.length > 0) {
		await prisma.degree.deleteMany({
			where: {
				id: { in: degrees.map(d => d.id) },
			},
		});
	}
}

/**
 * Context yaratish (GraphQL resolverlar uchun)
 */
export function createMockContext(user = null) {
	return {
		user,
		req: {},
		res: {},
	};
}

