# GraphQL API Reference

Complete reference documentation for the QMR Backend GraphQL API.

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Authentication](#authentication)
4. [Queries](#queries)
5. [Mutations](#mutations)
6. [Types & Schemas](#types--schemas)
7. [Error Handling](#error-handling)
8. [Best Practices](#best-practices)

---

## Overview

The QMR Backend provides a comprehensive GraphQL API for managing an educational management system. The API supports:

- **User Management**: Root, Admin, Teacher, and Student accounts
- **Course Management**: Course creation, scheduling, and enrollment
- **Attendance Tracking**: Student attendance records with validation
- **Dashboard Analytics**: Statistical data and reports
- **Role-Based Access Control**: Granular permissions based on user roles

### API Endpoints

- **GraphQL Endpoint**: `http://localhost:4000/graphql`
- **Health Check**: `http://localhost:4000/health`
- **Static Assets**: `http://localhost:4000/uploads/...`

### Transport

- **Protocol**: HTTP POST (standard GraphQL over HTTP)
- **WebSocket Subscriptions**: Not implemented
- **File Uploads**: Multipart requests using GraphQL `Upload` scalar

---

## Getting Started

### Prerequisites

1. Node.js v18 or higher
2. PostgreSQL database
3. Valid JWT token for authenticated operations

### Basic Request Format

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{ "query": "{ getStudents { id fullname } }" }'
```

### Headers

- **Content-Type**: `application/json` (for standard requests)
- **Authorization**: `Bearer <JWT_TOKEN>` (for authenticated operations)
- **Multipart**: Required for file uploads

### Date Formats

- **Date Scalar**: ISO 8601 format `YYYY-MM-DD` (e.g., `"2024-01-15"`)
- **DateTime Scalar**: ISO 8601 format `YYYY-MM-DDTHH:mm:ss.sssZ` (e.g., `"2024-01-15T09:00:00Z"`)

---

## Authentication

### Login Mutation

Authenticate a user and receive a JWT token.

```graphql
mutation Login($username: String!, $password: String!, $userType: String!) {
  login(username: $username, password: $password, userType: $userType) {
    success
    message
    token
    user {
      id
      username
      fullname
      role
      createdAt
    }
  }
}
```

**Parameters:**
- `username`: User's username
- `password`: Plain-text password
- `userType`: `"root"`, `"admin"`, or `"teacher"` (student login not implemented)

**Response:**
- `token`: JWT token (valid for 10 days by default)
- `user`: Authenticated user information

**Example:**
```json
{
  "username": "admin001",
  "password": "SecurePass123",
  "userType": "admin"
}
```

### Token Usage

Include the token in the `Authorization` header for all authenticated requests:

```
Authorization: Bearer <your-jwt-token>
```

### Root User Setup

Default root user can be seeded with:
```bash
npm run seed:root
```

Default credentials:
- Username: `root`
- Password: `Root123!`

Override with environment variables: `ROOT_USERNAME`, `ROOT_PASSWORD`

---

## Queries

### User Queries

#### `me`

Get current authenticated user's profile.

**Access**: Any authenticated user

```graphql
query Me {
  me {
    id
    username
    fullname
    role
    birthDate
    phone
    tgUsername
    isActive
    createdAt
  }
}
```

#### `getAdmins`

Get list of all admin users.

**Access**: ROOT, ADMIN (admin can only see self in `getAdmin`)

```graphql
query GetAdmins {
  getAdmins {
    id
    username
    fullname
    birthDate
    phone
    tgUsername
    gender
    isActive
    createdAt
  }
}
```

#### `getAdmin(id: ID!)`

Get specific admin by ID.

**Access**: ROOT (any admin), ADMIN (own profile only)

```graphql
query GetAdmin($id: ID!) {
  getAdmin(id: $id) {
    id
    username
    fullname
    birthDate
    phone
    tgUsername
    gender
    isActive
    createdAt
  }
}
```

#### `getTeachers`

Get list of all teachers.

**Access**: Any authenticated user

```graphql
query GetTeachers {
  getTeachers {
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
    createdAt
  }
}
```

#### `getTeacher(id: ID!)`

Get specific teacher by ID.

**Access**: ROOT, ADMIN (any teacher), TEACHER (own profile only)

```graphql
query GetTeacher($id: ID!) {
  getTeacher(id: $id) {
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
    createdAt
  }
}
```

#### `getStudents`

Get list of all students.

**Access**: ROOT, ADMIN, TEACHER

```graphql
query GetStudents {
  getStudents {
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
}
```

#### `getStudent(id: ID!)`

Get specific student by ID.

**Access**: ROOT, ADMIN, TEACHER

```graphql
query GetStudent($id: ID!) {
  getStudent(id: $id) {
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
}
```

### Degree Queries

#### `getDegrees`

Get list of all degrees.

**Access**: Any authenticated user

```graphql
query GetDegrees {
  getDegrees {
    id
    name
    createdAt
  }
}
```

#### `getDegree(id: ID!)`

Get specific degree by ID with related data.

**Access**: Any authenticated user

```graphql
query GetDegree($id: ID!) {
  getDegree(id: $id) {
    id
    name
    createdAt
    teachers {
      id
      fullname
    }
    courses {
      id
      name
    }
  }
}
```

### Course Queries

#### `getCourses`

Get list of all courses with related data.

**Access**: Any authenticated user

```graphql
query GetCourses {
  getCourses {
    id
    name
    description
    daysOfWeek
    gender
    startAt
    endAt
    startTime
    endTime
    teacher {
      id
      fullname
      username
    }
    degrees {
      id
      name
    }
    students {
      id
      student {
        id
        fullname
      }
      monthlyPayment
      isActive
    }
    createdAt
  }
}
```

#### `getCourse(id: ID!)`

Get specific course by ID.

**Access**: Any authenticated user

```graphql
query GetCourse($id: ID!) {
  getCourse(id: $id) {
    id
    name
    description
    daysOfWeek
    gender
    startAt
    endAt
    startTime
    endTime
    teacher {
      id
      fullname
      username
    }
    degrees {
      id
      name
    }
    students {
      id
      student {
        id
        fullname
      }
      monthlyPayment
      joinedAt
      isActive
    }
    createdAt
  }
}
```

### Attendance Queries

#### `getAttendances`

Get attendance records with optional filters.

**Access**: ROOT, ADMIN, TEACHER

**Parameters:**
- `courseId` (optional): Filter by course
- `studentId` (optional): Filter by student
- `startDate` (optional): Filter from date
- `endDate` (optional): Filter to date

```graphql
query GetAttendances(
  $courseId: ID
  $studentId: ID
  $startDate: Date
  $endDate: Date
) {
  getAttendances(
    courseId: $courseId
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
    student {
      id
      fullname
      username
    }
    createdAt
  }
}
```

### Dashboard Queries

#### `getDashboardStats`

Get aggregated dashboard statistics.

**Access**: ROOT, ADMIN

```graphql
query GetDashboardStats {
  getDashboardStats {
    totalStudents
    totalTeachers
    totalAdmins
    activeStudents
    activeTeachers
    activeAdmins
    totalUsers
    activeUsers
    averageStudentAge
    averageTeacherAge
    averageAdminAge
    studentGenderDistribution {
      male
      female
      child
    }
    teacherGenderDistribution {
      male
      female
      child
    }
  }
}
```

---

## Mutations

### Authentication Mutations

#### `login`

See [Authentication](#authentication) section above.

### Profile Management Mutations

#### `updateProfile`

Update current user's profile (Telegram username and phone).

**Access**: Any authenticated user

```graphql
mutation UpdateProfile($tgUsername: String, $phone: Phone) {
  updateProfile(tgUsername: $tgUsername, phone: $phone) {
    success
    message
    user {
      id
      username
      fullname
      tgUsername
      phone
      role
    }
    errors
    timestamp
  }
}
```

#### `updatePassword`

Change current user's password.

**Access**: Any authenticated user

```graphql
mutation UpdatePassword($currentPassword: String!, $newPassword: String!) {
  updatePassword(currentPassword: $currentPassword, newPassword: $newPassword) {
    success
    message
    errors
    timestamp
  }
}
```

### Admin Management Mutations

#### `addAdmin`

Create a new admin user.

**Access**: ROOT only

```graphql
mutation AddAdmin(
  $username: String!
  $password: String!
  $fullname: String!
  $tgUsername: String!
  $birthDate: Date!
  $phone: Phone!
  $gender: Gender!
) {
  addAdmin(
    username: $username
    password: $password
    fullname: $fullname
    tgUsername: $tgUsername
    birthDate: $birthDate
    phone: $phone
    gender: $gender
  ) {
    success
    message
    admin {
      id
      username
      fullname
      tgUsername
      phone
      gender
      isActive
      createdAt
    }
    errors
    timestamp
  }
}
```

#### `updateAdmin`

Update an admin user.

**Access**: ROOT (any admin), ADMIN (own profile only)

```graphql
mutation UpdateAdmin(
  $id: ID!
  $username: String
  $fullname: String
  $birthDate: Date
  $phone: Phone
  $tgUsername: String
  $password: String
  $isActive: Boolean
) {
  updateAdmin(
    id: $id
    username: $username
    fullname: $fullname
    birthDate: $birthDate
    phone: $phone
    tgUsername: $tgUsername
    password: $password
    isActive: $isActive
  ) {
    success
    message
    admin {
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

#### `updateAdminActive`

Toggle admin active status.

**Access**: ROOT only

```graphql
mutation UpdateAdminActive($adminId: ID!, $isActive: Boolean!) {
  updateAdminActive(adminId: $adminId, isActive: $isActive) {
    success
    message
    admin {
      id
      username
      isActive
    }
    errors
    timestamp
  }
}
```

#### `deleteAdmin`

Soft delete an admin user.

**Access**: ROOT only

```graphql
mutation DeleteAdmin($adminId: ID!) {
  deleteAdmin(adminId: $adminId) {
    success
    message
    admin {
      id
      username
    }
    errors
    timestamp
  }
}
```

### Teacher Management Mutations

#### `addTeacher`

Create a new teacher user.

**Access**: ROOT, ADMIN

```graphql
mutation AddTeacher(
  $username: String!
  $password: String!
  $fullname: String!
  $tgUsername: String!
  $birthDate: Date!
  $phone: Phone!
  $gender: Gender!
  $degreeIds: [ID!]
  $profilePicture: Upload
) {
  addTeacher(
    username: $username
    password: $password
    fullname: $fullname
    tgUsername: $tgUsername
    birthDate: $birthDate
    phone: $phone
    gender: $gender
    degreeIds: $degreeIds
    profilePicture: $profilePicture
  ) {
    success
    message
    teacher {
      id
      username
      fullname
      gender
      isActive
      degrees {
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

#### `updateTeacher`

Update a teacher user.

**Access**: ROOT (any teacher), ADMIN (any teacher), TEACHER (own profile only)

```graphql
mutation UpdateTeacher(
  $id: ID!
  $username: String
  $fullname: String
  $birthDate: Date
  $phone: Phone
  $tgUsername: String
  $password: String
  $profilePicture: Upload
  $degreeIds: [ID!]
  $isActive: Boolean
) {
  updateTeacher(
    id: $id
    username: $username
    fullname: $fullname
    birthDate: $birthDate
    phone: $phone
    tgUsername: $tgUsername
    password: $password
    profilePicture: $profilePicture
    degreeIds: $degreeIds
    isActive: $isActive
  ) {
    success
    message
    teacher {
      id
      username
      fullname
      degrees {
        id
        name
      }
      isActive
    }
    errors
    timestamp
  }
}
```

#### `updateTeacherActive`

Toggle teacher active status.

**Access**: ROOT, ADMIN

```graphql
mutation UpdateTeacherActive($id: ID!, $isActive: Boolean!) {
  updateTeacherActive(id: $id, isActive: $isActive) {
    success
    message
    teacher {
      id
      username
      isActive
    }
    errors
    timestamp
  }
}
```

#### `deleteTeacher`

Soft delete a teacher user.

**Access**: ROOT, ADMIN

```graphql
mutation DeleteTeacher($id: ID!) {
  deleteTeacher(id: $id) {
    success
    message
    teacher {
      id
      username
    }
    errors
    timestamp
  }
}
```

### Student Management Mutations

#### `addStudent`

Create a new student user.

**Access**: ROOT, ADMIN

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
      gender
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

#### `updateStudent`

Update a student user.

**Access**: ROOT, ADMIN

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

#### `updateStudentActive`

Toggle student active status.

**Access**: ROOT, ADMIN

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

#### `deleteStudent`

Soft delete a student user.

**Access**: ROOT, ADMIN

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

### Degree Management Mutations

#### `addDegree`

Create a new degree.

**Access**: ROOT, ADMIN

```graphql
mutation AddDegree($name: String!) {
  addDegree(name: $name) {
    success
    message
    degree {
      id
      name
      createdAt
    }
    errors
    timestamp
  }
}
```

#### `updateDegree`

Update a degree.

**Access**: ROOT, ADMIN

```graphql
mutation UpdateDegree($id: ID!, $name: String) {
  updateDegree(id: $id, name: $name) {
    success
    message
    degree {
      id
      name
    }
    errors
    timestamp
  }
}
```

#### `deleteDegree`

Soft delete a degree.

**Access**: ROOT, ADMIN

```graphql
mutation DeleteDegree($id: ID!) {
  deleteDegree(id: $id) {
    success
    message
    degree {
      id
      name
    }
    errors
    timestamp
  }
}
```

### Course Management Mutations

#### `addCourse`

Create a new course.

**Access**: ROOT, ADMIN

```graphql
mutation AddCourse(
  $name: String!
  $description: String
  $daysOfWeek: [DaysOfWeek!]!
  $gender: Gender!
  $startAt: Date!
  $endAt: Date
  $startTime: Date!
  $endTime: Date!
  $teacherId: ID!
  $degreeIds: [ID!]!
) {
  addCourse(
    name: $name
    description: $description
    daysOfWeek: $daysOfWeek
    gender: $gender
    startAt: $startAt
    endAt: $endAt
    startTime: $startTime
    endTime: $endTime
    teacherId: $teacherId
    degreeIds: $degreeIds
  ) {
    success
    message
    course {
      id
      name
      description
      daysOfWeek
      gender
      startAt
      endAt
      startTime
      endTime
      teacher {
        id
        fullname
      }
      degrees {
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

#### `updateCourse`

Update a course.

**Access**: ROOT, ADMIN

```graphql
mutation UpdateCourse(
  $courseId: ID!
  $name: String
  $description: String
  $daysOfWeek: [DaysOfWeek!]
  $startTime: Date
  $endTime: Date
  $teacherId: ID
  $degreeIds: [ID!]
) {
  updateCourse(
    courseId: $courseId
    name: $name
    description: $description
    daysOfWeek: $daysOfWeek
    startTime: $startTime
    endTime: $endTime
    teacherId: $teacherId
    degreeIds: $degreeIds
  ) {
    success
    message
    course {
      id
      name
      description
      daysOfWeek
      gender
      startAt
      endAt
      startTime
      endTime
      teacher {
        id
        fullname
      }
      degrees {
        id
        name
      }
    }
    errors
    timestamp
  }
}
```

#### `deleteCourse`

Delete a course.

**Access**: ROOT, ADMIN

```graphql
mutation DeleteCourse($courseId: ID!) {
  deleteCourse(courseId: $courseId) {
    success
    message
    errors
    timestamp
  }
}
```

#### `addStudentToCourse`

Enroll a student in a course.

**Access**: ROOT, ADMIN

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

#### `removeStudentFromCourse`

Remove a student from a course.

**Access**: ROOT, ADMIN

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

### Attendance Mutations

#### `setAttendance`

Set attendance for a student in a course.

**Access**: ROOT, ADMIN, TEACHER

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
      course {
        id
        name
      }
      student {
        id
        fullname
      }
      createdAt
    }
    errors
    timestamp
  }
}
```

**Note**: When attendance is set for one student, the system automatically creates attendance records for all other enrolled students (marked as absent) if they don't have records for that date.

---

## Types & Schemas

### Core Types

#### User Types

```graphql
type UserData {
  id: ID!
  username: String!
  fullname: String!
  role: String!
  birthDate: Date
  phone: String
  tgUsername: String
  isActive: Boolean
  createdAt: Date!
}

type Root {
  id: ID!
  username: String!
  fullname: String!
  createdAt: Date!
}

type Admin {
  id: ID!
  username: String!
  fullname: String!
  birthDate: Date!
  phone: String!
  tgUsername: String!
  gender: Gender!
  isActive: Boolean!
  createdAt: Date!
}

type Teacher {
  id: ID!
  username: String!
  fullname: String!
  birthDate: Date!
  phone: String!
  tgUsername: String!
  gender: Gender!
  profilePicture: String
  isActive: Boolean!
  degrees: [Degree!]!
  createdAt: Date!
}

type Student {
  id: ID!
  username: String!
  fullname: String!
  birthDate: Date!
  phone: String
  tgUsername: String!
  gender: Gender!
  profilePicture: String
  isActive: Boolean!
  possibleDegrees: [Degree!]!
  createdAt: Date!
}
```

#### Course Types

```graphql
type Course {
  id: ID!
  name: String!
  description: String
  daysOfWeek: [DaysOfWeek!]!
  gender: Gender!
  startAt: Date!
  endAt: Date
  startTime: Date!
  endTime: Date!
  teacher: Teacher!
  degrees: [Degree!]!
  students: [CourseStudent!]!
  createdAt: Date!
}

type CourseStudent {
  id: ID!
  course: Course!
  student: Student!
  joinedAt: Date!
  monthlyPayment: Int!
  isActive: Boolean!
  createdAt: Date!
}
```

#### Degree Type

```graphql
type Degree {
  id: ID!
  name: String!
  teachers: [Teacher!]!
  courses: [Course!]!
  createdAt: Date!
}
```

#### Attendance Type

```graphql
type Attendance {
  id: ID!
  course: Course!
  student: Student!
  date: Date!
  isPresent: Boolean!
  notes: String
  createdAt: Date!
}
```

#### Dashboard Type

```graphql
type DashboardStats {
  totalStudents: Int!
  totalTeachers: Int!
  totalAdmins: Int!
  activeStudents: Int!
  activeTeachers: Int!
  activeAdmins: Int!
  totalUsers: Int!
  activeUsers: Int!
  averageStudentAge: Float
  averageTeacherAge: Float
  averageAdminAge: Float
  studentGenderDistribution: GenderDistribution!
  teacherGenderDistribution: GenderDistribution!
}

type GenderDistribution {
  male: Int!
  female: Int!
  child: Int!
}
```

### Enums

```graphql
enum Gender {
  MALE
  FEMALE
  CHILD
}

enum DaysOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}
```

### Custom Scalars

- **Date**: ISO date format `YYYY-MM-DD`
- **Phone**: Validated phone numbers (8-17 digits, international format)
- **Upload**: File uploads (handled via `graphql-upload` middleware)

---

## Error Handling

### Response Structure

All mutations return a consistent response structure:

```graphql
type MutationResponse {
  success: Boolean!
  message: String!
  errors: [String!]
  timestamp: String
}
```

### Error Types

1. **Authentication Errors**
   - Missing or invalid JWT token
   - Expired token
   - Invalid credentials

2. **Authorization Errors**
   - Insufficient permissions
   - Role-based restrictions
   - Gender-based restrictions

3. **Validation Errors**
   - Invalid input format
   - Missing required fields
   - Business rule violations

4. **Not Found Errors**
   - Resource doesn't exist
   - Invalid ID references

### Error Response Example

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "Username already exists",
    "Password must be at least 8 characters"
  ],
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### GraphQL Errors

GraphQL-level errors (syntax, schema violations) are returned in the standard GraphQL error format:

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

---

## Best Practices

### 1. Authentication

- Always include the JWT token in the `Authorization` header
- Handle token expiration gracefully
- Implement token refresh logic in your client

### 2. Error Handling

- Check both `success` field and `errors` array in mutation responses
- Handle GraphQL errors separately from mutation payload errors
- Display user-friendly error messages

### 3. File Uploads

- Use multipart requests for file uploads
- Validate file types and sizes on the client side
- Handle upload progress for better UX

### 4. Query Optimization

- Request only the fields you need
- Use fragments for reusable field sets
- Implement pagination for large datasets (when available)

### 5. Date Handling

- Always use ISO 8601 format for dates
- Normalize dates to UTC
- Handle timezone conversions on the client

### 6. Security

- Never expose JWT tokens in logs or URLs
- Use HTTPS in production
- Validate all user inputs on the client side

---

## Testing

### GraphQL Playground

Access GraphQL Playground at `http://localhost:4000/graphql` in development mode.

### Seed Scripts

```bash
# Seed root user
npm run seed:root

# Seed demo data
node scripts/seed-students.js
node scripts/seed-degrees-and-teachers.js
node scripts/seed-attendances.js
```

### Database Inspection

```bash
# Open Prisma Studio
npx prisma studio
```

---

## Additional Resources

- **Examples**: See `docs/EXAMPLES.md` for complete mutation and query examples
- **Permissions**: See `docs/PERMISSIONS_REFERENCE.md` for detailed permission rules
- **Frontend Guide**: See `docs/FRONTEND_GUIDE.md` for frontend integration
- **Schema Files**: Located in `src/graphql/schema/`
- **Resolvers**: Located in `src/graphql/resolvers/`
