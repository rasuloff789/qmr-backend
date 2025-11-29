import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import config from "../src/config/env.js";

const prisma = new PrismaClient({
	log: ["warn", "error"],
});

const DEFAULT_USERNAME = process.env.ADMIN_USERNAME || "admin";
const DEFAULT_PASSWORD = process.env.ADMIN_PASSWORD || "Admin123!";
const DEFAULT_GENDER = process.env.ADMIN_GENDER || "MALE"; // MALE, FEMALE

async function createMockAdmin() {
	// Check if admin already exists
	const existing = await prisma.admin.findUnique({
		where: { username: DEFAULT_USERNAME },
	});

	if (existing) {
		console.log(
			`ℹ️  Admin user '${DEFAULT_USERNAME}' already exists (id: ${existing.id}).`
		);
		console.log(`   To recreate, delete the existing admin first.`);
		return existing;
	}

	// Hash password
	const hashedPassword = await bcrypt.hash(
		DEFAULT_PASSWORD,
		config.BCRYPT_ROUNDS
	);

	// Create mock admin
	const admin = await prisma.admin.create({
		data: {
			fullname: `Mock Admin (${DEFAULT_GENDER})`,
			username: DEFAULT_USERNAME,
			birthDate: new Date("1990-01-01"),
			phone: "998901234567",
			tgUsername: "mock_admin",
			password: hashedPassword,
			gender: DEFAULT_GENDER,
			isActive: true,
		},
		select: {
			id: true,
			username: true,
			fullname: true,
			gender: true,
			isActive: true,
			createdAt: true,
		},
	});

	console.log("\n✅ Mock admin created successfully:");
	console.log(`   Username: ${admin.username}`);
	console.log(`   Password: ${DEFAULT_PASSWORD}`);
	console.log(`   Gender: ${admin.gender}`);
	console.log(`   Fullname: ${admin.fullname}`);
	console.log(`   Active: ${admin.isActive}`);
	console.log(`   ID: ${admin.id}`);
	console.log("\n💡 You can use these credentials to login as admin.");

	return admin;
}

async function main() {
	try {
		await createMockAdmin();
	} catch (error) {
		console.error("❌ Failed to create mock admin:", error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();
