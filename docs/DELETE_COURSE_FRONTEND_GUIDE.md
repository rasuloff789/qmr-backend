# Delete Course (Frontend Guide)

Frontend guide for deleting a course using the QMR Backend GraphQL API.

## Important behavior (read this first)

The backend will **NOT** delete a course if it still has **any students enrolled**.

- The check is based on `CourseStudent.isDeleted = false`
- Meaning: even if an enrollment is `isActive = false`, the course is still considered to have students and **delete will fail**

If the course has enrollments, the mutation returns:

- `success: false`
- `message: "Cannot delete course with enrollments"`
- `errors: ["Course has N student enrollment(s). Please remove students from the course first."]`

## Recommended frontend flow

1. Fetch course students/enrollments (so you can show “you must remove students first”).
2. Remove students one by one using `removeStudentFromCourse(courseId, studentId)` until none remain.
3. Call `deleteCourse(courseId)`.

## GraphQL mutation

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

### Variables example

```json
{
  "courseId": "12"
}
```

## Example responses

### Success

```json
{
  "data": {
    "deleteCourse": {
      "success": true,
      "message": "Course deleted successfully",
      "errors": [],
      "timestamp": "2025-12-19T10:00:00.000Z"
    }
  }
}
```

### Failure: course still has students

```json
{
  "data": {
    "deleteCourse": {
      "success": false,
      "message": "Cannot delete course with enrollments",
      "errors": [
        "Course has 3 student enrollment(s). Please remove students from the course first."
      ],
      "timestamp": "2025-12-19T10:00:00.000Z"
    }
  }
}
```

## Notes

- IDs are parsed with `parseInt()` on the backend, so send numeric IDs (often as strings like `"12"`).
- When deletion is allowed, the backend deletes related records (enrollments, attendance, substitute teachers) and disconnects degrees before deleting the course.


