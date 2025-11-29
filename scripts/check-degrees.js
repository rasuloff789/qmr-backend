import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkDegrees() {
	try {
		const count = await prisma.degree.count();
		console.log(`Total degrees in database: ${count}`);

		if (count > 0) {
			const degrees = await prisma.degree.findMany({ take: 5 });
			console.log("Sample degrees:");
			degrees.forEach((d) => console.log(`  - ${d.id}: ${d.name}`));
		} else {
			console.log("No degrees found. Running seed script...");
		}
	} catch (error) {
		console.error("Error:", error);
	} finally {
		await prisma.$disconnect();
	}
}

checkDegrees();
