/**
 * QMR Backend - Test Add Student to Course Mutation
 *
 * This script tests the addStudentToCourse mutation for all
 * student-course combinations to verify validation logic.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../src/database/index.js";

/**
 * Test adding a student to a course
 * Simulates the mutation logic
 */
async function testAddStudentToCourse(
	courseId,
	studentId,
	monthlyPayment = 500000
) {
	try {
		// Get course with degrees
		const course = await prisma.course.findUnique({
			where: { id: courseId },
			include: {
				degrees: true,
			},
		});

		if (!course) {
			return {
				success: false,
				message: "Course not found",
				errors: [`Course with ID ${courseId} not found`],
			};
		}

		// Get student with degrees
		const student = await prisma.student.findUnique({
			where: {
				id: studentId,
				isActive: true,
				isDeleted: false,
			},
			include: {
				possibleDegrees: true,
			},
		});

		if (!student) {
			return {
				success: false,
				message: "Student not found or inactive",
				errors: [
					`Student with ID ${studentId} not found, inactive, or deleted`,
				],
			};
		}

		// Check gender match
		if (student.gender !== course.gender) {
			return {
				success: false,
				message: "Gender mismatch",
				errors: [
					`Student gender (${student.gender}) does not match course gender (${course.gender})`,
				],
			};
		}

		// Check degree match
		const studentDegreeIds = student.possibleDegrees.map((d) => d.id);
		const courseDegreeIds = course.degrees.map((d) => d.id);
		const hasMatchingDegree = studentDegreeIds.some((id) =>
			courseDegreeIds.includes(id)
		);

		if (!hasMatchingDegree) {
			return {
				success: false,
				message: "Degree mismatch",
				errors: [
					"Student does not have any degrees matching the course requirements",
				],
			};
		}

		// Check if enrollment already exists
		const existingEnrollment = await prisma.courseStudent.findUnique({
			where: {
				courseId_studentId: {
					courseId: courseId,
					studentId: studentId,
				},
			},
		});

		if (existingEnrollment && !existingEnrollment.isDeleted) {
			return {
				success: false,
				message: "Already enrolled",
				errors: ["Student is already enrolled in this course"],
			};
		}

		// All validations passed - would succeed
		return {
			success: true,
			message: "Valid enrollment",
			errors: [],
		};
	} catch (error) {
		return {
			success: false,
			message: "Error",
			errors: [error.message],
		};
	}
}

/**
 * Actually enroll a student to a course
 */
async function enrollStudentToCourse(
	courseId,
	studentId,
	monthlyPayment = 500000
) {
	try {
		const existingEnrollment = await prisma.courseStudent.findUnique({
			where: {
				courseId_studentId: {
					courseId: courseId,
					studentId: studentId,
				},
			},
		});

		if (existingEnrollment) {
			if (existingEnrollment.isDeleted) {
				// Reactivate
				const reactivated = await prisma.courseStudent.update({
					where: { id: existingEnrollment.id },
					data: {
						isDeleted: false,
						isActive: true,
						monthlyPayment: monthlyPayment,
						joinedAt: new Date(),
					},
				});
				return {
					success: true,
					action: "reactivated",
					enrollment: reactivated,
				};
			} else {
				return {
					success: false,
					action: "already_exists",
					enrollment: existingEnrollment,
				};
			}
		}

		// Create new enrollment
		const newEnrollment = await prisma.courseStudent.create({
			data: {
				courseId: courseId,
				studentId: studentId,
				monthlyPayment: monthlyPayment,
				isActive: true,
				isDeleted: false,
			},
		});

		return { success: true, action: "created", enrollment: newEnrollment };
	} catch (error) {
		return { success: false, action: "error", error: error.message };
	}
}

async function main() {
	try {
		console.log("🚀 Starting addStudentToCourse mutation test...\n");

		// Get all courses
		const courses = await prisma.course.findMany({
			include: {
				degrees: {
					select: {
						id: true,
						name: true,
					},
				},
				teacher: {
					select: {
						id: true,
						fullname: true,
					},
				},
			},
		});

		// Get all active students
		const students = await prisma.student.findMany({
			where: {
				isActive: true,
				isDeleted: false,
			},
			include: {
				possibleDegrees: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		});

		if (courses.length === 0) {
			console.log("❌ No courses found. Please create courses first.");
			return;
		}

		if (students.length === 0) {
			console.log("❌ No active students found. Please create students first.");
			return;
		}

		console.log(`📚 Found ${courses.length} courses`);
		console.log(`👥 Found ${students.length} active students\n`);

		const results = {
			valid: [],
			genderMismatch: [],
			degreeMismatch: [],
			alreadyEnrolled: [],
			errors: [],
		};

		let enrolledCount = 0;
		let skippedCount = 0;

		console.log("🔍 Testing all student-course combinations...\n");

		// Test each combination
		for (const course of courses) {
			for (const student of students) {
				const testResult = await testAddStudentToCourse(course.id, student.id);

				if (testResult.success) {
					results.valid.push({
						course: course.name,
						student: student.fullname,
						courseId: course.id,
						studentId: student.id,
					});

					// Actually enroll if valid
					const enrollResult = await enrollStudentToCourse(
						course.id,
						student.id
					);

					if (enrollResult.success) {
						if (enrollResult.action === "created") {
							enrolledCount++;
							console.log(`✅ Enrolled: ${student.fullname} → ${course.name}`);
						} else if (enrollResult.action === "reactivated") {
							enrolledCount++;
							console.log(
								`🔄 Reactivated: ${student.fullname} → ${course.name}`
							);
						}
					} else if (enrollResult.action === "already_exists") {
						skippedCount++;
						results.alreadyEnrolled.push({
							course: course.name,
							student: student.fullname,
						});
					}
				} else {
					if (testResult.message === "Gender mismatch") {
						results.genderMismatch.push({
							course: course.name,
							student: student.fullname,
							courseGender: course.gender,
							studentGender: student.gender,
						});
					} else if (testResult.message === "Degree mismatch") {
						results.degreeMismatch.push({
							course: course.name,
							student: student.fullname,
							courseDegrees: course.degrees.map((d) => d.name).join(", "),
							studentDegrees:
								student.possibleDegrees.map((d) => d.name).join(", ") || "None",
						});
					} else {
						results.errors.push({
							course: course.name,
							student: student.fullname,
							error: testResult.message,
						});
					}
				}
			}
		}

		// Print summary
		console.log("\n" + "=".repeat(60));
		console.log("📊 TEST RESULTS SUMMARY");
		console.log("=".repeat(60));
		console.log(`✅ Valid enrollments: ${results.valid.length}`);
		console.log(`   → Successfully enrolled: ${enrolledCount}`);
		console.log(`   → Already enrolled (skipped): ${skippedCount}`);
		console.log(`❌ Gender mismatches: ${results.genderMismatch.length}`);
		console.log(`❌ Degree mismatches: ${results.degreeMismatch.length}`);
		console.log(`⚠️  Other errors: ${results.errors.length}`);

		// Show sample mismatches
		if (results.genderMismatch.length > 0) {
			console.log("\n📋 Sample Gender Mismatches (first 5):");
			results.genderMismatch.slice(0, 5).forEach((item) => {
				console.log(
					`   • ${item.student} (${item.studentGender}) → ${item.course} (${item.courseGender})`
				);
			});
		}

		if (results.degreeMismatch.length > 0) {
			console.log("\n📋 Sample Degree Mismatches (first 5):");
			results.degreeMismatch.slice(0, 5).forEach((item) => {
				console.log(`   • ${item.student} → ${item.course}`);
				console.log(`     Student has: ${item.studentDegrees || "None"}`);
				console.log(`     Course requires: ${item.courseDegrees}`);
			});
		}

		console.log("\n" + "=".repeat(60));
	} catch (error) {
		console.error("❌ Test failed:", error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();
