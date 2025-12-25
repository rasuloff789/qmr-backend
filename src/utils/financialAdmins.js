/**
 * QMR Backend - Financial Admins Utility
 *
 * Manages the financial admins whitelist stored in JSON file.
 * Provides functions to read, check, add, and remove financial admins.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FINANCIAL_ADMINS_FILE = path.join(
	__dirname,
	"../../data/financial-admins.json"
);

/**
 * Read financial admins from JSON file
 * @returns {Promise<Array>} Array of financial admin objects
 */
export async function getFinancialAdmins() {
	try {
		// Ensure file exists, create if it doesn't
		if (!fs.existsSync(FINANCIAL_ADMINS_FILE)) {
			fs.writeFileSync(FINANCIAL_ADMINS_FILE, JSON.stringify([], null, 2));
			return [];
		}

		const fileContent = fs.readFileSync(FINANCIAL_ADMINS_FILE, "utf8");
		const admins = JSON.parse(fileContent);

		// Validate structure
		if (!Array.isArray(admins)) {
			console.error("Invalid financial admins file structure, resetting to empty array");
			fs.writeFileSync(FINANCIAL_ADMINS_FILE, JSON.stringify([], null, 2));
			return [];
		}

		return admins;
	} catch (error) {
		console.error("Error reading financial admins file:", error);
		// Return empty array on error
		return [];
	}
}

/**
 * Check if an admin ID is in the financial admins list
 * @param {number|string} adminId - Admin ID to check
 * @returns {Promise<boolean>} True if admin is in the list
 */
export async function isFinancialAdmin(adminId) {
	try {
		const admins = await getFinancialAdmins();
		const id = parseInt(adminId);
		return admins.some((admin) => parseInt(admin.id) === id);
	} catch (error) {
		console.error("Error checking financial admin:", error);
		return false;
	}
}

/**
 * Add an admin to the financial admins list
 * @param {number|string} adminId - Admin ID to add
 * @returns {Promise<Object>} Success status and admin object
 */
export async function addFinancialAdmin(adminId) {
	try {
		const id = parseInt(adminId);
		const admins = await getFinancialAdmins();

		// Check if already exists
		if (admins.some((admin) => parseInt(admin.id) === id)) {
			return {
				success: false,
				message: "Admin is already in the financial admins list",
			};
		}

		// Add admin with timestamp
		const newAdmin = {
			id: id,
			addedAt: new Date().toISOString(),
		};

		admins.push(newAdmin);

		// Write to file atomically
		const tempFile = FINANCIAL_ADMINS_FILE + ".tmp";
		fs.writeFileSync(tempFile, JSON.stringify(admins, null, 2));
		fs.renameSync(tempFile, FINANCIAL_ADMINS_FILE);

		return {
			success: true,
			message: "Admin added to financial admins list",
			admin: newAdmin,
		};
	} catch (error) {
		console.error("Error adding financial admin:", error);
		return {
			success: false,
			message: "Failed to add admin to financial admins list",
			error: error.message,
		};
	}
}

/**
 * Remove an admin from the financial admins list
 * @param {number|string} adminId - Admin ID to remove
 * @returns {Promise<Object>} Success status
 */
export async function removeFinancialAdmin(adminId) {
	try {
		const id = parseInt(adminId);
		const admins = await getFinancialAdmins();

		// Find and remove admin
		const index = admins.findIndex((admin) => parseInt(admin.id) === id);

		if (index === -1) {
			return {
				success: false,
				message: "Admin is not in the financial admins list",
			};
		}

		const removedAdmin = admins[index];
		admins.splice(index, 1);

		// Write to file atomically
		const tempFile = FINANCIAL_ADMINS_FILE + ".tmp";
		fs.writeFileSync(tempFile, JSON.stringify(admins, null, 2));
		fs.renameSync(tempFile, FINANCIAL_ADMINS_FILE);

		return {
			success: true,
			message: "Admin removed from financial admins list",
			admin: removedAdmin,
		};
	} catch (error) {
		console.error("Error removing financial admin:", error);
		return {
			success: false,
			message: "Failed to remove admin from financial admins list",
			error: error.message,
		};
	}
}

