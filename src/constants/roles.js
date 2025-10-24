/**
 * QMR Backend - User Roles Constants
 * 
 * This file defines all user roles and their permissions in the system.
 * Centralized role management for better maintainability.
 * 
 * @author QMR Development Team
 * @version 1.0.0
 */

/**
 * User Roles
 * 
 * Defines the hierarchy and capabilities of each user role.
 */
export const ROLES = {
	ROOT: "root",
	ADMIN: "admin", 
	TEACHER: "teacher"
};

/**
 * Role Hierarchy
 * 
 * Defines the permission hierarchy where higher roles inherit lower role permissions.
 */
export const ROLE_HIERARCHY = {
	[ROLES.ROOT]: 3,    // Highest level
	[ROLES.ADMIN]: 2,   // Medium level
	[ROLES.TEACHER]: 1  // Lowest level
};

/**
 * Role Permissions
 * 
 * Defines what each role can do in the system.
 */
export const PERMISSIONS = {
	[ROLES.ROOT]: [
		"create_admin",
		"create_teacher", 
		"update_admin",
		"update_teacher",
		"delete_admin",
		"view_all_users",
		"manage_system"
	],
	[ROLES.ADMIN]: [
		"view_admins",
		"view_teachers",
		"update_own_profile"
	],
	[ROLES.TEACHER]: [
		"view_teachers",
		"update_own_profile"
	]
};

/**
 * Check if a role has permission
 * 
 * @param {string} role - User role
 * @param {string} permission - Permission to check
 * @returns {boolean} - True if role has permission
 */
export const hasPermission = (role, permission) => {
	return PERMISSIONS[role]?.includes(permission) || false;
};

/**
 * Check if role is higher than another
 * 
 * @param {string} role1 - First role
 * @param {string} role2 - Second role
 * @returns {boolean} - True if role1 is higher than role2
 */
export const isHigherRole = (role1, role2) => {
	return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
};
