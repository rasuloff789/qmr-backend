/**
 * QMR Backend - GraphQL Shield Permission System Examples
 *
 * Examples demonstrating how to use the improved GraphQL Shield permission system.
 *
 * @author QMR Development Team
 * @version 2.0.0
 */

import { rule } from "graphql-shield";
import {
	checkPermission,
	checkResourceAccess,
	checkActionPermission,
	validatePermission,
} from "../utils/permissions.js";
import { ROLES } from "../constants/roles.js";
import {
	logPermission,
	logDataAccess,
	logDataModification,
} from "../utils/audit.js";

/**
 * Example 1: GraphQL Shield Permission Rules
 */
export const exampleGraphQLShieldRules = {
	// Basic permission rules are already defined in permissions/index.js
	// Here's how they work:
	// Query rules:
	// - me: isAuth (any authenticated user)
	// - getAdmins: canViewAdmins (users with view_admins permission)
	// - getAdmin: canViewSpecificAdmin (resource-specific permission)
	// - getTeachers: canViewTeachers (users with view_teachers permission)
	// - getTeacher: canViewSpecificTeacher (resource-specific permission)
	// Mutation rules:
	// - login: allow (public access)
	// - addAdmin: canCreateAdmin (only root)
	// - changeAdmin: canUpdateOwnAdmin (own admin or root)
	// - deleteAdmin: canDeleteAdmin (only root)
	// Field-level rules:
	// - Admin.password: canManageSystem (only root)
	// - Admin.lastLogin: canViewAuditLogs (audit access required)
	// - Teacher.password: canManageSystem (only root)
};

/**
 * Example 2: Advanced GraphQL Shield Rules
 */
export const exampleAdvancedGraphQLRules = {
	// These rules are already implemented in permissions/index.js
	// Resource-specific permissions:
	// - canViewSpecificAdmin: Root can view any, Admin can view own
	// - canViewSpecificTeacher: Root/Admin can view any, Teacher can view own
	// - canUpdateOwnAdmin: Root can update any, Admin can update own
	// - canUpdateOwnTeacher: Root can update any, Teacher can update own
	// Status management:
	// - canChangeAdminStatus: Only root can change admin status
	// - canChangeTeacherStatus: Only root can change teacher status
	// System operations:
	// - canPerformBulkOperations: Only root can perform bulk operations
	// - canManageSystem: Only root can manage system
	// - canViewAuditLogs: Only users with audit permission
};

/**
 * Example 3: GraphQL Resolver Permission Integration
 */
export const exampleGraphQLResolvers = {
	// In your GraphQL resolvers, you can use these utilities:

	async getTeacher(parent, args, { user }) {
		// Validate permission before proceeding
		await validatePermission(user, "view_teachers", args.id, ROLES.TEACHER);

		// Log data access
		await logDataAccess(user, "get_teacher", "teacher", args.id, {
			query: "getTeacher",
			teacherId: args.id,
		});

		// Your resolver logic here
		return await prisma.teacher.findUnique({
			where: { id: parseInt(args.id) },
		});
	},

	async updateTeacher(parent, args, { user }) {
		// Check if user can update this specific teacher
		const canUpdate = await checkActionPermission(
			user,
			"update_teacher",
			args.id,
			ROLES.TEACHER
		);

		if (!canUpdate.allowed) {
			throw new Error(`Update denied: ${canUpdate.reason}`);
		}

		// Log data modification
		await logDataModification(
			user,
			"update_teacher",
			"teacher",
			args.id,
			args,
			{
				changes: Object.keys(args),
			}
		);

		// Your update logic here
		return await prisma.teacher.update({
			where: { id: parseInt(args.id) },
			data: args,
		});
	},

	async addAdmin(parent, args, { user }) {
		// Check permission
		const canCreate = await checkPermission(user, "create_admin");
		if (!canCreate.allowed) {
			throw new Error(`Permission denied: ${canCreate.reason}`);
		}

		// Log admin creation
		await logDataModification(user, "create_admin", "admin", null, args, {
			adminUsername: args.username,
		});

		// Your creation logic here
		return await prisma.admin.create({
			data: args,
		});
	},
};

/**
 * Example 4: Custom GraphQL Shield Rules
 */
export const exampleCustomShieldRules = {
	// You can create custom rules for specific business logic

	// Time-based access rule
	canAccessDuringBusinessHours: rule()(async (_parent, _args, { user }) => {
		const now = new Date();
		const hour = now.getHours();

		// Business hours: 9 AM to 5 PM
		if (hour < 9 || hour > 17) {
			// Only root can access outside business hours
			return user?.role === ROLES.ROOT;
		}

		return true;
	}),

	// Department-based access rule
	canAccessDepartmentData: rule()(async (_parent, args, { user }) => {
		if (!user) return false;

		// Root can access any department
		if (user.role === ROLES.ROOT) return true;

		// Admin can access their own department
		if (user.role === ROLES.ADMIN && user.department === args.department) {
			return true;
		}

		return false;
	}),

	// Rate limiting rule
	canPerformSensitiveOperation: rule()(async (_parent, _args, { user }) => {
		// This would integrate with your rate limiting logic
		// For now, just check if user has permission
		return await checkPermission(user, "sensitive_operation");
	}),
};

/**
 * Example 5: GraphQL Shield Rule Composition
 */
export const exampleShieldRuleComposition = {
	// You can combine multiple rules using GraphQL Shield's rule composition

	// Rule that requires both permission AND ownership
	canUpdateOwnAdminWithPermission: rule()(async (_parent, args, { user }) => {
		// First check if user has update permission
		const hasPermission = await checkPermission(user, "update_admin");
		if (!hasPermission.allowed) return false;

		// Then check ownership
		if (user.role === ROLES.ROOT) return true; // Root can update any
		return parseInt(user.id) === parseInt(args.id); // Admin can update own
	}),

	// Rule that requires specific role AND permission
	canManageSystemWithRole: rule()(async (_parent, _args, { user }) => {
		// Must be root role
		if (user.role !== ROLES.ROOT) return false;

		// Must have system management permission
		return await checkPermission(user, "manage_system");
	}),

	// Rule with multiple conditions
	canAccessSensitiveData: rule()(async (_parent, args, { user }) => {
		// Must be authenticated
		if (!user) return false;

		// Root always has access
		if (user.role === ROLES.ROOT) return true;

		// Admin needs additional verification
		if (user.role === ROLES.ADMIN) {
			// Check if user has verified their identity recently
			// This would typically check a verification timestamp
			return true; // Simplified for example
		}

		return false;
	}),
};

/**
 * Example 6: GraphQL Shield Testing
 */
export const exampleShieldTesting = {
	// Test GraphQL Shield rules
	async testShieldRules() {
		const testUser = { id: 1, role: ROLES.ADMIN };

		// Test permission-based rules
		const canViewAdmins = await checkPermission(testUser, "view_admins");
		console.log("Can view admins:", canViewAdmins.allowed);

		// Test resource-specific rules
		const canAccessTeacher = await checkResourceAccess(
			testUser,
			"2",
			ROLES.TEACHER
		);
		console.log("Can access teacher:", canAccessTeacher.allowed);

		// Test action permission rules
		const canUpdateTeacher = await checkActionPermission(
			testUser,
			"update_teacher",
			"2",
			ROLES.TEACHER
		);
		console.log("Can update teacher:", canUpdateTeacher.allowed);
	},

	// Test GraphQL Shield configuration
	async testShieldConfiguration() {
		// Test that your shield configuration is working
		// This would typically be done in your GraphQL playground
		console.log("GraphQL Shield configuration is active");
		console.log("Available rules:");
		console.log("- isAuth: Any authenticated user");
		console.log("- canViewAdmins: Users with view_admins permission");
		console.log("- canViewSpecificAdmin: Resource-specific admin access");
		console.log("- canCreateAdmin: Only root users");
		console.log("- canUpdateOwnAdmin: Own admin or root");
	},
};

/**
 * Example 7: GraphQL Shield Best Practices
 */
export const exampleShieldBestPractices = {
	// Best practices for GraphQL Shield implementation

	// 1. Use descriptive rule names
	ruleNames: {
		// Good: Descriptive and clear
		canViewSpecificAdmin: "Allows viewing specific admin by ID",
		canUpdateOwnProfile: "Allows updating own profile only",
		canManageSystemSettings: "Allows system configuration changes",

		// Bad: Vague or unclear
		// canDoStuff: "Does something",
		// rule1: "First rule"
	},

	// 2. Combine rules logically
	ruleCombinations: {
		// Permission + Ownership
		canUpdateOwnAdmin: "Requires update_admin permission AND own resource",

		// Role + Permission
		canManageSystem: "Requires root role AND manage_system permission",

		// Time + Permission
		canAccessDuringBusinessHours: "Requires permission AND business hours",
	},

	// 3. Handle errors gracefully
	errorHandling: {
		// Custom error messages
		permissionDenied: "Access denied: Insufficient permissions",
		resourceNotFound: "Resource not found or access denied",
		invalidUser: "Invalid user or authentication required",
	},

	// 4. Log security events
	securityLogging: {
		// Log all permission checks
		logPermissionChecks: true,
		logFailedAttempts: true,
		logSensitiveOperations: true,
	},

	// 5. Test your rules
	testing: {
		// Test with different user roles
		testRoles: [ROLES.ROOT, ROLES.ADMIN, ROLES.TEACHER],

		// Test edge cases
		testEdgeCases: [
			"User accessing own resource",
			"User accessing other user's resource",
			"Unauthenticated user",
			"Invalid user ID",
		],
	},
};
