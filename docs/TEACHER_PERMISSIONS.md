# Teacher Permissions Reference

This document outlines all mutations and queries that teachers can access, along with their restrictions.

## Summary

**Teachers can:**
- View their own profile and update it
- View students (via queries)
- View courses, degrees, attendances, and dashboard stats
- Set attendance records
- Update their own password and profile

**Teachers CANNOT:**
- Manage students (add, update, delete, change active status)
- Manage teachers (add, update, delete, change active status) - except their own profile
- Manage courses (add, update, delete)
- Manage degrees (add, update, delete)
- Manage admins (any operation)
- Add/remove students from courses
- Access admin-specific queries

---

## QUERIES (Read Access)

### ✅ Allowed Queries

| Query | Access Level | Notes |
|-------|-------------|-------|
| `me` | ✅ Public | Can view own profile without auth |
| `getTeachers` | ✅ Yes | Can view teachers list |
| `getTeacher` | ✅ Own only | Can only view their own teacher profile (by ID) |
| `getStudents` | ❌ No | Cannot view students list (admin/root only) |
| `getStudent` | ❌ No | Cannot view student details (admin/root only) |
| `getDegrees` | ✅ Yes | Requires authentication |
| `getDegree` | ✅ Yes | Requires authentication |
| `getCourses` | ✅ Yes | Requires authentication |
| `getCourse` | ✅ Yes | Requires authentication |
| `getAttendances` | ✅ Yes | Requires authentication |
| `getDashboardStats` | ✅ Yes | Requires authentication |

### ❌ Blocked Queries

| Query | Reason |
|-------|--------|
| `getAdmins` | Requires `view_admins` permission (ADMIN/ROOT only) |
| `getAdmin` | Requires ADMIN role to view own admin, or ROOT for any |
| `getStudents` | Requires `view_students` permission (ADMIN/ROOT only) |
| `getStudent` | Requires `view_students` permission (ADMIN/ROOT only) |

---

## MUTATIONS (Write Access)

### ✅ Allowed Mutations

| Mutation | Access Level | Notes |
|----------|-------------|-------|
| `login` | ✅ Public | Anyone can login |
| `updateProfile` | ✅ Own | Can update own profile (tgUsername, phone) |
| `updatePassword` | ✅ Own | Can update own password |
| `updateTeacher` | ✅ Own only | Can only update their own teacher profile |
| `setAttendance` | ✅ Yes | Can set attendance records for courses |

### ❌ Blocked Mutations - Student Management

| Mutation | Reason |
|----------|--------|
| `addStudent` | Only ADMIN and ROOT can create students |
| `updateStudent` | Only ADMIN and ROOT can update students |
| `updateStudentActive` | Only ADMIN and ROOT can change student status |
| `deleteStudent` | Only ADMIN and ROOT can delete students |

**Error Message:** `"Teachers cannot [action] students. Only administrators can manage students."`

### ❌ Blocked Mutations - Teacher Management

| Mutation | Reason |
|----------|--------|
| `addTeacher` | Only ADMIN and ROOT can add teachers |
| `updateTeacherActive` | Only ADMIN and ROOT can change teacher status |
| `deleteTeacher` | Only ADMIN and ROOT can delete teachers |

**Note:** Teachers CAN update their own profile via `updateTeacher`, but ONLY their own (ID must match).

### ❌ Blocked Mutations - Course Management

| Mutation | Reason |
|----------|--------|
| `addCourse` | Only ADMIN and ROOT can add courses |
| `updateCourse` | Only ADMIN and ROOT can update courses |
| `deleteCourse` | Only ADMIN and ROOT can delete courses |
| `addStudentToCourse` | Only ADMIN and ROOT can add students to courses |
| `removeStudentFromCourse` | Only ADMIN and ROOT can remove students from courses |

### ❌ Blocked Mutations - Degree Management

| Mutation | Reason |
|----------|--------|
| `addDegree` | Only ADMIN and ROOT can add degrees |
| `updateDegree` | Only ADMIN and ROOT can update degrees |
| `deleteDegree` | Only ADMIN and ROOT can delete degrees |

### ❌ Blocked Mutations - Admin Management

| Mutation | Reason |
|----------|--------|
| `addAdmin` | Only ROOT can add admins |
| `updateAdmin` | Only ROOT can update admins, or ADMIN can update own |
| `updateAdminActive` | Only ROOT can change admin status |
| `deleteAdmin` | Only ROOT can delete admins |

---

## Permission Implementation Details

### Query Permissions

```javascript
// View Teachers
getTeachers: canViewTeachers  // Permission: "view_teachers"
getTeacher: canViewSpecificTeacher  // Can view own teacher or ADMIN/ROOT can view any

// View Students  
getStudents: canViewStudents  // Permission: "view_students"
getStudent: canViewSpecificStudent  // TEACHER_OR_HIGHER can view any

// Other queries
getDegrees: isAuthenticatedRule  // Any authenticated user
getCourses: isAuthenticatedRule  // Any authenticated user
getAttendances: isAuthenticatedRule  // Any authenticated user
getDashboardStats: isAuthenticatedRule  // Any authenticated user
```

### Mutation Permissions

```javascript
// Profile Management
updateProfile: isAuthenticatedRule  // Any authenticated user
updatePassword: isAuthenticatedRule  // Any authenticated user

// Teacher Management (Own Only)
updateTeacher: 
  - ROOT: Can update any teacher
  - ADMIN: Can update any teacher (with gender rules)
  - TEACHER: Can ONLY update own profile (ID must match)

// Attendance Management
setAttendance: createRoleRule([ROLES.ROOT, ROLES.TEACHER])  // ROOT or TEACHER

// Student Management (BLOCKED)
addStudent: 
  - Only ADMIN_OR_ROOT allowed
  - Teachers explicitly blocked
  
updateStudent:
  - Only ADMIN_OR_ROOT allowed
  - Teachers explicitly blocked
  
updateStudentActive:
  - Only ADMIN_OR_ROOT allowed
  - Teachers explicitly blocked

deleteStudent:
  - Only ADMIN_OR_ROOT allowed
```

### Gender-Based Restrictions

Teachers can only manage resources of their own gender:

```javascript
// In canManageByGender rule
if (hasRole(user, ROLES.TEACHER)) {
  // Block teachers from managing students
  if (resourceType === RESOURCE_TYPES.STUDENT) {
    throw new Error("Teachers cannot [action] students...");
  }
  
  // Teachers can only manage resources matching their gender
  if (user.gender === targetGender) return true;
  throw new Error("Teachers can only manage their own gender resources");
}
```

---

## Test Cases for Teachers

### ✅ Should Pass

1. **Login** - Teacher can login with valid credentials
2. **View Own Profile** - `getTeacher(id: teacherId)` where `id` matches teacher's ID
3. **Update Own Profile** - `updateTeacher(id: teacherId, ...)` where `id` matches
4. **Update Own Password** - `updatePassword(...)` for authenticated teacher
5. **Update Own Profile Info** - `updateProfile(tgUsername, phone)` for authenticated teacher
6. **View Students** - `getStudents()` and `getStudent(id: studentId)`
7. **View Courses** - `getCourses()` and `getCourse(id: courseId)`
8. **View Degrees** - `getDegrees()` and `getDegree(id: degreeId)`
9. **Set Attendance** - `setAttendance(...)` for courses

### ❌ Should Fail (Permission Denied)

1. **Add Student** - Should return "Not Authorised!" or "Teachers cannot create students..."
2. **Update Student** - Should return "Not Authorised!" or "Teachers cannot update students..."
3. **Delete Student** - Should return "Not Authorised!" or "Teachers cannot delete students..."
4. **Change Student Status** - Should return "Not Authorised!"
5. **Add Teacher** - Should return "Not Authorised!"
6. **Update Other Teacher** - `updateTeacher(id: otherTeacherId, ...)` should return "Not Authorised!"
7. **Delete Teacher** - Should return "Not Authorised!"
8. **Add Course** - Should return "Not Authorised!"
9. **Update Course** - Should return "Not Authorised!"
10. **Delete Course** - Should return "Not Authorised!"
11. **Add Degree** - Should return "Not Authorised!"
12. **Update Degree** - Should return "Not Authorised!"
13. **Delete Degree** - Should return "Not Authorised!"
14. **Add Student to Course** - Should return "Not Authorised!"
15. **Remove Student from Course** - Should return "Not Authorised!"
16. **View Admins** - `getAdmins()` should return "Not Authorised!"

---

## Known Issues

### Issue 1: `deleteStudent` uses `canDeleteAdmin` rule

**Location:** `src/permissions/index.js:601`

```javascript
deleteStudent: and(canDeleteAdmin, canManageByGender),
```

**Problem:** `canDeleteAdmin` checks for `delete_admin` permission, which is semantically incorrect for deleting students.

**Recommendation:** Should use a rule that only allows `ADMIN_OR_ROOT`:

```javascript
deleteStudent: and(
  rule()(async (_parent, _args, { user }) => {
    if (!user) return false;
    return hasAnyRole(user, ROLE_SETS.ADMIN_OR_ROOT);
  }),
  canManageByGender
),
```

**Status:** ⚠️ Should be fixed (currently works because `canDeleteAdmin` only allows ROOT, but semantically incorrect)

---

## Permission Constants

From `src/constants/roles.js`:

```javascript
[ROLES.TEACHER]: [
  "view_teachers",      // Can view teachers list
  "view_own_profile",   // Can view own profile
  "view_own_data",      // Can view own data
  "update_own_profile", // Can update own profile
  "upload_files",       // Can upload files
  "upload_profile_pictures", // Can upload profile pictures
]
```

**Role Sets:**
- `ROLE_SETS.ADMIN_OR_ROOT = [ROLES.ADMIN, ROLES.ROOT]`
- `ROLE_SETS.TEACHER_OR_HIGHER = [ROLES.TEACHER, ROLES.ADMIN, ROLES.ROOT]`

---

## Security Notes

1. **Ownership Validation:** Teachers can only update their own profile by ID match check
2. **Student Management:** Teachers are explicitly blocked from ALL student management operations
3. **Gender Matching:** Teachers can only interact with resources matching their gender (when applicable)
4. **Authentication Required:** Most queries require authentication (`isAuthenticatedRule`)
5. **Permission-Based Access:** Some queries use permission system (`view_teachers`, `view_students`, etc.)

---

## Related Files

- Permission Rules: `src/permissions/index.js`
- Role Constants: `src/constants/roles.js`
- Permission Utilities: `src/utils/permissions.js`
- Resolvers: `src/graphql/resolvers/`
- Schema: `src/graphql/schema/`

