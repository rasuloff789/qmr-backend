import { rule, shield, allow, deny, and } from "graphql-shield";
import { ROLES } from "../constants/roles.js";
import {
	checkPermission,
	checkResourceAccess,
	checkActionPermission,
	clearUserPermissionCache,
	clearPermissionCache,
	getCacheStats,
} from "../utils/permissions.js";
import { logPermission, logSecurity } from "../utils/audit.js";

// ============================================================================
// CONSTANTS
// ============================================================================

const ROLE_SETS = {
	ADMIN_OR_ROOT: [ROLES.ADMIN, ROLES.ROOT],
	TEACHER_OR_HIGHER: [ROLES.TEACHER, ROLES.ADMIN, ROLES.ROOT],
	ALL_AUTHENTICATED: [ROLES.TEACHER, ROLES.ADMIN, ROLES.ROOT],
};

const RESOURCE_TYPES = {
	TEACHER: "teacher",
	STUDENT: "student",
	COURSE: "course",
};

const GENDER_VALUES = {
	CHILD: "CHILD",
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Optimized permission checking utilities using cached functions
 */
const checkUserPermission = async (user, permission) => {
	const result = await checkPermission(user, permission);
	return result.allowed;
};

const checkUserRole = async (user, allowedRoles) => {
	if (!user) return false;
	return allowedRoles.includes(user.role);
};

const checkOwnership = async (user, resourceId) => {
	if (!user) return false;
	// Root can access everything
	if (user.role === ROLES.ROOT) return true;
	// Check if user is accessing their own resource
	return parseInt(user.id) === parseInt(resourceId);
};

/**
 * Check if user has a specific role
 */
const hasRole = (user, role) => user?.role === role;

/**
 * Check if user has any of the specified roles
 */
const hasAnyRole = (user, roles) => user && roles.includes(user.role);

/**
 * Create a rule that checks if user has a permission (with ROOT bypass)
 */
const createPermissionRule = (permission, allowRoot = false) =>
	rule()(async (_parent, _args, { user }) => {
		if (!user) return false;
		if (allowRoot && hasRole(user, ROLES.ROOT)) return true;
		return await checkUserPermission(user, permission);
	});

/**
 * Create a rule that checks if user has any of the specified roles
 */
const createRoleRule = (allowedRoles) =>
	rule()(async (_parent, _args, { user }) => hasAnyRole(user, allowedRoles));

/**
 * Create a simple authenticated user rule
 */
const isAuthenticated = rule()(async (_parent, _args, { user }) => !!user);

/**
 * Extract resource type from mutation name
 */
const getResourceType = (mutationName) => {
	const name = mutationName || "";
	if (name.includes("Teacher")) return RESOURCE_TYPES.TEACHER;
	if (name.includes("Student")) return RESOURCE_TYPES.STUDENT;
	if (name.includes("Course")) return RESOURCE_TYPES.COURSE;
	return "resource";
};

/**
 * Get action type (create/update/delete) from mutation name
 */
const getActionType = (mutationName) => {
	const name = mutationName || "";
	if (name.startsWith("add")) return "create";
	if (name.startsWith("delete")) return "delete";
	return "update";
};

// ============================================================================
// BASIC AUTHENTICATION & ROLE RULES
// ============================================================================

const isAuth = rule()(async (_parent, _args, { user }) => {
	if (!user) return false;
	const result = await checkPermission(user, "view_own_profile");
	return result.allowed;
});

const isRoot = rule()(async (_parent, _args, { user }) =>
	hasRole(user, ROLES.ROOT)
);

const isAdminOrRoot = createRoleRule(ROLE_SETS.ADMIN_OR_ROOT);

const isTeacherAdminOrRoot = createRoleRule(ROLE_SETS.TEACHER_OR_HIGHER);

// ============================================================================
// PERMISSION-BASED RULES (Using Permission System)
// ============================================================================

const canViewAdmins = createPermissionRule("view_admins");
const canViewTeachers = createPermissionRule("view_teachers");
const canViewStudents = createPermissionRule("view_students");

// Create/Update/Delete rules with ROOT bypass
// Only ROOT can create admins
const canCreateAdmin = rule()(async (_parent, _args, { user }) => {
	return hasRole(user, ROLES.ROOT);
});
const canCreateTeacher = createPermissionRule("create_teacher", true);
const canCreateStudent = createPermissionRule("create_student", true);
const canUpdateAdmin = createPermissionRule("update_admin", true);
const canUpdateTeacher = createPermissionRule("update_teacher", true);
const canUpdateStudent = createPermissionRule("update_student", true);
const canDeleteAdmin = createPermissionRule("delete_admin", true);

// Other permission rules
const canUpdateOwnProfile = createPermissionRule("update_own_profile");
const canManageAdminStatus = createPermissionRule("manage_admin_status");
const canManageTeacherStatus = createPermissionRule("manage_teacher_status");
const canManageStudentStatus = createPermissionRule("manage_student_status");
const canViewAllUsers = createPermissionRule("view_all_users");
const canManageSystem = createPermissionRule("manage_system");
const canViewAuditLogs = createPermissionRule("view_audit_logs");
const canExportData = createPermissionRule("export_data");

// ============================================================================
// GENDER-BASED MANAGEMENT RULE
// ============================================================================

/**
 * Resolve target gender from args or database lookup
 */
async function resolveTargetGender(args, info, prisma) {
	// If gender exists in args (add mutations), use it directly
	if (args?.gender) return args.gender;

	const mutation = info?.fieldName || "";
	const resourceId = args?.id;

	if (!resourceId) return null;

	// Cache resource type lookup
	const resourceType = getResourceType(mutation);

	try {
		switch (resourceType) {
			case RESOURCE_TYPES.TEACHER:
				const teacher = await prisma.teacher.findUnique({
					where: { id: parseInt(resourceId) },
					select: { gender: true },
				});
				return teacher?.gender;
			case RESOURCE_TYPES.STUDENT:
				const student = await prisma.student.findUnique({
					where: { id: parseInt(resourceId) },
					select: { gender: true },
				});
				return student?.gender;
			case RESOURCE_TYPES.COURSE:
				const course = await prisma.course.findUnique({
					where: { id: parseInt(resourceId) },
					select: { gender: true },
				});
				return course?.gender;
			default:
				return null;
		}
	} catch (error) {
		console.error("Error resolving target gender:", error);
		return null;
	}
}

/**
 * Validate gender-based permissions for admin users
 */
const validateAdminGenderPermissions = (
	userGender,
	targetGender,
	resourceType,
	action
) => {
	// For teachers: STRICT - Only same gender allowed (no CHILD, no different gender)
	// RULE: Admin can ONLY create/add/update/delete teachers of their own gender
	//   - Male admin → can ONLY manage MALE teachers (create, update, delete)
	//   - Female admin → can ONLY manage FEMALE teachers (create, update, delete)
	//   - CHILD teachers are NOT allowed for anyone
	if (resourceType === RESOURCE_TYPES.TEACHER) {
		// Reject CHILD gender for teachers (no one can create CHILD teachers)
		if (targetGender === GENDER_VALUES.CHILD) {
			throw new Error(
				`You cannot ${action} a CHILD ${resourceType}. You can only ${action} ${userGender} ${resourceType}s.`
			);
		}
		// Strict gender matching - admin gender must match teacher gender exactly
		if (userGender !== targetGender) {
			throw new Error(
				`You cannot ${action} a ${targetGender} ${resourceType}. You can only ${action} ${userGender} ${resourceType}s.`
			);
		}
		// Only allow if admin gender matches teacher gender exactly
		return true;
	}

	// For students and courses: Same gender OR CHILD allowed
	// RULE: Admin can create/add/update/delete students/courses of their own gender OR CHILD
	//   - Male admin → can manage MALE or CHILD students/courses (create, update, delete)
	//   - Female admin → can manage FEMALE or CHILD students/courses (create, update, delete)
	if (
		resourceType === RESOURCE_TYPES.STUDENT ||
		resourceType === RESOURCE_TYPES.COURSE
	) {
		// Allow if target is CHILD or if genders match
		if (targetGender === GENDER_VALUES.CHILD || userGender === targetGender) {
			return true;
		}
		// Reject if trying to create different gender (not CHILD and not same gender)
		throw new Error(
			`You cannot ${action} a ${targetGender} ${resourceType}. You can only ${action} ${userGender} or CHILD ${resourceType}s.`
		);
	}

	// For other resources: Only same gender
	if (userGender === targetGender) {
		return true;
	}

	throw new Error(
		`You cannot ${action} a ${targetGender} ${resourceType}. Your gender (${userGender}) does not match.`
	);
};

const canManageByGender = rule()(
	async (_parent, args, { user, prisma }, info) => {
		if (!user) throw new Error("Authentication required");
		if (hasRole(user, ROLES.ROOT)) return true;

		const targetGender = await resolveTargetGender(args, info, prisma);

		// Some mutations do not have gender
		if (!targetGender) return true;

		const mutationName = info?.fieldName || "resource";
		const resourceType = getResourceType(mutationName);
		const action = getActionType(mutationName);

		// ADMIN RULES
		if (hasRole(user, ROLES.ADMIN)) {
			if (!user.gender) {
				throw new Error("Your account does not have a gender assigned.");
			}
			return validateAdminGenderPermissions(
				user.gender,
				targetGender,
				resourceType,
				action
			);
		}

		// TEACHER RULES
		// Teachers cannot manage students - only ADMIN and ROOT can manage students
		if (hasRole(user, ROLES.TEACHER)) {
			// Block teachers from managing students
			if (resourceType === RESOURCE_TYPES.STUDENT) {
				throw new Error(
					`Teachers cannot ${action} students. Only administrators can manage students.`
				);
			}

			if (!user.gender) {
				throw new Error("Your account does not have a gender assigned.");
			}
			if (user.gender === targetGender) return true;

			throw new Error(
				`You cannot ${action} a ${targetGender} ${resourceType}. Teachers can only manage their own gender (${user.gender}) resources.`
			);
		}

		throw new Error("Insufficient permissions");
	}
);

// ============================================================================
// RESOURCE OWNERSHIP RULES
// ============================================================================

/**
 * Check if user can update their own admin profile
 * - ROOT can update any admin
 * - ADMIN can only update their own profile
 */
const canUpdateOwnAdmin = rule()(async (_parent, args, { user }) => {
	if (!user) return false;
	if (hasRole(user, ROLES.ROOT)) return true;
	if (hasRole(user, ROLES.ADMIN)) {
		return checkOwnership(user, args.id);
	}
	return false;
});

/**
 * Check if user can update their own teacher profile
 * - ROOT can update any teacher
 * - ADMIN can update any teacher
 * - TEACHER can only update their own profile
 */
const canUpdateOwnTeacher = rule()(async (_parent, args, { user }) => {
	if (!user) return false;
	if (hasRole(user, ROLES.ROOT)) return true;
	if (hasRole(user, ROLES.ADMIN)) return true;
	if (hasRole(user, ROLES.TEACHER)) {
		return checkOwnership(user, args.id);
	}
	return false;
});

/**
 * Check if user can update their own student profile
 * - ROOT can update any student
 * - ADMIN can update any student
 */
const canUpdateOwnStudent = rule()(async (_parent, args, { user }) => {
	if (!user) return false;
	return hasAnyRole(user, ROLE_SETS.ADMIN_OR_ROOT);
});

// ============================================================================
// RESOURCE-SPECIFIC VIEW RULES
// ============================================================================

const canViewSpecificAdmin = rule()(async (_parent, args, { user }) => {
	if (!user) return false;
	if (hasRole(user, ROLES.ROOT)) return true;
	if (hasRole(user, ROLES.ADMIN)) {
		return checkOwnership(user, args.id);
	}
	return false;
});

const canViewSpecificTeacher = rule()(async (_parent, args, { user }) => {
	if (!user) return false;
	if (hasAnyRole(user, ROLE_SETS.ADMIN_OR_ROOT)) return true;
	if (hasRole(user, ROLES.TEACHER)) {
		return checkOwnership(user, args.id);
	}
	return false;
});

const canViewSpecificStudent = rule()(async (_parent, args, { user }) => {
	if (!user) return false;
	return hasAnyRole(user, ROLE_SETS.TEACHER_OR_HIGHER);
});

// ============================================================================
// STATUS CHANGE RULES
// ============================================================================

const canChangeAdminStatus = rule()(async (_parent, args, { user }) => {
	return hasRole(user, ROLES.ROOT);
});

const canChangeTeacherStatus = createRoleRule(ROLE_SETS.ADMIN_OR_ROOT);

const canChangeStudentStatus = createRoleRule(ROLE_SETS.ADMIN_OR_ROOT);

// ============================================================================
// ADVANCED PERMISSION RULES
// ============================================================================

const canAccessSensitiveData = rule()(async (_parent, args, { user }) => {
	if (!user) return false;
	if (hasRole(user, ROLES.ROOT)) return true;
	return hasRole(user, ROLES.ADMIN); // Simplified check
});

const canPerformBulkOperations = rule()(async (_parent, args, { user }) => {
	return hasRole(user, ROLES.ROOT);
});

// ============================================================================
// SHARED RULE HELPERS
// ============================================================================

// Reusable rule for admin/root only
const isAdminOrRootRule = createRoleRule(ROLE_SETS.ADMIN_OR_ROOT);

// Reusable rule for authenticated users only
const isAuthenticatedRule = isAuthenticated;

// ============================================================================
// GRAPHQL SHIELD PERMISSIONS CONFIGURATION
// ============================================================================

export const permissions = shield(
	{
		// ====================================================================
		// QUERY PERMISSIONS
		// ====================================================================
		Query: {
			me: allow, // Allow me query without authentication
			getAdmins: canViewAdmins,
			getAdmin: canViewSpecificAdmin,
			getTeachers: canViewTeachers,
			getTeacher: canViewSpecificTeacher,
			getStudents: canViewStudents,
			getStudent: canViewSpecificStudent,
			getDegrees: isAuthenticatedRule,
			getDegree: isAuthenticatedRule,
			getCourses: isAuthenticatedRule,
			getCourse: isAuthenticatedRule,
			getAttendances: isAuthenticatedRule,
			getDashboardStats: isAuthenticatedRule,
		},

		// ====================================================================
		// MUTATION PERMISSIONS
		// ====================================================================
		Mutation: {
			login: allow,
			updateProfile: isAuthenticatedRule,
			updatePassword: isAuthenticatedRule,

			// Admin management
			addAdmin: canCreateAdmin,
			updateAdmin: canUpdateOwnAdmin,
			updateAdminActive: canChangeAdminStatus,
			deleteAdmin: canDeleteAdmin,

			// Teacher management
			addTeacher: and(isAdminOrRootRule, canManageByGender),
			updateTeacher: and(canUpdateOwnTeacher, canManageByGender),
			updateTeacherActive: and(canChangeTeacherStatus, canManageByGender),
			deleteTeacher: and(canDeleteAdmin, canManageByGender),

			// Student management - Only ADMIN and ROOT can manage students (Teachers are NOT allowed)
			addStudent: and(
				rule()(async (_parent, _args, { user }) => {
					if (!user) return false;
					// Only ADMIN and ROOT can create students, Teachers are explicitly blocked
					return hasAnyRole(user, ROLE_SETS.ADMIN_OR_ROOT);
				}),
				canManageByGender
			),
			updateStudent: and(canUpdateOwnStudent, canManageByGender),
			updateStudentActive: and(
				rule()(async (_parent, _args, { user }) => {
					if (!user) return false;
					// Only ADMIN and ROOT can change student status, Teachers are explicitly blocked
					return hasAnyRole(user, ROLE_SETS.ADMIN_OR_ROOT);
				}),
				canManageByGender
			),
			deleteStudent: and(canDeleteAdmin, canManageByGender),

			// Degree management
			addDegree: isAdminOrRootRule,
			updateDegree: isAdminOrRootRule,
			deleteDegree: isAdminOrRootRule,

			// Course management
			addCourse: and(isAdminOrRootRule, canManageByGender),
			updateCourse: and(isAdminOrRootRule, canManageByGender),
			deleteCourse: and(isAdminOrRootRule, canManageByGender),
			addStudentToCourse: isAdminOrRootRule,
			removeStudentFromCourse: isAdminOrRootRule,
			setAttendance: createRoleRule([ROLES.ROOT, ROLES.TEACHER]),
		},

		// ====================================================================
		// FIELD-LEVEL PERMISSIONS
		// ====================================================================

		// User Types - All fields allowed
		Admin: allow,
		Teacher: allow,
		Student: allow,

		// Course Types - All fields allowed
		Degree: allow,
		Course: allow,
		CourseStudent: allow,
		SubstituteTeacher: allow,
		Attendance: allow,

		// Dashboard Types - All fields allowed
		DashboardStats: allow,
		GenderDistribution: allow,

		// Response Types - All fields allowed
		AddCourseResponse: allow,
		UpdateCourseResponse: allow,
		DeleteCourseResponse: allow,
		AddStudentToCourseResponse: allow,
		RemoveStudentFromCourseResponse: allow,
		SetAttendanceResponse: allow,
		LoginResponse: allow,
		UserData: allow,
		AddAdminResponse: allow,
		UpdateAdminResponse: allow,
		DeleteAdminResponse: allow,
		AddTeacherResponse: allow,
		UpdateTeacherResponse: allow,
		UpdateTeacherActiveResponse: allow,
		DeleteTeacherResponse: allow,
		AddStudentResponse: allow,
		UpdateStudentResponse: allow,
		UpdateStudentActiveResponse: allow,
		DeleteStudentResponse: allow,
		UpdateProfileResponse: allow,
		UpdatePasswordResponse: allow,
		AddDegreeResponse: allow,
		UpdateDegreeResponse: allow,

		// Upload scalar
		Upload: isAuthenticatedRule,
	},
	{
		fallbackRule: deny,
		allowExternalErrors: true,
		debug: process.env.NODE_ENV === "development",
		graphqlErrorHandler: (err, parent, args, context, info) => {
			if (err.message.includes("permission")) {
				return new Error("Access denied: Insufficient permissions");
			}
			return err;
		},
	}
);

// ============================================================================
// CACHE MANAGEMENT UTILITIES
// ============================================================================

export const invalidateUserCache = (userId) => {
	clearUserPermissionCache(userId);
};

export const invalidateAllCache = () => {
	clearPermissionCache();
};

// ============================================================================
// PERFORMANCE MONITORING UTILITIES
// ============================================================================

export const getPermissionStats = () => {
	return {
		cacheStats: getCacheStats(),
		timestamp: new Date().toISOString(),
	};
};
