/**
 * Jest Test Setup File
 * 
 * Bu fayl har bir test ishga tushguncha bir marta bajariladi.
 * Umumiy sozlamalar va global funksiyalarni bu yerda sozlaymiz.
 */

import { beforeAll, afterAll, beforeEach, afterEach } from "@jest/globals";
import { prisma } from "../src/database/index.js";

/**
 * Global test setup - barcha testlar ishga tushishidan oldin
 */
beforeAll(async () => {
	console.log("🧪 Test setup boshlandi...");
	
	// Database connection tekshiruvini o'tkazish
	try {
		await prisma.$connect();
		console.log("✅ Database ulandi");
	} catch (error) {
		console.error("❌ Database ulanmadi:", error);
		throw error;
	}
});

/**
 * Har bir testdan oldin
 */
beforeEach(async () => {
	// Bu joyda har bir testdan oldin kerakli ma'lumotlarni sozlang
	// Masalan, test ma'lumotlarini yaratish
});

/**
 * Har bir testdan keyin
 */
afterEach(async () => {
	// Bu joyda har bir testdan keyin cleanup qiling
	// Masalan, test ma'lumotlarini o'chirish
});

/**
 * Global test teardown - barcha testlar tugagandan keyin
 */
afterAll(async () => {
	console.log("🧹 Test cleanup boshlandi...");
	
	// Database ulanishini yopish
	try {
		await prisma.$disconnect();
		console.log("✅ Database ulanishi yopildi");
	} catch (error) {
		console.error("❌ Database ulanishini yopishda xatolik:", error);
	}
});

/**
 * Global error handler
 */
process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (error) => {
	console.error("Uncaught Exception:", error);
});

