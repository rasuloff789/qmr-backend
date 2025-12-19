# Teacher Attendance Guide (Set + Get)

This guide explains how a **TEACHER** role user should **get** and **set** attendance in the QMR Backend GraphQL API.

## Access rules (TEACHER role)

- **Set attendance (`setAttendance`)**
  - ✅ Allowed for **TEACHER** only on courses where `course.teacherId === me.id`
  - ❌ Not allowed for other courses (returns `success: false`, `message: "Unauthorized"`)
- **Get attendance (`getAttendances`)**
  - ✅ Allowed for any authenticated user (including TEACHER)
  - Best practice: always filter by `courseId` (your course), and optionally date range

## 1) Pick your `courseId` (teacher’s courses)

There is no dedicated “my courses” query; the usual approach is:

```graphql
query GetCoursesForTeacher {
  me {
    user {
      id
      role
    }
  }
  getCourses {
    id
    name
    teacher {
      id
      fullname
    }
    daysOfWeek
    startAt
    endAt
  }
}
```

Frontend: filter `getCourses` where `course.teacher.id === me.user.id`.

## 2) Get attendance for a course (recommended query)

### By course + date range

```graphql
query GetCourseAttendancesByDateRange(
  $courseId: ID!
  $startDate: Date!
  $endDate: Date!
) {
  getAttendances(courseId: $courseId, startDate: $startDate, endDate: $endDate) {
    id
    date
    isPresent
    notes
    student {
      id
      fullname
      username
    }
  }
}
```

Variables example:

```json
{ "courseId": "12", "startDate": "2025-12-01", "endDate": "2025-12-31" }
```

### By course + single date

```graphql
query GetCourseAttendancesForDay($courseId: ID!, $date: Date!) {
  getAttendances(courseId: $courseId, startDate: $date, endDate: $date) {
    id
    date
    isPresent
    notes
    student {
      id
      fullname
    }
  }
}
```

## 3) Set attendance (TEACHER)

### Mutation

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
    }
    errors
    timestamp
  }
}
```

Variables example:

```json
{
  "courseId": "12",
  "studentId": "34",
  "date": "2025-12-19",
  "isPresent": true,
  "notes": "Late by 10 minutes"
}
```

### Important behavior

- If the attendance record for `(courseId, studentId, date)` already exists, it is **updated**.
- After setting one student, the backend may **auto-create missing attendance records** for other enrolled students on that date (marked absent). This is reflected in the success `message`.

## Common TEACHER errors (what to show in UI)

- **Not your course**
  - `success: false`
  - `message: "Unauthorized"`
  - `errors`: `"You can only set attendance for courses you are assigned to teach"`
- **Wrong day of week**
  - `message: "Invalid attendance date"`
  - `errors`: includes course scheduled days
- **Student not enrolled / inactive enrollment**
  - `message: "Student not enrolled"`
  - `errors`: `"Student is not enrolled in this course or enrollment is inactive"`


