import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import config from "../src/config/env.js";

const prisma = new PrismaClient({
	log: ["warn", "error"],
});

const ROOT_USERNAME = "root";
const ROOT_PASSWORD = "Root123!";

async function fixRootPassword() {
	try {
		const root = await prisma.root.findUnique({
			where: { username: ROOT_USERNAME },
		});

		if (!root) {
			console.log(`❌ Root user '${ROOT_USERNAME}' not found. Creating...`);
			const hashedPassword = await bcrypt.hash(
				ROOT_PASSWORD,
				config.BCRYPT_ROUNDS
			);
			await prisma.root.create({
				data: {
					fullname: "System Root",
					username: ROOT_USERNAME,
					password: hashedPassword,
				},
			});
			console.log(`✅ Root user created with password '${ROOT_PASSWORD}'`);
		} else {
			console.log(`📝 Root user found (id: ${root.id}). Checking password...`);

			// Verify current password first
			const isValid = await bcrypt.compare(ROOT_PASSWORD, root.password);

			if (!isValid) {
				console.log(`   Current password doesn't match. Updating...`);
				const hashedPassword = await bcrypt.hash(
					ROOT_PASSWORD,
					config.BCRYPT_ROUNDS
				);
				await prisma.root.update({
					where: { id: root.id },
					data: { password: hashedPassword },
				});
				console.log(`✅ Root password updated to '${ROOT_PASSWORD}'`);

				// Verify it works
				const root2 = await prisma.root.findUnique({
					where: { id: root.id },
				});
				const isValid2 = await bcrypt.compare(ROOT_PASSWORD, root2.password);
				if (isValid2) {
					console.log(`✅ Password verified and working`);
				} else {
					console.log(`❌ Password update failed verification`);
				}
			} else {
				console.log(`✅ Root password is already correct ('${ROOT_PASSWORD}')`);
			}
		}
	} catch (error) {
		console.error("❌ Failed to fix root password:", error);
		process.exitCode = 1;
	} finally {
		await prisma.$disconnect();
	}
}

fixRootPassword();
