import { prisma } from "../../../database/index.js";
import {
	hashPassword,
	isPasswordSecure,
} from "../../../utils/auth/password.js";
import {
	checkUsername,
	checkUzPhoneInt,
	checkTurkeyPhoneInt,
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
				message: "Validation failed",
				teacher: null,
				errors: [
					"Password must be at least 8 characters with uppercase, lowercase, and number.",
				],
				timestamp: new Date().toISOString(),
			};
		}

		// Validate phone (UZ or TR format)
		const uzPhone = checkUzPhoneInt(phone);
		const trPhone = checkTurkeyPhoneInt(phone);
		if (!uzPhone.valid && !trPhone.valid) {
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

		// Validate telegram username
		const tg = checkTelegramUsername(tgUsername);
		if (!tg.valid) {
			return {
				success: false,
				message: "Validation failed",
				teacher: null,
				errors: [tg.reason],
				timestamp: new Date().toISOString(),
			};
		}

		// Validate birth date
		if (!isValidBirthdate(birthDate)) {
			return {
				success: false,
				message: "Validation failed",
				teacher: null,
				errors: ["Invalid birth date format. Expected: YYYY-MM-DD"],
				timestamp: new Date().toISOString(),
			};
		}

		// Ensure unique username
		const existing = await prisma.teacher.findUnique({ where: { username } });
		if (existing) {
			return {
				success: false,
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
					message: "File upload failed",
					teacher: null,
					errors: [uploaded.error],
					timestamp: new Date().toISOString(),
				};
			}
			profilePictureUrl = uploaded.url;
		}

		// Normalize inputs
		const normalizedPhone = uzPhone.valid
			? uzPhone.normalized
			: trPhone.normalized;
		const normalizedTg = tg.normalized;
		const degreesConnection =
			Array.isArray(degreeIds) && degreeIds.length > 0
				? { connect: degreeIds.map((id) => ({ id: parseInt(id) })) }
				: {};

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
			message: "Failed to create teacher user",
			teacher: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { addTeacher };
