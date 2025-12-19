# Setting Attendance Guide

Complete guide to setting attendance records for students in courses.

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Basic Usage](#basic-usage)
4. [Workflow Examples](#workflow-examples)
5. [Frontend Implementation](#frontend-implementation)
6. [Error Handling](#error-handling)
7. [Best Practices](#best-practices)

---

## Overview

The `setAttendance` mutation allows authorized users to mark students as present or absent for a specific course on a specific date. The system automatically ensures all enrolled students have attendance records for that date.

### Key Features

- ✅ Mark students as present or absent
- ✅ Add optional notes
- ✅ Automatic record creation for other students
- ✅ Date and enrollment validation
- ✅ Authorization checks

### Access Control

- **ROOT**: Can set attendance for any course
- **TEACHER**: Can only set attendance for courses they are assigned to teach

---

## Prerequisites

Before setting attendance, ensure:

1. **Authentication**: You have a valid JWT token
2. **Course Exists**: The course ID is valid
3. **Student Enrolled**: The student is enrolled in the course
4. **Valid Date**: The date matches the course schedule

### Getting Course and Student Information

```graphql
query GetCourseWithStudents($courseId: ID!) {
  getCourse(id: $courseId) {
    id
    name
    daysOfWeek
    startAt
    endAt
    students {
      id
      isActive
      student {
        id
        fullname
        username
        isActive
      }
    }
  }
}
```

---

## Basic Usage

### Simple Attendance Marking

Mark a student as present:

```graphql
mutation SetAttendance(
  $courseId: ID!
  $studentId: ID!
  $date: Date!
  $isPresent: Boolean!
) {
  setAttendance(
    courseId: $courseId
    studentId: $studentId
    date: $date
    isPresent: $isPresent
  ) {
    success
    message
    attendance {
      id
      date
      isPresent
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
    timestamp
  }
}
```

**Variables:**
```json
{
  "courseId": "1",
  "studentId": "5",
  "date": "2024-01-15",
  "isPresent": true
}
```

### With Notes

Add notes when marking attendance:

```graphql
mutation SetAttendanceWithNotes(
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
    }
    errors
  }
}
```

**Variables:**
```json
{
  "courseId": "1",
  "studentId": "5",
  "date": "2024-01-15",
  "isPresent": false,
  "notes": "Absent - sick"
}
```

### Marking Absent

Mark a student as absent:

```graphql
mutation SetAbsentAttendance(
  $courseId: ID!
  $studentId: ID!
  $date: Date!
  $notes: String
) {
  setAttendance(
    courseId: $courseId
    studentId: $studentId
    date: $date
    isPresent: false
    notes: $notes
  ) {
    success
    message
    attendance {
      id
      date
      isPresent
      notes
    }
    errors
  }
}
```

---

## Workflow Examples

### Complete Workflow: Get Course → Set Attendance

#### Step 1: Get Course and Enrolled Students

```graphql
query GetCourseForAttendance($courseId: ID!) {
  getCourse(id: $courseId) {
    id
    name
    daysOfWeek
    startAt
    endAt
    students {
      id
      isActive
      student {
        id
        fullname
        username
        isActive
      }
    }
  }
}
```

#### Step 2: Filter Active Students (Client-side)

```javascript
const activeStudents = course.students
  .filter(enrollment => enrollment.isActive && enrollment.student.isActive)
  .map(enrollment => enrollment.student);
```

#### Step 3: Set Attendance for Each Student

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
      student {
        fullname
      }
      isPresent
    }
  }
}
```

### Batch Attendance Setting

While GraphQL doesn't support array mutations directly, you can call the mutation multiple times:

```javascript
async function setBatchAttendance(courseId, date, attendances) {
  const results = await Promise.all(
    attendances.map(attendance =>
      setAttendance({
        courseId,
        studentId: attendance.studentId,
        date,
        isPresent: attendance.isPresent,
        notes: attendance.notes
      })
    )
  );
  return results;
}
```

---

## Frontend Implementation

### React Example with Apollo Client

```javascript
import { useQuery, useMutation } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_COURSE = gql`
  query GetCourse($courseId: ID!) {
    getCourse(id: $courseId) {
      id
      name
      daysOfWeek
      students {
        id
        isActive
        student {
          id
          fullname
          username
          isActive
        }
      }
    }
  }
`;

const SET_ATTENDANCE = gql`
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
      }
      errors
    }
  }
`;

function AttendanceComponent({ courseId }) {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const { data, loading, error, refetch } = useQuery(GET_COURSE, {
    variables: { courseId },
  });

  const [setAttendance] = useMutation(SET_ATTENDANCE, {
    onCompleted: () => {
      refetch();
    },
  });

  const handleSetAttendance = async (studentId, isPresent, notes = null) => {
    try {
      const result = await setAttendance({
        variables: {
          courseId,
          studentId,
          date: selectedDate,
          isPresent,
          notes,
        },
      });

      if (result.data.setAttendance.success) {
        console.log('Success:', result.data.setAttendance.message);
        // Show success notification
      } else {
        console.error('Error:', result.data.setAttendance.errors);
        // Show error notification
      }
    } catch (err) {
      console.error('Error setting attendance:', err);
      // Show error notification
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  const activeStudents = data.getCourse.students
    .filter((enrollment) => enrollment.isActive && enrollment.student.isActive)
    .map((enrollment) => enrollment.student);

  return (
    <div>
      <h2>{data.getCourse.name}</h2>
      <input
        type="date"
        value={selectedDate}
        onChange={(e) => setSelectedDate(e.target.value)}
      />
      <h3>Enrolled Students ({activeStudents.length})</h3>
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
        {activeStudents.map((student) => (
            <tr key={student.id}>
              <td>{student.fullname} ({student.username})</td>
              <td>
            <button
              onClick={() =>
                    handleSetAttendance(student.id, true, null)
              }
            >
              Mark Present
            </button>
            <button
              onClick={() =>
                    handleSetAttendance(student.id, false, 'Absent')
              }
            >
              Mark Absent
            </button>
              </td>
            </tr>
        ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Vue.js Example

```vue
<template>
  <div>
    <h2>{{ course.name }}</h2>
    <input type="date" v-model="selectedDate" />
    <table>
      <thead>
        <tr>
          <th>Student</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="student in activeStudents" :key="student.id">
          <td>{{ student.fullname }}</td>
          <td>
            <button @click="setAttendance(student.id, true)">
              Present
            </button>
            <button @click="setAttendance(student.id, false)">
              Absent
            </button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { gql } from '@apollo/client/core';

export default {
  data() {
    return {
      course: null,
      selectedDate: new Date().toISOString().split('T')[0],
    };
  },
  computed: {
    activeStudents() {
      if (!this.course) return [];
      return this.course.students
        .filter((e) => e.isActive && e.student.isActive)
        .map((e) => e.student);
    },
  },
  methods: {
    async setAttendance(studentId, isPresent) {
      const mutation = gql`
        mutation SetAttendance(
          $courseId: ID!
          $studentId: ID!
          $date: Date!
          $isPresent: Boolean!
        ) {
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
      `;

      try {
        const result = await this.$apollo.mutate({
          mutation,
          variables: {
            courseId: this.courseId,
            studentId,
            date: this.selectedDate,
            isPresent,
          },
        });

        if (result.data.setAttendance.success) {
          this.$toast.success(result.data.setAttendance.message);
        }
      } catch (error) {
        this.$toast.error(error.message);
      }
    },
  },
};
</script>
```

---

## Error Handling

### Common Errors

#### Invalid Date

**Error:**
```json
{
  "success": false,
  "message": "Invalid attendance date",
  "errors": [
    "The attendance date (SUNDAY) does not match any of the course's scheduled days: MONDAY, WEDNESDAY, FRIDAY"
  ]
}
```

**Solution:** Ensure the date matches one of the course's `daysOfWeek`.

#### Student Not Enrolled

**Error:**
```json
{
  "success": false,
  "message": "Student not enrolled",
  "errors": [
    "Student is not enrolled in this course or enrollment is inactive"
  ]
}
```

**Solution:** Verify the student is enrolled and the enrollment is active.

#### Unauthorized

**Error:**
```json
{
  "success": false,
  "message": "Unauthorized",
  "errors": [
    "You can only set attendance for courses you are assigned to teach"
  ]
}
```

**Solution:** Ensure you have permission to set attendance for this course.

#### Date Outside Range

**Error:**
```json
{
  "success": false,
  "message": "Invalid attendance date",
  "errors": [
    "Attendance date is outside the course date range"
  ]
}
```

**Solution:** Ensure the date is within the course's `startAt` and `endAt` range.

### Error Handling Example

```javascript
async function setAttendanceWithErrorHandling(courseId, studentId, date, isPresent) {
  try {
    const result = await setAttendance({
      courseId,
      studentId,
      date,
      isPresent,
    });

    if (!result.data.setAttendance.success) {
      // Handle mutation-level errors
      result.data.setAttendance.errors.forEach(error => {
        console.error('Error:', error);
        // Show error to user
      });
      return;
    }

    // Success
    console.log('Success:', result.data.setAttendance.message);
  } catch (error) {
    // Handle GraphQL errors
    if (error.graphQLErrors) {
      error.graphQLErrors.forEach(err => {
        console.error('GraphQL Error:', err.message);
      });
    } else {
      console.error('Network Error:', error.message);
    }
  }
}
```

---

## Best Practices

### 1. Date Validation

- Always validate the date matches the course schedule before sending
- Check if the date is within the course date range
- Use the course's `daysOfWeek` to validate

```javascript
function isValidDateForCourse(date, course) {
  const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  return course.daysOfWeek.includes(dayOfWeek);
}
```

### 2. Batch Operations

- Set attendance for multiple students efficiently
- Use `Promise.all` for parallel requests
- Handle partial failures gracefully

### 3. User Feedback

- Show success messages when attendance is set
- Display auto-creation notifications
- Handle errors gracefully with user-friendly messages

### 4. Data Refresh

- Refetch course data after setting attendance
- Update UI to reflect new attendance records
- Show loading states during operations

### 5. Notes Usage

- Use notes for important information (e.g., "Sick", "Late", "Excused")
- Keep notes concise and relevant
- Consider note templates for common scenarios

### 6. Date Selection

- Default to today's date
- Allow date selection for past dates
- Validate date selection against course schedule

---

## Auto-Creation Feature

When you set attendance for one student, the system automatically creates attendance records for all other enrolled students (marked as absent) if they don't have records for that date.

**Response Example:**
```json
{
  "success": true,
  "message": "Attendance recorded successfully. Automatically created 4 missing attendance record(s) for other students (marked as absent).",
  "attendance": { ... }
}
```

This ensures complete attendance coverage without manual work.

---

## Related Documentation

- **Attendance Queries**: See `docs/ATTENDANCE_QUERIES.md`
- **Attendance Validation**: See `docs/ATTENDANCE_VALIDATION.md`
- **API Reference**: See `docs/GRAPHQL_API.md`

---

## Summary

Setting attendance is straightforward:

1. Get course and enrolled students
2. Select a date (must match course schedule)
3. Call `setAttendance` mutation for each student
4. Handle success/error responses
5. Refresh data to show updated attendance

The system automatically ensures all students have attendance records, making the process efficient and complete.
