import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import config from "../src/config/env.js";

const prisma = new PrismaClient({
	log: ["warn", "error"],
});

const DEFAULT_USERNAME = process.env.ROOT_USERNAME || "root";
const DEFAULT_PASSWORD = process.env.ROOT_PASSWORD || "Root123!";

async function createRootUser() {
	const existing = await prisma.root.findUnique({
		where: { username: DEFAULT_USERNAME },
	});

	if (existing) {
		console.log(
			`ℹ️  Root user '${DEFAULT_USERNAME}' already exists (id: ${existing.id}).`
		);
		return existing;
	}

	const hashedPassword = await bcrypt.hash(
		DEFAULT_PASSWORD,
		config.BCRYPT_ROUNDS
	);

	const rootUser = await prisma.root.create({
		data: {
			fullname: "System Root",
			username: DEFAULT_USERNAME,
			password: hashedPassword,
		},
	});

	console.log("✅ Root user created for testing:");
	console.log(`   username: ${DEFAULT_USERNAME}`);
	console.log(`   password: ${DEFAULT_PASSWORD}`);

	return rootUser;
}

async function main() {
	try {
		await createRootUser();
	} catch (error) {
		console.error("❌ Failed to seed root user:", error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

main();
