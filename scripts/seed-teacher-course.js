import { prisma } from "../src/database/index.js";
import { hashPassword } from "../src/utils/auth/password.js";
import config from "../src/config/env.js";

/**
 * Seed script to create a test course with students for teacher (the default test teacher)
 * This helps test teacher attendance functionality
 */
async function seedTeacherCourse() {
	try {
		// Find or create teacher (default test teacher username)
		let teacher = await prisma.teacher.findUnique({
			where: { username: "teacher" },
			include: { degrees: true },
		});

		if (!teacher) {
			console.log("Creating teacher...");
			const passwordHash = await hashPassword("Teacher123!");
			teacher = await prisma.teacher.create({
				data: {
					username: "teacher",
					password: passwordHash,
					fullname: "Test Teacher",
					birthDate: new Date("1990-01-01"),
					phone: "998901234567",
					tgUsername: "teacher",
					gender: "MALE",
					isActive: true,
				},
				include: { degrees: true },
			});
			console.log("✅ Created teacher");
		} else {
			console.log("✅ Teacher already exists");
		}

		// Ensure teacher has at least one degree
		let degree = teacher.degrees[0];
		if (!degree) {
			// Find or create a degree
			degree = await prisma.degree.findFirst();
			if (!degree) {
				degree = await prisma.degree.create({
					data: { name: "Test Degree" },
				});
				console.log("✅ Created test degree");
			}

			// Assign degree to teacher
			await prisma.teacher.update({
				where: { id: teacher.id },
				data: {
					degrees: { connect: { id: degree.id } },
				},
			});
			console.log("✅ Assigned degree to teacher");
		}

		// Find or create a course for this teacher
		let course = await prisma.course.findFirst({
			where: {
				teacherId: teacher.id,
			},
			include: {
				students: {
					include: { student: true },
				},
			},
		});

		if (!course) {
			console.log("Creating course for teacher...");
			course = await prisma.course.create({
				data: {
					name: "Test Course for Teacher",
					daysOfWeek: ["MONDAY", "WEDNESDAY", "FRIDAY"],
					gender: "MALE",
					startAt: new Date("2024-01-01"),
					startTime: new Date("2024-01-01T10:00:00Z"),
					endTime: new Date("2024-01-01T12:00:00Z"),
					teacherId: teacher.id,
					degrees: { connect: { id: degree.id } },
				},
				include: {
					students: {
						include: { student: true },
					},
				},
			});
			console.log("✅ Created course for teacher");
		} else {
			console.log("✅ Course already exists for teacher");
		}

		// Always ensure course has at least 3 students (even if it already has some)
		console.log(`Course currently has ${course.students.length} students`);

		const targetStudentsCount = 3;
		const studentsNeeded = Math.max(
			0,
			targetStudentsCount - course.students.length
		);

		if (studentsNeeded > 0) {
			console.log(
				`Finding or creating ${studentsNeeded} more students for the course...`
			);

			// Find existing male students
			let students = await prisma.student.findMany({
				where: {
					gender: "MALE",
					isActive: true,
					isDeleted: false,
				},
				take: 10,
			});

			// If not enough students, create some
			if (students.length < studentsNeeded) {
				const passwordHash = await hashPassword("Student123!");
				for (let i = students.length; i < studentsNeeded; i++) {
					try {
						const newStudent = await prisma.student.create({
							data: {
								username: `student${Date.now()}_${i}`,
								password: passwordHash,
								fullname: `Test Student ${i + 1}`,
								birthDate: new Date("2010-01-01"),
								gender: "MALE",
								possibleDegrees: { connect: { id: degree.id } },
							},
						});
						students.push(newStudent);
						console.log(`✅ Created student: ${newStudent.username}`);
					} catch (error) {
						console.error(
							`⚠ Failed to create student ${i + 1}:`,
							error.message
						);
					}
				}
			}

			// Add students to course (only those not already enrolled)
			const enrolledStudentIds = course.students.map((cs) => cs.studentId);
			const studentsToAdd = students
				.filter((s) => !enrolledStudentIds.includes(s.id))
				.slice(0, studentsNeeded);

			if (studentsToAdd.length > 0) {
				for (const student of studentsToAdd) {
					try {
						await prisma.courseStudent.create({
							data: {
								courseId: course.id,
								studentId: student.id,
								monthlyPayment: 100000, // 100,000 UZS
								isActive: true,
							},
						});
						console.log(`✅ Added student ${student.fullname} to course`);
					} catch (error) {
						console.error(
							`⚠ Failed to add student ${student.fullname}:`,
							error.message
						);
					}
				}
			} else {
				console.log(
					"⚠ No students available to add (all may already be enrolled)"
				);
			}
		} else {
			console.log(
				`✅ Course already has ${course.students.length} students (target: ${targetStudentsCount})`
			);
		}

		// Final summary
		const finalCourse = await prisma.course.findUnique({
			where: { id: course.id },
			include: {
				teacher: {
					select: { username: true, fullname: true },
				},
				students: {
					include: {
						student: {
							select: { id: true, username: true, fullname: true },
						},
					},
				},
			},
		});

		console.log("\n🎉 Teacher Course Setup Complete!");
		console.log(`\n📚 Course: ${finalCourse.name}`);
		console.log(
			`👨‍🏫 Teacher: ${finalCourse.teacher.fullname} (${finalCourse.teacher.username})`
		);
		console.log(`👥 Students enrolled: ${finalCourse.students.length}`);
		finalCourse.students.forEach((cs, idx) => {
			console.log(
				`   ${idx + 1}. ${cs.student.fullname} (${cs.student.username})`
			);
		});
		console.log(
			`\n💡 Teacher "${finalCourse.teacher.username}" can now test setAttendance with courseId: ${finalCourse.id}`
		);
		console.log(
			`   Student IDs: ${finalCourse.students
				.map((cs) => cs.student.id)
				.join(", ")}`
		);
	} catch (error) {
		console.error("❌ Failed to seed teacher course:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

seedTeacherCourse();
