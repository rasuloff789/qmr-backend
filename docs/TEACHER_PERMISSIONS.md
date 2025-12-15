# Teacher Guide

Complete guide for teachers using the QMR Backend system.

## Table of Contents

1. [Overview](#overview)
2. [Teacher Capabilities](#teacher-capabilities)
3. [Allowed Operations](#allowed-operations)
4. [Restricted Operations](#restricted-operations)
5. [Setting Attendance](#setting-attendance)
6. [Profile Management](#profile-management)
7. [Common Workflows](#common-workflows)

---

## Overview

Teachers have limited but focused permissions in the QMR Backend system. They can manage their own profile, view course and student information, and set attendance for courses they are assigned to teach.

### Key Points

- ✅ Can view own profile and update it
- ✅ Can view students, courses, degrees, and attendance
- ✅ Can set attendance for assigned courses
- ❌ Cannot manage students, courses, or degrees
- ❌ Cannot manage other teachers

---

## Teacher Capabilities

### ✅ Allowed Operations

| Operation | Description | Notes |
|-----------|-------------|-------|
| **View Own Profile** | View and update own teacher profile | ID must match |
| **View Students** | View student list and details | Read-only access |
| **View Courses** | View all courses | Read-only access |
| **View Degrees** | View all degrees | Read-only access |
| **View Attendance** | View attendance records | Can filter by course, student, date |
| **Set Attendance** | Mark students present/absent | Only for assigned courses |
| **Update Profile** | Update own profile information | Limited fields |
| **Change Password** | Update own password | Requires current password |

### ❌ Restricted Operations

| Operation | Reason |
|-----------|--------|
| **Manage Students** | Only administrators can manage students |
| **Manage Courses** | Only administrators can manage courses |
| **Manage Degrees** | Only administrators can manage degrees |
| **Manage Teachers** | Cannot create, update, or delete other teachers |
| **Manage Admins** | Only ROOT can manage admins |
| **View Admins** | Requires admin role |

---

## Allowed Operations

### View Own Profile

```graphql
query GetMyProfile {
  me {
    id
    username
    fullname
    birthDate
    phone
    tgUsername
    gender
    profilePicture
    isActive
    degrees {
      id
      name
    }
  }
}
```

### View Teacher Profile (Own Only)

```graphql
query GetTeacher($id: ID!) {
  getTeacher(id: $id) {
    id
    username
    fullname
    degrees {
      id
      name
    }
  }
}
```

**Note**: Can only view own profile. Attempting to view another teacher's profile will fail.

### View Students

```graphql
query GetStudents {
  getStudents {
    id
    fullname
    username
    gender
    isActive
  }
}
```

### View Courses

```graphql
query GetCourses {
  getCourses {
    id
    name
    description
    daysOfWeek
    teacher {
      id
      fullname
    }
    students {
      id
      student {
        id
        fullname
      }
    }
  }
}
```

### View Attendance

```graphql
query GetAttendances($courseId: ID, $startDate: Date, $endDate: Date) {
  getAttendances(
    courseId: $courseId
    startDate: $startDate
    endDate: $endDate
  ) {
    id
    date
    isPresent
    notes
    student {
      id
      fullname
    }
    course {
      id
      name
    }
  }
}
```

---

## Restricted Operations

### Student Management (Blocked)

All student management operations are blocked:

```graphql
# ❌ These will fail with "Not Authorised!" or "Teachers cannot manage students"
mutation AddStudent { ... }      # Blocked
mutation UpdateStudent { ... }   # Blocked
mutation DeleteStudent { ... }   # Blocked
mutation UpdateStudentActive { ... } # Blocked
```

**Error Message:**
```
"Teachers cannot [action] students. Only administrators can manage students."
```

### Course Management (Blocked)

All course management operations are blocked:

```graphql
# ❌ These will fail with "Not Authorised!"
mutation AddCourse { ... }        # Blocked
mutation UpdateCourse { ... }    # Blocked
mutation DeleteCourse { ... }    # Blocked
mutation AddStudentToCourse { ... } # Blocked
mutation RemoveStudentFromCourse { ... } # Blocked
```

### Degree Management (Blocked)

All degree management operations are blocked:

```graphql
# ❌ These will fail with "Not Authorised!"
mutation AddDegree { ... }       # Blocked
mutation UpdateDegree { ... }   # Blocked
mutation DeleteDegree { ... }   # Blocked
```

### Teacher Management (Blocked)

Cannot manage other teachers:

```graphql
# ❌ These will fail with "Not Authorised!"
mutation AddTeacher { ... }      # Blocked
mutation UpdateTeacher { ... }   # Blocked (except own profile)
mutation DeleteTeacher { ... }   # Blocked
mutation UpdateTeacherActive { ... } # Blocked
```

**Note**: Can update own profile via `updateTeacher` if ID matches.

---

## Setting Attendance

### Basic Attendance Setting

```graphql
mutation SetAttendance(
  $courseId: ID!
  $studentId: ID!
  $date: Date!
  $isPresent: Boolean!
  $notes: String
) {
  setAttendance(
    courseId: $courseId
    studentId: $studentId
    date: $date
    isPresent: $isPresent
    notes: $notes
  ) {
    success
    message
    attendance {
      id
      date
      isPresent
      notes
      student {
        id
        fullname
      }
      course {
        id
        name
      }
    }
    errors
  }
}
```

### Authorization Check

Teachers can only set attendance for courses they are assigned to teach. The system verifies:

1. Teacher is assigned to the course
2. Date matches course schedule
3. Student is enrolled in the course

**Error if not assigned:**
```json
{
  "success": false,
  "errors": ["You can only set attendance for courses you are assigned to teach"]
}
```

### Complete Workflow

1. **Get Assigned Courses**
```graphql
query GetMyCourses {
  getCourses {
    id
    name
    students {
      id
      student {
        id
        fullname
      }
    }
  }
}
```

2. **Set Attendance for Each Student**
```graphql
mutation SetAttendance($courseId: ID!, $studentId: ID!, $date: Date!, $isPresent: Boolean!) {
  setAttendance(
    courseId: $courseId
    studentId: $studentId
    date: $date
    isPresent: $isPresent
  ) {
    success
    message
  }
}
```

---

## Profile Management

### Update Own Profile

```graphql
mutation UpdateMyProfile($tgUsername: String, $phone: Phone) {
  updateProfile(tgUsername: $tgUsername, phone: $phone) {
    success
    message
    user {
      id
      username
      tgUsername
      phone
    }
    errors
  }
}
```

### Update Teacher Profile (Own Only)

```graphql
mutation UpdateTeacher(
  $id: ID!
  $fullname: String
  $phone: Phone
  $tgUsername: String
) {
  updateTeacher(
    id: $id
    fullname: $fullname
    phone: $phone
    tgUsername: $tgUsername
  ) {
    success
    message
    teacher {
      id
      fullname
    }
    errors
  }
}
```

**Note**: `id` must match the teacher's own ID. Cannot update other teachers.

### Change Password

```graphql
mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
  updatePassword(
    currentPassword: $currentPassword
    newPassword: $newPassword
  ) {
    success
    message
    errors
  }
}
```

---

## Common Workflows

### Daily Attendance Workflow

1. **Get Today's Courses**
```graphql
query GetTodayCourses {
  getCourses {
    id
    name
    daysOfWeek
    students {
      id
      student {
        id
        fullname
      }
    }
  }
}
```

2. **Filter Courses for Today**
```javascript
const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
const todayCourses = courses.filter(course => 
  course.daysOfWeek.includes(today)
);
```

3. **Set Attendance**
```graphql
mutation SetAttendance($courseId: ID!, $studentId: ID!, $date: Date!, $isPresent: Boolean!) {
  setAttendance(
    courseId: $courseId
    studentId: $studentId
    date: $date
    isPresent: $isPresent
  ) {
    success
    message
  }
}
```

### View Student Attendance History

```graphql
query GetStudentAttendance($studentId: ID!, $startDate: Date!, $endDate: Date!) {
  getAttendances(
    studentId: $studentId
    startDate: $startDate
    endDate: $endDate
  ) {
    id
    date
    isPresent
    notes
    course {
      id
      name
    }
  }
}
```

### View Course Attendance Summary

```graphql
query GetCourseAttendance($courseId: ID!, $startDate: Date!, $endDate: Date!) {
  getAttendances(
    courseId: $courseId
    startDate: $startDate
    endDate: $endDate
  ) {
    id
    date
    isPresent
    student {
      id
      fullname
    }
  }
}
```

---

## Error Handling

### Common Errors

#### Unauthorized Access
```json
{
  "errors": [
    {
      "message": "Not Authorised!",
      "extensions": {
        "code": "UNAUTHENTICATED"
      }
    }
  ]
}
```

#### Cannot Manage Students
```json
{
  "success": false,
  "errors": ["Teachers cannot create students. Only administrators can manage students."]
}
```

#### Cannot Set Attendance for Unassigned Course
```json
{
  "success": false,
  "errors": ["You can only set attendance for courses you are assigned to teach"]
}
```

#### Cannot View Other Teacher
```json
{
  "errors": [
    {
      "message": "Not Authorised!"
    }
  ]
}
```

---

## Best Practices

### 1. Profile Management

- Keep profile information up to date
- Use secure passwords
- Update Telegram username for communication

### 2. Attendance Setting

- Set attendance promptly after class
- Use notes for important information
- Verify course assignment before setting attendance

### 3. Data Viewing

- Use filters to find specific information
- Respect student privacy
- Don't share sensitive information

### 4. Error Handling

- Handle authorization errors gracefully
- Provide user-friendly error messages
- Log errors for debugging

---

## Related Documentation

- **Permissions**: See `docs/PERMISSIONS_REFERENCE.md`
- **Setting Attendance**: See `docs/SET_ATTENDANCE_GUIDE.md`
- **API Reference**: See `docs/GRAPHQL_API.md`

---

## Summary

Teachers in the QMR Backend system have focused permissions:

- ✅ Can manage own profile
- ✅ Can view students, courses, and attendance
- ✅ Can set attendance for assigned courses
- ❌ Cannot manage students, courses, or degrees
- ❌ Cannot manage other teachers

Follow the guidelines and workflows to effectively use the system within your permissions.
