import { PrismaClient } from "@prisma/client";
import config from "./env.js";

// Create Prisma client with optimized configuration
const prisma = new PrismaClient({
	log:
		config.NODE_ENV === "development"
			? ["query", "info", "warn", "error"]
			: ["error"],
	datasources: {
		db: {
			url: config.DATABASE_URL,
		},
	},
});

// Connection pooling and error handling
prisma
	.$connect()
	.then(() => {
		console.log("✅ Database connected successfully");
	})
	.catch((error) => {
		console.error("❌ Database connection failed:", error);
		process.exit(1);
	});

// Graceful shutdown
process.on("beforeExit", async () => {
	await prisma.$disconnect();
});

process.on("SIGINT", async () => {
	await prisma.$disconnect();
	process.exit(0);
});

process.on("SIGTERM", async () => {
	await prisma.$disconnect();
	process.exit(0);
});

export default prisma;
