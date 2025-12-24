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
 * Add a new teacher user with validation and optional profile picture upload
 */
const addTeacher = async (
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
		degreeIds,
	}
) => {
	try {
		// Validate username
		const usernameValidation = checkUsername(username);
		if (!usernameValidation.valid) {
			return {
				success: false,
				code: "TEACHER_USERNAME_INVALID",
				message: "Validation failed",
				teacher: null,
				errors: [usernameValidation.reason],
				timestamp: new Date().toISOString(),
			};
		}

		// Validate password strength
		if (!isPasswordSecure(password)) {
			return {
				success: false,
				code: "TEACHER_PASSWORD_WEAK",
				message: "Validation failed",
				teacher: null,
				errors: [
					"Password must be at least 8 characters with uppercase, lowercase, and number.",
				],
				timestamp: new Date().toISOString(),
			};
		}

		// Validate phone (international format)
		const phoneValidation = checkInternationalPhone(phone);
		if (!phoneValidation.valid) {
			return {
				success: false,
				code: "TEACHER_PHONE_INVALID",
				message: "Validation failed",
				teacher: null,
				errors: [phoneValidation.reason],
				timestamp: new Date().toISOString(),
			};
		}

		// Validate telegram username if provided (optional)
		// Treat empty string as null (don't validate, just skip)
		let normalizedTg = null;
		if (tgUsername && tgUsername.trim() !== "") {
			const tg = checkTelegramUsername(tgUsername);
			if (!tg.valid) {
				return {
					success: false,
					code: "TEACHER_TG_USERNAME_INVALID",
					message: "Validation failed",
					teacher: null,
					errors: [tg.reason],
					timestamp: new Date().toISOString(),
				};
			}
			normalizedTg = tg.normalized;
		}

		// Validate birth date
		if (!isValidBirthdate(birthDate)) {
			return {
				success: false,
				code: "TEACHER_BIRTHDATE_INVALID",
				message: "Validation failed",
				teacher: null,
				errors: ["Invalid birth date format. Expected: YYYY-MM-DD"],
				timestamp: new Date().toISOString(),
			};
		}

		// Validate teacher must have at least one degree
		if (!Array.isArray(degreeIds) || degreeIds.length === 0) {
			return {
				success: false,
				code: "TEACHER_DEGREES_REQUIRED",
				message: "Validation failed",
				teacher: null,
				errors: ["Teacher must have at least one degree"],
				timestamp: new Date().toISOString(),
			};
		}

		// Ensure unique username
		const existing = await prisma.teacher.findUnique({ where: { username } });
		if (existing) {
			return {
				success: false,
				code: "TEACHER_USERNAME_TAKEN",
				message: "Username already exists",
				teacher: null,
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
					code: "TEACHER_PROFILE_PICTURE_UPLOAD_FAILED",
					message: "File upload failed",
					teacher: null,
					errors: [uploaded.error],
					timestamp: new Date().toISOString(),
				};
			}
			profilePictureUrl = uploaded.url;
		}

		// Normalize inputs
		const normalizedPhone = phoneValidation.normalized;
		const degreesConnection =
			{ connect: degreeIds.map((id) => ({ id: parseInt(id) })) };

		// Persist
		const newTeacher = await prisma.teacher.create({
			data: {
				username,
				fullname,
				birthDate: new Date(birthDate).toISOString(),
				phone: normalizedPhone,
				tgUsername: normalizedTg,
				gender,
				profilePicture: profilePictureUrl,
				degrees: degreesConnection,
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
				degrees: { select: { id: true, name: true, createdAt: true } },
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
		console.error("❌ addTeacher error:", error.message);
		return {
			success: false,
			code: "TEACHER_CREATE_FAILED",
			message: "Failed to create teacher user",
			teacher: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { addTeacher };
