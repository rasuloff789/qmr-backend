/**
 * Telegram Bot Utility
 * Handles Telegram bot integration for password reset functionality
 */

import TelegramBot from "node-telegram-bot-api";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Initialize Telegram Bot
let bot = null;

const initializeTelegramBot = () => {
	if (!bot) {
		try {
			const token = process.env.TELEGRAM_BOT_TOKEN;
			if (!token) {
				console.warn("⚠️ TELEGRAM_BOT_TOKEN not found in environment variables");
				return null;
			}
			
			bot = new TelegramBot(token, { polling: false });
			console.log("✅ Telegram bot initialized successfully");
		} catch (error) {
			console.error("❌ Telegram bot initialization error:", error);
			return null;
		}
	}
	return bot;
};

/**
 * Generate a 6-digit verification code
 * @returns {string} - 6-digit verification code
 */
export const generateVerificationCode = () => {
	return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Store verification code in database with expiration
 * @param {string} username - Username
 * @param {string} userType - User type (root, admin, teacher)
 * @param {string} code - Verification code
 * @param {string} telegramUsername - Telegram username
 * @returns {Promise<Object>} - Database record
 */
export const storeVerificationCode = async (username, userType, code, telegramUsername) => {
	try {
		// Store verification code with 10-minute expiration
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

		const verificationRecord = await prisma.telegramVerificationCode.create({
			data: {
				username,
				userType,
				code,
				telegramUsername,
				expiresAt,
				isUsed: false,
			},
		});

		return verificationRecord;
	} catch (error) {
		console.error("Error storing verification code:", error);
		throw new Error("Failed to store verification code");
	}
};

/**
 * Verify and consume verification code
 * @param {string} username - Username
 * @param {string} userType - User type
 * @param {string} code - Verification code
 * @returns {Promise<Object>} - Verification record if valid
 */
export const verifyAndConsumeCode = async (username, userType, code) => {
	try {
		const verificationRecord = await prisma.telegramVerificationCode.findFirst({
			where: {
				username,
				userType,
				code,
				isUsed: false,
				expiresAt: {
					gt: new Date(), // Not expired
				},
			},
		});

		if (!verificationRecord) {
			return null;
		}

		// Mark code as used
		await prisma.telegramVerificationCode.update({
			where: { id: verificationRecord.id },
			data: { isUsed: true },
		});

		return verificationRecord;
	} catch (error) {
		console.error("Error verifying code:", error);
		throw new Error("Failed to verify code");
	}
};

/**
 * Send Telegram message with inline keyboard for password reset
 * @param {string} telegramUsername - Telegram username
 * @param {string} code - Verification code
 * @param {string} username - System username
 * @param {string} userType - User type
 * @returns {Promise<boolean>} - Success status
 */
export const sendTelegramPasswordResetMessage = async (telegramUsername, code, username, userType) => {
	try {
		const telegramBot = initializeTelegramBot();
		if (!telegramBot) {
			console.warn("⚠️ Telegram bot not initialized, simulating message send");
			console.log(`📱 Telegram Message Simulation - To: @${telegramUsername}`);
			console.log(`📱 Message: Password reset code: ${code}`);
			console.log(`📱 Note: In production, this would send a real Telegram message`);
			return true;
		}

		// Create inline keyboard with password reset button
		const keyboard = {
			inline_keyboard: [
				[
					{
						text: "🔐 Reset Password",
						callback_data: `reset_password_${username}_${userType}_${code}`,
					},
				],
				[
					{
						text: "❌ Cancel",
						callback_data: `cancel_reset_${username}`,
					},
				],
			],
		};

		const message = `🔐 *Password Reset Request*

Hello! You have requested a password reset for your account.

*Username:* ${username}
*User Type:* ${userType}
*Verification Code:* \`${code}\`

This code will expire in 10 minutes.

Click the button below to reset your password, or use the code manually.`;

		// Send message to user
		await telegramBot.sendMessage(telegramUsername, message, {
			parse_mode: "Markdown",
			reply_markup: keyboard,
		});

		console.log(`✅ Telegram password reset message sent to @${telegramUsername}`);
		return true;
	} catch (error) {
		console.error("❌ Failed to send Telegram message:", error.message);
		return false;
	}
};

/**
 * Handle Telegram callback queries for password reset
 * This function should be called by the Telegram bot webhook
 * @param {Object} callbackQuery - Telegram callback query object
 * @returns {Promise<Object>} - Response object
 */
export const handleTelegramCallback = async (callbackQuery) => {
	try {
		const { data, from, message } = callbackQuery;
		const telegramUsername = from.username;

		if (data.startsWith("reset_password_")) {
			// Extract data from callback
			const parts = data.split("_");
			const username = parts[2];
			const userType = parts[3];
			const code = parts[4];

			// Verify the code
			const verificationRecord = await verifyAndConsumeCode(username, userType, code);

			if (!verificationRecord) {
				await bot.answerCallbackQuery(callbackQuery.id, {
					text: "❌ Invalid or expired verification code",
					show_alert: true,
				});
				return { success: false, message: "Invalid verification code" };
			}

			// Generate new password
			const newPassword = generateNewPassword();
			
			// Update user password
			const { hashPassword } = await import("../utils/auth/password.js");
			const hashedPassword = await hashPassword(newPassword);

			let updatedUser = null;
			if (userType === "root") {
				updatedUser = await prisma.root.update({
					where: { username },
					data: { password: hashedPassword },
				});
			} else if (userType === "admin") {
				updatedUser = await prisma.admin.update({
					where: { username },
					data: { password: hashedPassword },
				});
			} else if (userType === "teacher") {
				updatedUser = await prisma.teacher.update({
					where: { username },
					data: { password: hashedPassword },
				});
			}

			if (updatedUser) {
				// Send new password to user
				const successMessage = `✅ *Password Reset Successful*

Your password has been reset successfully.

*New Password:* \`${newPassword}\`

Please log in with your new password and change it immediately for security reasons.

*Username:* ${username}
*User Type:* ${userType}`;

				await bot.sendMessage(telegramUsername, successMessage, {
					parse_mode: "Markdown",
				});

				await bot.answerCallbackQuery(callbackQuery.id, {
					text: "✅ Password reset successfully! Check your messages.",
					show_alert: true,
				});

				return { success: true, message: "Password reset successfully" };
			} else {
				throw new Error("Failed to update password");
			}
		} else if (data.startsWith("cancel_reset_")) {
			await bot.answerCallbackQuery(callbackQuery.id, {
				text: "❌ Password reset cancelled",
				show_alert: true,
			});
			return { success: false, message: "Password reset cancelled" };
		}

		return { success: false, message: "Unknown callback data" };
	} catch (error) {
		console.error("❌ Telegram callback handling error:", error);
		await bot.answerCallbackQuery(callbackQuery.id, {
			text: "❌ An error occurred. Please try again.",
			show_alert: true,
		});
		return { success: false, message: "Error processing callback" };
	}
};

/**
 * Generate a new secure password
 * @returns {string} - New password
 */
const generateNewPassword = () => {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let password = "";
	
	// Ensure at least one uppercase, one lowercase, and one number
	password += chars[Math.floor(Math.random() * 26)]; // Uppercase
	password += chars[Math.floor(Math.random() * 26) + 26]; // Lowercase
	password += chars[Math.floor(Math.random() * 10) + 52]; // Number
	
	// Fill the rest randomly
	for (let i = 3; i < 12; i++) {
		password += chars[Math.floor(Math.random() * chars.length)];
	}
	
	// Shuffle the password
	return password.split("").sort(() => Math.random() - 0.5).join("");
};

/**
 * Clean up expired verification codes
 * This should be called periodically to clean up old codes
 */
export const cleanupExpiredCodes = async () => {
	try {
		const result = await prisma.telegramVerificationCode.deleteMany({
			where: {
				OR: [
					{ expiresAt: { lt: new Date() } }, // Expired codes
					{ isUsed: true }, // Used codes
				],
			},
		});

		console.log(`Cleaned up ${result.count} expired/used Telegram verification codes`);
		return result.count;
	} catch (error) {
		console.error("Error cleaning up codes:", error);
		throw new Error("Failed to cleanup expired codes");
	}
};
