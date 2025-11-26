import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import config from "../src/config/env.js";

const prisma = new PrismaClient({
	log: ["warn", "error"],
});

const DEFAULT_PASSWORD = process.env.SEED_USER_PASSWORD || "Str0ngPass!";

const ADMIN_SEED = [
	{
		fullname: "Amina Bek",
		username: "admin.amina",
		tgUsername: "amina_admin",
		birthDate: "1989-04-12",
		phone: "998901234567",
	},
	{
		fullname: "Sardor Karim",
		username: "admin.sardor",
		tgUsername: "sardor_admin",
		birthDate: "1992-07-03",
		phone: "998931112233",
	},
];

const TEACHER_SEED = [
	{
		fullname: "Nilufar Xolmatova",
		username: "teacher.nilufar",
		tgUsername: "nilufar_teacher",
		birthDate: "1985-09-19",
		phone: "998971234567",
		gender: "FEMALE",
	},
	{
		fullname: "Javlon Rakhimov",
		username: "teacher.javlon",
		tgUsername: "javlon_teacher",
		birthDate: "1980-02-08",
		phone: "998939998877",
		gender: "MALE",
	},
];

const STUDENT_SEED = [
	{
		fullname: "Madina Ergasheva",
		username: "student.madina",
		tgUsername: "madina_student",
		birthDate: "2004-11-05",
		phone: "998935551199",
		gender: "FEMALE",
	},
	{
		fullname: "Bekzod Olimov",
		username: "student.bekzod",
		tgUsername: "bekzod_student",
		birthDate: "2003-01-17",
		phone: "998909991122",
		gender: "MALE",
	},
	{
		fullname: "Farhod Nasirov",
		username: "student.farhod",
		tgUsername: "farhod_student",
		birthDate: "2006-06-22",
		phone: null,
		gender: "MALE",
	},
];

async function upsertAdmins(passwordHash) {
	for (const admin of ADMIN_SEED) {
		await prisma.admin.upsert({
			where: { username: admin.username },
			update: {},
			create: {
				...admin,
				birthDate: new Date(admin.birthDate),
				password: passwordHash,
			},
		});
	}
	console.log(`✅ Seeded ${ADMIN_SEED.length} admins.`);
}

async function upsertTeachers(passwordHash) {
	for (const teacher of TEACHER_SEED) {
		await prisma.teacher.upsert({
			where: { username: teacher.username },
			update: {},
			create: {
				...teacher,
				birthDate: new Date(teacher.birthDate),
				password: passwordHash,
			},
		});
	}
	console.log(`✅ Seeded ${TEACHER_SEED.length} teachers.`);
}

async function upsertStudents(passwordHash) {
	// Get all available degrees
	const degrees = await prisma.degree.findMany({
		select: { id: true, name: true },
	});

	if (degrees.length === 0) {
		console.log(
			"⚠️  No degrees found. Students will be created without degrees."
		);
		console.log("   Run 'npm run seed:teachers' first to create degrees.");
	}

	// Assign random degrees to each student (1-3 degrees per student)
	function pickRandomDegrees(availableDegrees) {
		if (availableDegrees.length === 0) return [];
		const numDegrees = Math.max(1, Math.floor(Math.random() * 3) + 1);
		const shuffled = [...availableDegrees].sort(() => Math.random() - 0.5);
		return shuffled.slice(0, Math.min(numDegrees, availableDegrees.length));
	}

	for (const student of STUDENT_SEED) {
		const selectedDegrees = pickRandomDegrees(degrees);
		const degreeIds = selectedDegrees.map((d) => d.id);

		await prisma.student.upsert({
			where: { username: student.username },
			update: {
				// Update degrees if student exists
				possibleDegrees: {
					set: [],
					connect: degreeIds.map((id) => ({ id })),
				},
			},
			create: {
				...student,
				birthDate: new Date(student.birthDate),
				password: passwordHash,
				possibleDegrees: {
					connect: degreeIds.map((id) => ({ id })),
				},
			},
		});

		const degreeNames = selectedDegrees.map((d) => d.name).join(", ");
		console.log(`  • ${student.fullname}: ${degreeNames || "No degrees"}`);
	}
	console.log(`✅ Seeded ${STUDENT_SEED.length} students with degrees.`);
}

async function main() {
	try {
		const passwordHash = await bcrypt.hash(
			DEFAULT_PASSWORD,
			config.BCRYPT_ROUNDS
		);

		await upsertAdmins(passwordHash);
		await upsertTeachers(passwordHash);
		await upsertStudents(passwordHash);

		console.log("\n🎉 Mock users ready for testing.");
		console.log(
			`   Username/password → e.g. ${ADMIN_SEED[0].username} / ${DEFAULT_PASSWORD}`
		);
	} catch (error) {
		console.error("❌ Failed to seed users:", error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();
