# Audit Actions List

This document lists all actions that are automatically logged in the audit system when performed by administrators.

**Note:** Only **mutations** (data-changing operations) are logged. Queries (read operations) are not logged.

---

## Student Actions

| GraphQL Mutation | Audit Action | Description |
|-----------------|--------------|-------------|
| `addStudent` | `create_student` | Create a new student |
| `updateStudent` | `update_student` | Update student information |
| `deleteStudent` | `delete_student` | Delete a student |

---

## Teacher Actions

| GraphQL Mutation | Audit Action | Description |
|-----------------|--------------|-------------|
| `addTeacher` | `create_teacher` | Create a new teacher |
| `updateTeacher` | `update_teacher` | Update teacher information |
| `deleteTeacher` | `delete_teacher` | Delete a teacher |

---

## Course Actions

| GraphQL Mutation | Audit Action | Description |
|-----------------|--------------|-------------|
| `addCourse` | `create_course` | Create a new course |
| `updateCourse` | `update_course` | Update course information |
| `deleteCourse` | `delete_course` | Delete a course |
| `addStudentToCourse` | `enroll_student` | Enroll a student in a course |
| `removeStudentFromCourse` | `unenroll_student` | Remove a student from a course |
| `setAttendance` | `set_attendance` | Set attendance for a student |

---

## Invoice Actions

| GraphQL Mutation | Audit Action | Description |
|-----------------|--------------|-------------|
| `generateInvoice` | `generate_invoice` | Generate a single invoice |
| `generateInvoicesForMonth` | `generate_invoices_bulk` | Generate invoices for a month (bulk) |
| `markInvoicePaid` | `mark_invoice_paid` | Mark an invoice as fully paid |
| `addPartialPayment` | `add_partial_payment` | Add a partial payment to an invoice |
| `recalculateInvoice` | `recalculate_invoice` | Recalculate an invoice |
| `deleteInvoice` | `delete_invoice` | Delete an invoice |
| `updateCoursePrice` | `update_course_price` | Update monthly price for all enrollments in a course |
| `updateEnrollmentPrice` | `update_enrollment_price` | Update monthly price for a specific enrollment |

---

## Degree Actions

| GraphQL Mutation | Audit Action | Description |
|-----------------|--------------|-------------|
| `addDegree` | `create_degree` | Create a new degree |
| `updateDegree` | `update_degree` | Update degree information |
| `deleteDegree` | `delete_degree` | Delete a degree |

---

## Other Actions

Any other mutation not listed above will be logged with the mutation name as the action (e.g., if a new mutation `updateAdmin` is added, it will be logged as `updateAdmin`).

---

## Audit Log Fields

Each audit log entry contains:

- **userId**: ID of the admin who performed the action
- **userRole**: Role of the user (always "admin" for logged actions)
- **username**: Username of the admin
- **fullname**: Full name of the admin
- **action**: The action performed (see table above)
- **resource**: Resource type (e.g., "student", "course", "invoice")
- **resourceId**: ID of the affected resource (if applicable)
- **level**: Log level ("info", "warning", "error", "security")
- **category**: Category of action ("data_modification", "data_access", "system", "security")
- **success**: Whether the action succeeded (true/false)
- **errorMessage**: Error message if action failed
- **details**: Additional details (operation type, parent type, arguments)
- **ipAddress**: IP address from which the action was performed
- **userAgent**: User agent string
- **createdAt**: Timestamp when the action was performed

---

## Filtering Audit Logs

When querying audit logs, you can filter by:

- `userId`: Filter by admin user ID
- `userRole`: Filter by user role (typically "admin")
- `action`: Filter by action name (e.g., "create_student", "update_course")
- `resource`: Filter by resource type (e.g., "student", "course", "invoice")
- `level`: Filter by log level ("info", "warning", "error", "security")
- `category`: Filter by category ("data_modification", "data_access", "system", "security")
- `success`: Filter by success status (true/false)
- `startDate`: Filter by start date
- `endDate`: Filter by end date
- `search`: Search in username or fullname

---

## Example GraphQL Query

```graphql
query GetAuditLogs {
  getAuditLogs(
    filter: {
      action: "create_student"
      startDate: "2024-01-01"
      success: true
    }
    sort: {
      field: "createdAt"
      direction: "desc"
    }
    page: 1
    pageSize: 50
  ) {
    logs {
      id
      userId
      username
      fullname
      action
      resource
      resourceId
      success
      errorMessage
      ipAddress
      createdAt
    }
    totalCount
    totalPages
  }
}
```

---

## Notes

1. **Only Admin Actions**: Only actions performed by administrators are logged. Root and teacher actions are not logged.

2. **Only Mutations**: Only mutations (data-changing operations) are logged. Queries are not logged.

3. **Automatic Logging**: All admin mutations are automatically logged. No manual logging is required.

4. **Root Access Only**: Only root users can view audit logs using the `getAuditLogs` query.

