# Add Student - Complete Guide

This guide shows you how to create a new student profile using the `addStudent` mutation.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Mutation Definition](#mutation-definition)
4. [Input Parameters](#input-parameters)
5. [Response Structure](#response-structure)
6. [Validation Rules](#validation-rules)
7. [Permissions](#permissions)
8. [Example Queries](#example-queries)
9. [Error Handling](#error-handling)
10. [Best Practices](#best-practices)

## Overview

The `addStudent` mutation allows authenticated administrators to create new student profiles in the system. The mutation includes comprehensive validation, optional profile picture upload, and automatic password hashing.

## Prerequisites

1. **Authentication**: You must be logged in with a valid JWT token
2. **Permissions**: You must have the `create_student` permission
3. **Gender Restrictions**: You can only create students matching your gender (unless you're ROOT)
4. **Required Data**: 
   - At least one degree must exist in the system (for `possibleDegrees`)
   - Valid degrees must be created before adding students

## Mutation Definition

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
      createdAt
      possibleDegrees {
        id
        name
      }
    }
    errors
    timestamp
  }
}
```

## Input Parameters

### Required Parameters

| Parameter | Type | Description | Validation |
|-----------|------|-------------|------------|
| `username` | `String!` | Unique username for login | 4-32 lowercase letters/numbers, no spaces |
| `password` | `String!` | Plain-text password | Min 8 chars, uppercase, lowercase, number |
| `fullname` | `String!` | Full display name | Non-empty string |
| `tgUsername` | `String!` | Telegram username | 5-32 chars, letters/numbers/underscore only |
| `birthDate` | `Date!` | Date of birth | YYYY-MM-DD format, not in future |
| `gender` | `Gender!` | Gender classification | MALE, FEMALE, or CHILD |
| `possibleDegrees` | `[ID!]!` | Array of degree IDs | At least one valid degree ID required |

### Optional Parameters

| Parameter | Type | Description | Validation |
|-----------|------|-------------|------------|
| `phone` | `Phone` | International phone number | 8-17 digits, international format |
| `profilePicture` | `Upload` | Profile picture file | Image file (processed by fileUpload utility) |

## Response Structure

The mutation returns an `AddStudentResponse` object:

```graphql
type AddStudentResponse {
  success: Boolean!      # Operation success flag
  message: String!       # Human-readable summary
  student: Student       # Created student record (null on failure)
  errors: [String!]      # Array of validation/error messages
  timestamp: String      # ISO timestamp of operation
}
```

### Student Object Fields

When successful, the `student` field contains:

- `id`: Unique identifier
- `username`: Login username
- `fullname`: Display name
- `birthDate`: Date of birth
- `phone`: Normalized phone number (if provided)
- `tgUsername`: Normalized Telegram username
- `gender`: Gender classification
- `profilePicture`: URL path to profile picture (if uploaded)
- `isActive`: Active status (defaults to `true`)
- `isDeleted`: Soft delete flag (defaults to `false`)
- `createdAt`: Creation timestamp
- `possibleDegrees`: Array of associated degree objects

## Validation Rules

### Username Validation

- **Format**: Lowercase letters and numbers only
- **Length**: 4-32 characters
- **Restrictions**: No spaces, no special characters
- **Uniqueness**: Must be unique across all students
- **Example Valid**: `john123`, `student01`
- **Example Invalid**: `John123` (uppercase), `user name` (space), `ab` (too short)

### Password Validation

- **Minimum Length**: 8 characters
- **Requirements**: 
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
- **Allowed Special Characters**: `@$!%*?&`
- **Example Valid**: `Password123`, `SecurePass1`
- **Example Invalid**: `password` (no uppercase/number), `PASS123` (no lowercase), `Pass1` (too short)

### Telegram Username Validation

- **Format**: Letters, numbers, and underscores only
- **Length**: 5-32 characters
- **Restrictions**: No spaces, no special characters except underscore
- **Normalization**: `@` prefix is automatically removed if present
- **Example Valid**: `john_doe`, `student123`, `@username` (normalized to `username`)
- **Example Invalid**: `user name` (space), `ab` (too short), `user-name` (hyphen not allowed)

### Phone Number Validation

- **Format**: International format
- **Length**: 8-17 digits
- **Normalization**: Non-digit characters are removed
- **Optional**: Can be omitted (null)
- **Example Valid**: `998901234567`, `+998 90 123 45 67` (normalized to digits)
- **Example Invalid**: `123` (too short), `abc123` (contains letters)

### Birth Date Validation

- **Format**: `YYYY-MM-DD` (ISO 8601 date format)
- **Restrictions**: 
  - Must be a valid date
  - Cannot be in the future
- **Example Valid**: `2000-01-15`, `1995-12-31`
- **Example Invalid**: `01-15-2000` (wrong format), `2025-12-31` (future date)

### Gender Validation

- **Allowed Values**: `MALE`, `FEMALE`, `CHILD`
- **Case Sensitive**: Must match enum exactly

### Possible Degrees Validation

- **Type**: Array of degree IDs
- **Required**: At least one degree ID must be provided
- **Format**: Each ID must be a valid integer that exists in the database
- **Relationship**: Creates connections to existing Degree records

### Profile Picture Validation

- **Type**: File upload (GraphQL Upload scalar)
- **Optional**: Can be omitted
- **Processing**: Handled by `processUploadedFile` utility
- **Supported Formats**: Depends on fileUpload utility configuration
- **Error Handling**: Returns error if upload fails

## Permissions

### Required Permissions

1. **Authentication**: User must be logged in
2. **Permission**: User must have `create_student` permission
3. **Role-Based Access**: 
   - `ROOT`: Can create students of any gender
   - `ADMIN`: Can create students matching their own gender
   - `TEACHER`: Cannot create students
   - `STUDENT`: Cannot create students

### Gender-Based Restrictions

- Administrators can only create students matching their own gender
- ROOT users can create students of any gender
- The system validates gender matching before allowing creation

## Example Queries

### 1. Basic Student Creation

Create a student with minimal required fields:

```graphql
mutation CreateBasicStudent {
  addStudent(
    username: "john_doe"
    password: "SecurePass123"
    fullname: "John Doe"
    tgUsername: "johndoe"
    birthDate: "2000-01-15"
    gender: MALE
    possibleDegrees: ["1", "2"]
  ) {
    success
    message
    student {
      id
      username
      fullname
      gender
      isActive
    }
    errors
  }
}
```

### 2. Student with Phone Number

Create a student including phone number:

```graphql
mutation CreateStudentWithPhone {
  addStudent(
    username: "jane_smith"
    password: "MyPassword123"
    fullname: "Jane Smith"
    tgUsername: "janesmith"
    birthDate: "1998-05-20"
    gender: FEMALE
    possibleDegrees: ["1"]
    phone: "998901234567"
  ) {
    success
    message
    student {
      id
      username
      fullname
      phone
      tgUsername
      createdAt
    }
    errors
  }
}
```

### 3. Student with Profile Picture

Create a student with profile picture upload (using variables):

```graphql
mutation CreateStudentWithPicture(
  $username: String!
  $password: String!
  $fullname: String!
  $tgUsername: String!
  $birthDate: Date!
  $gender: Gender!
  $possibleDegrees: [ID!]!
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
    profilePicture: $profilePicture
  ) {
    success
    message
    student {
      id
      username
      fullname
      profilePicture
      possibleDegrees {
        id
        name
      }
    }
    errors
    timestamp
  }
}
```

**Variables:**
```json
{
  "username": "alice_wonder",
  "password": "Secure123",
  "fullname": "Alice Wonder",
  "tgUsername": "alicewonder",
  "birthDate": "2002-03-10",
  "gender": "FEMALE",
  "possibleDegrees": ["1", "3"],
  "profilePicture": null
}
```

### 4. Complete Student Creation

Create a student with all fields:

```graphql
mutation CreateCompleteStudent {
  addStudent(
    username: "bob_jones"
    password: "Password123"
    fullname: "Bob Jones"
    tgUsername: "bobjones"
    birthDate: "1999-11-25"
    gender: MALE
    possibleDegrees: ["1", "2", "3"]
    phone: "+998 90 123 45 67"
    profilePicture: null
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
      isDeleted
      createdAt
      possibleDegrees {
        id
        name
        createdAt
      }
    }
    errors
    timestamp
  }
}
```

### 5. Using Variables (Recommended)

Best practice: Use variables for all inputs:

```graphql
mutation CreateStudent(
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
      createdAt
      possibleDegrees {
        id
        name
      }
    }
    errors
    timestamp
  }
}
```

**Variables:**
```json
{
  "username": "student_001",
  "password": "SecurePass123",
  "fullname": "Student One",
  "tgUsername": "student001",
  "birthDate": "2001-06-15",
  "gender": "MALE",
  "possibleDegrees": ["1"],
  "phone": "998901234567",
  "profilePicture": null
}
```

## Error Handling

### Success Response

```json
{
  "data": {
    "addStudent": {
      "success": true,
      "message": "Student user created successfully",
      "student": {
        "id": "1",
        "username": "john_doe",
        "fullname": "John Doe",
        "birthDate": "2000-01-15",
        "phone": "998901234567",
        "tgUsername": "johndoe",
        "gender": "MALE",
        "profilePicture": null,
        "isActive": true,
        "createdAt": "2024-01-15T10:30:00.000Z",
        "possibleDegrees": [
          {
            "id": "1",
            "name": "Bachelor's Degree"
          }
        ]
      },
      "errors": [],
      "timestamp": "2024-01-15T10:30:00.123Z"
    }
  }
}
```

### Validation Error Examples

#### Username Validation Error

```json
{
  "data": {
    "addStudent": {
      "success": false,
      "message": "Validation failed",
      "student": null,
      "errors": [
        "Username must contain only lowercase letters and numbers, length 4-32 characters."
      ],
      "timestamp": "2024-01-15T10:30:00.123Z"
    }
  }
}
```

#### Password Validation Error

```json
{
  "data": {
    "addStudent": {
      "success": false,
      "message": "Validation failed",
      "student": null,
      "errors": [
        "Password must be at least 8 characters with uppercase, lowercase, and number."
      ],
      "timestamp": "2024-01-15T10:30:00.123Z"
    }
  }
}
```

#### Username Already Exists

```json
{
  "data": {
    "addStudent": {
      "success": false,
      "message": "Username already exists",
      "student": null,
      "errors": [
        "Username 'john_doe' is already in use"
      ],
      "timestamp": "2024-01-15T10:30:00.123Z"
    }
  }
}
```

#### Telegram Username Validation Error

```json
{
  "data": {
    "addStudent": {
      "success": false,
      "message": "Validation failed",
      "student": null,
      "errors": [
        "Invalid format. Telegram username must contain only letters, numbers, and \"_\", length 5-32 characters."
      ],
      "timestamp": "2024-01-15T10:30:00.123Z"
    }
  }
}
```

#### Phone Number Validation Error

```json
{
  "data": {
    "addStudent": {
      "success": false,
      "message": "Validation failed",
      "student": null,
      "errors": [
        "Invalid phone format. Expected international format with 8-17 digits."
      ],
      "timestamp": "2024-01-15T10:30:00.123Z"
    }
  }
}
```

#### Birth Date Validation Error

```json
{
  "data": {
    "addStudent": {
      "success": false,
      "message": "Validation failed",
      "student": null,
      "errors": [
        "Invalid birth date format. Expected: YYYY-MM-DD"
      ],
      "timestamp": "2024-01-15T10:30:00.123Z"
    }
  }
}
```

#### File Upload Error

```json
{
  "data": {
    "addStudent": {
      "success": false,
      "message": "File upload failed",
      "student": null,
      "errors": [
        "Invalid file type. Only images are allowed."
      ],
      "timestamp": "2024-01-15T10:30:00.123Z"
    }
  }
}
```

#### Server Error

```json
{
  "data": {
    "addStudent": {
      "success": false,
      "message": "Failed to create student user",
      "student": null,
      "errors": [
        "An unexpected error occurred"
      ],
      "timestamp": "2024-01-15T10:30:00.123Z"
    }
  }
}
```

## Best Practices

### 1. Input Validation

- **Always validate on frontend**: Perform client-side validation before sending the mutation
- **Check username availability**: Consider checking username uniqueness before form submission
- **Validate date format**: Ensure birth date is in YYYY-MM-DD format
- **Password strength**: Guide users to create strong passwords

### 2. Error Handling

- **Check `success` field**: Always check the `success` boolean before accessing `student`
- **Display errors**: Show all errors from the `errors` array to users
- **Handle edge cases**: Account for network errors, authentication failures, etc.

### 3. Security

- **Never log passwords**: Don't log or store plain-text passwords
- **Use HTTPS**: Always use HTTPS in production
- **Validate permissions**: Ensure user has proper permissions before showing the form
- **Rate limiting**: Consider implementing rate limiting on the frontend

### 4. User Experience

- **Clear error messages**: Display validation errors clearly to users
- **Loading states**: Show loading indicators during mutation execution
- **Success feedback**: Confirm successful student creation
- **Form reset**: Clear form after successful creation

### 5. Data Management

- **Degree validation**: Ensure degrees exist before creating students
- **Profile pictures**: Handle upload errors gracefully
- **Phone normalization**: Understand that phone numbers are normalized automatically
- **Telegram username**: Note that `@` prefix is automatically removed

### 6. Code Examples

#### Frontend Validation Example (JavaScript)

```javascript
function validateStudentInput(data) {
  const errors = [];
  
  // Username validation
  if (!/^[a-z0-9]{4,32}$/.test(data.username)) {
    errors.push('Username must be 4-32 lowercase letters/numbers');
  }
  
  // Password validation
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/.test(data.password)) {
    errors.push('Password must be 8+ chars with uppercase, lowercase, and number');
  }
  
  // Telegram username validation
  if (!/^[a-zA-Z0-9_]{5,32}$/.test(data.tgUsername)) {
    errors.push('Telegram username must be 5-32 chars (letters, numbers, underscore)');
  }
  
  // Birth date validation
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(data.birthDate)) {
    errors.push('Birth date must be in YYYY-MM-DD format');
  }
  
  // Check if date is in future
  const birthDate = new Date(data.birthDate);
  if (birthDate > new Date()) {
    errors.push('Birth date cannot be in the future');
  }
  
  // Possible degrees validation
  if (!data.possibleDegrees || data.possibleDegrees.length === 0) {
    errors.push('At least one degree must be selected');
  }
  
  return errors;
}
```

#### GraphQL Client Example (Apollo)

```javascript
import { gql, useMutation } from '@apollo/client';

const ADD_STUDENT = gql`
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
      }
      errors
    }
  }
`;

function useAddStudent() {
  const [addStudent, { loading, error }] = useMutation(ADD_STUDENT);
  
  const createStudent = async (studentData) => {
    try {
      const { data } = await addStudent({
        variables: studentData,
      });
      
      if (data.addStudent.success) {
        return { success: true, student: data.addStudent.student };
      } else {
        return { success: false, errors: data.addStudent.errors };
      }
    } catch (err) {
      return { success: false, errors: [err.message] };
    }
  };
  
  return { createStudent, loading, error };
}
```

## Related Documentation

- [GraphQL API Documentation](./GRAPHQL_API.md)
- [Examples](./EXAMPLES.md)
- [Student Management Queries](./ATTENDANCE_QUERIES.md)

## Support

For issues or questions:
1. Check the error messages in the response
2. Verify your authentication token is valid
3. Ensure you have the required permissions
4. Review the validation rules above
5. Check that required degrees exist in the system

