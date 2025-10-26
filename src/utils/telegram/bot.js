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
				console.warn(
					"⚠️ TELEGRAM_BOT_TOKEN not found in environment variables"
				);
				console.warn("⚠️ Telegram bot will not be available");
				return null;
			}

			// Stop any existing bot instance first
			if (bot && bot.stopPolling) {
				bot.stopPolling();
			}

			bot = new TelegramBot(token, {
				polling: {
					interval: 300,
					autoStart: false,
					params: {
						timeout: 10,
						// Add unique identifier to prevent conflicts
						allowed_updates: ["message", "callback_query"],
					},
				},
			});

			// Set up bot commands only if bot is successfully created
			if (bot) {
				setupBotCommands();

				// Add error handling for polling
				bot.on("polling_error", (error) => {
					console.error("❌ Telegram polling error:", error.message);
					if (error.code === "ETELEGRAM" && error.message.includes("409")) {
						console.error(
							"❌ Bot conflict detected. Another instance may be running."
						);
						console.error("❌ Stopping polling to prevent conflicts...");
						bot.stopPolling();
					}
				});

				// Start polling after setup
				bot.startPolling();
				console.log("✅ Telegram bot initialized and polling started");
			}
		} catch (error) {
			console.error("❌ Telegram bot initialization error:", error);
			console.error("❌ Telegram bot will not be available");
			bot = null;
			return null;
		}
	}
	return bot;
};

/**
 * Set up bot commands and message handlers
 */
const setupBotCommands = () => {
	if (!bot) {
		console.warn("⚠️ Bot not initialized, skipping command setup");
		return;
	}

	// Handle /start command
	bot.onText(/\/start/, (msg) => {
		const chatId = msg.chat.id;
		const welcomeMessage = `🤖 *Welcome to QMR Password Reset Bot*

I'm here to help you reset your password securely and quickly.

*Available Commands:*
• /start - Show this welcome message
• /reset - Reset your password
• /help - Get detailed help

*How to reset your password:*
1️⃣ Use /reset command
2️⃣ Share your phone number securely
3️⃣ Select your account (if you have multiple)
4️⃣ Confirm the password reset
5️⃣ Receive your new secure password

*Security Features:*
🔒 Phone number verification
🔒 Secure password generation
🔒 Account type selection
🔒 Real-time confirmation

*Note:* Only admin and teacher accounts can reset passwords through this bot.`;

		bot.sendMessage(chatId, welcomeMessage, { parse_mode: "Markdown" });
	});

	// Handle /help command
	bot.onText(/\/help/, (msg) => {
		const chatId = msg.chat.id;
		const helpMessage = `🆘 *Help - QMR Password Reset Bot*

*Available Commands:*
• /start - Welcome message and overview
• /reset - Start password reset process
• /help - This detailed help message

*Password Reset Process:*
1️⃣ Send /reset command
2️⃣ Share your phone number securely when prompted
3️⃣ Select your account (if multiple accounts found)
4️⃣ Confirm password reset with your details
5️⃣ Receive your new secure password

*Requirements:*
✅ You must be an admin or teacher user
✅ Your phone number must be registered in the system
✅ You must have an active account
✅ You need a Telegram username

*Security Features:*
🔒 Phone number verification for identity
🔒 Secure auto-generated passwords
🔒 Account type selection (admin/teacher)
🔒 Real-time confirmation process
🔒 One-time password display

*Important Notes:*
⚠️ Change your password immediately after login
⚠️ Do not share your new password with anyone
⚠️ Contact administrator if your phone number is not recognized
⚠️ This bot only works for admin and teacher accounts`;

		bot.sendMessage(chatId, helpMessage, { parse_mode: "Markdown" });
	});

	// Handle /reset command
	bot.onText(/\/reset/, async (msg) => {
		const chatId = msg.chat.id;
		const telegramUsername = msg.from.username;

		if (!telegramUsername) {
			bot.sendMessage(
				chatId,
				"❌ *Setup Required*\n\nYou need to set a Telegram username to use this bot.\n\n*How to set a username:*\n1️⃣ Open Telegram Settings\n2️⃣ Go to Username\n3️⃣ Set a unique username\n4️⃣ Come back and try /reset again\n\n*Note:* Your username helps us identify you securely.",
				{ parse_mode: "Markdown" }
			);
			return;
		}

		try {
			// Request phone number from user
			const keyboard = {
				keyboard: [
					[
						{
							text: "📱 Share My Phone Number",
							request_contact: true,
						},
					],
				],
				one_time_keyboard: true,
				resize_keyboard: true,
			};

			bot.sendMessage(
				chatId,
				`🔐 *Password Reset Process*

To reset your password securely, I need to verify your identity using your phone number.

*Your Telegram username:* @${telegramUsername}

*Next Step:* Please share your phone number by clicking the button below.

*Security Note:* Your phone number is only used for verification and is not stored by the bot.`,
				{
					parse_mode: "Markdown",
					reply_markup: keyboard,
				}
			);
		} catch (error) {
			console.error("Error starting password reset:", error);
			bot.sendMessage(
				chatId,
				"❌ *Service Temporarily Unavailable*\n\nWe're experiencing technical difficulties. Please try again in a few moments.\n\nIf the problem persists, contact your system administrator.",
				{ parse_mode: "Markdown" }
			);
		}
	});

	// Handle text messages (for other commands)
	bot.on("message", async (msg) => {
		const chatId = msg.chat.id;
		const text = msg.text;

		// Handle contact (phone number) messages
		if (msg.contact) {
			// Remove the keyboard after phone number is shared
			await bot.sendMessage(
				chatId,
				"📱 *Phone number received!* Processing...",
				{
					parse_mode: "Markdown",
					reply_markup: { remove_keyboard: true },
				}
			);

			// Small delay to show processing message
			setTimeout(async () => {
				await handlePhoneNumberContact(chatId, msg.contact);
			}, 1000);
			return;
		}

		// Only handle non-command messages
		if (!text.startsWith("/")) {
			bot.sendMessage(
				chatId,
				"❓ *Unknown Command*\n\nI don't understand that message. Here are the available commands:\n\n• /start - Welcome message\n• /reset - Reset your password\n• /help - Get help\n\nType any of these commands to get started!",
				{ parse_mode: "Markdown" }
			);
		}
	});

	// Handle callback queries (button clicks)
	bot.on("callback_query", async (callbackQuery) => {
		const chatId = callbackQuery.message.chat.id;
		const messageId = callbackQuery.message.message_id;
		const data = callbackQuery.data;

		// Delete the message that contained the button
		try {
			await bot.deleteMessage(chatId, messageId);
		} catch (error) {
			console.log("Could not delete message:", error.message);
		}

		if (data.startsWith("select_user_")) {
			await handleUserSelection(chatId, callbackQuery);
		} else if (data.startsWith("confirm_reset_")) {
			await handlePasswordReset(chatId, callbackQuery);
		} else if (data.startsWith("cancel_reset_")) {
			await bot.answerCallbackQuery(callbackQuery.id, {
				text: "❌ Password reset cancelled",
			});
			bot.sendMessage(
				chatId,
				"❌ *Password Reset Cancelled*\n\nYou have cancelled the password reset process.\n\n*To reset your password:*\n• Use /reset command to start again\n• Use /help for detailed instructions\n\n*Need assistance?* Contact your system administrator.",
				{ parse_mode: "Markdown" }
			);
		}
	});
};

/**
 * Handle phone number contact from user
 * @param {number} chatId - Chat ID
 * @param {Object} contact - Contact object with phone number
 */
const handlePhoneNumberContact = async (chatId, contact) => {
	try {
		const phoneNumber = contact.phone_number;
		console.log(`📱 Received phone number: ${phoneNumber}`);

		// Find users with matching phone number
		const matchingUsers = await findUsersByPhoneNumber(phoneNumber);

		if (matchingUsers.length === 0) {
			bot.sendMessage(
				chatId,
				`❌ *Account Not Found*\n\nNo accounts found with phone number: \`${phoneNumber}\`\n\n*Possible reasons:*\n• Your phone number is not registered in the system\n• Your account might be deactivated\n• There might be a formatting difference\n\n*What to do:*\n1️⃣ Contact your system administrator\n2️⃣ Verify your phone number is correctly registered\n3️⃣ Make sure your account is active\n\n*Need help?* Use /help for more information.`,
				{ parse_mode: "Markdown" }
			);
			return;
		}

		if (matchingUsers.length === 1) {
			// Single user found - proceed directly to confirmation
			const user = matchingUsers[0];
			await showPasswordResetConfirmation(chatId, user, phoneNumber);
		} else {
			// Multiple users found - show selection menu
			await showUserSelectionMenu(chatId, matchingUsers, phoneNumber);
		}
	} catch (error) {
		console.error("Error handling phone number contact:", error);
		bot.sendMessage(
			chatId,
			"❌ *Processing Error*\n\nWe encountered an issue while processing your phone number. This might be a temporary problem.\n\n*Please try:*\n1️⃣ Wait a moment and try /reset again\n2️⃣ Make sure you're sharing your phone number correctly\n3️⃣ Contact your administrator if the problem continues\n\n*Need help?* Use /help for more information.",
			{ parse_mode: "Markdown" }
		);
	}
};

/**
 * Find users by phone number
 * @param {string} phoneNumber - Phone number to search for
 * @returns {Promise<Array>} - Array of matching users
 */
const findUsersByPhoneNumber = async (phoneNumber) => {
	const matchingUsers = [];

	try {
		// Search in admin users
		const admins = await prisma.admin.findMany({
			where: {
				phone: phoneNumber,
				isActive: true,
			},
			select: {
				id: true,
				username: true,
				fullname: true,
				phone: true,
				tgUsername: true,
				isActive: true,
			},
		});

		// Add user type to each admin
		admins.forEach((admin) => {
			matchingUsers.push({
				...admin,
				userType: "admin",
			});
		});

		// Search in teacher users
		const teachers = await prisma.teacher.findMany({
			where: {
				phone: phoneNumber,
				isActive: true,
			},
			select: {
				id: true,
				username: true,
				fullname: true,
				phone: true,
				tgUsername: true,
				isActive: true,
			},
		});

		// Add user type to each teacher
		teachers.forEach((teacher) => {
			matchingUsers.push({
				...teacher,
				userType: "teacher",
			});
		});

		return matchingUsers;
	} catch (error) {
		console.error("Error finding users by phone number:", error);
		throw error;
	}
};

/**
 * Show user selection menu when multiple users found
 * @param {number} chatId - Chat ID
 * @param {Array} users - Array of matching users
 * @param {string} phoneNumber - Phone number
 */
const showUserSelectionMenu = async (chatId, users, phoneNumber) => {
	const keyboard = {
		inline_keyboard: users.map((user, index) => [
			{
				text: `${user.userType.toUpperCase()}: ${user.fullname} (@${
					user.username
				})`,
				callback_data: `select_user_${user.userType}_${user.id}`,
			},
		]),
	};

	const message = `🔍 *Multiple Accounts Found*

I found ${users.length} accounts linked to phone number: \`${phoneNumber}\`

*Account Types:* You can have both admin and teacher accounts with the same phone number.

*Please select which account you want to reset the password for:*`;

	bot.sendMessage(chatId, message, {
		parse_mode: "Markdown",
		reply_markup: keyboard,
	});
};

/**
 * Show password reset confirmation
 * @param {number} chatId - Chat ID
 * @param {Object} user - User object
 * @param {string} phoneNumber - Phone number
 */
const showPasswordResetConfirmation = async (chatId, user, phoneNumber) => {
	const keyboard = {
		inline_keyboard: [
			[
				{
					text: "✅ Yes, Reset Password",
					callback_data: `confirm_reset_${user.userType}_${user.id}`,
				},
				{ text: "❌ Cancel", callback_data: `cancel_reset_${chatId}` },
			],
		],
	};

	const message = `🔐 *Confirm Password Reset*

*Account Details:*
• **Username:** ${user.username}
• **Full Name:** ${user.fullname}
• **User Type:** ${user.userType.toUpperCase()}
• **Phone:** \`${phoneNumber}\`
• **Telegram:** @${user.tgUsername}

⚠️ *Important:* This will generate a new secure password and invalidate your current password.

*Do you want to proceed with password reset?*`;

	bot.sendMessage(chatId, message, {
		parse_mode: "Markdown",
		reply_markup: keyboard,
	});
};

/**
 * Handle username input
 */
const handleUsernameInput = async (chatId, username, userState) => {
	if (!username || username.length < 3) {
		bot.sendMessage(
			chatId,
			"❌ *Invalid username.* Please enter a valid username (at least 3 characters).",
			{ parse_mode: "Markdown" }
		);
		return;
	}

	userState.username = username;
	userState.step = "waiting_for_user_type";

	bot.sendMessage(
		chatId,
		`✅ *Username received:* ${username}

Now please enter your user type:
- Type \`admin\` if you are an admin user
- Type \`teacher\` if you are a teacher user

*Note:* Root users cannot reset passwords through this bot.`,
		{ parse_mode: "Markdown" }
	);
};

/**
 * Handle user type input
 */
const handleUserTypeInput = async (chatId, userType, userState) => {
	const validTypes = ["admin", "teacher"];

	if (!validTypes.includes(userType.toLowerCase())) {
		bot.sendMessage(
			chatId,
			"❌ *Invalid user type.* Please enter either `admin` or `teacher`.",
			{ parse_mode: "Markdown" }
		);
		return;
	}

	userState.userType = userType.toLowerCase();
	userState.step = "waiting_for_confirmation";

	// Find user in database
	try {
		let user = null;
		if (userState.userType === "admin") {
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
		} else if (userState.userType === "teacher") {
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
			bot.sendMessage(
				chatId,
				`❌ *User not found.*\n\nNo ${userState.userType} user found with username: ${userState.username}\n\nPlease check your username and try again.`,
				{ parse_mode: "Markdown" }
			);
			delete bot.userStates[chatId];
			return;
		}

		if (!user.isActive) {
			bot.sendMessage(
				chatId,
				`❌ *Account deactivated.*\n\nYour account is currently deactivated. Please contact an administrator.`,
				{ parse_mode: "Markdown" }
			);
			delete bot.userStates[chatId];
			return;
		}

		if (user.tgUsername !== userState.telegramUsername) {
			bot.sendMessage(
				chatId,
				`❌ *Telegram username mismatch.*\n\nYour Telegram username (@${userState.telegramUsername}) does not match your system username (${user.tgUsername}).\n\nPlease contact an administrator to update your Telegram username.`,
				{ parse_mode: "Markdown" }
			);
			delete bot.userStates[chatId];
			return;
		}

		userState.user = user;

		// Show confirmation
		const keyboard = {
			inline_keyboard: [
				[
					{
						text: "✅ Yes, Reset Password",
						callback_data: `confirm_reset_${chatId}`,
					},
					{ text: "❌ Cancel", callback_data: `cancel_reset_${chatId}` },
				],
			],
		};

		bot.sendMessage(
			chatId,
			`🔐 *Confirm Password Reset*

*User Details:*
• Username: ${user.username}
• Full Name: ${user.fullname}
• User Type: ${userState.userType}
• Telegram: @${user.tgUsername}

*Warning:* This will generate a new password and invalidate your current password.

Do you want to proceed with password reset?`,
			{
				parse_mode: "Markdown",
				reply_markup: keyboard,
			}
		);
	} catch (error) {
		console.error("Error finding user:", error);
		bot.sendMessage(chatId, "❌ *Error occurred.* Please try again later.", {
			parse_mode: "Markdown",
		});
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
	bot.sendMessage(
		chatId,
		"❌ *Process cancelled.* Use /reset to start again.",
		{ parse_mode: "Markdown" }
	);
};

/**
 * Handle user selection from multiple users
 * @param {number} chatId - Chat ID
 * @param {Object} callbackQuery - Callback query object
 */
const handleUserSelection = async (chatId, callbackQuery) => {
	try {
		const data = callbackQuery.data;
		// Extract user type and ID from callback data: select_user_admin_123
		const parts = data.split("_");
		const userType = parts[2]; // admin or teacher
		const userId = parseInt(parts[3]);

		// Find the selected user
		let user = null;
		if (userType === "admin") {
			user = await prisma.admin.findUnique({
				where: { id: userId },
				select: {
					id: true,
					username: true,
					fullname: true,
					tgUsername: true,
					isActive: true,
				},
			});
		} else if (userType === "teacher") {
			user = await prisma.teacher.findUnique({
				where: { id: userId },
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
			await bot.answerCallbackQuery(callbackQuery.id, {
				text: "❌ User not found",
			});
			return;
		}

		// Add user type to user object
		user.userType = userType;

		// Show password reset confirmation
		await showPasswordResetConfirmation(chatId, user, user.tgUsername);

		await bot.answerCallbackQuery(callbackQuery.id, {
			text: "✅ User selected",
		});
	} catch (error) {
		console.error("Error handling user selection:", error);
		await bot.answerCallbackQuery(callbackQuery.id, {
			text: "❌ Error occurred",
		});
	}
};

/**
 * Handle password reset
 */
const handlePasswordReset = async (chatId, callbackQuery) => {
	try {
		const data = callbackQuery.data;
		// Extract user type and ID from callback data: confirm_reset_admin_123
		const parts = data.split("_");
		const userType = parts[2]; // admin or teacher
		const userId = parseInt(parts[3]);

		// Find the user
		let user = null;
		if (userType === "admin") {
			user = await prisma.admin.findUnique({
				where: { id: userId },
				select: {
					id: true,
					username: true,
					fullname: true,
					phone: true,
					tgUsername: true,
					isActive: true,
				},
			});
		} else if (userType === "teacher") {
			user = await prisma.teacher.findUnique({
				where: { id: userId },
				select: {
					id: true,
					username: true,
					fullname: true,
					phone: true,
					tgUsername: true,
					isActive: true,
				},
			});
		}

		if (!user) {
			await bot.answerCallbackQuery(callbackQuery.id, {
				text: "❌ User not found",
			});
			return;
		}

		// Generate new password
		const newPassword = generateNewPassword();

		// Hash new password
		const { hashPassword } = await import("../auth/password.js");
		const hashedPassword = await hashPassword(newPassword);

		// Update user password
		let updatedUser = null;
		if (userType === "admin") {
			updatedUser = await prisma.admin.update({
				where: { id: userId },
				data: { password: hashedPassword },
			});
		} else if (userType === "teacher") {
			updatedUser = await prisma.teacher.update({
				where: { id: userId },
				data: { password: hashedPassword },
			});
		}

		if (updatedUser) {
			// Send success message with new password
			const successMessage = `🎉 *Password Reset Successful!*

Your password has been reset successfully!

🔑 *New Password:* \`${newPassword}\`

⚠️ *Critical Security Instructions:*
• **Log in immediately** with your new password
• **Change your password** after logging in
• **Do not share** this password with anyone
• **This password is only shown once** - save it now!

📋 *Account Information:*
• **Username:** ${user.username}
• **Full Name:** ${user.fullname}
• **User Type:** ${userType.toUpperCase()}
• **Phone:** \`${user.phone}\`

*Need help?* Use /help for more information.`;

			await bot.sendMessage(chatId, successMessage, { parse_mode: "Markdown" });
			await bot.answerCallbackQuery(callbackQuery.id, {
				text: "✅ Password reset successfully!",
			});
		} else {
			throw new Error("Failed to update password");
		}
	} catch (error) {
		console.error("Password reset error:", error);
		await bot.sendMessage(
			chatId,
			"❌ *Password Reset Failed*\n\nWe encountered an error while resetting your password. This might be a temporary issue.\n\n*Please try:*\n1️⃣ Wait a moment and try /reset again\n2️⃣ Make sure your account is active\n3️⃣ Contact your administrator if the problem continues\n\n*Need help?* Use /help for more information.",
			{ parse_mode: "Markdown" }
		);
		await bot.answerCallbackQuery(callbackQuery.id, {
			text: "❌ Reset failed - try again",
		});
	}
};

/**
 * Generate a new secure password
 * @returns {string} - New password
 */
const generateNewPassword = () => {
	const chars =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
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
	return password
		.split("")
		.sort(() => Math.random() - 0.5)
		.join("");
};

/**
 * Initialize the Telegram bot
 */
export const initializeBot = () => {
	return initializeTelegramBot();
};

/**
 * Stop the Telegram bot
 */
export const stopBot = () => {
	if (bot && bot.stopPolling) {
		try {
			bot.stopPolling();
			console.log("🛑 Telegram bot polling stopped");
		} catch (error) {
			console.error("❌ Error stopping Telegram bot:", error);
		}
	}
	bot = null;
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

		console.log(
			`Cleaned up ${result.count} expired/used Telegram verification codes`
		);
		return result.count;
	} catch (error) {
		console.error("Error cleaning up codes:", error);
		throw new Error("Failed to cleanup expired codes");
	}
};
