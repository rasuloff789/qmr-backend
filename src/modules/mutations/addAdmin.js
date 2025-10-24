import prisma from "../../config/db.js";
import { hashPassword, isPasswordSecure } from "../../utils/hashpswrd.js";
import {
	checkUzPhoneInt,
	checkTelegramUsername,
	checkUsername,
	checkTurkeyPhoneInt,
	isValidBirthdate,
} from "../../utils/regex.js";

/**
 * Add a new admin user
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.username - Username
 * @param {string} args.fullname - Full name
 * @param {string} args.birthDate - Birth date
 * @param {string} args.phone - Phone number
 * @param {string} args.tgUsername - Telegram username
 * @param {string} args.password - Password
 * @param {Object} context - GraphQL context
 * @returns {Object} - Created admin user
 */
const addAdmin = async (
	_parent,
	{ username, fullname, birthDate, phone, tgUsername, password }
) => {
	try {
		// Input validation
		const usernameValidation = checkUsername(username);
		if (!usernameValidation.valid) {
			throw new Error(usernameValidation.reason);
		}

		if (!isPasswordSecure(password)) {
			throw new Error(
				"Password must be at least 8 characters with uppercase, lowercase, and number."
			);
		}

		const uzPhoneValidation = checkUzPhoneInt(phone);
		const trPhoneValidation = checkTurkeyPhoneInt(phone);
		if (!uzPhoneValidation.valid && !trPhoneValidation.valid) {
			throw new Error(
				"Invalid phone number format. Supported: Uzbekistan (998XXXXXXXXX) or Turkey (90XXXXXXXXXX)"
			);
		}

		const tgValidation = checkTelegramUsername(tgUsername);
		if (!tgValidation.valid) {
			throw new Error(tgValidation.reason);
		}

		if (!isValidBirthdate(birthDate)) {
			throw new Error("Invalid birth date format. Expected: YYYY-MM-DD");
		}

		// Check if username already exists
		const existingAdmin = await prisma.admin.findUnique({
			where: { username },
		});

		if (existingAdmin) {
			throw new Error("Username already exists");
		}

		// Normalize phone number
		const normalizedPhone = uzPhoneValidation.valid
			? uzPhoneValidation.normalized
			: trPhoneValidation.normalized;
		const normalizedTgUsername = tgValidation.normalized;

		// Create a new admin in the database
		const newAdmin = await prisma.admin.create({
			data: {
				username,
				fullname,
				birthDate: new Date(birthDate).toISOString(),
				phone: normalizedPhone,
				tgUsername: normalizedTgUsername,
				password: await hashPassword(password),
			},
			select: {
				id: true,
				username: true,
				fullname: true,
				birthDate: true,
				phone: true,
				tgUsername: true,
				isActive: true,
				createdAt: true,
			},
		});

		return newAdmin;
	} catch (error) {
		console.error("Add admin error:", error);
		throw new Error(error.message || "Failed to create admin user");
	}
};

export { addAdmin };
