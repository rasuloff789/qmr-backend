/**
 * QMR Backend - User Validation Utility
 *
 * This file provides user validation functions to check if users exist and are active.
 * It supports all user types (Root, Admin, Teacher) and validates their status.
 *
 * Features:
 * - Multi-role user validation
 * - Active status checking
 * - Database existence verification
 * - Error handling and logging
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../database/index.js";

/**
 * Check if a user exists and is valid
 *
 * Validates that a user exists in the database and is active (for admin/teacher users).
 * Root users are always considered active if they exist.
 *
 * @param {Object} user - The user object from JWT token
 * @param {number} user.id - User ID
 * @param {string} user.role - User role (root, admin, teacher)
 * @returns {Promise<boolean>} - True if user is valid, false otherwise
 *
 * @example
 * const isValid = await checkUser({ id: 1, role: 'admin' });
 * if (isValid) {
 *   console.log('User is valid and active');
 * }
 */
export default async function checkUser(user) {
	// Validate input parameters
	if (!user?.role || !user?.id) {
		return false;
	}

	const { role, id } = user;
	let userExists = false;

	try {
		// Check root user (always active if exists)
		if (role === "root") {
			const rootUser = await prisma.root.findUnique({
				where: { id: parseInt(id) },
				select: { id: true, username: true, fullname: true },
			});
			userExists = !!rootUser;
		}
		// Check admin user (must be active)
		else if (role === "admin") {
			const adminUser = await prisma.admin.findUnique({
				where: { id: parseInt(id) },
				select: { id: true, username: true, fullname: true, isActive: true },
			});
			userExists = !!adminUser && adminUser.isActive;
		}
		// Check teacher user (must be active)
		else if (role === "teacher") {
			const teacherUser = await prisma.teacher.findUnique({
				where: { id: parseInt(id) },
				select: { id: true, username: true, fullname: true, isActive: true },
			});
			userExists = !!teacherUser && teacherUser.isActive;
		}
	} catch (error) {
		console.error("Error checking user:", error);
		return false;
	}

	return userExists;
}
