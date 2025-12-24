import { prisma } from "../../../database/index.js";
import { studentSelectFields } from "../helpers/studentSelect.js";
import {
	hashPassword,
	isPasswordSecure,
} from "../../../utils/auth/password.js";
import {
	checkInternationalPhone,
	checkTelegramUsername,
	checkUsername,
	isValidBirthdate,
} from "../../../utils/regex.js";
import {
	processUploadedFile,
	deleteProfilePicture,
} from "../../../utils/fileUpload.js";

/**
 * Change/Update student user information
 */
const updateStudent = async (
	_parent,
	{
		id,
		username,
		fullname,
		birthDate,
		phone,
		tgUsername,
		password,
		profilePicture,
		possibleDegrees,
		isActive,
	}
) => {
	try {
		// Check if student exists
		const existingStudent = await prisma.student.findUnique({
			where: { id: parseInt(id) },
		});

		if (!existingStudent) {
			return {
				success: false,
				code: "STUDENT_NOT_FOUND",
				message: "Student not found",
				student: null,
				errors: ["Student not found"],
				timestamp: new Date().toISOString(),
			};
		}

		// Prepare update data object
		const updateData = {};

		// Validate and add username if provided
		if (username !== undefined) {
			const usernameValidation = checkUsername(username);
			if (!usernameValidation.valid) {
				return {
					success: false,
					code: "STUDENT_USERNAME_INVALID",
					message: "Validation failed",
					student: null,
					errors: [usernameValidation.reason],
					timestamp: new Date().toISOString(),
				};
			}

			// Check if username is already taken by another student
			const usernameExists = await prisma.student.findFirst({
				where: {
					username,
					id: { not: parseInt(id) },
				},
			});

			if (usernameExists) {
				return {
					success: false,
					code: "STUDENT_USERNAME_TAKEN",
					message: "Username already exists",
					student: null,
					errors: ["Username already exists"],
					timestamp: new Date().toISOString(),
				};
			}

			updateData.username = username;
		}

		// Add fullname if provided
		if (fullname !== undefined) {
			updateData.fullname = fullname;
		}

		// Validate and add birthDate if provided
		if (birthDate !== undefined) {
			if (!isValidBirthdate(birthDate)) {
				return {
					success: false,
					code: "STUDENT_BIRTHDATE_INVALID",
					message: "Validation failed",
					student: null,
					errors: ["Invalid birth date format. Expected: YYYY-MM-DD"],
					timestamp: new Date().toISOString(),
				};
			}
			updateData.birthDate = new Date(birthDate).toISOString();
		}

		// Validate and add phone if provided
		if (phone !== undefined) {
			if (phone === null || phone === "") {
				// User is trying to remove phone - check if tgUsername will still exist
				// Treat empty string as null
				const hasTgUsername = tgUsername !== undefined 
					? (tgUsername && tgUsername.trim() !== "")
					: (existingStudent.tgUsername && existingStudent.tgUsername.trim() !== "");
				
				if (!hasTgUsername) {
					return {
						success: false,
						code: "STUDENT_CONTACT_REQUIRED",
						message: "Validation failed",
						student: null,
						errors: ["Cannot remove phone number. Either phone number or Telegram username must be provided."],
						timestamp: new Date().toISOString(),
					};
				}
				updateData.phone = null;
			} else {
				const phoneValidation = checkInternationalPhone(phone);
				if (!phoneValidation.valid) {
					return {
						success: false,
						code: "STUDENT_PHONE_INVALID",
						message: "Validation failed",
						student: null,
						errors: [phoneValidation.reason],
						timestamp: new Date().toISOString(),
					};
				}
				// Normalize phone number
				updateData.phone = phoneValidation.normalized;
			}
		}

		// Validate and add tgUsername if provided
		if (tgUsername !== undefined) {
			if (tgUsername === null || tgUsername === "") {
				// User is trying to remove tgUsername - check if phone will still exist
				// Use updateData.phone if phone was updated, otherwise use existing value
				const finalPhone = updateData.phone !== undefined 
					? updateData.phone 
					: existingStudent.phone;
				
				if (!finalPhone) {
					return {
						success: false,
						code: "STUDENT_CONTACT_REQUIRED",
						message: "Validation failed",
						student: null,
						errors: ["Cannot remove Telegram username. Either phone number or Telegram username must be provided."],
						timestamp: new Date().toISOString(),
					};
				}
				updateData.tgUsername = null;
			} else {
				const tgValidation = checkTelegramUsername(tgUsername);
				if (!tgValidation.valid) {
					return {
						success: false,
						code: "STUDENT_TG_USERNAME_INVALID",
						message: "Validation failed",
						student: null,
						errors: [tgValidation.reason],
						timestamp: new Date().toISOString(),
					};
				}
				updateData.tgUsername = tgValidation.normalized;
			}
		}

		// Final validation: ensure at least one contact method exists after update
		const finalPhone = updateData.phone !== undefined 
			? updateData.phone 
			: existingStudent.phone;
		const finalTgUsername = updateData.tgUsername !== undefined 
			? updateData.tgUsername 
			: existingStudent.tgUsername;

		// Check if both are null or empty strings
		const hasPhone = finalPhone && finalPhone.trim() !== "";
		const hasTgUsername = finalTgUsername && finalTgUsername.trim() !== "";

		if (!hasPhone && !hasTgUsername) {
			return {
				success: false,
				code: "STUDENT_CONTACT_REQUIRED",
				message: "Validation failed",
				student: null,
				errors: ["Either phone number or Telegram username must be provided."],
				timestamp: new Date().toISOString(),
			};
		}

		// Validate and add password if provided
		if (password !== undefined) {
			if (!isPasswordSecure(password)) {
				return {
					success: false,
					code: "STUDENT_PASSWORD_WEAK",
					message: "Validation failed",
					student: null,
					errors: [
						"Password must be at least 8 characters with uppercase, lowercase, and number.",
					],
					timestamp: new Date().toISOString(),
				};
			}
			updateData.password = await hashPassword(password);
		}

		// Add profilePicture if provided
		if (profilePicture !== undefined) {
			if (profilePicture && profilePicture.createReadStream) {
				const uploadResult = await processUploadedFile(profilePicture);
				if (!uploadResult.success) {
					return {
						success: false,
						code: "STUDENT_PROFILE_PICTURE_UPLOAD_FAILED",
						message: "File upload failed",
						student: null,
						errors: [uploadResult.error],
						timestamp: new Date().toISOString(),
					};
				}

				// Delete old profile picture if it exists
				if (existingStudent.profilePicture) {
					const oldFilename = existingStudent.profilePicture.split("/").pop();
					deleteProfilePicture(oldFilename);
				}

				updateData.profilePicture = uploadResult.url;
			} else {
				// If profilePicture is explicitly set to null/empty, remove it
				if (existingStudent.profilePicture) {
					const oldFilename = existingStudent.profilePicture.split("/").pop();
					deleteProfilePicture(oldFilename);
				}
				updateData.profilePicture = null;
			}
		}

		// Add isActive if provided
		if (isActive !== undefined) {
			updateData.isActive = isActive;
		}

		// Validate and add possibleDegrees if provided
		if (possibleDegrees !== undefined) {
			if (!Array.isArray(possibleDegrees) || possibleDegrees.length === 0) {
				return {
					success: false,
					code: "STUDENT_DEGREES_EMPTY",
					message: "Validation failed",
					student: null,
					errors: ["At least one degree must be provided"],
					timestamp: new Date().toISOString(),
				};
			}

			// Parse and deduplicate IDs
			const degreeIds = [
				...new Set(possibleDegrees.map((id) => parseInt(id)).filter((n) => !Number.isNaN(n))),
			];

			// Check if all provided degrees exist
			const existingDegrees = await prisma.degree.findMany({
				where: {
					id: { in: degreeIds },
				},
			});

			if (existingDegrees.length !== degreeIds.length) {
				return {
					success: false,
					code: "STUDENT_DEGREE_IDS_INVALID",
					message: "Validation failed",
					student: null,
					errors: ["One or more degree IDs are invalid"],
					timestamp: new Date().toISOString(),
				};
			}

			// Guard: don't allow updating student degrees in a way that breaks active enrollments.
			// A student must have at least one degree that matches each enrolled course's degree requirements.
			const activeEnrollments = await prisma.courseStudent.findMany({
				where: {
					studentId: parseInt(id),
					isActive: true,
					isDeleted: false,
				},
				select: {
					id: true,
					course: {
						select: {
							id: true,
							name: true,
							degrees: { select: { id: true, name: true } },
						},
					},
				},
			});

			if (activeEnrollments.length > 0) {
				const nextDegreeIdSet = new Set(degreeIds);
				const blocking = [];

				for (const enrollment of activeEnrollments) {
					const courseDegreeIds = (enrollment.course?.degrees || []).map((d) => d.id);
					const hasMatch = courseDegreeIds.some((degId) => nextDegreeIdSet.has(degId));
					if (!hasMatch) {
						blocking.push({
							courseId: enrollment.course?.id,
							courseName: enrollment.course?.name,
							requiredDegrees: (enrollment.course?.degrees || []).map((d) => ({
								id: d.id,
								name: d.name,
							})),
						});
					}
				}

				if (blocking.length > 0) {
					const details = blocking.map((b) => {
						const req = (b.requiredDegrees || [])
							.map((d) => (d?.name ? `${d.name} (ID: ${d.id})` : `ID: ${d.id}`))
							.join(", ");
						return `Course "${b.courseName}" (ID: ${b.courseId}) requires at least one of: ${req}`;
					});

					return {
						success: false,
						code: "STUDENT_DEGREES_CONFLICT_ACTIVE_ENROLLMENT",
						message:
							"Cannot update student degrees while enrolled in active courses",
						student: null,
						errors: [
							"Remove the student from those course enrollments (or update course degree requirements) before removing these degree(s).",
							...details,
						],
						timestamp: new Date().toISOString(),
					};
				}
			}

			updateData.possibleDegrees = {
				set: degreeIds.map((id) => ({ id })),
			};
		}

		// Check if there are any fields to update
		if (Object.keys(updateData).length === 0) {
			return {
				success: false,
				code: "NO_FIELDS_TO_UPDATE",
				message: "No fields provided to update",
				student: null,
				errors: ["No fields provided to update"],
				timestamp: new Date().toISOString(),
			};
		}

		// Update the student
		const updatedStudent = await prisma.student.update({
			where: { id: parseInt(id) },
			data: updateData,
			select: studentSelectFields,
		});

		return {
			success: true,
			message: "Student updated successfully",
			student: updatedStudent,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		return {
			success: false,
			code: "STUDENT_UPDATE_FAILED",
			message: error.message || "Failed to update student",
			student: null,
			errors: [error.message || "Unexpected error"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { updateStudent };
