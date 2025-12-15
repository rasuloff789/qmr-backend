# Permissions Reference Guide

Complete documentation of all permissions, role-based access control, and authorization rules in the QMR Backend system.

## Table of Contents

1. [Role Hierarchy](#role-hierarchy)
2. [Permission System](#permission-system)
3. [Query Permissions](#query-permissions)
4. [Mutation Permissions](#mutation-permissions)
5. [Gender-Based Restrictions](#gender-based-restrictions)
6. [Ownership Rules](#ownership-rules)
7. [Permission Matrix](#permission-matrix)

---

## Role Hierarchy

The system uses a three-tier role hierarchy:

1. **ROOT** - Highest privilege level
   - Can bypass all restrictions
   - Full system access
   - Can manage all users regardless of gender

2. **ADMIN** - Administrative privileges
   - Gender-based restrictions apply
   - Can manage teachers, students, courses, degrees
   - Cannot create other admins

3. **TEACHER** - Limited privileges
   - Can only manage own profile
   - Can set attendance for assigned courses
   - Cannot manage students, courses, or degrees

---

## Permission System

The system uses a hybrid permission approach:

- **Role-based**: Direct role checks (ROOT, ADMIN, TEACHER)
- **Permission-based**: Specific permission strings (e.g., `view_admins`, `create_teacher`)
- **Gender-based**: Validates gender matching for admins
- **Ownership-based**: Validates resource ownership for self-updates

### Permission Constants

From `src/constants/roles.js`:

#### ROOT Permissions
```javascript
[
  "create_admin", "create_teacher", "create_student",
  "update_admin", "update_teacher", "update_student",
  "delete_admin", "view_all_users",
  "view_admins", "view_teachers", "view_students",
  "manage_admin_status", "manage_teacher_status", "manage_student_status",
  "manage_system", "view_audit_logs", "manage_permissions",
  "system_configuration", "view_all_data", "export_data",
  "backup_system", "update_own_profile", "update_any_profile"
]
```

#### ADMIN Permissions
```javascript
[
  "create_teacher", "create_student",
  "update_teacher", "update_student",
  "manage_teacher_status", "manage_student_status",
  "view_admins", "view_teachers", "view_students",
  "view_teacher_data", "view_admin_data", "view_student_data",
  "update_own_profile", "view_own_profile",
  "upload_files"
]
```

#### TEACHER Permissions
```javascript
[
  "view_teachers", "view_own_profile",
  "view_own_data", "update_own_profile",
  "upload_files", "upload_profile_pictures"
]
```

---

## Query Permissions

### Public Queries (No Authentication)

| Query | Access | Notes |
|-------|--------|-------|
| `me` | ✅ Public | Returns current user if authenticated, null otherwise |

### Authenticated Queries

| Query | ROOT | ADMIN | TEACHER | Notes |
|-------|------|-------|---------|-------|
| `getAdmins` | ✅ | ✅ | ❌ | Admin can only see self in `getAdmin` |
| `getAdmin(id)` | ✅ | ✅ (own) | ❌ | Admin can only view own profile |
| `getTeachers` | ✅ | ✅ | ✅ | All authenticated users |
| `getTeacher(id)` | ✅ | ✅ | ✅ (own) | Teacher can only view own profile |
| `getStudents` | ✅ | ✅ | ✅ | All authenticated users |
| `getStudent(id)` | ✅ | ✅ | ✅ | All authenticated users |
| `getDegrees` | ✅ | ✅ | ✅ | All authenticated users |
| `getDegree(id)` | ✅ | ✅ | ✅ | All authenticated users |
| `getCourses` | ✅ | ✅ | ✅ | All authenticated users |
| `getCourse(id)` | ✅ | ✅ | ✅ | All authenticated users |
| `getAttendances` | ✅ | ✅ | ✅ | All authenticated users |
| `getDashboardStats` | ✅ | ✅ | ✅ | All authenticated users |

---

## Mutation Permissions

### Authentication Mutations

| Mutation | ROOT | ADMIN | TEACHER | Notes |
|----------|------|-------|---------|-------|
| `login` | ✅ | ✅ | ✅ | Public - no authentication required |

### Profile Management Mutations

| Mutation | ROOT | ADMIN | TEACHER | Notes |
|----------|------|-------|---------|-------|
| `updateProfile` | ✅ | ✅ | ✅ | Any authenticated user can update own profile |
| `updatePassword` | ✅ | ✅ | ✅ | Any authenticated user can change own password |

### Admin Management Mutations

| Mutation | ROOT | ADMIN | TEACHER | Gender Restrictions |
|----------|------|-------|---------|-------------------|
| `addAdmin` | ✅ | ❌ | ❌ | None (ROOT only) |
| `updateAdmin` | ✅ | ✅ (own) | ❌ | None |
| `updateAdminActive` | ✅ | ❌ | ❌ | None (ROOT only) |
| `deleteAdmin` | ✅ | ❌ | ❌ | None (ROOT only) |

**Rules:**
  - Only ROOT can create admins
- Only ROOT can change admin active status
- Only ROOT can delete admins
- Admins can update their own profile only

### Teacher Management Mutations

| Mutation | ROOT | ADMIN | TEACHER | Gender Restrictions |
|----------|------|-------|---------|-------------------|
| `addTeacher` | ✅ | ✅ | ❌ | ADMIN: Same gender only (no CHILD) |
| `updateTeacher` | ✅ | ✅ | ✅ (own) | ADMIN: Same gender only |
| `updateTeacherActive` | ✅ | ✅ | ❌ | ADMIN: Same gender only |
| `deleteTeacher` | ✅ | ✅ | ❌ | ADMIN: Same gender only |

**Rules:**
- ROOT: Can manage teachers of any gender
- ADMIN: Can only manage teachers of their own gender (MALE admin → MALE teachers only)
- ADMIN: Cannot create CHILD teachers
- TEACHER: Can only update own profile (ID must match)

### Student Management Mutations

| Mutation | ROOT | ADMIN | TEACHER | Gender Restrictions |
|----------|------|-------|---------|-------------------|
| `addStudent` | ✅ | ✅ | ❌ | ADMIN: Own gender OR CHILD |
| `updateStudent` | ✅ | ✅ | ❌ | ADMIN: Own gender OR CHILD |
| `updateStudentActive` | ✅ | ✅ | ❌ | ADMIN: Own gender OR CHILD |
| `deleteStudent` | ✅ | ✅ | ❌ | ADMIN: Own gender OR CHILD |

**Rules:**
- ROOT: Can manage students of any gender
- ADMIN: Can manage students of their own gender OR CHILD students
  - MALE admin → MALE or CHILD students
  - FEMALE admin → FEMALE or CHILD students
- TEACHER: **Completely blocked** from all student management operations

### Degree Management Mutations

| Mutation | ROOT | ADMIN | TEACHER | Gender Restrictions |
|----------|------|-------|---------|-------------------|
| `addDegree` | ✅ | ✅ | ❌ | None |
| `updateDegree` | ✅ | ✅ | ❌ | None |
| `deleteDegree` | ✅ | ✅ | ❌ | None |

**Rules:**
- No gender restrictions for degrees
- Only ROOT and ADMIN can manage degrees

### Course Management Mutations

| Mutation | ROOT | ADMIN | TEACHER | Gender Restrictions |
|----------|------|-------|---------|-------------------|
| `addCourse` | ✅ | ✅ | ❌ | ADMIN: Own gender OR CHILD |
| `updateCourse` | ✅ | ✅ | ❌ | ADMIN: Own gender OR CHILD |
| `deleteCourse` | ✅ | ✅ | ❌ | ADMIN: Own gender OR CHILD |
| `addStudentToCourse` | ✅ | ✅ | ❌ | None |
| `removeStudentFromCourse` | ✅ | ✅ | ❌ | None |

**Rules:**
- ROOT: Can manage courses of any gender
- ADMIN: Can manage courses of their own gender OR CHILD courses
- TEACHER: Cannot manage courses

### Attendance Mutations

| Mutation | ROOT | ADMIN | TEACHER | Additional Restrictions |
|----------|------|-------|---------|------------------------|
| `setAttendance` | ✅ | ✅ | ✅ | TEACHER: Only for assigned courses |

**Rules:**
- ROOT: Can set attendance for any course
- ADMIN: Can set attendance for any course
- TEACHER: Can only set attendance for courses they are assigned to teach

---

## Gender-Based Restrictions

### Summary Table

| Resource Type | ROOT | MALE ADMIN | FEMALE ADMIN | TEACHER |
|---------------|------|-----------|-------------|---------|
| **Teachers** | Any | MALE only | FEMALE only | Own only |
| **Students** | Any | MALE or CHILD | FEMALE or CHILD | ❌ Blocked |
| **Courses** | Any | MALE or CHILD | FEMALE or CHILD | ❌ Blocked |
| **Admins** | Any | ❌ | ❌ | ❌ Blocked |
| **Degrees** | Any | Any | Any | ❌ Blocked |

### Detailed Rules

#### For Teachers

**ROOT:**
- ✅ Can create/update/delete teachers of any gender (MALE, FEMALE, CHILD)

**MALE ADMIN:**
- ✅ Can create/update/delete **MALE** teachers
- ❌ Cannot create/update/delete FEMALE teachers
- ❌ Cannot create/update/delete CHILD teachers

**FEMALE ADMIN:**
- ✅ Can create/update/delete **FEMALE** teachers
- ❌ Cannot create/update/delete MALE teachers
- ❌ Cannot create/update/delete CHILD teachers

**TEACHER:**
- ✅ Can update own profile only (ID must match)

#### For Students

**ROOT:**
- ✅ Can create/update/delete students of any gender

**MALE ADMIN:**
- ✅ Can create/update/delete **MALE** students
- ✅ Can create/update/delete **CHILD** students
- ❌ Cannot create/update/delete FEMALE students

**FEMALE ADMIN:**
- ✅ Can create/update/delete **FEMALE** students
- ✅ Can create/update/delete **CHILD** students
- ❌ Cannot create/update/delete MALE students

**TEACHER:**
- ❌ **Completely blocked** from all student management operations

#### For Courses

**ROOT:**
- ✅ Can create/update/delete courses of any gender

**MALE ADMIN:**
- ✅ Can create/update/delete **MALE** courses
- ✅ Can create/update/delete **CHILD** courses
- ❌ Cannot create/update/delete FEMALE courses

**FEMALE ADMIN:**
- ✅ Can create/update/delete **FEMALE** courses
- ✅ Can create/update/delete **CHILD** courses
- ❌ Cannot create/update/delete MALE courses

**TEACHER:**
- ❌ Cannot manage courses

---

## Ownership Rules

### Self-Update Rules

Users can update their own profiles with the following restrictions:

#### Admin Self-Update
- **`updateAdmin`**: Admin can update own profile (ID must match)
- Cannot change `isActive` status (ROOT only)
- Cannot change `username` (if restricted)

#### Teacher Self-Update
- **`updateTeacher`**: Teacher can update own profile (ID must match)
- Cannot change `isActive` status (ADMIN/ROOT only)
- Cannot change `degreeIds` (if restricted)
- Cannot change `username` (if restricted)

#### Profile Update
- **`updateProfile`**: Any authenticated user can update own profile
- Can change `tgUsername` and `phone` only
- No role restrictions

---

## Permission Matrix

### Complete Access Matrix

| Operation | Resource | ROOT | MALE ADMIN | FEMALE ADMIN | TEACHER |
|-----------|----------|------|-----------|--------------|---------|
| **View** | Admins | ✅ All | ✅ Own | ✅ Own | ❌ |
| **View** | Teachers | ✅ All | ✅ All | ✅ All | ✅ Own |
| **View** | Students | ✅ All | ✅ All | ✅ All | ✅ All |
| **View** | Courses | ✅ All | ✅ All | ✅ All | ✅ All |
| **View** | Degrees | ✅ All | ✅ All | ✅ All | ✅ All |
| **Create** | Admin | ✅ | ❌ | ❌ | ❌ |
| **Create** | Teacher | ✅ | ✅ (MALE) | ✅ (FEMALE) | ❌ |
| **Create** | Student | ✅ | ✅ (MALE/CHILD) | ✅ (FEMALE/CHILD) | ❌ |
| **Create** | Course | ✅ | ✅ (MALE/CHILD) | ✅ (FEMALE/CHILD) | ❌ |
| **Create** | Degree | ✅ | ✅ | ✅ | ❌ |
| **Update** | Own Profile | ✅ | ✅ | ✅ | ✅ |
| **Update** | Admin | ✅ | ✅ (own) | ✅ (own) | ❌ |
| **Update** | Teacher | ✅ | ✅ (MALE) | ✅ (FEMALE) | ✅ (own) |
| **Update** | Student | ✅ | ✅ (MALE/CHILD) | ✅ (FEMALE/CHILD) | ❌ |
| **Update** | Course | ✅ | ✅ (MALE/CHILD) | ✅ (FEMALE/CHILD) | ❌ |
| **Update** | Degree | ✅ | ✅ | ✅ | ❌ |
| **Delete** | Admin | ✅ | ❌ | ❌ | ❌ |
| **Delete** | Teacher | ✅ | ✅ (MALE) | ✅ (FEMALE) | ❌ |
| **Delete** | Student | ✅ | ✅ (MALE/CHILD) | ✅ (FEMALE/CHILD) | ❌ |
| **Delete** | Course | ✅ | ✅ (MALE/CHILD) | ✅ (FEMALE/CHILD) | ❌ |
| **Delete** | Degree | ✅ | ✅ | ✅ | ❌ |
| **Set** | Attendance | ✅ | ✅ | ✅ | ✅ (assigned) |

---

## Implementation Details

### Permission Checking Flow

1. **Authentication Check**: Verify JWT token is valid
2. **Role Check**: Verify user has required role
3. **Permission Check**: Verify user has specific permission (if applicable)
4. **Gender Check**: Verify gender restrictions (if applicable)
5. **Ownership Check**: Verify resource ownership (if applicable)

### Error Messages

Common permission error messages:

- `"Not Authorised!"` - General authorization failure
- `"You cannot [action] a [gender] [resource]. You can only [action] [your-gender] [resource]s."` - Gender restriction
- `"Teachers cannot [action] students. Only administrators can manage students."` - Teacher restriction
- `"You can only update your own profile."` - Ownership restriction
- `"Only ROOT can [action] admins."` - Role restriction

### Permission Caching

Permissions are cached for performance optimization. Cache is invalidated when:
- User role changes
- User permissions are updated
- System configuration changes

---

## Testing Permissions

### Test Cases

#### ROOT User
- ✅ Should access all queries
- ✅ Should perform all mutations
- ✅ Should bypass all gender restrictions
- ✅ Should manage admins

#### MALE ADMIN User
- ✅ Should view all resources
- ✅ Should create/update/delete MALE teachers
- ✅ Should create/update/delete MALE or CHILD students
- ✅ Should create/update/delete MALE or CHILD courses
- ❌ Should NOT create/update/delete FEMALE teachers
- ❌ Should NOT create/update/delete FEMALE students/courses
- ❌ Should NOT create/update/delete admins

#### FEMALE ADMIN User
- ✅ Should view all resources
- ✅ Should create/update/delete FEMALE teachers
- ✅ Should create/update/delete FEMALE or CHILD students
- ✅ Should create/update/delete FEMALE or CHILD courses
- ❌ Should NOT create/update/delete MALE teachers
- ❌ Should NOT create/update/delete MALE students/courses
- ❌ Should NOT create/update/delete admins

#### TEACHER User
- ✅ Should view own profile
- ✅ Should update own profile
- ✅ Should view students, courses, degrees
- ✅ Should set attendance for assigned courses
- ❌ Should NOT manage students
- ❌ Should NOT manage courses
- ❌ Should NOT manage degrees
- ❌ Should NOT manage teachers (except own)
- ❌ Should NOT manage admins

---

## Related Files

- **Permission Rules**: `src/permissions/index.js`
- **Role Constants**: `src/constants/roles.js`
- **Permission Utilities**: `src/utils/permissions.js`
- **Resolvers**: `src/graphql/resolvers/`

---

## Security Notes

1. **Always validate permissions server-side** - Never rely on client-side checks alone
2. **Use GraphQL Shield** - All permissions are enforced via GraphQL Shield middleware
3. **Audit logging** - All permission checks are logged for audit purposes
4. **Token validation** - JWT tokens are validated on every request
5. **Soft deletes** - Deleted resources are marked, not permanently removed

---

## Best Practices

1. **Principle of Least Privilege**: Grant minimum permissions necessary
2. **Role-Based Access**: Use roles for broad access control
3. **Permission-Based Access**: Use permissions for fine-grained control
4. **Gender Restrictions**: Respect gender-based business rules
5. **Ownership Validation**: Always verify resource ownership for self-updates
