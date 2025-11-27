/**
 * QMR Backend - Add Mock Teacher and Course with Students
 *
 * This script creates a mock teacher, creates a new course with that teacher,
 * and enrolls existing students into the course.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../src/database/index.js";
import { hashPassword } from "../src/utils/auth/password.js";
import config from "../src/config/env.js";

const TEACHER_USERNAME = "teacher123";
const TEACHER_PASSWORD = "Teacher123!";
const TEACHER_FULLNAME = "Mock Teacher";
const TEACHER_TG_USERNAME = "teacher123_tg";
const TEACHER_PHONE = "998901234567";
const TEACHER_BIRTHDATE = "1990-01-15";
const TEACHER_GENDER = "MALE";

const COURSE_NAME = "Mock Course - Test Attendance";
const COURSE_DESCRIPTION = "A test course for attendance functionality";
const COURSE_GENDER = "MALE"; // Will match MALE students
const COURSE_DAYS_OF_WEEK = ["MONDAY", "WEDNESDAY", "FRIDAY"];
const MONTHLY_PAYMENT = 500000; // Default payment amount

/**
 * Get or create a degree
 */
async function getOrCreateDegree() {
	// Try to get an existing degree
	const existingDegree = await prisma.degree.findFirst();

	if (existingDegree) {
		console.log(`✅ Using existing degree: ${existingDegree.name}`);
		return existingDegree;
	}

	// Create a new degree if none exists
	const newDegree = await prisma.degree.create({
		data: {
			name: "Test Degree",
		},
	});

	console.log(`✅ Created new degree: ${newDegree.name}`);
	return newDegree;
}

/**
 * Get or create the mock teacher
 */
async function getOrCreateTeacher(degreeId) {
	// Check if teacher already exists
	const existingTeacher = await prisma.teacher.findUnique({
		where: { username: TEACHER_USERNAME },
		include: { degrees: true },
	});

	if (existingTeacher) {
		console.log(`✅ Teacher already exists: ${existingTeacher.fullname}`);

		// Ensure teacher has the degree
		const hasDegree = existingTeacher.degrees.some((d) => d.id === degreeId);
		if (!hasDegree) {
			await prisma.teacher.update({
				where: { id: existingTeacher.id },
				data: {
					degrees: {
						connect: { id: degreeId },
					},
				},
			});
			console.log(`   → Added degree to teacher`);
		}

		return existingTeacher;
	}

	// Create new teacher
	const passwordHash = await hashPassword(TEACHER_PASSWORD);

	const newTeacher = await prisma.teacher.create({
		data: {
			username: TEACHER_USERNAME,
			fullname: TEACHER_FULLNAME,
			password: passwordHash,
			birthDate: new Date(TEACHER_BIRTHDATE),
			phone: TEACHER_PHONE,
			tgUsername: TEACHER_TG_USERNAME,
			gender: TEACHER_GENDER,
			degrees: {
				connect: { id: degreeId },
			},
			isActive: true,
			isDeleted: false,
		},
		include: {
			degrees: true,
		},
	});

	console.log(
		`✅ Created teacher: ${newTeacher.fullname} (${newTeacher.username})`
	);
	return newTeacher;
}

/**
 * Create a new course with the teacher
 */
async function createCourse(teacherId, degreeId) {
	// Check if course already exists
	const existingCourse = await prisma.course.findUnique({
		where: { name: COURSE_NAME },
	});

	if (existingCourse) {
		console.log(`✅ Course already exists: ${existingCourse.name}`);
		return existingCourse;
	}

	// Calculate dates
	const today = new Date();
	const startAt = new Date(today);
	startAt.setDate(today.getDate() + 1); // Start tomorrow

	const endAt = new Date(startAt);
	endAt.setMonth(endAt.getMonth() + 3); // 3 months from start

	// Set start and end times (9:00 AM - 11:00 AM)
	const startTime = new Date(startAt);
	startTime.setHours(9, 0, 0, 0);

	const endTime = new Date(startAt);
	endTime.setHours(11, 0, 0, 0);

	const newCourse = await prisma.course.create({
		data: {
			name: COURSE_NAME,
			description: COURSE_DESCRIPTION,
			daysOfWeek: COURSE_DAYS_OF_WEEK,
			gender: COURSE_GENDER,
			startAt: startAt,
			endAt: endAt,
			startTime: startTime,
			endTime: endTime,
			teacherId: teacherId,
			degrees: {
				connect: { id: degreeId },
			},
		},
		include: {
			teacher: {
				select: {
					id: true,
					fullname: true,
					username: true,
				},
			},
			degrees: {
				select: {
					id: true,
					name: true,
				},
			},
		},
	});

	console.log(`✅ Created course: ${newCourse.name}`);
	console.log(`   → Teacher: ${newCourse.teacher.fullname}`);
	console.log(`   → Days: ${COURSE_DAYS_OF_WEEK.join(", ")}`);
	console.log(`   → Gender: ${COURSE_GENDER}`);
	console.log(`   → Start: ${startAt.toISOString().split("T")[0]}`);
	console.log(`   → End: ${endAt.toISOString().split("T")[0]}`);

	return newCourse;
}

/**
 * Add students to the course
 */
async function addStudentsToCourse(courseId, courseGender, degreeId) {
	// Get all active students that match the course gender and have the required degree
	const students = await prisma.student.findMany({
		where: {
			isActive: true,
			isDeleted: false,
			gender: courseGender,
			possibleDegrees: {
				some: {
					id: degreeId,
				},
			},
		},
		include: {
			possibleDegrees: true,
		},
	});

	if (students.length === 0) {
		console.log(`⚠️  No students found matching course requirements:`);
		console.log(`   → Gender: ${courseGender}`);
		console.log(`   → Degree ID: ${degreeId}`);
		return { enrolled: 0, skipped: 0, errors: 0 };
	}

	console.log(`\n📚 Found ${students.length} eligible students`);

	let enrolled = 0;
	let skipped = 0;
	let errors = 0;

	for (const student of students) {
		try {
			// Check if already enrolled
			const existingEnrollment = await prisma.courseStudent.findUnique({
				where: {
					courseId_studentId: {
						courseId: courseId,
						studentId: student.id,
					},
				},
			});

			if (existingEnrollment) {
				if (existingEnrollment.isDeleted) {
					// Reactivate enrollment
					await prisma.courseStudent.update({
						where: { id: existingEnrollment.id },
						data: {
							isDeleted: false,
							isActive: true,
							monthlyPayment: MONTHLY_PAYMENT,
							joinedAt: new Date(),
						},
					});
					console.log(`   ✅ Reactivated: ${student.fullname}`);
					enrolled++;
				} else {
					console.log(`   ⏭️  Skipped (already enrolled): ${student.fullname}`);
					skipped++;
				}
			} else {
				// Create new enrollment
				await prisma.courseStudent.create({
					data: {
						courseId: courseId,
						studentId: student.id,
						monthlyPayment: MONTHLY_PAYMENT,
						isActive: true,
						isDeleted: false,
					},
				});
				console.log(`   ✅ Enrolled: ${student.fullname}`);
				enrolled++;
			}
		} catch (error) {
			console.error(
				`   ❌ Error enrolling ${student.fullname}:`,
				error.message
			);
			errors++;
		}
	}

	return { enrolled, skipped, errors };
}

/**
 * Main function
 */
async function main() {
	try {
		console.log("🚀 Starting mock teacher and course setup...\n");

		// Step 1: Get or create degree
		const degree = await getOrCreateDegree();

		// Step 2: Get or create teacher
		const teacher = await getOrCreateTeacher(degree.id);

		// Step 3: Create course
		const course = await createCourse(teacher.id, degree.id);

		// Step 4: Add students to course
		console.log(`\n👥 Enrolling students in course...`);
		const enrollmentResults = await addStudentsToCourse(
			course.id,
			COURSE_GENDER,
			degree.id
		);

		// Summary
		console.log("\n" + "=".repeat(60));
		console.log("📊 SETUP SUMMARY");
		console.log("=".repeat(60));
		console.log(`✅ Teacher: ${teacher.fullname} (${teacher.username})`);
		console.log(`   Password: ${TEACHER_PASSWORD}`);
		console.log(`✅ Course: ${course.name}`);
		console.log(`✅ Students enrolled: ${enrollmentResults.enrolled}`);
		console.log(`   Skipped: ${enrollmentResults.skipped}`);
		console.log(`   Errors: ${enrollmentResults.errors}`);
		console.log("=".repeat(60));
		console.log("\n🎉 Setup complete!");
	} catch (error) {
		console.error("❌ Setup failed:", error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();
