/**
 * Telegram Bot Utility
 * Handles Telegram bot integration for password reset functionality
 * Users interact directly with the bot - no GraphQL API needed
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
			
			bot = new TelegramBot(token, { polling: true });
			console.log("✅ Telegram bot initialized successfully");
			
			// Set up bot commands
			setupBotCommands();
		} catch (error) {
			console.error("❌ Telegram bot initialization error:", error);
			return null;
		}
	}
	return bot;
};

/**
 * Set up bot commands and message handlers
 */
const setupBotCommands = () => {
	if (!bot) return;

	// Handle /start command
	bot.onText(/\/start/, (msg) => {
		const chatId = msg.chat.id;
		const welcomeMessage = `🤖 *Welcome to QMR Password Reset Bot*

I can help you reset your password if you've forgotten it.

*Available Commands:*
/start - Show this welcome message
/reset - Reset your password
/help - Show help information

*How to reset your password:*
1. Use /reset command
2. Enter your username
3. Enter your user type (admin or teacher)
4. Confirm your identity
5. Get your new password

*Note:* Only admin and teacher users can reset passwords through this bot.`;

		bot.sendMessage(chatId, welcomeMessage, { parse_mode: "Markdown" });
	});

	// Handle /help command
	bot.onText(/\/help/, (msg) => {
		const chatId = msg.chat.id;
		const helpMessage = `🆘 *Help - QMR Password Reset Bot*

*Commands:*
/start - Welcome message
/reset - Reset your password
/help - This help message

*Password Reset Process:*
1. Send /reset command
2. Enter your username when prompted
3. Enter your user type (admin or teacher)
4. Confirm your identity
5. Receive your new password

*Requirements:*
- You must be an admin or teacher user
- Your Telegram username must match your system username
- You must have an active account

*Security:*
- New passwords are auto-generated and secure
- Change your password immediately after login
- Only you can reset your own password`;

		bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
	});

	// Handle /reset command
	bot.onText(/\/reset/, (msg) => {
		const chatId = msg.chat.id;
		const telegramUsername = msg.from.username;

		if (!telegramUsername) {
			bot.sendMessage(chatId, "❌ *Error:* You need to have a Telegram username to use this bot.\n\nPlease set a username in your Telegram settings and try again.", { parse_mode: "Markdown" });
			return;
		}

		// Start password reset process
		bot.sendMessage(chatId, `🔐 *Password Reset Process*

Please enter your username to continue with password reset.

*Your Telegram username:* @${telegramUsername}

Send your username now:`, { parse_mode: "Markdown" });

		// Store the user's state
		bot.userStates = bot.userStates || {};
		bot.userStates[chatId] = {
			step: 'waiting_for_username',
			telegramUsername: telegramUsername
		};
	});

	// Handle text messages (for password reset process)
	bot.on('message', async (msg) => {
		const chatId = msg.chat.id;
		const text = msg.text;
		const userState = bot.userStates?.[chatId];

		if (!userState) return;

		if (userState.step === 'waiting_for_username') {
			await handleUsernameInput(chatId, text, userState);
		} else if (userState.step === 'waiting_for_user_type') {
			await handleUserTypeInput(chatId, text, userState);
		} else if (userState.step === 'waiting_for_confirmation') {
			await handleConfirmationInput(chatId, text, userState);
		}
	});
};

/**
 * Handle username input
 */
const handleUsernameInput = async (chatId, username, userState) => {
	if (!username || username.length < 3) {
		bot.sendMessage(chatId, "❌ *Invalid username.* Please enter a valid username (at least 3 characters).", { parse_mode: "Markdown" });
		return;
	}

	userState.username = username;
	userState.step = 'waiting_for_user_type';

	bot.sendMessage(chatId, `✅ *Username received:* ${username}

Now please enter your user type:
- Type \`admin\` if you are an admin user
- Type \`teacher\` if you are a teacher user

*Note:* Root users cannot reset passwords through this bot.`, { parse_mode: "Markdown" });
};

/**
 * Handle user type input
 */
const handleUserTypeInput = async (chatId, userType, userState) => {
	const validTypes = ['admin', 'teacher'];
	
	if (!validTypes.includes(userType.toLowerCase())) {
		bot.sendMessage(chatId, "❌ *Invalid user type.* Please enter either \`admin\` or \`teacher\`.", { parse_mode: "Markdown" });
		return;
	}

	userState.userType = userType.toLowerCase();
	userState.step = 'waiting_for_confirmation';

	// Find user in database
	try {
		let user = null;
		if (userState.userType === 'admin') {
			user = await prisma.admin.findUnique({
				where: { username: userState.username },
				select: {
					id: true,
					username: true,
					fullname: true,
					tgUsername: true,
					isActive: true,
				},
			});
		} else if (userState.userType === 'teacher') {
			user = await prisma.teacher.findUnique({
				where: { username: userState.username },
				select: {
					id: true,
					username: true,
					fullname: true,
					tgUsername: true,
					isActive: true,
				},
			});
		}

		if (!user) {
			bot.sendMessage(chatId, `❌ *User not found.*\n\nNo ${userState.userType} user found with username: ${userState.username}\n\nPlease check your username and try again.`, { parse_mode: "Markdown" });
			delete bot.userStates[chatId];
			return;
		}

		if (!user.isActive) {
			bot.sendMessage(chatId, `❌ *Account deactivated.*\n\nYour account is currently deactivated. Please contact an administrator.`, { parse_mode: "Markdown" });
			delete bot.userStates[chatId];
			return;
		}

		if (user.tgUsername !== userState.telegramUsername) {
			bot.sendMessage(chatId, `❌ *Telegram username mismatch.*\n\nYour Telegram username (@${userState.telegramUsername}) does not match your system username (${user.tgUsername}).\n\nPlease contact an administrator to update your Telegram username.`, { parse_mode: "Markdown" });
			delete bot.userStates[chatId];
			return;
		}

		userState.user = user;

		// Show confirmation
		const keyboard = {
			inline_keyboard: [
				[
					{ text: "✅ Yes, Reset Password", callback_data: `confirm_reset_${chatId}` },
					{ text: "❌ Cancel", callback_data: `cancel_reset_${chatId}` }
				]
			]
		};

		bot.sendMessage(chatId, `🔐 *Confirm Password Reset*

*User Details:*
• Username: ${user.username}
• Full Name: ${user.fullname}
• User Type: ${userState.userType}
• Telegram: @${user.tgUsername}

*Warning:* This will generate a new password and invalidate your current password.

Do you want to proceed with password reset?`, { 
			parse_mode: "Markdown",
			reply_markup: keyboard 
		});

	} catch (error) {
		console.error("Error finding user:", error);
		bot.sendMessage(chatId, "❌ *Error occurred.* Please try again later.", { parse_mode: "Markdown" });
		delete bot.userStates[chatId];
	}
};

/**
 * Handle confirmation input
 */
const handleConfirmationInput = async (chatId, text, userState) => {
	// This is handled by callback queries, not text messages
	// Just clear the state if user sends text
	delete bot.userStates[chatId];
	bot.sendMessage(chatId, "❌ *Process cancelled.* Use /reset to start again.", { parse_mode: "Markdown" });
};

/**
 * Handle callback queries (button clicks)
 */
bot.on('callback_query', async (callbackQuery) => {
	const chatId = callbackQuery.message.chat.id;
	const data = callbackQuery.data;

	if (data.startsWith('confirm_reset_')) {
		await handlePasswordReset(chatId, callbackQuery);
	} else if (data.startsWith('cancel_reset_')) {
		await bot.answerCallbackQuery(callbackQuery.id, { text: "❌ Password reset cancelled" });
		bot.sendMessage(chatId, "❌ *Password reset cancelled.* Use /reset to start again.", { parse_mode: "Markdown" });
		delete bot.userStates[chatId];
	}
});

/**
 * Handle password reset
 */
const handlePasswordReset = async (chatId, callbackQuery) => {
	try {
		const userState = bot.userStates?.[chatId];
		
		if (!userState || !userState.user) {
			await bot.answerCallbackQuery(callbackQuery.id, { text: "❌ Session expired. Please start again." });
			return;
		}

		// Generate new password
		const newPassword = generateNewPassword();
		
		// Hash new password
		const { hashPassword } = await import("../utils/auth/password.js");
		const hashedPassword = await hashPassword(newPassword);

		// Update user password
		let updatedUser = null;
		if (userState.userType === 'admin') {
			updatedUser = await prisma.admin.update({
				where: { id: userState.user.id },
				data: { password: hashedPassword },
			});
		} else if (userState.userType === 'teacher') {
			updatedUser = await prisma.teacher.update({
				where: { id: userState.user.id },
				data: { password: hashedPassword },
			});
		}

		if (updatedUser) {
			// Send success message with new password
			const successMessage = `✅ *Password Reset Successful*

Your password has been reset successfully!

*New Password:* \`${newPassword}\`

*Important Security Notes:*
• Log in immediately with your new password
• Change your password after logging in
• Do not share this password with anyone
• This password is only shown once

*User Details:*
• Username: ${userState.user.username}
• Full Name: ${userState.user.fullname}
• User Type: ${userState.userType}

Use /start to see available commands.`;

			await bot.sendMessage(chatId, successMessage, { parse_mode: "Markdown" });
			await bot.answerCallbackQuery(callbackQuery.id, { text: "✅ Password reset successfully!" });
		} else {
			throw new Error("Failed to update password");
		}

	} catch (error) {
		console.error("Password reset error:", error);
		await bot.sendMessage(chatId, "❌ *Error occurred during password reset.* Please try again later.", { parse_mode: "Markdown" });
		await bot.answerCallbackQuery(callbackQuery.id, { text: "❌ Error occurred" });
	} finally {
		// Clean up user state
		delete bot.userStates[chatId];
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
 * Initialize the Telegram bot
 */
export const initializeBot = () => {
	return initializeTelegramBot();
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