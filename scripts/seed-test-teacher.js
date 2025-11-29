import { prisma } from "../src/database/index.js";
import { hashPassword } from "../src/utils/auth/password.js";
import config from "../src/config/env.js";

async function seedTestTeacher() {
	try {
		const username = "teacher";
		const password = "Teacher123!";
		const fullname = "Test Teacher";
		const birthDate = "1990-01-01";
		const phone = "998901234567";
		const tgUsername = "testteacher";
		const gender = "MALE";

		// Check if teacher already exists
		const existing = await prisma.teacher.findUnique({
			where: { username },
		});

		if (existing) {
			// Update password if exists
			const hashedPassword = await hashPassword(password);
			await prisma.teacher.update({
				where: { username },
				data: {
					password: hashedPassword,
					isActive: true,
				},
			});
			console.log(`✅ Updated existing teacher: ${username}`);
			console.log(`   Password: ${password}`);
		} else {
			// Create new teacher
			const hashedPassword = await hashPassword(password);
			await prisma.teacher.create({
				data: {
					username,
					password: hashedPassword,
					fullname,
					birthDate: new Date(birthDate).toISOString(),
					phone,
					tgUsername,
					gender,
					isActive: true,
				},
			});
			console.log(`✅ Created test teacher: ${username}`);
			console.log(`   Password: ${password}`);
		}

		console.log("\n🎉 Test teacher ready for login!");
	} catch (error) {
		console.error("❌ Failed to seed test teacher:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
}

seedTestTeacher();
