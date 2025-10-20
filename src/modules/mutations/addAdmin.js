import prisma from "../../config/db.js";
import { hashPassword } from "../../utils/hashpswrd.js";
import {
	checkUzPhoneInt,
	checkTelegramUsername,
	checkUsername,
	isValidPassword,
	checkTurkeyPhoneInt,
	isValidBirthdate,
} from "../../utils/regex.js";

// Resolver to add a new admin user
const addAdmin = async (
	_parent,
	{ username, fullname, birthDate, phone, tgUsername, password }
) => {
	// Input validation
	if (!checkUsername(username)) {
		throw new Error("Invalid username format.");
	}
	if (!isValidPassword(password)) {
		throw new Error("Password does not meet security requirements.");
	}
	if (!checkUzPhoneInt(phone).valid && !checkTurkeyPhoneInt(phone).valid) {
		throw new Error("Invalid phone number format.");
	}
	if (!checkTelegramUsername(tgUsername)) {
		throw new Error("Invalid Telegram username format.");
	}
	if (!isValidBirthdate(birthDate)) {
		throw new Error("Invalid birth date format.");
	}

	// Create a new admin in the database
	const newAdmin = await prisma.admin.create({
		data: {
			username,
			fullname,
			birthDate: new Date(birthDate).toISOString(),
			phone,
			tgUsername,
			password: await hashPassword(password), // Hash the password before storing
		},
	});

	return newAdmin;
};

export { addAdmin };
