# Attendance Queries Guide

Complete guide to querying attendance records with the `getAttendances` query.

## Table of Contents

1. [Overview](#overview)
2. [Basic Queries](#basic-queries)
3. [Filtered Queries](#filtered-queries)
4. [Advanced Queries](#advanced-queries)
5. [Response Structure](#response-structure)
6. [Usage Examples](#usage-examples)

---

## Overview

The `getAttendances` query allows you to retrieve attendance records with flexible filtering options. You can filter by course, student, date range, or any combination of these.

### Access Control

- **ROOT**: Can query all attendance records
- **ADMIN**: Can query all attendance records
- **TEACHER**: Can query all attendance records

### Query Signature

```graphql
getAttendances(
  courseId: ID
  studentId: ID
  startDate: Date
  endDate: Date
): [Attendance!]!
```

All parameters are optional. If no filters are provided, all attendance records are returned.

---

## Basic Queries

### Get All Attendances

Retrieve all attendance records in the system:

```graphql
query GetAllAttendances {
  getAttendances {
    id
    date
    isPresent
    notes
    createdAt
    course {
      id
      name
      description
    }
    student {
      id
      fullname
      username
      gender
    }
  }
}
```

### Get Attendances by Course

Filter attendance records by course:

```graphql
query GetAttendancesByCourse($courseId: ID!) {
  getAttendances(courseId: $courseId) {
    id
    date
    isPresent
    notes
    student {
      id
      fullname
      username
    }
    course {
      id
      name
    }
  }
}
```

**Variables:**
```json
{
  "courseId": "1"
}
```

### Get Attendances by Student

Filter attendance records by student:

```graphql
query GetAttendancesByStudent($studentId: ID!) {
  getAttendances(studentId: $studentId) {
    id
    date
    isPresent
    notes
    course {
      id
      name
      daysOfWeek
    }
    student {
      id
      fullname
    }
  }
}
```

**Variables:**
```json
{
  "studentId": "1"
}
```

### Get Attendances by Date Range

Filter attendance records by date range:

```graphql
query GetAttendancesByDateRange(
  $startDate: Date!
  $endDate: Date!
) {
  getAttendances(
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
    }
  }
}
```

**Variables:**
```json
{
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

---

## Filtered Queries

### Course and Date Range

Get attendance records for a specific course within a date range:

```graphql
query GetCourseAttendancesByDate(
  $courseId: ID!
  $startDate: Date!
  $endDate: Date!
) {
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
      username
    }
  }
}
```

**Variables:**
```json
{
  "courseId": "1",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

### Student and Course

Get attendance records for a specific student in a specific course:

```graphql
query GetStudentCourseAttendances(
  $courseId: ID!
  $studentId: ID!
) {
  getAttendances(
    courseId: $courseId
    studentId: $studentId
  ) {
    id
    date
    isPresent
    notes
    createdAt
    course {
      id
      name
    }
    student {
      id
      fullname
    }
  }
}
```

**Variables:**
```json
{
  "courseId": "1",
  "studentId": "1"
}
```

### All Filters Combined

Get attendance records with all filters applied:

```graphql
query GetFilteredAttendances(
  $courseId: ID!
  $studentId: ID!
  $startDate: Date!
  $endDate: Date!
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
    createdAt
    course {
      id
      name
      description
      daysOfWeek
      startAt
      endAt
    }
    student {
      id
      fullname
      username
      gender
      phone
      tgUsername
    }
  }
}
```

**Variables:**
```json
{
  "courseId": "1",
  "studentId": "1",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

---

## Advanced Queries

### Get Present Attendances Only

Filter for only present students (client-side filtering):

```graphql
query GetPresentAttendances($courseId: ID!) {
  getAttendances(courseId: $courseId) {
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

**Client-side filtering:**
```javascript
const presentAttendances = attendances.filter(a => a.isPresent === true);
```

### Get Absent Attendances Only

Filter for only absent students:

```graphql
query GetAbsentAttendances($courseId: ID!) {
  getAttendances(courseId: $courseId) {
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

**Client-side filtering:**
```javascript
const absentAttendances = attendances.filter(a => a.isPresent === false);
```

### Get Attendance Statistics

Calculate statistics from attendance data:

```graphql
query GetAttendanceStats($courseId: ID!, $startDate: Date!, $endDate: Date!) {
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

**Client-side calculations:**
```javascript
const stats = {
  total: attendances.length,
  present: attendances.filter(a => a.isPresent).length,
  absent: attendances.filter(a => !a.isPresent).length,
  percentage: (present / total) * 100
};
```

### Get Student Attendance Summary

Get attendance summary for a student across all courses:

```graphql
query GetStudentAttendanceSummary($studentId: ID!, $startDate: Date!, $endDate: Date!) {
  getAttendances(
    studentId: $studentId
    startDate: $startDate
    endDate: $endDate
  ) {
    id
    date
    isPresent
    course {
      id
      name
    }
  }
}
```

**Client-side grouping:**
```javascript
const byCourse = attendances.reduce((acc, a) => {
  const courseId = a.course.id;
  if (!acc[courseId]) {
    acc[courseId] = { course: a.course, records: [] };
  }
  acc[courseId].records.push(a);
  return acc;
}, {});
```

---

## Response Structure

### Attendance Type

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

### Example Response

```json
{
  "data": {
    "getAttendances": [
      {
        "id": "1",
        "date": "2024-01-15",
        "isPresent": true,
        "notes": null,
        "createdAt": "2024-01-15T10:30:00Z",
        "course": {
          "id": "1",
          "name": "Introduction to Computer Science"
        },
        "student": {
          "id": "1",
          "fullname": "John Doe",
          "username": "john.doe"
        }
      }
    ]
  }
}
```

---

## Usage Examples

### Using with cURL

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "query { getAttendances(courseId: \"1\") { id date isPresent student { fullname } course { name } } }"
  }'
```

### Using with GraphQL Playground

1. Set the Authorization header:
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   ```

2. Use any of the queries above in the query panel

3. Click "Play" to execute

### Using with Apollo Client (React)

```javascript
import { useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const GET_ATTENDANCES = gql`
  query GetAttendances($courseId: ID!, $startDate: Date!, $endDate: Date!) {
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
`;

function AttendanceList({ courseId }) {
  const { data, loading, error } = useQuery(GET_ATTENDANCES, {
    variables: {
      courseId,
      startDate: "2024-01-01",
      endDate: "2024-01-31"
    }
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

  return (
    <ul>
      {data.getAttendances.map(attendance => (
        <li key={attendance.id}>
          {attendance.student.fullname} - {attendance.date} - 
          {attendance.isPresent ? 'Present' : 'Absent'}
        </li>
      ))}
    </ul>
  );
}
```

### Using with Fetch API

```javascript
async function getAttendances(courseId, startDate, endDate) {
  const query = `
    query GetAttendances($courseId: ID!, $startDate: Date!, $endDate: Date!) {
      getAttendances(
        courseId: $courseId
        startDate: $startDate
        endDate: $endDate
      ) {
        id
        date
        isPresent
        student {
          fullname
        }
      }
    }
  `;

  const response = await fetch('http://localhost:4000/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      query,
      variables: { courseId, startDate, endDate }
    })
  });

  const result = await response.json();
  return result.data.getAttendances;
}
```

---

## Notes

### Date Format

- Use ISO 8601 format: `"YYYY-MM-DD"` (e.g., `"2024-01-15"`)
- Or full ISO datetime: `"2024-01-15T00:00:00Z"`

### Ordering

Results are ordered by:
1. Date (descending)
2. CreatedAt (descending)

### Performance

- All filter parameters are optional
- If no filters are provided, all attendance records are returned
- Consider pagination for large datasets (when available)
- Use specific filters to reduce response size

### Filtering Tips

1. **Use specific filters**: Narrow down results with courseId, studentId, or date range
2. **Combine filters**: Use multiple filters together for precise queries
3. **Client-side filtering**: For simple boolean filters (isPresent), filter on the client
4. **Date ranges**: Use date ranges to limit results to specific periods

---

## Related Documentation

- **Setting Attendance**: See `docs/SET_ATTENDANCE_GUIDE.md`
- **Attendance Validation**: See `docs/ATTENDANCE_VALIDATION.md`
- **API Reference**: See `docs/GRAPHQL_API.md`
