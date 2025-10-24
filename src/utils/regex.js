/**
 * Validate and normalize Uzbekistan phone numbers
 * @param {string|number} input - Phone number to validate
 * @returns {Object} - Validation result with valid flag and normalized number
 */
function checkUzPhoneInt(input) {
	const digits = input.toString().replace(/\D/g, ""); // Remove non-digits

	if (digits.length === 9) {
		// Local format: add 998 prefix
		const normalized = "998" + digits;
		return { valid: true, normalized };
	}

	if (digits.length === 12 && digits.startsWith("998")) {
		// International format
		return { valid: true, normalized: digits };
	}

	return {
		valid: false,
		reason:
			"Invalid phone format. Expected: 9-digit local or 12-digit international starting with 998.",
	};
}

/**
 * Validate and normalize Turkey phone numbers
 * @param {string|number} input - Phone number to validate
 * @returns {Object} - Validation result with valid flag and normalized number
 */
function checkTurkeyPhoneInt(input) {
	const digits = input.toString().replace(/\D/g, ""); // Remove non-digits

	// Local format: 10 digits starting with 5
	if (digits.length === 10 && digits.startsWith("5")) {
		const normalized = "90" + digits;
		return { valid: true, normalized };
	}

	// International format: 12 digits starting with 90
	if (digits.length === 12 && digits.startsWith("90")) {
		return { valid: true, normalized: digits };
	}

	return {
		valid: false,
		reason:
			"Invalid phone format. Expected: 10-digit local (5XXXXXXXXX) or 12-digit international (90XXXXXXXXXX).",
	};
}

/**
 * Validate and normalize Telegram username
 * @param {string} username - Telegram username to validate
 * @returns {Object} - Validation result with valid flag and normalized username
 */
function checkTelegramUsername(username) {
	const raw = username.trim();

	// Regex: @ optional, 5-32 characters, letters/numbers/_ only
	const regex = /^(?!.*\s)@?[a-zA-Z0-9_]{5,32}$/;

	if (!regex.test(raw)) {
		return {
			valid: false,
			reason:
				'Invalid format. Telegram username must contain only letters, numbers, and "_", length 5-32 characters.',
		};
	}

	// Remove @ prefix if present and normalize
	const normalized = raw.startsWith("@") ? raw.slice(1) : raw;

	return { valid: true, normalized };
}

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {Object} - Validation result with valid flag and normalized username
 */
function checkUsername(username) {
	const regex = /^(?!.*\s)[a-z0-9]{4,10}$/;

	if (!regex.test(username)) {
		return {
			valid: false,
			reason:
				"Username must contain only lowercase letters and numbers, length 4-10 characters.",
		};
	}

	return { valid: true, normalized: username };
}

/**
 * Validate birth date format and validity
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {boolean} - True if date is valid
 */
function isValidBirthdate(dateStr) {
	// Check YYYY-MM-DD format
	const regex = /^\d{4}-\d{2}-\d{2}$/;
	if (!regex.test(dateStr)) return false;

	const date = new Date(dateStr);
	const now = new Date();

	// Check if date is valid and not in the future
	return !isNaN(date.getTime()) && date <= now;
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {boolean} - True if password meets requirements
 */
function isValidPassword(password) {
	// At least 8 characters, one uppercase, one lowercase, one number
	const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
	return regex.test(password);
}

export {
	checkTelegramUsername,
	checkUzPhoneInt,
	checkTurkeyPhoneInt,
	checkUsername,
	isValidBirthdate,
	isValidPassword,
};
