import { prisma } from "../../../database/index.js";
import {
	hashPassword,
	isPasswordSecure,
} from "../../../utils/auth/password.js";
import {
	checkUsername,
	checkInternationalPhone,
	checkTelegramUsername,
	isValidBirthdate,
} from "../../../utils/regex.js";
import { processUploadedFile } from "../../../utils/fileUpload.js";

/**
 * Add a new student user with validation and optional profile picture upload
 */
const addStudent = async (
	_parent,
	{
		username,
		password,
		fullname,
		tgUsername,
		birthDate,
		phone,
		gender,
		profilePicture,
	}
) => {
	try {
		// Validate username
		const usernameValidation = checkUsername(username);
		if (!usernameValidation.valid) {
			return {
				success: false,
				message: "Validation failed",
				student: null,
				errors: [usernameValidation.reason],
				timestamp: new Date().toISOString(),
			};
		}

		// Validate password strength
		if (!isPasswordSecure(password)) {
			return {
				success: false,
				message: "Validation failed",
				student: null,
				errors: [
					"Password must be at least 8 characters with uppercase, lowercase, and number.",
				],
				timestamp: new Date().toISOString(),
			};
		}

		// Validate phone if provided (optional field)
		let normalizedPhone = null;
		if (phone) {
			const phoneValidation = checkInternationalPhone(phone);
			if (!phoneValidation.valid) {
				return {
					success: false,
					message: "Validation failed",
					student: null,
					errors: [phoneValidation.reason],
					timestamp: new Date().toISOString(),
				};
			}
			normalizedPhone = phoneValidation.normalized;
		}

		// Validate telegram username
		const tg = checkTelegramUsername(tgUsername);
		if (!tg.valid) {
			return {
				success: false,
				message: "Validation failed",
				student: null,
				errors: [tg.reason],
				timestamp: new Date().toISOString(),
			};
		}

		// Validate birth date
		if (!isValidBirthdate(birthDate)) {
			return {
				success: false,
				message: "Validation failed",
				student: null,
				errors: ["Invalid birth date format. Expected: YYYY-MM-DD"],
				timestamp: new Date().toISOString(),
			};
		}

		// Ensure unique username
		const existing = await prisma.student.findUnique({ where: { username } });
		if (existing) {
			return {
				success: false,
				message: "Username already exists",
				student: null,
				errors: [`Username '${username}' is already in use`],
				timestamp: new Date().toISOString(),
			};
		}

		// Optional profile picture
		let profilePictureUrl = null;
		if (profilePicture) {
			const file = await profilePicture; // Await Upload
			const uploaded = await processUploadedFile(file);
			if (!uploaded.success) {
				return {
					success: false,
					message: "File upload failed",
					student: null,
					errors: [uploaded.error],
					timestamp: new Date().toISOString(),
				};
			}
			profilePictureUrl = uploaded.url;
		}

		// Normalize inputs
		const normalizedTg = tg.normalized;

		// Persist
		const newStudent = await prisma.student.create({
			data: {
				username,
				fullname,
				birthDate: new Date(birthDate).toISOString(),
				phone: normalizedPhone,
				tgUsername: normalizedTg,
				gender,
				profilePicture: profilePictureUrl,
				password: await hashPassword(password),
			},
			select: {
				id: true,
				username: true,
				fullname: true,
				birthDate: true,
				phone: true,
				tgUsername: true,
				gender: true,
				profilePicture: true,
				isActive: true,
				isDeleted: true,
				createdAt: true,
			},
		});

		return {
			success: true,
			message: "Student user created successfully",
			student: newStudent,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("❌ addStudent error:", error.message);
		return {
			success: false,
			message: "Failed to create student user",
			student: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { addStudent };
