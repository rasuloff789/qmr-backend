# GraphQL Mutation Examples

This document contains example GraphQL mutations for testing the API.

## Authentication & Permissions

**Important:** The following mutations require authentication and specific roles:
- `addCourse` - Only available for **ROOT** and **ADMIN** users
- `updateCourse` - Only available for **ROOT** and **ADMIN** users
- `deleteCourse` - Only available for **ROOT** and **ADMIN** users
- `addStudentToCourse` - Only available for **ROOT** and **ADMIN** users

To use these mutations, you must:
1. First authenticate using the `login` mutation to get a JWT token
2. Include the token in the `Authorization` header: `Bearer <your-token>`

### Login Example

```graphql
mutation Login {
  login(username: "admin.username", password: "your-password") {
    token
    user {
      id
      username
      role
    }
  }
}
```

## Add Course Mutation

**⚠️ Requires ROOT or ADMIN role**

### Basic Example

```graphql
mutation AddCourse {
  addCourse(
    name: "Introduction to Computer Science"
    description: "A comprehensive course covering fundamental computer science concepts"
    daysOfWeek: [MONDAY, WEDNESDAY, FRIDAY]
    gender: MALE
    startAt: "2024-01-15T00:00:00Z"
    endAt: "2024-12-20T00:00:00Z"
    startTime: "2024-01-01T09:00:00Z"
    endTime: "2024-01-01T11:00:00Z"
    teacherId: "1"
    degreeIds: ["1", "2"]
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
        username
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

### Example with All Fields

```graphql
mutation AddCourseFull {
  addCourse(
    name: "Advanced Mathematics"
    description: "Advanced mathematical concepts including calculus, linear algebra, and statistics"
    daysOfWeek: [TUESDAY, THURSDAY]
    gender: FEMALE
    startAt: "2024-02-01T00:00:00Z"
    endAt: "2024-11-30T00:00:00Z"
    startTime: "2024-01-01T14:00:00Z"
    endTime: "2024-01-01T16:00:00Z"
    teacherId: "2"
    degreeIds: ["3", "4", "5"]
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
        username
        isActive
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

### Example for CHILD Gender Course

```graphql
mutation AddChildCourse {
  addCourse(
    name: "Kids Programming Basics"
    description: "Introduction to programming for children aged 8-12"
    daysOfWeek: [SATURDAY, SUNDAY]
    gender: CHILD
    startAt: "2024-03-01T00:00:00Z"
    endAt: "2024-12-31T00:00:00Z"
    startTime: "2024-01-01T10:00:00Z"
    endTime: "2024-01-01T12:00:00Z"
    teacherId: "3"
    degreeIds: ["1"]
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

## Update Course Mutation

**⚠️ Requires ROOT or ADMIN role**

### Basic Example - Update Name and Description

```graphql
mutation UpdateCourse {
  updateCourse(
    courseId: "1"
    name: "Advanced Computer Science"
    description: "Updated description for the course"
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

### Update Course Days of Week

```graphql
mutation UpdateCourseDays {
  updateCourse(
    courseId: "1"
    daysOfWeek: [TUESDAY, THURSDAY, SATURDAY]
  ) {
    success
    message
    course {
      id
      name
      daysOfWeek
    }
    errors
    timestamp
  }
}
```

### Update Course Teacher and Degrees

```graphql
mutation UpdateCourseTeacher {
  updateCourse(
    courseId: "1"
    teacherId: "2"
    degreeIds: ["3", "4"]
  ) {
    success
    message
    course {
      id
      name
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

### Update Multiple Fields

```graphql
mutation UpdateCourseMultiple {
  updateCourse(
    courseId: "1"
    name: "Introduction to Data Science"
    description: "Learn data science fundamentals"
    daysOfWeek: [MONDAY, WEDNESDAY]
    startAt: "2024-02-01T00:00:00Z"
    endAt: "2024-12-31T00:00:00Z"
    startTime: "2024-01-01T10:00:00Z"
    endTime: "2024-01-01T12:00:00Z"
  ) {
    success
    message
    course {
      id
      name
      description
      daysOfWeek
      startAt
      endAt
      startTime
      endTime
    }
    errors
    timestamp
  }
}
```

### Update Course Gender

```graphql
mutation UpdateCourseGender {
  updateCourse(
    courseId: "1"
    gender: FEMALE
  ) {
    success
    message
    course {
      id
      name
      gender
    }
    errors
    timestamp
  }
}
```

## Delete Course Mutation

**⚠️ Requires ROOT or ADMIN role**

### Basic Example

```graphql
mutation DeleteCourse {
  deleteCourse(courseId: "1") {
    success
    message
    errors
    timestamp
  }
}
```

### Example with Error Handling

```graphql
mutation DeleteCourseSafe {
  deleteCourse(courseId: "5") {
    success
    message
    errors
    timestamp
  }
}
```

## Add Student to Course Mutation

**⚠️ Requires ROOT or ADMIN role**

### Basic Example

```graphql
mutation AddStudentToCourse {
  addStudentToCourse(
    courseId: "1"
    studentId: "10"
    monthlyPayment: 500000
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
        username
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

## Notes

### Days of Week Options
- `MONDAY`
- `TUESDAY`
- `WEDNESDAY`
- `THURSDAY`
- `FRIDAY`
- `SATURDAY`
- `SUNDAY`

### Gender Options
- `MALE`
- `FEMALE`
- `CHILD`

### Date Format
- Use ISO 8601 format: `"2024-01-15T00:00:00Z"`
- Dates should be in UTC

### Time Format
- Use ISO 8601 format: `"2024-01-01T09:00:00Z"`
- Times should be in UTC
- The date part doesn't matter, only the time portion is used

### Getting Teacher and Degree IDs

Before creating a course, you may need to query for available teachers and degrees:

```graphql
query GetTeachers {
  getTeachers {
    id
    fullname
    username
    gender
    isActive
    degrees {
      id
      name
    }
  }
}

query GetDegrees {
  getDegrees {
    id
    name
  }
}
```

### Common Errors

1. **Unauthorized / Permission denied**: 
   - Make sure you're logged in with a ROOT or ADMIN account
   - Verify your JWT token is included in the Authorization header
   - Check that your user role is ROOT or ADMIN

2. **Teacher not found or inactive**: Make sure the `teacherId` exists and the teacher is active

3. **Gender mismatch**: The teacher's gender must match the course gender

4. **Degree not found**: Make sure all `degreeIds` exist

5. **Teacher doesn't have required degrees**: The teacher must have at least one of the degrees specified in `degreeIds`

6. **Course name already exists**: Course names must be unique

7. **No fields provided to update**: At least one field must be provided when updating a course

8. **Course not found**: Make sure the `courseId` exists

9. **Invalid course ID**: The course ID must be a valid number

### Update Course Specific Notes

- All fields in `updateCourse` are optional - you can update just the fields you want to change
- If updating `teacherId`, the teacher must:
  - Exist and be active
  - Have a gender matching the course gender (or the gender you're setting)
  - Have at least one degree matching the `degreeIds` (if `degreeIds` is also being updated)
- If updating `degreeIds`, all provided degree IDs must exist
- Course name must be unique (cannot match another existing course name)
- At least one field must be provided for the update to succeed

### Using Mutations in GraphQL Playground

When testing in GraphQL Playground, you need to:

1. **Login first** to get your token:
```graphql
mutation Login {
  login(username: "admin.username", password: "your-password") {
    token
  }
}
```

2. **Set the Authorization header** in the playground:
   - Click on "HTTP HEADERS" at the bottom of the playground
   - Add: `{ "Authorization": "Bearer YOUR_TOKEN_HERE" }`

3. **Then run your mutations** like `addCourse` or `deleteCourse`

