/**
 * Comprehensive Mock Data Seeder
 * 
 * Creates realistic mock data with Uzbek names:
 * - 10 Admins
 * - 20 Teachers
 * - 3 Degrees
 * - 100 Students
 * - 30 Courses
 * - Course Enrollments
 * - Attendance Records
 * - Invoices
 * 
 * Usage: node scripts/seed-all-mock-data.js
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import config from "../src/config/env.js";

const prisma = new PrismaClient({
	log: ["warn", "error"],
});

// Real Uzbek names
const UZBEK_MALE_FIRST_NAMES = [
	"Aziz", "Bekzod", "Davron", "Elyor", "Farhod", "G'ayrat", "Hasan", "Ibrohim",
	"Javohir", "Kamol", "Laziz", "Murod", "Nodir", "Olim", "Po'lat", "Qodir",
	"Rustam", "Sardor", "Temur", "Umid", "Vohid", "Zafar", "Akmal", "Bahodir",
	"Doniyor", "Erkin", "Firdavs", "G'olib", "Hikmat", "Islom", "Jahongir"
];

const UZBEK_FEMALE_FIRST_NAMES = [
	"Aziza", "Barchinoy", "Dilnoza", "E'zoza", "Farangiz", "Gulnora", "Hilola",
	"Iroda", "Jasmina", "Kamola", "Laylo", "Madina", "Nigora", "Oydin", "Parvina",
	"Qumri", "Rano", "Sevara", "Tohira", "Umida", "Vazira", "Zarina", "Amina",
	"Baxora", "Dilafruz", "E'tibor", "Fotima", "Gulchehra", "Hilola", "Iroda"
];

const UZBEK_LAST_NAMES = [
	"Karimov", "Toshmatov", "Rahimov", "Yuldashev", "Alimov", "Nazarov", "Sobirov",
	"Qodirov", "Usmonov", "Valiyev", "Xolmatov", "Zokirov", "Abdurahmonov", "Bahromov",
	"Davlatov", "Ergashev", "Fayziyev", "G'aniyev", "Hakimov", "Ibrohimov", "Jalilov",
	"Komilov", "Latipov", "Mamatov", "Nurmatov", "Olimov", "Pardayev", "Qosimov",
	"Rasulov", "Saidov", "Turg'unov", "Umarov", "Vohidov", "Yusupov", "Ziyodov"
];

const DEGREE_NAMES = [
	"Qur'an Hafizligi (Hifz)",
	"Tajvid va Qiroat",
	"Arab Tili va Adabiyoti"
];

const COURSE_NAMES = [
	"Qur'an Yodlash - Boshlang'ich", "Qur'an Yodlash - O'rta", "Qur'an Yodlash - Yuqori",
	"Tajvid Asoslari", "Tajvid Ilmi", "Qiroat San'ati",
	"Arab Tili - Boshlang'ich", "Arab Tili - O'rta", "Arab Tili - Yuqori",
	"Hadis Ilmi", "Fiqh Asoslari", "Islom Tarixi",
	"Qur'an Tafsiri", "Sunnat va Hadis", "Islom Aqidasi",
	"Yoshlar Qur'ani", "Bolalar Qur'ani", "Ayollar Qur'ani",
	"Qur'an Yodlash - Kechki", "Tajvid - Kechki", "Arab Tili - Kechki",
	"Qur'an Yodlash - Ertalab", "Tajvid - Ertalab", "Arab Tili - Ertalab",
	"Qur'an Yodlash - Hafta", "Tajvid - Hafta", "Arab Tili - Hafta",
	"Qur'an Yodlash - Yakshanba", "Tajvid - Yakshanba", "Arab Tili - Yakshanba",
	"Qur'an Yodlash - Maxsus", "Tajvid - Maxsus", "Arab Tili - Maxsus"
];

const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
const GENDERS = ["MALE", "FEMALE", "CHILD"];

function pick(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function randomUzbekPhone() {
	const prefix = "99890";
	const rest = String(Math.floor(1000000 + Math.random() * 8999999));
	return `${prefix}${rest}`;
}

function randomBirthdate(minYear, maxYear) {
	const start = new Date(minYear, 0, 1).getTime();
	const end = new Date(maxYear, 11, 31).getTime();
	const d = new Date(start + Math.random() * (end - start));
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
}

function randomUzbekName(gender) {
	const firstNames = gender === "FEMALE" ? UZBEK_FEMALE_FIRST_NAMES : UZBEK_MALE_FIRST_NAMES;
	const firstName = pick(firstNames);
	const lastName = pick(UZBEK_LAST_NAMES);
	return { firstName, lastName, fullname: `${firstName} ${lastName}` };
}

async function seedDegrees() {
	console.log("📚 Seeding degrees...");
	const created = [];
	for (const name of DEGREE_NAMES) {
		const existing = await prisma.degree.findUnique({ where: { name } });
		if (!existing) {
			const degree = await prisma.degree.create({ data: { name } });
			created.push(degree);
		}
	}
	const all = await prisma.degree.findMany();
	console.log(`✅ Created ${all.length} degrees`);
	return all;
}

async function seedAdmins() {
	console.log("\n👥 Seeding 10 admins...");
	const DEFAULT_PASSWORD = process.env.SEED_USER_PASSWORD || "Admin123!";
	const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, config.BCRYPT_ROUNDS);
	
	const admins = [];
	for (let i = 0; i < 10; i++) {
		const gender = i < 5 ? "MALE" : "FEMALE";
		const { firstName, lastName, fullname } = randomUzbekName(gender);
		const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_admin${i + 1}`;
		
		// Check if exists
		const existing = await prisma.admin.findUnique({ where: { username } });
		if (existing) continue;
		
		const admin = await prisma.admin.create({
			data: {
				username,
				fullname,
				password: passwordHash,
				birthDate: new Date(randomBirthdate(1980, 1995)),
				phone: randomUzbekPhone(),
				tgUsername: `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
				gender,
				isActive: true,
			},
		});
		admins.push(admin);
	}
	console.log(`✅ Created ${admins.length} admins`);
	return admins;
}

async function seedTeachers(degrees) {
	console.log("\n👨‍🏫 Seeding 20 teachers...");
	const DEFAULT_PASSWORD = process.env.SEED_USER_PASSWORD || "Teacher123!";
	const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, config.BCRYPT_ROUNDS);
	
	const teachers = [];
	for (let i = 0; i < 20; i++) {
		const gender = i < 10 ? "MALE" : "FEMALE";
		const { firstName, lastName, fullname } = randomUzbekName(gender);
		const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_teacher${i + 1}`;
		
		// Check if exists
		const existing = await prisma.teacher.findUnique({ where: { username } });
		if (existing) continue;
		
		// Assign 1-2 degrees randomly
		const numDegrees = Math.floor(Math.random() * 2) + 1;
		const teacherDegrees = degrees
			.sort(() => 0.5 - Math.random())
			.slice(0, numDegrees);
		
		const teacher = await prisma.teacher.create({
			data: {
				username,
				fullname,
				password: passwordHash,
				birthDate: new Date(randomBirthdate(1985, 1995)),
				phone: randomUzbekPhone(),
				tgUsername: `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
				gender,
				isActive: true,
				degrees: {
					connect: teacherDegrees.map(d => ({ id: d.id }))
				}
			},
		});
		teachers.push(teacher);
	}
	console.log(`✅ Created ${teachers.length} teachers`);
	return teachers;
}

async function seedStudents(degrees) {
	console.log("\n👨‍🎓 Seeding 100 students...");
	const DEFAULT_PASSWORD = process.env.SEED_USER_PASSWORD || "Student123!";
	const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, config.BCRYPT_ROUNDS);
	
	const students = [];
	for (let i = 0; i < 100; i++) {
		const gender = pick(GENDERS);
		const { firstName, lastName, fullname } = randomUzbekName(gender === "CHILD" ? (Math.random() > 0.5 ? "MALE" : "FEMALE") : gender);
		const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_student${i + 1}`;
		
		// Check if exists
		const existing = await prisma.student.findUnique({ where: { username } });
		if (existing) continue;
		
		// Assign 0-2 degrees randomly
		const numDegrees = Math.floor(Math.random() * 3);
		const studentDegrees = degrees
			.sort(() => 0.5 - Math.random())
			.slice(0, numDegrees);
		
		const student = await prisma.student.create({
			data: {
				username,
				fullname,
				password: passwordHash,
				birthDate: new Date(randomBirthdate(2000, 2010)),
				phone: randomUzbekPhone(),
				tgUsername: `${firstName.toLowerCase()}${lastName.toLowerCase()}`,
				gender,
				isActive: true,
				possibleDegrees: studentDegrees.length > 0 ? {
					connect: studentDegrees.map(d => ({ id: d.id }))
				} : undefined
			},
		});
		students.push(student);
	}
	console.log(`✅ Created ${students.length} students`);
	return students;
}

async function seedCourses(teachers, degrees) {
	console.log("\n📖 Seeding 30 courses...");
	const courses = [];
	
	for (let i = 0; i < 30; i++) {
		const courseName = COURSE_NAMES[i] || `Kurs ${i + 1}`;
		const teacher = pick(teachers);
		const gender = pick(["MALE", "FEMALE", "CHILD"]);
		
		// Random days (1-5 days per week)
		const numDays = Math.floor(Math.random() * 5) + 1;
		const days = DAYS_OF_WEEK
			.sort(() => 0.5 - Math.random())
			.slice(0, numDays);
		
		// Course dates
		const startAt = new Date(2024, 0, 1);
		const endAt = new Date(2024, 11, 31);
		
		// Course times (8:00 - 20:00)
		const startHour = Math.floor(Math.random() * 8) + 8; // 8-15
		const endHour = startHour + Math.floor(Math.random() * 3) + 1; // 1-3 hours duration
		const startTime = new Date(2024, 0, 1, startHour, 0, 0);
		const endTime = new Date(2024, 0, 1, endHour, 0, 0);
		
		// Assign 1-2 degrees
		const numDegrees = Math.floor(Math.random() * 2) + 1;
		const courseDegrees = degrees
			.sort(() => 0.5 - Math.random())
			.slice(0, numDegrees);
		
		const course = await prisma.course.create({
			data: {
				name: courseName,
				description: `${courseName} kursi - Islomiy ta'lim`,
				daysOfWeek: days,
				gender,
				startAt,
				endAt,
				startTime,
				endTime,
				teacherId: teacher.id,
				degrees: {
					connect: courseDegrees.map(d => ({ id: d.id }))
				}
			},
		});
		courses.push(course);
	}
	console.log(`✅ Created ${courses.length} courses`);
	return courses;
}

async function seedEnrollments(courses, students) {
	console.log("\n📝 Seeding course enrollments...");
	const enrollments = [];
	
	// Each student enrolled in 1-3 courses
	for (const student of students) {
		const numCourses = Math.floor(Math.random() * 3) + 1;
		const studentCourses = courses
			.filter(c => c.gender === student.gender || c.gender === "CHILD" || student.gender === "CHILD")
			.sort(() => 0.5 - Math.random())
			.slice(0, numCourses);
		
		for (const course of studentCourses) {
			try {
				const enrollment = await prisma.courseStudent.create({
					data: {
						courseId: course.id,
						studentId: student.id,
						monthlyPayment: Math.floor(Math.random() * 500000) + 200000, // 200k - 700k UZS
						isActive: true,
						joinedAt: new Date(2024, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1),
					},
				});
				enrollments.push(enrollment);
			} catch (e) {
				// Skip if already enrolled
			}
		}
	}
	console.log(`✅ Created ${enrollments.length} enrollments`);
	return enrollments;
}

async function seedAttendances(courses, students) {
	console.log("\n✅ Seeding attendance records...");
	const attendances = [];
	
	// Generate attendance for last 30 days
	const today = new Date();
	for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
		const date = new Date(today);
		date.setDate(date.getDate() - dayOffset);
		
		// For each course, mark attendance for enrolled students
		for (const course of courses) {
			const enrollments = await prisma.courseStudent.findMany({
				where: {
					courseId: course.id,
					isActive: true,
				},
				include: { student: true },
			});
			
			// Check if this day is a course day
			const dayName = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"][date.getDay()];
			if (!course.daysOfWeek.includes(dayName)) continue;
			
			for (const enrollment of enrollments) {
				// 80% attendance rate
				const isPresent = Math.random() > 0.2;
				const point = isPresent ? Math.floor(Math.random() * 5) + 6 : null; // 6-10 points if present
				
				try {
					const attendance = await prisma.attendance.create({
						data: {
							courseId: course.id,
							studentId: enrollment.studentId,
							date,
							isPresent,
							point,
						},
					});
					attendances.push(attendance);
				} catch (e) {
					// Skip if already exists
				}
			}
		}
	}
	console.log(`✅ Created ${attendances.length} attendance records`);
	return attendances;
}

async function seedInvoices(enrollments) {
	console.log("\n💰 Seeding invoices...");
	const invoices = [];
	
	// Generate invoices for last 3 months
	const today = new Date();
	for (let monthOffset = 0; monthOffset < 3; monthOffset++) {
		const month = new Date(today.getFullYear(), today.getMonth() - monthOffset, 1);
		const monthStart = new Date(month.getFullYear(), month.getMonth(), 1);
		const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
		
		for (const enrollment of enrollments) {
			// Only create invoice if enrollment was active during this month
			if (enrollment.joinedAt > monthEnd) continue;
			
			const daysInMonth = monthEnd.getDate();
			const dailyRate = enrollment.monthlyPayment / daysInMonth;
			
			// Random status
			const statusRoll = Math.random();
			let status = "PENDING";
			let paidAmount = 0;
			
			if (statusRoll > 0.7) {
				status = "PAID";
				paidAmount = enrollment.monthlyPayment;
			} else if (statusRoll > 0.4) {
				status = "PARTIALLY_PAID";
				paidAmount = Math.floor(enrollment.monthlyPayment * (0.3 + Math.random() * 0.5));
			}
			
			try {
				const invoice = await prisma.invoice.create({
					data: {
						courseStudentId: enrollment.id,
						billingPeriodStart: monthStart,
						billingPeriodEnd: monthEnd,
						totalAmount: enrollment.monthlyPayment,
						paidAmount,
						daysInPeriod: daysInMonth,
						dailyRate,
						status,
						breakdown: {
							baseAmount: enrollment.monthlyPayment,
							days: daysInMonth,
							rate: dailyRate,
						},
					},
				});
				invoices.push(invoice);
			} catch (e) {
				// Skip if error
			}
		}
	}
	console.log(`✅ Created ${invoices.length} invoices`);
	return invoices;
}

async function main() {
	try {
		console.log("🚀 Starting comprehensive mock data seeding...\n");
		
		// Seed in order
		const degrees = await seedDegrees();
		const admins = await seedAdmins();
		const teachers = await seedTeachers(degrees);
		const students = await seedStudents(degrees);
		const courses = await seedCourses(teachers, degrees);
		const enrollments = await seedEnrollments(courses, students);
		const attendances = await seedAttendances(courses, students);
		const invoices = await seedInvoices(enrollments);
		
		console.log("\n" + "=".repeat(50));
		console.log("✅ Mock data seeding completed successfully!");
		console.log("=".repeat(50));
		console.log(`📊 Summary:`);
		console.log(`   • Degrees: ${degrees.length}`);
		console.log(`   • Admins: ${admins.length}`);
		console.log(`   • Teachers: ${teachers.length}`);
		console.log(`   • Students: ${students.length}`);
		console.log(`   • Courses: ${courses.length}`);
		console.log(`   • Enrollments: ${enrollments.length}`);
		console.log(`   • Attendance Records: ${attendances.length}`);
		console.log(`   • Invoices: ${invoices.length}`);
		console.log("\n💡 Default password for all users: " + (process.env.SEED_USER_PASSWORD || "Admin123! / Teacher123! / Student123!"));
		
	} catch (error) {
		console.error("❌ Seed failed:", error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();

