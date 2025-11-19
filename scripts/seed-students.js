import { PrismaClient } from "@prisma/client";
import { checkInternationalPhone } from "../src/utils/regex.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "../uploads/profile-pictures");

// Create a separate Prisma instance for seeding without query logging
const prisma = new PrismaClient({
	log: ["warn", "error"],
});

async function ensureDirs() {
	if (!fs.existsSync(uploadsDir)) {
		fs.mkdirSync(uploadsDir, { recursive: true });
	}
}

async function downloadImage(url, filename) {
	const filePath = path.join(uploadsDir, filename);
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
	const buffer = await res.arrayBuffer();
	fs.writeFileSync(filePath, Buffer.from(buffer));
	return `/uploads/profile-pictures/${filename}`;
}

const FIRST_NAMES = [
	"Alex",
	"Sam",
	"Jordan",
	"Taylor",
	"Morgan",
	"Casey",
	"Avery",
	"Riley",
	"Quinn",
	"Jamie",
	"Cameron",
	"Drew",
	"Logan",
	"Reese",
	"Parker",
	"Rowan",
	"Elliot",
	"Hayden",
	"Finley",
	"River",
	"Skyler",
	"Peyton",
	"Dakota",
	"Blake",
	"Sage",
	"Phoenix",
	"Indigo",
	"Ash",
	"Grayson",
	"Harper",
];

const LAST_NAMES = [
	"Johnson",
	"Smith",
	"Williams",
	"Brown",
	"Jones",
	"Garcia",
	"Miller",
	"Davis",
	"Martinez",
	"Hernandez",
	"Lopez",
	"Gonzalez",
	"Wilson",
	"Anderson",
	"Thomas",
	"Taylor",
	"Moore",
	"Jackson",
	"Martin",
	"Lee",
	"Thompson",
	"White",
	"Harris",
	"Sanchez",
	"Clark",
	"Ramirez",
	"Lewis",
	"Robinson",
	"Walker",
	"Young",
];

const GENDERS = ["MALE", "FEMALE", "CHILD"];

const DEGREE_NAMES = [
	"Computer Science",
	"Mathematics",
	"Physics",
	"Chemistry",
	"Biology",
	"English Literature",
	"History",
	"Economics",
	"Philosophy",
	"Electrical Engineering",
	"Mechanical Engineering",
	"Business Administration",
	"Graphic Design",
	"International Relations",
	"Data Science",
];

// Country phone number generators with various lengths
const COUNTRY_CODES = {
	US: "1",
	UK: "44",
	DE: "49",
	FR: "33",
	IT: "39",
	ES: "34",
	AU: "61",
	CA: "1",
	BR: "55",
	IN: "91",
	JP: "81",
	CN: "86",
	MX: "52",
	RU: "7",
	KR: "82",
	TR: "90",
	UZ: "998",
	SA: "966",
	AE: "971",
	PK: "92",
};

function randomPhoneInternational() {
	// Pick a random country code
	const countries = Object.values(COUNTRY_CODES);
	const countryCode = countries[Math.floor(Math.random() * countries.length)];

	// Generate a random national number based on country pattern
	let nationalLength;
	if (countryCode.length === 1) {
		// USA/Canada: 10 digits
		nationalLength = 10;
	} else if (countryCode.length === 2) {
		// Most countries: 9-10 digits
		nationalLength = Math.floor(Math.random() * 2) + 9; // 9 or 10
	} else {
		// 3-digit country codes: 7-9 digits
		nationalLength = Math.floor(Math.random() * 3) + 7; // 7, 8, or 9
	}

	// Generate random national number
	const nationalNumber = String(
		Math.floor(
			Math.random() * (10 ** nationalLength - 10 ** (nationalLength - 1))
		) +
			10 ** (nationalLength - 1)
	);

	const fullNumber = countryCode + nationalNumber;

	// Validate with our regex function
	const validation = checkInternationalPhone(fullNumber);

	if (!validation.valid) {
		console.error(
			`❌ Generated invalid phone: ${fullNumber} (${countryCode} + ${nationalNumber})`
		);
		// Fallback to a valid number
		return randomPhoneInternational(); // Recursive call
	}

	return validation.normalized;
}

function randomBirthdate() {
	const start = new Date(1995, 0, 1).getTime();
	const end = new Date(2008, 11, 31).getTime();
	const d = new Date(start + Math.random() * (end - start));
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
}

function pick(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

function pickDegreeIds(degrees) {
	if (!degrees.length) {
		return [];
	}

	const maxCount = Math.min(3, degrees.length);
	const count = Math.floor(Math.random() * maxCount) + 1; // 1..maxCount
	const shuffled = [...degrees].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, count).map((d) => d.id);
}

async function ensureDegrees() {
	for (const name of DEGREE_NAMES) {
		await prisma.degree.upsert({
			where: { name },
			update: {},
			create: { name },
		});
	}

	const degrees = await prisma.degree.findMany({
		select: { id: true, name: true },
		orderBy: { name: "asc" },
	});

	if (!degrees.length) {
		throw new Error("❌ Unable to seed students because no degrees exist.");
	}

	console.log(
		`🎓 Ensured ${degrees.length} degrees: ${degrees
			.map((d) => d.name)
			.slice(0, 5)
			.join(", ")}${degrees.length > 5 ? ", ..." : ""}`
	);

	return degrees;
}

async function seedStudents(degrees) {
	const targets = [];
	const createdStudents = [];

	// Image sources (royalty-free placeholder) - different seeds for students
	const studentUrls = [
		"https://picsum.photos/seed/student1/400/400",
		"https://picsum.photos/seed/student2/400/400",
		"https://picsum.photos/seed/student3/400/400",
		"https://picsum.photos/seed/student4/400/400",
		"https://picsum.photos/seed/student5/400/400",
		"https://picsum.photos/seed/student6/400/400",
		"https://picsum.photos/seed/student7/400/400",
		"https://picsum.photos/seed/student8/400/400",
		"https://picsum.photos/seed/student9/400/400",
		"https://picsum.photos/seed/student10/400/400",
	];

	// Child profile pictures
	const childUrls = [
		"https://picsum.photos/seed/child1/400/400",
		"https://picsum.photos/seed/child2/400/400",
		"https://picsum.photos/seed/child3/400/400",
		"https://picsum.photos/seed/child4/400/400",
		"https://picsum.photos/seed/child5/400/400",
		"https://picsum.photos/seed/child6/400/400",
		"https://picsum.photos/seed/child7/400/400",
		"https://picsum.photos/seed/child8/400/400",
		"https://picsum.photos/seed/child9/400/400",
		"https://picsum.photos/seed/child10/400/400",
	];

	console.log(
		"🌍 Generating 100 students with international phone numbers...\n"
	);

	for (let i = 0; i < 100; i++) {
		const first = pick(FIRST_NAMES);
		const last = pick(LAST_NAMES);
		const username = `${first.toLowerCase()}_${last.toLowerCase()}_${Math.floor(
			Math.random() * 10000
		)}`;

		// Ensure unique username
		const existing = await prisma.student.findUnique({ where: { username } });
		if (existing) {
			i--; // Retry this index
			continue;
		}

		const fullname = `${first} ${last}`;
		const gender = pick(GENDERS);
		const phone = randomPhoneInternational();
		const tgUsername = `${first.toLowerCase()}${last.toLowerCase()}`;

		// Validate telegram username length (must be 5-32 chars)
		const validTgUsername =
			tgUsername.length >= 5
				? tgUsername
				: tgUsername +
				  `${Math.floor(Math.random() * 10)}`.repeat(5 - tgUsername.length);

		const birthDate = randomBirthdate();

		// Some students without phone numbers (to test optional field)
		const shouldHavePhone = Math.random() > 0.1; // 90% have phone

		// Download profile picture - mix of students and children
		const isChild = Math.random() < 0.3; // 30% children
		const imgUrl =
			pick(isChild ? childUrls : studentUrls) +
			`?rand=${Date.now()}-${i}-${Math.random()}`;
		const filePrefix = isChild ? "child" : "student";
		const filename = `${filePrefix}-${Date.now()}-${i}.jpg`;
		let profilePicture = null;
		try {
			profilePicture = await downloadImage(imgUrl, filename);
		} catch (e) {
			// fallback to null if download fails
			profilePicture = null;
		}

		const degreeIds = pickDegreeIds(degrees);

		targets.push({
			username,
			fullname,
			gender,
			phone: shouldHavePhone ? phone : null,
			tgUsername: validTgUsername,
			birthDate,
			profilePicture,
			degreeIds,
		});
	}

	console.log(`✅ Generated ${targets.length} student records\n`);
	console.log("🔍 Validation Check - Sample phone numbers:\n");

	// Validate first 10 phone numbers
	for (let i = 0; i < Math.min(10, targets.length); i++) {
		const student = targets[i];
		if (student.phone) {
			const validation = checkInternationalPhone(student.phone);
			const status = validation.valid ? "✅" : "❌";
			console.log(
				`${status} ${student.fullname}: ${student.phone} - ${
					validation.valid ? "VALID" : validation.reason
				}`
			);
		} else {
			console.log(`➖ ${student.fullname}: No phone (optional field)`);
		}
	}

	console.log("\n📝 Inserting students into database...\n");

	for (const s of targets) {
		try {
			const student = await prisma.student.create({
				data: {
					username: s.username,
					fullname: s.fullname,
					birthDate: new Date(s.birthDate).toISOString(),
					phone: s.phone,
					tgUsername: s.tgUsername,
					gender: s.gender,
					profilePicture: s.profilePicture,
					possibleDegrees:
						s.degreeIds.length > 0
							? { connect: s.degreeIds.map((id) => ({ id })) }
							: undefined,
					password:
						"$2b$12$u1X36kqIYV0KpJzX5bqE8u9s1QyH0q2l0e1Dk7nW3k9CqKJrGz6pK", // bcrypt for "Str0ngPass!"
				},
				select: {
					id: true,
					username: true,
					fullname: true,
					phone: true,
					tgUsername: true,
					profilePicture: true,
					isActive: true,
					isDeleted: true,
					possibleDegrees: {
						select: {
							name: true,
						},
					},
				},
			});
			createdStudents.push(student);
		} catch (e) {
			console.error(`❌ Failed to create ${s.username}: ${e.message}`);
		}
	}

	return createdStudents;
}

async function main() {
	try {
		console.log("🚀 Starting student seed script...\n");

		// Check existing students
		const existingCount = await prisma.student.count();
		if (existingCount > 0) {
			console.log(`⚠️  Found ${existingCount} existing students in database.`);
			console.log("🧹 Clearing existing students...");
			await prisma.student.deleteMany({});
			console.log("✅ Cleared existing students.\n");
		}

		await ensureDirs();
		const degrees = await ensureDegrees();
		const students = await seedStudents(degrees);
		console.log(`\n✅ Successfully created ${students.length} students!`);
		console.log(`📊 Sample of created students:`);

		// Show sample of created students
		const sample = students.slice(0, 5);
		for (const student of sample) {
			const degreeNames = student.possibleDegrees?.length
				? student.possibleDegrees.map((d) => d.name).join(", ")
				: "No degrees";
			console.log(
				`  • ${student.fullname} (@${student.tgUsername}) - ${
					student.phone || "No phone"
				}${student.profilePicture ? " [🖼️]" : ""} | Degrees: ${degreeNames}`
			);
		}

		// Fetch count from database
		const totalCount = await prisma.student.count();
		console.log(`\n📈 Total students in database: ${totalCount}`);
	} catch (e) {
		console.error("❌ Seed failed:", e);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();
