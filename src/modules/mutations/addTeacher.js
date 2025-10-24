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
 * Add a new teacher user
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.username - Username
 * @param {string} args.fullname - Full name
 * @param {string} args.birthDate - Birth date
 * @param {string} args.phone - Phone number
 * @param {string} args.tgUsername - Telegram username
 * @param {string} args.department - Department
 * @param {string} args.password - Password
 * @param {Object} context - GraphQL context
 * @returns {Object} - Created teacher user
 */
const addTeacher = async (
	_parent,
	{ username, fullname, birthDate, phone, tgUsername, department, password }
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
		const existingTeacher = await prisma.teacher.findUnique({
			where: { username },
		});

		if (existingTeacher) {
			throw new Error("Username already exists");
		}

		// Normalize phone number
		const normalizedPhone = uzPhoneValidation.valid
			? uzPhoneValidation.normalized
			: trPhoneValidation.normalized;
		const normalizedTgUsername = tgValidation.normalized;

		// Create a new teacher in the database
		const newTeacher = await prisma.teacher.create({
			data: {
				username,
				fullname,
				birthDate: new Date(birthDate).toISOString(),
				phone: normalizedPhone,
				tgUsername: normalizedTgUsername,
				department,
				password: await hashPassword(password),
			},
			select: {
				id: true,
				username: true,
				fullname: true,
				birthDate: true,
				phone: true,
				tgUsername: true,
				department: true,
				isActive: true,
				createdAt: true,
			},
		});

		return newTeacher;
	} catch (error) {
		console.error("Add teacher error:", error);
		throw new Error(error.message || "Failed to create teacher user");
	}
};

export { addTeacher };
