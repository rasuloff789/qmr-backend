// This file for hashing passwords (if needed in future)
// And checking hashed passwords

import bcrypt from "bcrypt";

// password hash qilish
const hashPassword = async (plainPassword) => {
	const saltRounds = 10; // standart
	const hashed = await bcrypt.hash(plainPassword, saltRounds);
	return hashed;
};

// passwordni tekshirish
const verifyPassword = async (plainPassword, hashedPassword) => {
	const isValid = await bcrypt.compare(plainPassword, hashedPassword);
	return isValid; // true / false
};

export { hashPassword, verifyPassword };
