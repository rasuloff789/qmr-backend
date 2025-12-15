# Student Management Guide

Complete guide to managing students in the QMR Backend system.

## Table of Contents

1. [Overview](#overview)
2. [Creating Students](#creating-students)
3. [Updating Students](#updating-students)
4. [Managing Student Status](#managing-student-status)
5. [Enrolling Students in Courses](#enrolling-students-in-courses)
6. [Validation Rules](#validation-rules)
7. [Permissions](#permissions)
8. [Best Practices](#best-practices)

---

## Overview

The student management system allows administrators to create, update, and manage student profiles. Students can be enrolled in courses and have attendance tracked.

### Key Features

- ✅ Create student profiles with comprehensive validation
- ✅ Update student information
- ✅ Manage active/inactive status
- ✅ Enroll students in courses
- ✅ Track attendance records
- ✅ Profile picture uploads

### Access Control

- **ROOT**: Full access to all students
- **ADMIN**: Can manage students of own gender or CHILD students
- **TEACHER**: Cannot manage students (view only)

---

## Creating Students

### Basic Student Creation

```graphql
mutation AddStudent(
  $username: String!
  $password: String!
  $fullname: String!
  $tgUsername: String!
  $birthDate: Date!
  $gender: Gender!
  $possibleDegrees: [ID!]!
  $phone: Phone
  $profilePicture: Upload
) {
  addStudent(
    username: $username
    password: $password
    fullname: $fullname
    tgUsername: $tgUsername
    birthDate: $birthDate
    gender: $gender
    possibleDegrees: $possibleDegrees
    phone: $phone
    profilePicture: $profilePicture
  ) {
    success
    message
    student {
      id
      username
      fullname
      birthDate
      phone
      tgUsername
      gender
      profilePicture
      isActive
      possibleDegrees {
        id
        name
      }
      createdAt
    }
    errors
    timestamp
  }
}
```

### Example Variables

```json
{
  "username": "student001",
  "password": "StudentPass123",
  "fullname": "John Doe",
  "tgUsername": "john_doe",
  "birthDate": "2005-03-20",
  "gender": "MALE",
  "possibleDegrees": ["1", "2"],
  "phone": "998901234567"
}
```

### Required Fields

- `username`: Unique username (4-32 chars, lowercase, alphanumeric)
- `password`: Secure password (min 8 chars, uppercase, lowercase, number)
- `fullname`: Full display name
- `tgUsername`: Telegram username (5-32 chars, alphanumeric + underscore)
- `birthDate`: Date of birth (YYYY-MM-DD, not in future)
- `gender`: MALE, FEMALE, or CHILD
- `possibleDegrees`: Array of at least one degree ID

### Optional Fields

- `phone`: International phone number (8-17 digits)
- `profilePicture`: Image file upload

---

## Updating Students

### Update Student Information

```graphql
mutation UpdateStudent(
  $id: ID!
  $username: String
  $fullname: String
  $birthDate: Date
  $phone: Phone
  $tgUsername: String
  $password: String
  $profilePicture: Upload
  $isActive: Boolean
) {
  updateStudent(
    id: $id
    username: $username
    fullname: $fullname
    birthDate: $birthDate
    phone: $phone
    tgUsername: $tgUsername
    password: $password
    profilePicture: $profilePicture
    isActive: $isActive
  ) {
    success
    message
    student {
      id
      username
      fullname
      isActive
    }
    errors
    timestamp
  }
}
```

**Note**: All fields except `id` are optional. Only include fields you want to update.

### Example: Update Phone and Telegram

```json
{
  "id": "1",
  "phone": "998907654321",
  "tgUsername": "new_telegram_username"
}
```

---

## Managing Student Status

### Toggle Active Status

```graphql
mutation UpdateStudentActive($id: ID!, $isActive: Boolean!) {
  updateStudentActive(id: $id, isActive: $isActive) {
    success
    message
    student {
      id
      username
      isActive
    }
    errors
    timestamp
  }
}
```

### Soft Delete Student

```graphql
mutation DeleteStudent($id: ID!) {
  deleteStudent(id: $id) {
    success
    message
    student {
      id
      username
    }
    errors
    timestamp
  }
}
```

**Note**: This is a soft delete. The student is marked as deleted but not permanently removed from the database.

---

## Enrolling Students in Courses

### Add Student to Course

```graphql
mutation AddStudentToCourse(
  $courseId: ID!
  $studentId: ID!
  $monthlyPayment: Int!
) {
  addStudentToCourse(
    courseId: $courseId
    studentId: $studentId
    monthlyPayment: $monthlyPayment
  ) {
    success
    message
    courseStudent {
      id
      course {
        id
        name
      }
      student {
        id
        fullname
      }
      monthlyPayment
      joinedAt
      isActive
    }
    errors
    timestamp
  }
}
```

### Remove Student from Course

```graphql
mutation RemoveStudentFromCourse($courseId: ID!, $studentId: ID!) {
  removeStudentFromCourse(courseId: $courseId, studentId: $studentId) {
    success
    message
    errors
    timestamp
  }
}
```

---

## Validation Rules

### Username

- **Format**: Lowercase letters and numbers only
- **Length**: 4-32 characters
- **Restrictions**: No spaces, no special characters
- **Uniqueness**: Must be unique across all students
- **Examples**: 
  - ✅ Valid: `john123`, `student01`
  - ❌ Invalid: `John123` (uppercase), `user name` (space), `ab` (too short)

### Password

- **Minimum Length**: 8 characters
- **Requirements**: 
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
- **Allowed Special Characters**: `@$!%*?&`
- **Examples**: 
  - ✅ Valid: `Password123`, `SecurePass1`
  - ❌ Invalid: `password` (no uppercase/number), `PASS123` (no lowercase), `Pass1` (too short)

### Telegram Username

- **Format**: Letters, numbers, and underscores only
- **Length**: 5-32 characters
- **Restrictions**: No spaces, no special characters except underscore
- **Normalization**: `@` prefix is automatically removed
- **Examples**: 
  - ✅ Valid: `john_doe`, `student123`, `@username` (normalized to `username`)
  - ❌ Invalid: `user name` (space), `ab` (too short), `user-name` (hyphen)

### Phone Number

- **Format**: International format
- **Length**: 8-17 digits
- **Normalization**: Non-digit characters are removed
- **Optional**: Can be omitted (null)
- **Examples**: 
  - ✅ Valid: `998901234567`, `+998 90 123 45 67` (normalized)
  - ❌ Invalid: `123` (too short), `abc123` (contains letters)

### Birth Date

- **Format**: `YYYY-MM-DD` (ISO 8601)
- **Restrictions**: 
  - Must be a valid date
  - Cannot be in the future
- **Examples**: 
  - ✅ Valid: `2000-01-15`, `1995-12-31`
  - ❌ Invalid: `01-15-2000` (wrong format), `2025-12-31` (future)

### Gender

- **Allowed Values**: `MALE`, `FEMALE`, `CHILD`
- **Case Sensitive**: Must match enum exactly

### Possible Degrees

- **Type**: Array of degree IDs
- **Required**: At least one degree ID must be provided
- **Format**: Each ID must be a valid integer that exists in the database

### Profile Picture

- **Type**: File upload (GraphQL Upload scalar)
- **Optional**: Can be omitted
- **Processing**: Handled by file upload utility
- **Supported Formats**: Image files (depends on configuration)

---

## Permissions

### Gender-Based Restrictions

#### ROOT
- ✅ Can create/update/delete students of any gender

#### MALE ADMIN
- ✅ Can create/update/delete **MALE** students
- ✅ Can create/update/delete **CHILD** students
- ❌ Cannot create/update/delete FEMALE students

#### FEMALE ADMIN
- ✅ Can create/update/delete **FEMALE** students
- ✅ Can create/update/delete **CHILD** students
- ❌ Cannot create/update/delete MALE students

#### TEACHER
- ❌ **Completely blocked** from all student management operations
- ✅ Can view students (read-only)

---

## Best Practices

### 1. Username Generation

- Use consistent naming conventions
- Include student identifier or serial number
- Avoid personal information in usernames

### 2. Password Security

- Generate secure passwords for students
- Consider password reset functionality
- Never store plain-text passwords

### 3. Data Validation

- Validate all inputs on the client side
- Handle validation errors gracefully
- Provide clear error messages

### 4. Profile Pictures

- Validate file types and sizes
- Handle upload errors
- Provide default avatars for missing pictures

### 5. Degree Assignment

- Ensure degrees exist before assigning
- Assign relevant degrees only
- Update degrees as student progresses

### 6. Course Enrollment

- Verify course capacity before enrollment
- Set appropriate monthly payment amounts
- Track enrollment dates

### 7. Status Management

- Use active/inactive status appropriately
- Soft delete instead of hard delete
- Maintain audit trail

---

## Error Handling

### Common Errors

#### Username Already Exists
```json
{
      "success": false,
  "errors": ["Username already exists"]
}
```

#### Invalid Password Format
```json
{
      "success": false,
  "errors": ["Password must be at least 8 characters and contain uppercase, lowercase, and number"]
}
```

#### Degree Not Found
```json
{
      "success": false,
  "errors": ["One or more degree IDs are invalid"]
}
```

#### Gender Restriction
```json
{
      "success": false,
  "errors": ["You cannot create a FEMALE student. You can only create MALE or CHILD students."]
}
```

---

## Related Documentation

- **API Reference**: See `docs/GRAPHQL_API.md`
- **Permissions**: See `docs/PERMISSIONS_REFERENCE.md`
- **Examples**: See `docs/EXAMPLES.md`

---

## Summary

Student management in QMR Backend provides:

- ✅ Comprehensive validation
- ✅ Flexible update operations
- ✅ Status management
- ✅ Course enrollment
- ✅ Profile picture support
- ✅ Gender-based access control

Follow the validation rules and best practices to ensure data integrity and system security.
