import { prisma } from "../../../database/index.js";
import {
	hashPassword,
	isPasswordSecure,
} from "../../../utils/auth/password.js";
import {
	checkUzPhoneInt,
	checkTelegramUsername,
	checkUsername,
	checkTurkeyPhoneInt,
	isValidBirthdate,
} from "../../../utils/regex.js";
import {
	createErrorResponse,
	createSuccessResponse,
	createValidationError,
	createConflictError,
	createServerError,
	ERROR_MESSAGES,
} from "../../../utils/errors.js";

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
 * @returns {Object} - AddTeacherResponse with success status and teacher data
 */
const addTeacher = async (
	_parent,
	{ username, fullname, birthDate, phone, tgUsername, department, password }
) => {
	try {
		// Input validation
		const usernameValidation = checkUsername(username);
		if (!usernameValidation.valid) {
			return {
				success: false,
				message: "Validation failed",
				teacher: null,
				errors: [usernameValidation.reason],
				timestamp: new Date().toISOString(),
			};
		}

		if (!isPasswordSecure(password)) {
			return {
				success: false,
				message: "Validation failed",
				teacher: null,
				errors: [
					"Password must be at least 8 characters with uppercase, lowercase, and number.",
				],
				timestamp: new Date().toISOString(),
			};
		}

		const uzPhoneValidation = checkUzPhoneInt(phone);
		const trPhoneValidation = checkTurkeyPhoneInt(phone);
		if (!uzPhoneValidation.valid && !trPhoneValidation.valid) {
			return {
				success: false,
				message: "Validation failed",
				teacher: null,
				errors: [
					"Invalid phone number format. Supported: Uzbekistan (998XXXXXXXXX) or Turkey (90XXXXXXXXXX)",
				],
				timestamp: new Date().toISOString(),
			};
		}

		const tgValidation = checkTelegramUsername(tgUsername);
		if (!tgValidation.valid) {
			return {
				success: false,
				message: "Validation failed",
				teacher: null,
				errors: [tgValidation.reason],
				timestamp: new Date().toISOString(),
			};
		}

		if (!isValidBirthdate(birthDate)) {
			return {
				success: false,
				message: "Validation failed",
				teacher: null,
				errors: ["Invalid birth date format. Expected: YYYY-MM-DD"],
				timestamp: new Date().toISOString(),
			};
		}

		// Check if username already exists
		const existingTeacher = await prisma.teacher.findUnique({
			where: { username },
		});

		if (existingTeacher) {
			return {
				success: false,
				message: "Username already exists",
				teacher: null,
				errors: [`Username '${username}' is already in use`],
				timestamp: new Date().toISOString(),
			};
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

		return {
			success: true,
			message: "Teacher user created successfully",
			teacher: newTeacher,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Add teacher error:", error);
		return {
			success: false,
			message: "Failed to create teacher user",
			teacher: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { addTeacher };
