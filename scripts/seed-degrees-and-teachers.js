import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import { prisma } from "../src/database/index.js";
import config from "../src/config/env.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, "../uploads/profile-pictures");

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

function pick(arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

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
];

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
];

const GENDERS = ["MALE", "FEMALE"];

function randomPhoneUZ() {
	// 99890xxxxxxx
	const rest = String(Math.floor(1000000 + Math.random() * 8999999));
	return `99890${rest}`;
}

function randomBirthdate() {
	const start = new Date(1970, 0, 1).getTime();
	const end = new Date(1999, 11, 31).getTime();
	const d = new Date(start + Math.random() * (end - start));
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, "0");
	const dd = String(d.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
}

async function seedDegrees() {
	const created = [];
	for (const name of DEGREE_NAMES) {
		const existing = await prisma.degree.findUnique({ where: { name } });
		if (!existing) {
			const d = await prisma.degree.create({ data: { name } });
			created.push(d);
		}
	}
	const all = await prisma.degree.findMany();
	console.log(`✅ Seeded ${all.length} degrees (${created.length} new).`);
	return all;
}

async function seedTeachers(degrees) {
	// image sources (royalty-free placeholder)
	const baseUrls = [
		"https://picsum.photos/seed/teacher1/400/400",
		"https://picsum.photos/seed/teacher2/400/400",
		"https://picsum.photos/seed/teacher3/400/400",
		"https://picsum.photos/seed/teacher4/400/400",
		"https://picsum.photos/seed/teacher5/400/400",
		"https://picsum.photos/seed/teacher6/400/400",
		"https://picsum.photos/seed/teacher7/400/400",
		"https://picsum.photos/seed/teacher8/400/400",
		"https://picsum.photos/seed/teacher9/400/400",
		"https://picsum.photos/seed/teacher10/400/400",
	];

	const targets = [];
	for (let i = 0; i < 20; i++) {
		const first = pick(FIRST_NAMES);
		const last = pick(LAST_NAMES);
		const username = `${first.toLowerCase()}_${last.toLowerCase()}_${Math.floor(
			Math.random() * 1000
		)}`;
		const fullname = `${first} ${last}`;
		const gender = pick(GENDERS);
		const phone = randomPhoneUZ();
		const tgUsername = `${first.toLowerCase()}${last.toLowerCase()}`;
		const birthDate = randomBirthdate();
		// Ensure at least 1 degree, up to 3 degrees per teacher
		const numDegrees = Math.max(1, Math.floor(Math.random() * 3) + 1);
		const degreeSample = degrees
			.sort(() => 0.5 - Math.random())
			.slice(0, numDegrees);

		// download or reuse images
		const imgUrl = pick(baseUrls) + `?rand=${Math.random()}`;
		const filename = `seed-${Date.now()}-${i}.jpg`;
		let profilePicture = null;
		try {
			profilePicture = await downloadImage(imgUrl, filename);
		} catch (e) {
			// fallback to null if download fails
			profilePicture = null;
		}

		targets.push({
			username,
			fullname,
			gender,
			phone,
			tgUsername,
			birthDate,
			profilePicture,
			degreeIds: degreeSample.map((d) => d.id),
		});
	}

	const DEFAULT_PASSWORD = process.env.SEED_USER_PASSWORD || "Str0ngPass!";
	const passwordHash = await bcrypt.hash(
		DEFAULT_PASSWORD,
		config.BCRYPT_ROUNDS
	);

	let createdCount = 0;
	let skippedCount = 0;

	for (const t of targets) {
		try {
			await prisma.teacher.upsert({
				where: { username: t.username },
				update: {
					// Update degrees if teacher exists
					degrees: {
						set: [],
						connect: t.degreeIds.map((id) => ({ id })),
					},
				},
				create: {
					username: t.username,
					fullname: t.fullname,
					birthDate: new Date(t.birthDate).toISOString(),
					phone: t.phone,
					tgUsername: t.tgUsername,
					gender: t.gender,
					profilePicture: t.profilePicture,
					degrees: { connect: t.degreeIds.map((id) => ({ id })) },
					password: passwordHash,
				},
			});
			createdCount++;
		} catch (e) {
			console.log("Skip teacher (error):", t.username, e.message);
			skippedCount++;
		}
	}

	console.log(`✅ Seeded ${createdCount} teachers with degrees.`);
	if (skippedCount > 0) {
		console.log(`⚠️  Skipped ${skippedCount} teachers.`);
	}
}

async function main() {
	try {
		await ensureDirs();
		const degrees = await seedDegrees();
		await seedTeachers(degrees);
		console.log("\n🎉 Mock teachers with degrees ready for testing.");
		console.log(
			`   Default password → ${process.env.SEED_USER_PASSWORD || "Str0ngPass!"}`
		);
	} catch (e) {
		console.error("❌ Seed failed:", e);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();
