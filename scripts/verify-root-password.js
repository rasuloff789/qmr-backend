import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function verifyRootPassword() {
	try {
		const root = await prisma.root.findUnique({
			where: { username: "root" },
		});

		if (!root) {
			console.log("❌ Root user not found");
			return;
		}

		console.log("✅ Root user found:");
		console.log(`   ID: ${root.id}`);
		console.log(`   Username: ${root.username}`);
		console.log(`   Password hash: ${root.password.substring(0, 30)}...`);

		const isValid = await bcrypt.compare("Root123!", root.password);
		console.log(
			`\n🔍 Password 'Root123!' matches: ${isValid ? "✅ YES" : "❌ NO"}`
		);

		if (!isValid) {
			console.log("\n🔧 Updating password...");
			const newHash = await bcrypt.hash("Root123!", 12);
			await prisma.root.update({
				where: { id: root.id },
				data: { password: newHash },
			});
			console.log("✅ Password updated!");

			// Verify again
			const root2 = await prisma.root.findUnique({
				where: { username: "root" },
			});
			const isValid2 = await bcrypt.compare("Root123!", root2.password);
			console.log(
				`🔍 Password 'Root123!' matches after update: ${
					isValid2 ? "✅ YES" : "❌ NO"
				}`
			);
		}
	} catch (error) {
		console.error("❌ Error:", error);
	} finally {
		await prisma.$disconnect();
	}
}

verifyRootPassword();
