# Attendance Queries Examples

This document provides example GraphQL queries for the `getAttendances` query.

## Prerequisites

1. **Seed the database with attendance data:**
   ```bash
   npm run seed:attendances
   ```

2. **Make sure you have:**
   - Courses created
   - Students enrolled in courses
   - Authentication token (JWT)

## GraphQL Query Examples

### 1. Get All Attendances

Get all attendance records in the system:

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

### 2. Get Attendances by Course

Get all attendance records for a specific course:

```graphql
query GetAttendancesByCourse {
  getAttendances(courseId: "1") {
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

### 3. Get Attendances by Student

Get all attendance records for a specific student:

```graphql
query GetAttendancesByStudent {
  getAttendances(studentId: "1") {
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

### 4. Get Attendances by Date Range

Get all attendance records within a date range:

```graphql
query GetAttendancesByDateRange {
  getAttendances(
    startDate: "2024-01-01"
    endDate: "2024-01-31"
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

### 5. Get Attendances for a Course in a Date Range

Combine course and date filters:

```graphql
query GetCourseAttendancesByDate {
  getAttendances(
    courseId: "1"
    startDate: "2024-01-01"
    endDate: "2024-01-31"
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

### 6. Get Attendances for a Student in a Course

Get attendance records for a specific student in a specific course:

```graphql
query GetStudentCourseAttendances {
  getAttendances(
    courseId: "1"
    studentId: "1"
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

### 7. Get Attendances with All Filters

Get attendance records with all filters applied:

```graphql
query GetFilteredAttendances {
  getAttendances(
    courseId: "1"
    studentId: "1"
    startDate: "2024-01-01"
    endDate: "2024-01-31"
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

### 8. Get Only Present Attendances

Filter for only present students (requires client-side filtering or you can filter in the query):

```graphql
query GetPresentAttendances {
  getAttendances(courseId: "1") {
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

Then filter `isPresent: true` on the client side.

### 9. Get Attendance Statistics (Client-side)

Get attendance data and calculate statistics:

```graphql
query GetAttendanceStats {
  getAttendances(courseId: "1") {
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

Then calculate:
- Total attendance records
- Present count
- Absent count
- Attendance percentage

## Using with cURL

### Example with Authentication

```bash
curl -X POST http://localhost:4000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "query { getAttendances(courseId: \"1\") { id date isPresent student { fullname } course { name } } }"
  }'
```

## Using with GraphQL Playground or Apollo Studio

1. Set the Authorization header:
   ```
   Authorization: Bearer YOUR_JWT_TOKEN
   ```

2. Use any of the queries above in the query panel

3. Click "Play" to execute

## Notes

- All filter parameters (`courseId`, `studentId`, `startDate`, `endDate`) are optional
- If no filters are provided, all attendance records are returned
- Results are ordered by date (descending) and createdAt (descending)
- You must be authenticated to use this query
- Date format should be ISO 8601 (e.g., "2024-01-15" or "2024-01-15T00:00:00Z")


