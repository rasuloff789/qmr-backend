# Permissions Reference Guide

Complete documentation of all GraphQL queries and mutations and who can use them.

## Role Hierarchy

- **ROOT** - Highest privilege, can bypass all restrictions
- **ADMIN** - Administrative privileges with gender-based restrictions
- **TEACHER** - Limited privileges, cannot manage students

---

## QUERIES

### 1. `me`
- **Who can use**: Anyone (no authentication required)
- **Description**: Returns current user's profile information
- **Restrictions**: None

---

### 2. `getAdmins`
- **Who can use**: Users with `view_admins` permission
- **Description**: Get list of all admins
- **Restrictions**: Permission-based check

---

### 3. `getAdmin(id)`
- **Who can use**: 
  - **ROOT**: Can view any admin
  - **ADMIN**: Can only view their own admin profile (matching ID)
- **Description**: Get specific admin by ID
- **Restrictions**: Ownership check for admins

---

### 4. `getTeachers`
- **Who can use**: Users with `view_teachers` permission
- **Description**: Get list of all teachers
- **Restrictions**: Permission-based check

---

### 5. `getTeacher(id)`
- **Who can use**: 
  - **ROOT**: Can view any teacher
  - **ADMIN**: Can view any teacher
  - **TEACHER**: Can only view their own teacher profile (matching ID)
- **Description**: Get specific teacher by ID
- **Restrictions**: Ownership check for teachers

---

### 6. `getStudents`
- **Who can use**: Users with `view_students` permission
- **Description**: Get list of all students
- **Restrictions**: Permission-based check

---

### 7. `getStudent(id)`
- **Who can use**: 
  - **ROOT**: Can view any student
  - **ADMIN**: Can view any student
  - **TEACHER**: Can view any student
- **Description**: Get specific student by ID
- **Restrictions**: None for authenticated users with teacher role or higher

---

### 8. `getDegrees`
- **Who can use**: Any authenticated user (ROOT, ADMIN, TEACHER)
- **Description**: Get list of all degrees
- **Restrictions**: Must be authenticated

---

### 9. `getDegree(id)`
- **Who can use**: Any authenticated user (ROOT, ADMIN, TEACHER)
- **Description**: Get specific degree by ID
- **Restrictions**: Must be authenticated

---

### 10. `getCourses`
- **Who can use**: Any authenticated user (ROOT, ADMIN, TEACHER)
- **Description**: Get list of all courses
- **Restrictions**: Must be authenticated

---

### 11. `getCourse(id)`
- **Who can use**: Any authenticated user (ROOT, ADMIN, TEACHER)
- **Description**: Get specific course by ID
- **Restrictions**: Must be authenticated

---

### 12. `getAttendances`
- **Who can use**: Any authenticated user (ROOT, ADMIN, TEACHER)
- **Description**: Get list of attendance records
- **Restrictions**: Must be authenticated

---

### 13. `getDashboardStats`
- **Who can use**: Any authenticated user (ROOT, ADMIN, TEACHER)
- **Description**: Get dashboard statistics
- **Restrictions**: Must be authenticated

---

## MUTATIONS

### Authentication Mutations

#### 1. `login`
- **Who can use**: Anyone (public, no authentication required)
- **Description**: Authenticate user and get JWT token
- **Restrictions**: None

---

### Profile Management Mutations

#### 2. `updateProfile`
- **Who can use**: Any authenticated user (ROOT, ADMIN, TEACHER)
- **Description**: Update own profile information
- **Restrictions**: Must be authenticated

#### 3. `changePassword`
- **Who can use**: Any authenticated user (ROOT, ADMIN, TEACHER)
- **Description**: Change own password
- **Restrictions**: Must be authenticated

---

### Admin Management Mutations

#### 4. `addAdmin`
- **Who can use**: **ROOT ONLY**
- **Description**: Create a new admin user
- **Restrictions**: 
  - Only ROOT can create admins
  - Admins cannot create other admins

#### 5. `changeAdmin`
- **Who can use**: 
  - **ROOT**: Can update any admin
  - **ADMIN**: Can only update their own admin profile (matching ID)
- **Description**: Update admin user information
- **Restrictions**: Ownership check for admins

#### 6. `changeAdminActive`
- **Who can use**: **ROOT ONLY**
- **Description**: Activate/deactivate an admin account
- **Restrictions**: Only ROOT can change admin status

#### 7. `deleteAdmin`
- **Who can use**: Users with `delete_admin` permission (typically ROOT and admins with this permission)
- **Description**: Delete an admin user
- **Restrictions**: Permission-based check

---

### Teacher Management Mutations

#### 8. `addTeacher`
- **Who can use**: **ADMIN** or **ROOT**
- **Description**: Create a new teacher user
- **Restrictions**: 
  - **ROOT**: Can create teachers of any gender
  - **Male ADMIN**: Can only create **MALE** teachers
  - **Female ADMIN**: Can only create **FEMALE** teachers
  - CHILD teachers are NOT allowed

#### 9. `changeTeacher`
- **Who can use**: 
  - **ROOT**: Can update any teacher
  - **ADMIN**: Can update any teacher (with gender restrictions)
  - **TEACHER**: Can only update their own teacher profile (matching ID)
- **Description**: Update teacher user information
- **Restrictions**: 
  - Ownership check for teachers
  - Gender-based restrictions for admins:
    - **Male ADMIN**: Can only update **MALE** teachers
    - **Female ADMIN**: Can only update **FEMALE** teachers

#### 10. `changeTeacherActive`
- **Who can use**: **ADMIN** or **ROOT**
- **Description**: Activate/deactivate a teacher account
- **Restrictions**: 
  - **ROOT**: Can change status of any teacher
  - **Male ADMIN**: Can only change status of **MALE** teachers
  - **Female ADMIN**: Can only change status of **FEMALE** teachers

#### 11. `deleteTeacher`
- **Who can use**: Users with `delete_admin` permission (typically ROOT and admins)
- **Description**: Delete a teacher user
- **Restrictions**: 
  - Permission-based check
  - Gender-based restrictions for admins:
    - **Male ADMIN**: Can only delete **MALE** teachers
    - **Female ADMIN**: Can only delete **FEMALE** teachers
  - **ROOT**: Can delete any teacher

---

### Student Management Mutations

#### 12. `addStudent`
- **Who can use**: **ADMIN** or **ROOT** (Teachers are **BLOCKED**)
- **Description**: Create a new student user
- **Restrictions**: 
  - **ROOT**: Can create students of any gender
  - **Male ADMIN**: Can only create **MALE** or **CHILD** students
  - **Female ADMIN**: Can only create **FEMALE** or **CHILD** students
  - **TEACHERS**: Cannot create students (explicitly blocked)

#### 13. `changeStudent`
- **Who can use**: **ADMIN** or **ROOT** (Teachers are **BLOCKED**)
- **Description**: Update student user information
- **Restrictions**: 
  - **ROOT**: Can update any student
  - **Male ADMIN**: Can only update **MALE** or **CHILD** students
  - **Female ADMIN**: Can only update **FEMALE** or **CHILD** students
  - **TEACHERS**: Cannot update students (explicitly blocked)

#### 14. `changeStudentActive`
- **Who can use**: **ADMIN** or **ROOT** (Teachers are **BLOCKED**)
- **Description**: Activate/deactivate a student account
- **Restrictions**: 
  - **ROOT**: Can change status of any student
  - **Male ADMIN**: Can only change status of **MALE** or **CHILD** students
  - **Female ADMIN**: Can only change status of **FEMALE** or **CHILD** students
  - **TEACHERS**: Cannot change student status (explicitly blocked)

#### 15. `deleteStudent`
- **Who can use**: Users with `delete_admin` permission (typically ROOT and admins)
- **Description**: Delete a student user
- **Restrictions**: 
  - Permission-based check
  - Gender-based restrictions for admins:
    - **Male ADMIN**: Can only delete **MALE** or **CHILD** students
    - **Female ADMIN**: Can only delete **FEMALE** or **CHILD** students
  - **ROOT**: Can delete any student
  - **TEACHERS**: Cannot delete students (blocked via gender validation)

---

### Degree Management Mutations

#### 16. `addDegree`
- **Who can use**: **ADMIN** or **ROOT**
- **Description**: Create a new degree
- **Restrictions**: None (no gender restrictions)

#### 17. `updateDegree`
- **Who can use**: **ADMIN** or **ROOT**
- **Description**: Update a degree
- **Restrictions**: None (no gender restrictions)

#### 18. `deleteDegree`
- **Who can use**: **ADMIN** or **ROOT**
- **Description**: Delete a degree
- **Restrictions**: None (no gender restrictions)

---

### Course Management Mutations

#### 19. `addCourse`
- **Who can use**: **ADMIN** or **ROOT**
- **Description**: Create a new course
- **Restrictions**: 
  - **ROOT**: Can create courses of any gender
  - **Male ADMIN**: Can only create **MALE** or **CHILD** courses
  - **Female ADMIN**: Can only create **FEMALE** or **CHILD** courses

#### 20. `updateCourse`
- **Who can use**: **ADMIN** or **ROOT**
- **Description**: Update a course
- **Restrictions**: 
  - **ROOT**: Can update any course
  - **Male ADMIN**: Can only update **MALE** or **CHILD** courses
  - **Female ADMIN**: Can only update **FEMALE** or **CHILD** courses

#### 21. `deleteCourse`
- **Who can use**: **ADMIN** or **ROOT**
- **Description**: Delete a course
- **Restrictions**: 
  - **ROOT**: Can delete any course
  - **Male ADMIN**: Can only delete **MALE** or **CHILD** courses
  - **Female ADMIN**: Can only delete **FEMALE** or **CHILD** courses

#### 22. `addStudentToCourse`
- **Who can use**: **ADMIN** or **ROOT**
- **Description**: Enroll a student in a course
- **Restrictions**: No gender restrictions

#### 23. `removeStudentFromCourse`
- **Who can use**: **ADMIN** or **ROOT**
- **Description**: Remove a student from a course
- **Restrictions**: No gender restrictions

#### 24. `setAttendance`
- **Who can use**: **ROOT** or **TEACHER**
- **Description**: Set attendance for a student in a course
- **Restrictions**: 
  - Teachers can only set attendance for courses they are assigned to teach
  - Additional authorization check is performed in the resolver

---

## Gender-Based Restrictions Summary

### ROOT Users
- ✅ **Can manage everything** - No gender restrictions
- ✅ Can create/update/delete users of any gender

### ADMIN Users - Teachers
- **Male ADMIN**:
  - ✅ Can only manage **MALE** teachers (create, update, delete)
  - ❌ Cannot manage FEMALE or CHILD teachers

- **Female ADMIN**:
  - ✅ Can only manage **FEMALE** teachers (create, update, delete)
  - ❌ Cannot manage MALE or CHILD teachers

### ADMIN Users - Students & Courses
- **Male ADMIN**:
  - ✅ Can manage **MALE** students/courses (create, update, delete)
  - ✅ Can manage **CHILD** students/courses (create, update, delete)
  - ❌ Cannot manage FEMALE students/courses

- **Female ADMIN**:
  - ✅ Can manage **FEMALE** students/courses (create, update, delete)
  - ✅ Can manage **CHILD** students/courses (create, update, delete)
  - ❌ Cannot manage MALE students/courses

### TEACHER Users
- ✅ Can only manage resources of their own gender (when applicable)
- ❌ **Cannot manage students** (completely blocked)
- ✅ Can set attendance for their courses

---

## Key Rules

1. **ROOT** has unlimited access - bypasses all restrictions
2. **ADMIN** has gender-based restrictions:
   - Teachers: Strict same-gender only (no CHILD)
   - Students/Courses: Same gender OR CHILD allowed
3. **TEACHER** cannot manage students at all
4. Only **ROOT** can create admins
5. Only **ROOT** can change admin status
6. **TEACHER** can set attendance (with additional course assignment checks)

---

## Permission System

The system uses a hybrid approach:
- **Role-based**: Direct role checks (ROOT, ADMIN, TEACHER)
- **Permission-based**: Checks for specific permissions (e.g., `view_admins`, `create_teacher`)
- **Gender-based**: Validates gender matching for admins
- **Ownership-based**: Validates resource ownership for self-updates

All permissions are cached for performance optimization.
