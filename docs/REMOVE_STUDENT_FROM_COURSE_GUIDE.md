# Remove Student From Course (Frontend Guide)

Frontend guide for removing a student from a course enrollment using the QMR Backend GraphQL API.

## Overview

The `removeStudentFromCourse` mutation **soft-deletes** the enrollment record:

- Sets `CourseStudent.isDeleted = true`
- Sets `CourseStudent.isActive = false`

It does **not** return the enrollment record in the response—only status fields.

## Prerequisites

- A valid JWT token (send via `Authorization: Bearer <token>`)
- Valid `courseId` and `studentId`

**Important:** In the current backend implementation, `courseId` and `studentId` are parsed with `parseInt()`, so they must be numeric (usually sent as strings, e.g. `"12"`).

## GraphQL Mutation

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

### Variables example

```json
{
  "courseId": "12",
  "studentId": "34"
}
```

## Example: frontend `fetch`

```js
async function removeStudentFromCourse({ courseId, studentId, token }) {
  const query = `
    mutation RemoveStudentFromCourse($courseId: ID!, $studentId: ID!) {
      removeStudentFromCourse(courseId: $courseId, studentId: $studentId) {
        success
        message
        errors
        timestamp
      }
    }
  `;

  const res = await fetch("http://localhost:4000/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({
      query,
      variables: { courseId, studentId },
    }),
  });

  const json = await res.json();
  return json.data?.removeStudentFromCourse;
}
```

## Response examples

### Success

```json
{
  "data": {
    "removeStudentFromCourse": {
      "success": true,
      "message": "Student removed from course successfully",
      "errors": [],
      "timestamp": "2025-12-19T10:00:00.000Z"
    }
  }
}
```

### Common failure cases (resolver messages)

- **Validation failed**
  - Missing `courseId` or `studentId`
  - Non-numeric IDs (fails `parseInt`)
- **Course not found**
- **Student not found**
- **Enrollment not found**
  - Student is not enrolled in that course
- **Student already removed**
  - Enrollment exists but `isDeleted` is already true

In all failure cases you still get a GraphQL `data.removeStudentFromCourse` payload with `success: false` and a populated `errors` array.


