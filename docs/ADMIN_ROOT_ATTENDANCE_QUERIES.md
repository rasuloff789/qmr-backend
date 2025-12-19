# Get Attendance (Admin / Root Guide)

This guide is for **ADMIN** and **ROOT** users who need to **query attendance records** using the `getAttendances` GraphQL query (dashboards, reports, audit, exports).

## Access control

- **ROOT**: can query attendance across all courses/students.
- **ADMIN**: can query attendance, but it is **scoped by admin gender**:
  - **FEMALE admin**: can only see **FEMALE + CHILD** students’ attendance
  - **MALE admin**: can only see **MALE + CHILD** students’ attendance

> Note: The query is protected by authentication (JWT). If you call it without a token, you’ll get an auth error at the GraphQL layer.

## Query signature

```graphql
getAttendances(courseId: ID, studentId: ID, startDate: Date, endDate: Date): [Attendance!]!
```

All parameters are optional:

- `courseId`: filter attendances for a single course
- `studentId`: filter attendances for a single student
- `startDate`, `endDate`: filter by date range (inclusive)

## Recommended usage patterns

- **Dashboards / reports**: always use a **date range** (and often `courseId`) to avoid returning huge datasets.
- **Per-course journal**: use `courseId` + date range.
- **Per-student history**: use `studentId` + date range (optionally also `courseId`).

## Examples

### 1) Get attendance for a course in a date range

```graphql
query GetCourseAttendances($courseId: ID!, $startDate: Date!, $endDate: Date!) {
  getAttendances(courseId: $courseId, startDate: $startDate, endDate: $endDate) {
    id
    date
    isPresent
    notes
    createdAt
    course { id name }
    student { id fullname username }
  }
}
```

Variables:

```json
{ "courseId": "12", "startDate": "2025-12-01", "endDate": "2025-12-31" }
```

### 2) Get all attendance in a date range (system-wide report)

```graphql
query GetAttendanceReport($startDate: Date!, $endDate: Date!) {
  getAttendances(startDate: $startDate, endDate: $endDate) {
    id
    date
    isPresent
    course { id name }
    student { id fullname }
  }
}
```

Variables:

```json
{ "startDate": "2025-12-01", "endDate": "2025-12-31" }
```

### 3) Get one student’s attendance in one course

```graphql
query GetStudentCourseAttendance($courseId: ID!, $studentId: ID!, $startDate: Date!, $endDate: Date!) {
  getAttendances(courseId: $courseId, studentId: $studentId, startDate: $startDate, endDate: $endDate) {
    id
    date
    isPresent
    notes
  }
}
```

Variables:

```json
{ "courseId": "12", "studentId": "34", "startDate": "2025-12-01", "endDate": "2025-12-31" }
```

## Response shape (fields you can select)

`Attendance` supports:

- `id`
- `date`
- `isPresent`
- `notes`
- `createdAt`
- `course { ... }`
- `student { ... }`

## Notes / gotchas

- IDs are parsed with `parseInt()` in the resolver, so pass numeric IDs (often as strings like `"12"`).
- If you call `getAttendances` with **no filters**, it will return **everything** (can be slow on large DBs).


